# Arquitetura

## Visao geral

A Julia sera um runtime agentico proprio do MEI Copilot.

Ela roda no backend do produto, nao dentro do OpenClaw.

Stack inicial:

- TypeScript/Node;
- Railway para deploy;
- Supabase/PostgreSQL para memoria, logs e dados operacionais;
- Evolution API para WhatsApp no MVP;
- job scheduler para check-ins e lembretes;
- LLM com tools controladas.

## Fluxo principal

```text
MEI
  -> WhatsApp
  -> Evolution API
  -> Webhook Railway
  -> Idempotencia
  -> Buffer curto de mensagens
  -> Tenant/user resolver
  -> Conversation state
  -> Julia agent runtime
  -> Tools
  -> Supabase
  -> Resposta final
  -> Split em blocos
  -> Typing delay
  -> Evolution API
  -> WhatsApp
```

## Componentes

### Webhook

Recebe eventos da Evolution API.

Responsabilidades:

- ignorar mensagens enviadas pelo proprio numero;
- normalizar telefone;
- extrair texto;
- resolver instancia/tenant;
- aplicar idempotencia por `message_id`;
- enviar texto para o buffer.

### Buffer de mensagens

Camada obrigatoria para WhatsApp.

Responsabilidades:

- aguardar poucos segundos antes de responder;
- juntar mensagens seguidas do mesmo usuario;
- evitar resposta para cada fragmento;
- reduzir sensacao de robo.

### Conversation state

Guarda a fase atual da conversa.

Estados iniciais:

- `new`;
- `permission_sent`;
- `permission_accepted`;
- `segment_pain_sent`;
- `diagnostic_question_sent`;
- `onboarding`;
- `daily_checkin`;
- `entry_capture`;
- `human_review_needed`;
- `opt_out`.

### Julia agent runtime

Executa o loop agentico:

```ts
{
  maxSteps: 8,
  maxRetries: 2,
  timeoutMs: 60000
}
```

Modelo mental:

```text
think -> choose tool -> execute -> observe -> decide next action
```

O runtime deve ser separado da camada de entrega. Ele decide conteudo e acoes; a entrega decide split, delay e envio.

### Auditoria e logs

Logs sao parte central do produto.

O sistema deve registrar:

- webhook recebido;
- webhook ignorado e motivo;
- mensagem recebida;
- texto consolidado pelo buffer;
- inicio de agent run;
- estado de conversa;
- objetivo do step;
- tool chamada;
- input e output da tool;
- resposta final da Julia;
- plano de delivery;
- mensagens enviadas;
- tempo total do run.

No MVP local, os logs podem ficar em memoria.
Antes de producao, devem ir para Supabase em `agent_runs`, `agent_steps` e eventos de mensagem.

### Tools

Tools sao as acoes reais da Julia.

Exemplos:

- `get_user`;
- `create_user`;
- `update_user`;
- `get_memory`;
- `save_memory`;
- `save_entry`;
- `get_financial_summary`;
- `calculate_price`;
- `schedule_checkin`;
- `notify_accountant`;
- `research_market`.

Toda tool deve ter schema, log, retry limitado e politica de confirmacao.

### Delivery humanizado

Responsavel por transformar a resposta final em WhatsApp bom.

Regras:

- quebrar resposta em blocos naturais;
- evitar textos longos;
- aplicar delay por tamanho;
- enviar status digitando quando suportado;
- variar frases de check-in;
- nao simular demora exagerada.

### Supabase

Usado para:

- tenants;
- usuarios MEI;
- memoria estruturada;
- lancamentos;
- estados de conversa;
- agent runs;
- agent steps;
- alertas;
- jobs.

Toda tabela operacional deve ter `tenant_id`.

## Tabelas principais

### tenants

- id;
- brand_name;
- whatsapp_instance;
- whatsapp_number;
- status;
- settings_json;
- created_at.

### users

- id;
- tenant_id;
- phone;
- name;
- activity;
- city;
- onboarding_status;
- conversation_state;
- checkin_time;
- opt_out_at;
- created_at;
- updated_at.

### memory_items

- id;
- tenant_id;
- user_id;
- type;
- key;
- value_json;
- confidence;
- created_at;
- updated_at.

### entries

- id;
- tenant_id;
- user_id;
- type;
- amount;
- description;
- category;
- occurred_at;
- raw_message;
- created_at.

### agent_runs

- id;
- tenant_id;
- user_id;
- message_id;
- status;
- objective;
- steps_used;
- started_at;
- finished_at;
- error_message.

### audit_events

- id;
- tenant_id;
- user_id;
- message_id;
- run_id;
- type;
- payload_json;
- created_at.

### agent_steps

- id;
- run_id;
- step_number;
- action_type;
- tool_name;
- input_json;
- output_json;
- duration_ms;
- status;
- created_at.

### alerts

- id;
- tenant_id;
- user_id;
- type;
- severity;
- status;
- payload_json;
- created_at.

## MVP tecnico

Primeira entrega:

1. webhook Evolution recebendo mensagem;
2. buffer simples por usuario;
3. estado de conversa em memoria local ou Supabase;
4. Julia respondendo primeiro contato e check-in;
5. split + typing delay;
6. logs basicos;
7. typecheck e simulacoes.

Fora do primeiro ciclo:

- painel completo;
- cobranca;
- integracao bancaria;
- emissao de nota;
- API oficial da Meta;
- automacao fiscal critica.
