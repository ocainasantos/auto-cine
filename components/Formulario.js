import { criar } from "./dom.js";

// Campo com rótulo, ajuda opcional (abaixo do controle, para alinhar campos lado a lado) e mensagem de erro.
// tag: "input" | "select" | "textarea"; opcoes: [[valor, texto]] para select.
// largo: ocupa a linha inteira; duplo: ocupa 2 colunas (linha inteira em telas menores).
export function Campo({ id, rotulo, tag = "input", tipo = "text", ajuda, opcoes, largo = false, duplo = false, atributos = {} }) {
    const raiz = criar("div", "campo");
    if (largo) raiz.classList.add("campo--largo");
    else if (duplo) raiz.classList.add("campo--duplo");
    const label = criar("label", "campo__rotulo", rotulo);
    label.htmlFor = id;

    const controle = criar(tag, "campo__controle");
    controle.id = id;
    controle.name = id;
    if (tag === "input") controle.type = tipo;
    if (opcoes) {
        controle.append(...opcoes.map(([valor, texto]) => {
            const opcao = criar("option", "", texto);
            opcao.value = valor;
            return opcao;
        }));
    }
    Object.entries(atributos).forEach(([nome, valor]) => controle.setAttribute(nome, valor));

    const erro = criar("p", "campo__erro");
    erro.id = `${id}-erro`;
    const descritores = [erro.id];

    raiz.append(label, controle);
    if (ajuda) {
        const textoAjuda = criar("p", "campo__ajuda", ajuda);
        textoAjuda.id = `${id}-ajuda`;
        descritores.unshift(textoAjuda.id);
        raiz.append(textoAjuda);
    }
    controle.setAttribute("aria-describedby", descritores.join(" "));
    raiz.append(erro);
    return raiz;
}

export function limparErros(form) {
    form.querySelectorAll(".campo__erro, .form__erro").forEach(p => { p.textContent = ""; });
    form.querySelectorAll("[aria-invalid]").forEach(el => el.removeAttribute("aria-invalid"));
}

// erros: { idDoCampo: "mensagem" }; a chave "_form" vai para a mensagem geral.
export function mostrarErros(form, erros) {
    let primeiro = null;
    Object.entries(erros).forEach(([id, mensagem]) => {
        if (id === "_form") {
            form.querySelector(".form__erro").textContent = mensagem;
            return;
        }
        const controle = form.querySelector(`#${id}`);
        const erro = form.querySelector(`#${id}-erro`);
        if (erro) erro.textContent = mensagem;
        if (controle) {
            controle.setAttribute("aria-invalid", "true");
            primeiro ??= controle;
        }
    });
    primeiro?.focus();
}

// aoEnviar(valores, form) pode devolver um objeto de erros (ou nada, se deu certo).
export function Formulario({ campos, textoBotao, aoEnviar }) {
    const form = criar("form", "form");
    form.noValidate = true;

    const grade = criar("div", "form__campos");
    grade.append(...campos);

    const geral = criar("p", "form__erro");
    geral.setAttribute("role", "alert");
    const botao = criar("button", "botao", textoBotao);
    botao.type = "submit";
    const acoes = criar("div", "form__acoes");
    acoes.append(geral, botao);

    form.append(grade, acoes);

    form.addEventListener("input", e => {
        const campo = e.target.closest(".campo");
        if (!campo) return;
        campo.querySelector(".campo__erro").textContent = "";
        e.target.removeAttribute("aria-invalid");
    });

    form.addEventListener("submit", async e => {
        e.preventDefault();
        limparErros(form);
        botao.disabled = true;
        try {
            const valores = Object.fromEntries([...new FormData(form)].map(([k, v]) => [k, String(v).trim()]));
            const erros = await aoEnviar(valores, form);
            if (erros && Object.keys(erros).length) mostrarErros(form, erros);
        } catch (erro) {
            console.error(erro);
            mostrarErros(form, { _form: erro.message || "Não foi possível salvar. Tente novamente." });
        } finally {
            botao.disabled = false;
        }
    });

    return form;
}
