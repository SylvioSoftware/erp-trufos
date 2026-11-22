import { padronizarTexto } from "./modal-cliente.js";

function aplicarMascaraTelefone(input) {
  let v = input.value.replace(/\D/g, "");
  if (v.length > 11) v = v.substring(0, 11);

  if (v.length > 6) {
    v = `(${v.substring(0, 2)}) ${v.substring(2, 7)}-${v.substring(7)}`;
  } else if (v.length > 2) {
    v = `(${v.substring(0, 2)}) ${v.substring(2)}`;
  } else if (v.length > 0) {
    v = `(${v}`;
  }
  input.value = v;
}

export function initModalContatos(endpointsOrUrl) {
  const config =
    typeof endpointsOrUrl === "string"
      ? {
          listar: endpointsOrUrl,
          salvar: endpointsOrUrl.replace("contatos-listar", "contato-salvar"),
          excluir: endpointsOrUrl.replace("contatos-listar", "contato-excluir"),
        }
      : endpointsOrUrl || {};

  let contatos = [];
  let clienteAtualId = null;

  const modalEl = () => document.getElementById("modal-contatos-cliente");

  const abrir = () => {
    const el = modalEl();
    if (el) el.style.display = "flex";
  };

  const fechar = () => {
    const el = modalEl();
    if (el) el.style.display = "none";
  };

  function limparFormularioContato() {
    document.getElementById("contato-os-id").value = "";
    document.getElementById("contato-os-nome").value = "";
    document.getElementById("contato-os-departamento").value = "";
    document.getElementById("contato-os-telefone").value = "";
    document.getElementById("contato-os-email").value = "";
    document.getElementById("btn-cancelar-edicao-contato").style.display =
      "none";
    const btnSalvar = document.getElementById("btn-salvar-contato-os");
    if (btnSalvar) btnSalvar.textContent = "+ Adicionar";
  }

  function preencherFormularioContato(c) {
    document.getElementById("contato-os-id").value = c.id ?? "";
    document.getElementById("contato-os-nome").value = padronizarTexto(
      c.nome || c.contato || "",
      "TITLE",
    );
    document.getElementById("contato-os-departamento").value = padronizarTexto(
      c.departamento || c.setor || c.cargo || "",
      "TITLE",
    );
    document.getElementById("contato-os-telefone").value =
      c.telefone || c.fone || c.celular || c.whatsapp || "";
    document.getElementById("contato-os-email").value = c.email || "";
    document.getElementById("btn-cancelar-edicao-contato").style.display =
      "inline-flex";
    const btnSalvar = document.getElementById("btn-salvar-contato-os");
    if (btnSalvar) btnSalvar.textContent = "💾 Atualizar";
  }

  function render() {
    const tbody = document.getElementById("lista-modal-contatos");
    if (!tbody) return;

    const razao = document.getElementById("os-razao-social")?.value || "";
    const sub = document.getElementById("modal-contatos-subtitulo");
    if (sub) {
      sub.textContent = razao ? `Cliente: ${razao}` : "";
    }

    if (!contatos.length) {
      tbody.innerHTML =
        '<tr><td colspan="5" style="text-align: center; padding: 15px; color: #64748b;">Nenhum contato cadastrado para este cliente.</td></tr>';
      return;
    }

    tbody.innerHTML = contatos
      .map((c, idx) => {
        const nome = padronizarTexto(
          c.nome || c.contato || c.responsavel || "",
          "TITLE",
        );
        const setor = padronizarTexto(
          c.departamento || c.setor || c.cargo || "",
          "TITLE",
        );
        const tel = c.telefone || c.fone || c.celular || c.whatsapp || "";
        const email = c.email || "";

        return `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px;"><strong>${nome || "-"}</strong></td>
            <td style="padding: 10px;">${setor || "-"}</td>
            <td style="padding: 10px;">${tel || "-"}</td>
            <td style="padding: 10px;">${email || "-"}</td>
            <td style="padding: 10px; text-align: center; white-space: nowrap;">
              ${
                tel
                  ? `<button type="button" class="btn-primary btn-usar-contato" data-idx="${idx}" title="Usar telefone na OS" style="padding: 4px 8px; font-size: 0.78em; margin-right: 6px;">Usar</button>`
                  : ""
              }
              <button type="button" class="btn-editar-contato" data-idx="${idx}" title="Editar" style="background: none; border: none; cursor: pointer; font-size: 16px; margin-right: 5px;">✏️</button>
              <button type="button" class="btn-excluir-contato" data-idx="${idx}" title="Remover" style="background: none; border: none; cursor: pointer; font-size: 16px;">🗑️</button>
            </td>
          </tr>
        `;
      })
      .join("");

    tbody.querySelectorAll(".btn-usar-contato").forEach((btn) => {
      btn.addEventListener("click", () => {
        const c = contatos[Number(btn.dataset.idx)];
        const tel = c?.telefone || c?.fone || c?.celular || c?.whatsapp || "";
        const telInput = document.getElementById("os-cliente-telefone");
        if (telInput && tel) {
          telInput.value = tel;
        }
        fechar();
      });
    });

    tbody.querySelectorAll(".btn-editar-contato").forEach((btn) => {
      btn.addEventListener("click", () => {
        const c = contatos[Number(btn.dataset.idx)];
        if (c) preencherFormularioContato(c);
      });
    });

    tbody.querySelectorAll(".btn-excluir-contato").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const c = contatos[Number(btn.dataset.idx)];
        if (!c) return;
        if (!confirm("Remover este contato?")) return;

        if (config.excluir && c.id) {
          try {
            const urlExcluir = config.excluir.includes("?")
              ? `${config.excluir}&id=${encodeURIComponent(c.id)}`
              : `${config.excluir}?id=${encodeURIComponent(c.id)}`;
            const resp = await fetch(urlExcluir, {
              method: "DELETE",
            });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            await carregarContatos();
            return;
          } catch (err) {
            console.error("Erro ao excluir contato:", err);
            alert("Erro ao remover contato.");
            return;
          }
        }

        contatos.splice(Number(btn.dataset.idx), 1);
        render();
      });
    });
  }

  async function carregarContatos() {
    if (!clienteAtualId || !config.listar) return;
    const tbody = document.getElementById("lista-modal-contatos");
    if (tbody) {
      tbody.innerHTML =
        '<tr><td colspan="5" style="text-align: center; padding: 15px;">Buscando contatos...</td></tr>';
    }

    try {
      const r = await fetch(
        `${config.listar}?cliente_id=${encodeURIComponent(clienteAtualId)}`,
      );
      const d = r?.ok ? await r.json() : [];
      const lista = Array.isArray(d) ? d : d?.data || [];
      contatos = lista.length > 0 && lista[0].id ? lista : [];
      render();
    } catch (error) {
      console.error("Erro ao carregar contatos:", error);
      if (tbody) {
        tbody.innerHTML =
          '<tr><td colspan="5" style="text-align: center; padding: 15px; color: #dc2626;">Erro ao carregar lista.</td></tr>';
      }
    }
  }

  document
    .getElementById("contato-os-telefone")
    ?.addEventListener("input", (e) => aplicarMascaraTelefone(e.target));

  document
    .querySelector('[data-close-modal="modal-contatos-cliente"]')
    ?.addEventListener("click", fechar);

  modalEl()?.addEventListener("click", (e) => {
    if (e.target.id === "modal-contatos-cliente") fechar();
  });

  document
    .getElementById("btn-cancelar-edicao-contato")
    ?.addEventListener("click", limparFormularioContato);

  document
    .getElementById("form-contato-os")
    ?.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!clienteAtualId) {
        alert("Selecione um cliente antes de salvar o contato.");
        return;
      }

      const contatoId = document.getElementById("contato-os-id").value;
      const nome = padronizarTexto(
        document.getElementById("contato-os-nome").value,
        "TITLE",
      );

      if (!nome) {
        alert("Informe o nome do contato.");
        return;
      }

      const payload = {
        id: contatoId ? parseInt(contatoId, 10) : undefined,
        cliente_id: parseInt(clienteAtualId, 10),
        nome,
        departamento: padronizarTexto(
          document.getElementById("contato-os-departamento").value,
          "TITLE",
        ),
        telefone: document.getElementById("contato-os-telefone").value.trim(),
        email: document.getElementById("contato-os-email").value.trim(),
      };

      if (config.salvar) {
        try {
          const resp = await fetch(config.salvar, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          limparFormularioContato();
          await carregarContatos();
          return;
        } catch (err) {
          console.error("Erro ao salvar contato:", err);
          alert("Erro ao salvar contato.");
          return;
        }
      }

      const idxExistente = contatos.findIndex(
        (x) => payload.id && String(x.id) === String(payload.id),
      );
      if (idxExistente >= 0) {
        contatos[idxExistente] = { ...contatos[idxExistente], ...payload };
      } else {
        contatos.push({ ...payload, id: payload.id || Date.now() });
      }
      limparFormularioContato();
      render();
    });

  document
    .getElementById("btn-ver-contatos")
    ?.addEventListener("click", async () => {
      const cid = document.getElementById("os-cliente-id")?.value;
      if (!cid) return;
      clienteAtualId = cid;
      limparFormularioContato();
      abrir();
      await carregarContatos();
    });
}
