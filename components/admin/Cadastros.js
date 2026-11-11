import { criar } from "../dom.js";
import { Campo, Formulario } from "../Formulario.js";
import { AdminPagina } from "./AdminLayout.js";
import { ESTADOS, lerData } from "../../js/dados.js";
import { EMAIL, SENHA_MINIMA } from "../../js/auth.js";

const CLASSIFICACOES = ["Livre", "10 anos", "12 anos", "14 anos", "16 anos", "18 anos"];
const DURACAO = /^(\d{1,2})h([0-5]\d)$/i;
const ANO_MINIMO = 1895;
const ANOS_A_FRENTE = 5;

// Data de lançamento: data real, entre 01/01/1895 e 31/12 de (ano atual + 5).
function validarLancamento(valor, controle, hoje = new Date()) {
    const anoMaximo = hoje.getFullYear() + ANOS_A_FRENTE;
    if (!valor) return controle?.validity.badInput ? "Informe uma data válida." : "Informe a data de lançamento.";
    const data = lerData(valor);
    if (!data) return "Informe uma data válida.";
    if (data.getFullYear() < ANO_MINIMO || data.getFullYear() > anoMaximo) {
        return `A data deve estar entre 01/01/${ANO_MINIMO} e 31/12/${anoMaximo}.`;
    }
    return "";
}

function obrigatorios(valores, rotulos) {
    const erros = {};
    Object.entries(rotulos).forEach(([id, mensagem]) => {
        if (!valores[id]) erros[id] = mensagem;
    });
    return erros;
}

function urlValida(texto) {
    try {
        return ["http:", "https:"].includes(new URL(texto).protocol);
    } catch {
        return false;
    }
}

// aoSalvar(dados) devolve erros ou nada.
// fornecedor (opcional): registro existente para editar; os campos já vêm preenchidos.
export function FormFornecedor({ fornecedor = null, aoSalvar }) {
    const ufs = Object.entries(ESTADOS).map(([uf, nome]) => [uf, `${uf} - ${nome}`]);
    const form = Formulario({
        textoBotao: fornecedor ? "Salvar alterações" : "Cadastrar fornecedor",
        campos: [
            Campo({ id: "fo-nome", rotulo: "Nome do estacionamento", duplo: true, atributos: { maxlength: 80, placeholder: "Ex.: Estacionamento X" } }),
            Campo({ id: "fo-endereco", rotulo: "Endereço", duplo: true, atributos: { maxlength: 120, placeholder: "Ex.: R. Santos Dumont, 2626 - Vila Industrial" } }),
            Campo({ id: "fo-cidade", rotulo: "Cidade", duplo: true, atributos: { maxlength: 60 } }),
            Campo({ id: "fo-uf", rotulo: "UF", tag: "select", duplo: true, opcoes: [["", "Selecione"], ...ufs] }),
        ],
        aoEnviar: valores => {
            const erros = obrigatorios(valores, {
                "fo-nome": "Informe o nome do estacionamento.",
                "fo-endereco": "Informe o endereço.",
                "fo-cidade": "Informe a cidade.",
                "fo-uf": "Selecione a UF.",
            });
            if (Object.keys(erros).length) return erros;
            return aoSalvar({ nome: valores["fo-nome"], endereco: valores["fo-endereco"], cidade: valores["fo-cidade"], uf: valores["fo-uf"] });
        },
    });

    if (!fornecedor) {
        return AdminPagina({ titulo: "Cadastrar fornecedor", descricao: "Fornecedor de espaço (estacionamento) onde os filmes são exibidos.", filhos: [form] });
    }
    [["fo-nome", fornecedor.nome], ["fo-endereco", fornecedor.endereco], ["fo-cidade", fornecedor.cidade], ["fo-uf", fornecedor.uf]]
        .forEach(([id, valor]) => { form.querySelector(`#${id}`).value = valor ?? ""; });
    const voltar = criar("a", "admin-voltar", "← Voltar para fornecedores");
    voltar.href = "#/admin/fornecedores";
    return AdminPagina({ titulo: "Editar fornecedor", descricao: "As alterações valem para todos os filmes publicados neste local.", filhos: [voltar, form] });
}

export function FormFilme({ aoSalvar }) {
    const form = Formulario({
        textoBotao: "Cadastrar filme",
        campos: [
            Campo({ id: "fi-nome", rotulo: "Nome", duplo: true, atributos: { maxlength: 100 } }),
            Campo({ id: "fi-classificacao", rotulo: "Classificação", tag: "select", opcoes: [["", "Selecione"], ...CLASSIFICACOES.map(c => [c, c])] }),
            Campo({ id: "fi-genero", rotulo: "Gênero", atributos: { maxlength: 40, placeholder: "Ex.: Ação" } }),
            Campo({ id: "fi-duracao", rotulo: "Duração", atributos: { maxlength: 5, placeholder: "Ex.: 01h59" } }),
            Campo({ id: "fi-lancamento", rotulo: "Data de lançamento", tipo: "date", atributos: { min: `${ANO_MINIMO}-01-01`, max: `${new Date().getFullYear() + ANOS_A_FRENTE}-12-31` } }),
            Campo({ id: "fi-direcao", rotulo: "Direção", duplo: true, atributos: { maxlength: 100 } }),
            Campo({ id: "fi-elenco", rotulo: "Elenco", largo: true, ajuda: "Nomes separados por vírgula.", atributos: { maxlength: 300 } }),
            Campo({ id: "fi-sinopse", rotulo: "Sinopse", tag: "textarea", largo: true, atributos: { maxlength: 1500, rows: 6 } }),
            Campo({ id: "fi-imagem", rotulo: "URL do pôster", tipo: "url", duplo: true, ajuda: "Imagem do card e da página do filme.", atributos: { maxlength: 300, placeholder: "https://" } }),
            Campo({ id: "fi-banner", rotulo: "URL do banner", tipo: "url", duplo: true, ajuda: "Imagem do carrossel. Se ficar vazio, o pôster é usado.", atributos: { maxlength: 300, placeholder: "https://" } }),
        ],
        aoEnviar: (valores, formulario) => {
            const erros = obrigatorios(valores, {
                "fi-nome": "Informe o nome.",
                "fi-classificacao": "Selecione a classificação.",
                "fi-genero": "Informe o gênero.",
                "fi-duracao": "Informe a duração.",
                "fi-direcao": "Informe a direção.",
                "fi-elenco": "Informe o elenco.",
                "fi-sinopse": "Informe a sinopse.",
                "fi-imagem": "Informe a URL do pôster.",
            });
            const duracao = DURACAO.exec(valores["fi-duracao"]);
            if (valores["fi-duracao"] && !duracao) erros["fi-duracao"] = "Use o formato 01h59.";
            const erroData = validarLancamento(valores["fi-lancamento"], formulario.querySelector("#fi-lancamento"));
            if (erroData) erros["fi-lancamento"] = erroData;
            if (valores["fi-imagem"] && !urlValida(valores["fi-imagem"])) erros["fi-imagem"] = "Informe uma URL começando com https://.";
            if (valores["fi-banner"] && !urlValida(valores["fi-banner"])) erros["fi-banner"] = "Informe uma URL começando com https://.";
            if (Object.keys(erros).length) return erros;

            const [ano, mes, dia] = valores["fi-lancamento"].split("-");
            return aoSalvar({
                nome: valores["fi-nome"],
                classificacao: valores["fi-classificacao"],
                genero: valores["fi-genero"],
                duracao: `${duracao[1].padStart(2, "0")}h${duracao[2]}`,
                datalancamento: `${dia}/${mes}/${ano}`,
                direcao: valores["fi-direcao"],
                elenco: valores["fi-elenco"],
                sinopse: valores["fi-sinopse"],
                imageurl: valores["fi-imagem"],
                banner: valores["fi-banner"],
            });
        },
    });
    return AdminPagina({ titulo: "Cadastrar filme", descricao: "O filme aparece no site depois de publicado em um local.", filhos: [form] });
}

export function FormAdmin({ aoSalvar }) {
    const form = Formulario({
        textoBotao: "Cadastrar admin",
        campos: [
            Campo({ id: "ad-nome", rotulo: "Nome", duplo: true, atributos: { maxlength: 100, autocomplete: "off" } }),
            Campo({ id: "ad-email", rotulo: "E-mail", tipo: "email", duplo: true, atributos: { maxlength: 100, autocomplete: "off", placeholder: "nome@exemplo.com" } }),
            Campo({ id: "ad-senha", rotulo: "Senha", tipo: "password", duplo: true, ajuda: `Mínimo de ${SENHA_MINIMA} caracteres.`, atributos: { maxlength: 64, autocomplete: "new-password" } }),
        ],
        aoEnviar: async (valores, form) => {
            const erros = validarAdmin(valores, "ad");
            if (Object.keys(erros).length) return erros;
            const resultado = await aoSalvar({ nome: valores["ad-nome"], email: valores["ad-email"], senha: valores["ad-senha"] });
            if (!resultado) form.reset();
            return resultado;
        },
    });
    return AdminPagina({ titulo: "Cadastrar novo admin", descricao: "O novo admin entra com o e-mail e a senha cadastrados.", filhos: [form] });
}

export function validarAdmin(valores, prefixo) {
    const erros = {};
    if (`${prefixo}-nome` in valores && !valores[`${prefixo}-nome`]) erros[`${prefixo}-nome`] = "Informe o nome.";
    if (!EMAIL.test(valores[`${prefixo}-email`])) erros[`${prefixo}-email`] = "Informe um e-mail válido, ex.: nome@exemplo.com.";
    if (valores[`${prefixo}-senha`].length < SENHA_MINIMA) erros[`${prefixo}-senha`] = `A senha deve ter no mínimo ${SENHA_MINIMA} caracteres.`;
    return erros;
}
