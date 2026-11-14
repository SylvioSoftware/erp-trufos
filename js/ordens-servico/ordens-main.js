document.addEventListener("DOMContentLoaded", () => {
  // Controle de abas
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabPanes = document.querySelectorAll(".tab-pane");

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabButtons.forEach((b) => b.classList.remove("active"));
      tabPanes.forEach((p) => (p.style.display = "none"));

      btn.classList.add("active");
      const targetId = btn.getAttribute("data-target");
      document.getElementById(targetId).style.display = "block";
    });
  });

  // Aqui você fará as chamadas fetch para os webhooks do n8n (ex: carregar clientes e listar OSs)
});
