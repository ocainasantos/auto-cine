import { criar, deTemplate } from "../dom.js";

export const LINKS_ADMIN = [
    ["#/admin/painel", "Painel"],
    ["#/admin/filmes/novo", "Cadastrar filme"],
    ["#/admin/publicar", "Publicar filme"],
    ["#/admin/publicados", "Filmes publicados"],
    ["#/admin/fornecedores/novo", "Cadastrar fornecedor"],
    ["#/admin/fornecedores", "Fornecedores"],
    ["#/admin/admins/novo", "Novo admin"],
];

export function AdminLayout({ sessao, rota, conteudo, aoSair }) {
    const header = deTemplate(`
        <header class="site-header">
            <div class="header-inner admin-header container">
                <a class="logo" href="#/admin/painel">ACine <span class="admin-tag">Admin</span></a>
                <div class="admin-usuario">
                    <span class="admin-usuario__nome"></span>
                    <a class="admin-link" href="#/">Ver site</a>
                    <button class="admin-sair" type="button">Sair</button>
                </div>
            </div>
            <nav class="admin-nav" aria-label="Menu do administrador">
                <div class="admin-nav__inner container"></div>
            </nav>
        </header>`);

    header.querySelector(".admin-usuario__nome").textContent = sessao.nome;
    header.querySelector(".admin-sair").addEventListener("click", aoSair);
    // Sem link exato (ex.: #/admin/publicados/3/editar), marca o link cuja rota é o início da atual.
    const atual = LINKS_ADMIN.find(([href]) => href === rota)?.[0]
        ?? LINKS_ADMIN.find(([href]) => rota.startsWith(`${href}/`))?.[0];
    header.querySelector(".admin-nav__inner").append(...LINKS_ADMIN.map(([href, texto]) => {
        const link = criar("a", "admin-nav__link", texto);
        link.href = href;
        if (href === atual) link.setAttribute("aria-current", "page");
        return link;
    }));

    // Roda depois que o main.js insere o layout na página: centraliza o item ativo no menu rolável.
    queueMicrotask(() => {
        const menu = header.querySelector(".admin-nav__inner");
        const ativo = menu.querySelector("[aria-current='page']");
        if (ativo && menu.scrollWidth > menu.clientWidth) {
            menu.scrollLeft = ativo.offsetLeft - (menu.clientWidth - ativo.offsetWidth) / 2;
        }
    });

    const main = criar("main", "admin-main");
    const inner = criar("div", "container");
    inner.append(conteudo);
    main.append(inner);

    const raiz = criar("div", "admin");
    raiz.append(header, main);
    return raiz;
}

export function AdminPagina({ titulo, descricao, filhos }) {
    const secao = criar("section", "admin-pagina");
    secao.append(criar("h1", "admin-titulo", titulo));
    if (descricao) secao.append(criar("p", "admin-descricao", descricao));
    secao.append(...filhos);
    return secao;
}
