// js/clientes/clientes-main.js - Orquestrador da tela de Clientes

import { apiGet } from "../core/api.js";
import { initLayout } from "../core/layout.js";
import {
  abrirModalNovoCliente,
  fecharModalCliente,
  consultarCNPJ,
  editarCliente,
  salvarCliente,
  abrirContatosClienteAtual,
  mascaraCEP,
} from "./clientes-form.js";
import {
  verContatos,
  fecharModalContatos,
  salvarContato,
  excluirContato,
} from "./clientes-contatos.js";

export async function carregarClientes() {
  const tbody = document.getElementById("listaClientesTabela");
  try {
    const dados = await apiGet("clientes-listar");

    if (dados && dados.length > 0) {
      tbody.innerHTML = dados
        .map((c) => {
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
    tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #dc2626;">Erro ao carregar clientes.</td></tr>`;
  }
}

function configurarBusca() {
  const inputBusca = document.getElementById("filtroCliente");
  if (!inputBusca) return;

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

// Expor funções no escopo global (window) para os eventos onclick/onsubmit do HTML
window.abrirModalNovoCliente = abrirModalNovoCliente;
window.fecharModalCliente = fecharModalCliente;
window.consultarCNPJ = consultarCNPJ;
window.editarCliente = editarCliente;
window.salvarCliente = (event) => salvarCliente(event, carregarClientes);
window.abrirContatosClienteAtual = abrirContatosClienteAtual;
window.mascaraCEP = mascaraCEP;

window.verContatos = verContatos;
window.fecharModalContatos = fecharModalContatos;
window.salvarContato = salvarContato;
window.excluirContato = excluirContato;

window.verEquipamentos = (id) => {
  window.location.href = `equipamentos.html?cliente_id=${id}`;
};
window.verOrdensServico = (id) =>
  alert(`Abrir Ordens de Serviço do cliente ID: ${id}`);
window.verConversasWA = (id) =>
  alert(`Abrir Histórico WhatsApp do cliente ID: ${id}`);
window.verClockifyCliente = (id) =>
  alert(`Abrir Apontamentos Clockify do cliente ID: ${id}`);

window.addEventListener("DOMContentLoaded", () => {
  initLayout();
  configurarBusca();
  carregarClientes();
});
