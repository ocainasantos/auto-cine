import { deTemplate } from "./dom.js";

export function Footer() {
    return deTemplate(`
        <footer class="site-footer">
            <div class="footer-inner container">
                <a class="logo" href="#/">ACine</a>
                <div class="footer-contato">
                    <span class="footer-contato__label">Contate-nos</span>
                    <a href="mailto:contato@autocine.com.br" class="footer-contato__email">contato@autocine.com.br</a>
                    <a href="#/admin" class="footer-admin">Área do admin</a>
                </div>
            </div>
        </footer>`);
}
