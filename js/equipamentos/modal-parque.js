import { createComboBusca, normalizarTextoBusca } from "./combobox-busca.js";

export function createModalParque({
  webhookBase,
  getState,
  onSalvo,
  fetchJsonSafe,
}) {
  let comboCliente = null;
  let comboModelo = null;

  function atualizarResumoModelo(modeloId) {
    const resumoEl = document.getElementById("resumoModeloSelecionado");
    if (!resumoEl) return;

    const { modelosCache, obterNomeTipo, obterNomeMarca, formatarHT } =
      getState();
    const modelo = modelosCache.find((m) => String(m.id) === String(modeloId));
    if (!modelo) {
      resumoEl.textContent = "Tipo: - | Marca: - | Modelo: - | HT Médio: -";
      return;
    }

    const nomeTipo = obterNomeTipo(modelo);
    const nomeMarca = obterNomeMarca(modelo);
    const nomeModelo = modelo.nome || "-";
    const ht = formatarHT(modelo.horas_tecnicas_media);
    resumoEl.textContent = `Tipo: ${nomeTipo} | Marca: ${nomeMarca} | Modelo: ${nomeModelo} | HT Médio: ${ht}`;
  }

  function buscarDuplicataLocal({
    idEdicao,
    clienteId,
    modeloId,
    numeroSerie,
    patrimonioTag,
  }) {
    const { parqueCache } = getState();
    const serieNorm = normalizarTextoBusca(numeroSerie);
    const tagNorm = normalizarTextoBusca(patrimonioTag);

    return (
      parqueCache.find((item) => {
        if (!item || item.id == null) return false;
        if (idEdicao && String(item.id) === String(idEdicao)) return false;
        if (String(item.cliente_id) !== String(clienteId)) return false;
        if (String(item.modelo_id) !== String(modeloId)) return false;

        const itemSerie = normalizarTextoBusca(item.numero_serie);
        const itemTag = normalizarTextoBusca(item.patrimonio_tag);

        if (serieNorm) {
          return itemSerie === serieNorm;
        }
        if (tagNorm) {
          return itemTag === tagNorm;
        }
        return false;
      }) || null
    );
  }

  function abrirNovo() {
    document.getElementById("tituloModalParque").innerText =
      "Vincular Equipamento ao Cliente";
    document.getElementById("formParque").reset();
    document.getElementById("parqueIdEdicao").value = "";
    comboCliente?.setValorPorId("");
    comboModelo?.setValorPorId("");
    atualizarResumoModelo("");
    document.getElementById("modalParque").style.display = "flex";
  }

  function abrirEdicao(id) {
    const { parqueCache } = getState();
    const item = parqueCache.find((p) => String(p.id) === String(id));
    if (!item) return;

    document.getElementById("tituloModalParque").innerText =
      "Editar Equipamento no Cliente";
    document.getElementById("parqueIdEdicao").value = item.id;
    comboCliente?.setValorPorId(item.cliente_id || "");
    comboModelo?.setValorPorId(item.modelo_id || "");
    atualizarResumoModelo(item.modelo_id || "");
    document.getElementById("numero_serie").value = item.numero_serie || "";
    document.getElementById("patrimonio_tag").value = item.patrimonio_tag || "";
    document.getElementById("observacoes").value = item.observacoes || "";
    document.getElementById("modalParque").style.display = "flex";
  }

  function fechar() {
    comboCliente?.fecharLista();
    comboModelo?.fecharLista();
    document.getElementById("modalParque").style.display = "none";
  }

  async function salvar(event) {
    event.preventDefault();

    const idEdicao = document.getElementById("parqueIdEdicao").value || null;
    const clienteId = parseInt(document.getElementById("cliente_id").value, 10);
    const modeloId = parseInt(document.getElementById("modelo_id").value, 10);
    const numeroSerie = document.getElementById("numero_serie").value.trim();
    const patrimonioTag = document
      .getElementById("patrimonio_tag")
      .value.trim();
    const observacoes = document.getElementById("observacoes").value.trim();

    if (!clienteId) {
      alert("Selecione um cliente válido na lista.");
      document.getElementById("buscaClienteParque")?.focus();
      return;
    }

    if (!modeloId) {
      alert(
        "Selecione um equipamento (Tipo / Marca / Modelo) válido na lista.",
      );
      document.getElementById("buscaModeloParque")?.focus();
      return;
    }

    if (!numeroSerie && !patrimonioTag) {
      alert(
        "Informe pelo menos o Número de Série ou o Patrimônio / TAG para manter a rastreabilidade do equipamento.",
      );
      document.getElementById("numero_serie")?.focus();
      return;
    }

    let idFinal = idEdicao;
    if (!idFinal) {
      const existente = buscarDuplicataLocal({
        idEdicao,
        clienteId,
        modeloId,
        numeroSerie,
        patrimonioTag,
      });
      if (existente?.id) {
        idFinal = existente.id;
      }
    }

    const payload = {
      id: idFinal,
      cliente_id: clienteId,
      modelo_id: modeloId,
      numero_serie: numeroSerie,
      patrimonio_tag: patrimonioTag,
      observacoes,
    };

    try {
      const resp = await fetch(`${webhookBase}/parque-instalado-salvar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        alert("Erro ao salvar equipamento no parque instalado.");
        return;
      }

      fechar();
      const { parqueCache } = getState();
      const atualizado = await fetchJsonSafe(
        `${webhookBase}/parque-instalado-listar`,
        parqueCache,
      );
      await onSalvo?.(atualizado);
    } catch (err) {
      console.error("Erro ao salvar parque instalado:", err);
      alert("Erro de conexão ao salvar equipamento.");
    }
  }

  function init() {
    comboCliente = createComboBusca({
      inputId: "buscaClienteParque",
      hiddenId: "cliente_id",
      listaId: "listaClienteParque",
      emptyText: "Nenhum cliente encontrado.",
      getItems: () => {
        const { clientesCache } = getState();
        return (clientesCache || []).map((c) => {
          const label = c.nome_fantasia || c.razao_social || `Cliente #${c.id}`;
          return {
            id: c.id,
            label,
            searchText: `${c.nome_fantasia || ""} ${c.razao_social || ""} ${c.cnpj_cpf || ""}`,
          };
        });
      },
    });

    comboModelo = createComboBusca({
      inputId: "buscaModeloParque",
      hiddenId: "modelo_id",
      listaId: "listaModeloParque",
      emptyText: "Nenhum modelo encontrado.",
      getItems: () => {
        const { modelosCache, obterNomeTipo, obterNomeMarca, formatarHT } =
          getState();
        return (modelosCache || []).map((m) => {
          const tipo = obterNomeTipo(m);
          const marca = obterNomeMarca(m);
          const ht = formatarHT(m.horas_tecnicas_media);
          const label = `${tipo} • ${marca} • ${m.nome} (HT: ${ht})`;
          return {
            id: m.id,
            label,
            searchText: `${tipo} ${marca} ${m.nome || ""}`,
          };
        });
      },
      onSelect: (item) => {
        atualizarResumoModelo(item?.id || "");
      },
    });
  }

  return {
    init,
    abrirNovo,
    abrirEdicao,
    fechar,
    salvar,
    atualizarSelectModelos: () => {
      const atual = document.getElementById("modelo_id")?.value || "";
      if (atual) {
        comboModelo?.setValorPorId(atual);
      }
    },
  };
}
