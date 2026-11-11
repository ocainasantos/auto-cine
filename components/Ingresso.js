import { criar, deTemplate } from "./dom.js";
import { abrirModalCompra } from "./ModalCompra.js";

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
    const continuar = secao.querySelector(".ingresso__continuar");
    if (!filme.sessoes.length) {
        datas.append(criar("p", "ingresso__vazio", "Nenhuma sessão disponível."));
        continuar.disabled = true;
        return secao;
    }

    const botoes = new Map();
    let selecionada = null;

    function selecionar(botao) {
        selecionada = botoes.get(botao);
        datas.querySelectorAll(".ingresso__data").forEach(b => b.setAttribute("aria-pressed", String(b === botao)));
    }

    filme.sessoes.forEach(data => {
        const botao = BotaoData({ data, aoSelecionar: selecionar });
        botoes.set(botao, data);
        datas.append(botao);
    });
    selecionar(datas.firstElementChild);

    continuar.addEventListener("click", () => abrirModalCompra({ filme, data: selecionada, origem: continuar }));
    return secao;
}
