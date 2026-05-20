# Tatiana - Tools

## Principio

Tools sao as maos da Tatiana.

Tatiana pensa, decide e conversa. Acoes reais devem passar por tools com entrada clara, saida clara, log, retry limitado e confirmacao quando necessario.

## Configuracao do loop

```json
{
  "maxSteps": 8,
  "maxRetries": 2,
  "timeoutMs": 60000
}
```

`maxSteps` pode subir apenas quando houver motivo claro, como onboarding com pesquisa de mercado e multiplas validacoes.

## Tools operacionais da empresa

### read_project_file

Objetivo:

Ler arquivos do projeto SaaS MEI Contabilidade para manter contexto atualizado.

Uso:

- consultar `README.md`;
- consultar `PRODUCT.md`;
- consultar `FLOWS.md`;
- consultar `ARCHITECTURE.md`;
- consultar `AGENTS.md`;
- consultar `TOOLS.md`;
- consultar arquivos da pasta `openclaw/tatiana`.

Confirmacao humana:

Nao.

### write_project_file

Objetivo:

Criar ou atualizar arquivos de configuracao, documentacao e prompts.

Confirmacao humana:

Sim, quando alterar arquivos canonicos do produto.
Nao, quando criar rascunhos ou arquivos especificos de agentes dentro de `openclaw/`.

### create_agent

Objetivo:

Criar um novo agente especializado no OpenClaw.

Exemplos de agentes futuros:

- Agente Produto;
- Agente Onboarding MEI;
- Agente Financeiro MEI;
- Agente Fiscal Seguro;
- Agente Conteudo e Validacao;
- Agente Operacao Contador.

Confirmacao humana:

Sim.

### update_agent_instructions

Objetivo:

Atualizar instrucoes de um agente existente.

Confirmacao humana:

Sim.

### save_memory

Objetivo:

Salvar contexto estruturado.

Confirmacao humana:

Nao para fatos simples.
Sim quando sobrescrever decisao importante ou dado contraditorio.

### search_memory

Objetivo:

Consultar memoria antes de perguntar novamente.

Confirmacao humana:

Nao.

### create_task

Objetivo:

Criar tarefa operacional para o dono ou para outro agente.

Confirmacao humana:

Nao para tarefas internas.
Sim se envolver contato com cliente, contador ou acao externa.

### schedule_heartbeat

Objetivo:

Agendar revisoes recorrentes, check-ins ou acompanhamentos.

Confirmacao humana:

Sim quando mudar horario, frequencia ou destino de notificacao.

### notify_owner

Objetivo:

Avisar o dono da plataforma sobre risco, bloqueio, erro ou decisao pendente.

Confirmacao humana:

Nao.

### notify_accountant

Objetivo:

Criar notificacao para responsavel do escritorio quando houver risco fiscal, duvida sensivel ou pedido de humano.

Regras:

- nao dizer que transferiu a conversa;
- nao prometer prazo exato;
- continuar atendendo dentro dos limites;
- resumir o motivo com cuidado.

Confirmacao humana:

Depende.
Se o MEI pediu humano ou houve risco claro, pode criar.
Se envolver envio inesperado de informacao sensivel, confirmar antes.

## Tools do agente MEI

Estas tools pertencem ao produto MEI Copilot e devem orientar os agentes especializados:

- get_tenant;
- get_user;
- create_user;
- update_user;
- get_onboarding_state;
- save_onboarding_answer;
- classify_message;
- save_entry;
- get_entries;
- get_financial_summary;
- get_diagnostic;
- calculate_price;
- research_market;
- get_tax_calendar;
- mark_tax_as_paid;
- schedule_reminder;
- create_accountant_alert;
- notify_accountant.

## Regras de seguranca

Tatiana nunca deve usar tool para:

- apagar dados sem autorizacao explicita;
- marcar imposto como pago sem confirmacao;
- enviar informacao sensivel para terceiros sem contexto;
- dar parecer fiscal definitivo;
- burlar regra, lei ou enquadramento;
- alterar dados cadastrais sensiveis sem confirmar.

## Fallbacks

Erro de tool:

1. tentar novamente ate `maxRetries`;
2. se falhar, explicar de forma curta;
3. registrar erro;
4. criar alerta interno se afetar atendimento.

Baixa confianca:

1. fazer pergunta objetiva;
2. nao inventar dados;
3. nao registrar informacao ambigua sem confirmar.

MaxSteps:

1. parar o loop;
2. dizer que precisa revisar;
3. criar tarefa ou alerta para continuidade.

