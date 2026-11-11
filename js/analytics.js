/* ==========================================================================
   LOGICA CENTRALIZADA DO GOOGLE ANALYTICS (MODO MODULAR)
   ========================================================================== */
(function () {
  // 1. Definição de ambientes de teste
  const hostname = window.location.hostname;
  const isLocal =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.includes("192.168"); // Pega IP da rede local tb

  // 2. Captura o parâmetro na URL
  const urlParams = new URLSearchParams(window.location.search);
  const hasTestParam = urlParams.has("teste"); // Verifica se existe 'teste' na URL

  // 3. Se o parâmetro existir (ex: ?teste=true ou apenas ?teste), ativa a persistência
  if (hasTestParam) {
    sessionStorage.setItem("modo_teste_trufos", "ativo");
    console.log("Trufos Dev: Modo teste ATIVADO e salvo na sessão.");
  }

  // 4. Verifica se a sessão já estava marcada como teste
  const isTestSession = sessionStorage.getItem("modo_teste_trufos") === "ativo";

  // 5. Decisão Final
  if (isLocal || isTestSession) {
    console.log("Analytics Trufos: BLOQUEADO (Local ou Sessão de Teste)");
    // Se for teste, saímos da função e não carregamos nada do Google
    return;
  }

  // 6. Se passou pelas travas, carrega o Google Analytics
  console.log("Analytics Trufos: ATIVO (Monitorando tráfego real)");

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://www.googletagmanager.com/gtag/js?id=G-ENVZ0TNVJK";
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
  gtag("js", new Date());
  gtag("config", "G-ENVZ0TNVJK");
})();
