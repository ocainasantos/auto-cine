import { criar, deTemplate } from "./dom.js";

const INTERVALO = 5000;

export function Carrossel({ filmes }) {
    const raiz = deTemplate(`
        <section class="carrossel-wrapper container">
            <div class="carrossel">
                <div class="carrossel__slides"></div>
                <div class="carrossel__controls">
                    <div class="carrossel__dots"></div>
                    <div class="carrossel__nav">
                        <button type="button" aria-label="Anterior">&lt;</button>
                        <button type="button" aria-label="Próximo">&gt;</button>
                    </div>
                </div>
            </div>
        </section>`);

    const slidesEl = raiz.querySelector(".carrossel__slides");
    const dotsEl = raiz.querySelector(".carrossel__dots");
    const [prevBtn, nextBtn] = raiz.querySelectorAll(".carrossel__nav button");

    const slides = filmes.map(filme => {
        const slide = criar("div", "carrossel__slide");
        const tela = criar("div", "carrossel__tela");
        tela.style.backgroundImage = `url("${filme.banner || filme.imageurl || ""}")`;

        const info = criar("div", "carrossel__info");
        info.append(
            criar("span", "carrossel__nome", filme.nome),
            criar("span", "carrossel__meta", `${filme.genero} · ${filme.duracao}`)
        );

        slide.append(tela, info);
        return slide;
    });

    const dots = filmes.map((_, idx) => {
        const dot = criar("div", "carrossel__dot");
        dot.addEventListener("click", () => { irPara(idx); reiniciar(); });
        return dot;
    });

    slidesEl.append(...slides);
    dotsEl.append(...dots);

    let atual = 0;
    let timer;

    function irPara(idx) {
        if (!slides.length) return;
        slides[atual].classList.remove("active");
        dots[atual].classList.remove("active");
        atual = (idx + slides.length) % slides.length;
        slides[atual].classList.add("active");
        dots[atual].classList.add("active");
    }

    function reiniciar() {
        clearInterval(timer);
        timer = setInterval(() => { if (raiz.isConnected) irPara(atual + 1); }, INTERVALO);
    }

    prevBtn.addEventListener("click", () => { irPara(atual - 1); reiniciar(); });
    nextBtn.addEventListener("click", () => { irPara(atual + 1); reiniciar(); });

    irPara(0);
    reiniciar();
    return raiz;
}
