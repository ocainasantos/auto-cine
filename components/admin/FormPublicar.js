import { criar } from "../dom.js";
import { Campo, Formulario } from "../Formulario.js";
import { AdminPagina } from "./AdminLayout.js";
import { HORARIO, lerData, dataIso, dataCurta } from "../../js/dados.js";

const MAX_DIAS = 31;
const ANOS_A_FRENTE = 5;

function CampoHorarios(horarios) {
    const raiz = criar("div", "campo campo--largo");
    const label = criar("label", "campo__rotulo", "Horários de exibição");
    label.htmlFor = "pu-horario";
    const ajuda = criar("p", "campo__ajuda", "Adicione um ou mais horários. Valem para todas as datas.");
    ajuda.id = "pu-horario-ajuda";

    const linha = criar("div", "horarios-campo");
    const input = criar("input", "campo__controle");
    input.id = "pu-horario";
    input.type = "time";
    input.setAttribute("aria-describedby", "pu-horario-ajuda pu-horario-erro");
    const adicionar = criar("button", "botao botao--secundario", "Adicionar");
    adicionar.type = "button";
    linha.append(input, adicionar);

    const lista = criar("ul", "chips");
    lista.setAttribute("aria-label", "Horários adicionados");
    const erro = criar("p", "campo__erro");
    erro.id = "pu-horario-erro";

    function renderizar() {
        lista.replaceChildren(...horarios.map(horario => {
            const li = criar("li", "chip");
            const remover = criar("button", "chip__remover", "×");
            remover.type = "button";
            remover.setAttribute("aria-label", `Remover ${horario}`);
            remover.addEventListener("click", () => {
                horarios.splice(horarios.indexOf(horario), 1);
                renderizar();
            });
            li.append(criar("span", "", horario), remover);
            return li;
        }));
    }

    function incluir() {
        const valor = input.value.slice(0, 5);
        erro.textContent = "";
        input.removeAttribute("aria-invalid");
        if (!HORARIO.test(valor)) {
            erro.textContent = "Informe um horário válido.";
            input.setAttribute("aria-invalid", "true");
            return;
        }
        if (!horarios.includes(valor)) {
            horarios.push(valor);
            horarios.sort();
        }
        input.value = "";
        renderizar();
    }

    adicionar.addEventListener("click", incluir);
    input.addEventListener("keydown", e => {
        if (e.key === "Enter") {
            e.preventDefault();
            incluir();
        }
    });

    raiz.append(label, ajuda, linha, erro, lista);
    renderizar();
    return raiz;
}

// filmes/fornecedores: listas do repositório. aoSalvar(dados) devolve erros ou nada.
// publicacao (opcional): registro existente para editar; os campos já vêm preenchidos.
export function FormPublicar({ filmes, fornecedores, hoje, publicacao = null, aoSalvar }) {
    const editando = Boolean(publicacao);
    const datasOriginais = editando ? [...(publicacao.datas || [])].sort() : [];
    const inicioOriginal = datasOriginais[0] || "";
    const horarios = editando ? [...(publicacao.horarios || [])].sort() : [];
    // Na edição, a data inicial original continua valendo mesmo que já tenha passado.
    const hojeIso = dataIso(hoje);
    const minimo = inicioOriginal && inicioOriginal < hojeIso ? inicioOriginal : hojeIso;
    const maximo = `${hoje.getFullYear() + ANOS_A_FRENTE}-12-31`;

    // datalancamento vem como dd/mm/aaaa.
    function lancamentoDe(filmeId) {
        const filme = filmes.find(f => String(f.id) === String(filmeId));
        const [dia, mes, ano] = String(filme?.datalancamento || "").split("/");
        return lerData(`${ano}-${mes}-${dia}`);
    }

    const form = Formulario({
        textoBotao: editando ? "Salvar alterações" : "Publicar filme",
        campos: [
            Campo({ id: "pu-filme", rotulo: "Filme", tag: "select", duplo: true, opcoes: [["", "Selecione"], ...filmes.map(f => [String(f.id), f.nome])] }),
            Campo({ id: "pu-local", rotulo: "Local de exibição", tag: "select", duplo: true, opcoes: [["", "Selecione"], ...fornecedores.map(f => [String(f.id), `${f.nome} — ${f.cidade} - ${f.uf}`])] }),
            Campo({ id: "pu-inicio", rotulo: "Data inicial", tipo: "date", atributos: { min: minimo, max: maximo } }),
            Campo({ id: "pu-fim", rotulo: "Data final", tipo: "date", ajuda: `Período de até ${MAX_DIAS} dias.`, atributos: { min: minimo, max: maximo } }),
            Campo({ id: "pu-valor", rotulo: "Valor do ingresso (R$)", tipo: "number", ajuda: "Valor da inteira. A meia-entrada é calculada como metade.", atributos: { min: "0.01", step: "0.01", inputmode: "decimal" } }),
            Campo({ id: "pu-vagas", rotulo: "Total de vagas", tipo: "number", ajuda: "Vagas de carro por sessão (data + horário).", atributos: { min: "1", step: "1", inputmode: "numeric" } }),
            CampoHorarios(horarios),
        ],
        aoEnviar: (valores, formulario) => {
            const erros = {};
            if (!valores["pu-filme"]) erros["pu-filme"] = "Selecione o filme.";
            if (!valores["pu-local"]) erros["pu-local"] = "Selecione o local.";

            const inicio = lerData(valores["pu-inicio"]);
            const fim = lerData(valores["pu-fim"]);
            const vazia = id => (formulario.querySelector(`#${id}`).validity.badInput ? "Informe uma data válida." : null);
            const manteveInicio = editando && valores["pu-inicio"] === inicioOriginal;

            if (!inicio) erros["pu-inicio"] = vazia("pu-inicio") ?? "Informe a data inicial.";
            else if (valores["pu-inicio"] < hojeIso && !manteveInicio) erros["pu-inicio"] = "A data inicial não pode estar no passado.";
            else if (valores["pu-inicio"] > maximo) erros["pu-inicio"] = `A data inicial deve ser até ${dataCurta(lerData(maximo))}.`;
            else {
                const lancamento = lancamentoDe(valores["pu-filme"]);
                if (lancamento && inicio < lancamento && !manteveInicio) {
                    erros["pu-inicio"] = `O filme é lançado em ${dataCurta(lancamento)}. A exibição deve começar nessa data ou depois.`;
                }
            }

            if (!fim) erros["pu-fim"] = vazia("pu-fim") ?? "Informe a data final.";
            else if (valores["pu-fim"] > maximo) erros["pu-fim"] = `A data final deve ser até ${dataCurta(lerData(maximo))}.`;
            else if (inicio && fim < inicio) erros["pu-fim"] = "A data final deve ser igual ou posterior à inicial.";
            else if (inicio && Math.round((fim - inicio) / 86400000) + 1 > MAX_DIAS) erros["pu-fim"] = `O período pode ter no máximo ${MAX_DIAS} dias.`;

            if (!horarios.length) erros["pu-horario"] = "Adicione pelo menos um horário.";

            const valor = Number(valores["pu-valor"]);
            if (!(valor > 0)) erros["pu-valor"] = "Informe um valor maior que zero.";
            const vagas = Number(valores["pu-vagas"]);
            if (!Number.isInteger(vagas) || vagas < 1) erros["pu-vagas"] = "Informe um número inteiro de vagas.";
            if (Object.keys(erros).length) return erros;

            const datas = [];
            for (const d = new Date(inicio); d <= fim; d.setDate(d.getDate() + 1)) datas.push(dataIso(d));

            return aoSalvar({
                filmeId: Number(valores["pu-filme"]),
                fornecedorId: Number(valores["pu-local"]),
                datas,
                horarios: [...horarios],
                valor: Math.round(valor * 100) / 100,
                vagas,
            }, formulario);
        },
    });

    // O calendário da data final só oferece dias dentro do período permitido a partir da inicial.
    const campoInicio = form.querySelector("#pu-inicio");
    const campoFim = form.querySelector("#pu-fim");
    function limitarFim() {
        const inicio = lerData(campoInicio.value);
        if (!inicio) {
            campoFim.min = minimo;
            campoFim.max = maximo;
            return;
        }
        const limite = new Date(inicio);
        limite.setDate(limite.getDate() + MAX_DIAS - 1);
        campoFim.min = campoInicio.value;
        campoFim.max = dataIso(limite) < maximo ? dataIso(limite) : maximo;
    }
    campoInicio.addEventListener("change", limitarFim);

    if (editando) {
        const preencher = (id, valor) => { form.querySelector(`#${id}`).value = valor ?? ""; };
        preencher("pu-filme", String(publicacao.filmeId));
        preencher("pu-local", String(publicacao.fornecedorId));
        preencher("pu-inicio", inicioOriginal);
        preencher("pu-fim", datasOriginais[datasOriginais.length - 1] || "");
        preencher("pu-valor", publicacao.valor);
        preencher("pu-vagas", publicacao.vagas);
        limitarFim();
    }

    const filhos = [form];
    if (!filmes.length || !fornecedores.length) {
        const aviso = criar("p", "admin-descricao", "Cadastre pelo menos um filme e um fornecedor antes de publicar.");
        filhos.unshift(aviso);
    }
    if (editando) {
        const voltar = criar("a", "admin-voltar", "← Voltar para filmes publicados");
        voltar.href = "#/admin/publicados";
        filhos.unshift(voltar);
        return AdminPagina({ titulo: "Editar publicação", descricao: "Altere local, período, horários, valor ou vagas. As datas do período são recriadas ao salvar.", filhos });
    }
    return AdminPagina({ titulo: "Publicar filme", descricao: "Define onde, quando e por quanto o filme é exibido no site.", filhos });
}
