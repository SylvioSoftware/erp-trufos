const WEBHOOK_BASE = "https://n8n.trufos.com.br/webhook";

document.addEventListener("DOMContentLoaded", () => {
  carregarProdutos();
  carregarFornecedoresSelect();
  configurarCalculoAutomatico();

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

// 2. Carregar Fornecedores para o Select
async function carregarFornecedoresSelect() {
  try {
    const response = await fetch(`${WEBHOOK_BASE}/fornecedores-listar`);
    const fornecedores = await response.json();
    const select = document.getElementById("fornecedor_id");

    if (select && fornecedores) {
      fornecedores.forEach((f) => {
        const opt = document.createElement("option");
        opt.value = f.id;
        opt.textContent = f.nome_fantasia || f.razao_social;
        select.appendChild(opt);
      });
    }
  } catch (e) {
    console.error("Erro ao carregar select de fornecedores:", e);
  }
}

// 3. Precificação Inteligente Automática
function configurarCalculoAutomatico() {
  const triggers = document.querySelectorAll(".calc-trigger");
  triggers.forEach((input) => {
    input.addEventListener("input", calcularPrecoSugerido);
  });
}

function calcularPrecoSugerido() {
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
  document.getElementById("lblCustoTotal").innerText =
    `R$ ${custoTotal.toFixed(2)}`;

  const percentualDeducoes = (impostos + comissao + margemDesejada) / 100;
  let precoSugerido =
    percentualDeducoes < 1 ? custoTotal / (1 - percentualDeducoes) : custoTotal;

  document.getElementById("lblPrecoSugerido").innerText =
    `R$ ${precoSugerido.toFixed(2)}`;
  document.getElementById("preco_venda").value = precoSugerido.toFixed(2);
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
    // Fallback seguro baseado em tempo caso falhe a rede
    const fallbackNum = Math.floor(Date.now() / 1000) % 100000;
    return `P-${String(fallbackNum).padStart(11, "0")}`;
  }
}
// 5. Funções do Modal
window.abrirModalNovoProduto = async function () {
  document.getElementById("tituloModalProduto").innerText =
    "Nova Peça / Produto";
  document.getElementById("formProduto").reset();
  document.getElementById("produtoIdEdicao").value = "";

  // Busca o próximo código sequencial no banco
  const proximoCodigo = await gerarCodigoSequencial();
  document.getElementById("codigo").value = proximoCodigo;

  document.getElementById("modalProduto").style.display = "flex";
  calcularPrecoSugerido();
};

window.fecharModalProduto = function () {
  document.getElementById("modalProduto").style.display = "none";
};

window.editarProduto = function (prod) {
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
  document.getElementById("preco_venda").value = prod.preco_venda || "0.00";
  document.getElementById("fornecedor_id").value = prod.fornecedor_id || "";
  document.getElementById("chave_nfe_ultima_entrada").value =
    prod.chave_nfe_ultima_entrada || "";

  document.getElementById("modalProduto").style.display = "flex";
  calcularPrecoSugerido();
};

// 6. Salvar Produto
window.salvarProduto = async function (event) {
  event.preventDefault(); // Impede o recarregamento da página
  console.log("-> Função salvarProduto foi acionada com sucesso!");

  const codigoInput = document.getElementById("codigo");
  const descricaoInput = document.getElementById("descricao");

  const dados = {
    id: document.getElementById("produtoIdEdicao")
      ? document.getElementById("produtoIdEdicao").value
      : null,
    codigo: codigoInput ? codigoInput.value : "",
    descricao: descricaoInput ? descricaoInput.value : "",
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
    chave_nfe_ultima_entrada: document.getElementById(
      "chave_nfe_ultima_entrada",
    )
      ? document.getElementById("chave_nfe_ultima_entrada").value
      : "",
  };

  console.log("-> Dados montados para envio:", dados);

  try {
    console.log(`-> Disparando fetch para: ${WEBHOOK_BASE}/produto-salvar`);
    const response = await fetch(`${WEBHOOK_BASE}/produto-salvar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });

    console.log("-> Resposta recebida do servidor:", response.status);

    if (response.ok) {
      fecharModalProduto();
      carregarProdutos();
    } else {
      alert("Erro ao salvar o produto no servidor.");
    }
  } catch (e) {
    console.error("-> Erro crítico na requisição fetch:", e);
    alert("Erro de conexão ao salvar. Verifique o console.");
  }
};

// 7. Excluir Produto
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

// 8. Gerenciamento do De-Para de Fornecedores dentro do Modal
window.adicionarVinculoFornecedor = function () {
  const tbody = document.getElementById("tabelaVinculoFornecedores");
  if (!tbody) return;

  // Remove a mensagem de "nenhum vínculo" se for a primeira linha
  if (tbody.innerHTML.includes("Nenhum código")) {
    tbody.innerHTML = "";
  }

  const tr = document.createElement("tr");
  tr.innerHTML = `
        <td style="padding: 6px;">
            <select class="form-control" style="width: 100%; padding: 4px; font-size: 0.85rem;">
                <!-- Populado dinamicamente ou via select existente -->
                ${document.getElementById("fornecedor_id") ? document.getElementById("fornecedor_id").innerHTML : '<option value="">Selecione...</option>'}
            </select>
        </td>
        <td style="padding: 6px;">
            <input type="text" placeholder="Ex: REF-1234" style="width: 100%; padding: 4px; font-size: 0.85rem; border: 1px solid #cbd5e1; border-radius: 4px;" />
        </td>
        <td style="padding: 6px; text-align: center;">
            <button type="button" onclick="this.closest('tr').remove()" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">Remover</button>
        </td>
    `;
  tbody.appendChild(tr);
};
