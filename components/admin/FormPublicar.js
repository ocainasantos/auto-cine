import { criar } from "../dom.js";
import { Campo, Formulario } from "../Formulario.js";
import { AdminPagina } from "./AdminLayout.js";
import { HORARIO, lerData, dataIso } from "../../js/dados.js";

const MAX_DIAS = 31;

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
    return raiz;
}

// filmes/fornecedores: listas do repositório. aoSalvar(dados) devolve erros ou nada.
export function FormPublicar({ filmes, fornecedores, hoje, aoSalvar }) {
    const horarios = [];
    const minimo = dataIso(hoje);

    const form = Formulario({
        textoBotao: "Publicar filme",
        campos: [
            Campo({ id: "pu-filme", rotulo: "Filme", tag: "select", largo: true, opcoes: [["", "Selecione"], ...filmes.map(f => [String(f.id), f.nome])] }),
            Campo({ id: "pu-local", rotulo: "Local de exibição", tag: "select", largo: true, opcoes: [["", "Selecione"], ...fornecedores.map(f => [String(f.id), `${f.nome} — ${f.cidade} - ${f.uf}`])] }),
            Campo({ id: "pu-inicio", rotulo: "Data inicial", tipo: "date", atributos: { min: minimo } }),
            Campo({ id: "pu-fim", rotulo: "Data final", tipo: "date", ajuda: `Período de até ${MAX_DIAS} dias.`, atributos: { min: minimo } }),
            CampoHorarios(horarios),
            Campo({ id: "pu-valor", rotulo: "Valor do ingresso (R$)", tipo: "number", ajuda: "Valor da inteira. A meia-entrada é calculada como metade.", atributos: { min: "0.01", step: "0.01", inputmode: "decimal" } }),
            Campo({ id: "pu-vagas", rotulo: "Total de vagas", tipo: "number", ajuda: "Vagas de carro por sessão (data + horário).", atributos: { min: "1", step: "1", inputmode: "numeric" } }),
        ],
        aoEnviar: (valores, formulario) => {
            const erros = {};
            if (!valores["pu-filme"]) erros["pu-filme"] = "Selecione o filme.";
            if (!valores["pu-local"]) erros["pu-local"] = "Selecione o local.";

            const inicio = lerData(valores["pu-inicio"]);
            const fim = lerData(valores["pu-fim"]);
            if (!inicio) erros["pu-inicio"] = "Informe a data inicial.";
            else if (valores["pu-inicio"] < minimo) erros["pu-inicio"] = "A data inicial não pode estar no passado.";
            if (!fim) erros["pu-fim"] = "Informe a data final.";
            else if (inicio && fim < inicio) erros["pu-fim"] = "A data final deve ser igual ou posterior à inicial.";
            else if (inicio && (fim - inicio) / 86400000 + 1 > MAX_DIAS) erros["pu-fim"] = `O período pode ter no máximo ${MAX_DIAS} dias.`;

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

    const filhos = [form];
    if (!filmes.length || !fornecedores.length) {
        const aviso = criar("p", "admin-descricao", "Cadastre pelo menos um filme e um fornecedor antes de publicar.");
        filhos.unshift(aviso);
    }
    return AdminPagina({ titulo: "Publicar filme", descricao: "Define onde, quando e por quanto o filme é exibido no site.", filhos });
}
