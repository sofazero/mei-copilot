# Arquitetura multi-tenant e IA agentica

## Principio central

Cada escritorio contabil e um tenant. Cada tenant tem identidade propria, numero de WhatsApp proprio, configuracoes proprias e clientes isolados.

Por baixo, todos usam a mesma plataforma.

## Fluxo geral

1. MEI envia mensagem para o WhatsApp do escritorio.
2. Evolution API envia webhook para o backend.
3. Backend identifica o tenant pela instancia do WhatsApp.
4. Agente carrega contexto do usuario e do tenant.
5. Agente executa ferramentas em loop com limite `maxSteps`.
6. Backend salva eventos, entradas e diagnosticos.
7. Resposta volta pelo WhatsApp do escritorio.

## Modelo agentico com maxSteps

O agente nao deve ser apenas um prompt que responde. Ele deve raciocinar e usar ferramentas.

Exemplo:

```text
Cliente fala
  -> IA pensa: preciso buscar o contato
  -> usa ferramenta getUser
  -> IA pensa: ele e lead novo
  -> usa ferramenta createUser
  -> IA pensa: preciso ver onboarding
  -> usa ferramenta getOnboardingState
  -> IA pensa: preciso pesquisar atividade
  -> usa ferramenta researchMarket
  -> IA pensa: pronto, respondo agora
  -> responde ao cliente
```

O `maxSteps` evita loops infinitos. Valor inicial recomendado: 12.

## Ferramentas iniciais

- `get_user`: busca usuario por telefone e tenant.
- `create_user`: cria lead ou cliente.
- `update_user`: atualiza dados cadastrais.
- `get_onboarding_state`: busca etapa atual.
- `save_onboarding_step`: salva resposta do onboarding.
- `save_entry`: registra entrada ou despesa.
- `get_entries`: busca lancamentos por periodo.
- `get_diagnostic`: calcula saude financeira.
- `calculate_price`: calcula preco minimo e meta.
- `get_tax_status`: consulta obrigacoes e vencimentos.
- `mark_das_paid`: registra DAS como pago.
- `schedule_alert`: agenda lembrete.
- `research_market`: pesquisa mercado, CNAE, faixa de preco, riscos e sazonalidade.
- `handoff_to_accountant`: sinaliza que contador humano precisa atuar.

## Pesquisa de internet

A ferramenta `research_market` deve ser usada com cuidado:

- no onboarding;
- quando o usuario informa atividade nova;
- quando ha duvida de enquadramento MEI;
- quando o usuario pede benchmark de preco;
- quando ha risco regulatorio, como profissao com conselho.

Resultado esperado em formato estruturado:

- atividade;
- cidade;
- pode ser MEI: sim, nao ou incerto;
- CNAE provavel;
- faixa de preco;
- principais dores do setor;
- sazonalidade;
- riscos fiscais ou operacionais;
- fontes resumidas;
- recomendacao para o proximo passo.

Cache recomendado: 7 dias por `tenant_id + atividade + cidade`.

## Tabelas principais

### tenants

- id;
- name;
- legal_name;
- whatsapp_instance;
- whatsapp_number;
- brand_name;
- brand_photo_url;
- plan;
- status;
- created_at.

### users

- id;
- tenant_id;
- phone;
- name;
- profile_type: `active_business` ou `starting_business`;
- activity;
- city;
- onboarding_status;
- checkin_time;
- created_at.

### entries

- id;
- tenant_id;
- user_id;
- type: `income` ou `expense`;
- amount;
- description;
- category;
- occurred_at;
- raw_message;
- created_at.

### onboarding_answers

- id;
- tenant_id;
- user_id;
- step;
- value_json;
- created_at.

### alerts

- id;
- tenant_id;
- user_id;
- type;
- scheduled_at;
- status;
- payload_json;
- created_at.

### agent_events

- id;
- tenant_id;
- user_id;
- message_id;
- role;
- content;
- tool_name;
- tool_payload_json;
- created_at.

## Isolamento

Todas as tabelas operacionais devem ter `tenant_id`.

Regras:

- nenhuma query operacional sem `tenant_id`;
- painel do contador so acessa o proprio tenant;
- painel admin global usa credencial separada;
- logs precisam mascarar telefone e dados sensiveis quando possivel.

## Jobs recorrentes

- `daily_checkin`: pergunta se houve atendimento ou gasto.
- `das_reminder`: lembra DAS antes do dia 20.
- `dasn_reminder`: lembra declaracao anual.
- `weekly_diagnostic`: envia resumo semanal.
- `inactive_user_alert`: detecta usuario sem lancamento.
- `mei_limit_watch`: acompanha limite anual.
- `accountant_risk_digest`: resume clientes amarelos e vermelhos para o contador.

