const WEBHOOK_BASE = "https://n8n.trufos.com.br/webhook";

let clientesCache = [];
let tiposCache = [];
let marcasCache = [];
let modelosCache = [];
let parqueCache = [];

document.addEventListener("DOMContentLoaded", async () => {
  configurarFiltroBusca();
  configurarPreviewModelo();
  await carregarDadosIniciais();
});

function configurarFiltroBusca() {
  const filtroInput = document.getElementById("filtroEquipamento");
  if (!filtroInput) return;

  filtroInput.addEventListener("input", (e) => {
    const termo = e.target.value.toLowerCase().trim();
    const linhas = document.querySelectorAll(
      "#listaEquipamentosTabela tr[data-busca]",
    );
    linhas.forEach((linha) => {
      const texto = linha.getAttribute("data-busca") || "";
      linha.style.display = texto.includes(termo) ? "" : "none";
    });
  });
}

function configurarPreviewModelo() {
  const selectModelo = document.getElementById("modelo_id");
  if (!selectModelo) return;

  selectModelo.addEventListener("change", () => {
    atualizarResumoModeloSelecionado(selectModelo.value);
  });
}

function atualizarResumoModeloSelecionado(modeloId) {
  const resumoEl = document.getElementById("resumoModeloSelecionado");
  if (!resumoEl) return;

  const modelo = modelosCache.find((m) => String(m.id) === String(modeloId));
  if (!modelo) {
    resumoEl.textContent = "Tipo: - | Marca: - | Modelo: - | HT Médio: -";
    return;
  }

  const nomeTipo = obterNomeTipo(modelo);
  const nomeMarca = obterNomeMarca(modelo);
  const nomeModelo = modelo.nome || "-";
  const ht = formatarHT(modelo.horas_tecnicas_media);
  resumoEl.textContent = `Tipo: ${nomeTipo} | Marca: ${nomeMarca} | Modelo: ${nomeModelo} | HT Médio: ${ht}`;
}

function formatarHT(valor) {
  if (valor === null || valor === undefined || valor === "") return "-";
  const num = Number(valor);
  if (Number.isNaN(num)) return "-";
  return `${num.toFixed(1).replace(".", ",")}h`;
}

function obterNomeCliente(item) {
  if (item.cliente_nome) return item.cliente_nome;
  if (item.nome_fantasia) return item.nome_fantasia;
  if (item.razao_social) return item.razao_social;
  const cli = clientesCache.find(
    (c) => String(c.id) === String(item.cliente_id),
  );
  return cli
    ? cli.nome_fantasia || cli.razao_social || `Cliente #${cli.id}`
    : "-";
}

function obterNomeTipo(obj) {
  if (!obj) return "-";
  if (obj.tipo_nome) return obj.tipo_nome;
  const tipoId = obj.tipo_id ?? obj.tipo_equipamento_id;
  const tipo = tiposCache.find((t) => String(t.id) === String(tipoId));
  return tipo ? tipo.nome : "-";
}

function obterNomeMarca(obj) {
  if (!obj) return "-";
  if (obj.marca_nome) return obj.marca_nome;
  const marcaId = obj.marca_id ?? obj.fabricante_id;
  const marca = marcasCache.find((m) => String(m.id) === String(marcaId));
  return marca ? marca.nome : "-";
}

function obterModeloPorId(modeloId) {
  return modelosCache.find((m) => String(m.id) === String(modeloId)) || null;
}

async function fetchJsonSafe(url, fallback = []) {
  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const text = await resp.text();
    if (!text) return fallback;
    const data = JSON.parse(text);
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    return fallback;
  } catch (err) {
    console.warn(`Falha ao buscar ${url}:`, err);
    return fallback;
  }
}

async function carregarDadosIniciais() {
  const [clientes, tipos, marcas, modelos, parque] = await Promise.all([
    fetchJsonSafe(`${WEBHOOK_BASE}/clientes-listar`, []),
    fetchJsonSafe(`${WEBHOOK_BASE}/equipamentos-tipos-listar`, []),
    fetchJsonSafe(`${WEBHOOK_BASE}/equipamentos-marcas-listar`, []),
    fetchJsonSafe(`${WEBHOOK_BASE}/equipamentos-modelos-listar`, []),
    fetchJsonSafe(`${WEBHOOK_BASE}/parque-instalado-listar`, []),
  ]);

  clientesCache = clientes;
  tiposCache = tipos;
  marcasCache = marcas;
  modelosCache = modelos;
  parqueCache = parque;

  popularSelectClientes();
  popularSelectModelos();
  popularSelectsCatalogoModelo();
  renderizarTabelaParque();
  renderizarTabelaModelos();
}

function popularSelectClientes(selectedId = "") {
  const select = document.getElementById("cliente_id");
  if (!select) return;

  let html = '<option value="">Selecione o cliente...</option>';
  clientesCache.forEach((c) => {
    const label = c.nome_fantasia || c.razao_social || `Cliente #${c.id}`;
    const sel = String(c.id) === String(selectedId) ? "selected" : "";
    html += `<option value="${c.id}" ${sel}>${escapeHtml(label)}</option>`;
  });
  select.innerHTML = html;
}

function popularSelectModelos(selectedId = "") {
  const select = document.getElementById("modelo_id");
  if (!select) return;

  let html = '<option value="">Selecione o modelo...</option>';
  modelosCache.forEach((m) => {
    const tipo = obterNomeTipo(m);
    const marca = obterNomeMarca(m);
    const ht = formatarHT(m.horas_tecnicas_media);
    const label = `${tipo} • ${marca} • ${m.nome} (HT: ${ht})`;
    const sel = String(m.id) === String(selectedId) ? "selected" : "";
    html += `<option value="${m.id}" ${sel}>${escapeHtml(label)}</option>`;
  });
  select.innerHTML = html;
  atualizarResumoModeloSelecionado(selectedId);
}

function popularSelectsCatalogoModelo(tipoIdSel = "", marcaIdSel = "") {
  const selTipo = document.getElementById("modelo_tipo_id");
  const selMarca = document.getElementById("modelo_marca_id");

  if (selTipo) {
    let html = '<option value="">Selecione o tipo...</option>';
    tiposCache.forEach((t) => {
      const sel = String(t.id) === String(tipoIdSel) ? "selected" : "";
      html += `<option value="${t.id}" ${sel}>${escapeHtml(t.nome)}</option>`;
    });
    selTipo.innerHTML = html;
  }

  if (selMarca) {
    let html = '<option value="">Selecione a marca...</option>';
    marcasCache.forEach((m) => {
      const sel = String(m.id) === String(marcaIdSel) ? "selected" : "";
      html += `<option value="${m.id}" ${sel}>${escapeHtml(m.nome)}</option>`;
    });
    selMarca.innerHTML = html;
  }
}

function renderizarTabelaParque() {
  const tbody = document.getElementById("listaEquipamentosTabela");
  if (!tbody) return;

  const itensValidos = (parqueCache || []).filter(
    (item) => item && Object.keys(item).length > 0 && item.id != null,
  );

  if (itensValidos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 20px; color: #64748b;">
          Nenhum equipamento cadastrado no parque instalado.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = "";
  parqueCache.forEach((item) => {
    const clienteNome = obterNomeCliente(item);
    const modeloObj = obterModeloPorId(item.modelo_id);
    const tipoNome = modeloObj
      ? obterNomeTipo(modeloObj)
      : item.tipo_nome || "-";
    const marcaNome = modeloObj
      ? obterNomeMarca(modeloObj)
      : item.marca_nome || "-";
    const modeloNome = item.modelo_nome || modeloObj?.nome || "-";
    const htFormatado = formatarHT(
      item.horas_tecnicas_media ?? modeloObj?.horas_tecnicas_media,
    );

    const textoBusca =
      `${clienteNome} ${tipoNome} ${marcaNome} ${modeloNome} ${item.numero_serie || ""} ${item.patrimonio_tag || ""}`.toLowerCase();

    const tr = document.createElement("tr");
    tr.setAttribute("data-busca", textoBusca);
    tr.innerHTML = `
      <td><strong>${escapeHtml(clienteNome)}</strong></td>
      <td>
        <div><strong>${escapeHtml(tipoNome)} • ${escapeHtml(marcaNome)}</strong></div>
        <small style="color: #64748b;">Modelo: ${escapeHtml(modeloNome)}</small>
      </td>
      <td>${escapeHtml(item.numero_serie || "-")}</td>
      <td>${escapeHtml(item.patrimonio_tag || "-")}</td>
      <td><strong>${escapeHtml(htFormatado)}</strong></td>
      <td style="text-align: center;">
        <button
          type="button"
          onclick="editarParque(${item.id})"
          style="background: #3b82f6; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; margin-right: 5px;"
        >
          Editar
        </button>
        <button
          type="button"
          onclick="excluirParque(${item.id})"
          style="background: #ef4444; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer;"
        >
          Excluir
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// --- MODAL PARQUE INSTALADO ---
window.abrirModalNovoParque = function () {
  document.getElementById("tituloModalParque").innerText =
    "Vincular Equipamento ao Cliente";
  document.getElementById("formParque").reset();
  document.getElementById("parqueIdEdicao").value = "";
  popularSelectClientes("");
  popularSelectModelos("");
  document.getElementById("modalParque").style.display = "flex";
};

window.fecharModalParque = function () {
  document.getElementById("modalParque").style.display = "none";
};

window.editarParque = function (id) {
  const item = parqueCache.find((p) => String(p.id) === String(id));
  if (!item) return;

  document.getElementById("tituloModalParque").innerText =
    "Editar Equipamento no Cliente";
  document.getElementById("parqueIdEdicao").value = item.id;
  popularSelectClientes(item.cliente_id || "");
  popularSelectModelos(item.modelo_id || "");
  document.getElementById("numero_serie").value = item.numero_serie || "";
  document.getElementById("patrimonio_tag").value = item.patrimonio_tag || "";
  document.getElementById("observacoes").value = item.observacoes || "";
  document.getElementById("modalParque").style.display = "flex";
};

window.salvarParque = async function (event) {
  event.preventDefault();

  const payload = {
    id: document.getElementById("parqueIdEdicao").value || null,
    cliente_id: parseInt(document.getElementById("cliente_id").value, 10),
    modelo_id: parseInt(document.getElementById("modelo_id").value, 10),
    numero_serie: document.getElementById("numero_serie").value.trim(),
    patrimonio_tag: document.getElementById("patrimonio_tag").value.trim(),
    observacoes: document.getElementById("observacoes").value.trim(),
  };

  try {
    const resp = await fetch(`${WEBHOOK_BASE}/parque-instalado-salvar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      alert("Erro ao salvar equipamento no parque instalado.");
      return;
    }

    fecharModalParque();
    parqueCache = await fetchJsonSafe(
      `${WEBHOOK_BASE}/parque-instalado-listar`,
      parqueCache,
    );
    renderizarTabelaParque();
  } catch (err) {
    console.error("Erro ao salvar parque instalado:", err);
    alert("Erro de conexão ao salvar equipamento.");
  }
};

window.excluirParque = async function (id) {
  if (
    !confirm("Deseja realmente remover este equipamento do parque instalado?")
  )
    return;

  try {
    const resp = await fetch(
      `${WEBHOOK_BASE}/parque-instalado-excluir?id=${id}`,
      {
        method: "DELETE",
      },
    );

    if (!resp.ok) {
      alert("Erro ao excluir equipamento.");
      return;
    }

    parqueCache = await fetchJsonSafe(
      `${WEBHOOK_BASE}/parque-instalado-listar`,
      parqueCache,
    );
    renderizarTabelaParque();
  } catch (err) {
    console.error("Erro ao excluir parque:", err);
    alert("Erro de conexão ao excluir equipamento.");
  }
};

// --- MODAL GERENCIAR TIPOS / MARCAS / MODELOS ---
window.abrirModalModelos = function () {
  limparFormModelo();
  popularSelectsCatalogoModelo();
  renderizarTabelaModelos();
  document.getElementById("modalModelos").style.display = "flex";
};

window.fecharModalModelos = function () {
  document.getElementById("modalModelos").style.display = "none";
  const modeloAtualSelect = document.getElementById("modelo_id")?.value || "";
  popularSelectModelos(modeloAtualSelect);
  renderizarTabelaParque();
};

window.limparFormModelo = function () {
  document.getElementById("modeloIdEdicao").value = "";
  document.getElementById("tituloFormModelo").innerText =
    "Novo Modelo de Equipamento";
  document.getElementById("modelo_nome").value = "";
  document.getElementById("modelo_horas_tecnicas_media").value = "";
  popularSelectsCatalogoModelo("", "");
};

window.salvarNovoTipo = async function () {
  const input = document.getElementById("novo_tipo_nome");
  const nome = input?.value.trim() || "";
  if (!nome) {
    alert("Informe o nome do tipo de equipamento.");
    return;
  }

  try {
    const resp = await fetch(`${WEBHOOK_BASE}/equipamentos-tipos-salvar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome }),
    });

    if (!resp.ok) {
      alert("Erro ao salvar tipo de equipamento.");
      return;
    }

    input.value = "";
    tiposCache = await fetchJsonSafe(
      `${WEBHOOK_BASE}/equipamentos-tipos-listar`,
      tiposCache,
    );
    const tipoSel = document.getElementById("modelo_tipo_id")?.value || "";
    const marcaSel = document.getElementById("modelo_marca_id")?.value || "";
    popularSelectsCatalogoModelo(tipoSel, marcaSel);
    renderizarTabelaModelos();
  } catch (err) {
    console.error("Erro ao salvar tipo:", err);
    alert("Erro de conexão ao salvar tipo.");
  }
};

window.salvarNovaMarca = async function () {
  const input = document.getElementById("novo_marca_nome");
  const nome = input?.value.trim() || "";
  if (!nome) {
    alert("Informe o nome da marca.");
    return;
  }

  try {
    const resp = await fetch(`${WEBHOOK_BASE}/equipamentos-marcas-salvar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome }),
    });

    if (!resp.ok) {
      alert("Erro ao salvar marca.");
      return;
    }

    input.value = "";
    marcasCache = await fetchJsonSafe(
      `${WEBHOOK_BASE}/equipamentos-marcas-listar`,
      marcasCache,
    );
    const tipoSel = document.getElementById("modelo_tipo_id")?.value || "";
    const marcaSel = document.getElementById("modelo_marca_id")?.value || "";
    popularSelectsCatalogoModelo(tipoSel, marcaSel);
    renderizarTabelaModelos();
  } catch (err) {
    console.error("Erro ao salvar marca:", err);
    alert("Erro de conexão ao salvar marca.");
  }
};

window.editarModelo = function (id) {
  const mod = modelosCache.find((m) => String(m.id) === String(id));
  if (!mod) return;

  document.getElementById("modeloIdEdicao").value = mod.id;
  document.getElementById("tituloFormModelo").innerText =
    `Editando Modelo #${mod.id}`;
  document.getElementById("modelo_nome").value = mod.nome || "";
  document.getElementById("modelo_horas_tecnicas_media").value =
    mod.horas_tecnicas_media ?? "";
  popularSelectsCatalogoModelo(mod.tipo_id || "", mod.marca_id || "");
};

window.salvarModelo = async function (event) {
  event.preventDefault();

  const payload = {
    id: document.getElementById("modeloIdEdicao").value || null,
    tipo_id: parseInt(document.getElementById("modelo_tipo_id").value, 10),
    marca_id: parseInt(document.getElementById("modelo_marca_id").value, 10),
    nome: document.getElementById("modelo_nome").value.trim(),
    horas_tecnicas_media:
      parseFloat(
        document.getElementById("modelo_horas_tecnicas_media").value,
      ) || 0,
  };

  try {
    const resp = await fetch(`${WEBHOOK_BASE}/equipamentos-modelos-salvar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      alert("Erro ao salvar modelo.");
      return;
    }

    modelosCache = await fetchJsonSafe(
      `${WEBHOOK_BASE}/equipamentos-modelos-listar`,
      modelosCache,
    );
    limparFormModelo();
    renderizarTabelaModelos();
  } catch (err) {
    console.error("Erro ao salvar modelo:", err);
    alert("Erro de conexão ao salvar modelo.");
  }
};

window.excluirModelo = async function (id) {
  if (!confirm("Deseja realmente excluir este modelo?")) return;

  try {
    const resp = await fetch(
      `${WEBHOOK_BASE}/equipamentos-modelos-excluir?id=${id}`,
      {
        method: "DELETE",
      },
    );

    if (!resp.ok) {
      alert(
        "Erro ao excluir modelo (verifique se não há equipamentos vinculados).",
      );
      return;
    }

    modelosCache = await fetchJsonSafe(
      `${WEBHOOK_BASE}/equipamentos-modelos-listar`,
      modelosCache,
    );
    renderizarTabelaModelos();
  } catch (err) {
    console.error("Erro ao excluir modelo:", err);
    alert("Erro de conexão ao excluir modelo.");
  }
};

function renderizarTabelaModelos() {
  const tbody = document.getElementById("listaModelosTabela");
  if (!tbody) return;

  if (!modelosCache || modelosCache.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 15px; color: #64748b;">
          Nenhum modelo cadastrado ainda.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = "";
  modelosCache.forEach((m) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(obterNomeTipo(m))}</td>
      <td>${escapeHtml(obterNomeMarca(m))}</td>
      <td><strong>${escapeHtml(m.nome || "-")}</strong></td>
      <td><strong>${escapeHtml(formatarHT(m.horas_tecnicas_media))}</strong></td>
      <td style="text-align: center;">
        <button
          type="button"
          onclick="editarModelo(${m.id})"
          style="background: #3b82f6; color: white; border: none; padding: 5px 9px; border-radius: 4px; cursor: pointer; margin-right: 4px; font-size: 0.82rem;"
        >
          Editar
        </button>
        <button
          type="button"
          onclick="excluirModelo(${m.id})"
          style="background: #ef4444; color: white; border: none; padding: 5px 9px; border-radius: 4px; cursor: pointer; font-size: 0.82rem;"
        >
          Excluir
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
