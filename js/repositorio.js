// Sem backend: cada coleção junta o JSON de data/ (somente leitura) com o que foi
// cadastrado no navegador, guardado no localStorage.
const COM_ARQUIVO = new Set(["filmes", "fornecedores", "publicacoes"]);
const cache = new Map();

function chave(colecao) {
    return `autocine:${colecao}`;
}

function lerLocal(colecao) {
    try {
        const lista = JSON.parse(localStorage.getItem(chave(colecao)));
        return Array.isArray(lista) ? lista : [];
    } catch {
        return [];
    }
}

async function lerArquivo(colecao) {
    if (!COM_ARQUIVO.has(colecao)) return [];
    if (!cache.has(colecao)) {
        cache.set(colecao, fetch(`data/${colecao}.json`).then(res => {
            if (!res.ok) throw new Error(`Falha ao carregar ${colecao}: ${res.status}`);
            return res.json();
        }));
    }
    try {
        return await cache.get(colecao);
    } catch (erro) {
        cache.delete(colecao);
        throw erro;
    }
}

// Alterações ficam à parte ({ id: campos }) para valerem também sobre os registros do JSON.
function lerAlteracoes(colecao) {
    try {
        const mapa = JSON.parse(localStorage.getItem(`${chave(colecao)}:alteracoes`));
        return mapa && typeof mapa === "object" ? mapa : {};
    } catch {
        return {};
    }
}

export async function listar(colecao) {
    const alteracoes = lerAlteracoes(colecao);
    return [...await lerArquivo(colecao), ...lerLocal(colecao)]
        .map(item => (alteracoes[item.id] ? { ...item, ...alteracoes[item.id], id: item.id } : item));
}

export async function atualizar(colecao, id, mudancas) {
    const existe = (await listar(colecao)).some(item => Number(item.id) === Number(id));
    if (!existe) throw new Error("Registro não encontrado.");
    const alteracoes = lerAlteracoes(colecao);
    alteracoes[id] = { ...alteracoes[id], ...mudancas };
    localStorage.setItem(`${chave(colecao)}:alteracoes`, JSON.stringify(alteracoes));
}

export async function adicionar(colecao, registro) {
    const todos = await listar(colecao);
    const id = todos.reduce((maior, item) => Math.max(maior, Number(item.id) || 0), 0) + 1;
    const novo = { id, ...registro };
    const locais = lerLocal(colecao);
    locais.push(novo);
    localStorage.setItem(chave(colecao), JSON.stringify(locais));
    return novo;
}
