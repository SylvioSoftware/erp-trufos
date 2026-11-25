export function normalizarTextoBusca(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function createComboBusca({
  inputId,
  hiddenId,
  listaId,
  getItems,
  emptyText = "Nenhum resultado encontrado.",
  onSelect,
}) {
  const inputEl = document.getElementById(inputId);
  const hiddenEl = document.getElementById(hiddenId);
  const listaEl = document.getElementById(listaId);

  let filtradosAtuais = [];
  let indiceAtivo = -1;

  function fecharLista() {
    if (listaEl) listaEl.style.display = "none";
    indiceAtivo = -1;
  }

  function selecionarItem(item) {
    if (!inputEl || !hiddenEl) return;
    if (!item) {
      hiddenEl.value = "";
      inputEl.value = "";
      fecharLista();
      onSelect?.(null);
      return;
    }
    hiddenEl.value = String(item.id);
    inputEl.value = item.label;
    fecharLista();
    onSelect?.(item);
  }

  function setValorPorId(id) {
    if (!inputEl || !hiddenEl) return;
    if (id === null || id === undefined || id === "") {
      hiddenEl.value = "";
      inputEl.value = "";
      onSelect?.(null);
      return;
    }
    const items = getItems() || [];
    const encontrado = items.find((it) => String(it.id) === String(id));
    if (encontrado) {
      hiddenEl.value = String(encontrado.id);
      inputEl.value = encontrado.label;
      onSelect?.(encontrado);
    } else {
      hiddenEl.value = "";
      inputEl.value = "";
      onSelect?.(null);
    }
  }

  function renderizarLista(termoDigitado = "") {
    if (!listaEl) return;
    const items = getItems() || [];
    const termo = normalizarTextoBusca(termoDigitado);

    filtradosAtuais = items.filter((item) => {
      if (!termo) return true;
      const baseBusca = normalizarTextoBusca(item.searchText || item.label);
      return baseBusca.includes(termo);
    });

    indiceAtivo = filtradosAtuais.length > 0 ? 0 : -1;

    if (filtradosAtuais.length === 0) {
      listaEl.innerHTML = `<div class="combo-busca-vazio">${escapeHtml(emptyText)}</div>`;
      listaEl.style.display = "block";
      return;
    }

    listaEl.innerHTML = "";
    filtradosAtuais.forEach((item, idx) => {
      const div = document.createElement("div");
      div.className = `combo-busca-item${idx === indiceAtivo ? " ativo" : ""}`;
      div.textContent = item.label;
      div.addEventListener("mousedown", (e) => {
        e.preventDefault();
        selecionarItem(item);
      });
      listaEl.appendChild(div);
    });

    listaEl.style.display = "block";
  }

  function atualizarDestaqueTeclado() {
    if (!listaEl) return;
    const nodes = listaEl.querySelectorAll(".combo-busca-item");
    nodes.forEach((node, idx) => {
      node.classList.toggle("ativo", idx === indiceAtivo);
      if (idx === indiceAtivo) {
        node.scrollIntoView({ block: "nearest" });
      }
    });
  }

  if (inputEl && hiddenEl && listaEl) {
    inputEl.addEventListener("focus", () => {
      const termoInicial = hiddenEl.value ? "" : inputEl.value;
      renderizarLista(termoInicial);
    });

    inputEl.addEventListener("input", () => {
      hiddenEl.value = "";
      onSelect?.(null);
      renderizarLista(inputEl.value);
    });

    inputEl.addEventListener("keydown", (e) => {
      if (listaEl.style.display !== "block") {
        if (e.key === "ArrowDown") {
          renderizarLista(hiddenEl.value ? "" : inputEl.value);
          e.preventDefault();
        }
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (filtradosAtuais.length > 0) {
          indiceAtivo = (indiceAtivo + 1) % filtradosAtuais.length;
          atualizarDestaqueTeclado();
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (filtradosAtuais.length > 0) {
          indiceAtivo =
            (indiceAtivo - 1 + filtradosAtuais.length) % filtradosAtuais.length;
          atualizarDestaqueTeclado();
        }
      } else if (e.key === "Enter") {
        if (indiceAtivo >= 0 && filtradosAtuais[indiceAtivo]) {
          e.preventDefault();
          selecionarItem(filtradosAtuais[indiceAtivo]);
        }
      } else if (e.key === "Escape") {
        fecharLista();
      }
    });

    inputEl.addEventListener("blur", () => {
      if (!hiddenEl.value && inputEl.value.trim()) {
        const termo = normalizarTextoBusca(inputEl.value);
        const items = getItems() || [];
        const exato = items.find(
          (it) => normalizarTextoBusca(it.label) === termo,
        );
        if (exato) {
          selecionarItem(exato);
          return;
        }
      }
      fecharLista();
    });
  }

  return {
    setValorPorId,
    fecharLista,
    renderizarLista,
  };
}
