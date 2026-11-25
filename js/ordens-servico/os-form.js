import { padronizarTexto } from "./modais/modal-cliente.js";
import {
  salvarEquipamentoNaHierarquia,
  sincronizarCamposEquipamentoOS,
} from "./equipamento-autocomplete.js";

const CAMPOS_DATA_MONITORADOS = [
  { campo: "data_agendada", rotulo: "Agendamento" },
  { campo: "data_inicio_servico", rotulo: "Início do serviço" },
  { campo: "data_conclusao", rotulo: "Término do serviço" },
  { campo: "data_orcamento", rotulo: "Data do orçamento" },
  { campo: "data_validade_orcamento", rotulo: "Validade do orçamento" },
  { campo: "data_aprovacao", rotulo: "Data de aprovação" },
];

export function createOSForm({
  endpoints,
  financeiro,
  historico,
  isConcluido,
  onVoltarLista,
  onSalvo,
}) {
  let imagens = [];
  let estadoInicial = null;

  const dataHoraAgora = () => {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  function toDatetimeLocal(val) {
    if (!val) return "";
    const str = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(str)) {
      return str.slice(0, 16);
    }
    const parsed = new Date(str);
    if (Number.isNaN(parsed.getTime())) return str.slice(0, 16);
    return new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  }

  function toDateInput(val) {
    if (!val) return "";
    return String(val).trim().slice(0, 10);
  }

  function formatarValorDataLog(val) {
    if (!val) return "—";
    const str = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [ano, mes, dia] = str.split("-");
      return `${dia}/${mes}/${ano}`;
    }
    const d = new Date(str);
    if (Number.isNaN(d.getTime())) return str;
    return d.toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  }

  function capturarSnapshot(dados, duplicada = false) {
    return {
      isNova: !dados.id || duplicada,
      duplicada,
      status: dados.status || "ABERTA",
      datas: CAMPOS_DATA_MONITORADOS.reduce((acc, { campo }) => {
        acc[campo] = dados[campo] || "";
        return acc;
      }, {}),
    };
  }

  function ativarAba(targetId) {
    document
      .querySelectorAll(".tab-btn")
      .forEach((b) =>
        b.classList.toggle("active", b.dataset.target === targetId),
      );
    document.querySelectorAll(".tab-pane").forEach((p) => {
      p.style.display = p.id === targetId ? "block" : "none";
    });
  }

  function mostrarView(titulo = "Nova Ordem de Serviço") {
    document.getElementById("os-view-lista").style.display = "none";
    document.getElementById("os-view-form").style.display = "block";
    document.getElementById("os-badge-numero").textContent = titulo;
    document.getElementById("os-subtitulo-pagina").textContent =
      "Preenchimento e acompanhamento técnico da Ordem de Serviço";
    ativarAba("aba-cliente");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderImagens() {
    const box = document.getElementById("os-galeria-imagens");
    if (!imagens.length) {
      box.innerHTML = `<div style="grid-column:1/-1;padding:30px;text-align:center;background:#f8fafc;border:2px dashed #cbd5e1;border-radius:8px;color:#64748b">📸 Nenhuma imagem anexada a esta Ordem de Serviço ainda.</div>`;
      return;
    }
    box.innerHTML = imagens
      .map(
        (img, i) => `
      <div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;background:#fff;padding:10px">
        <img src="${img.dataUrl || img.url}" alt="${img.nome || "Foto OS"}" style="width:100%;height:180px;object-fit:cover;border-radius:6px;margin-bottom:8px" />
        <input type="text" class="form-control img-leg" data-idx="${i}" value="${img.legenda || ""}" placeholder="Legenda da foto..." style="margin-bottom:8px;font-size:0.88em" />
        <button type="button" class="btn-secondary img-del" data-idx="${i}" style="width:100%;padding:6px;font-size:0.85em">🗑️ Remover</button>
      </div>`,
      )
      .join("");
    box.querySelectorAll(".img-leg").forEach((inp) =>
      inp.addEventListener("input", () => {
        imagens[Number(inp.dataset.idx)].legenda = inp.value;
      }),
    );
    box.querySelectorAll(".img-del").forEach((btn) =>
      btn.addEventListener("click", () => {
        imagens.splice(Number(btn.dataset.idx), 1);
        renderImagens();
      }),
    );
  }

  function limpar() {
    document.getElementById("form-os").reset();
    document.getElementById("os-id").value = "";
    document.getElementById("os-cliente-id").value = "";
    document.getElementById("os-cliente-prazo-validade").value = "30";
    document.getElementById("os-equipamento-id").value = "";
    document.getElementById("os-status").value = "ABERTA";

    document.getElementById("os-data-abertura").value = dataHoraAgora();
    document.getElementById("os-data-agendada").value = "";
    document.getElementById("os-data-inicio-servico").value = "";
    document.getElementById("os-data-conclusao").value = "";
    document.getElementById("os-data-orcamento").value = "";
    document.getElementById("os-data-validade-orcamento").value = "";
    document.getElementById("os-data-aprovacao").value = "";

    const btnCont = document.getElementById("btn-ver-contatos");
    btnCont.disabled = true;
    btnCont.style.opacity = "0.6";
    btnCont.style.cursor = "not-allowed";
    document.getElementById("btn-duplicar-os").style.display = "none";
    document.getElementById("btn-encerrar-pdf-os").style.display = "none";
    imagens = [];
    estadoInicial = capturarSnapshot({ id: null, status: "ABERTA" }, false);
    financeiro.setItens([], [], 0, 0);
    renderImagens();
    sincronizarCamposEquipamentoOS();
  }

  function preencher(os, duplicar = false) {
    limpar();
    if (!duplicar && os.id) {
      document.getElementById("os-id").value = os.id;
      document.getElementById("btn-duplicar-os").style.display = "inline-flex";
      document.getElementById("btn-encerrar-pdf-os").style.display =
        "inline-flex";
    }
    document.getElementById("os-status").value = duplicar
      ? "ABERTA"
      : os.status || "ABERTA";

    document.getElementById("os-data-abertura").value = duplicar
      ? dataHoraAgora()
      : toDatetimeLocal(os.data_abertura) || dataHoraAgora();
    document.getElementById("os-data-agendada").value = duplicar
      ? ""
      : toDatetimeLocal(os.data_agendada);
    document.getElementById("os-data-inicio-servico").value = duplicar
      ? ""
      : toDatetimeLocal(os.data_inicio_servico);
    document.getElementById("os-data-conclusao").value = duplicar
      ? ""
      : toDatetimeLocal(os.data_conclusao);
    document.getElementById("os-data-orcamento").value = duplicar
      ? ""
      : toDatetimeLocal(os.data_orcamento);
    document.getElementById("os-data-validade-orcamento").value = duplicar
      ? ""
      : toDateInput(os.data_validade_orcamento);
    document.getElementById("os-data-aprovacao").value = duplicar
      ? ""
      : toDatetimeLocal(os.data_aprovacao);

    if (os.prazo_validade_orcamento_dias) {
      historico?.definirPrazoCliente(os.prazo_validade_orcamento_dias);
    }

    document.getElementById("os-cliente-id").value = os.cliente_id || "";
    document.getElementById("os-razao-social").value = padronizarTexto(
      os.cliente_razao_social || "",
      "TITLE",
    );
    document.getElementById("os-cnpj").value = (
      os.cliente_cnpj_cpf || ""
    ).trim();
    document.getElementById("os-cliente-telefone").value =
      os.cliente_telefone || "";
    document.getElementById("os-endereco").value = padronizarTexto(
      os.cliente_endereco || "",
      "TITLE",
    );
    document.getElementById("os-cidade").value = padronizarTexto(
      os.cliente_cidade_uf || "",
      "TITLE",
    );

    if (os.cliente_id) {
      const btnCont = document.getElementById("btn-ver-contatos");
      btnCont.disabled = false;
      btnCont.style.opacity = "1";
      btnCont.style.cursor = "pointer";
    }

    document.getElementById("os-equipamento-id").value =
      os.equipamento_id || "";
    document.getElementById("os-equip-tipo").value = padronizarTexto(
      os.equip_tipo || "",
      "TITLE",
    );
    document.getElementById("os-equip-fabricante").value = padronizarTexto(
      os.equip_fabricante || "",
      "TITLE",
    );
    document.getElementById("os-equip-modelo").value = (
      os.equip_modelo || ""
    ).trim();
    document.getElementById("os-equip-serie").value = (
      os.equip_numero_serie || ""
    ).trim();
    document.getElementById("os-equip-patrimonio").value = (
      os.equip_patrimonio || ""
    ).trim();
    document.getElementById("os-aspecto-aparencia").value = padronizarTexto(
      os.aspecto_aparencia || "",
      "TITLE",
    );

    sincronizarCamposEquipamentoOS();

    document.getElementById("os-defeito-relatado").value =
      os.descricao_defeito || os.defeito_relatado || "";
    document.getElementById("os-defeito-constatado").value =
      os.defeito_constatado || "";
    document.getElementById("os-servico-realizado").value =
      os.laudo_tecnico || os.servico_realizado || "";
    document.getElementById("os-observacoes-tecnicas").value =
      os.observacoes_tecnicas || "";

    financeiro.setItens(os.servicos, os.produtos, os.desconto, os.valor_total);
    imagens =
      !duplicar && Array.isArray(os.imagens)
        ? JSON.parse(JSON.stringify(os.imagens))
        : [];
    renderImagens();

    estadoInicial = capturarSnapshot(
      {
        id: duplicar ? null : os.id,
        status: duplicar ? "ABERTA" : os.status || "ABERTA",
        data_agendada: document.getElementById("os-data-agendada").value,
        data_inicio_servico: document.getElementById("os-data-inicio-servico")
          .value,
        data_conclusao: document.getElementById("os-data-conclusao").value,
        data_orcamento: document.getElementById("os-data-orcamento").value,
        data_validade_orcamento: document.getElementById(
          "os-data-validade-orcamento",
        ).value,
        data_aprovacao: document.getElementById("os-data-aprovacao").value,
      },
      duplicar,
    );

    mostrarView(
      duplicar ? "Nova OS (Duplicada)" : `OS #${os.numero_os || os.id}`,
    );
  }

  function payload() {
    const status = document.getElementById("os-status").value;
    const aberturaVal = document.getElementById("os-data-abertura").value;
    const agendadaVal = document.getElementById("os-data-agendada").value;
    const inicioVal = document.getElementById("os-data-inicio-servico").value;
    const conclusaoVal = document.getElementById("os-data-conclusao").value;
    const orcamentoVal = document.getElementById("os-data-orcamento").value;
    const validadeVal = document.getElementById(
      "os-data-validade-orcamento",
    ).value;
    const aprovacaoVal = document.getElementById("os-data-aprovacao").value;

    const dataConclusaoFinal = conclusaoVal
      ? conclusaoVal
      : isConcluido(status)
        ? dataHoraAgora()
        : null;

    return {
      id: document.getElementById("os-id").value || null,
      status,
      data_abertura: aberturaVal || dataHoraAgora(),
      data_agendada: agendadaVal || null,
      data_inicio_servico: inicioVal || null,
      data_conclusao: dataConclusaoFinal,
      data_orcamento: orcamentoVal || null,
      data_validade_orcamento: validadeVal || null,
      data_aprovacao: aprovacaoVal || null,
      cliente_id: document.getElementById("os-cliente-id").value || null,
      cliente_razao_social: padronizarTexto(
        document.getElementById("os-razao-social").value,
        "TITLE",
      ),
      cliente_cnpj_cpf: document.getElementById("os-cnpj").value.trim(),
      cliente_telefone: document
        .getElementById("os-cliente-telefone")
        .value.trim(),
      cliente_endereco: padronizarTexto(
        document.getElementById("os-endereco").value,
        "TITLE",
      ),
      cliente_cidade_uf: padronizarTexto(
        document.getElementById("os-cidade").value,
        "TITLE",
      ),
      equipamento_id:
        document.getElementById("os-equipamento-id").value || null,
      equip_tipo: padronizarTexto(
        document.getElementById("os-equip-tipo").value,
        "TITLE",
      ),
      equip_fabricante: padronizarTexto(
        document.getElementById("os-equip-fabricante").value,
        "TITLE",
      ),
      equip_modelo: document.getElementById("os-equip-modelo").value.trim(),
      equip_numero_serie: document
        .getElementById("os-equip-serie")
        .value.trim(),
      equip_patrimonio: document
        .getElementById("os-equip-patrimonio")
        .value.trim(),
      aspecto_aparencia: padronizarTexto(
        document.getElementById("os-aspecto-aparencia").value,
        "TITLE",
      ),
      descricao_defeito: document.getElementById("os-defeito-relatado").value,
      defeito_constatado: document.getElementById("os-defeito-constatado")
        .value,
      laudo_tecnico: document.getElementById("os-servico-realizado").value,
      observacoes_tecnicas: document.getElementById("os-observacoes-tecnicas")
        .value,
      ...financeiro.getDados(),
      imagens,
    };
  }

  async function sincronizarParqueInstalado(dados) {
    const temEquipamento = Boolean(
      dados.equip_tipo ||
      dados.equip_fabricante ||
      dados.equip_modelo ||
      dados.equip_numero_serie ||
      dados.equip_patrimonio,
    );

    if (
      !dados.cliente_id ||
      !temEquipamento ||
      !endpoints.salvarParqueInstalado
    ) {
      return;
    }

    try {
      const eqIdAtual =
        document.getElementById("os-equipamento-id")?.value ||
        dados.equipamento_id ||
        null;

      const res = await salvarEquipamentoNaHierarquia({
        endpoints: {
          salvarTipo: endpoints.salvarEquipamentoTipo,
          salvarMarca: endpoints.salvarEquipamentoMarca,
          salvarModelo: endpoints.salvarEquipamentoModelo,
          salvarParque: endpoints.salvarParqueInstalado,
        },
        dadosEquipamento: {
          id: eqIdAtual,
          cliente_id: Number(dados.cliente_id),
          tipo: dados.equip_tipo,
          fabricante: dados.equip_fabricante,
          modelo: dados.equip_modelo,
          numero_serie: dados.equip_numero_serie || null,
          patrimonio_tag: dados.equip_patrimonio || null,
          observacoes: dados.aspecto_aparencia || null,
        },
      });

      if (res?.equipamentoId) {
        document.getElementById("os-equipamento-id").value = res.equipamentoId;
        dados.equipamento_id = res.equipamentoId;
        sincronizarCamposEquipamentoOS();
      }
    } catch (errParque) {
      console.warn("Aviso ao sincronizar equipamento com o parque:", errParque);
    }
  }

  async function registrarEventosAutomaticos(dadosSalvos, geradoPdf) {
    if (!historico?.registrarEvento) return;

    const osId = dadosSalvos?.id || dadosSalvos?.numero_os || null;
    const baseCtx = {
      os_id: osId,
      cliente_id: dadosSalvos.cliente_id || null,
      equipamento_id: dadosSalvos.equipamento_id || null,
    };

    const eventos = [];
    const snap = estadoInicial || capturarSnapshot(dadosSalvos, false);

    if (snap.isNova) {
      eventos.push({
        ...baseCtx,
        tipo: "SISTEMA_DATA",
        descricao: snap.duplicada
          ? `OS criada por duplicação (Status: ${dadosSalvos.status}, Abertura: ${formatarValorDataLog(dadosSalvos.data_abertura)}).`
          : `OS aberta em ${formatarValorDataLog(dadosSalvos.data_abertura)} com status ${dadosSalvos.status}.`,
      });
    } else if (snap.status !== dadosSalvos.status) {
      eventos.push({
        ...baseCtx,
        tipo: "SISTEMA_DATA",
        descricao: `Status alterado de ${snap.status} para ${dadosSalvos.status}.`,
      });
    }

    for (const { campo, rotulo } of CAMPOS_DATA_MONITORADOS) {
      const anterior = snap.datas[campo] || "";
      const atual = dadosSalvos[campo] || "";
      if (anterior !== atual && atual) {
        eventos.push({
          ...baseCtx,
          tipo: "SISTEMA_DATA",
          descricao: anterior
            ? `${rotulo} atualizado de ${formatarValorDataLog(anterior)} para ${formatarValorDataLog(atual)}.`
            : `${rotulo} definido para ${formatarValorDataLog(atual)}.`,
        });
      }
    }

    if (geradoPdf) {
      eventos.push({
        ...baseCtx,
        tipo: "SISTEMA_DATA",
        descricao: "OS encerrada e enviada para geração de PDF.",
      });
    }

    for (const ev of eventos) {
      await historico.registrarEvento(ev);
    }
  }

  async function salvar(gerarPdf = false) {
    const dados = payload();
    if (!dados.cliente_id && !dados.cliente_razao_social) {
      alert(
        "Selecione um cliente na Aba 1 antes de salvar a Ordem de Serviço.",
      );
      ativarAba("aba-cliente");
      return;
    }
    try {
      const r = await fetch(endpoints.salvarOS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const salvo = await r.json();
      const idFinal = salvo?.id || salvo?.data?.id || dados.id;

      await sincronizarParqueInstalado(dados);

      if (gerarPdf) {
        await fetch(endpoints.encerrarOS, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...dados, id: idFinal }),
        });
      }

      await registrarEventosAutomaticos({ ...dados, id: idFinal }, gerarPdf);

      alert(
        gerarPdf
          ? "OS concluída e enviada para geração de PDF!"
          : "Ordem de Serviço salva com sucesso!",
      );
      await onSalvo?.();
      onVoltarLista?.();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar no webhook do n8n.");
    }
  }

  function init() {
    document
      .querySelectorAll(".tab-btn")
      .forEach((b) =>
        b.addEventListener("click", () => ativarAba(b.dataset.target)),
      );
    document.getElementById("btn-nova-os")?.addEventListener("click", () => {
      limpar();
      mostrarView("Nova Ordem de Serviço");
    });
    document
      .getElementById("btn-cancelar-edicao-os")
      ?.addEventListener("click", () => onVoltarLista?.());
    document.getElementById("form-os")?.addEventListener("submit", (e) => {
      e.preventDefault();
      salvar(false);
    });
    document
      .getElementById("btn-duplicar-os")
      ?.addEventListener("click", () => {
        preencher(payload(), true);
        alert(
          "OS duplicada! Revise os dados e clique em Salvar Ordem de Serviço.",
        );
      });
    document
      .getElementById("btn-encerrar-pdf-os")
      ?.addEventListener("click", () => {
        if (!document.getElementById("os-data-conclusao").value) {
          document.getElementById("os-data-conclusao").value = dataHoraAgora();
        }
        document.getElementById("os-status").value = "CONCLUIDA";
        salvar(true);
      });

    const lerFiles = (fl) =>
      Array.from(fl || []).forEach((f) => {
        const rd = new FileReader();
        rd.onload = (ev) => {
          imagens.push({
            nome: f.name,
            legenda: "",
            dataUrl: ev.target.result,
          });
          renderImagens();
        };
        rd.readAsDataURL(f);
      });
    document
      .getElementById("os-input-camera")
      ?.addEventListener("change", (e) => {
        lerFiles(e.target.files);
        e.target.value = "";
      });
    document
      .getElementById("os-input-galeria")
      ?.addEventListener("change", (e) => {
        lerFiles(e.target.files);
        e.target.value = "";
      });

    document
      .getElementById("btn-laudo-ia")
      ?.addEventListener("click", async () => {
        const btn = document.getElementById("btn-laudo-ia");
        const relato = document
          .getElementById("os-defeito-relatado")
          .value.trim();
        const constatado = document
          .getElementById("os-defeito-constatado")
          .value.trim();
        const servico = document
          .getElementById("os-servico-realizado")
          .value.trim();
        if (!relato && !constatado && !servico) {
          alert(
            "Preencha ao menos um campo do laudo antes de pedir revisão à IA.",
          );
          return;
        }
        const orig = btn.textContent;
        btn.disabled = true;
        btn.textContent = "⏳ Melhorando texto...";
        try {
          const r = await fetch(endpoints.melhorarLaudoIA, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              equipamento:
                `${document.getElementById("os-equip-tipo").value} ${document.getElementById("os-equip-fabricante").value} ${document.getElementById("os-equip-modelo").value}`.trim(),
              defeito_relatado: relato,
              defeito_constatado: constatado,
              servico_realizado: servico,
            }),
          });
          const res = await r.json();
          if (res.defeito_constatado)
            document.getElementById("os-defeito-constatado").value =
              res.defeito_constatado;
          if (res.servico_realizado)
            document.getElementById("os-servico-realizado").value =
              res.servico_realizado;
        } catch {
          alert("Não foi possível conectar ao webhook de IA no momento.");
        } finally {
          btn.disabled = false;
          btn.textContent = orig;
        }
      });
  }

  return { init, preencher, ativarAba };
}
