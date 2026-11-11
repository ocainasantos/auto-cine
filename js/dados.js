import { listar, adicionar } from "./repositorio.js";

export const ESTADOS = {
    AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas",
    BA: "Bahia", CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo",
    GO: "Goiás", MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul",
    MG: "Minas Gerais", PA: "Pará", PB: "Paraíba", PR: "Paraná",
    PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro", RN: "Rio Grande do Norte",
    RS: "Rio Grande do Sul", RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina",
    SP: "São Paulo", SE: "Sergipe", TO: "Tocantins"
};

export const HORARIO = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATA_ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

export const moeda = valor => Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function lerData(iso) {
    const m = DATA_ISO.exec(String(iso));
    if (!m) return null;
    const data = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return data.getDate() === Number(m[3]) ? data : null;
}

export function dataIso(data) {
    const p = n => String(n).padStart(2, "0");
    return `${data.getFullYear()}-${p(data.getMonth() + 1)}-${p(data.getDate())}`;
}

export const dataCurta = data => data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

// Um evento é uma publicação: filme + fornecedor (local) + datas, horários, valor e vagas.
export class Filme {
    constructor({ publicacao, filme, fornecedor }) {
        this.id = Number(publicacao.id);
        this.filmeId = Number(filme.id);
        this.nome = filme.nome;
        this.classificacao = filme.classificacao;
        this.genero = filme.genero;
        this.duracao = filme.duracao;
        this.datalancamento = filme.datalancamento;
        this.direcao = filme.direcao || "";
        this.elenco = filme.elenco;
        this.sinopse = filme.sinopse;
        this.imageurl = filme.imageurl;
        this.banner = filme.banner;

        this.estacionamento = fornecedor.nome;
        this.endereco = fornecedor.endereco;
        this.cidade = fornecedor.cidade;
        this.uf = String(fornecedor.uf).toUpperCase();
        this.fornecedorId = Number(fornecedor.id);
        this.localAtivo = fornecedor.ativo !== false;

        this.sessoes = [...new Set(publicacao.datas || [])]
            .map(lerData)
            .filter(Boolean)
            .sort((a, b) => a - b);
        this.horarios = [...new Set(publicacao.horarios || [])].filter(h => HORARIO.test(h)).sort();
        this.vagas = Number.isInteger(publicacao.vagas) && publicacao.vagas > 0 ? publicacao.vagas : null;
        this.ativo = publicacao.ativo !== false;
        this.carrossel = publicacao.carrossel === true;
        const valor = Number(publicacao.valor);
        this.ingressos = [
            { tipo: "Inteira", preco: valor },
            { tipo: "Meia-entrada", preco: valor / 2 },
        ];
    }

    get cidadeUf() { return this.uf ? `${this.cidade} - ${this.uf}` : this.cidade; }
    get estado() { return ESTADOS[this.uf] || this.uf || "Outros"; }
    get local() { return `${this.estacionamento} (${this.endereco}, ${this.cidade}, ${this.uf})`; }
}

// O site só recebe eventos ativos em locais ativos; o admin pede incluirInativos para gerenciar todos.
export async function carregarEventos({ incluirInativos = false } = {}) {
    const [publicacoes, filmes, fornecedores] = await Promise.all([
        listar("publicacoes"), listar("filmes"), listar("fornecedores"),
    ]);
    const porId = lista => new Map(lista.map(item => [Number(item.id), item]));
    const filmesPorId = porId(filmes);
    const fornecedoresPorId = porId(fornecedores);
    return publicacoes
        .map(publicacao => ({
            publicacao,
            filme: filmesPorId.get(Number(publicacao.filmeId)),
            fornecedor: fornecedoresPorId.get(Number(publicacao.fornecedorId)),
        }))
        .filter(({ filme, fornecedor }) => filme && fornecedor)
        .map(partes => new Filme(partes))
        .filter(evento => incluirInativos || (evento.ativo && evento.localAtivo));
}

// Ingressos vendidos por sessão ("AAAA-MM-DD HH:MM") de um evento.
export async function vendidosPorSessao(eventoId) {
    const vendidos = new Map();
    (await listar("compras"))
        .filter(c => Number(c.publicacaoId) === Number(eventoId))
        .forEach(c => {
            const sessao = `${c.data} ${c.horario}`;
            vendidos.set(sessao, (vendidos.get(sessao) || 0) + 1);
        });
    return vendidos;
}

const ALFANUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

// Registra a compra se ainda houver vaga na sessão. Devolve { compra } ou { erro }.
export async function registrarCompra({ evento, data, horario, ingresso, nome, placa }) {
    const vendidos = await vendidosPorSessao(evento.id);
    if (evento.vagas !== null && (vendidos.get(`${dataIso(data)} ${horario}`) || 0) >= evento.vagas) {
        return { erro: "As vagas deste horário esgotaram. Escolha outro horário." };
    }
    const bytes = crypto.getRandomValues(new Uint8Array(6));
    const compra = await adicionar("compras", {
        publicacaoId: evento.id,
        filmeId: evento.filmeId,
        data: dataIso(data),
        horario,
        ingresso: ingresso.tipo,
        valor: ingresso.preco,
        nome,
        placa,
        codigo: "AC-" + Array.from(bytes, b => ALFANUM[b % ALFANUM.length]).join(""),
        criadoEm: new Date().toISOString(),
    });
    return { compra };
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
