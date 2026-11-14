// js/auth.js - Controle de Sessão e Autenticação do ERP Trufos

const TOKEN_KEY = "trufos_erp_auth";
const EXPIRATION_HOURS = 24;

function verificarAutenticacao() {
  const authData = localStorage.getItem(TOKEN_KEY);

  if (!authData) {
    redirecionarParaLogin();
    return;
  }

  try {
    const session = JSON.parse(authData);
    const agora = new Date().getTime();

    // Verifica se o token expirou (24 horas)
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
  // Se já não estivermos na página de login, redireciona
  if (!window.location.pathname.endsWith("login.html")) {
    window.location.href = "login.html";
  }
}

// Executa a verificação assim que o script é carregado nas páginas protegidas
verificarAutenticacao();
