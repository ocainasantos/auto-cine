import { listar, adicionar, atualizar } from "./repositorio.js";
import { carregarEventos, moeda, dataCurta } from "./dados.js";
import { entrar, cadastrarAdmin, existeAdmin } from "./auth.js";
import { notificar } from "../components/Notificacao.js";
import { Consulta } from "../components/Consulta.js";
import { AdminPagina } from "../components/admin/AdminLayout.js";
import { Login } from "../components/admin/Login.js";
import { Painel } from "../components/admin/Painel.js";
import { FormFornecedor, FormFilme, FormAdmin, validarAdmin } from "../components/admin/Cadastros.js";
import { FormPublicar } from "../components/admin/FormPublicar.js";
import { MenuAcoes } from "../components/admin/MenuAcoes.js";
import { criar } from "../components/dom.js";

const ir = hash => { location.hash = hash; };

export async function telaLogin() {
    const primeiroAcesso = !await existeAdmin();
    return Login({
        primeiroAcesso,
        aoEnviar: async valores => {
            const erros = primeiroAcesso ? validarAdmin(valores, "login") : {};
            if (!primeiroAcesso && !valores["login-email"]) erros["login-email"] = "Informe o e-mail.";
            if (!primeiroAcesso && !valores["login-senha"]) erros["login-senha"] = "Informe a senha.";
            if (Object.keys(erros).length) return erros;

            if (primeiroAcesso) {
                await cadastrarAdmin({ nome: valores["login-nome"], email: valores["login-email"], senha: valores["login-senha"] });
            }
            const sessao = await entrar(valores["login-email"], valores["login-senha"]);
            if (!sessao) return { _form: "E-mail ou senha inválidos." };
            ir("#/admin/painel");
        },
    });
}

async function telaPainel() {
    const [noSite, fornecedores, compras] = await Promise.all([carregarEventos(), listar("fornecedores"), listar("compras")]);
    const total = compras.reduce((soma, c) => soma + (Number(c.valor) || 0), 0);
    return Painel({
        publicados: noSite.length,
        fornecedores: fornecedores.filter(f => f.ativo !== false).length,
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

// Seletor "Ativos (n) / Desativados (n)" usado nas consultas que têm itens desativáveis.
function FiltroSituacao({ rotulo, situacao, ativos, inativos, aoMudar }) {
    const filtro = criar("div", "status-filtro");
    filtro.setAttribute("role", "group");
    filtro.setAttribute("aria-label", rotulo);
    [["ativos", `Ativos (${ativos})`], ["desativados", `Desativados (${inativos})`]].forEach(([valor, texto]) => {
        const botao = criar("button", "status-filtro__botao", texto);
        botao.type = "button";
        botao.setAttribute("aria-pressed", String(situacao === valor));
        botao.addEventListener("click", () => { if (situacao !== valor) aoMudar(valor); });
        filtro.append(botao);
    });
    return filtro;
}

function TextoComStatus(texto, ativo, etiqueta = "Desativado") {
    const celula = criar("span", "tabela__nome", texto);
    if (!ativo) celula.append(" ", criar("span", "status-badge", etiqueta));
    return celula;
}

async function telaFornecedores() {
    const estado = { situacao: "ativos", termo: "" };
    const corpo = criar("div", "fornecedores");

    async function montar() {
        const [fornecedores, eventos] = await Promise.all([listar("fornecedores"), carregarEventos({ incluirInativos: true })]);
        const publicadosEm = new Map();
        eventos.filter(e => e.ativo).forEach(e => {
            const id = Number(e.fornecedorId);
            publicadosEm.set(id, (publicadosEm.get(id) || 0) + 1);
        });
        const ativo = f => f.ativo !== false;
        const ativos = fornecedores.filter(ativo);
        const inativos = fornecedores.filter(f => !ativo(f));

        const alternarAtivo = async f => {
            await atualizar("fornecedores", f.id, { ativo: !ativo(f) });
            const qtd = publicadosEm.get(Number(f.id)) || 0;
            const efeito = qtd ? ` ${qtd} filme(s) publicado(s) nele ${ativo(f) ? "saíram do" : "voltaram ao"} site.` : "";
            notificar(`${f.nome} foi ${ativo(f) ? "desativado" : "reativado"}.${efeito}`);
            await montar();
            corpo.querySelector(".status-filtro__botao[aria-pressed='true']")?.focus();
        };

        const consulta = Consulta({
            rotuloBusca: "Buscar fornecedor",
            vazio: estado.situacao === "ativos" ? "Nenhum fornecedor cadastrado." : "Nenhum fornecedor desativado.",
            termoInicial: estado.termo,
            aoBuscar: termo => { estado.termo = termo; },
            linhas: estado.situacao === "ativos" ? ativos : inativos,
            colunas: [
                ["Nome", f => TextoComStatus(f.nome, ativo(f))],
                ["Endereço", f => f.endereco],
                ["Cidade", f => f.cidade],
                ["UF", f => f.uf],
                ["Filmes publicados", f => publicadosEm.get(Number(f.id)) || 0, { busca: false }],
                ["Ações", f => MenuAcoes({
                    rotulo: `Ações de ${f.nome}`,
                    acoes: [
                        { texto: "Editar", aoEscolher: () => ir(`#/admin/fornecedores/${f.id}/editar`) },
                        { texto: ativo(f) ? "Desativar" : "Reativar", aoEscolher: () => alternarAtivo(f) },
                    ],
                }), { classe: "tabela__acoes", busca: false }],
            ],
        });
        corpo.replaceChildren(
            FiltroSituacao({
                rotulo: "Situação dos fornecedores",
                situacao: estado.situacao,
                ativos: ativos.length,
                inativos: inativos.length,
                aoMudar: valor => { estado.situacao = valor; montar(); },
            }),
            consulta
        );
    }

    await montar();
    return AdminPagina({
        titulo: "Fornecedores",
        descricao: "Fornecedores de espaço cadastrados. Os filmes publicados em um fornecedor desativado não aparecem no site.",
        filhos: [corpo],
    });
}

async function telaEditarFornecedor(m) {
    const id = Number(m[1]);
    const fornecedor = (await listar("fornecedores")).find(f => Number(f.id) === id);
    if (!fornecedor) {
        const voltar = criar("a", "admin-voltar", "← Voltar para fornecedores");
        voltar.href = "#/admin/fornecedores";
        return AdminPagina({ titulo: "Editar fornecedor", descricao: "Fornecedor não encontrado.", filhos: [voltar] });
    }
    return FormFornecedor({
        fornecedor,
        aoSalvar: async dados => {
            await atualizar("fornecedores", id, dados);
            notificar("Fornecedor atualizado com sucesso!");
            ir("#/admin/fornecedores");
        },
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
        fornecedores: fornecedores.filter(f => f.ativo !== false),
        hoje: new Date(),
        aoSalvar: async dados => {
            await adicionar("publicacoes", { ...dados, ativo: true, carrossel: false });
            notificar("Filme publicado com sucesso!");
            ir("#/admin/publicados");
        },
    });
}

function CheckCarrossel(evento, aoMudar) {
    const caixa = criar("input", "tabela__check");
    caixa.type = "checkbox";
    caixa.checked = evento.carrossel;
    caixa.disabled = !evento.ativo;
    caixa.setAttribute("aria-label", `Mostrar ${evento.nome} no carrossel`);
    if (!evento.ativo) caixa.title = "Reative o filme para mostrá-lo no carrossel";
    caixa.addEventListener("change", async () => {
        caixa.disabled = true;
        try {
            await atualizar("publicacoes", evento.id, { carrossel: caixa.checked });
            evento.carrossel = caixa.checked;
            notificar(caixa.checked ? `${evento.nome} aparece no carrossel.` : `${evento.nome} foi removido do carrossel.`);
            aoMudar();
        } catch (erro) {
            console.error(erro);
            caixa.checked = !caixa.checked;
        } finally {
            caixa.disabled = !evento.ativo;
        }
    });
    return caixa;
}


async function telaPublicados() {
    const estado = { situacao: "ativos", termo: "" };
    const corpo = criar("div", "publicados");

    async function montar() {
        const [eventos, compras] = await Promise.all([carregarEventos({ incluirInativos: true }), listar("compras")]);
        const vendidos = new Map();
        compras.forEach(c => vendidos.set(Number(c.publicacaoId), (vendidos.get(Number(c.publicacaoId)) || 0) + 1));
        const ativos = eventos.filter(e => e.ativo);
        const inativos = eventos.filter(e => !e.ativo);
        const periodo = e => e.sessoes.length
            ? `${dataCurta(e.sessoes[0])} a ${dataCurta(e.sessoes[e.sessoes.length - 1])}`
            : "—";
        const noCarrossel = ativos.filter(e => e.carrossel).length;

        const filtro = FiltroSituacao({
            rotulo: "Situação das publicações",
            situacao: estado.situacao,
            ativos: ativos.length,
            inativos: inativos.length,
            aoMudar: valor => { estado.situacao = valor; montar(); },
        });

        const resumo = criar("p", "status-resumo", `${noCarrossel} filme(s) no carrossel da página inicial.`);
        resumo.setAttribute("aria-live", "polite");

        const alternarAtivo = async evento => {
            await atualizar("publicacoes", evento.id, { ativo: !evento.ativo });
            notificar(evento.ativo ? `${evento.nome} foi desativado e saiu do site.` : `${evento.nome} foi reativado.`);
            await montar();
            corpo.querySelector(".status-filtro__botao[aria-pressed='true']")?.focus();
        };

        const linhas = estado.situacao === "ativos" ? ativos : inativos;
        const consulta = Consulta({
            rotuloBusca: "Buscar publicação",
            vazio: estado.situacao === "ativos" ? "Nenhum filme publicado." : "Nenhum filme desativado.",
            termoInicial: estado.termo,
            aoBuscar: termo => { estado.termo = termo; },
            linhas,
            colunas: [
                ["Filme", e => TextoComStatus(e.nome, e.ativo)],
                ["Local", e => TextoComStatus(`${e.estacionamento} — ${e.cidadeUf}`, e.localAtivo, "Local desativado")],
                ["Período", periodo],
                ["Horários", e => e.horarios.join(", ")],
                ["Ingresso", e => moeda(e.ingressos[0].preco)],
                ["Vagas por sessão", e => e.vagas ?? "Não informado"],
                ["Vendidos", e => vendidos.get(e.id) || 0],
                ["Carrossel", e => CheckCarrossel(e, () => {
                    resumo.textContent = `${ativos.filter(x => x.carrossel).length} filme(s) no carrossel da página inicial.`;
                }), { classe: "tabela__centro", busca: false }],
                ["Ações", e => MenuAcoes({
                    rotulo: `Ações de ${e.nome}`,
                    acoes: [
                        { texto: "Editar", aoEscolher: () => ir(`#/admin/publicados/${e.id}/editar`) },
                        { texto: e.ativo ? "Desativar" : "Reativar", aoEscolher: () => alternarAtivo(e) },
                    ],
                }), { classe: "tabela__acoes", busca: false }],
            ],
        });
        corpo.replaceChildren(filtro, resumo, consulta);
    }

    await montar();
    return AdminPagina({
        titulo: "Filmes publicados",
        descricao: "Filmes em exibição no site, com local, período e vendas. Desativados não aparecem no site.",
        filhos: [corpo],
    });
}

async function telaEditarPublicacao(m) {
    const id = Number(m[1]);
    const [publicacoes, filmes, fornecedores] = await Promise.all([listar("publicacoes"), listar("filmes"), listar("fornecedores")]);
    const publicacao = publicacoes.find(p => Number(p.id) === id);
    if (!publicacao) {
        const voltar = criar("a", "admin-voltar", "← Voltar para filmes publicados");
        voltar.href = "#/admin/publicados";
        return AdminPagina({ titulo: "Editar publicação", descricao: "Publicação não encontrada.", filhos: [voltar] });
    }
    return FormPublicar({
        filmes,
        fornecedores: fornecedores.filter(f => f.ativo !== false || Number(f.id) === Number(publicacao.fornecedorId)),
        hoje: new Date(),
        publicacao,
        aoSalvar: async dados => {
            await atualizar("publicacoes", id, dados);
            notificar("Publicação atualizada com sucesso!");
            ir("#/admin/publicados");
        },
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
    [/^#\/admin\/fornecedores\/(\d+)\/editar$/, telaEditarFornecedor, "Editar fornecedor"],
    [/^#\/admin\/filmes\/novo$/, telaNovoFilme, "Cadastrar filme"],
    [/^#\/admin\/publicar$/, telaPublicar, "Publicar filme"],
    [/^#\/admin\/publicados$/, telaPublicados, "Filmes publicados"],
    [/^#\/admin\/publicados\/(\d+)\/editar$/, telaEditarPublicacao, "Editar publicação"],
    [/^#\/admin\/admins\/novo$/, telaNovoAdmin, "Novo admin"],
];
