// ==========================================
// TRUFOS ERP - GESTÃO DE CLIENTES (clientes.js)
// ==========================================

window.addEventListener("DOMContentLoaded", () => {
  carregarClientes();
});

// Adiciona o evento de digitação na barra de busca (pesquisa por qualquer campo/endereço)
document.addEventListener("DOMContentLoaded", () => {
  const inputBusca = document.querySelector("input[placeholder*='Buscar']");
  if (inputBusca) {
    inputBusca.addEventListener("input", (e) => {
      const termo = e.target.value.toLowerCase().trim();
      const linhas = document.querySelectorAll("#listaClientesTabela tr");

      linhas.forEach((linha) => {
        const dadosLinha =
          linha.getAttribute("data-busca") || linha.textContent.toLowerCase();
        linha.style.display = dadosLinha.includes(termo) ? "" : "none";
      });
    });
  }
});

let clienteAtualId = null;

function configurarBotaoContatos(habilitado, id = null) {
  clienteAtualId = id;
  const btn = document.getElementById("btnModalContatos");

  if (habilitado) {
    btn.removeAttribute("disabled");
    btn.style.cursor = "pointer";
    btn.style.opacity = "1";
    btn.style.color = "#334155";
    btn.style.background = "#f1f5f9";
  } else {
    btn.setAttribute("disabled", "true");
    btn.style.cursor = "not-allowed";
    btn.style.opacity = "0.6";
    btn.style.color = "#94a3b8";
    btn.style.background = "#f1f5f9";
  }
}

async function carregarClientes() {
  try {
    const response = await fetch(
      "https://n8n.trufos.com.br/webhook/clientes-listar",
    );
    const dados = await response.json();

    const tbody = document.getElementById("listaClientesTabela");
    if (dados && dados.length > 0) {
      tbody.innerHTML = dados
        .map((c) => {
          const cnpjLimpo = (c.cnpj || "").replace(/\D/g, "");
          const termoBusca =
            `${c.nome_fantasia || ""} ${c.razao_social || ""} ${c.cnpj || ""} ${c.logradouro || ""} ${c.bairro || ""} ${c.cidade || ""} ${c.uf || ""}`.toLowerCase();

          return `
              <tr data-busca="${termoBusca}">
                <td>
                  <strong>${c.nome_fantasia || c.razao_social}</strong>
                  ${c.nome_fantasia ? `<br><small style="color: #64748b;">${c.razao_social}</small>` : ""}
                </td>
                <td>${c.cidade || "-"}/${c.uf || ""}</td>
                <td style="white-space: nowrap;">
                  <button class="btn-acao" title="Editar / Detalhes" onclick="editarCliente(${c.id})">✏️</button>
                  <button class="btn-acao" title="Equipamentos" onclick="verEquipamentos(${c.id})">🔬</button>
                  <button class="btn-acao" title="Ordens de Serviço" onclick="verOrdensServico(${c.id})">🛠️</button>
                  <button class="btn-acao" title="Contatos do Cliente" onclick="verContatos(${c.id})">👥</button>
                  <button class="btn-acao" title="Histórico WhatsApp" onclick="verConversasWA(${c.id})">💬</button>
                  <button class="btn-acao" title="Apontamento Clockify" onclick="verClockifyCliente(${c.id})">⏱️</button>
                </td>
              </tr>
            `;
        })
        .join("");
    } else {
      tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #666;">Nenhum cliente cadastrado.</td></tr>`;
    }
  } catch (error) {
    console.error("Erro ao carregar clientes:", error);
  }
}

async function consultarCNPJ(cnpj) {
  const cnpjLimpo = cnpj.replace(/\D/g, "");

  if (cnpjLimpo.length !== 14) return;

  const statusEl = document.getElementById("statusCnpj");
  statusEl.innerHTML = "🔍 Consultando CNPJ...";
  statusEl.style.color = "#d97706";

  try {
    const response = await fetch(
      `https://n8n.trufos.com.br/webhook/cliente-busca?cnpj=${cnpjLimpo}`,
    );
    const resultado = await response.json();

    if (resultado && resultado.encontrado) {
      statusEl.innerHTML = `⚠️ CNPJ já cadastrado para: <strong>${resultado.cliente.razao_social}</strong>`;
      statusEl.style.color = "#dc2626";
      configurarBotaoContatos(true, resultado.cliente.id);
    } else {
      statusEl.innerHTML = "✅ CNPJ novo validado!";
      statusEl.style.color = "#16a34a";
      configurarBotaoContatos(false, null);
    }

    const c = resultado.cliente || {};
    document.getElementById("razao_social").value = c.razao_social || "";
    document.getElementById("nome_fantasia").value = c.nome_fantasia || "";
    document.getElementById("inscricao_estadual").value =
      c.inscricao_estadual || "";
    document.getElementById("inscricao_municipal").value =
      c.inscricao_municipal || "";
    document.getElementById("cep").value = c.cep || "";
    document.getElementById("logradouro").value = c.logradouro || "";
    document.getElementById("numero").value = c.numero || "";
    document.getElementById("complemento").value = c.complemento || "";
    document.getElementById("bairro").value = c.bairro || "";
    document.getElementById("cidade").value = c.cidade || "";
    document.getElementById("uf").value = c.estado || c.uf || "";

    if (c.prazo_manutencao) {
      document.getElementById("prazo_manutencao").value = c.prazo_manutencao;
    }
  } catch (error) {
    console.error(error);
    statusEl.innerHTML = "⚠️ Erro ao consultar o CNPJ.";
    statusEl.style.color = "#dc2626";
    configurarBotaoContatos(false, null);
  }
}

function abrirModalNovoCliente() {
  configurarBotaoContatos(false, null);
  document.getElementById("modalCliente").style.display = "flex";
}

function fecharModalCliente() {
  document.getElementById("modalCliente").style.display = "none";
  document.getElementById("formCliente").reset();
  document.getElementById("statusCnpj").innerHTML = "";
  configurarBotaoContatos(false, null);
}

async function salvarCliente(event) {
  event.preventDefault();

  const dadosCliente = {
    cnpj: document.getElementById("cnpj").value,
    razao_social: document.getElementById("razao_social").value,
    nome_fantasia: document.getElementById("nome_fantasia").value,
    inscricao_estadual: document.getElementById("inscricao_estadual").value,
    inscricao_municipal: document.getElementById("inscricao_municipal").value,
    cep: document.getElementById("cep").value,
    logradouro: document.getElementById("logradouro").value,
    numero: document.getElementById("numero").value,
    complemento: document.getElementById("complemento").value,
    bairro: document.getElementById("bairro").value,
    cidade: document.getElementById("cidade").value,
    uf: document.getElementById("uf").value,
    prazo_manutencao:
      parseInt(document.getElementById("prazo_manutencao").value) || 12,
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
      alert("Erro ao salvar o cliente no servidor.");
    }
  } catch (error) {
    console.error("Erro na requisição:", error);
    alert("Erro de conexão ao salvar cliente.");
  }
}

async function editarCliente(id) {
  try {
    abrirModalNovoCliente();

    document.getElementById("statusCnpj").innerHTML =
      "✏️ Carregando dados para edição...";
    document.getElementById("statusCnpj").style.color = "#2563eb";

    const response = await fetch(
      `https://n8n.trufos.com.br/webhook/cliente-busca?id=${id}`,
    );
    const resultado = await response.json();

    const dadosRetorno = Array.isArray(resultado) ? resultado[0] : resultado;
    const c = dadosRetorno?.cliente || dadosRetorno || {};

    // Preenche todos os campos do modal
    document.getElementById("cnpj").value = c.cnpj_cpf || c.cnpj || "";
    document.getElementById("razao_social").value = c.razao_social || "";
    document.getElementById("nome_fantasia").value = c.nome_fantasia || "";
    document.getElementById("inscricao_estadual").value =
      c.inscricao_estadual || "";
    document.getElementById("inscricao_municipal").value =
      c.inscricao_municipal || "";
    document.getElementById("cep").value = c.cep || "";
    document.getElementById("logradouro").value = c.logradouro || "";
    document.getElementById("numero").value = c.numero || "";
    document.getElementById("complemento").value = c.complemento || "";
    document.getElementById("bairro").value = c.bairro || "";
    document.getElementById("cidade").value = c.cidade || "";
    document.getElementById("uf").value = c.uf || c.estado || "";
    document.getElementById("prazo_manutencao").value =
      c.prazo_manutencao || 12;

    configurarBotaoContatos(true, id);
    document.getElementById("statusCnpj").innerHTML =
      "✅ Modo de edição ativado.";
    document.getElementById("statusCnpj").style.color = "#16a34a";
  } catch (error) {
    console.error("Erro ao carregar cliente para edição:", error);
    alert("Erro ao carregar os dados do cliente.");
  }
}

function abrirContatosClienteAtual() {
  if (clienteAtualId) {
    verContatos(clienteAtualId);
  } else {
    alert("Salve o cliente primeiro para gerenciar seus contatos.");
  }
}

// Atalhos operacionais do Hub
function verEquipamentos(id) {
  window.location.href = `equipamentos.html?cliente_id=${id}`;
}

function verOrdensServico(id) {
  alert(`Abrir Ordens de Serviço do cliente ID: ${id}`);
}

function verConversasWA(id) {
  alert(`Abrir Histórico WhatsApp do cliente ID: ${id}`);
}

function verClockifyCliente(id) {
  alert(`Abrir Apontamentos Clockify do cliente ID: ${id}`);
}

function mascaraCEP(input) {
  let v = input.value.replace(/\D/g, "");
  if (v.length > 5) {
    v = v.substring(0, 5) + "-" + v.substring(5, 9);
  }
  input.value = v;
}

// ==========================================
// GESTÃO DE CONTATOS / PESSOAS
// ==========================================

function verContatos(clienteId) {
  if (!clienteId) {
    alert("ID do cliente não identificado.");
    return;
  }
  document.getElementById("contato_cliente_id").value = clienteId;
  document.getElementById("modalContatos").style.display = "flex";
  carregarContatos(clienteId);
}

function fecharModalContatos() {
  document.getElementById("modalContatos").style.display = "none";
}

async function carregarContatos(clienteId) {
  const tbody = document.getElementById("listaContatosTabela");
  tbody.innerHTML =
    '<tr><td colspan="5" style="text-align: center; padding: 15px;">Buscando contatos...</td></tr>';

  try {
    const response = await fetch(
      `https://n8n.trufos.com.br/webhook/contatos-listar?cliente_id=${clienteId}`,
    );
    const dados = await response.json();
    const lista = Array.isArray(dados) ? dados : dados.data || [];

    if (lista.length > 0 && lista[0].id) {
      tbody.innerHTML = lista
        .map(
          (c) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px;"><strong>${c.nome}</strong></td>
          <td style="padding: 10px;">${c.departamento || "-"}</td>
          <td style="padding: 10px;">${c.telefone || "-"}</td>
          <td style="padding: 10px;">${c.email || "-"}</td>
          <td style="padding: 10px; text-align: center;">
            <button onclick="excluirContato(${c.id}, ${clienteId})" title="Remover" style="background: none; border: none; cursor: pointer; font-size: 16px;">🗑️</button>
          </td>
        </tr>
      `,
        )
        .join("");
    } else {
      tbody.innerHTML =
        '<tr><td colspan="5" style="text-align: center; padding: 15px; color: #64748b;">Nenhum contato cadastrado para este cliente.</td></tr>';
    }
  } catch (error) {
    console.error("Erro ao carregar contatos:", error);
    tbody.innerHTML =
      '<tr><td colspan="5" style="text-align: center; padding: 15px; color: #dc2626;">Erro ao carregar lista.</td></tr>';
  }
}

async function salvarContato() {
  const clienteId = document.getElementById("contato_cliente_id").value;
  const nome = document.getElementById("contato_nome").value.trim();

  if (!nome) {
    alert("Informe o nome do contato.");
    return;
  }

  const payload = {
    cliente_id: parseInt(clienteId),
    nome: nome,
    departamento: document.getElementById("contato_departamento").value.trim(),
    telefone: document.getElementById("contato_telefone").value.trim(),
    email: document.getElementById("contato_email").value.trim(),
  };

  try {
    await fetch("https://n8n.trufos.com.br/webhook/contato-salvar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    document.getElementById("contato_nome").value = "";
    document.getElementById("contato_departamento").value = "";
    document.getElementById("contato_telefone").value = "";
    document.getElementById("contato_email").value = "";
    carregarContatos(clienteId);
  } catch (error) {
    console.error("Erro ao salvar contato:", error);
    alert("Erro ao salvar contato.");
  }
}

async function excluirContato(id, clienteId) {
  if (!confirm("Remover este contato?")) return;

  try {
    await fetch(`https://n8n.trufos.com.br/webhook/contato-excluir?id=${id}`, {
      method: "DELETE",
    });
    carregarContatos(clienteId);
  } catch (error) {
    console.error("Erro ao excluir contato:", error);
  }
}
