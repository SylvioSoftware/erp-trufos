const LOTE_INICIAL = 25;

export function createOSLista({ onEditarOS }) {
  let cacheOS = [];
  let limiteVisivel = LOTE_INICIAL;

  const isConcluido = (s) =>
    ["CONCLUIDA", "FINALIZADA"].includes(String(s || "").toUpperCase());
  const isCancelado = (s) =>
    ["CANCELADA", "CANCELADO"].includes(String(s || "").toUpperCase());

  const formatarDataBR = (val) => {
    if (!val) return "—";
    const str = String(val).slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [a, m, d] = str.split("-");
      return `${d}/${m}/${a}`;
    }
    return str;
  };

  const calcularTempoAberto = (os) => {
    if (isCancelado(os.status) || !os.data_abertura) return "—";
    const inicio = new Date(os.data_abertura);
    if (Number.isNaN(inicio.getTime())) return "—";
    const fim =
      isConcluido(os.status) && os.data_conclusao
        ? new Date(os.data_conclusao)
        : new Date();
    const horas = Math.floor(
      Math.max(0, fim.getTime() - inicio.getTime()) / 3600000,
    );
    const dias = Math.floor(horas / 24);
    return dias >= 1 ? `${dias}d ${horas % 24}h` : `${Math.max(1, horas)}h`;
  };

  const badgeStatus = (status) => {
    const s = String(status || "ABERTA").toUpperCase();
    const map = {
      ABERTA: ["Aberta", "#fef3c7", "#92400e"],
      EM_ANDAMENTO: ["Em Andamento", "#dbeafe", "#1e40af"],
      AGUARDANDO_PECA: ["Aguardando Peça", "#ffedd5", "#9a3412"],
      AGUARDANDO_APROVACAO: ["Aguard. Aprovação", "#f3e8ff", "#6b21a8"],
      CONCLUIDA: ["Concluída", "#dcfce7", "#166534"],
      FINALIZADA: ["Finalizada", "#dcfce7", "#166534"],
      CANCELADA: ["Cancelada", "#fee2e2", "#991b1b"],
    };
    const [lbl, bg, fg] = map[s] || [s, "#e2e8f0", "#334155"];
    return `<span style="display:inline-block;padding:4px 10px;border-radius:999px;font-size:0.82em;font-weight:600;background:${bg};color:${fg};">${lbl}</span>`;
  };

  function atualizarResumo() {
    let pendentes = 0,
      concluidas = 0;
    cacheOS.forEach((os) => {
      if (isConcluido(os.status)) concluidas++;
      else if (!isCancelado(os.status)) pendentes++;
    });
    document.getElementById("count-os-pendentes").textContent = pendentes;
    document.getElementById("count-os-concluidas").textContent = concluidas;
    document.getElementById("count-os-total").textContent = cacheOS.length;
  }

  function render() {
    const tbody = document.getElementById("tabela-lista-os");
    const rodape = document.getElementById("os-paginacao-rodape");
    const info = document.getElementById("os-info-exibicao");
    const btnMais = document.getElementById("btn-ver-mais-os");
    const btnTodas = document.getElementById("btn-ver-todas-os");

    const termo = (document.getElementById("os-busca-lista")?.value || "")
      .toLowerCase()
      .trim();
    const dtIni = document.getElementById("os-data-inicio")?.value || "";
    const dtFim = document.getElementById("os-data-fim")?.value || "";
    const filtro =
      document.getElementById("os-filtro-status")?.value || "TODOS";
    const ordem =
      document.getElementById("os-ordenacao-lista")?.value || "STATUS_DATA";

    const filtradas = cacheOS.filter((os) => {
      const conc = isConcluido(os.status);
      const canc = isCancelado(os.status);
      if (filtro === "PENDENTES" && (conc || canc)) return false;
      if (filtro === "CONCLUIDAS" && !conc) return false;
      if (filtro === "CANCELADAS" && !canc) return false;

      const dOS = String(os.data_abertura || "").slice(0, 10);
      if (dtIni && (!dOS || dOS < dtIni)) return false;
      if (dtFim && (!dOS || dOS > dtFim)) return false;

      if (!termo) return true;
      return [
        os.id,
        os.numero_os,
        os.cliente_razao_social,
        os.equip_tipo,
        os.equip_fabricante,
        os.equip_modelo,
        os.equip_numero_serie,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(termo);
    });

    filtradas.sort((a, b) => {
      if (ordem === "CLIENTE_AZ") {
        return String(a.cliente_razao_social || "").localeCompare(
          String(b.cliente_razao_social || ""),
        );
      }
      const dA = new Date(a.data_abertura || 0).getTime();
      const dB = new Date(b.data_abertura || 0).getTime();
      if (ordem === "MAIS_ANTIGAS") return dA - dB;
      const pA = isConcluido(a.status) || isCancelado(a.status) ? 1 : 0;
      const pB = isConcluido(b.status) || isCancelado(b.status) ? 1 : 0;
      return pA !== pB ? pA - pB : dB - dA;
    });

    if (!filtradas.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="padding:28px;text-align:center;color:#64748b">Nenhuma Ordem de Serviço encontrada. Clique em <strong>+ Nova Ordem de Serviço</strong> para cadastrar.</td></tr>`;
      if (rodape) rodape.style.display = "none";
      return;
    }

    const visiveis = filtradas.slice(0, limiteVisivel);
    tbody.innerHTML = visiveis
      .map((os) => {
        const equip =
          [os.equip_tipo, os.equip_fabricante, os.equip_modelo]
            .filter(Boolean)
            .join(" ") || "Não informado";
        const serie = os.equip_numero_serie
          ? `<br><small style="color:#64748b">S/N: ${os.equip_numero_serie}</small>`
          : "";
        return `
        <tr style="border-bottom:1px solid #f1f5f9">
          <td style="padding:12px 14px;font-weight:700;color:#1e293b">#${os.numero_os || os.id || "—"}</td>
          <td style="padding:12px 14px;color:#475569">${formatarDataBR(os.data_abertura)}</td>
          <td style="padding:12px 14px;font-weight:600;color:#0f172a">${os.cliente_razao_social || "—"}</td>
          <td style="padding:12px 14px;color:#334155">${equip}${serie}</td>
          <td style="padding:12px 14px">${badgeStatus(os.status)}</td>
          <td style="padding:12px 14px;color:#475569;font-size:0.9em">${calcularTempoAberto(os)}</td>
          <td style="padding:12px 14px;text-align:center">
            <button type="button" class="btn-secondary btn-editar-os" data-id="${os.id}" style="padding:6px 12px;font-size:0.85em">✏️ Abrir</button>
          </td>
        </tr>`;
      })
      .join("");

    if (rodape) {
      rodape.style.display = "flex";
      info.textContent = `Exibindo ${visiveis.length} de ${filtradas.length} ordem(ns) de serviço`;
      const haMais = visiveis.length < filtradas.length;
      if (btnMais) btnMais.style.display = haMais ? "inline-flex" : "none";
      if (btnTodas) btnTodas.style.display = haMais ? "inline-flex" : "none";
    }

    tbody.querySelectorAll(".btn-editar-os").forEach((btn) => {
      btn.addEventListener("click", () => {
        const os = cacheOS.find(
          (item) => String(item.id) === String(btn.getAttribute("data-id")),
        );
        if (os && onEditarOS) onEditarOS(os);
      });
    });
  }

  function resetRender() {
    limiteVisivel = LOTE_INICIAL;
    render();
  }

  function init(endpointListar) {
    [
      "os-busca-lista",
      "os-data-inicio",
      "os-data-fim",
      "os-filtro-status",
      "os-ordenacao-lista",
    ].forEach((id) => {
      document
        .getElementById(id)
        ?.addEventListener(
          id === "os-busca-lista" ? "input" : "change",
          resetRender,
        );
    });

    document
      .getElementById("btn-limpar-datas-os")
      ?.addEventListener("click", () => {
        document.getElementById("os-data-inicio").value = "";
        document.getElementById("os-data-fim").value = "";
        resetRender();
      });

    document.querySelectorAll("[data-filtro-chip]").forEach((chip) => {
      chip.addEventListener("click", () => {
        document.getElementById("os-filtro-status").value =
          chip.getAttribute("data-filtro-chip");
        resetRender();
      });
    });

    document
      .getElementById("btn-ver-mais-os")
      ?.addEventListener("click", () => {
        limiteVisivel += LOTE_INICIAL;
        render();
      });

    document
      .getElementById("btn-ver-todas-os")
      ?.addEventListener("click", () => {
        limiteVisivel = Infinity;
        render();
      });

    return async function carregar() {
      document.getElementById("tabela-lista-os").innerHTML =
        `<tr><td colspan="7" style="padding:25px;text-align:center;color:#64748b">Carregando ordens de serviço...</td></tr>`;
      try {
        const r = await fetch(endpointListar);
        const d = r.ok ? await r.json() : [];
        cacheOS = Array.isArray(d) ? d : d?.data || [];
      } catch {
        cacheOS = [];
      }
      limiteVisivel = LOTE_INICIAL;
      atualizarResumo();
      render();
    };
  }

  return { init, isConcluido };
}
