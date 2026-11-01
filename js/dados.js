const ESTADOS = {
    AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas",
    BA: "Bahia", CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo",
    GO: "Goiás", MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul",
    MG: "Minas Gerais", PA: "Pará", PB: "Paraíba", PR: "Paraná",
    PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro", RN: "Rio Grande do Norte",
    RS: "Rio Grande do Sul", RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina",
    SP: "São Paulo", SE: "Sergipe", TO: "Tocantins"
};

export class Filme {
    constructor(dados) {
        this.id = Number(dados.id);
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
}

export async function carregarFilmes() {
    const res = await fetch("data/filmes.json");
    if (!res.ok) throw new Error(`Falha ao carregar o catálogo: ${res.status}`);
    return (await res.json()).map(r => new Filme(r));
}

export function agruparPorCidade(filmes) {
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
