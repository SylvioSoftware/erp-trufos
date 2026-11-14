/* ==========================================================================
   FUNÇÃO PARA CARREGAR COMPONENTES HTML
   ========================================================================== */
function carregarComponente(id, arquivo) {
  const elemento = document.getElementById(id);
  if (!elemento) return;

  fetch(arquivo)
    .then((response) => {
      if (!response.ok) throw new Error("Erro ao carregar: " + arquivo);
      return response.text();
    })
    .then((data) => {
      elemento.innerHTML = data;
    })
    .catch((error) => console.error(error));
}

/* ==========================================================================
   EXECUÇÃO AO CARREGAR A PÁGINA
   ========================================================================== */
window.addEventListener("DOMContentLoaded", function () {
  // Carrega o Head (Metas, CSS, Favicon)
  fetch("/includes/head.html")
    .then((response) => response.text())
    .then((data) => {
      document.head.innerHTML += data;
    });

  // Carrega o menu e logo após adiciona o evento de clique
  fetch("/includes/menu.html")
    .then((response) => response.text())
    .then((data) => {
      const navPlaceholder = document.getElementById("nav-placeholder");
      navPlaceholder.innerHTML = data;

      // --- LOGICA DO MENU MOBILE (HAMBURGUER) ---
      const menuToggle = document.getElementById("menu-toggle");
      const mainMenu = document.getElementById("main-menu");

      if (menuToggle && mainMenu) {
        menuToggle.addEventListener("click", function () {
          mainMenu.classList.toggle("active");
        });
      }

      // --- NOVA LOGICA PARA SUBMENUS (PRODUTOS / SERVIÇOS) ---
      const linksPai = navPlaceholder.querySelectorAll(".link-pai");

      linksPai.forEach((link) => {
        link.addEventListener("click", function (e) {
          // Só age se estiver na largura de mobile
          if (window.innerWidth <= 768) {
            e.preventDefault(); // Para a navegação imediatamente
            e.stopPropagation();

            const submenu = this.nextElementSibling;
            const displayAtual = window.getComputedStyle(submenu).display;

            // Fecha todos os outros submenus abertos
            navPlaceholder.querySelectorAll(".dropdown").forEach((d) => {
              if (d !== submenu) d.style.display = "none";
            });

            // Toggle do submenu clicado
            if (displayAtual === "none") {
              submenu.style.setProperty("display", "block", "important");
            } else {
              submenu.style.setProperty("display", "none", "important");
            }
          }
        });
      });

      // Fecha submenus se clicar fora do nav
      document.addEventListener("click", function (e) {
        if (!e.target.closest("nav")) {
          navPlaceholder.querySelectorAll(".dropdown").forEach((d) => {
            d.style.display = "none";
          });
        }
      });
    });

  // Carrega os outros componentes
  carregarComponente("header-placeholder", "/includes/cabecalho.html");
  carregarComponente("footer-placeholder", "/includes/rodape.html");
  carregarComponente("whatsapp-placeholder", "/includes/BotaoWA.html");
});
