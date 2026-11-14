// js/core/auth.js - Controle de Sessão e Autenticação do ERP Trufos

const TOKEN_KEY = "trufos_erp_auth";

function verificarAutenticacao() {
  const authData = localStorage.getItem(TOKEN_KEY);

  if (!authData) {
    redirecionarParaLogin();
    return;
  }

  try {
    const session = JSON.parse(authData);
    const agora = new Date().getTime();

    if (agora > session.expiresAt) {
      localStorage.removeItem(TOKEN_KEY);
      redirecionarParaLogin();
    }
  } catch (e) {
    localStorage.removeItem(TOKEN_KEY);
    redirecionarParaLogin();
  }
}

function redirecionarParaLogin() {
  if (!window.location.pathname.endsWith("login.html")) {
    window.location.href = "login.html";
  }
}

verificarAutenticacao();
