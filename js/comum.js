const ESTADOS = {
    AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas",
    BA: "Bahia", CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo",
    GO: "Goiás", MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul",
    MG: "Minas Gerais", PA: "Pará", PB: "Paraíba", PR: "Paraná",
    PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro", RN: "Rio Grande do Norte",
    RS: "Rio Grande do Sul", RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina",
    SP: "São Paulo", SE: "Sergipe", TO: "Tocantins"
};

class Filme {
    constructor(dados) {
        this.nome = dados.nome;
        this.classificacao = dados.classificacao;
        this.genero = dados.genero;
        this.duracao = dados.duracao;
        this.datalancamento = dados.datalancamento;
        this.direcao = dados.direcao || "";
        this.elenco = dados.elenco;
        this.sinopse = dados.sinopse;
        this.imageurl = dados.imageurl;
        this.banner = dados.banner;

        const partes = String(dados.cidade || "").split(" - ");
        this.cidade = partes[0].trim();
        this.uf = (dados.uf || partes[1] || "").trim().toUpperCase();
    }

    get cidadeUf() { return this.uf ? `${this.cidade} - ${this.uf}` : this.cidade; }
    get estado() { return ESTADOS[this.uf] || this.uf || "Outros"; }

    get duracaoEmMinutos() {
        const m = /^(\d{1,2})h(\d{2})$/.exec(this.duracao);
        return m ? Number(m[1]) * 60 + Number(m[2]) : null;
    }

    get dataDeLancamento() {
        const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(this.datalancamento);
        return m ? new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])) : null;
    }

    get elencoEmLista() { return this.elenco.split(",").map(n => n.trim()).filter(Boolean); }
    get protagonista() { return this.elencoEmLista[0] || ""; }

    sinopseCurta(limite = 140) {
        return this.sinopse.length <= limite ? this.sinopse : `${this.sinopse.slice(0, limite).trimEnd()}…`;
    }

    criarCard(id) {
        const card = document.createElement("article");
        card.className = "card-filme";
        card.style.cursor = "pointer";
        card.title = `${this.nome} — ${this.genero} — ${this.classificacao}`;
        card.addEventListener("click", () => { window.location.href = `filme.html?id=${id}`; });

        const poster = document.createElement("div");
        poster.className = "card-filme__poster";

        if (this.imageurl) {
            const img = document.createElement("img");
            img.src = this.imageurl;
            img.alt = `Pôster do filme ${this.nome}`;
            img.loading = "lazy";
            poster.appendChild(img);
        }

        const info = document.createElement("div");
        info.className = "card-filme__info";

        const titulo = document.createElement("h3");
        titulo.className = "card-filme__nome";
        titulo.textContent = this.nome;

        const meta = document.createElement("div");
        meta.className = "card-filme__meta";
        const generoEl = document.createElement("span");
        generoEl.textContent = this.genero;
        const duracaoEl = document.createElement("span");
        duracaoEl.textContent = this.duracao;
        meta.append(generoEl, duracaoEl);

        info.append(titulo, meta);
        card.append(poster, info);
        return card;
    }
}

function renderizarFooter() {
    const footer = document.createElement("footer");
    footer.className = "site-footer";
    footer.innerHTML = `
        <div class="footer-inner container">
            <a class="logo" href="index.html">ACine</a>
            <div class="footer-contato">
                <span class="footer-contato__label">Contate-nos</span>
                <a href="mailto:contato@autocine.com.br" class="footer-contato__email">contato@autocine.com.br</a>
            </div>
        </div>`;
    document.body.appendChild(footer);
}

function renderizarHeader(logoHref = "index.html") {
    const header = document.createElement("header");
    header.className = "site-header";
    header.innerHTML = `
        <div class="header-inner container">
            <a class="logo" href="${logoHref}">ACine</a>
            <form class="search" role="search" action="#">
                <svg class="search-icon" viewBox="0 0 25 25" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">
                    <circle cx="9" cy="9" r="7.75"></circle>
                    <line x1="14.6" y1="14.6" x2="23.7" y2="23.7"></line>
                </svg>
                <input class="search-input" type="search" aria-label="Buscar filmes">
            </form>
            <nav class="main-nav" aria-label="Menu principal">
                <a href="index.html">Filmes</a>
                <a href="#">Programação</a>
            </nav>
            <div class="filtro-cidade">
                <button class="city-filter" type="button" id="filtro-cidade-botao"
                    aria-expanded="false" aria-haspopup="listbox" aria-controls="filtro-cidade-lista">
                    <span>Filtrar por Cidade</span>
                    <svg class="caret" viewBox="0 0 18 10" aria-hidden="true">
                        <path d="M0 0h18L9 10z" fill="currentColor"></path>
                    </svg>
                </button>
                <div class="filtro-cidade__painel" id="filtro-cidade-lista"
                    role="listbox" aria-label="Filtrar por cidade" hidden></div>
            </div>
        </div>`;
    document.body.insertBefore(header, document.body.firstChild);
}

async function carregarFilmes() {
    const res = await fetch("data/filmes.json");
    if (!res.ok) throw new Error(`Falha ao carregar o catálogo: ${res.status}`);
    return (await res.json()).map(r => new Filme(r));
}

