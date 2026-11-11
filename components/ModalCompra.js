import { criar, deTemplate } from "./dom.js";
import { notificar } from "./Notificacao.js";

const PLACA = /^[A-Z]{3}\d[A-Z0-9]\d{2}$/;
const ALFANUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

const ICONE_TICKET = `<svg class="modal__tipo-icone" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true">
    <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a3 3 0 0 0 0 6v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a3 3 0 0 0 0-6z"></path>
</svg>`;

const ICONE_SETA = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9"></polyline>
</svg>`;

const moeda = valor => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function formatarDuracao(duracao) {
    const m = /^(\d+)h(\d+)$/.exec(String(duracao));
    return m ? `${Number(m[1])}h${m[2]}m` : duracao;
}

function formatarData(data) {
    if (!data) return "";
    const semana = data.toLocaleDateString("pt-BR", { weekday: "long" }).split("-")[0];
    const diaMes = data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    return `${semana.charAt(0).toUpperCase()}${semana.slice(1)}, ${diaMes}`;
}

function gerarCodigo() {
    const bytes = crypto.getRandomValues(new Uint8Array(6));
    return "AC-" + Array.from(bytes, b => ALFANUM[b % ALFANUM.length]).join("");
}

function Secao(titulo) {
    const secao = criar("section", "modal__secao");
    secao.append(criar("h3", "modal__subtitulo", titulo));
    return secao;
}

function linhaInfo(rotulo, valor) {
    const li = criar("li");
    li.append(criar("strong", "", `${rotulo}:`), ` ${valor}`);
    return li;
}

function preencherTipo(alvo, ingresso) {
    alvo.querySelector(".modal__tipo-nome").textContent = ingresso?.tipo ?? "Indisponível";
    alvo.querySelector(".modal__tipo-preco").textContent = ingresso ? moeda(ingresso.preco) : "";
}

export function ModalCompra({ filme, data, aoFechar = () => {} }) {
    const overlay = deTemplate(`
        <div class="modal">
            <div class="modal__caixa" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
                <button class="modal__fechar" type="button" aria-label="Fechar">×</button>
            </div>
        </div>`);
    const caixa = overlay.querySelector(".modal__caixa");
    const local = `${filme.estacionamento} (${filme.endereco}, ${filme.cidade}, ${filme.uf})`;
    const escolha = { horario: "", ingresso: filme.ingressos[0] ?? null };

    const etapa = criar("div", "modal__etapa");
    etapa.append(criar("h2", "modal__titulo", "Detalhes do Ingresso"));
    etapa.firstElementChild.id = "modal-titulo";

    const blocoFilme = criar("div", "modal__filme");
    const poster = criar("img", "modal__poster");
    poster.src = filme.imageurl;
    poster.alt = `Pôster do filme ${filme.nome}`;
    const info = criar("ul", "modal__info");
    const liNome = criar("li");
    liNome.append(criar("strong", "", "Filme:"), ` ${filme.nome.toUpperCase()}`);
    info.append(
        liNome,
        criar("li", "", `Classificação: ${filme.classificacao};`),
        criar("li", "", `Gênero: ${filme.genero};`),
        criar("li", "", `Duração: ${formatarDuracao(filme.duracao)};`)
    );
    if (data) info.append(criar("li", "", `Data: ${formatarData(data)};`));
    blocoFilme.append(poster, info);

    const secaoLocal = Secao("Local do Evento:");
    secaoLocal.append(criar("p", "modal__texto", local));

    const secaoHorarios = Secao("Horários Disponíveis:");
    if (filme.horarios.length) {
        const horarios = criar("div", "modal__horarios");
        horarios.append(...filme.horarios.map(horario => {
            const botao = criar("button", "modal__horario", horario);
            botao.type = "button";
            botao.setAttribute("aria-pressed", "false");
            botao.addEventListener("click", () => {
                escolha.horario = horario;
                horarios.querySelectorAll(".modal__horario").forEach(b => b.setAttribute("aria-pressed", String(b === botao)));
                limparErro();
            });
            return botao;
        }));
        secaoHorarios.append(horarios);
    } else {
        secaoHorarios.append(criar("p", "modal__texto", "Nenhum horário disponível."));
    }

    const secaoTipos = Secao("Tipos de Ingresso:");
    const tipos = deTemplate(`
        <div class="modal__tipos">
            <div class="modal__tipo-atual">
                ${ICONE_TICKET}
                <span class="modal__tipo-texto">
                    <span class="modal__tipo-nome"></span>
                    <span class="modal__tipo-preco"></span>
                </span>
            </div>
            <button class="modal__tipo-toggle" type="button" aria-expanded="false" aria-controls="modal-tipo-lista" aria-label="Escolher tipo de ingresso">${ICONE_SETA}</button>
            <ul class="modal__tipo-lista" id="modal-tipo-lista" role="listbox" hidden></ul>
        </div>`);
    const atual = tipos.querySelector(".modal__tipo-atual");
    const toggle = tipos.querySelector(".modal__tipo-toggle");
    const lista = tipos.querySelector(".modal__tipo-lista");
    preencherTipo(atual, escolha.ingresso);

    function abrirLista(abrir) {
        lista.hidden = !abrir;
        toggle.setAttribute("aria-expanded", String(abrir));
    }

    lista.append(...filme.ingressos.map(ingresso => {
        const li = criar("li");
        const opcao = criar("button", "modal__tipo-opcao");
        opcao.type = "button";
        opcao.setAttribute("role", "option");
        opcao.setAttribute("aria-selected", String(ingresso === escolha.ingresso));
        opcao.append(criar("span", "modal__tipo-nome", ingresso.tipo), criar("span", "modal__tipo-preco", moeda(ingresso.preco)));
        opcao.addEventListener("click", () => {
            escolha.ingresso = ingresso;
            preencherTipo(atual, ingresso);
            lista.querySelectorAll(".modal__tipo-opcao").forEach(b => b.setAttribute("aria-selected", String(b === opcao)));
            abrirLista(false);
            toggle.focus();
        });
        li.append(opcao);
        return li;
    }));
    atual.addEventListener("click", () => abrirLista(lista.hidden));
    toggle.addEventListener("click", () => abrirLista(lista.hidden));
    secaoTipos.append(tipos);

    const secaoPlaca = criar("section", "modal__secao");
    const label = criar("label", "modal__subtitulo", "Placa do Carro:");
    label.htmlFor = "modal-placa";
    const placa = criar("input", "modal__placa");
    placa.id = "modal-placa";
    placa.maxLength = 7;
    placa.placeholder = "Ex.: ABC1D23";
    placa.autocomplete = "off";
    placa.setAttribute("aria-describedby", "modal-placa-ajuda");
    const ajuda = criar("p", "modal__ajuda", "Essa informação será usada como identificação na entrada do cinema");
    ajuda.id = "modal-placa-ajuda";
    const erro = criar("p", "modal__erro");
    erro.setAttribute("role", "alert");
    placa.addEventListener("input", () => {
        placa.value = placa.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
        limparErro();
    });
    secaoPlaca.append(label, ajuda, placa, erro);

    const nota = criar("p", "modal__nota", "Nota: As vagas do estacionamento onde você ficará serão decididos na hora, baseado no tipo do seu automóvel.");

    const acoes = criar("div", "modal__acoes");
    const prosseguir = criar("button", "modal__prosseguir", "Prosseguir para o pagamento");
    prosseguir.type = "button";
    acoes.append(prosseguir);

    etapa.append(blocoFilme, criar("hr", "modal__divider"), secaoLocal, secaoHorarios, secaoTipos, secaoPlaca, nota, acoes);
    caixa.append(etapa);

    function limparErro() {
        erro.textContent = "";
        placa.removeAttribute("aria-invalid");
    }

    function validar() {
        if (!filme.horarios.length || !escolha.ingresso) return "Este filme não tem ingressos disponíveis.";
        if (!escolha.horario) return "Escolha um horário.";
        if (!PLACA.test(placa.value)) {
            placa.setAttribute("aria-invalid", "true");
            placa.focus();
            return "Informe uma placa válida, ex.: ABC1D23.";
        }
        return "";
    }

    function Sucesso() {
        const sucesso = criar("div", "modal__sucesso");
        const titulo = criar("h2", "modal__titulo", "Compra confirmada!");
        titulo.id = "modal-titulo";
        const resumo = criar("dl", "modal__resumo");
        [
            ["Filme", filme.nome],
            ["Data", formatarData(data)],
            ["Horário", escolha.horario],
            ["Local", local],
            ["Ingresso", escolha.ingresso.tipo],
            ["Placa", placa.value],
            ["Total", moeda(escolha.ingresso.preco)],
        ].forEach(([rotulo, valor]) => resumo.append(criar("dt", "", rotulo), criar("dd", "", valor)));
        const concluirAcoes = criar("div", "modal__acoes");
        const concluir = criar("button", "modal__prosseguir", "Concluir");
        concluir.type = "button";
        concluir.addEventListener("click", () => {
            fechar();
            notificar("Compra realizada com sucesso!");
        });
        concluirAcoes.append(concluir);
        sucesso.append(
            titulo,
            criar("p", "modal__texto", "Obrigado! Apresente a placa do carro na entrada do cinema."),
            resumo,
            criar("p", "modal__codigo", `Código: ${gerarCodigo()}`),
            concluirAcoes
        );
        return sucesso;
    }

    prosseguir.addEventListener("click", () => {
        const mensagem = validar();
        if (mensagem) {
            erro.textContent = mensagem;
            return;
        }
        const sucesso = Sucesso();
        etapa.replaceWith(sucesso);
        caixa.scrollTop = 0;
        sucesso.querySelector(".modal__prosseguir").focus();
    });

    function aoTeclar(e) {
        if (e.key !== "Escape") return;
        if (!lista.hidden) {
            abrirLista(false);
            toggle.focus();
            return;
        }
        fechar();
    }

    function fechar() {
        document.removeEventListener("keydown", aoTeclar);
        document.body.classList.remove("modal-aberto");
        overlay.remove();
        aoFechar();
    }

    overlay.querySelector(".modal__fechar").addEventListener("click", fechar);
    overlay.addEventListener("click", e => { if (e.target === overlay) fechar(); });
    document.addEventListener("keydown", aoTeclar);
    document.body.classList.add("modal-aberto");

    return overlay;
}

export function abrirModalCompra({ filme, data, origem }) {
    const modal = ModalCompra({ filme, data, aoFechar: () => origem?.focus() });
    document.body.append(modal);
    modal.querySelector(".modal__fechar").focus();
    return modal;
}
