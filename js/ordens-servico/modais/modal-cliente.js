const SIGLAS_MAIUSCULAS = new Set([
  "RS",
  "SC",
  "PR",
  "SP",
  "RJ",
  "MG",
  "BA",
  "DF",
  "GO",
  "MT",
  "MS",
  "ES",
  "PE",
  "CE",
  "PA",
  "AM",
  "MA",
  "PB",
  "RN",
  "PI",
  "AL",
  "SE",
  "TO",
  "RO",
  "AC",
  "AP",
  "RR",
  "LTDA",
  "ME",
  "EPP",
  "SA",
  "S/A",
  "EIRELI",
  "CNPJ",
  "CPF",
  "IE",
  "UF",
  "TV",
  "IA",
  "OS",
]);

const PREPOSICOES_MINUSCULAS = new Set(["da", "das", "de", "do", "dos", "e"]);

export function padronizarTexto(valor, modo = "TITLE") {
  if (!valor) return "";
  const limpo = String(valor).trim().replace(/\s+/g, " ");
  if (!limpo) return "";

  if (modo === "UPPER") {
    return limpo.toUpperCase();
  }

  return limpo
    .toLowerCase()
    .split(" ")
    .map((palavra, idx) => {
      const semPontuacao = palavra.replace(/[^a-zA-ZÀ-ÿ/]/g, "").toUpperCase();
      if (SIGLAS_MAIUSCULAS.has(semPontuacao)) {
        return palavra.toUpperCase();
      }
      if (idx > 0 && PREPOSICOES_MINUSCULAS.has(palavra)) {
        return palavra;
      }
      return palavra.charAt(0).toUpperCase() + palavra.slice(1);
    })
    .join(" ");
}

function obterDocumentoCliente(cli) {
  return String(
    cli?.cnpj_cpf ?? cli?.cnpj ?? cli?.cpf_cnpj ?? cli?.documento ?? "",
  ).trim();
}

function obterUfCliente(cli) {
  return cli?.estado ?? cli?.uf ?? "";
}

export function initModalCliente(
  endpointListar,
  onClienteSelecionado,
  modoTexto = "TITLE",
) {
  let clientes = [];

  const abrir = () => {
    const el = document.getElementById("modal-selecionar-cliente");
    if (el) el.style.display = "flex";
  };

  const fechar = () => {
    const el = document.getElementById("modal-selecionar-cliente");
    if (el) el.style.display = "none";
  };

  function render() {
    const tbody = document.getElementById("lista-modal-clientes");
    if (!tbody) return;
    const q = (document.getElementById("busca-modal-cliente")?.value || "")
      .toLowerCase()
      .trim();
    const lista = clientes.filter(
      (c) =>
        !q ||
        [c.razao_social, c.nome_fantasia, obterDocumentoCliente(c), c.cidade]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q),
    );

    if (!lista.length) {
      tbody.innerHTML =
        '<tr><td colspan="4" style="padding:14px;text-align:center;color:#64748b">Nenhum cliente encontrado.</td></tr>';
      return;
    }

    tbody.innerHTML = lista
      .map(
        (c) => `
      <tr style="border-bottom:1px solid #f1f5f9">
        <td style="padding:8px 10px">
          <strong>${padronizarTexto(c.nome_fantasia || c.razao_social, modoTexto)}</strong>
          ${c.nome_fantasia ? `<br><small style="color:#64748b">${padronizarTexto(c.razao_social, modoTexto)}</small>` : ""}
        </td>
        <td style="padding:8px 10px">${obterDocumentoCliente(c) || "—"}</td>
        <td style="padding:8px 10px">${padronizarTexto([c.cidade, obterUfCliente(c)].filter(Boolean).join(" / "), modoTexto) || "—"}</td>
        <td style="padding:8px 10px">
          <button type="button" class="btn-primary btn-pick-c" data-id="${c.id}" style="padding:5px 10px;font-size:0.85em">Selecionar</button>
        </td>
      </tr>`,
      )
      .join("");

    tbody.querySelectorAll(".btn-pick-c").forEach((b) =>
      b.addEventListener("click", () => {
        const cli = clientes.find((x) => String(x.id) === String(b.dataset.id));
        if (!cli) return;

        const nomeExibicao = cli.razao_social || cli.nome_fantasia || "";
        const enderecoFormatado = [cli.logradouro, cli.numero, cli.bairro]
          .filter(Boolean)
          .join(", ");
        const cidadeUfFormatada = [cli.cidade, obterUfCliente(cli)]
          .filter(Boolean)
          .join(" / ");

        document.getElementById("os-cliente-id").value = cli.id;
        document.getElementById("os-razao-social").value = padronizarTexto(
          nomeExibicao,
          modoTexto,
        );
        document.getElementById("os-cnpj").value = obterDocumentoCliente(cli);

        const telInput = document.getElementById("os-cliente-telefone");
        if (telInput && cli.telefone) {
          telInput.value = cli.telefone;
        }

        document.getElementById("os-endereco").value = padronizarTexto(
          enderecoFormatado,
          modoTexto,
        );
        document.getElementById("os-cidade").value = padronizarTexto(
          cidadeUfFormatada,
          modoTexto,
        );

        const btnCont = document.getElementById("btn-ver-contatos");
        if (btnCont) {
          btnCont.disabled = false;
          btnCont.style.opacity = "1";
          btnCont.style.cursor = "pointer";
        }

        onClienteSelecionado?.(cli);
        fechar();
      }),
    );
  }

  document
    .querySelector('[data-close-modal="modal-selecionar-cliente"]')
    ?.addEventListener("click", fechar);
  document
    .getElementById("busca-modal-cliente")
    ?.addEventListener("input", render);

  document
    .getElementById("btn-abrir-modal-cliente")
    ?.addEventListener("click", async () => {
      abrir();
      if (!clientes.length) {
        const r = await fetch(endpointListar).catch(() => null);
        const d = r?.ok ? await r.json() : [];
        clientes = Array.isArray(d) ? d : d?.data || [];
      }
      render();
    });
}
