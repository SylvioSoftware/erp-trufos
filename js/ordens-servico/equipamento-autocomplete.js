import { padronizarTexto } from "./modais/modal-cliente.js";

function extrairId(respJson) {
  const item = Array.isArray(respJson)
    ? respJson[0]
    : respJson?.data || respJson;
  return item?.id ? Number(item.id) : null;
}

export async function salvarEquipamentoNaHierarquia({
  endpoints,
  dadosEquipamento,
}) {
  const { salvarTipo, salvarMarca, salvarModelo, salvarParque } =
    endpoints || {};

  if (!salvarParque) {
    throw new Error("Endpoint de salvar parque não configurado.");
  }

  let tipoId = dadosEquipamento.tipo_id
    ? Number(dadosEquipamento.tipo_id)
    : null;
  let marcaId = dadosEquipamento.marca_id
    ? Number(dadosEquipamento.marca_id)
    : null;
  let modeloId = dadosEquipamento.modelo_id
    ? Number(dadosEquipamento.modelo_id)
    : null;

  const tipoNome = padronizarTexto(dadosEquipamento.tipo || "", "TITLE");
  const marcaNome = padronizarTexto(dadosEquipamento.fabricante || "", "TITLE");
  const modeloNome = String(dadosEquipamento.modelo || "").trim();

  // 1. Grava Tipo
  if (!tipoId && tipoNome && salvarTipo) {
    const rTipo = await fetch(salvarTipo, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: tipoNome }),
    });
    if (!rTipo.ok)
      throw new Error(`Falha ao salvar tipo (HTTP ${rTipo.status})`);
    const dTipo = await rTipo.json().catch(() => null);
    tipoId = extrairId(dTipo);
  }

  // 2. Grava Marca
  if (!marcaId && marcaNome && salvarMarca) {
    const rMarca = await fetch(salvarMarca, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: marcaNome }),
    });
    if (!rMarca.ok)
      throw new Error(`Falha ao salvar marca (HTTP ${rMarca.status})`);
    const dMarca = await rMarca.json().catch(() => null);
    marcaId = extrairId(dMarca);
  }

  // 3. Grava Modelo
  if (!modeloId && modeloNome && salvarModelo) {
    const rModelo = await fetch(salvarModelo, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo_id: tipoId,
        marca_id: marcaId,
        nome: modeloNome,
      }),
    });
    if (!rModelo.ok) {
      throw new Error(`Falha ao salvar modelo (HTTP ${rModelo.status})`);
    }
    const dModelo = await rModelo.json().catch(() => null);
    modeloId = extrairId(dModelo);
  }

  // 4. Grava Parque Instalado usando o ID existente quando houver
  const rParque = await fetch(salvarParque, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: dadosEquipamento.id ? Number(dadosEquipamento.id) : null,
      cliente_id: Number(dadosEquipamento.cliente_id),
      modelo_id: modeloId,
      numero_serie: dadosEquipamento.numero_serie || null,
      patrimonio_tag: dadosEquipamento.patrimonio_tag || null,
      observacoes: dadosEquipamento.observacoes || null,
    }),
  });
  if (!rParque.ok) {
    throw new Error(
      `Falha ao salvar parque instalado (HTTP ${rParque.status})`,
    );
  }
  const dParque = await rParque.json().catch(() => null);

  return {
    tipoId,
    marcaId,
    modeloId,
    equipamentoId:
      extrairId(dParque) ||
      (dadosEquipamento.id ? Number(dadosEquipamento.id) : null),
  };
}

export function sincronizarCamposEquipamentoOS() {
  const eqId = (
    document.getElementById("os-equipamento-id")?.value || ""
  ).trim();
  const temVinculo = Boolean(eqId);

  const camposFixos = [
    "os-equip-tipo",
    "os-equip-fabricante",
    "os-equip-modelo",
    "os-equip-serie",
  ];

  camposFixos.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.readOnly = temVinculo;
    el.style.backgroundColor = temVinculo ? "#f8fafc" : "";
    el.style.cursor = temVinculo ? "not-allowed" : "";
    el.title = temVinculo
      ? "Para trocar o equipamento ou alterar série/modelo, use 'Buscar em Lista Completa'."
      : "";
  });

  // Patrimônio / TAG fica livre para ajuste rápido via OS
  const patEl = document.getElementById("os-equip-patrimonio");
  if (patEl) {
    patEl.readOnly = false;
    patEl.style.backgroundColor = "";
    patEl.style.cursor = "";
    patEl.title = "";
  }
}

export function initEquipamentoAutocomplete({
  endpointListar,
  endpointSalvar,
  endpointTipos,
  endpointMarcas,
  endpointModelos,
  endpointSalvarTipo,
  endpointSalvarMarca,
  endpointSalvarModelo,
}) {
  let cacheParque = [];
  let cacheTipos = [];
  let cacheMarcas = [];
  let cacheModelos = [];
  let ultimoClienteParque = null;

  let selecionado = {
    tipoId: null,
    marcaId: null,
    modeloId: null,
  };

  const idsDropdowns = [
    "dropdown-equip-tipo",
    "dropdown-equip-fabricante",
    "dropdown-equip-modelo",
    "dropdown-equip-serie",
    "dropdown-equip-patrimonio",
  ];

  function normalizarChave(v) {
    return String(v || "")
      .trim()
      .toLowerCase();
  }

  function limparValor(id) {
    const el = document.getElementById(id);
    if (el) el.value = "";
  }

  function fecharTodosDropdowns(excetoId = null) {
    idsDropdowns.forEach((dropdownId) => {
      if (dropdownId === excetoId) return;
      const el = document.getElementById(dropdownId);
      if (el) el.style.display = "none";
    });
  }

  async function fetchListaSegura(url) {
    if (!url) return [];
    try {
      const r = await fetch(url);
      const d = r?.ok ? await r.json() : [];
      return Array.isArray(d) ? d : d?.data || [];
    } catch {
      return [];
    }
  }

  async function carregarParque(forcar = false) {
    const cid = document.getElementById("os-cliente-id")?.value || "";
    if (!forcar && ultimoClienteParque === cid && cacheParque.length) {
      return cacheParque;
    }
    const url = cid
      ? `${endpointListar}?cliente_id=${encodeURIComponent(cid)}`
      : endpointListar;
    cacheParque = await fetchListaSegura(url);
    ultimoClienteParque = cid;
    return cacheParque;
  }

  async function carregarCatalogosAuxiliares(forcar = false) {
    if (endpointTipos && (forcar || !cacheTipos.length)) {
      cacheTipos = await fetchListaSegura(endpointTipos);
    }
    if (endpointMarcas && (forcar || !cacheMarcas.length)) {
      cacheMarcas = await fetchListaSegura(endpointMarcas);
    }
    if (endpointModelos && (forcar || !cacheModelos.length)) {
      cacheModelos = await fetchListaSegura(endpointModelos);
    }
  }

  function podeAbrirCampo(campoKey) {
    const temVinculo = Boolean(
      (document.getElementById("os-equipamento-id")?.value || "").trim(),
    );
    // Quando já existe equipamento vinculado, apenas Patrimônio / TAG pode ser alterado via OS
    if (temVinculo && campoKey !== "patrimonio") return false;

    const tipoVal = (
      document.getElementById("os-equip-tipo")?.value || ""
    ).trim();
    const marcaVal = (
      document.getElementById("os-equip-fabricante")?.value || ""
    ).trim();
    const modeloVal = (
      document.getElementById("os-equip-modelo")?.value || ""
    ).trim();

    if (campoKey === "tipo") return true;
    if (campoKey === "marca") return Boolean(tipoVal);
    if (campoKey === "modelo") return Boolean(tipoVal && marcaVal);
    if (campoKey === "serie" || campoKey === "patrimonio") {
      return Boolean(tipoVal && marcaVal && modeloVal);
    }
    return false;
  }

  async function obterOpcoesCampo(campoKey, termo) {
    await carregarCatalogosAuxiliares();
    const parque = await carregarParque();
    const t = normalizarChave(termo);

    const vistos = new Set();
    const itens = [];

    const adicionar = (valor, sub = "", meta = {}) => {
      const limpo = String(valor || "").trim();
      if (!limpo) return;
      const chave = normalizarChave(limpo);
      if (vistos.has(chave)) return;
      if (t && !chave.includes(t) && !normalizarChave(sub).includes(t)) return;
      vistos.add(chave);
      itens.push({ valor: limpo, sub, meta });
    };

    if (campoKey === "tipo") {
      if (cacheTipos.length) {
        cacheTipos.forEach((row) =>
          adicionar(row.nome || row.tipo || "", "", { tipoId: row.id ?? null }),
        );
      } else {
        parque.forEach((eq) =>
          adicionar(eq.tipo_nome || eq.tipo || "", "", {
            tipoId: eq.tipo_id ?? null,
          }),
        );
      }
      return itens;
    }

    if (campoKey === "marca") {
      if (cacheMarcas.length) {
        cacheMarcas.forEach((row) =>
          adicionar(row.nome || row.fabricante || row.marca || "", "", {
            marcaId: row.id ?? null,
          }),
        );
      } else {
        parque.forEach((eq) =>
          adicionar(eq.marca_nome || eq.fabricante || "", "", {
            marcaId: eq.marca_id ?? null,
          }),
        );
      }
      return itens;
    }

    if (campoKey === "modelo") {
      if (cacheModelos.length) {
        cacheModelos
          .filter((m) => {
            const matchTipo =
              !selecionado.tipoId ||
              !m.tipo_id ||
              String(m.tipo_id) === String(selecionado.tipoId);
            const matchMarca =
              !selecionado.marcaId ||
              !m.marca_id ||
              String(m.marca_id) === String(selecionado.marcaId);
            return matchTipo && matchMarca;
          })
          .forEach((m) =>
            adicionar(m.nome || m.modelo || "", "", {
              modeloId: m.id ?? null,
            }),
          );
      }

      parque.forEach((eq) => {
        const matchTipo =
          !selecionado.tipoId ||
          !eq.tipo_id ||
          String(eq.tipo_id) === String(selecionado.tipoId);
        const matchMarca =
          !selecionado.marcaId ||
          !eq.marca_id ||
          String(eq.marca_id) === String(selecionado.marcaId);
        if (matchTipo && matchMarca) {
          adicionar(eq.modelo_nome || eq.modelo || "", "", {
            modeloId: eq.modelo_id ?? null,
          });
        }
      });
      return itens;
    }

    if (campoKey === "serie" || campoKey === "patrimonio") {
      const modeloAtualChave = normalizarChave(
        document.getElementById("os-equip-modelo")?.value || "",
      );
      const cidAtual = document.getElementById("os-cliente-id")?.value || "";

      const filtrados = parque.filter((eq) => {
        const eqModeloId = eq.modelo_id;
        const eqModeloNome = normalizarChave(eq.modelo_nome || eq.modelo || "");
        const matchModelo = selecionado.modeloId
          ? String(eqModeloId) === String(selecionado.modeloId) ||
            eqModeloNome === modeloAtualChave
          : !modeloAtualChave || eqModeloNome === modeloAtualChave;

        const matchCliente =
          !cidAtual ||
          !eq.cliente_id ||
          String(eq.cliente_id) === String(cidAtual);

        return matchModelo && matchCliente;
      });

      filtrados.forEach((eq) => {
        if (campoKey === "serie") {
          adicionar(
            eq.numero_serie || eq.serie || "",
            eq.patrimonio || eq.patrimonio_tag
              ? `TAG: ${eq.patrimonio || eq.patrimonio_tag}`
              : "",
            { equipamentoId: eq.id ?? null, modeloId: eq.modelo_id ?? null },
          );
        } else {
          adicionar(
            eq.patrimonio || eq.patrimonio_tag || "",
            eq.numero_serie || eq.serie
              ? `Série: ${eq.numero_serie || eq.serie}`
              : "",
            { equipamentoId: eq.id ?? null, modeloId: eq.modelo_id ?? null },
          );
        }
      });

      return itens;
    }

    return itens;
  }

  function aplicarEscolhaNoCampo(campoKey, inputId, item) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const deveTitleCase = campoKey === "tipo" || campoKey === "marca";
    input.value = deveTitleCase
      ? padronizarTexto(item.valor, "TITLE")
      : String(item.valor || "").trim();

    if (campoKey === "tipo") {
      selecionado.tipoId = item.meta?.tipoId ?? null;
      selecionado.marcaId = null;
      selecionado.modeloId = null;
      limparValor("os-equip-fabricante");
      limparValor("os-equip-modelo");
      limparValor("os-equip-serie");
      limparValor("os-equip-patrimonio");
      limparValor("os-equipamento-id");
    } else if (campoKey === "marca") {
      selecionado.marcaId = item.meta?.marcaId ?? null;
      selecionado.modeloId = null;
      limparValor("os-equip-modelo");
      limparValor("os-equip-serie");
      limparValor("os-equip-patrimonio");
      limparValor("os-equipamento-id");
    } else if (campoKey === "modelo") {
      selecionado.modeloId = item.meta?.modeloId ?? null;
      limparValor("os-equip-serie");
      limparValor("os-equip-patrimonio");
      limparValor("os-equipamento-id");
    } else if (
      (campoKey === "serie" || campoKey === "patrimonio") &&
      item.meta?.equipamentoId
    ) {
      document.getElementById("os-equipamento-id").value =
        item.meta.equipamentoId;
    }

    sincronizarCamposEquipamentoOS();
    fecharTodosDropdowns();
  }

  async function renderDropdown(campoKey, inputId, dropdownId) {
    if (!podeAbrirCampo(campoKey)) {
      fecharTodosDropdowns();
      return;
    }

    const input = document.getElementById(inputId);
    const drop = document.getElementById(dropdownId);
    if (!input || !drop) return;

    const opcoes = await obterOpcoesCampo(campoKey, input.value);

    if (!opcoes.length) {
      drop.innerHTML = `<div class="os-equip-dropdown-vazio">Nenhuma opção encontrada. Você pode digitar livremente.</div>`;
      drop.style.display = "block";
      return;
    }

    drop.innerHTML = opcoes
      .map(
        (item, idx) => `
        <div class="os-equip-dropdown-item" data-idx="${idx}">
          <span>${item.valor}</span>
          ${item.sub ? `<span class="os-equip-dropdown-sub">${item.sub}</span>` : ""}
        </div>
      `,
      )
      .join("");

    drop.querySelectorAll(".os-equip-dropdown-item").forEach((el) => {
      el.addEventListener("mousedown", (e) => {
        e.preventDefault();
        const escolhido = opcoes[Number(el.dataset.idx)];
        if (escolhido) {
          aplicarEscolhaNoCampo(campoKey, inputId, escolhido);
        }
      });
    });

    drop.style.display = "block";
  }

  const configuracaoCampos = [
    {
      key: "tipo",
      inputId: "os-equip-tipo",
      dropdownId: "dropdown-equip-tipo",
    },
    {
      key: "marca",
      inputId: "os-equip-fabricante",
      dropdownId: "dropdown-equip-fabricante",
    },
    {
      key: "modelo",
      inputId: "os-equip-modelo",
      dropdownId: "dropdown-equip-modelo",
    },
    {
      key: "serie",
      inputId: "os-equip-serie",
      dropdownId: "dropdown-equip-serie",
    },
    {
      key: "patrimonio",
      inputId: "os-equip-patrimonio",
      dropdownId: "dropdown-equip-patrimonio",
    },
  ];

  configuracaoCampos.forEach(({ key, inputId, dropdownId }) => {
    const input = document.getElementById(inputId);
    if (!input) return;

    input.addEventListener("focus", () => {
      fecharTodosDropdowns(dropdownId);
      renderDropdown(key, inputId, dropdownId);
    });

    input.addEventListener("click", () => {
      fecharTodosDropdowns(dropdownId);
      renderDropdown(key, inputId, dropdownId);
    });

    input.addEventListener("input", () => {
      if (key === "tipo") {
        selecionado.tipoId = null;
        selecionado.marcaId = null;
        selecionado.modeloId = null;
        limparValor("os-equipamento-id");
      } else if (key === "marca") {
        selecionado.marcaId = null;
        selecionado.modeloId = null;
        limparValor("os-equipamento-id");
      } else if (key === "modelo") {
        selecionado.modeloId = null;
        limparValor("os-equipamento-id");
      } else if (key === "serie") {
        limparValor("os-equipamento-id");
      }
      renderDropdown(key, inputId, dropdownId);
    });
  });

  document.addEventListener("click", (e) => {
    const clicouEmCombo = e.target.closest(
      ".os-equip-combo-input, .os-equip-dropdown",
    );
    if (!clicouEmCombo) {
      fecharTodosDropdowns();
    }
  });

  document
    .getElementById("btn-salvar-equipamento-parque")
    ?.addEventListener("click", async () => {
      const clienteId = document.getElementById("os-cliente-id")?.value;
      const eqIdAtual = (
        document.getElementById("os-equipamento-id")?.value || ""
      ).trim();
      const tipo = padronizarTexto(
        document.getElementById("os-equip-tipo")?.value || "",
        "TITLE",
      );
      const fabricante = padronizarTexto(
        document.getElementById("os-equip-fabricante")?.value || "",
        "TITLE",
      );
      const modelo = (
        document.getElementById("os-equip-modelo")?.value || ""
      ).trim();
      const numeroSerie = (
        document.getElementById("os-equip-serie")?.value || ""
      ).trim();
      const patrimonioTag = (
        document.getElementById("os-equip-patrimonio")?.value || ""
      ).trim();

      if (!clienteId) {
        alert("Selecione um cliente na Aba 1 antes de salvar no cadastro.");
        return;
      }
      if (!tipo && !modelo && !numeroSerie && !patrimonioTag) {
        alert("Preencha ao menos Tipo, Modelo, Nº de Série ou Patrimônio.");
        return;
      }

      const btn = document.getElementById("btn-salvar-equipamento-parque");
      const textoOriginal = btn.textContent;
      btn.disabled = true;
      btn.textContent = "⏳ Salvando...";

      try {
        const res = await salvarEquipamentoNaHierarquia({
          endpoints: {
            salvarTipo: endpointSalvarTipo,
            salvarMarca: endpointSalvarMarca,
            salvarModelo: endpointSalvarModelo,
            salvarParque: endpointSalvar,
          },
          dadosEquipamento: {
            id: eqIdAtual || null,
            cliente_id: Number(clienteId),
            tipo_id: selecionado.tipoId,
            marca_id: selecionado.marcaId,
            modelo_id: selecionado.modeloId,
            tipo,
            fabricante,
            modelo,
            numero_serie: numeroSerie || null,
            patrimonio_tag: patrimonioTag || null,
            observacoes: padronizarTexto(
              document.getElementById("os-aspecto-aparencia")?.value || "",
              "TITLE",
            ),
          },
        });

        selecionado.tipoId = res.tipoId;
        selecionado.marcaId = res.marcaId;
        selecionado.modeloId = res.modeloId;
        if (res.equipamentoId) {
          document.getElementById("os-equipamento-id").value =
            res.equipamentoId;
        }

        sincronizarCamposEquipamentoOS();
        await Promise.all([
          carregarCatalogosAuxiliares(true),
          carregarParque(true),
        ]);
        alert("Equipamento salvo/atualizado no cadastro do cliente!");
      } catch (err) {
        console.error(err);
        alert("Não foi possível salvar o equipamento no servidor.");
      } finally {
        btn.disabled = false;
        btn.textContent = textoOriginal;
      }
    });

  sincronizarCamposEquipamentoOS();
}
