// ==========================================
// MÓDULO DE EQUIPAMENTOS E PARQUE INSTALADO
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  carregarEquipamentos();
  carregarClientesSelect();
  carregarModelosSelect();

  // Filtro de pesquisa na tabela
  const inputFiltro = document.getElementById("filtroEquipamento");
  if (inputFiltro) {
    inputFiltro.addEventListener("input", (e) => {
      const termo = e.target.value.toLowerCase();
      const linhas = document.querySelectorAll("#listaEquipamentosTabela tr");
      
      linhas.forEach(linha => {
        const texto = linha.textContent.toLowerCase();
        linha.style.display = texto.includes(termo) ? "" : "none";
      });
    });
  }
});

// Função para buscar os equipamentos cadastrados no Parque Instalado
async function carregarEquipamentos() {
  const tbody = document.getElementById("listaEquipamentosTabela");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px;">Carregando equipamentos...</td></tr>`;

  try {
    // Aqui você conectará com o seu webhook do n8n / API do PostgreSQL
    // Exemplo simulado para estruturar a tabela:
    const equipamentos = []; // Substituir pelo retorno da API

    if (equipamentos.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px; color: #64748b;">Nenhum equipamento cadastrado no parque instalado.</td></tr>`;
      return;
    }

    tbody.innerHTML = equipamentos.map(eq => `
      <tr>
        <td>${eq.cliente_nome || 'N/D'}</td>
        <td><strong>${eq.modelo_nome || 'N/D'}</strong><br><small style="color: #64748b;">${eq.marca_nome || ''}</small></td>
        <td>${eq.numero_serie || 'Não informado'}</td>
        <td>${eq.patrimonio_tag || 'Não informado'}</td>
        <td><span style="background: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 4px; font-weight: 600;">${eq.horas_tecnicas_media || '1.0'}h</span></td>
        <td style="text-align: center;">
          <button onclick="editarParque(${eq.id})" style="background: none; border: none; cursor: pointer; color: #0284c7; font-weight: 600; margin-right: 8px;">Editar</button>
          <button onclick="excluirParque(${eq.id})" style="background: none; border: none; cursor: pointer; color: #dc2626; font-weight: 600;">Excluir</button>
        </td>
      </tr>
    `).join("");

  } catch (error) {
    console.error("Erro ao carregar equipamentos:", error);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px; color: #dc2626;">Erro ao carregar os dados.</td></tr>`;
  }
}

// Funções de Controle dos Modais
window.abrirModalNovoParque = function() {
  const modal = document.getElementById("modalParque");
  const form = document.getElementById("formParque");
  if (form) form.reset();
  document.getElementById("parqueIdEdicao").value = "";
  document.getElementById("tituloModalParque").innerText = "Vincular Equipamento ao Cliente";
  if (modal) modal.classList.add("active");
};

window.fecharModalParque = function() {
  const modal = document.getElementById("modalParque");
  if (modal) modal.classList.remove("active");
};

window.abrirModalModelos = function() {
  alert("Painel de Gestão de Tipos, Marcas e Modelos (Em desenvolvimento).");
};

// Funções de Select auxiliares (Preenchimento dos selects do modal)
async function carregarClientesSelect() {
  const select = document.getElementById("cliente_id");
  if (!select) return;
  // Aqui você fará o fetch dos clientes cadastrados para popular o select
}

async function carregarModelosSelect() {
  const select = document.getElementById("modelo_id");
  if (!select) return;
  // Aqui você fará o fetch dos modelos cadastrados para popular o select
}

// Função de Salvar
window.salvarParque = async function(event) {
  event.preventDefault();
  
  const id = document.getElementById("parqueIdEdicao").value;
  const dados = {
    cliente_id: document.getElementById("cliente_id").value,
    modelo_id: document.getElementById("modelo_id").value,
    numero_serie: document.getElementById("numero_serie").value,
    patrimonio_tag: document.getElementById("patrimonio_tag").value,
    observacoes: document.getElementById("observacoes").value
  };

  console.log("Salvando equipamento no parque instalado:", dados);
  alert("Equipamento salvo com sucesso!");
  fecharModalParque();
  carregarEquipamentos();
};
