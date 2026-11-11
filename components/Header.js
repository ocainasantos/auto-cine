import { deTemplate } from "./dom.js";
import { FiltroCidade } from "./FiltroCidade.js";
import { SugestoesBusca } from "./SugestoesBusca.js";

// sugerir(termo) e aoEscolher(evento) ativam a lista de sugestões abaixo da busca.
export function Header({ logoHref = "#/", onBusca, sugerir, aoEscolher, filtro } = {}) {
    const header = deTemplate(`
        <header class="site-header">
            <div class="header-inner container">
                <a class="logo">ACine</a>
                <form class="search" role="search">
                    <svg class="search-icon" viewBox="0 0 25 25" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">
                        <circle cx="9" cy="9" r="7.75"></circle>
                        <line x1="14.6" y1="14.6" x2="23.7" y2="23.7"></line>
                    </svg>
                    <input class="search-input" type="search" aria-label="Buscar filmes" maxlength="50">
                </form>
                <nav class="main-nav" aria-label="Menu principal">
                    <a href="#/">Filmes</a>
                    <a href="#">Programação</a>
                </nav>
            </div>
        </header>`);

    header.querySelector(".logo").href = logoHref;
    header.querySelector(".search").addEventListener("submit", e => e.preventDefault());

    const input = header.querySelector(".search-input");
    if (onBusca) input.addEventListener("input", () => onBusca(input.value.trim()));
    if (sugerir && aoEscolher) header.querySelector(".search").append(SugestoesBusca({ input, sugerir, aoEscolher }));

    header.querySelector(".header-inner").append(filtro ?? FiltroCidade());
    return header;
}
