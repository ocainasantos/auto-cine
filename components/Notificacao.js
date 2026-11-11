import { criar } from "./dom.js";

const DURACAO = 4000;

export function notificar(texto) {
    document.querySelector(".notificacao")?.remove();

    const aviso = criar("div", "notificacao");
    aviso.setAttribute("role", "status");
    aviso.append(criar("span", "notificacao__icone", "✓"), criar("span", "notificacao__texto", texto));
    document.body.append(aviso);

    aviso.getBoundingClientRect(); // força o layout para a transição de entrada rodar
    aviso.classList.add("notificacao--visivel");
    setTimeout(() => {
        aviso.classList.remove("notificacao--visivel");
        aviso.addEventListener("transitionend", () => aviso.remove(), { once: true });
    }, DURACAO);
}
