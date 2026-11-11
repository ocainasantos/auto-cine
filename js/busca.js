export function normalizar(str) {
    return String(str).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function ehSubsequencia(query, texto) {
    let i = 0;
    for (const ch of texto) {
        if (ch === query[i]) i++;
        if (i === query.length) return true;
    }
    return false;
}

function pontuar(filme, query) {
    const nome = normalizar(filme.nome);
    const todos = normalizar([filme.nome, filme.genero, filme.elenco, filme.direcao].join(" "));
    const palavras = query.split(/\s+/).filter(Boolean);

    if (nome === query) return 100;
    if (nome.includes(query)) return 90;
    if (todos.includes(query)) return 75;
    if (palavras.every(p => todos.includes(p))) return 60;
    const acertos = palavras.filter(p => todos.includes(p)).length;
    if (acertos > 0) return 40 * (acertos / palavras.length);
    if (query.length >= 2 && ehSubsequencia(query, nome)) return 20;
    return 0;
}

export function filtrar(filmes, cidade, termo) {
    const res = cidade ? filmes.filter(f => f.cidadeUf === cidade) : filmes;
    const query = normalizar(termo).trim().slice(0, 50);
    if (!query) return res;

    return res
        .map(f => ({ f, pts: pontuar(f, query) }))
        .filter(({ pts }) => pts > 0)
        .sort((a, b) => b.pts - a.pts)
        .map(({ f }) => f);
}
