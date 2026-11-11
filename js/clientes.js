// ==========================================
// TRUFOS ERP - GESTÃO DE CLIENTES (clientes.js)
// ==========================================

window.addEventListener("DOMContentLoaded", () => {
  carregarClientes();
});

// 1. Função que carrega a listagem de clientes na tabela principal
async function carregarClientes() {
  try {
    const response = await fetch(
      "https://n8n.trufos.com.br/webhook/clientes-listar",
    );
    const dados = await response.json();

    const tbody = document.getElementById("listaClientesTabela");
    if (dados && dados.length > 0) {
      tbody.innerHTML = dados
        .map(
          (c) => `
                <tr>
                    <td><strong>#${c.id}</strong></td>
                    <td>${c.razao_social} <br><small style="color: #666;">${c.nome_fantasia || ""}</small></td>
                    <td>${c.cnpj}</td>
                    <td>${c.contato || "-"}</td>
                    <td>${c.whatsapp}</td>
                    <td>
                        <button class="btn-acao" title="Editar" onclick="editarCliente(${c.id})">✏️</button>
                        <button class="btn-acao" title="Equipamentos" onclick="verEquipamentos(${c.id})">🔬</button>
                    </td>
                </tr>
            `,
        )
        .join("");
    }
  } catch (error) {
    console.error("Erro ao carregar clientes:", error);
  }
}

// 2. A sua função de consulta de CNPJ com dupla checagem (Banco + Receita)
async function consultarCNPJ(cnpj) {
  const cnpjLimpo = cnpj.replace(/\D/g, "");

  if (cnpjLimpo.length !== 14) return;

  const statusEl = document.getElementById("statusCnpj");
  statusEl.innerHTML = "🔍 Verificando se o cliente já existe na base...";
  statusEl.style.color = "#d97706";

  try {
    // 1. PRIMEIRO PASSO: Verifica no seu banco de dados (via webhook do n8n)
    const responseCheck = await fetch(
      `https://n8n.trufos.com.br/webhook/cliente-busca?cnpj=${cnpjLimpo}`,
    );
    const resultadoBanco = await responseCheck.json();

    if (resultadoBanco && resultadoBanco.encontrado) {
      statusEl.innerHTML = `⚠️ CNPJ já cadastrado para: <strong>${resultadoBanco.cliente.razao_social}</strong>`;
      statusEl.style.color = "#dc2626";

      // Preenche os campos com os dados que já estão no banco
      document.getElementById("razao_social").value =
        resultadoBanco.cliente.razao_social;
      document.getElementById("nome_fantasia").value =
        resultadoBanco.cliente.nome_fantasia || "";
      document.getElementById("whatsapp").value =
        resultadoBanco.cliente.whatsapp || "";
      document.getElementById("contato").value =
        resultadoBanco.cliente.contato || "";
      return; // Interrompe para não consultar a Receita Federal à toa!
    }

    // 2. SE NÃO EXISTE NO BANCO: Consulta a Receita Federal (BrasilAPI)
    statusEl.innerHTML = "⏳ CNPJ novo. Buscando dados na Receita Federal...";

    const responseReceita = await fetch(
      `https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`,
    );
    if (!responseReceita.ok)
      throw new Error("CNPJ não encontrado na Receita Federal");

    const dadosReceita = await responseReceita.json();

    document.getElementById("razao_social").value =
      dadosReceita.razao_social || "";
    document.getElementById("nome_fantasia").value =
      dadosReceita.nome_fantasia || dadosReceita.razao_social || "";

    statusEl.innerHTML = "✅ CNPJ novo validado e dados carregados!";
    statusEl.style.color = "#16a34a";
  } catch (error) {
    console.error(error);
    statusEl.innerHTML =
      "⚠️ Não foi possível validar o CNPJ. Verifique o número digitado.";
    statusEl.style.color = "#dc2626";
  }
}

// 3. Controle do Modal e Salvamento
function abrirModalNovoCliente() {
  document.getElementById("modalCliente").style.display = "flex";
}

function fecharModalCliente() {
  document.getElementById("modalCliente").style.display = "none";
  document.getElementById("formCliente").reset();
  document.getElementById("statusCnpj").innerHTML = "";
}

async function salvarCliente(event) {
  event.preventDefault();

  const dadosCliente = {
    cnpj: document.getElementById("cnpj").value,
    razao_social: document.getElementById("razao_social").value,
    nome_fantasia: document.getElementById("nome_fantasia").value,
    contato: document.getElementById("contato").value,
    whatsapp: document.getElementById("whatsapp").value,
    prazo_manutencao: document.getElementById("prazo_manutencao").value,
  };

  try {
    const response = await fetch(
      "https://n8n.trufos.com.br/webhook/cliente-salvar",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosCliente),
      },
    );

    if (response.ok) {
      alert("Cliente salvo com sucesso!");
      fecharModalCliente();
      carregarClientes();
    } else {
      alert("Erro ao salvar o cliente.");
    }
  } catch (error) {
    console.error("Erro na requisição:", error);
    alert("Erro de conexão ao salvar cliente.");
  }
}

function editarCliente(id) {
  alert(`Editar cliente ID: ${id}`);
}

function verEquipamentos(id) {
  window.location.href = `equipamentos.html?cliente_id=${id}`;
}
