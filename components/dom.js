export function criar(tag, className = "", texto) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (texto !== undefined) el.textContent = texto;
    return el;
}

export function deTemplate(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
}
