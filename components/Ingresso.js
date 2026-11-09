import { criar, deTemplate } from "./dom.js";

const MESES = ["Jan.", "Fev.", "Mar.", "Abr.", "Mai.", "Jun.", "Jul.", "Ago.", "Set.", "Out.", "Nov.", "Dez."];
const SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function BotaoData({ data, aoSelecionar }) {
    const botao = criar("button", "ingresso__data");
    botao.type = "button";
    botao.setAttribute("aria-pressed", "false");
    botao.setAttribute("aria-label", data.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }));
    botao.append(
        criar("span", "ingresso__mes", MESES[data.getMonth()]),
        criar("span", "ingresso__dia", String(data.getDate()).padStart(2, "0")),
        criar("span", "ingresso__semana", SEMANA[data.getDay()])
    );
    botao.addEventListener("click", () => aoSelecionar(botao));
    return botao;
}

export function Ingresso({ filme }) {
    const secao = deTemplate(`
        <section class="ingresso" aria-labelledby="ingresso-titulo">
            <h2 class="ingresso__titulo" id="ingresso-titulo">Compre já o Ingresso!</h2>
            <p class="ingresso__local"></p>
            <div class="ingresso__painel">
                <div class="ingresso__datas"></div>
                <span class="ingresso__separador" aria-hidden="true"></span>
                <button class="ingresso__continuar" type="button">Continuar Para O Pagamento</button>
            </div>
        </section>`);

    const local = `${filme.endereco}, ${filme.cidadeUf}`;
    secao.querySelector(".ingresso__local").textContent = `${filme.estacionamento} (${local})`;

    const datas = secao.querySelector(".ingresso__datas");
    if (!filme.sessoes.length) {
        datas.append(criar("p", "ingresso__vazio", "Nenhuma sessão disponível."));
        return secao;
    }

    function selecionar(botao) {
        datas.querySelectorAll(".ingresso__data").forEach(b => b.setAttribute("aria-pressed", String(b === botao)));
    }

    datas.append(...filme.sessoes.map(data => BotaoData({ data, aoSelecionar: selecionar })));
    selecionar(datas.firstElementChild);
    return secao;
}
