import { createModalParque } from "./modal-parque.js";
import { createModalModelos } from "./modal-modelos.js";

const WEBHOOK_BASE = "https://n8n.trufos.com.br/webhook";

let clientesCache = [];
let tiposCache = [];
let marcasCache = [];
let modelosCache = [];
let parqueCache = [];

let modalParqueApi = null;
let modalModelosApi = null;

document.addEventListener("DOMContentLoaded", async () => {
  modalParqueApi = createModalParque({
    webhookBase: WEBHOOK_BASE,
    getState: () => ({
      clientesCache,
      modelosCache,
      parqueCache,
      obterNomeTipo,
      obterNomeMarca,
      formatarHT,
    }),
    fetchJsonSafe,
    onSalvo: async (novoParque) => {
      parqueCache = novoParque;
      renderizarTabelaParque();
    },
  });

  modalModelosApi = createModalModelos({
    webhookBase: WEBHOOK_BASE,
    getState: () => ({
      tiposCache,
      marcasCache,
      modelosCache,
      obterNomeTipo,
      obterNomeMarca,
      formatarHT,
    }),
    fetchJsonSafe,
    onCatalogoAtualizado: async (parcial = {}) => {
      if (parcial.tiposCache) tiposCache = parcial.tiposCache;
      if (parcial.marcasCache) marcasCache = parcial.marcasCache;
      if (parcial.modelosCache) modelosCache = parcial.modelosCache;
      modalParqueApi?.atualizarSelectModelos();
      renderizarTabelaParque();
    },
  });

  modalParqueApi.init();
  modalModelosApi.init();
  configurarFiltroBusca();
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

  renderizarTabelaParque();
  modalModelosApi?.renderizarTabela();
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
  itensValidos.forEach((item) => {
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

// --- EXPOSIÇÃO GLOBAL PARA ATRIBUTOS ONCLICK DO HTML ---
window.abrirModalNovoParque = () => modalParqueApi?.abrirNovo();
window.fecharModalParque = () => modalParqueApi?.fechar();
window.editarParque = (id) => modalParqueApi?.abrirEdicao(id);
window.salvarParque = (event) => modalParqueApi?.salvar(event);

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

window.abrirModalModelos = () => modalModelosApi?.abrir();
window.fecharModalModelos = () => modalModelosApi?.fechar();
window.limparFormModelo = () => modalModelosApi?.limparForm();
window.salvarNovoTipo = () => modalModelosApi?.salvarNovoTipo();
window.salvarNovaMarca = () => modalModelosApi?.salvarNovaMarca();
window.editarModelo = (id) => modalModelosApi?.editar(id);
window.salvarModelo = (event) => modalModelosApi?.salvar(event);
window.excluirModelo = (id) => modalModelosApi?.excluir(id);

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
