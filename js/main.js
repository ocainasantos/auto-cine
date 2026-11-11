import { carregarEventos, agruparPorCidade } from "./dados.js";
import { filtrar } from "./busca.js";
import { sessaoAtual, sair } from "./auth.js";
import { ROTAS_ADMIN, telaLogin } from "./admin.js";
import { Header } from "../components/Header.js";
import { FiltroCidade } from "../components/FiltroCidade.js";
import { Carrossel } from "../components/Carrossel.js";
import { Catalogo } from "../components/Catalogo.js";
import { FilmeDetalhe } from "../components/FilmeDetalhe.js";
import { Footer } from "../components/Footer.js";
import { Aviso } from "../components/Aviso.js";
import { AdminLayout } from "../components/admin/AdminLayout.js";

const app = document.getElementById("app");
const conteudo = document.createElement("div");
const estado = { cidade: "", termo: "" };
let filmes = [];
let falhou = false;
let carrossel = null;
let catalogo = null;
let layout = "";
let navegacao = 0;

// ---------- Site ----------

function novoCatalogo() {
    if (falhou) return Aviso("Não foi possível carregar o catálogo de filmes.");
    return Catalogo({ grupos: agruparPorCidade(filtrar(filmes, estado.cidade, estado.termo)) });
}

function atualizar(mudanca) {
    Object.assign(estado, mudanca);
    if (!conteudo.contains(catalogo)) {
        location.hash = "#/";
        return;
    }
    const novo = novoCatalogo();
    catalogo.replaceWith(novo);
    catalogo = novo;
}

// Recarrega os eventos ao entrar no site, para refletir o que o admin publicou.
async function montarSite(vez) {
    let eventos = [];
    let erro = null;
    try {
        eventos = await carregarEventos();
    } catch (e) {
        erro = e;
    }
    // Outra navegação começou enquanto os eventos carregavam: não sobrescreve a tela dela.
    if (vez !== navegacao) return;
    if (erro) console.error(erro);
    filmes = eventos;
    falhou = Boolean(erro);
    Object.assign(estado, { cidade: "", termo: "" });
    const destaques = filmes.filter(f => f.carrossel);
    carrossel = destaques.length ? Carrossel({ filmes: destaques }) : null;
    app.replaceChildren(
        Header({
            onBusca: termo => atualizar({ termo }),
            sugerir: termo => filtrar(filmes, estado.cidade, termo),
            aoEscolher: evento => {
                estado.termo = "";
                location.hash = `#/filme/${evento.id}`;
            },
            filtro: FiltroCidade({ grupos: agruparPorCidade(filmes), aoSelecionar: cidade => atualizar({ cidade }) }),
        }),
        conteudo,
        Footer()
    );
    layout = "site";
}

function telaInicio() {
    document.title = "AutoCine";
    catalogo = novoCatalogo();
    return [carrossel, catalogo].filter(Boolean);
}

function telaFilme(id) {
    const filme = filmes.find(f => f.id === id);
    document.title = filme ? `${filme.nome} — AutoCine` : "AutoCine";
    return [filme ? FilmeDetalhe({ filme }) : Aviso("Filme não encontrado.")];
}

const ROTAS_SITE = [
    [/^#\/filme\/(\d+)$/, m => telaFilme(Number(m[1]))],
];

async function rotearSite(hash, vez) {
    if (layout !== "site") await montarSite(vez);
    if (vez !== navegacao) return;
    const rota = ROTAS_SITE.find(([padrao]) => padrao.test(hash));
    const telas = rota ? rota[1](rota[0].exec(hash)) : telaInicio();
    conteudo.replaceChildren(...telas);
    window.scrollTo(0, 0);
}

// ---------- Admin ----------

async function rotearAdmin(hash, vez) {
    const sessao = sessaoAtual();
    if (hash === "#/admin/login") {
        if (sessao) return location.replace("#/admin/painel");
        const tela = await telaLogin();
        if (vez !== navegacao) return;
        document.title = "Admin — AutoCine";
        app.replaceChildren(tela);
        layout = "login";
        return;
    }
    if (!sessao) return location.replace("#/admin/login");

    const rota = ROTAS_ADMIN.find(([padrao]) => padrao.test(hash));
    if (!rota) return location.replace("#/admin/painel");

    const tela = await rota[1](rota[0].exec(hash));
    if (vez !== navegacao) return;
    document.title = `${rota[2]} — Admin AutoCine`;
    app.replaceChildren(AdminLayout({
        sessao,
        rota: hash,
        conteudo: tela,
        aoSair: () => {
            sair();
            location.hash = "#/admin/login";
        },
    }));
    layout = "admin";
    window.scrollTo(0, 0);
}

// ---------- Roteador ----------

async function rotear() {
    const vez = ++navegacao;
    const hash = location.hash || "#/";
    try {
        if (hash === "#/admin" || hash.startsWith("#/admin/")) await rotearAdmin(hash, vez);
        else await rotearSite(hash, vez);
    } catch (erro) {
        console.error(erro);
        app.replaceChildren(Aviso("Algo deu errado ao carregar esta página."));
        layout = "";
    }
}

window.addEventListener("hashchange", rotear);
rotear();
