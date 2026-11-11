import { criar } from "./dom.js";

const MAX = 6;

// Lista de sugestões ligada ao campo de busca (padrão ARIA combobox).
// sugerir(termo) devolve os eventos correspondentes; aoEscolher(evento) é chamado no clique ou Enter.
export function SugestoesBusca({ input, sugerir, aoEscolher }) {
    const lista = criar("ul", "sugestoes");
    lista.id = "busca-sugestoes";
    lista.setAttribute("role", "listbox");
    lista.setAttribute("aria-label", "Sugestões de filmes");
    lista.hidden = true;

    input.setAttribute("role", "combobox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-expanded", "false");
    input.setAttribute("aria-controls", lista.id);

    let itens = [];
    let ativo = -1;

    function definirAtivo(indice) {
        ativo = indice;
        lista.querySelectorAll(".sugestoes__item").forEach((item, i) => item.setAttribute("aria-selected", String(i === indice)));
        if (indice >= 0) {
            input.setAttribute("aria-activedescendant", `busca-sugestao-${indice}`);
            lista.children[indice].scrollIntoView({ block: "nearest" });
        } else {
            input.removeAttribute("aria-activedescendant");
        }
    }

    function fechar() {
        lista.hidden = true;
        input.setAttribute("aria-expanded", "false");
        definirAtivo(-1);
    }

    function escolher(indice) {
        const evento = itens[indice];
        input.value = "";
        itens = [];
        lista.replaceChildren();
        fechar();
        aoEscolher(evento);
    }

    function Item(evento, indice) {
        const item = criar("li", "sugestoes__item");
        item.id = `busca-sugestao-${indice}`;
        item.setAttribute("role", "option");
        item.setAttribute("aria-selected", "false");

        const poster = criar("img", "sugestoes__poster");
        poster.src = evento.imageurl;
        poster.alt = "";
        poster.loading = "lazy";

        const texto = criar("span", "sugestoes__texto");
        texto.append(
            criar("span", "sugestoes__nome", evento.nome),
            criar("span", "sugestoes__meta", `${evento.genero} · ${evento.cidadeUf}`)
        );

        item.append(poster, texto);
        item.addEventListener("mousedown", e => e.preventDefault());
        item.addEventListener("click", () => escolher(indice));
        item.addEventListener("mousemove", () => { if (ativo !== indice) definirAtivo(indice); });
        return item;
    }

    function renderizar() {
        const termo = input.value.trim();
        ativo = -1;
        input.removeAttribute("aria-activedescendant");
        if (!termo) {
            itens = [];
            lista.replaceChildren();
            fechar();
            return;
        }
        itens = sugerir(termo).slice(0, MAX);
        if (itens.length) {
            lista.replaceChildren(...itens.map(Item));
        } else {
            const vazio = criar("li", "sugestoes__vazio", "Nenhum filme encontrado");
            vazio.setAttribute("role", "option");
            vazio.setAttribute("aria-disabled", "true");
            lista.replaceChildren(vazio);
        }
        lista.hidden = false;
        input.setAttribute("aria-expanded", "true");
    }

    input.addEventListener("input", renderizar);
    input.addEventListener("focus", () => { if (input.value.trim()) renderizar(); });

    input.addEventListener("keydown", e => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            if (lista.hidden && input.value.trim()) renderizar();
            if (!itens.length) return;
            e.preventDefault();
            const total = itens.length;
            definirAtivo(e.key === "ArrowDown" ? (ativo + 1) % total : (ativo <= 0 ? total - 1 : ativo - 1));
        } else if (e.key === "Enter") {
            if (!lista.hidden && ativo >= 0) {
                e.preventDefault();
                escolher(ativo);
            } else {
                fechar();
            }
        } else if (e.key === "Escape" && !lista.hidden) {
            e.preventDefault();
            e.stopPropagation();
            fechar();
        }
    });

    document.addEventListener("click", e => {
        if (!lista.hidden && !input.closest(".search").contains(e.target)) fechar();
    });

    return lista;
}
