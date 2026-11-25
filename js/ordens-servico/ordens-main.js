import { createOSLista } from "./os-lista.js";
import { createOSFinanceiro } from "./os-financeiro.js";
import { createOSForm } from "./os-form.js";
import { createOSHistorico } from "./os-historico.js";
import { initModalCliente } from "./modais/modal-cliente.js";
import { initModalContatos } from "./modais/modal-contatos.js";
import { initModalEquipamento } from "./modais/modal-equipamento.js";
import { initModalServico } from "./modais/modal-servico.js";
import { initModalProduto } from "./modais/modal-produto.js";
import { initEquipamentoAutocomplete } from "./equipamento-autocomplete.js";

const API_BASE = "https://n8n.trufos.com.br/webhook";

const ENDPOINTS = {
  listarOS: `${API_BASE}/os-listar`,
  salvarOS: `${API_BASE}/os-salvar`,
  encerrarOS: `${API_BASE}/os-encerrar-pdf`,
  melhorarLaudoIA: `${API_BASE}/os-laudo-ia`,
  listarClientes: `${API_BASE}/clientes-listar`,
  listarContatosCliente: `${API_BASE}/contatos-listar`,
  listarParqueInstalado: `${API_BASE}/parque-instalado-listar`,
  salvarParqueInstalado: `${API_BASE}/parque-instalado-salvar`,
  salvarEquipamentoTipo: `${API_BASE}/equipamentos-tipos-salvar`,
  salvarEquipamentoMarca: `${API_BASE}/equipamentos-marcas-salvar`,
  salvarEquipamentoModelo: `${API_BASE}/equipamentos-modelos-salvar`,
  listarServicos: `${API_BASE}/servicos-listar`,
  listarProdutos: `${API_BASE}/produtos-listar`,
  listarHistorico: `${API_BASE}/historico-interacoes-listar`,
  salvarHistorico: `${API_BASE}/historico-interacoes-salvar`,
};

async function carregarModaisHTML() {
  const modais = [
    { slot: "slot-modal-cliente", arquivo: "ordem-servico/modal-cliente.html" },
    {
      slot: "slot-modal-contatos",
      arquivo: "ordem-servico/modal-contatos.html",
    },
    {
      slot: "slot-modal-equipamento",
      arquivo: "ordem-servico/modal-equipamento.html",
    },
    { slot: "slot-modal-servico", arquivo: "ordem-servico/modal-servico.html" },
    { slot: "slot-modal-produto", arquivo: "ordem-servico/modal-produto.html" },
  ];

  await Promise.all(
    modais.map(async ({ slot, arquivo }) => {
      const el = document.getElementById(slot);
      if (!el) return;
      const r = await fetch(arquivo);
      if (r.ok) el.innerHTML = await r.text();
    }),
  );
}

document.addEventListener("DOMContentLoaded", async () => {
  await carregarModaisHTML();

  initEquipamentoAutocomplete({
    endpointListar: ENDPOINTS.listarParqueInstalado,
    endpointSalvar: ENDPOINTS.salvarParqueInstalado,
    endpointTipos: `${API_BASE}/equipamentos-tipos-listar`,
    endpointMarcas: `${API_BASE}/equipamentos-marcas-listar`,
    endpointModelos: `${API_BASE}/equipamentos-modelos-listar`,
    endpointSalvarTipo: ENDPOINTS.salvarEquipamentoTipo,
    endpointSalvarMarca: ENDPOINTS.salvarEquipamentoMarca,
    endpointSalvarModelo: ENDPOINTS.salvarEquipamentoModelo,
  });

  const financeiro = createOSFinanceiro();
  const historico = createOSHistorico({
    endpoints: {
      listar: ENDPOINTS.listarHistorico,
      criar: ENDPOINTS.salvarHistorico,
    },
  });
  let formApi = null;

  const listaApi = createOSLista({
    onEditarOS: (os) => formApi?.preencher(os, false),
  });

  const voltarParaLista = () => {
    document.getElementById("os-view-lista").style.display = "block";
    document.getElementById("os-view-form").style.display = "none";
    document.getElementById("os-subtitulo-pagina").textContent =
      "Acompanhamento de atendimentos pendentes, em execução e concluídos";
  };

  const carregarOS = listaApi.init(ENDPOINTS.listarOS);

  formApi = createOSForm({
    endpoints: ENDPOINTS,
    financeiro,
    historico,
    isConcluido: listaApi.isConcluido,
    onVoltarLista: voltarParaLista,
    onSalvo: carregarOS,
  });

  document
    .getElementById("btn-voltar-lista-os")
    ?.addEventListener("click", voltarParaLista);

  financeiro.init();
  historico.init();
  formApi.init();

  initModalCliente(ENDPOINTS.listarClientes, (cli) => {
    historico.definirPrazoCliente(cli.prazo_validade_orcamento_dias);
  });
  initModalContatos(ENDPOINTS.listarContatosCliente);
  initModalEquipamento(ENDPOINTS.listarParqueInstalado, () =>
    formApi.ativarAba("aba-cliente"),
  );
  initModalServico(ENDPOINTS.listarServicos, financeiro.addServico);
  initModalProduto(ENDPOINTS.listarProdutos, financeiro.addProduto);

  carregarOS();
});
