// js/core/api.js - Cliente HTTP centralizado para os webhooks do n8n

export const BASE_WEBHOOK_URL = "https://n8n.trufos.com.br/webhook";

export async function apiGet(endpoint) {
  const response = await fetch(`${BASE_WEBHOOK_URL}/${endpoint}`);
  if (!response.ok) {
    throw new Error(`Erro HTTP ${response.status} em GET ${endpoint}`);
  }
  return response.json();
}

export async function apiPost(endpoint, payload) {
  const response = await fetch(`${BASE_WEBHOOK_URL}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Erro HTTP ${response.status} em POST ${endpoint}`);
  }
  // Alguns webhooks do n8n retornam vazio no POST; trata com segurança
  const text = await response.text();
  return text ? JSON.parse(text) : { ok: true };
}

export async function apiDelete(endpoint) {
  const response = await fetch(`${BASE_WEBHOOK_URL}/${endpoint}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`Erro HTTP ${response.status} em DELETE ${endpoint}`);
  }
  return true;
}
