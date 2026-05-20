# Arquitetura

## Visao geral

A plataforma e multi-tenant. Cada escritorio contabil e um tenant com identidade, numero de WhatsApp, configuracoes, clientes, logs e alertas proprios.

Fluxo principal:

```text
MEI
  -> WhatsApp white label do escritorio
  -> Evolution API
  -> Webhook backend
  -> Tenant resolver
  -> Agent runtime
  -> Tools
  -> Banco / Redis / Jobs
  -> Resposta humanizada
  -> WhatsApp
```

## Componentes

### WhatsApp

Canal principal do MEI.

Responsabilidades:

- receber mensagens;
- enviar respostas;
- mostrar digitando quando possivel;
- operar por instancia dedicada por tenant;
- preservar identidade do escritorio.

## Regra de MVP para WhatsApp white label

No MVP, cada contador piloto pode ter um numero dedicado quando isso for importante para validar valor, mas a operacao sera manual.

Fluxo:

1. dono da plataforma ativa o numero;
2. cria a conta WhatsApp ou WhatsApp Business;
3. cria instancia na Evolution API;
4. conecta via QR code ou pairing code;
5. vincula a instancia ao tenant;
6. monitora status de conexao;
7. reconecta manualmente se cair.

Fora do MVP:

- compra automatica de numeros;
- rotacao automatica;
- reconexao self-service;
- migracao para API oficial da Meta;
- alta disponibilidade por tenant.

### Evolution API

Camada de integracao com WhatsApp.

Responsabilidades:

- webhooks por instancia;
- envio de mensagens;
- status de conexao;
- separacao operacional por escritorio.

### Backend

Responsabilidades:

- receber webhook;
- resolver tenant;
- carregar usuario;
- chamar agente;
- executar tools;
- persistir logs;
- agendar jobs;
- enviar resposta.

### Agent runtime

Executa o loop agentico com:

- `maxSteps`;
- `maxRetries`;
- `timeout`;
- logs por step;
- tools com schema;
- notificacao ao responsavel quando houver risco.

### Banco

PostgreSQL/Supabase recomendado.

Regras:

- toda tabela operacional tem `tenant_id`;
- nenhuma query de produto sem filtro de tenant;
- RLS quando usar Supabase;
- service role apenas em backend confiavel.

### Redis / filas

Usado para:

- buffer de mensagens;
- idempotencia;
- jobs;
- cache de pesquisa de mercado;
- controle de retry;
- rate limit por tenant e usuario.

## Tabelas principais

### tenants

- id;
- name;
- brand_name;
- whatsapp_instance;
- whatsapp_number;
- plan;
- status;
- settings_json;
- created_at.

### users

- id;
- tenant_id;
- phone;
- name;
- profile_type;
- activity;
- city;
- onboarding_status;
- checkin_time;
- created_at;
- updated_at.

### onboarding_answers

- id;
- tenant_id;
- user_id;
- step;
- value_json;
- created_at.

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

### alerts

- id;
- tenant_id;
- user_id;
- type;
- severity;
- status;
- scheduled_at;
- payload_json;
- created_at.

### agent_runs

- id;
- tenant_id;
- user_id;
- message_id;
- status;
- steps_used;
- started_at;
- finished_at;
- error_message.

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

## Jobs automaticos

Jobs iniciais:

- check-in diario;
- lembrete de DAS;
- lembrete de DASN-SIMEI;
- resumo semanal;
- usuario sem lancamento ha 3 dias;
- cliente perto do limite anual;
- digest de risco para contador.

Regras:

- todo job gera log;
- todo job deve ser idempotente;
- todo job tem retry limitado;
- job fiscal critico cria alerta para contador quando houver risco.

## Envio humanizado

O agente decide o conteudo. A camada de entrega decide como enviar.

Pipeline:

1. receber resposta final;
2. quebrar em blocos naturais;
3. aplicar delay por tamanho;
4. enviar status digitando quando suportado;
5. enviar mensagem;
6. registrar entrega.

Regras:

- evitar texto longo em uma unica mensagem;
- nao quebrar numeros ou listas importantes;
- nao simular demora exagerada;
- nao esconder que e assistente quando perguntado.

## Ambientes

Obrigatorio separar:

- dev;
- staging;
- producao.

Cada ambiente deve ter:

- banco separado;
- chaves separadas;
- instancias WhatsApp separadas;
- logs separados;
- webhook separado.
