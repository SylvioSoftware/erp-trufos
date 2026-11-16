// js/fornecedores/fornecedores-form.js - Formulário, Modal e Consulta CNPJ de Fornecedores

import { apiGet, apiPost } from "../core/api.js";
import { verContatos } from "./fornecedores-contatos.js";

let fornecedorAtualId = null;

export function configurarBotaoContatos(habilitado, id = null) {
  fornecedorAtualId = id;
  const btn = document.getElementById("btnModalContatos");
  if (!btn) return;

  if (habilitado && id) {
    btn.removeAttribute("disabled");
    btn.style.cursor = "pointer";
    btn.style.opacity = "1";
    btn.style.color = "#334155";
  } else {
    btn.setAttribute("disabled", "true");
    btn.style.cursor = "not-allowed";
    btn.style.opacity = "0.6";
    btn.style.color = "#94a3b8";
  }
}

export function abrirModalNovoFornecedor() {
  document.getElementById("tituloModalFornecedor").textContent =
    "Novo Fornecedor";
  configurarBotaoContatos(false, null);
  document.getElementById("modalFornecedor").style.display = "flex";
}

export function fecharModalFornecedor() {
  document.getElementById("modalFornecedor").style.display = "none";
  document.getElementById("formFornecedor").reset();
  document.getElementById("statusCnpj").innerHTML = "";
  configurarBotaoContatos(false, null);
}

export function abrirContatosFornecedorAtual() {
  if (fornecedorAtualId) {
    verContatos(fornecedorAtualId);
  } else {
    alert("Salve o fornecedor primeiro para gerenciar seus contatos.");
  }
}

export function mascaraCEP(input) {
  let v = input.value.replace(/\D/g, "");
  if (v.length > 5) {
    v = v.substring(0, 5) + "-" + v.substring(5, 9);
  }
  input.value = v;
}

function preencherCamposFormulario(f) {
  document.getElementById("razao_social").value = f.razao_social || "";
  document.getElementById("nome_fantasia").value = f.nome_fantasia || "";
  document.getElementById("inscricao_estadual").value =
    f.inscricao_estadual || "";
  document.getElementById("dados_bancarios").value = f.dados_bancarios || "";
  document.getElementById("cep").value = f.cep || "";
  document.getElementById("logradouro").value = f.logradouro || "";
  document.getElementById("numero").value = f.numero || "";
  document.getElementById("complemento").value = f.complemento || "";
  document.getElementById("bairro").value = f.bairro || "";
  document.getElementById("cidade").value = f.cidade || "";
  document.getElementById("uf").value = f.uf || f.estado || "";
}

export async function consultarCNPJFornecedor(cnpj) {
  const cnpjLimpo = cnpj.replace(/\D/g, "");
  if (cnpjLimpo.length !== 14) return;

  const statusEl = document.getElementById("statusCnpj");
  statusEl.innerHTML = "🔍 Consultando CNPJ...";
  statusEl.style.color = "#d97706";

  try {
    const resultado = await apiGet(`fornecedor-busca?cnpj=${cnpjLimpo}`);
    const dadosRetorno = Array.isArray(resultado) ? resultado[0] : resultado;

    if (dadosRetorno && dadosRetorno.encontrado) {
      statusEl.innerHTML = `⚠️ CNPJ já cadastrado para: <strong>${dadosRetorno.fornecedor.razao_social}</strong>`;
      statusEl.style.color = "#dc2626";
      configurarBotaoContatos(true, dadosRetorno.fornecedor.id);
    } else {
      statusEl.innerHTML = "✅ CNPJ novo validado!";
      statusEl.style.color = "#16a34a";
      configurarBotaoContatos(false, null);
    }

    const f = dadosRetorno?.fornecedor || dadosRetorno || {};
    document.getElementById("razao_social").value = f.razao_social || "";
    document.getElementById("nome_fantasia").value = f.nome_fantasia || "";
    document.getElementById("inscricao_estadual").value =
      f.inscricao_estadual || "";
    document.getElementById("cep").value = f.cep || "";
    document.getElementById("logradouro").value = f.logradouro || "";
    document.getElementById("numero").value = f.numero || "";
    document.getElementById("complemento").value = f.complemento || "";
    document.getElementById("bairro").value = f.bairro || "";
    document.getElementById("cidade").value = f.cidade || "";
    document.getElementById("uf").value = f.uf || f.estado || "";
  } catch (error) {
    console.error("Erro detalhado na consulta CNPJ:", error);
    statusEl.innerHTML = "⚠️ Erro ao consultar o CNPJ.";
    statusEl.style.color = "#dc2626";
    configurarBotaoContatos(false, null);
  }
}

export async function editarFornecedor(id) {
  try {
    abrirModalNovoFornecedor();
    document.getElementById("tituloModalFornecedor").textContent =
      "Editar Fornecedor";

    const statusEl = document.getElementById("statusCnpj");
    statusEl.innerHTML = "✏️ Carregando dados...";
    statusEl.style.color = "#2563eb";

    const resultado = await apiGet(`fornecedor-busca?id=${id}`);
    const dadosRetorno = Array.isArray(resultado) ? resultado[0] : resultado;
    const f = dadosRetorno?.fornecedor || dadosRetorno || {};

    document.getElementById("cnpj").value = f.cnpj || "";
    preencherCamposFormulario(f);

    configurarBotaoContatos(true, id);
    statusEl.innerHTML = "✅ Modo de edição ativado.";
    statusEl.style.color = "#16a34a";
  } catch (error) {
    console.error("Erro ao carregar fornecedor para edição:", error);
    alert("Erro ao carregar os dados do fornecedor.");
  }
}

export async function salvarFornecedor(event, onSucessoCallback) {
  event.preventDefault();

  const dadosFornecedor = {
    cnpj: document.getElementById("cnpj").value,
    razao_social: document.getElementById("razao_social").value,
    nome_fantasia: document.getElementById("nome_fantasia").value,
    inscricao_estadual: document.getElementById("inscricao_estadual").value,
    dados_bancarios: document.getElementById("dados_bancarios").value,
    cep: document.getElementById("cep").value,
    logradouro: document.getElementById("logradouro").value,
    numero: document.getElementById("numero").value,
    complemento: document.getElementById("complemento").value,
    bairro: document.getElementById("bairro").value,
    cidade: document.getElementById("cidade").value,
    uf: document.getElementById("uf").value,
  };

  try {
    await apiPost("fornecedor-salvar", dadosFornecedor);
    alert("Fornecedor salvo com sucesso!");
    fecharModalFornecedor();
    if (typeof onSucessoCallback === "function") {
      onSucessoCallback();
    }
  } catch (error) {
    console.error("Erro ao salvar fornecedor:", error);
    alert("Erro ao salvar o fornecedor no servidor.");
  }
}
