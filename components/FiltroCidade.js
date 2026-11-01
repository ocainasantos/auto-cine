import { criar, deTemplate } from "./dom.js";

export function FiltroCidade({ grupos = [], aoSelecionar = () => {} } = {}) {
    const raiz = deTemplate(`
        <div class="filtro-cidade">
            <button class="city-filter" type="button" id="filtro-cidade-botao"
                aria-expanded="false" aria-haspopup="listbox" aria-controls="filtro-cidade-lista">
                <span>Filtrar por Cidade</span>
                <svg class="caret" viewBox="0 0 18 10" aria-hidden="true">
                    <path d="M0 0h18L9 10z" fill="currentColor"></path>
                </svg>
            </button>
            <div class="filtro-cidade__painel" id="filtro-cidade-lista"
                role="listbox" aria-label="Filtrar por cidade" hidden></div>
        </div>`);

    const botao = raiz.querySelector(".city-filter");
    const painel = raiz.querySelector(".filtro-cidade__painel");

    function opcao(valor, texto) {
        const btn = criar("button", "filtro-cidade__opcao", texto);
        btn.type = "button";
        btn.setAttribute("role", "option");
        btn.setAttribute("aria-selected", String(valor === ""));
        btn.dataset.cidade = valor;
        return btn;
    }

    painel.append(opcao("", "Todas as cidades"));
    let estadoAtual = "";
    grupos.forEach(grupo => {
        if (grupo.estado !== estadoAtual) {
            estadoAtual = grupo.estado;
            painel.append(criar("div", "filtro-cidade__estado", estadoAtual));
        }
        painel.append(opcao(grupo.rotulo, grupo.rotulo.split(" - ")[0]));
    });

    function definirAberto(aberto) {
        painel.hidden = !aberto;
        botao.setAttribute("aria-expanded", String(aberto));
    }

    botao.addEventListener("click", () => definirAberto(painel.hidden));

    painel.addEventListener("click", e => {
        const escolhida = e.target.closest(".filtro-cidade__opcao");
        if (!escolhida) return;
        painel.querySelectorAll(".filtro-cidade__opcao").forEach(op =>
            op.setAttribute("aria-selected", String(op === escolhida))
        );
        definirAberto(false);
        aoSelecionar(escolhida.dataset.cidade);
    });

    document.addEventListener("click", e => {
        if (!painel.hidden && !raiz.contains(e.target)) definirAberto(false);
    });

    document.addEventListener("keydown", e => {
        if (e.key === "Escape" && !painel.hidden) { definirAberto(false); botao.focus(); }
    });

    return raiz;
}
