// js/fornecedores/fornecedores-main.js - Orquestrador da tela de Fornecedores

import { apiGet } from "../core/api.js";
import {
  abrirModalNovoFornecedor,
  fecharModalFornecedor,
  consultarCNPJFornecedor,
  editarFornecedor,
  salvarFornecedor,
  abrirContatosFornecedorAtual,
  mascaraCEP,
} from "./fornecedores-form.js";
import {
  verContatos,
  fecharModalContatos,
  salvarContato,
  excluirContato,
  preencherEdicaoContato,
} from "./fornecedores-contatos.js";

export async function carregarFornecedores() {
  const tbody = document.getElementById("listaFornecedoresTabela");
  try {
    const dados = await apiGet("fornecedores-listar");
    const lista = Array.isArray(dados) ? dados : dados.data || [];

    // Filtra apenas itens que possuem ID válido (evita linhas vazias caso o banco retorne {})
    const validos = lista.filter((f) => f && f.id);

    if (validos.length > 0) {
      tbody.innerHTML = validos
        .map((f) => {
          const termoBusca =
            `${f.nome_fantasia || ""} ${f.razao_social || ""} ${f.cnpj || ""} ${f.cidade || ""} ${f.uf || ""}`.toLowerCase();

          return `
            <tr data-busca="${termoBusca}">
              <td>
                <strong>${f.nome_fantasia || f.razao_social}</strong>
                ${f.nome_fantasia ? `<br><small style="color: #64748b;">${f.razao_social}</small>` : ""}
              </td>
              <td>${f.cidade || "-"}/${f.uf || ""}</td>
              <td style="white-space: nowrap;">
                <button class="btn-acao" title="Editar / Detalhes" onclick="editarFornecedor(${f.id})">✏️</button>
                <button class="btn-acao" title="Contatos" onclick="verContatos(${f.id})">👥</button>
              </td>
            </tr>
          `;
        })
        .join("");
    } else {
      tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #666; padding: 20px;">Nenhum fornecedor cadastrado.</td></tr>`;
    }
  } catch (error) {
    console.error("Erro ao carregar fornecedores:", error);
    tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #dc2626; padding: 20px;">Erro ao carregar fornecedores.</td></tr>`;
  }
}

function configurarBusca() {
  const inputBusca = document.getElementById("filtroFornecedor");
  if (!inputBusca) return;

  inputBusca.addEventListener("input", (e) => {
    const termo = e.target.value.toLowerCase().trim();
    const linhas = document.querySelectorAll("#listaFornecedoresTabela tr");

    linhas.forEach((linha) => {
      const dadosLinha =
        linha.getAttribute("data-busca") || linha.textContent.toLowerCase();
      linha.style.display = dadosLinha.includes(termo) ? "" : "none";
    });
  });
}

// Expor funções no escopo global (window)
window.abrirModalNovoFornecedor = abrirModalNovoFornecedor;
window.fecharModalFornecedor = fecharModalFornecedor;
window.consultarCNPJFornecedor = consultarCNPJFornecedor;
window.editarFornecedor = editarFornecedor;
window.salvarFornecedor = (event) =>
  salvarFornecedor(event, carregarFornecedores);
window.abrirContatosFornecedorAtual = abrirContatosFornecedorAtual;
window.mascaraCEP = mascaraCEP;

window.verContatos = verContatos;
window.fecharModalContatos = fecharModalContatos;
window.salvarContato = salvarContato;
window.excluirContato = excluirContato;
window.preencherEdicaoContato = preencherEdicaoContato;

window.addEventListener("DOMContentLoaded", () => {
  configurarBusca();
  carregarFornecedores();
});
