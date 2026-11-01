import { criar } from "./dom.js";

export function Aviso(texto) {
    const main = criar("main", "catalogo");
    const inner = criar("div", "catalogo__inner container");
    inner.append(criar("p", "catalogo__aviso", texto));
    main.append(inner);
    return main;
}
