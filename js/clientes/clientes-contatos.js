// js/clientes/clientes-contatos.js - CRUD de Contatos vinculados ao Cliente

import { apiGet, apiPost, apiDelete } from "../core/api.js";

export function verContatos(clienteId) {
  if (!clienteId) {
    alert("ID do cliente não identificado.");
    return;
  }
  document.getElementById("contato_cliente_id").value = clienteId;
  document.getElementById("modalContatos").style.display = "flex";
  carregarContatos(clienteId);
}

export function fecharModalContatos() {
  document.getElementById("modalContatos").style.display = "none";
}

export async function carregarContatos(clienteId) {
  const tbody = document.getElementById("listaContatosTabela");
  tbody.innerHTML =
    '<tr><td colspan="5" style="text-align: center; padding: 15px;">Buscando contatos...</td></tr>';

  try {
    const dados = await apiGet(`contatos-listar?cliente_id=${clienteId}`);
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
              <button type="button" onclick="excluirContato(${c.id}, ${clienteId})" title="Remover" style="background: none; border: none; cursor: pointer; font-size: 16px;">🗑️</button>
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

export async function salvarContato() {
  const clienteId = document.getElementById("contato_cliente_id").value;
  const nome = document.getElementById("contato_nome").value.trim();

  if (!nome) {
    alert("Informe o nome do contato.");
    return;
  }

  const payload = {
    cliente_id: parseInt(clienteId, 10),
    nome,
    departamento: document.getElementById("contato_departamento").value.trim(),
    telefone: document.getElementById("contato_telefone").value.trim(),
    email: document.getElementById("contato_email").value.trim(),
  };

  try {
    await apiPost("contato-salvar", payload);

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

export async function excluirContato(id, clienteId) {
  if (!confirm("Remover este contato?")) return;

  try {
    await apiDelete(`contato-excluir?id=${id}`);
    carregarContatos(clienteId);
  } catch (error) {
    console.error("Erro ao excluir contato:", error);
    alert("Erro ao remover contato.");
  }
}
