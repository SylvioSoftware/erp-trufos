export function createOSFinanceiro() {
  let servicos = [];
  let produtos = [];
  let totalManual = false;

  function recalcular() {
    const tServ = servicos.reduce(
      (s, i) => s + Number(i.preco_unitario || 0) * Number(i.quantidade || 0),
      0,
    );
    const tProd = produtos.reduce(
      (s, i) => s + Number(i.preco_unitario || 0) * Number(i.quantidade || 0),
      0,
    );
    const sub = tServ + tProd;
    const desc = Number(document.getElementById("os-desconto")?.value || 0);
    document.getElementById("os-subtotal").value = sub.toFixed(2);
    if (!totalManual) {
      document.getElementById("os-valor-total").value = Math.max(
        0,
        sub - desc,
      ).toFixed(2);
    }
  }

  function renderTabela(tbodyId, lista, prefixo, vazioMsg) {
    const tbody = document.getElementById(tbodyId);
    if (!lista.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="padding:15px;text-align:center;color:#94a3b8;font-size:0.9em">${vazioMsg}</td></tr>`;
      return;
    }
    tbody.innerHTML = lista
      .map((item, idx) => {
        const tot =
          Number(item.preco_unitario || 0) * Number(item.quantidade || 1);
        return `
        <tr style="border-bottom:1px solid #f1f5f9">
          <td style="padding:8px 12px">${item.descricao}</td>
          <td style="padding:8px 12px"><input type="number" step="0.01" class="form-control ${prefixo}-preco" data-idx="${idx}" value="${Number(item.preco_unitario).toFixed(2)}" style="padding:4px 8px" /></td>
          <td style="padding:8px 12px"><input type="number" step="0.01" class="form-control ${prefixo}-qtd" data-idx="${idx}" value="${item.quantidade}" style="padding:4px 8px" /></td>
          <td style="padding:8px 12px;font-weight:600">R$ ${tot.toFixed(2)}</td>
          <td style="padding:8px 12px;text-align:center"><button type="button" class="btn-secondary ${prefixo}-del" data-idx="${idx}" style="padding:4px 8px">🗑️</button></td>
        </tr>`;
      })
      .join("");

    tbody.querySelectorAll(`.${prefixo}-preco`).forEach((inp) =>
      inp.addEventListener("input", () => {
        lista[Number(inp.dataset.idx)].preco_unitario = Number(inp.value || 0);
        totalManual = false;
        renderTabela(tbodyId, lista, prefixo, vazioMsg);
        recalcular();
      }),
    );

    tbody.querySelectorAll(`.${prefixo}-qtd`).forEach((inp) =>
      inp.addEventListener("input", () => {
        lista[Number(inp.dataset.idx)].quantidade = Number(inp.value || 0);
        totalManual = false;
        renderTabela(tbodyId, lista, prefixo, vazioMsg);
        recalcular();
      }),
    );

    tbody.querySelectorAll(`.${prefixo}-del`).forEach((btn) =>
      btn.addEventListener("click", () => {
        lista.splice(Number(btn.dataset.idx), 1);
        totalManual = false;
        renderTabela(tbodyId, lista, prefixo, vazioMsg);
        recalcular();
      }),
    );
  }

  function setItens(
    novosServ = [],
    novosProd = [],
    desconto = 0,
    valorTotal = null,
  ) {
    servicos = JSON.parse(JSON.stringify(novosServ || []));
    produtos = JSON.parse(JSON.stringify(novosProd || []));
    totalManual = false;
    document.getElementById("os-desconto").value = Number(
      desconto || 0,
    ).toFixed(2);
    renderTabela(
      "tabela-servicos-os",
      servicos,
      "serv",
      "Nenhum serviço lançado.",
    );
    renderTabela(
      "tabela-produtos-os",
      produtos,
      "prod",
      "Nenhuma peça lançada.",
    );
    recalcular();
    if (valorTotal !== undefined && valorTotal !== null) {
      document.getElementById("os-valor-total").value =
        Number(valorTotal).toFixed(2);
    }
  }

  function addServico(item) {
    servicos.push(item);
    totalManual = false;
    renderTabela(
      "tabela-servicos-os",
      servicos,
      "serv",
      "Nenhum serviço lançado.",
    );
    recalcular();
  }

  function addProduto(item) {
    produtos.push(item);
    totalManual = false;
    renderTabela(
      "tabela-produtos-os",
      produtos,
      "prod",
      "Nenhuma peça lançada.",
    );
    recalcular();
  }

  function init() {
    document
      .getElementById("os-desconto")
      ?.addEventListener("input", recalcular);
    document.getElementById("os-valor-total")?.addEventListener("input", () => {
      totalManual = true;
    });
    setItens([], [], 0, 0);
  }

  return {
    init,
    setItens,
    addServico,
    addProduto,
    getDados: () => ({
      servicos,
      produtos,
      subtotal: Number(document.getElementById("os-subtotal")?.value || 0),
      desconto: Number(document.getElementById("os-desconto")?.value || 0),
      valor_total: Number(
        document.getElementById("os-valor-total")?.value || 0,
      ),
    }),
  };
}
