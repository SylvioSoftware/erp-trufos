// js/clientes/clientes-form.js - Formulário, Modal e Consulta CNPJ de Clientes

import { apiGet, apiPost } from "../core/api.js";
import { verContatos } from "./clientes-contatos.js";

let clienteAtualId = null;

export function configurarBotaoContatos(habilitado, id = null) {
  clienteAtualId = id;
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

export function abrirModalNovoCliente() {
  document.getElementById("tituloModalCliente").textContent = "Novo Cliente";
  configurarBotaoContatos(false, null);
  document.getElementById("modalCliente").style.display = "flex";
}

export function fecharModalCliente() {
  document.getElementById("modalCliente").style.display = "none";
  document.getElementById("formCliente").reset();
  document.getElementById("statusCnpj").innerHTML = "";
  configurarBotaoContatos(false, null);
}

export function abrirContatosClienteAtual() {
  if (clienteAtualId) {
    verContatos(clienteAtualId);
  } else {
    alert("Salve o cliente primeiro para gerenciar seus contatos.");
  }
}

export function mascaraCEP(input) {
  let v = input.value.replace(/\D/g, "");
  if (v.length > 5) {
    v = v.substring(0, 5) + "-" + v.substring(5, 9);
  }
  input.value = v;
}

function preencherCamposFormulario(c) {
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
  document.getElementById("prazo_manutencao").value = c.prazo_manutencao || 12;
}

export async function consultarCNPJ(cnpj) {
  const cnpjLimpo = cnpj.replace(/\D/g, "");
  if (cnpjLimpo.length !== 14) return;

  const statusEl = document.getElementById("statusCnpj");
  statusEl.innerHTML = "🔍 Consultando CNPJ...";
  statusEl.style.color = "#d97706";

  try {
    const resultado = await apiGet(`cliente-busca?cnpj=${cnpjLimpo}`);
    const dadosRetorno = Array.isArray(resultado) ? resultado[0] : resultado;

    if (dadosRetorno && dadosRetorno.encontrado) {
      statusEl.innerHTML = `⚠️ CNPJ já cadastrado para: <strong>${dadosRetorno.cliente.razao_social}</strong>`;
      statusEl.style.color = "#dc2626";
      configurarBotaoContatos(true, dadosRetorno.cliente.id);
    } else {
      statusEl.innerHTML = "✅ CNPJ novo validado!";
      statusEl.style.color = "#16a34a";
      configurarBotaoContatos(false, null);
    }

    const c = dadosRetorno?.cliente || dadosRetorno || {};
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

    if (c.prazo_manutencao) {
      document.getElementById("prazo_manutencao").value = c.prazo_manutencao;
    }
  } catch (error) {
    console.error("Erro detalhado na consulta CNPJ:", error);
    statusEl.innerHTML =
      "⚠️ Erro ao consultar o CNPJ (Verifique o console F12).";
    statusEl.style.color = "#dc2626";
    configurarBotaoContatos(false, null);
  }
}

export async function editarCliente(id) {
  try {
    abrirModalNovoCliente();
    document.getElementById("tituloModalCliente").textContent =
      "Editar Cliente";

    const statusEl = document.getElementById("statusCnpj");
    statusEl.innerHTML = "✏️ Carregando dados para edição...";
    statusEl.style.color = "#2563eb";

    const resultado = await apiGet(`cliente-busca?id=${id}`);
    const dadosRetorno = Array.isArray(resultado) ? resultado[0] : resultado;
    const c = dadosRetorno?.cliente || dadosRetorno || {};

    document.getElementById("cnpj").value = c.cnpj_cpf || c.cnpj || "";
    preencherCamposFormulario(c);

    configurarBotaoContatos(true, id);
    statusEl.innerHTML = "✅ Modo de edição ativado.";
    statusEl.style.color = "#16a34a";
  } catch (error) {
    console.error("Erro ao carregar cliente para edição:", error);
    alert("Erro ao carregar os dados do cliente.");
  }
}

export async function salvarCliente(event, onSucessoCallback) {
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
      parseInt(document.getElementById("prazo_manutencao").value, 10) || 12,
  };

  try {
    await apiPost("cliente-salvar", dadosCliente);
    alert("Cliente salvo com sucesso!");
    fecharModalCliente();
    if (typeof onSucessoCallback === "function") {
      onSucessoCallback();
    }
  } catch (error) {
    console.error("Erro ao salvar cliente:", error);
    alert("Erro ao salvar o cliente no servidor.");
  }
}
