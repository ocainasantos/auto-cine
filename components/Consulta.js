import { criar } from "./dom.js";
import { normalizar } from "../js/busca.js";

let contador = 0;

// colunas: [[rótulo, linha => texto]]. No mobile cada linha vira um cartão (rótulo vem de data-rotulo).
export function Consulta({ colunas, linhas, rotuloBusca, vazio }) {
    const id = `consulta-busca-${++contador}`;
    const raiz = criar("div", "consulta");

    const busca = criar("div", "consulta__busca");
    const label = criar("label", "campo__rotulo", rotuloBusca);
    label.htmlFor = id;
    const input = criar("input", "campo__controle");
    input.id = id;
    input.type = "search";
    input.maxLength = 50;
    busca.append(label, input);

    const total = criar("p", "consulta__total");
    total.setAttribute("aria-live", "polite");

    const wrapper = criar("div", "tabela-wrapper");
    const tabela = criar("table", "tabela");
    const thead = criar("thead");
    const cabecalho = criar("tr");
    cabecalho.append(...colunas.map(([rotulo]) => {
        const th = criar("th", "", rotulo);
        th.scope = "col";
        return th;
    }));
    thead.append(cabecalho);
    const tbody = criar("tbody");
    tabela.append(thead, tbody);
    wrapper.append(tabela);

    const textos = linhas.map(linha => colunas.map(([, valor]) => String(valor(linha) ?? "")));
    const indice = textos.map(celulas => normalizar(celulas.join(" ")));

    function renderizar() {
        const termo = normalizar(input.value).trim();
        const visiveis = textos.filter((_, i) => !termo || indice[i].includes(termo));
        tbody.replaceChildren(...visiveis.map(celulas => {
            const tr = criar("tr");
            tr.append(...celulas.map((texto, i) => {
                const td = criar("td", "", texto);
                td.dataset.rotulo = colunas[i][0];
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

    input.addEventListener("input", renderizar);
    renderizar();
    raiz.append(busca, total, wrapper);
    return raiz;
}
