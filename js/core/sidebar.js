(function () {
  function iniciarSidebar() {
    if (document.getElementById("sidebar")) return;

    const path = window.location.pathname;
    let paginaAtual = "index";
    if (path.includes("ordens-servico")) paginaAtual = "os";
    else if (path.includes("clientes")) paginaAtual = "clientes";
    else if (path.includes("fornecedores")) paginaAtual = "fornecedores";
    else if (path.includes("equipamentos")) paginaAtual = "equipamentos";
    else if (path.includes("produtos")) paginaAtual = "produtos";
    else if (path.includes("servicos")) paginaAtual = "servicos";
    else if (path.includes("configuracoes")) paginaAtual = "configuracoes";

    const sidebarHTML = `
      <!-- Botão Hamburger Mobile flutuante -->
      <button class="mobile-menu-btn" aria-label="Abrir Menu"><i>☰</i></button>
      <div class="sidebar-overlay"></div>

      <nav class="sidebar" id="sidebar" style="transition: width 0.3s ease, left 0.3s ease;">
        <div class="sidebar-header" style="padding: 15px; text-align: center">
          <img src="img/logo.png" alt="Trufos" style="max-width: 140px; height: auto" class="menu-text" />
        </div>

        <div class="menu-links">
          <a href="index.html" class="menu-item ${paginaAtual === "index" ? "active" : ""}">
            🏠 <span class="menu-text">Painel Principal</span>
          </a>
          <a href="ordens-servico.html" class="menu-item ${paginaAtual === "os" ? "active" : ""}">
            🛠️ <span class="menu-text">Ordens de Serviço</span>
          </a>
          <a href="clientes.html" class="menu-item ${paginaAtual === "clientes" ? "active" : ""}">
            👥 <span class="menu-text">Clientes</span>
          </a>
          <a href="fornecedores.html" class="menu-item ${paginaAtual === "fornecedores" ? "active" : ""}">
            🚚 <span class="menu-text">Fornecedores</span>
          </a>
          <a href="equipamentos.html" class="menu-item ${paginaAtual === "equipamentos" ? "active" : ""}">
            🔬 <span class="menu-text">Equipamentos</span>
          </a>
          <a href="produtos.html" class="menu-item ${paginaAtual === "produtos" ? "active" : ""}">
            📦 <span class="menu-text">Produtos e Peças</span>
          </a>
          <a href="servicos.html" class="menu-item ${paginaAtual === "servicos" ? "active" : ""}">
            🔧 <span class="menu-text">Serviços</span>
          </a>
          <a href="configuracoes.html" class="menu-item ${paginaAtual === "configuracoes" ? "active" : ""}">
            ⚙️ <span class="menu-text">Configurações</span>
          </a>
        </div>

        <button class="sidebar-toggle"><i>≡</i></button>
      </nav>
    `;

    document.body.insertAdjacentHTML("afterbegin", sidebarHTML);

    const sidebar = document.getElementById("sidebar");
    const toggleBtn = sidebar.querySelector(".sidebar-toggle");
    const mobileBtn = document.querySelector(".mobile-menu-btn");
    const overlay = document.querySelector(".sidebar-overlay");
    const mainContent = document.querySelector(".main-content");
    const textos = sidebar.querySelectorAll(".menu-text");

    function aplicarEstado(recolhido) {
      if (window.innerWidth <= 768) return; // No mobile o comportamento é via classe open
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
        textos.forEach((el) => (el.style.display = ""));
        if (mainContent) mainContent.style.marginLeft = "";
      }
    }

    // Restaura o estado salvo no desktop
    const estaRecolhido = localStorage.getItem("sidebar_collapsed") === "true";
    aplicarEstado(estaRecolhido);

    // Botão de recolher (Desktop)
    toggleBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const novoEstado = !sidebar.classList.contains("collapsed");
      aplicarEstado(novoEstado);
      localStorage.setItem("sidebar_collapsed", novoEstado);
    });

    // Abrir/Fechar no Mobile
    function toggleMobileMenu() {
      sidebar.classList.toggle("mobile-open");
      if (overlay) overlay.classList.toggle("active");
    }

    if (mobileBtn) {
      mobileBtn.addEventListener("click", (e) => {
        e.preventDefault();
        toggleMobileMenu();
      });
    }

    if (overlay) {
      overlay.addEventListener("click", () => {
        toggleMobileMenu();
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarSidebar);
  } else {
    iniciarSidebar();
  }
})();
