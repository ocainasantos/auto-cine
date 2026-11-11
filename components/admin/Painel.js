import { criar } from "../dom.js";
import { AdminPagina } from "./AdminLayout.js";

function Indicador({ rotulo, valor, href, acao }) {
    const card = criar("article", "painel__card");
    const link = criar("a", "painel__link", acao);
    link.href = href;
    card.append(criar("p", "painel__rotulo", rotulo), criar("p", "painel__valor", valor), link);
    return card;
}

export function Painel({ publicados, fornecedores, valorMovimentado, ingressosVendidos }) {
    const grade = criar("div", "painel");
    grade.append(
        Indicador({ rotulo: "Filmes publicados", valor: String(publicados), href: "#/admin/publicados", acao: "Ver publicados" }),
        Indicador({ rotulo: "Fornecedores cadastrados", valor: String(fornecedores), href: "#/admin/fornecedores", acao: "Ver fornecedores" }),
        Indicador({ rotulo: "Valores movimentados", valor: valorMovimentado, href: "#/admin/publicados", acao: `${ingressosVendidos} ingresso(s) vendido(s)` })
    );
    return AdminPagina({ titulo: "Painel", descricao: "Resumo do AutoCine.", filhos: [grade] });
}
