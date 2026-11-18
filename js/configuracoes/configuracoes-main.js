const WEBHOOK_BASE = "https://n8n.trufos.com.br/webhook";

document.addEventListener("DOMContentLoaded", () => {
  carregarConfiguracoesEmpresa();
  carregarPerfisHT();
});

// ==========================================
// 1. DADOS DA EMPRESA E CONFIGURAÇÕES GERAIS
// ==========================================

async function carregarConfiguracoesEmpresa() {
  try {
    const response = await fetch(`${WEBHOOK_BASE}/configuracoes-listar`);
    if (!response.ok) throw new Error("Erro ao carregar configurações");

    const text = await response.text();
    const dadosArray = text ? JSON.parse(text) : [];
    
    // Se houver registro cadastrado, pega o primeiro
    if (dadosArray && dadosArray.length > 0) {
      const config = dadosArray[0];
      
      document.getElementById("configId").value = config.id || "";
      document.getElementById("razao_social").value = config.razao_social || "";
      document.getElementById("nome_fantasia").value = config.nome_fantasia || "";
      document.getElementById("cnpj").value = config.cnpj || "";
      document.getElementById("inscricao_estadual").value = config.inscricao_estadual || "";
      document.getElementById("telefone").value = config.telefone || "";
      document.getElementById("email").value = config.email || "";
      document.getElementById("cep").value = config.cep || "";
      document.getElementById("logradouro").value = config.logradouro || "";
      document.getElementById("numero").value = config.numero || "";
      document.getElementById("bairro").value = config.bairro || "";
      document.getElementById("cidade").value = config.cidade || "";
      document.getElementById("uf").value = config.uf || "";
      document.getElementById("tipo_assinatura").value = config.tipo_assinatura || "FREE";
      
      if (config.validade_assinatura) {
        document.getElementById("validade_assinatura").value = config.validade_assinatura.split("T")[0];
      }
      
      document.getElementById("periodicidade").value = config.periodicidade || "MENSAL";
      document.getElementById("logotipo_url").value = config.logotipo_url || "";
      document.getElementById("cor_primaria").value = config.cor_primaria || "#0284c7";
    }
  } catch (error) {
    console.error("Erro ao carregar configurações da empresa:", error);
  }
}

window.salvarConfiguracoes = async function (event) {
  event.preventDefault();

  const dados = {
    id: document.getElementById("configId").value || null,
    razao_social: document.getElementById("razao_social").value.trim(),
    nome_fantasia: document.getElementById("nome_fantasia").value.trim(),
    cnpj: document.getElementById("cnpj").value.trim(),
    inscricao_estadual: document.getElementById("inscricao_estadual").value.trim(),
    telefone: document.getElementById("telefone").value.trim(),
    email: document.getElementById("email").value.trim(),
    cep: document.getElementById("cep").value.trim(),
    logradouro: document.getElementById("logradouro").value.trim(),
    numero: document.getElementById("numero").value.trim(),
    bairro: document.getElementById("bairro").value.trim(),
    cidade: document.getElementById("cidade").value.trim(),
    uf: document.getElementById("uf").value.trim(),
    tipo_assinatura: document.getElementById("tipo_assinatura").value,
    validade_assinatura: document.getElementById("validade_assinatura").value || null,
    periodicidade: document.getElementById("periodicidade").value,
    logotipo_url: document.getElementById("logotipo_url").value.trim(),
    cor_primaria: document.getElementById("cor_primaria").value,
  };

  try {
    const response = await fetch(`${WEBHOOK_BASE}/configuracoes-salvar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });

    if (response.ok) {
      alert("Configurações da empresa salvas com sucesso!");
      carregarConfiguracoesEmpresa();
    } else {
      alert("Erro ao salvar as configurações no servidor.");
    }
  } catch (e) {
    console.error("Erro de conexão:", e);
    alert("Erro de conexão ao salvar configurações.");
  }
};


// ==========================================
// 2. GESTÃO DE PERFIS DE HORA TÉCNICA (HT)
// ==========================================

async function carregarPerfisHT() {
  const tbody = document.getElementById("listaPerfisHT");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; padding: 15px; color: #64748b;">Carregando perfis de HT...</td></tr>`;

  try {
    const response = await fetch(`${WEBHOOK_BASE}/perfis-ht-listar`);
    if (!response.ok) throw new Error("Erro ao carregar perfis de HT");

    const text = await response.text();
    const perfis = text ? JSON.parse(text) : [];

    tbody.innerHTML = "";

    if (!perfis || perfis.length === 0) {
      tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; padding: 15px; color: #64748b;">Nenhum perfil de hora técnica cadastrado.</td></tr>`;
      return;
    }

    perfis.forEach((p) => {
      const tr = document.createElement("tr");
      const valorFormatado = Number(p.valor_hora || 0).toFixed(2);

      tr.innerHTML = `
        <td><strong>${p.descricao || "-"}</strong></td>
        <td style="color: #059669; font-weight: 600;">R$ ${valorFormatado} / h</td>
        <td style="text-align: center;">
          <button type="button" onclick='editarPerfilHT(${JSON.stringify(p)})' style="background: #3b82f6; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-right: 5px;">Editar</button>
          <button type="button" onclick='excluirPerfilHT(${p.id})' style="background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Excluir</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error("Erro ao carregar perfis HT:", error);
    tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #ef4444; padding: 15px;">Erro ao conectar com o webhook de perfis HT no n8n.</td></tr>`;
  }
}

window.abrirModalNovaHT = function () {
  document.getElementById("tituloModalHT").innerText = "Novo Perfil de Hora Técnica";
  document.getElementById("formHT").reset();
  document.getElementById("htIdEdicao").value = "";
  document.getElementById("modalHT").style.display = "flex";
};

window.fecharModalHT = function () {
  document.getElementById("modalHT").style.display = "none";
};

window.editarPerfilHT = function (p) {
  document.getElementById("tituloModalHT").innerText = "Editar Perfil de Hora Técnica";
  document.getElementById("htIdEdicao").value = p.id || "";
  document.getElementById("ht_descricao").value = p.descricao || "";
  document.getElementById("ht_valor").value = p.valor_hora || "";
  document.getElementById("modalHT").style.display = "flex";
};

window.salvarPerfilHT = async function (event) {
  event.preventDefault();

  const dados = {
    id: document.getElementById("htIdEdicao").value || null,
    descricao: document.getElementById("ht_descricao").value.trim(),
    valor_hora: parseFloat(document.getElementById("ht_valor").value) || 0,
  };

  try {
    const response = await fetch(`${WEBHOOK_BASE}/perfil-ht-salvar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });

    if (response.ok) {
      fecharModalHT();
      carregarPerfisHT();
    } else {
      alert("Erro ao salvar o perfil de HT.");
    }
  } catch (e) {
    console.error("Erro ao salvar perfil HT:", e);
    alert("Erro de conexão ao salvar perfil HT.");
  }
};

window.excluirPerfilHT = async function (id) {
  if (!confirm("Deseja realmente excluir este perfil de hora técnica?")) return;

  try {
    const response = await fetch(`${WEBHOOK_BASE}/perfil-ht-excluir?id=${id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      carregarPerfisHT();
    } else {
      alert("Erro ao excluir o perfil de HT.");
    }
  } catch (e) {
    console.error("Erro na exclusão:", e);
    alert("Erro de conexão ao excluir.");
  }
};
