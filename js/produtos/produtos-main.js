const WEBHOOK_BASE = "https://n8n.trufos.com.br/webhook";
let listaFornecedoresCache = [];
let ultimoPrecoSugeridoCalculado = 0;

document.addEventListener("DOMContentLoaded", () => {
  carregarProdutos();
  carregarFornecedoresCache();
  configurarCalculoAutomatico();
  configurarMonitorPrecoVenda();

  const filtroInput = document.getElementById("filtroProduto");
  if (filtroInput) {
    filtroInput.addEventListener("input", (e) => {
      const termo = e.target.value.toLowerCase();
      const linhas = document.querySelectorAll("#listaProdutosTabela tr");
      linhas.forEach((linha) => {
        const texto = linha.innerText.toLowerCase();
        linha.style.display = texto.includes(termo) ? "" : "none";
      });
    });
  }
});

// 1. Carregar Lista de Produtos
async function carregarProdutos() {
  const tbody = document.getElementById("listaProdutosTabela");
  tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px;">Carregando produtos...</td></tr>`;

  try {
    const response = await fetch(`${WEBHOOK_BASE}/produtos-listar`);
    if (!response.ok) throw new Error("Erro no servidor");

    const text = await response.text();
    const produtos = text ? JSON.parse(text) : [];

    tbody.innerHTML = "";

    if (!produtos || produtos.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: #64748b;">Nenhum produto cadastrado.</td></tr>`;
      return;
    }

    produtos.forEach((prod) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
                <td><strong>${prod.codigo || "-"}</strong></td>
                <td>${prod.descricao || "-"}</td>
                <td>R$ ${Number(prod.preco_custo || 0).toFixed(2)}</td>
                <td style="color: #059669; font-weight: 600;">R$ ${Number(prod.preco_venda || 0).toFixed(2)}</td>
                <td style="text-align: center;">
                    <button onclick='editarProduto(${JSON.stringify(prod)})' style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-right: 5px;">Editar</button>
                    <button onclick='excluirProduto(${prod.id})' style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Excluir</button>
                </td>
            `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error("Erro ao carregar produtos:", error);
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #ef4444; padding: 20px;">Erro ao conectar com o webhook de produtos no n8n.</td></tr>`;
  }
}

// 2. Carregar Fornecedores em cache para a tabela De-Para
async function carregarFornecedoresCache() {
  try {
    const response = await fetch(`${WEBHOOK_BASE}/fornecedores-listar`);
    const text = await response.text();
    const dados = text ? JSON.parse(text) : [];
    const lista = Array.isArray(dados) ? dados : dados.data || [];
    listaFornecedoresCache = lista.filter((f) => f && f.id);
  } catch (e) {
    console.error("Erro ao carregar lista de fornecedores:", e);
    listaFornecedoresCache = [];
  }
}

function montarOptionsFornecedores(selectedId = "") {
  let options = '<option value="">Selecione...</option>';
  listaFornecedoresCache.forEach((f) => {
    const nome = f.nome_fantasia || f.razao_social || `Fornecedor #${f.id}`;
    const isSelected = String(f.id) === String(selectedId) ? "selected" : "";
    options += `<option value="${f.id}" ${isSelected}>${nome}</option>`;
  });
  return options;
}

// 3. Precificação Inteligente Automática + Alerta Visual
function configurarCalculoAutomatico() {
  const triggers = document.querySelectorAll(".calc-trigger");
  triggers.forEach((input) => {
    input.addEventListener("input", () => {
      calcularPrecoSugerido({
        forcarAtualizarVenda: false,
        sugeridoAnterior: ultimoPrecoSugeridoCalculado,
      });
    });
  });
}

function configurarMonitorPrecoVenda() {
  const inputVenda = document.getElementById("preco_venda");
  if (!inputVenda) return;

  inputVenda.addEventListener("input", () => {
    atualizarIndicadorPrecoPraticado(ultimoPrecoSugeridoCalculado);
  });
}

function atualizarIndicadorPrecoPraticado(precoSugerido) {
  const inputVenda = document.getElementById("preco_venda");
  const alertaEl = document.getElementById("alertaPrecoAbaixo");
  if (!inputVenda) return;

  const precoPraticado = parseFloat(inputVenda.value) || 0;

  const praticadoCentavos = Math.round(precoPraticado * 100);
  const sugeridoCentavos = Math.round(precoSugerido * 100);

  if (
    sugeridoCentavos > 0 &&
    praticadoCentavos > 0 &&
    praticadoCentavos < sugeridoCentavos
  ) {
    inputVenda.style.borderColor = "#dc2626";
    inputVenda.style.backgroundColor = "#fef2f2";
    inputVenda.style.color = "#b91c1c";
    if (alertaEl) {
      alertaEl.style.display = "block";
      alertaEl.textContent = `⚠ Preço praticado abaixo do sugerido (R$ ${precoSugerido.toFixed(2)}).`;
    }
  } else {
    inputVenda.style.borderColor = "#cbd5e1";
    inputVenda.style.backgroundColor = "#ffffff";
    inputVenda.style.color = "#059669";
    if (alertaEl) {
      alertaEl.style.display = "none";
      alertaEl.textContent = "";
    }
  }
}

function calcularPrecoSugerido({
  forcarAtualizarVenda = false,
  sugeridoAnterior = null,
} = {}) {
  const custo = parseFloat(document.getElementById("preco_custo").value) || 0;
  const frete =
    parseFloat(document.getElementById("frete_unitario").value) || 0;
  const despesas =
    parseFloat(document.getElementById("outras_despesas").value) || 0;

  const impostos =
    parseFloat(document.getElementById("impostos_percentual").value) || 0;
  const comissao =
    parseFloat(document.getElementById("comissao_percentual").value) || 0;
  const margemDesejada =
    parseFloat(document.getElementById("margem_lucro").value) || 0;

  const custoTotal = custo + frete + despesas;
  const lblCustoTotal = document.getElementById("lblCustoTotal");
  if (lblCustoTotal) {
    lblCustoTotal.innerText = `R$ ${custoTotal.toFixed(2)}`;
  }

  const percentualDeducoes = (impostos + comissao + margemDesejada) / 100;
  const precoSugerido =
    percentualDeducoes < 1 ? custoTotal / (1 - percentualDeducoes) : custoTotal;

  const lblPrecoSugerido = document.getElementById("lblPrecoSugerido");
  if (lblPrecoSugerido) {
    lblPrecoSugerido.innerText = `R$ ${precoSugerido.toFixed(2)}`;
  }

  const inputVenda = document.getElementById("preco_venda");
  if (inputVenda) {
    const rawValue = inputVenda.value;
    const isNullOrEmpty =
      rawValue === null ||
      rawValue === undefined ||
      String(rawValue).trim() === "";
    const valorAtualVenda = isNullOrEmpty ? null : parseFloat(rawValue);

    const estavaZeradoOuNulo =
      valorAtualVenda === null ||
      Number.isNaN(valorAtualVenda) ||
      valorAtualVenda === 0;

    const baseAnteriorNumerico =
      sugeridoAnterior !== null && sugeridoAnterior !== undefined
        ? Number(sugeridoAnterior)
        : Number(ultimoPrecoSugeridoCalculado);

    const pratCentavos = Math.round(valorAtualVenda * 100);
    const antSugCentavos = Math.round(baseAnteriorNumerico * 100);

    const seguiaSugeridoAnterior =
      valorAtualVenda !== null &&
      !Number.isNaN(valorAtualVenda) &&
      Math.abs(pratCentavos - antSugCentavos) <= 1;

    // Atualiza o preço de venda se for forçado, vazio/nulo/zero, ou se acompanhava o sugerido anterior
    if (forcarAtualizarVenda || estavaZeradoOuNulo || seguiaSugeridoAnterior) {
      inputVenda.value = precoSugerido.toFixed(2);
    }
  }

  ultimoPrecoSugeridoCalculado = precoSugerido;
  atualizarIndicadorPrecoPraticado(precoSugerido);
}

// 4. Gerador de Código Sequencial Real (Padrão 13 caracteres: P-00000000001)
async function gerarCodigoSequencial() {
  try {
    const response = await fetch(`${WEBHOOK_BASE}/produtos-listar`);
    const produtos = await response.json();

    let maiorNumero = 0;

    if (produtos && produtos.length > 0) {
      produtos.forEach((p) => {
        if (p.codigo && p.codigo.startsWith("P-")) {
          const numStr = p.codigo.replace("P-", "");
          const num = parseInt(numStr, 10);
          if (!isNaN(num) && num > maiorNumero) {
            maiorNumero = num;
          }
        }
      });
    }

    const proximoNum = maiorNumero + 1;
    return `P-${String(proximoNum).padStart(11, "0")}`;
  } catch (e) {
    console.error("Erro ao gerar código sequencial:", e);
    const fallbackNum = Math.floor(Date.now() / 1000) % 100000;
    return `P-${String(fallbackNum).padStart(11, "0")}`;
  }
}

// 5. Modal Sobreposto de Informações Fiscais
function atualizarResumoFiscalBadge() {
  const ncm = document.getElementById("ncm").value.trim();
  const badge = document.getElementById("resumoFiscalBadge");
  if (!badge) return;

  if (ncm) {
    badge.textContent = `NCM: ${ncm}`;
    badge.style.color = "#059669";
  } else {
    badge.textContent = "NCM: -";
    badge.style.color = "#64748b";
  }
}

window.abrirModalInformacoesFiscais = function () {
  document.getElementById("fiscal_ncm").value =
    document.getElementById("ncm").value || "";
  document.getElementById("fiscal_origem").value =
    document.getElementById("origem").value ?? "0";
  document.getElementById("fiscal_cfop").value =
    document.getElementById("cfop").value || "";
  document.getElementById("fiscal_cst_csosn").value =
    document.getElementById("cst_csosn").value || "";
  document.getElementById("fiscal_unidade_medida").value =
    document.getElementById("unidade_medida").value || "UN";
  document.getElementById("fiscal_cest").value =
    document.getElementById("cest").value || "";
  document.getElementById("fiscal_peso_liquido").value = Number(
    document.getElementById("peso_liquido").value || 0,
  ).toFixed(3);
  document.getElementById("fiscal_peso_bruto").value = Number(
    document.getElementById("peso_bruto").value || 0,
  ).toFixed(3);

  document.getElementById("modalInformacoesFiscais").style.display = "flex";
};

window.fecharModalInformacoesFiscais = function () {
  document.getElementById("modalInformacoesFiscais").style.display = "none";
};

window.aplicarInformacoesFiscais = function () {
  document.getElementById("ncm").value = document
    .getElementById("fiscal_ncm")
    .value.trim();
  document.getElementById("origem").value =
    document.getElementById("fiscal_origem").value;
  document.getElementById("cfop").value = document
    .getElementById("fiscal_cfop")
    .value.trim();
  document.getElementById("cst_csosn").value = document
    .getElementById("fiscal_cst_csosn")
    .value.trim();
  document.getElementById("unidade_medida").value =
    document.getElementById("fiscal_unidade_medida").value.trim() || "UN";
  document.getElementById("cest").value = document
    .getElementById("fiscal_cest")
    .value.trim();
  document.getElementById("peso_liquido").value =
    parseFloat(document.getElementById("fiscal_peso_liquido").value) || 0;
  document.getElementById("peso_bruto").value =
    parseFloat(document.getElementById("fiscal_peso_bruto").value) || 0;

  atualizarResumoFiscalBadge();
  fecharModalInformacoesFiscais();
};

// 6. Funções do Modal Principal de Produto
window.abrirModalNovoProduto = async function () {
  document.getElementById("tituloModalProduto").innerText =
    "Nova Peça / Produto";
  document.getElementById("formProduto").reset();
  document.getElementById("produtoIdEdicao").value = "";

  document.getElementById("ncm").value = "";
  document.getElementById("origem").value = "0";
  document.getElementById("unidade_medida").value = "UN";
  document.getElementById("cfop").value = "";
  document.getElementById("cst_csosn").value = "";
  document.getElementById("cest").value = "";
  document.getElementById("peso_liquido").value = "0.000";
  document.getElementById("peso_bruto").value = "0.000";
  atualizarResumoFiscalBadge();

  const tbodyDePara = document.getElementById("tabelaVinculoFornecedores");
  if (tbodyDePara) {
    tbodyDePara.innerHTML = `<tr><td colspan="4" style="padding: 8px; text-align: center; color: #64748b;">Nenhum código de fornecedor vinculado.</td></tr>`;
  }

  const proximoCodigo = await gerarCodigoSequencial();
  document.getElementById("codigo").value = proximoCodigo;

  document.getElementById("modalProduto").style.display = "flex";
  calcularPrecoSugerido({ forcarAtualizarVenda: true });
};

window.fecharModalProduto = function () {
  fecharModalInformacoesFiscais();
  document.getElementById("modalProduto").style.display = "none";
};

window.editarProduto = async function (prod) {
  document.getElementById("tituloModalProduto").innerText =
    "Editar Peça / Produto";
  document.getElementById("produtoIdEdicao").value = prod.id || "";
  document.getElementById("codigo").value = prod.codigo || "";
  document.getElementById("descricao").value = prod.descricao || "";
  document.getElementById("preco_custo").value = prod.preco_custo || "0.00";
  document.getElementById("frete_unitario").value =
    prod.frete_unitario || "0.00";
  document.getElementById("outras_despesas").value =
    prod.outras_despesas || "0.00";
  document.getElementById("impostos_percentual").value =
    prod.impostos_percentual || "0.00";
  document.getElementById("comissao_percentual").value =
    prod.comissao_percentual || "0.00";
  document.getElementById("margem_lucro").value = prod.margem_lucro || "30.00";
  document.getElementById("preco_venda").value =
    prod.preco_venda !== null && prod.preco_venda !== undefined
      ? prod.preco_venda
      : "0.00";
  document.getElementById("chave_nfe_ultima_entrada").value =
    prod.chave_nfe_ultima_entrada || "";

  document.getElementById("ncm").value = prod.ncm || "";
  document.getElementById("origem").value = prod.origem ?? "0";
  document.getElementById("unidade_medida").value = prod.unidade_medida || "UN";
  document.getElementById("cfop").value = prod.cfop || "";
  document.getElementById("cst_csosn").value = prod.cst_csosn || "";
  document.getElementById("cest").value = prod.cest || "";
  document.getElementById("peso_liquido").value = prod.peso_liquido ?? "0.000";
  document.getElementById("peso_bruto").value = prod.peso_bruto ?? "0.000";
  atualizarResumoFiscalBadge();

  // Calcula o sugerido base do produto aberto sem sobrescrever preço personalizado
  const custoBase =
    (parseFloat(prod.preco_custo) || 0) +
    (parseFloat(prod.frete_unitario) || 0) +
    (parseFloat(prod.outras_despesas) || 0);
  const deducoesBase =
    ((parseFloat(prod.impostos_percentual) || 0) +
      (parseFloat(prod.comissao_percentual) || 0) +
      (parseFloat(prod.margem_lucro) || 0)) /
    100;
  ultimoPrecoSugeridoCalculado =
    deducoesBase < 1 ? custoBase / (1 - deducoesBase) : custoBase;

  document.getElementById("modalProduto").style.display = "flex";
  calcularPrecoSugerido({
    forcarAtualizarVenda: false,
    sugeridoAnterior: ultimoPrecoSugeridoCalculado,
  });

  if (prod.id) {
    await carregarVinculosFornecedor(prod.id);
  }
};

// 7. De-Para de Fornecedores (Carregar, Adicionar, Coletar e Salvar)
async function carregarVinculosFornecedor(produtoId) {
  const tbody = document.getElementById("tabelaVinculoFornecedores");
  if (!tbody) return;

  if (listaFornecedoresCache.length === 0) {
    await carregarFornecedoresCache();
  }

  tbody.innerHTML = `<tr><td colspan="4" style="padding: 8px; text-align: center; color: #64748b;">Carregando vínculos...</td></tr>`;

  try {
    const response = await fetch(
      `${WEBHOOK_BASE}/produto-fornecedores-listar?produto_id=${produtoId}`,
    );
    const text = await response.text();
    const dados = text ? JSON.parse(text) : [];
    const vinculos = (Array.isArray(dados) ? dados : dados.data || []).filter(
      (v) => v && v.fornecedor_id,
    );

    tbody.innerHTML = "";

    if (vinculos.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="padding: 8px; text-align: center; color: #64748b;">Nenhum código de fornecedor vinculado.</td></tr>`;
      return;
    }

    vinculos.forEach((v) => {
      inserirLinhaDePara(
        v.fornecedor_id,
        v.codigo_no_fornecedor || "",
        v.descricao_no_fornecedor || "",
      );
    });
  } catch (e) {
    console.error("Erro ao carregar vínculos De-Para:", e);
    tbody.innerHTML = `<tr><td colspan="4" style="padding: 8px; text-align: center; color: #ef4444;">Erro ao carregar vínculos de fornecedores.</td></tr>`;
  }
}

function inserirLinhaDePara(
  fornecedorId = "",
  codigoFornecedor = "",
  descricaoFornecedor = "",
) {
  const tbody = document.getElementById("tabelaVinculoFornecedores");
  if (!tbody) return;

  if (tbody.innerHTML.includes("Nenhum código")) {
    tbody.innerHTML = "";
  }

  const tr = document.createElement("tr");
  tr.className = "linha-depara";
  tr.innerHTML = `
        <td style="padding: 6px;">
            <select class="form-control depara-fornecedor" style="width: 100%; padding: 4px; font-size: 0.85rem;">
                ${montarOptionsFornecedores(fornecedorId)}
            </select>
        </td>
        <td style="padding: 6px;">
            <input type="text" class="depara-codigo" value="${codigoFornecedor.replace(/"/g, "&quot;")}" placeholder="Ex: REF-1234" style="width: 100%; padding: 4px; font-size: 0.85rem; border: 1px solid #cbd5e1; border-radius: 4px;" />
        </td>
        <td style="padding: 6px;">
            <input type="text" class="depara-descricao" value="${descricaoFornecedor.replace(/"/g, "&quot;")}" placeholder="Descrição no fornecedor" style="width: 100%; padding: 4px; font-size: 0.85rem; border: 1px solid #cbd5e1; border-radius: 4px;" />
        </td>
        <td style="padding: 6px; text-align: center;">
            <button type="button" onclick="this.closest('tr').remove()" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">Remover</button>
        </td>
    `;
  tbody.appendChild(tr);
}

window.adicionarVinculoFornecedor = async function () {
  if (listaFornecedoresCache.length === 0) {
    await carregarFornecedoresCache();
  }
  inserirLinhaDePara("", "", "");
};

function coletarVinculosDePara() {
  const linhas = document.querySelectorAll(
    "#tabelaVinculoFornecedores tr.linha-depara",
  );
  const vinculos = [];

  linhas.forEach((tr) => {
    const fornecedorId = tr.querySelector(".depara-fornecedor")?.value || "";
    const codigoNoFornecedor =
      tr.querySelector(".depara-codigo")?.value.trim() || "";
    const descricaoNoFornecedor =
      tr.querySelector(".depara-descricao")?.value.trim() || "";

    if (fornecedorId && codigoNoFornecedor) {
      vinculos.push({
        fornecedor_id: parseInt(fornecedorId, 10),
        codigo_no_fornecedor: codigoNoFornecedor,
        descricao_no_fornecedor: descricaoNoFornecedor,
      });
    }
  });

  return vinculos;
}

// 8. Salvar Produto + Sincronizar De-Para
window.salvarProduto = async function (event) {
  event.preventDefault();

  const codigoInput = document.getElementById("codigo");
  const descricaoInput = document.getElementById("descricao");

  const dados = {
    id: document.getElementById("produtoIdEdicao")?.value || null,
    codigo: codigoInput ? codigoInput.value.trim() : "",
    descricao: descricaoInput ? descricaoInput.value.trim() : "",
    preco_custo: parseFloat(document.getElementById("preco_custo").value) || 0,
    frete_unitario:
      parseFloat(document.getElementById("frete_unitario").value) || 0,
    outras_despesas:
      parseFloat(document.getElementById("outras_despesas").value) || 0,
    impostos_percentual:
      parseFloat(document.getElementById("impostos_percentual").value) || 0,
    comissao_percentual:
      parseFloat(document.getElementById("comissao_percentual").value) || 0,
    margem_lucro:
      parseFloat(document.getElementById("margem_lucro").value) || 0,
    preco_venda: parseFloat(document.getElementById("preco_venda").value) || 0,
    chave_nfe_ultima_entrada:
      document.getElementById("chave_nfe_ultima_entrada")?.value.trim() || "",
    ncm: document.getElementById("ncm")?.value.trim() || "",
    origem: parseInt(document.getElementById("origem")?.value ?? "0", 10) || 0,
    unidade_medida:
      document.getElementById("unidade_medida")?.value.trim() || "UN",
    cfop: document.getElementById("cfop")?.value.trim() || "",
    cst_csosn: document.getElementById("cst_csosn")?.value.trim() || "",
    cest: document.getElementById("cest")?.value.trim() || "",
    peso_liquido:
      parseFloat(document.getElementById("peso_liquido")?.value) || 0,
    peso_bruto: parseFloat(document.getElementById("peso_bruto")?.value) || 0,
    fornecedores_vinculados: coletarVinculosDePara(),
  };

  try {
    const response = await fetch(`${WEBHOOK_BASE}/produto-salvar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });

    if (!response.ok) {
      alert("Erro ao salvar o produto no servidor.");
      return;
    }

    const textoRetorno = await response.text();
    let retornoJson = null;
    try {
      retornoJson = textoRetorno ? JSON.parse(textoRetorno) : null;
    } catch (_) {}

    const itemRetorno = Array.isArray(retornoJson)
      ? retornoJson[0]
      : retornoJson;
    const produtoIdSalvo =
      itemRetorno?.id ||
      itemRetorno?.produto_id ||
      document.getElementById("produtoIdEdicao")?.value ||
      null;

    if (produtoIdSalvo) {
      await fetch(`${WEBHOOK_BASE}/produto-fornecedores-salvar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produto_id: parseInt(produtoIdSalvo, 10),
          vinculos: dados.fornecedores_vinculados,
        }),
      });
    }

    fecharModalProduto();
    carregarProdutos();
  } catch (e) {
    console.error("Erro crítico na requisição fetch:", e);
    alert("Erro de conexão ao salvar. Verifique o console.");
  }
};

// 9. Excluir Produto
window.excluirProduto = async function (id) {
  if (!confirm("Deseja realmente excluir este produto/peça?")) return;

  try {
    const response = await fetch(`${WEBHOOK_BASE}/produto-excluir?id=${id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      carregarProdutos();
    } else {
      alert("Erro ao excluir o produto.");
    }
  } catch (e) {
    console.error("Erro na exclusão:", e);
    alert("Erro de conexão ao excluir.");
  }
};
