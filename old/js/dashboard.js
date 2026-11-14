async function carregarDashboard() {
  try {
    const response = await fetch(
      "https://n8n.trufos.com.br/webhook/erp-dashboard-dados",
    );
    const dados = await response.json();

    // 1. Preencher a tabela de Próximas Manutenções
    const tbodyManutencoes = document.getElementById("listaManutencoes");
    if (dados.manutencoes && dados.manutencoes.length > 0) {
      tbodyManutencoes.innerHTML = dados.manutencoes
        .map(
          (m) => `
                <tr class="clicavel" onclick="window.location.href='equipamentos.html?id=${m.equipamento_id}'">
                    <td>${m.cliente}</td>
                    <td>${m.equipamento}</td>
                    <td><span class="badge-status ${m.diasRestantes < 0 ? "badge-vencido" : "badge-alerta"}">${m.vencimento}</span></td>
                </tr>
            `,
        )
        .join("");
    } else {
      tbodyManutencoes.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #999;">Nenhuma manutenção próxima.</td></tr>`;
    }

    // 2. Preencher a tabela de Ordens de Serviço em Aberto
    const tbodyOsAberto = document.getElementById("listaOsAberto");
    if (dados.osAtivas && dados.osAtivas.length > 0) {
      tbodyOsAberto.innerHTML = dados.osAtivas
        .map(
          (os) => `
                <tr class="clicavel" onclick="abrirOS(${os.os_id})">
                    <td><strong>#${os.os_id}</strong></td>
                    <td>${os.cliente}<br><small style="color: #666;">${os.equipamento}</small></td>
                    <td><span class="badge-status status-${os.status.toLowerCase()}">${os.status}</span></td>
                </tr>
            `,
        )
        .join("");
    } else {
      tbodyOsAberto.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #999;">Nenhuma OS aberta no momento.</td></tr>`;
    }

    // 3. Preencher a tabela de Orçamentos Pendentes
    const tbodyOrcamentos = document.getElementById("listaOrcamentos");
    if (dados.orcamentos && dados.orcamentos.length > 0) {
      tbodyOrcamentos.innerHTML = dados.orcamentos
        .map(
          (orc) => `
                <tr>
                    <td><strong>#${orc.os_id}</strong><br><small>${orc.data_emissao}</small></td>
                    <td>${orc.cliente}</td>
                    <td>
                        <button class="btn-acao" title="Aprovar Orçamento" onclick="aprovarOrcamento(${orc.os_id})">✅</button>
                        <button class="btn-acao" title="Cancelar" onclick="cancelarOrcamento(${orc.os_id})">❌</button>
                    </td>
                </tr>
            `,
        )
        .join("");
    } else {
      tbodyOrcamentos.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #999; padding: 20px;">Nenhum orçamento pendente.</td></tr>`;
    }
  } catch (error) {
    console.error("Erro ao carregar dados do dashboard:", error);
  }
}

// Funções auxiliares de ação
function abrirOS(id) {
  window.open(`os-detalhe.html?id=${id}`, "_blank");
}

function aprovarOrcamento(osId) {
  if (
    confirm(
      `Deseja aprovar o orçamento da OS #${osId}? Ela passará para execução.`,
    )
  ) {
    alert(`OS #${osId} aprovada com sucesso!`);
    location.reload();
  }
}

function cancelarOrcamento(osId) {
  const motivo = prompt(`Informe o motivo do cancelamento da OS #${osId}:`);
  if (motivo && motivo.trim() !== "") {
    alert(`OS #${osId} cancelada. Motivo: ${motivo}`);
    location.reload();
  }
}

window.addEventListener("DOMContentLoaded", carregarDashboard);
