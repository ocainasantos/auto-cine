import { criar } from "./dom.js";
import { CardFilme } from "./CardFilme.js";
import { Aviso } from "./Aviso.js";

function SecaoCidade({ grupo }) {
    const secao = criar("section", "secao");
    secao.dataset.cidade = grupo.rotulo;

    const grade = criar("div", "secao__grade");
    grade.append(...grupo.filmes.map(filme => CardFilme({ filme })));

    secao.append(criar("h2", "secao__titulo", grupo.rotulo), grade);
    return secao;
}

export function Catalogo({ grupos }) {
    if (!grupos.length) return Aviso("Nenhum filme encontrado.");

    const main = criar("main", "catalogo");
    const inner = criar("div", "catalogo__inner container");
    inner.append(...grupos.map(grupo => SecaoCidade({ grupo })));
    main.append(inner);
    return main;
}
