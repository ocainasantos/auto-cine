import { listar, adicionar } from "./repositorio.js";
import { carregarEventos, moeda, dataCurta } from "./dados.js";
import { entrar, cadastrarAdmin, existeAdmin } from "./auth.js";
import { notificar } from "../components/Notificacao.js";
import { Consulta } from "../components/Consulta.js";
import { AdminPagina } from "../components/admin/AdminLayout.js";
import { Login } from "../components/admin/Login.js";
import { Painel } from "../components/admin/Painel.js";
import { FormFornecedor, FormFilme, FormAdmin, validarAdmin } from "../components/admin/Cadastros.js";
import { FormPublicar } from "../components/admin/FormPublicar.js";

const ir = hash => { location.hash = hash; };

export async function telaLogin() {
    const primeiroAcesso = !await existeAdmin();
    return Login({
        primeiroAcesso,
        aoEnviar: async valores => {
            const erros = primeiroAcesso ? validarAdmin(valores, "login") : {};
            if (!primeiroAcesso && !valores["login-email"]) erros["login-email"] = "Informe o Gmail.";
            if (!primeiroAcesso && !valores["login-senha"]) erros["login-senha"] = "Informe a senha.";
            if (Object.keys(erros).length) return erros;

            if (primeiroAcesso) {
                await cadastrarAdmin({ nome: valores["login-nome"], email: valores["login-email"], senha: valores["login-senha"] });
            }
            const sessao = await entrar(valores["login-email"], valores["login-senha"]);
            if (!sessao) return { _form: "Gmail ou senha inválidos." };
            ir("#/admin/painel");
        },
    });
}

async function telaPainel() {
    const [publicacoes, fornecedores, compras] = await Promise.all([listar("publicacoes"), listar("fornecedores"), listar("compras")]);
    const total = compras.reduce((soma, c) => soma + (Number(c.valor) || 0), 0);
    return Painel({
        publicados: publicacoes.length,
        fornecedores: fornecedores.length,
        valorMovimentado: moeda(total),
        ingressosVendidos: compras.length,
    });
}

function telaNovoFornecedor() {
    return FormFornecedor({
        aoSalvar: async dados => {
            await adicionar("fornecedores", dados);
            notificar("Fornecedor cadastrado com sucesso!");
            ir("#/admin/fornecedores");
        },
    });
}

async function telaFornecedores() {
    const fornecedores = await listar("fornecedores");
    return AdminPagina({
        titulo: "Fornecedores",
        descricao: "Fornecedores de espaço cadastrados.",
        filhos: [Consulta({
            rotuloBusca: "Buscar fornecedor",
            vazio: "Nenhum fornecedor cadastrado.",
            linhas: fornecedores,
            colunas: [
                ["Nome", f => f.nome],
                ["Endereço", f => f.endereco],
                ["Cidade", f => f.cidade],
                ["UF", f => f.uf],
            ],
        })],
    });
}

function telaNovoFilme() {
    return FormFilme({
        aoSalvar: async dados => {
            await adicionar("filmes", dados);
            notificar("Filme cadastrado com sucesso!");
            ir("#/admin/publicar");
        },
    });
}

async function telaPublicar() {
    const [filmes, fornecedores] = await Promise.all([listar("filmes"), listar("fornecedores")]);
    return FormPublicar({
        filmes,
        fornecedores,
        hoje: new Date(),
        aoSalvar: async dados => {
            await adicionar("publicacoes", dados);
            notificar("Filme publicado com sucesso!");
            ir("#/admin/publicados");
        },
    });
}

async function telaPublicados() {
    const [eventos, compras] = await Promise.all([carregarEventos(), listar("compras")]);
    const vendidos = new Map();
    compras.forEach(c => vendidos.set(Number(c.publicacaoId), (vendidos.get(Number(c.publicacaoId)) || 0) + 1));
    const periodo = e => e.sessoes.length
        ? `${dataCurta(e.sessoes[0])} a ${dataCurta(e.sessoes[e.sessoes.length - 1])}`
        : "—";
    return AdminPagina({
        titulo: "Filmes publicados",
        descricao: "Filmes em exibição no site, com local, período e vendas.",
        filhos: [Consulta({
            rotuloBusca: "Buscar publicação",
            vazio: "Nenhum filme publicado.",
            linhas: eventos,
            colunas: [
                ["Filme", e => e.nome],
                ["Local", e => `${e.estacionamento} — ${e.cidadeUf}`],
                ["Período", periodo],
                ["Horários", e => e.horarios.join(", ")],
                ["Ingresso", e => moeda(e.ingressos[0].preco)],
                ["Vagas por sessão", e => e.vagas ?? "Não informado"],
                ["Vendidos", e => vendidos.get(e.id) || 0],
            ],
        })],
    });
}

function telaNovoAdmin() {
    return FormAdmin({
        aoSalvar: async dados => {
            await cadastrarAdmin(dados);
            notificar("Admin cadastrado com sucesso!");
        },
    });
}

export const ROTAS_ADMIN = [
    [/^#\/admin\/painel$/, telaPainel, "Painel"],
    [/^#\/admin\/fornecedores\/novo$/, telaNovoFornecedor, "Cadastrar fornecedor"],
    [/^#\/admin\/fornecedores$/, telaFornecedores, "Fornecedores"],
    [/^#\/admin\/filmes\/novo$/, telaNovoFilme, "Cadastrar filme"],
    [/^#\/admin\/publicar$/, telaPublicar, "Publicar filme"],
    [/^#\/admin\/publicados$/, telaPublicados, "Filmes publicados"],
    [/^#\/admin\/admins\/novo$/, telaNovoAdmin, "Novo admin"],
];
