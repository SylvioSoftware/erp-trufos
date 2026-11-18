const WEBHOOK_BASE = "https://n8n.trufos.com.br/webhook";

document.addEventListener("DOMContentLoaded", () => {
  carregarServicos();
  carregarPerfisHTNoSelect();

  const filtroInput = document.getElementById("filtroServico");
  if (filtroInput) {
    filtroInput.addEventListener("input", (e) => {
      const termo = e.target.value.toLowerCase();
      const linhas = document.querySelectorAll("#listaServicosTabela tr");
      linhas.forEach((linha) => {
        const texto = linha.innerText.toLowerCase();
        linha.style.display = texto.includes(termo) ? "" : "none";
      });
    });
  }
});

// Carregar Perfis de Hora Técnica para a lista suspensa do modal
async function carregarPerfisHTNoSelect(perfilSelecionadoId = null) {
  const select = document.getElementById("perfil_ht_id");
  if (!select) return;

  try {
    const response = await fetch(`${WEBHOOK_BASE}/perfis-ht-listar`);
    if (!response.ok) throw new Error("Erro ao buscar perfis HT");

    const text = await response.text();
    const perfis = text ? JSON.parse(text) : [];

    select.innerHTML = '<option value="">Selecione o Perfil de HT...</option>';

    if (perfis.length === 0) {
      select.innerHTML = '<option value="">Nenhum perfil cadastrado em Configurações</option>';
      return;
    }

    perfis.forEach((p) => {
      const option = document.createElement("option");
      option.value = p.id;
      option.textContent = `${p.descricao} (R$ ${Number(p.valor_hora).toFixed(2)}/h)`;
      option.dataset.valor = p.valor_hora;
      
      if (perfilSelecionadoId && Number(p.id) === Number(perfilSelecionadoId)) {
        option.selected = true;
      }
      select.appendChild(option);
    });

    // Se houver seleção inicial, atualiza o valor hora oculto e recalcula
    if (select.value) {
      aoSelecionarPerfilHT();
    }
  } catch (error) {
    console.error("Erro ao carregar perfis de HT:", error);
    select.innerHTML = '<option value="">Erro ao carregar perfis de HT</option>';
  }
}

// Ação ao mudar o perfil de hora técnica no select
window.aoSelecionarPerfilHT = function () {
  const select = document.getElementById("perfil_ht_id");
  const selectedOption = select.options[select.selectedIndex];
  
  const valorHora = selectedOption && selectedOption.dataset.valor ? parseFloat(selectedOption.dataset.valor) : 0;
  document.getElementById("valor_hora_tecnica").value = valorHora;

  calcularTotalServico();
};

// Função de cálculo automático baseada em hora técnica x tempo estimado
window.calcularTotalServico = function () {
  const valorHora = parseFloat(document.getElementById("valor_hora_tecnica").value) || 0;
  const tempoHoras = parseFloat(document.getElementById("tempo_estimado_horas").value) || 0;
  const total = valorHora * tempoHoras;

  document.getElementById("valor").value = total.toFixed(2);
};

// 1. Carregar Lista de Serviços
async function carregarServicos() {
  const tbody = document.getElementById("listaServicosTabela");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px;">Carregando serviços...</td></tr>`;

  try {
    const response = await fetch(`${WEBHOOK_BASE}/servicos-listar`);
    if (!response.ok) throw new Error("Erro no servidor");

    const text = await response.text();
    const servicos = text ? JSON.parse(text) : [];

    tbody.innerHTML = "";

    if (!servicos || servicos.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px; color: #64748b;">Nenhum serviço cadastrado.</td></tr>`;
      return;
    }

    servicos.forEach((serv) => {
      const tr = document.createElement("tr");
      const valorExibicao = Number(
        serv.valor_venda ?? serv.valor ?? serv.valor_hora_tecnica ?? 0,
      ).toFixed(2);

      tr.innerHTML = `
        <td><strong>${serv.codigo || "-"}</strong></td>
        <td>${serv.descricao || "-"}</td>
        <td style="color: #059669; font-weight: 600;">R$ ${valorExibicao}</td>
        <td style="text-align: center;">
          <button onclick='editarServico(${JSON.stringify(serv)})' style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-right: 5px;">Editar</button>
          <button onclick='excluirServico(${serv.id})' style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Excluir</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error("Erro ao carregar serviços:", error);
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #ef4444; padding: 20px;">Erro ao conectar com o webhook de serviços no n8n.</td></tr>`;
  }
}

// 2. Gerador de Código Sequencial para Serviços (Padrão 13 caracteres: S-00000000001)
async function gerarCodigoServicoSequencial() {
  try {
    const response = await fetch(`${WEBHOOK_BASE}/servicos-listar`);
    const text = await response.text();
    const servicos = text ? JSON.parse(text) : [];

    let maiorNumero = 0;

    if (servicos && servicos.length > 0) {
      servicos.forEach((s) => {
        if (s.codigo && s.codigo.startsWith("S-")) {
          const numStr = s.codigo.replace("S-", "");
          const num = parseInt(numStr, 10);
          if (!isNaN(num) && num > maiorNumero) {
            maiorNumero = num;
          }
        }
      });
    }

    const proximoNum = maiorNumero + 1;
    return `S-${String(proximoNum).padStart(11, "0")}`;
  } catch (e) {
    console.error("Erro ao gerar código sequencial de serviço:", e);
    return "S-00000000001";
  }
}

// 3. Funções do Modal de Serviços
window.abrirModalNovoServico = async function () {
  document.getElementById("tituloModalServico").innerText =
    "Novo Serviço / Mão de Obra";
  document.getElementById("formServico").reset();
  document.getElementById("servicoIdEdicao").value = "";
  document.getElementById("codigo").value =
    await gerarCodigoServicoSequencial();
  
  await carregarPerfisHTNoSelect();
  document.getElementById("tempo_estimado_horas").value = "1.0";
  calcularTotalServico();
  document.getElementById("modalServico").style.display = "flex";
};

window.fecharModalServico = function () {
  document.getElementById("modalServico").style.display = "none";
};

window.editarServico = async function (serv) {
  document.getElementById("tituloModalServico").innerText =
    "Editar Serviço / Mão de Obra";
  document.getElementById("servicoIdEdicao").value = serv.id || "";
  document.getElementById("codigo").value = serv.codigo || "";
  document.getElementById("descricao_servico").value = serv.descricao || "";
  
  await carregarPerfisHTNoSelect(serv.perfil_ht_id || null);
  
  document.getElementById("tempo_estimado_horas").value =
    serv.tempo_estimado_horas ?? "1.0";
  document.getElementById("valor").value =
    serv.valor_venda ?? serv.valor ?? "0.00";
    
  document.getElementById("modalServico").style.display = "flex";
};

// 4. Salvar Serviço
window.salvarServico = async function (event) {
  event.preventDefault();

  const dados = {
    id: document.getElementById("servicoIdEdicao").value || null,
    codigo: document.getElementById("codigo").value.trim(),
    descricao: document.getElementById("descricao_servico").value.trim(),
    perfil_ht_id: document.getElementById("perfil_ht_id").value || null,
    valor_hora_tecnica:
      parseFloat(document.getElementById("valor_hora_tecnica").value) || 0,
    tempo_estimado_horas:
      parseFloat(document.getElementById("tempo_estimado_horas").value) || 0,
    valor_venda: parseFloat(document.getElementById("valor").value) || 0,
  };

  try {
    const response = await fetch(`${WEBHOOK_BASE}/servico-salvar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });

    if (response.ok) {
      fecharModalServico();
      carregarServicos();
    } else {
      alert("Erro ao salvar o serviço no servidor.");
    }
  } catch (e) {
    console.error("Erro na requisição:", e);
    alert("Erro de conexão ao salvar.");
  }
};

// 5. Excluir Serviço
window.excluirServico = async function (id) {
  if (!confirm("Deseja realmente excluir este serviço?")) return;

  try {
    const response = await fetch(`${WEBHOOK_BASE}/servico-excluir?id=${id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      carregarServicos();
    } else {
      alert("Erro ao excluir o serviço.");
    }
  } catch (e) {
    console.error("Erro na exclusão:", e);
    alert("Erro de conexão ao excluir.");
  }
};
