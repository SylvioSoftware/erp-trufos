# Trufos ERP

Sistema de gestão e automação para assistência técnica hospitalar, estruturado em arquitetura modular e preparado para multi-tenancy (SaaS).

---

## 🚀 Estratégia de Planos (SaaS)

- **FREE (MVP Atual):** Cadastros base (Clientes, Equipamentos, Produtos/Serviços) e emissão de Ordens de Serviço simples com snapshot de dados.
- **PAGO BÁSICO:** Recursos operacionais ampliados, relatórios completos e personalização visual básica (whitelabel leve com cores e logotipo).
- **PAGO COM IMAGENS:** Liberação de upload de fotos em equipamentos, relatórios fotográficos de manutenção e laudos técnicos ilustrados.
- **PAGO IA:** Automação completa via Evolution API + n8n (atendimento WhatsApp, follow-up automático de orçamentos em 48h, geração assistida de laudos e login OTP via WhatsApp).

---

## ✅ O que já está pronto

- **Arquitetura Base & Layout:**
  - Estrutura visual responsiva (Desktop e Mobile com menu hambúrguer otimizado).
  - Variáveis CSS e paleta de cores padrão Trufos.
- **Módulos Principais (MVP):**
  - Tela de Painel Principal (`index.html`) com resumo operacional.
  - Módulo de Clientes e listagem de Equipamentos por cliente (Parque Instalado).
  - Estrutura de autenticação inicial (`auth.js`).
- **Banco de Dados (PostgreSQL):**
  - Modelagem preparada para multi-tenancy (`empresa_id`).
  - Tabelas de clientes, equipamentos e estrutura para planos e identidade visual.

---

## 🎯 O que temos pela frente (Próximos Passos)

1. **Catálogo de Produtos e Serviços:**
   - Finalizar a tela `produtos-servicos.html` e conectar com o banco para cadastrar peças, insumos e serviços técnicos.
2. **Menu de Configurações:**
   - Criar submenus para tabelas auxiliares (fabricantes, modelos, tipos de equipamentos e condições de pagamento).
   - Configurações de identidade visual da empresa (logotipo, favicon e cor primária).
3. **Módulo de Ordens de Serviço (OS):**
   - Implementar o fluxo completo de lançamento de OS com o mecanismo de _snapshot_ de dados (congelando o histórico) e integração de peças/serviços.
4. **Automações e IA (Fase Avançada):**
   - Ativar o follow-up automático via Evolution API + n8n e gatilhos de planos.

---

## 🛠️ Stack Tecnológica

- **Frontend:** HTML5, CSS3 Responsivo, JavaScript (Modular)
- **Backend & Automação:** n8n, Evolution API, PostgreSQL (com suporte a multi-empresa e snapshots de OS)
- **Hospedagem:** VPS com Docker, Easypanel e Nginx/Cloudflare
