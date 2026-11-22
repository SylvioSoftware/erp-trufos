export function initModalProduto(endpointProdutos, onAddProduto) {
  let catalogo = [];

  const abrir = () => {
    const el = document.getElementById("modal-adicionar-produto-os");
    if (el) el.style.display = "flex";
  };

  const fechar = () => {
    const el = document.getElementById("modal-adicionar-produto-os");
    if (el) el.style.display = "none";
  };

  function render() {
    const tbody = document.getElementById("lista-modal-produtos");
    if (!tbody) return;
    const q = (document.getElementById("busca-modal-produto")?.value || "")
      .toLowerCase()
      .trim();
    const lista = catalogo.filter(
      (p) =>
        !q ||
        [p.sku, p.codigo, p.nome, p.descricao]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q),
    );

    tbody.innerHTML = lista.length
      ? lista
          .map((p) => {
            const pr = Number(p.preco_venda || 0);
            return `
            <tr style="border-bottom:1px solid #f1f5f9">
              <td style="padding:8px 10px">${p.sku || p.codigo || "—"}</td>
              <td style="padding:8px 10px">${p.descricao || p.nome}</td>
              <td style="padding:8px 10px">${p.estoque_atual ?? "—"}</td>
              <td style="padding:8px 10px">R$ ${pr.toFixed(2)}</td>
              <td style="padding:8px 10px">
                <button type="button" class="btn-primary btn-pick-p" data-id="${p.id}" style="padding:5px 10px;font-size:0.85em">Adicionar</button>
              </td>
            </tr>`;
          })
          .join("")
      : '<tr><td colspan="5" style="padding:14px;text-align:center;color:#64748b">Nenhuma peça encontrada.</td></tr>';

    tbody.querySelectorAll(".btn-pick-p").forEach((b) =>
      b.addEventListener("click", () => {
        const p = catalogo.find((x) => String(x.id) === String(b.dataset.id));
        if (p && onAddProduto) {
          onAddProduto({
            produto_id: p.id,
            sku: p.sku || p.codigo || "",
            descricao: p.descricao || p.nome,
            preco_unitario: Number(p.preco_venda || 0),
            quantidade: 1,
          });
        }
        fechar();
      }),
    );
  }

  document
    .querySelector('[data-close-modal="modal-adicionar-produto-os"]')
    ?.addEventListener("click", fechar);
  document
    .getElementById("busca-modal-produto")
    ?.addEventListener("input", render);

  document
    .getElementById("btn-add-produto")
    ?.addEventListener("click", async () => {
      abrir();
      if (!catalogo.length) {
        const r = await fetch(endpointProdutos).catch(() => null);
        const d = r?.ok ? await r.json() : [];
        catalogo = Array.isArray(d) ? d : d?.data || [];
      }
      render();
    });
}
