export function initModalEquipamento(endpointParque, onIrAbaCliente) {
  let equipamentos = [];

  const abrir = () => {
    const el = document.getElementById("modal-selecionar-equipamento");
    if (el) el.style.display = "flex";
  };

  const fechar = () => {
    const el = document.getElementById("modal-selecionar-equipamento");
    if (el) el.style.display = "none";
  };

  function render() {
    const tbody = document.getElementById("lista-modal-equipamentos");
    if (!tbody) return;
    const q = (document.getElementById("busca-modal-equipamento")?.value || "")
      .toLowerCase()
      .trim();
    const lista = equipamentos.filter(
      (eq) =>
        !q ||
        [
          eq.tipo_nome,
          eq.marca_nome,
          eq.modelo_nome,
          eq.numero_serie,
          eq.patrimonio || eq.patrimonio_tag,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q),
    );

    if (!lista.length) {
      tbody.innerHTML =
        '<tr><td colspan="4" style="padding:14px;text-align:center;color:#64748b">Nenhum equipamento cadastrado para este cliente.</td></tr>';
      return;
    }

    tbody.innerHTML = lista
      .map(
        (eq) => `
      <tr style="border-bottom:1px solid #f1f5f9">
        <td style="padding:8px 10px">${[eq.tipo_nome, eq.marca_nome, eq.modelo_nome].filter(Boolean).join(" / ")}</td>
        <td style="padding:8px 10px">${eq.numero_serie || "—"}</td>
        <td style="padding:8px 10px">${eq.patrimonio || eq.patrimonio_tag || "—"}</td>
        <td style="padding:8px 10px">
          <button type="button" class="btn-primary btn-pick-e" data-id="${eq.id}" style="padding:5px 10px;font-size:0.85em">Selecionar</button>
        </td>
      </tr>`,
      )
      .join("");

    tbody.querySelectorAll(".btn-pick-e").forEach((b) =>
      b.addEventListener("click", () => {
        const eq = equipamentos.find(
          (x) => String(x.id) === String(b.dataset.id),
        );
        if (!eq) return;
        document.getElementById("os-equipamento-id").value = eq.id;
        document.getElementById("os-equip-tipo").value = eq.tipo_nome || "";
        document.getElementById("os-equip-fabricante").value =
          eq.marca_nome || "";
        document.getElementById("os-equip-modelo").value = eq.modelo_nome || "";
        document.getElementById("os-equip-serie").value = eq.numero_serie || "";
        document.getElementById("os-equip-patrimonio").value =
          eq.patrimonio || eq.patrimonio_tag || "";
        fechar();
      }),
    );
  }

  document
    .querySelector('[data-close-modal="modal-selecionar-equipamento"]')
    ?.addEventListener("click", fechar);
  document
    .getElementById("busca-modal-equipamento")
    ?.addEventListener("input", render);

  document
    .getElementById("btn-abrir-modal-equipamento")
    ?.addEventListener("click", async () => {
      const cid = document.getElementById("os-cliente-id")?.value;
      if (!cid) {
        alert("Selecione primeiro o cliente na Aba 1.");
        onIrAbaCliente?.();
        return;
      }
      abrir();
      const r = await fetch(
        `${endpointParque}?cliente_id=${encodeURIComponent(cid)}`,
      ).catch(() => null);
      const d = r?.ok ? await r.json() : [];
      equipamentos = Array.isArray(d) ? d : d?.data || [];
      render();
    });
}
