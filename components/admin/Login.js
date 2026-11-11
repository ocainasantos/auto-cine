import { criar } from "../dom.js";
import { Campo, Formulario } from "../Formulario.js";

// primeiroAcesso: sem nenhum admin cadastrado, a tela cria o primeiro em vez de pedir login.
// aoEnviar(valores) devolve erros ou nada.
export function Login({ primeiroAcesso, aoEnviar }) {
    const main = criar("main", "login");
    const caixa = criar("div", "login__caixa");

    const logo = criar("a", "logo", "ACine");
    logo.href = "#/";
    const titulo = criar("h1", "login__titulo", primeiroAcesso ? "Primeiro acesso" : "Área do administrador");
    const texto = primeiroAcesso
        ? "Nenhum administrador cadastrado. Cadastre o primeiro para acessar o painel."
        : "Informe suas credenciais para entrar.";

    const campos = [
        Campo({ id: "login-email", rotulo: "E-mail", tipo: "email", largo: true, atributos: { maxlength: 100, autocomplete: "username", placeholder: "nome@exemplo.com" } }),
        Campo({ id: "login-senha", rotulo: "Senha", tipo: "password", largo: true, atributos: { maxlength: 64, autocomplete: primeiroAcesso ? "new-password" : "current-password" } }),
    ];
    if (primeiroAcesso) {
        campos.unshift(Campo({ id: "login-nome", rotulo: "Nome", largo: true, atributos: { maxlength: 100, autocomplete: "name" } }));
    }

    caixa.append(
        logo,
        titulo,
        criar("p", "login__texto", texto),
        Formulario({ campos, textoBotao: primeiroAcesso ? "Cadastrar e entrar" : "Entrar", aoEnviar })
    );
    main.append(caixa);
    return main;
}
