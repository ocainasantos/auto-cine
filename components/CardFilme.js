import { criar } from "./dom.js";

export function CardFilme({ filme }) {
    const card = criar("article", "card-filme");
    card.style.cursor = "pointer";
    card.title = `${filme.nome} — ${filme.genero} — ${filme.classificacao}`;
    card.addEventListener("click", () => { window.location.hash = `#/filme/${filme.id}`; });

    const poster = criar("div", "card-filme__poster");
    if (filme.imageurl) {
        const img = criar("img");
        img.src = filme.imageurl;
        img.alt = `Pôster do filme ${filme.nome}`;
        img.loading = "lazy";
        poster.append(img);
    }

    const meta = criar("div", "card-filme__meta");
    meta.append(criar("span", "", filme.genero), criar("span", "", filme.duracao));

    const info = criar("div", "card-filme__info");
    info.append(criar("h3", "card-filme__nome", filme.nome), meta);

    card.append(poster, info);
    return card;
}
