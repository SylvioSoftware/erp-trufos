// js/core/layout.js - Comportamentos globais de interface (Sidebar)

export function initLayout() {
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.querySelector(".sidebar-toggle");

  if (!sidebar) return;

  if (localStorage.getItem("sidebar_collapsed") === "true") {
    sidebar.classList.add("collapsed");
  }

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("collapsed");
      localStorage.setItem(
        "sidebar_collapsed",
        sidebar.classList.contains("collapsed"),
      );
    });
  }
}
