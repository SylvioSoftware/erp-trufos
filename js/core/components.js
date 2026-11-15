// Componente Centralizado da Sidebar
export function renderSidebar(paginaAtual) {
  const sidebarHTML = `
    <nav class="sidebar" id="sidebar">
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

  // Insere a sidebar no início do body (ou em um container específico)
  document.body.insertAdjacentHTML("afterbegin", sidebarHTML);
}
