import { listar, adicionar } from "./repositorio.js";

// Autenticação simulada no navegador: serve para separar as telas, não protege dados de verdade.
const SESSAO = "autocine:sessao";
// usuario@dominio.tld, sem espaços; qualquer provedor.
export const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
export const SENHA_MINIMA = 8;

async function gerarHash(texto) {
    const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
    return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, "0")).join("");
}

export async function existeAdmin() {
    return (await listar("admins")).length > 0;
}

export async function cadastrarAdmin({ nome, email, senha }) {
    const emailNormalizado = email.trim().toLowerCase();
    const admins = await listar("admins");
    if (admins.some(a => a.email === emailNormalizado)) throw new Error("Já existe um admin com este e-mail.");
    const admin = await adicionar("admins", { nome: nome.trim(), email: emailNormalizado, senha: await gerarHash(senha) });
    return { id: admin.id, nome: admin.nome, email: admin.email };
}

export async function entrar(email, senha) {
    const emailNormalizado = email.trim().toLowerCase();
    const hash = await gerarHash(senha);
    const admin = (await listar("admins")).find(a => a.email === emailNormalizado && a.senha === hash);
    if (!admin) return null;
    const sessao = { id: admin.id, nome: admin.nome, email: admin.email };
    sessionStorage.setItem(SESSAO, JSON.stringify(sessao));
    return sessao;
}

export function sessaoAtual() {
    try {
        return JSON.parse(sessionStorage.getItem(SESSAO));
    } catch {
        return null;
    }
}

export function sair() {
    sessionStorage.removeItem(SESSAO);
}
