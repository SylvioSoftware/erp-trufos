import { createComboBusca, normalizarTextoBusca } from "./combobox-busca.js";

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function createModalModelos({
  webhookBase,
  getState,
  onCatalogoAtualizado,
  fetchJsonSafe,
}) {
  let comboTipo = null;
  let comboMarca = null;

  function renderizarTabela() {
    const tbody = document.getElementById("listaModelosTabela");
    if (!tbody) return;

    const { modelosCache, obterNomeTipo, obterNomeMarca, formatarHT } =
      getState();

    if (!modelosCache || modelosCache.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 15px; color: #64748b;">
            Nenhum modelo cadastrado ainda.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = "";
    modelosCache.forEach((m) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(obterNomeTipo(m))}</td>
        <td>${escapeHtml(obterNomeMarca(m))}</td>
        <td><strong>${escapeHtml(m.nome || "-")}</strong></td>
        <td><strong>${escapeHtml(formatarHT(m.horas_tecnicas_media))}</strong></td>
        <td style="text-align: center;">
          <button
            type="button"
            onclick="editarModelo(${m.id})"
            style="background: #3b82f6; color: white; border: none; padding: 5px 9px; border-radius: 4px; cursor: pointer; margin-right: 4px; font-size: 0.82rem;"
          >
            Editar
          </button>
          <button
            type="button"
            onclick="excluirModelo(${m.id})"
            style="background: #ef4444; color: white; border: none; padding: 5px 9px; border-radius: 4px; cursor: pointer; font-size: 0.82rem;"
          >
            Excluir
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function limparForm() {
    document.getElementById("modeloIdEdicao").value = "";
    document.getElementById("tituloFormModelo").innerText =
      "Novo Modelo de Equipamento";
    comboTipo?.setValorPorId("");
    comboMarca?.setValorPorId("");
    document.getElementById("modelo_nome").value = "";
    document.getElementById("modelo_horas_tecnicas_media").value = "";
  }

  function abrir() {
    limparForm();
    renderizarTabela();
    document.getElementById("modalModelos").style.display = "flex";
  }

  function fechar() {
    comboTipo?.fecharLista();
    comboMarca?.fecharLista();
    document.getElementById("modalModelos").style.display = "none";
    onCatalogoAtualizado?.();
  }

  async function salvarNovoTipo() {
    const input = document.getElementById("novo_tipo_nome");
    const nome = input?.value.trim() || "";
    if (!nome) {
      alert("Informe o nome do tipo de equipamento.");
      return;
    }

    const { tiposCache } = getState();
    const tipoExistente = tiposCache.find(
      (t) => normalizarTextoBusca(t.nome) === normalizarTextoBusca(nome),
    );

    try {
      const resp = await fetch(`${webhookBase}/equipamentos-tipos-salvar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: tipoExistente?.id || null,
          nome,
        }),
      });

      if (!resp.ok) {
        alert("Erro ao salvar tipo de equipamento.");
        return;
      }

      input.value = "";
      const novosTipos = await fetchJsonSafe(
        `${webhookBase}/equipamentos-tipos-listar`,
        tiposCache,
      );
      await onCatalogoAtualizado?.({ tiposCache: novosTipos });

      const recemSalvo = novosTipos.find(
        (t) => normalizarTextoBusca(t.nome) === normalizarTextoBusca(nome),
      );
      if (recemSalvo) {
        comboTipo?.setValorPorId(recemSalvo.id);
      }
      renderizarTabela();
    } catch (err) {
      console.error("Erro ao salvar tipo:", err);
      alert("Erro de conexão ao salvar tipo.");
    }
  }

  async function salvarNovaMarca() {
    const input = document.getElementById("novo_marca_nome");
    const nome = input?.value.trim() || "";
    if (!nome) {
      alert("Informe o nome da marca.");
      return;
    }

    const { marcasCache } = getState();
    const marcaExistente = marcasCache.find(
      (m) => normalizarTextoBusca(m.nome) === normalizarTextoBusca(nome),
    );

    try {
      const resp = await fetch(`${webhookBase}/equipamentos-marcas-salvar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: marcaExistente?.id || null,
          nome,
        }),
      });

      if (!resp.ok) {
        alert("Erro ao salvar marca.");
        return;
      }

      input.value = "";
      const novasMarcas = await fetchJsonSafe(
        `${webhookBase}/equipamentos-marcas-listar`,
        marcasCache,
      );
      await onCatalogoAtualizado?.({ marcasCache: novasMarcas });

      const recemSalva = novasMarcas.find(
        (m) => normalizarTextoBusca(m.nome) === normalizarTextoBusca(nome),
      );
      if (recemSalva) {
        comboMarca?.setValorPorId(recemSalva.id);
      }
      renderizarTabela();
    } catch (err) {
      console.error("Erro ao salvar marca:", err);
      alert("Erro de conexão ao salvar marca.");
    }
  }

  function editar(id) {
    const { modelosCache } = getState();
    const mod = modelosCache.find((m) => String(m.id) === String(id));
    if (!mod) return;

    document.getElementById("modeloIdEdicao").value = mod.id;
    document.getElementById("tituloFormModelo").innerText =
      `Editando Modelo #${mod.id}`;
    comboTipo?.setValorPorId(mod.tipo_id || "");
    comboMarca?.setValorPorId(mod.marca_id || "");
    document.getElementById("modelo_nome").value = mod.nome || "";
    document.getElementById("modelo_horas_tecnicas_media").value =
      mod.horas_tecnicas_media ?? "";
  }

  async function salvar(event) {
    event.preventDefault();

    const idEdicao = document.getElementById("modeloIdEdicao").value || null;
    const tipoId = parseInt(
      document.getElementById("modelo_tipo_id").value,
      10,
    );
    const marcaId = parseInt(
      document.getElementById("modelo_marca_id").value,
      10,
    );
    const nome = document.getElementById("modelo_nome").value.trim();
    const htRaw = document.getElementById("modelo_horas_tecnicas_media").value;
    const horasTecnicasMedia =
      htRaw !== "" && !Number.isNaN(parseFloat(htRaw)) ? parseFloat(htRaw) : 0;

    if (!tipoId) {
      alert("Selecione um Tipo válido na lista.");
      document.getElementById("buscaTipoModelo")?.focus();
      return;
    }

    if (!marcaId) {
      alert("Selecione uma Marca válida na lista.");
      document.getElementById("buscaMarcaModelo")?.focus();
      return;
    }

    if (!nome) {
      alert("Preencha o Nome do Modelo.");
      return;
    }

    const { modelosCache } = getState();
    let idFinal = idEdicao;
    if (!idFinal) {
      const modeloExistente = modelosCache.find(
        (m) =>
          String(m.tipo_id) === String(tipoId) &&
          String(m.marca_id) === String(marcaId) &&
          normalizarTextoBusca(m.nome) === normalizarTextoBusca(nome),
      );
      if (modeloExistente?.id) {
        idFinal = modeloExistente.id;
      }
    }

    const payload = {
      id: idFinal,
      tipo_id: tipoId,
      marca_id: marcaId,
      nome,
      horas_tecnicas_media: horasTecnicasMedia,
    };

    try {
      const resp = await fetch(`${webhookBase}/equipamentos-modelos-salvar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        alert("Erro ao salvar modelo.");
        return;
      }

      const novosModelos = await fetchJsonSafe(
        `${webhookBase}/equipamentos-modelos-listar`,
        modelosCache,
      );
      await onCatalogoAtualizado?.({ modelosCache: novosModelos });
      limparForm();
      renderizarTabela();
    } catch (err) {
      console.error("Erro ao salvar modelo:", err);
      alert("Erro de conexão ao salvar modelo.");
    }
  }

  async function excluir(id) {
    if (!confirm("Deseja realmente excluir este modelo?")) return;

    const { modelosCache } = getState();
    try {
      const resp = await fetch(
        `${webhookBase}/equipamentos-modelos-excluir?id=${id}`,
        {
          method: "DELETE",
        },
      );

      if (!resp.ok) {
        alert(
          "Erro ao excluir modelo (verifique se não há equipamentos vinculados).",
        );
        return;
      }

      const novosModelos = await fetchJsonSafe(
        `${webhookBase}/equipamentos-modelos-listar`,
        modelosCache,
      );
      await onCatalogoAtualizado?.({ modelosCache: novosModelos });
      renderizarTabela();
    } catch (err) {
      console.error("Erro ao excluir modelo:", err);
      alert("Erro de conexão ao excluir modelo.");
    }
  }

  function init() {
    comboTipo = createComboBusca({
      inputId: "buscaTipoModelo",
      hiddenId: "modelo_tipo_id",
      listaId: "listaTipoModelo",
      emptyText: "Nenhum tipo encontrado.",
      getItems: () => {
        const { tiposCache } = getState();
        return (tiposCache || []).map((t) => ({
          id: t.id,
          label: t.nome,
          searchText: t.nome,
        }));
      },
    });

    comboMarca = createComboBusca({
      inputId: "buscaMarcaModelo",
      hiddenId: "modelo_marca_id",
      listaId: "listaMarcaModelo",
      emptyText: "Nenhuma marca encontrada.",
      getItems: () => {
        const { marcasCache } = getState();
        return (marcasCache || []).map((m) => ({
          id: m.id,
          label: m.nome,
          searchText: m.nome,
        }));
      },
    });
  }

  return {
    init,
    abrir,
    fechar,
    limparForm,
    salvarNovoTipo,
    salvarNovaMarca,
    editar,
    salvar,
    excluir,
    renderizarTabela,
  };
}
