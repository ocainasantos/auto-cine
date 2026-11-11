import { criar } from "./dom.js";
import { normalizar } from "../js/busca.js";

let contador = 0;

// colunas: [[rótulo, linha => texto | Node, opções?]]. opções.classe vai no <td>;
// opções.busca = false tira a coluna da busca. No mobile cada linha vira um cartão (rótulo vem de data-rotulo).
export function Consulta({ colunas, linhas, rotuloBusca, vazio, termoInicial = "", aoBuscar = () => {} }) {
    const id = `consulta-busca-${++contador}`;
    const raiz = criar("div", "consulta");

    const busca = criar("div", "consulta__busca");
    const label = criar("label", "campo__rotulo", rotuloBusca);
    label.htmlFor = id;
    const input = criar("input", "campo__controle");
    input.id = id;
    input.type = "search";
    input.maxLength = 50;
    input.value = termoInicial;
    busca.append(label, input);

    const total = criar("p", "consulta__total");
    total.setAttribute("aria-live", "polite");

    const wrapper = criar("div", "tabela-wrapper");
    const tabela = criar("table", "tabela");
    const thead = criar("thead");
    const cabecalho = criar("tr");
    cabecalho.append(...colunas.map(([rotulo, , opcoes = {}]) => {
        const th = criar("th", opcoes.classe || "", rotulo);
        th.scope = "col";
        return th;
    }));
    thead.append(cabecalho);
    const tbody = criar("tbody");
    tabela.append(thead, tbody);
    wrapper.append(tabela);

    const textoDe = valor => (valor instanceof Node ? valor.textContent : String(valor ?? ""));
    const indice = linhas.map(linha => normalizar(colunas
        .filter(([, , opcoes = {}]) => opcoes.busca !== false)
        .map(([, valor]) => textoDe(valor(linha)))
        .join(" ")));

    function renderizar() {
        const termo = normalizar(input.value).trim();
        const visiveis = linhas.filter((_, i) => !termo || indice[i].includes(termo));
        tbody.replaceChildren(...visiveis.map(linha => {
            const tr = criar("tr");
            tr.append(...colunas.map(([rotulo, valor, opcoes = {}]) => {
                const conteudo = valor(linha);
                const td = criar("td", opcoes.classe || "");
                if (conteudo instanceof Node) td.append(conteudo);
                else td.textContent = String(conteudo ?? "");
                td.dataset.rotulo = rotulo;
                return td;
            }));
            return tr;
        }));
        if (!visiveis.length) {
            const tr = criar("tr", "tabela__vazia");
            const td = criar("td", "", linhas.length ? "Nenhum resultado para a busca." : vazio);
            td.colSpan = colunas.length;
            tr.append(td);
            tbody.append(tr);
        }
        total.textContent = `${visiveis.length} de ${linhas.length} registro(s)`;
    }

    input.addEventListener("input", () => {
        aoBuscar(input.value);
        renderizar();
    });
    renderizar();
    raiz.append(busca, total, wrapper);
    return raiz;
}
