import { criar } from "../dom.js";

let contador = 0;
let fecharAberto = null;

// acoes: [{ texto, aoEscolher }]. A lista usa position: fixed para não ser cortada pela tabela.
export function MenuAcoes({ rotulo, acoes }) {
    const id = `menu-acoes-${++contador}`;
    const raiz = criar("div", "menu-acoes");

    const botao = criar("button", "menu-acoes__botao", "⋮");
    botao.type = "button";
    botao.setAttribute("aria-label", rotulo);
    botao.setAttribute("aria-haspopup", "menu");
    botao.setAttribute("aria-expanded", "false");
    botao.setAttribute("aria-controls", id);

    const lista = criar("ul", "menu-acoes__lista");
    lista.id = id;
    lista.setAttribute("role", "menu");
    lista.setAttribute("aria-label", rotulo);
    lista.hidden = true;

    const itens = acoes.map(({ texto, aoEscolher }) => {
        const li = criar("li");
        li.setAttribute("role", "none");
        const item = criar("button", "menu-acoes__item", texto);
        item.type = "button";
        item.setAttribute("role", "menuitem");
        item.tabIndex = -1;
        item.addEventListener("click", () => {
            fechar(false);
            aoEscolher();
        });
        li.append(item);
        lista.append(li);
        return item;
    });

    function posicionar() {
        const area = botao.getBoundingClientRect();
        const largura = lista.offsetWidth;
        const altura = lista.offsetHeight;
        const esquerda = Math.min(Math.max(8, area.right - largura), window.innerWidth - largura - 8);
        const abaixo = area.bottom + 4;
        const topo = abaixo + altura > window.innerHeight - 8 ? Math.max(8, area.top - altura - 4) : abaixo;
        lista.style.left = `${esquerda}px`;
        lista.style.top = `${topo}px`;
    }

    function aoClicarFora(e) {
        if (!raiz.contains(e.target)) fechar(false);
    }

    function aoTeclar(e) {
        const atual = itens.indexOf(document.activeElement);
        if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            fechar(true);
        } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            const passo = e.key === "ArrowDown" ? 1 : -1;
            itens[(atual + passo + itens.length) % itens.length].focus();
        } else if (e.key === "Home" || e.key === "End") {
            e.preventDefault();
            itens[e.key === "Home" ? 0 : itens.length - 1].focus();
        } else if (e.key === "Tab") {
            fechar(false);
        }
    }

    function aoRolar() {
        fechar(false);
    }

    function abrir() {
        fecharAberto?.(false);
        lista.hidden = false;
        botao.setAttribute("aria-expanded", "true");
        posicionar();
        itens[0]?.focus();
        document.addEventListener("click", aoClicarFora, true);
        lista.addEventListener("keydown", aoTeclar);
        window.addEventListener("scroll", aoRolar, true);
        window.addEventListener("resize", aoRolar);
        fecharAberto = fechar;
    }

    function fechar(devolverFoco) {
        if (lista.hidden) return;
        lista.hidden = true;
        botao.setAttribute("aria-expanded", "false");
        document.removeEventListener("click", aoClicarFora, true);
        lista.removeEventListener("keydown", aoTeclar);
        window.removeEventListener("scroll", aoRolar, true);
        window.removeEventListener("resize", aoRolar);
        if (fecharAberto === fechar) fecharAberto = null;
        if (devolverFoco) botao.focus();
    }

    botao.addEventListener("click", () => (lista.hidden ? abrir() : fechar(true)));
    botao.addEventListener("keydown", e => {
        if (e.key === "ArrowDown" && lista.hidden) {
            e.preventDefault();
            abrir();
        }
    });

    raiz.append(botao, lista);
    return raiz;
}
