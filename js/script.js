function agruparPorCidade(filmes) {
    const grupos = new Map();
    filmes
        .slice()
        .sort((a, b) => a.estado.localeCompare(b.estado) || a.cidade.localeCompare(b.cidade))
        .forEach(filme => {
            if (!grupos.has(filme.cidadeUf)) {
                grupos.set(filme.cidadeUf, { rotulo: filme.cidadeUf, estado: filme.estado, filmes: [] });
            }
            grupos.get(filme.cidadeUf).filmes.push(filme);
        });
    return [...grupos.values()];
}

function renderizarCatalogo(grupos, filmes) {
    const alvo = document.querySelector("[data-catalogo]");
    if (!alvo) return;
    alvo.replaceChildren();

    if (!grupos.length) {
        const aviso = document.createElement("p");
        aviso.className = "catalogo__aviso";
        aviso.textContent = "Nenhum filme em cartaz para essa cidade.";
        alvo.appendChild(aviso);
        return;
    }

    grupos.forEach(grupo => {
        const secao = document.createElement("section");
        secao.className = "secao";
        secao.dataset.cidade = grupo.rotulo;

        const titulo = document.createElement("h2");
        titulo.className = "secao__titulo";
        titulo.textContent = grupo.rotulo;

        const grade = document.createElement("div");
        grade.className = "secao__grade";

        grupo.filmes.forEach(filme => grade.appendChild(filme.criarCard(filmes.indexOf(filme))));

        secao.append(titulo, grade);
        alvo.appendChild(secao);
    });
}

class FiltroCidade {
    constructor(botao, painel, grupos, aoSelecionar) {
        this.botao = botao;
        this.painel = painel;
        this.grupos = grupos;
        this.aoSelecionar = aoSelecionar;
        this.cidadeAtual = "";
        this.montar();
        this.registrarEventos();
    }

    montar() {
        const frag = document.createDocumentFragment();
        frag.appendChild(this.criarOpcao("", "Todas as cidades"));

        let estadoAtual = "";
        this.grupos.forEach(grupo => {
            if (grupo.estado !== estadoAtual) {
                estadoAtual = grupo.estado;
                const cab = document.createElement("div");
                cab.className = "filtro-cidade__estado";
                cab.textContent = estadoAtual;
                frag.appendChild(cab);
            }
            frag.appendChild(this.criarOpcao(grupo.rotulo, grupo.rotulo.split(" - ")[0]));
        });

        this.painel.replaceChildren(frag);
    }

    criarOpcao(valor, texto) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "filtro-cidade__opcao";
        btn.setAttribute("role", "option");
        btn.dataset.cidade = valor;
        btn.setAttribute("aria-selected", String(valor === this.cidadeAtual));
        btn.textContent = texto;
        return btn;
    }

    registrarEventos() {
        this.botao.addEventListener("click", () => this.alternar());
        this.painel.addEventListener("click", e => {
            const opcao = e.target.closest(".filtro-cidade__opcao");
            if (opcao) this.selecionar(opcao.dataset.cidade);
        });
        document.addEventListener("click", e => {
            if (!this.painel.hidden && !this.botao.contains(e.target) && !this.painel.contains(e.target))
                this.fechar();
        });
        document.addEventListener("keydown", e => {
            if (e.key === "Escape" && !this.painel.hidden) { this.fechar(); this.botao.focus(); }
        });
    }

    alternar() {
        this.painel.hidden = !this.painel.hidden;
        this.botao.setAttribute("aria-expanded", String(!this.painel.hidden));
    }

    fechar() {
        this.painel.hidden = true;
        this.botao.setAttribute("aria-expanded", "false");
    }

    selecionar(cidade) {
        this.cidadeAtual = cidade;
        this.painel.querySelectorAll(".filtro-cidade__opcao").forEach(op =>
            op.setAttribute("aria-selected", String(op.dataset.cidade === cidade))
        );
        this.fechar();
        this.aoSelecionar(cidade);
    }
}

function renderizarCarrossel(filmes) {
    const slidesEl = document.getElementById("carrossel-slides");
    const dotsEl = document.getElementById("carrossel-dots");
    const prevBtn = document.getElementById("carrossel-prev");
    const nextBtn = document.getElementById("carrossel-next");
    if (!slidesEl) return;

    slidesEl.replaceChildren();
    dotsEl.replaceChildren();

    filmes.slice(0, 4).forEach((filme, idx) => {
        const slide = document.createElement("div");
        slide.className = `carrossel__slide${idx === 0 ? " active" : ""}`;

        const bg = document.createElement("div");
        bg.className = "carrossel__tela";
        bg.style.backgroundImage = `url(${filme.banner || filme.imageurl || ""})`;

        const info = document.createElement("div");
        info.className = "carrossel__info";
        info.innerHTML = `<span class="carrossel__nome">${filme.nome}</span><span class="carrossel__meta">${filme.genero} · ${filme.duracao}</span>`;

        slide.append(bg, info);
        slidesEl.appendChild(slide);

        const dot = document.createElement("div");
        dot.className = `carrossel__dot${idx === 0 ? " active" : ""}`;
        dot.addEventListener("click", () => irPara(idx));
        dotsEl.appendChild(dot);
    });

    let atual = 0;

    function irPara(idx) {
        const slides = slidesEl.querySelectorAll(".carrossel__slide");
        const dots = dotsEl.querySelectorAll(".carrossel__dot");
        if (idx < 0) idx = slides.length - 1;
        if (idx >= slides.length) idx = 0;
        slides[atual].classList.remove("active");
        dots[atual].classList.remove("active");
        atual = idx;
        slides[atual].classList.add("active");
        dots[atual].classList.add("active");
    }

    if (prevBtn) prevBtn.onclick = () => { irPara(atual - 1); reiniciarAuto(); };
    if (nextBtn) nextBtn.onclick = () => { irPara(atual + 1); reiniciarAuto(); };

    let timer = setInterval(() => irPara(atual + 1), 5000);

    function reiniciarAuto() {
        clearInterval(timer);
        timer = setInterval(() => irPara(atual + 1), 5000);
    }
}

function normalizar(str) {
    return String(str).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function ehSubsequencia(query, texto) {
    let i = 0;
    for (const ch of texto) {
        if (ch === query[i]) i++;
        if (i === query.length) return true;
    }
    return false;
}

function pontuar(filme, query) {
    const campos = [filme.nome, filme.genero, filme.elenco, filme.direcao];
    const textos = campos.map(normalizar);
    const nome = textos[0];
    const todos = normalizar(campos.join(" "));
    const palavras = query.split(/\s+/).filter(Boolean);

    // correspondência exata no nome
    if (nome === query) return 100;
    // substring contínua no nome
    if (nome.includes(query)) return 90;
    // substring contínua em qualquer campo
    if (todos.includes(query)) return 75;
    // todas as palavras da busca aparecem em algum campo
    if (palavras.every(p => todos.includes(p))) return 60;
    // pelo menos uma palavra aparece
    const acertos = palavras.filter(p => todos.includes(p)).length;
    if (acertos > 0) return 40 * (acertos / palavras.length);
    // subsequência de caracteres no nome (letras espalhadas na ordem)
    if (query.length >= 2 && ehSubsequencia(query, nome)) return 20;

    return 0;
}

function filtrar(filmes, cidade, termo) {
    let res = cidade ? filmes.filter(f => f.cidadeUf === cidade) : filmes;
    const query = normalizar(termo);
    if (!query) return res;

    return res
        .map(f => ({ f, pts: pontuar(f, query) }))
        .filter(({ pts }) => pts > 0)
        .sort((a, b) => b.pts - a.pts)
        .map(({ f }) => f);
}

async function iniciar() {
    renderizarHeader("#");

    const alvo = document.querySelector("[data-catalogo]");

    try {
        const filmes = await carregarFilmes();
        const grupos = agruparPorCidade(filmes);

        renderizarCarrossel(filmes);
        renderizarCatalogo(grupos, filmes);

        const buscaInput = document.querySelector(".search-input");
        const botao = document.getElementById("filtro-cidade-botao");
        const painel = document.getElementById("filtro-cidade-lista");

        function atualizar() {
            const cidade = painel?.querySelector("[aria-selected='true']")?.dataset.cidade || "";
            const termo = buscaInput?.value.toLowerCase().trim() || "";
            renderizarCatalogo(agruparPorCidade(filtrar(filmes, cidade, termo)), filmes);
        }

        buscaInput?.addEventListener("input", atualizar);

        if (botao && painel) {
            new FiltroCidade(botao, painel, grupos, atualizar);
        }
    } catch (erro) {
        console.error(erro);
        if (alvo) {
            const aviso = document.createElement("p");
            aviso.className = "catalogo__aviso";
            aviso.textContent = "Não foi possível carregar o catálogo de filmes.";
            alvo.replaceChildren(aviso);
        }
    }

    renderizarFooter();
}

document.addEventListener("DOMContentLoaded", iniciar);
