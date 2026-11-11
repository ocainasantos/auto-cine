import { criar, deTemplate } from "./dom.js";
import { moeda, dataIso } from "../js/dados.js";

const PLACA = /^[A-Z]{3}\d[A-Z0-9]\d{2}$/;

const ICONE_TICKET = `<svg class="modal__tipo-icone" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true">
    <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a3 3 0 0 0 0 6v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a3 3 0 0 0 0-6z"></path>
</svg>`;

const ICONE_SETA = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9"></polyline>
</svg>`;

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

function placaLimpa(valor) {
    return valor.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
}

const FOCAVEIS = "button:not([disabled]), input:not([disabled]), select, textarea, a[href], [tabindex]:not([tabindex='-1'])";

function MensagemErro(id) {
    const p = criar("p", "modal__erro");
    p.id = id;
    p.setAttribute("role", "alert");
    return p;
}

function Secao(titulo) {
    const secao = criar("section", "modal__secao");
    secao.append(criar("h3", "modal__subtitulo", titulo));
    return secao;
}

function preencherTipo(alvo, ingresso) {
    alvo.querySelector(".modal__tipo-nome").textContent = ingresso?.tipo ?? "Indisponível";
    alvo.querySelector(".modal__tipo-preco").textContent = ingresso ? moeda(ingresso.preco) : "";
}

// aoConfirmar({ horario, ingresso, nome, placa }) registra a compra e devolve { compra } ou { erro }.
export function ModalCompra({ filme, data, vendidos = new Map(), aoConfirmar, aoFechar = () => {} }) {
    const overlay = deTemplate(`
        <div class="modal">
            <div class="modal__caixa" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
                <button class="modal__fechar" type="button" aria-label="Fechar">×</button>
            </div>
        </div>`);
    const caixa = overlay.querySelector(".modal__caixa");
    const escolha = { horario: "", ingresso: filme.ingressos[0] ?? null };
    const restantes = horario => filme.vagas === null ? Infinity : filme.vagas - (vendidos.get(`${dataIso(data)} ${horario}`) || 0);

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
    secaoLocal.append(criar("p", "modal__texto", filme.local));

    const secaoHorarios = Secao("Horários Disponíveis:");
    if (filme.horarios.length) {
        const horarios = criar("div", "modal__horarios");
        horarios.append(...filme.horarios.map(horario => {
            const botao = criar("button", "modal__horario", horario);
            botao.type = "button";
            botao.setAttribute("aria-pressed", "false");
            if (restantes(horario) <= 0) {
                botao.disabled = true;
                botao.title = "Esgotado";
                botao.setAttribute("aria-label", `${horario} (esgotado)`);
            }
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
    const erroHorario = MensagemErro("modal-horario-erro");
    secaoHorarios.append(erroHorario);

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

    const campoNome = criar("div", "modal__campo");
    const labelNome = criar("label", "modal__rotulo", "Nome:");
    labelNome.htmlFor = "modal-nome";
    const nome = criar("input", "modal__nome");
    nome.id = "modal-nome";
    nome.maxLength = 100;
    nome.autocomplete = "name";
    nome.placeholder = "Seu nome";
    nome.setAttribute("aria-describedby", "modal-nome-erro");
    nome.addEventListener("input", () => limparErro());
    const erroNome = MensagemErro("modal-nome-erro");
    campoNome.append(labelNome, nome, erroNome);

    const campoPlaca = criar("div", "modal__campo");
    const label = criar("label", "modal__rotulo", "Placa do Carro:");
    label.htmlFor = "modal-placa";
    const placa = criar("input", "modal__placa");
    placa.id = "modal-placa";
    placa.maxLength = 7;
    placa.placeholder = "Ex.: ABC1D23";
    placa.autocomplete = "off";
    placa.setAttribute("aria-describedby", "modal-placa-ajuda modal-placa-erro");
    const ajuda = criar("p", "modal__ajuda", "Essa informação será usada como identificação na entrada do cinema");
    ajuda.id = "modal-placa-ajuda";
    placa.addEventListener("input", () => {
        placa.value = placaLimpa(placa.value);
        limparErro();
    });
    const erroPlaca = MensagemErro("modal-placa-erro");
    campoPlaca.append(label, placa, erroPlaca);
    const secaoIdentificacao = criar("section", "modal__secao modal__identificacao");
    secaoIdentificacao.append(campoNome, campoPlaca, ajuda);

    const nota = criar("p", "modal__nota", "Nota: As vagas do estacionamento onde você ficará serão decididos na hora, baseado no tipo do seu automóvel.");

    const erro = MensagemErro("modal-erro");
    const acoes = criar("div", "modal__acoes");
    const prosseguir = criar("button", "modal__prosseguir", "Prosseguir para o pagamento");
    prosseguir.type = "button";
    acoes.append(prosseguir);

    etapa.append(blocoFilme, criar("hr", "modal__divider"), secaoLocal, secaoHorarios, secaoTipos, secaoIdentificacao, nota, erro, acoes);
    caixa.append(etapa);

    function limparErro() {
        [erro, erroHorario, erroNome, erroPlaca].forEach(p => { p.textContent = ""; });
        nome.removeAttribute("aria-invalid");
        placa.removeAttribute("aria-invalid");
    }

    // Mostra a mensagem junto do que está errado e rola até lá (no celular o campo pode estar fora da tela).
    function mostrarErro(saida, mensagem, { campo, alvo = campo ?? saida } = {}) {
        saida.textContent = mensagem;
        alvo.scrollIntoView({ block: "center" });
        if (campo) {
            campo.setAttribute("aria-invalid", "true");
            campo.focus({ preventScroll: true });
        }
        return true;
    }

    function validar() {
        if (!filme.horarios.length || !escolha.ingresso) return mostrarErro(erro, "Este filme não tem ingressos disponíveis.");
        if (!escolha.horario) return mostrarErro(erroHorario, "Escolha um horário.", { alvo: secaoHorarios });
        if (restantes(escolha.horario) <= 0) return mostrarErro(erroHorario, "Este horário está esgotado.", { alvo: secaoHorarios });
        if (!nome.value.trim()) return mostrarErro(erroNome, "Informe o seu nome.", { campo: nome });
        if (!PLACA.test(placa.value)) return mostrarErro(erroPlaca, "Informe uma placa válida, ex.: ABC1D23.", { campo: placa });
        return false;
    }

    function Sucesso(compra) {
        const sucesso = criar("div", "modal__sucesso");
        const titulo = criar("h2", "modal__titulo modal__titulo--sucesso");
        titulo.id = "modal-titulo";
        const check = criar("span", "modal__check", "✓");
        check.setAttribute("aria-hidden", "true");
        titulo.append(check, "Compra confirmada!");
        const resumo = criar("dl", "modal__resumo");
        [
            ["Filme", filme.nome],
            ["Data", formatarData(data)],
            ["Horário", compra.horario],
            ["Local", filme.local],
            ["Ingresso", compra.ingresso],
            ["Nome", compra.nome],
            ["Placa", compra.placa],
            ["Total", moeda(compra.valor)],
        ].forEach(([rotulo, valor]) => resumo.append(criar("dt", "", rotulo), criar("dd", "", valor)));
        const concluirAcoes = criar("div", "modal__acoes");
        const concluir = criar("button", "modal__prosseguir", "Concluir");
        concluir.type = "button";
        concluir.addEventListener("click", () => fechar());
        concluirAcoes.append(concluir);
        sucesso.append(
            titulo,
            criar("p", "modal__texto", "Obrigado! Apresente a placa do carro na entrada do cinema."),
            resumo,
            criar("p", "modal__codigo", `Código: ${compra.codigo}`),
            concluirAcoes
        );
        return sucesso;
    }

    prosseguir.addEventListener("click", async () => {
        limparErro();
        if (validar()) return;
        prosseguir.disabled = true;
        try {
            const resultado = await aoConfirmar({
                horario: escolha.horario,
                ingresso: escolha.ingresso,
                nome: nome.value.trim(),
                placa: placa.value,
            });
            if (resultado.erro) {
                mostrarErro(erro, resultado.erro);
                return;
            }
            const sucesso = Sucesso(resultado.compra);
            etapa.replaceWith(sucesso);
            caixa.scrollTop = 0;
            sucesso.querySelector(".modal__prosseguir").focus();
        } catch (falha) {
            console.error(falha);
            mostrarErro(erro, "Não foi possível concluir a compra. Tente novamente.");
        } finally {
            prosseguir.disabled = false;
        }
    });

    // Tab circula só dentro do popup. A lista é recalculada porque a tela de sucesso troca o conteúdo.
    function prenderFoco(e) {
        const focaveis = [...caixa.querySelectorAll(FOCAVEIS)].filter(el => el.getClientRects().length);
        if (!focaveis.length) return;
        const primeiro = focaveis[0];
        const ultimo = focaveis[focaveis.length - 1];
        const dentro = caixa.contains(document.activeElement);
        if (e.shiftKey && (document.activeElement === primeiro || !dentro)) {
            e.preventDefault();
            ultimo.focus();
        } else if (!e.shiftKey && (document.activeElement === ultimo || !dentro)) {
            e.preventDefault();
            primeiro.focus();
        }
    }

    function aoTeclar(e) {
        if (e.key === "Tab") return prenderFoco(e);
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

    overlay.querySelector(".modal__fechar").addEventListener("click", () => fechar());
    overlay.addEventListener("click", e => { if (e.target === overlay) fechar(); });
    document.addEventListener("keydown", aoTeclar);
    document.body.classList.add("modal-aberto");

    return overlay;
}

export function abrirModalCompra({ filme, data, vendidos, aoConfirmar, origem }) {
    const modal = ModalCompra({ filme, data, vendidos, aoConfirmar, aoFechar: () => origem?.focus() });
    document.body.append(modal);
    modal.querySelector(".modal__fechar").focus();
    return modal;
}
