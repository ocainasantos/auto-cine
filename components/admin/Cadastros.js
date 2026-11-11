import { Campo, Formulario } from "../Formulario.js";
import { AdminPagina } from "./AdminLayout.js";
import { ESTADOS } from "../../js/dados.js";
import { GMAIL, SENHA_MINIMA } from "../../js/auth.js";

const CLASSIFICACOES = ["Livre", "10 anos", "12 anos", "14 anos", "16 anos", "18 anos"];
const DURACAO = /^(\d{1,2})h([0-5]\d)$/i;

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
export function FormFornecedor({ aoSalvar }) {
    const ufs = Object.entries(ESTADOS).map(([uf, nome]) => [uf, `${uf} - ${nome}`]);
    const form = Formulario({
        textoBotao: "Cadastrar fornecedor",
        campos: [
            Campo({ id: "fo-nome", rotulo: "Nome do estacionamento", largo: true, atributos: { maxlength: 80, placeholder: "Ex.: Estacionamento X" } }),
            Campo({ id: "fo-endereco", rotulo: "Endereço", largo: true, atributos: { maxlength: 120, placeholder: "Ex.: R. Santos Dumont, 2626 - Vila Industrial" } }),
            Campo({ id: "fo-cidade", rotulo: "Cidade", atributos: { maxlength: 60 } }),
            Campo({ id: "fo-uf", rotulo: "UF", tag: "select", opcoes: [["", "Selecione"], ...ufs] }),
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
    return AdminPagina({ titulo: "Cadastrar fornecedor", descricao: "Fornecedor de espaço (estacionamento) onde os filmes são exibidos.", filhos: [form] });
}

export function FormFilme({ aoSalvar }) {
    const form = Formulario({
        textoBotao: "Cadastrar filme",
        campos: [
            Campo({ id: "fi-nome", rotulo: "Nome", largo: true, atributos: { maxlength: 100 } }),
            Campo({ id: "fi-classificacao", rotulo: "Classificação", tag: "select", opcoes: [["", "Selecione"], ...CLASSIFICACOES.map(c => [c, c])] }),
            Campo({ id: "fi-genero", rotulo: "Gênero", atributos: { maxlength: 40, placeholder: "Ex.: Ação" } }),
            Campo({ id: "fi-duracao", rotulo: "Duração", atributos: { maxlength: 5, placeholder: "Ex.: 01h59" } }),
            Campo({ id: "fi-lancamento", rotulo: "Data de lançamento", tipo: "date" }),
            Campo({ id: "fi-direcao", rotulo: "Direção", largo: true, atributos: { maxlength: 100 } }),
            Campo({ id: "fi-elenco", rotulo: "Elenco", largo: true, ajuda: "Nomes separados por vírgula.", atributos: { maxlength: 300 } }),
            Campo({ id: "fi-sinopse", rotulo: "Sinopse", tag: "textarea", largo: true, atributos: { maxlength: 1500, rows: 6 } }),
            Campo({ id: "fi-imagem", rotulo: "URL do pôster", tipo: "url", largo: true, ajuda: "Imagem do card e da página do filme.", atributos: { maxlength: 300, placeholder: "https://" } }),
            Campo({ id: "fi-banner", rotulo: "URL do banner", tipo: "url", largo: true, ajuda: "Imagem do carrossel. Se ficar vazio, o pôster é usado.", atributos: { maxlength: 300, placeholder: "https://" } }),
        ],
        aoEnviar: valores => {
            const erros = obrigatorios(valores, {
                "fi-nome": "Informe o nome.",
                "fi-classificacao": "Selecione a classificação.",
                "fi-genero": "Informe o gênero.",
                "fi-duracao": "Informe a duração.",
                "fi-lancamento": "Informe a data de lançamento.",
                "fi-direcao": "Informe a direção.",
                "fi-elenco": "Informe o elenco.",
                "fi-sinopse": "Informe a sinopse.",
                "fi-imagem": "Informe a URL do pôster.",
            });
            const duracao = DURACAO.exec(valores["fi-duracao"]);
            if (valores["fi-duracao"] && !duracao) erros["fi-duracao"] = "Use o formato 01h59.";
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
            Campo({ id: "ad-nome", rotulo: "Nome", largo: true, atributos: { maxlength: 100, autocomplete: "off" } }),
            Campo({ id: "ad-email", rotulo: "Gmail", tipo: "email", largo: true, atributos: { maxlength: 100, autocomplete: "off", placeholder: "nome@gmail.com" } }),
            Campo({ id: "ad-senha", rotulo: "Senha", tipo: "password", largo: true, ajuda: `Mínimo de ${SENHA_MINIMA} caracteres.`, atributos: { maxlength: 64, autocomplete: "new-password" } }),
        ],
        aoEnviar: async (valores, form) => {
            const erros = validarAdmin(valores, "ad");
            if (Object.keys(erros).length) return erros;
            const resultado = await aoSalvar({ nome: valores["ad-nome"], email: valores["ad-email"], senha: valores["ad-senha"] });
            if (!resultado) form.reset();
            return resultado;
        },
    });
    return AdminPagina({ titulo: "Cadastrar novo admin", descricao: "O novo admin entra com o Gmail e a senha cadastrados.", filhos: [form] });
}

export function validarAdmin(valores, prefixo) {
    const erros = {};
    if (`${prefixo}-nome` in valores && !valores[`${prefixo}-nome`]) erros[`${prefixo}-nome`] = "Informe o nome.";
    if (!GMAIL.test(valores[`${prefixo}-email`])) erros[`${prefixo}-email`] = "Informe um endereço @gmail.com válido.";
    if (valores[`${prefixo}-senha`].length < SENHA_MINIMA) erros[`${prefixo}-senha`] = `A senha deve ter no mínimo ${SENHA_MINIMA} caracteres.`;
    return erros;
}
