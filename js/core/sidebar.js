(function () {
  function iniciarSidebar() {
    if (document.getElementById("sidebar")) return;

    const path = window.location.pathname;
    let paginaAtual = "index";
    if (path.includes("ordens-servico")) paginaAtual = "os";
    else if (path.includes("clientes")) paginaAtual = "clientes";
    else if (path.includes("equipamentos")) paginaAtual = "equipamentos";
    else if (path.includes("produtos-servicos")) paginaAtual = "produtos";
    else if (path.includes("configuracoes")) paginaAtual = "configuracoes";

    const sidebarHTML = `
      <nav class="sidebar" id="sidebar" style="transition: width 0.3s ease;">
        <div class="sidebar-header" style="padding: 15px; text-align: center">
          <img src="img/logo.png" alt="Trufos" style="max-width: 140px; height: auto" class="menu-text" />
        </div>

        <div class="menu-links">
          <a href="index.html" class="menu-item ${paginaAtual === "index" ? "active" : ""}">
            <i>🏠</i> <span class="menu-text">Painel Principal</span>
          </a>
          <a href="ordens-servico.html" class="menu-item ${paginaAtual === "os" ? "active" : ""}">
            <i>🛠️</i> <span class="menu-text">Ordens de Serviço</span>
          </a>
          <a href="clientes.html" class="menu-item ${paginaAtual === "clientes" ? "active" : ""}">
            <i>👥</i> <span class="menu-text">Clientes</span>
          </a>
          <a href="equipamentos.html" class="menu-item ${paginaAtual === "equipamentos" ? "active" : ""}">
            <i>🔬</i> <span class="menu-text">Equipamentos</span>
          </a>
          <a href="produtos-servicos.html" class="menu-item ${paginaAtual === "produtos" ? "active" : ""}">
            <i>📦</i> <span class="menu-text">Produtos e Serviços</span>
          </a>
          <a href="configuracoes.html" class="menu-item ${paginaAtual === "configuracoes" ? "active" : ""}">
            <i>⚙️</i> <span class="menu-text">Configurações</span>
          </a>
        </div>

        <button class="sidebar-toggle"><i>≡</i></button>
      </nav>
    `;

    document.body.insertAdjacentHTML("afterbegin", sidebarHTML);

    const sidebar = document.getElementById("sidebar");
    const toggleBtn = sidebar.querySelector(".sidebar-toggle");
    const mainContent = document.querySelector(".main-content");
    const textos = sidebar.querySelectorAll(".menu-text");

    function aplicarEstado(recolhido) {
      if (recolhido) {
        sidebar.classList.add("collapsed", "recolhida");
        sidebar.style.width = "70px";
        sidebar.style.minWidth = "70px";
        textos.forEach((el) => (el.style.display = "none"));
        if (mainContent) mainContent.style.marginLeft = "70px";
      } else {
        sidebar.classList.remove("collapsed", "recolhida");
        sidebar.style.width = "";
        sidebar.style.minWidth = "";
        // Garante que o display volta a ser flex/inline apropriado para os textos aparecerem
        textos.forEach((el) => (el.style.display = ""));
        if (mainContent) mainContent.style.marginLeft = "";
      }
    }

    // Restaura o estado salvo ao carregar
    const estaRecolhido = localStorage.getItem("sidebar_collapsed") === "true";
    aplicarEstado(estaRecolhido);

    // Alterna ao clicar no botão
    toggleBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const novoEstado = !sidebar.classList.contains("collapsed");
      aplicarEstado(novoEstado);
      localStorage.setItem("sidebar_collapsed", novoEstado);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarSidebar);
  } else {
    iniciarSidebar();
  }
})();
