import { criar, deTemplate } from "./dom.js";

const CAMPOS = [
    ["Classificação", "classificacao"],
    ["Gênero", "genero"],
    ["Duração", "duracao"],
    ["Data de Lançamento", "datalancamento"],
    ["Direção", "direcao"],
    ["Elenco", "elenco"],
];

export function FilmeDetalhe({ filme }) {
    const main = deTemplate(`
        <main class="filme-pagina">
            <div class="filme-container container">
                <h1 class="filme-titulo-hero"></h1>
                <div class="filme-body">
                    <div class="filme-coluna-esquerda">
                        <div class="filme-poster"><img></div>
                        <ul class="filme-detalhes"></ul>
                    </div>
                    <div class="filme-coluna-direita">
                        <p class="filme-sinopse-label">SINOPSE:</p>
                        <p class="filme-sinopse-texto"></p>
                    </div>
                </div>
                <hr class="filme-divider">
            </div>
        </main>`);

    main.querySelector(".filme-titulo-hero").textContent = filme.nome;
    main.querySelector(".filme-sinopse-texto").textContent = filme.sinopse;

    const img = main.querySelector(".filme-poster img");
    img.src = filme.imageurl;
    img.alt = filme.nome;

    main.querySelector(".filme-detalhes").append(...CAMPOS.map(([rotulo, chave]) => {
        const li = criar("li");
        li.append(criar("strong", "", `${rotulo}:`), ` ${filme[chave]}`);
        return li;
    }));

    return main;
}
