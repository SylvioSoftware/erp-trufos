export function createOSHistorico({ endpoints = {} } = {}) {
  const endpointListar = endpoints.listar ?? "/api/historico-interacoes";
  const endpointCriar = endpoints.criar ?? "/api/historico-interacoes";

  let contextoAtual = {
    osId: null,
    clienteId: null,
    equipamentoId: null,
  };
  let escopoAtivo = "OS";

  function adicionarDiasData(dataInputStr, dias) {
    if (!dataInputStr) return "";
    const base = new Date(dataInputStr);
    if (Number.isNaN(base.getTime())) return "";
    const prazo = Number.isFinite(Number(dias)) ? Number(dias) : 30;
    base.setDate(base.getDate() + prazo);
    return base.toISOString().slice(0, 10);
  }

  function formatarDataHora(isoStr) {
    if (!isoStr) return "";
    const d = new Date(isoStr);
    if (Number.isNaN(d.getTime())) return isoStr;
    return d.toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  }

  function modalEstaAberto() {
    const modal = document.getElementById("modal-historico-os");
    return Boolean(
      modal && modal.style.display && modal.style.display !== "none",
    );
  }

  function configurarValidadeAutomatica() {
    const inputDataOrc = document.getElementById("os-data-orcamento");
    const inputValidade = document.getElementById("os-data-validade-orcamento");
    const inputPrazoCliente = document.getElementById(
      "os-cliente-prazo-validade",
    );

    if (!inputDataOrc || !inputValidade) return;

    inputDataOrc.addEventListener("change", () => {
      if (!inputDataOrc.value) return;
      const dias = inputPrazoCliente ? inputPrazoCliente.value : 30;
      const calculada = adicionarDiasData(inputDataOrc.value, dias);
      if (calculada) {
        inputValidade.value = calculada;
      }
    });
  }

  function definirPrazoCliente(dias) {
    const inputPrazoCliente = document.getElementById(
      "os-cliente-prazo-validade",
    );
    const inputDataOrc = document.getElementById("os-data-orcamento");
    const inputValidade = document.getElementById("os-data-validade-orcamento");

    const temDias = dias !== undefined && dias !== null && dias !== "";
    const prazoNormalizado = temDias ? Number(dias) : 30;

    if (inputPrazoCliente) {
      inputPrazoCliente.value = String(prazoNormalizado);
    }

    if (
      inputDataOrc &&
      inputDataOrc.value &&
      inputValidade &&
      !inputValidade.value
    ) {
      inputValidade.value = adicionarDiasData(
        inputDataOrc.value,
        prazoNormalizado,
      );
    }
  }

  async function carregarHistorico() {
    const listaEl = document.getElementById("os-hist-lista");
    if (!listaEl) return;

    const params = new URLSearchParams({ escopo: escopoAtivo });
    if (escopoAtivo === "OS" && contextoAtual.osId) {
      params.set("os_id", contextoAtual.osId);
    } else if (escopoAtivo === "EQUIPAMENTO" && contextoAtual.equipamentoId) {
      params.set("equipamento_id", contextoAtual.equipamentoId);
    } else if (escopoAtivo === "CLIENTE" && contextoAtual.clienteId) {
      params.set("cliente_id", contextoAtual.clienteId);
    } else {
      listaEl.innerHTML =
        '<p class="os-hist-vazio">Nenhum vínculo selecionado para este escopo.</p>';
      return;
    }

    listaEl.innerHTML = '<p class="os-hist-vazio">Carregando histórico...</p>';

    try {
      const resp = await fetch(`${endpointListar}?${params.toString()}`);
      const raw = resp.ok ? await resp.json() : [];
      const itens = Array.isArray(raw) ? raw : (raw?.data ?? []);

      if (!itens.length) {
        listaEl.innerHTML =
          '<p class="os-hist-vazio">Nenhum registro encontrado.</p>';
        return;
      }

      listaEl.innerHTML = itens
        .map((item) => {
          const tipoTexto = item.tipo ?? "REGISTRO";
          const descTexto = item.descricao ?? "";
          return `
            <div class="os-hist-item">
              <div class="os-hist-item-topo">
                <strong>${tipoTexto}</strong>
                <span>${formatarDataHora(item.criado_em)}</span>
              </div>
              <p class="os-hist-item-texto">${descTexto}</p>
            </div>
          `;
        })
        .join("");
    } catch {
      listaEl.innerHTML =
        '<p class="os-hist-vazio">Não foi possível carregar o histórico agora.</p>';
    }
  }

  async function registrarEvento({
    tipo,
    descricao,
    os_id,
    cliente_id,
    equipamento_id,
  } = {}) {
    if (!descricao || !descricao.trim()) return;

    const osIdFinal =
      os_id ??
      contextoAtual.osId ??
      document.getElementById("os-id")?.value ??
      null;
    const clienteIdFinal =
      cliente_id ??
      contextoAtual.clienteId ??
      document.getElementById("os-cliente-id")?.value ??
      null;
    const equipamentoIdFinal =
      equipamento_id ??
      contextoAtual.equipamentoId ??
      document.getElementById("os-equipamento-id")?.value ??
      null;

    if (osIdFinal && !contextoAtual.osId) contextoAtual.osId = osIdFinal;
    if (clienteIdFinal && !contextoAtual.clienteId)
      contextoAtual.clienteId = clienteIdFinal;
    if (equipamentoIdFinal && !contextoAtual.equipamentoId)
      contextoAtual.equipamentoId = equipamentoIdFinal;

    const payload = {
      tipo: tipo ?? "SISTEMA_DATA",
      descricao: descricao.trim(),
      os_id: osIdFinal || null,
      cliente_id: clienteIdFinal || null,
      equipamento_id: equipamentoIdFinal || null,
    };

    try {
      await fetch(endpointCriar, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (modalEstaAberto()) {
        await carregarHistorico();
      }
    } catch {
      // Falha silenciosa caso endpoint ainda não esteja publicado no n8n/backend
    }
  }

  function abrirModal({ escopo = "OS", osId, clienteId, equipamentoId } = {}) {
    contextoAtual = {
      osId: osId ?? document.getElementById("os-id")?.value ?? null,
      clienteId:
        clienteId ?? document.getElementById("os-cliente-id")?.value ?? null,
      equipamentoId:
        equipamentoId ??
        document.getElementById("os-equipamento-id")?.value ??
        null,
    };

    escopoAtivo = escopo;
    document.querySelectorAll(".os-hist-escopo-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.escopo === escopoAtivo);
    });

    const modal = document.getElementById("modal-historico-os");
    if (modal) {
      modal.style.display = "flex";
    }
    carregarHistorico();
  }

  function fecharModal() {
    const modal = document.getElementById("modal-historico-os");
    if (modal) {
      modal.style.display = "none";
    }
  }

  function init() {
    configurarValidadeAutomatica();

    document
      .getElementById("btn-abrir-historico-os")
      ?.addEventListener("click", () => abrirModal({ escopo: "OS" }));

    document
      .getElementById("btn-historico-cliente-aba")
      ?.addEventListener("click", () => abrirModal({ escopo: "CLIENTE" }));

    document.querySelectorAll(".os-hist-escopo-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        escopoAtivo = btn.dataset.escopo;
        document.querySelectorAll(".os-hist-escopo-btn").forEach((b) => {
          b.classList.toggle("active", b === btn);
        });
        carregarHistorico();
      });
    });

    document
      .querySelector('[data-close-modal="modal-historico-os"]')
      ?.addEventListener("click", fecharModal);

    document
      .getElementById("modal-historico-os")
      ?.addEventListener("click", (e) => {
        if (e.target.id === "modal-historico-os") {
          fecharModal();
        }
      });

    document
      .getElementById("form-novo-historico-os")
      ?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const tipo = document.getElementById("os-hist-tipo")?.value;
        const inputDesc = document.getElementById("os-hist-descricao");
        if (!inputDesc || !inputDesc.value.trim()) return;

        await registrarEvento({ tipo, descricao: inputDesc.value });
        inputDesc.value = "";
      });
  }

  return {
    init,
    abrirModal,
    fecharModal,
    registrarEvento,
    definirPrazoCliente,
  };
}
