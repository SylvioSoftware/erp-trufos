export function initModalServico(endpointServicos, onAddServico) {
  let catalogo = [];

  const abrir = () => {
    const el = document.getElementById("modal-adicionar-servico-os");
    if (el) el.style.display = "flex";
  };

  const fechar = () => {
    const el = document.getElementById("modal-adicionar-servico-os");
    if (el) el.style.display = "none";
  };

  function render() {
    const tbody = document.getElementById("lista-modal-servicos");
    if (!tbody) return;
    const q = (document.getElementById("busca-modal-servico")?.value || "")
      .toLowerCase()
      .trim();
    const lista = catalogo.filter(
      (s) =>
        !q ||
        [s.sku, s.codigo, s.nome, s.descricao]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q),
    );

    tbody.innerHTML = lista.length
      ? lista
          .map((s) => {
            const p = Number(s.valor_venda || s.preco_venda || s.valor || 0);
            return `
            <tr style="border-bottom:1px solid #f1f5f9">
              <td style="padding:8px 10px">${s.sku || s.codigo || "—"}</td>
              <td style="padding:8px 10px">${s.descricao || s.nome}</td>
              <td style="padding:8px 10px">R$ ${p.toFixed(2)}</td>
              <td style="padding:8px 10px">
                <button type="button" class="btn-primary btn-pick-s" data-id="${s.id}" style="padding:5px 10px;font-size:0.85em">Adicionar</button>
              </td>
            </tr>`;
          })
          .join("")
      : '<tr><td colspan="4" style="padding:14px;text-align:center;color:#64748b">Nenhum serviço encontrado.</td></tr>';

    tbody.querySelectorAll(".btn-pick-s").forEach((b) =>
      b.addEventListener("click", () => {
        const s = catalogo.find((x) => String(x.id) === String(b.dataset.id));
        if (s && onAddServico) {
          onAddServico({
            servico_id: s.id,
            sku: s.sku || s.codigo || "",
            descricao: s.descricao || s.nome,
            preco_unitario: Number(
              s.valor_venda || s.preco_venda || s.valor || 0,
            ),
            quantidade: 1,
          });
        }
        fechar();
      }),
    );
  }

  document
    .querySelector('[data-close-modal="modal-adicionar-servico-os"]')
    ?.addEventListener("click", fechar);
  document
    .getElementById("busca-modal-servico")
    ?.addEventListener("input", render);

  document
    .getElementById("btn-add-servico")
    ?.addEventListener("click", async () => {
      abrir();
      if (!catalogo.length) {
        const r = await fetch(endpointServicos).catch(() => null);
        const d = r?.ok ? await r.json() : [];
        catalogo = Array.isArray(d) ? d : d?.data || [];
      }
      render();
    });
}
