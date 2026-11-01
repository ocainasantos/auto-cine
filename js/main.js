import { carregarFilmes, agruparPorCidade } from "./dados.js";
import { filtrar } from "./busca.js";
import { Header } from "../components/Header.js";
import { FiltroCidade } from "../components/FiltroCidade.js";
import { Carrossel } from "../components/Carrossel.js";
import { Catalogo } from "../components/Catalogo.js";
import { FilmeDetalhe } from "../components/FilmeDetalhe.js";
import { Footer } from "../components/Footer.js";
import { Aviso } from "../components/Aviso.js";

let filmes = [];
let falhou = false;
try {
    filmes = await carregarFilmes();
} catch (erro) {
    console.error(erro);
    falhou = true;
}

const grupos = agruparPorCidade(filmes);
const estado = { cidade: "", termo: "" };
const carrossel = filmes.length ? Carrossel({ filmes: filmes.slice(0, 4) }) : null;
let catalogo;

function novoCatalogo() {
    if (falhou) return Aviso("Não foi possível carregar o catálogo de filmes.");
    return Catalogo({ grupos: agruparPorCidade(filtrar(filmes, estado.cidade, estado.termo)) });
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

const ROTAS = [
    [/^#\/filme\/(\d+)$/, m => telaFilme(Number(m[1]))],
];

const conteudo = document.createElement("div");

function rotear() {
    const rota = ROTAS.find(([padrao]) => padrao.test(location.hash));
    const telas = rota ? rota[1](rota[0].exec(location.hash)) : telaInicio();
    conteudo.replaceChildren(...telas);
    window.scrollTo(0, 0);
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

document.getElementById("app").append(
    Header({
        onBusca: termo => atualizar({ termo }),
        filtro: FiltroCidade({ grupos, aoSelecionar: cidade => atualizar({ cidade }) }),
    }),
    conteudo,
    Footer()
);

window.addEventListener("hashchange", rotear);
rotear();
