# Tools

## Principio

Tools sao as maos do agente. O agente pensa e decide, mas toda acao real passa por tool com schema definido, log e limite de retry.

Toda tool precisa ter:

- nome;
- objetivo;
- schema de entrada;
- schema de saida;
- permissoes;
- erros esperados;
- politica de retry;
- se exige confirmacao humana ou nao.

## Tools essenciais do MVP

### get_segment_pain

Retorna uma dor curta do segmento para a Julia mostrar proximidade antes de pedir dados.

Entrada:

```json
{ "activity": "aluguel de kit festa" }
```

Saida:

```json
{
  "activity": "aluguel de kit festa",
  "pain": "Nesse tipo de rotina, uma dor comum e controlar reserva, entrega, pagamento final e reposicao de itens sem misturar tudo."
}
```

Exige confirmacao humana: nao.

### get_diagnostic_question

Retorna a primeira pergunta contextual do segmento.

Entrada:

```json
{ "activity": "manicure" }
```

Saida:

```json
{
  "question": "Hoje voce costuma separar o dinheiro dos atendimentos das suas contas pessoais ou fica tudo junto?"
}
```

Exige confirmacao humana: nao.

### get_tenant

Busca o tenant pela instancia do WhatsApp.

Entrada:

```json
{ "instance": "contabilidade_silva" }
```

Saida:

```json
{
  "tenantId": "ten_123",
  "brandName": "Contabilidade Silva",
  "status": "active",
  "timezone": "America/Sao_Paulo"
}
```

### get_user

Busca MEI por telefone dentro do tenant.

Entrada:

```json
{ "tenantId": "ten_123", "phone": "5511999999999" }
```

Saida:

```json
{
  "exists": true,
  "userId": "usr_123",
  "onboardingStatus": "in_progress",
  "activity": "aluguel de kit festa"
}
```

### create_user

Cria novo contato.

Exige confirmacao humana: nao.

### update_user

Atualiza perfil do usuario.

Exige confirmacao humana: depende. Dados simples nao. Dados sensiveis ou contraditorios sim.

### get_onboarding_state

Retorna etapa atual, campos faltantes e proxima pergunta.

### save_onboarding_answer

Salva resposta de onboarding.

Regras:

- nao sobrescrever resposta contraditoria sem confirmacao;
- manter valor bruto e valor normalizado.

### classify_message

Classifica intencao e extrai entidades.

Intencoes iniciais:

- `onboarding_answer`;
- `income_entry`;
- `expense_entry`;
- `tax_question`;
- `pricing_question`;
- `market_question`;
- `change_profile`;
- `human_help`;
- `unknown`.

### save_entry

Registra entrada ou despesa.

Entrada:

```json
{
  "type": "income",
  "amount": 150,
  "description": "3 atendimentos",
  "occurredAt": "2026-05-19"
}
```

Exige confirmacao humana:

- nao, se valor e tipo estiverem claros;
- sim, se ambiguo.

### get_entries

Busca lancamentos por periodo.

### get_financial_summary

Calcula resumo financeiro.

Saida:

```json
{
  "revenue": 3200,
  "expenses": 900,
  "estimatedProfit": 2300,
  "goalProgress": 0.64
}
```

### get_diagnostic

Interpreta resumo em verde, amarelo ou vermelho.

Saida:

```json
{
  "status": "yellow",
  "reason": "Faturamento abaixo da meta semanal",
  "suggestedAction": "Revisar volume de atendimentos"
}
```

### calculate_price

Calcula preco minimo.

Entrada:

```json
{
  "monthlyGoal": 5000,
  "fixedCosts": 800,
  "workDays": 20,
  "productiveHours": 90,
  "serviceDurationHours": 1.5
}
```

### research_market

Pesquisa atividade, cidade, CNAE provavel, faixa de preco, dores e riscos.

Usar quando:

- usuario informa atividade no onboarding;
- existe duvida se pode ser MEI;
- usuario pede benchmark;
- agente precisa entender sazonalidade ou risco do setor.

Saida:

```json
{
  "activity": "aluguel de kit festa",
  "city": "Taubate",
  "canBeMei": "yes",
  "likelyCnae": "7729-2/99",
  "priceRange": "R$150 a R$700",
  "risks": ["sazonalidade", "manutencao dos kits"],
  "sources": []
}
```

Regras:

- cache por 7 dias;
- fontes devem ser salvas quando existirem;
- se informacao for incerta, responder como incerta.

### get_tax_calendar

Retorna obrigacoes e vencimentos aplicaveis.

MVP:

- DAS;
- DASN-SIMEI;
- limite anual do MEI.

### mark_tax_as_paid

Marca imposto como pago.

Exige confirmacao humana: sim, pelo usuario.

### schedule_reminder

Agenda lembrete.

Tipos:

- check-in diario;
- DAS;
- DASN-SIMEI;
- resumo semanal;
- retorno pendente;
- sem lancamento ha 3 dias.

### create_accountant_alert

Cria alerta para o contador.

Severidades:

- `low`;
- `medium`;
- `high`;
- `critical`.

### notify_accountant

Cria uma notificacao acionavel para o responsavel do escritorio.

Importante: esta tool nao transfere a conversa. O contador nao assume o WhatsApp do agente. O agente continua atendendo o MEI dentro dos limites permitidos.

Usar quando:

- atividade pode nao ser MEI;
- questao fiscal sensivel;
- risco de desenquadramento;
- usuario pede humano;
- IA tem baixa confianca;
- problema repetiu apos retry.

Entrada:

```json
{
  "tenantId": "ten_123",
  "userId": "usr_123",
  "severity": "high",
  "reason": "Atividade possivelmente nao permitida para MEI",
  "summary": "Usuario informou que e dentista e quer abrir MEI.",
  "suggestedAction": "Conferir enquadramento e orientar abertura correta."
}
```

Saida:

```json
{
  "notificationId": "ntf_123",
  "responsibleName": "Ana",
  "status": "created"
}
```

Resposta esperada do agente ao MEI:

```text
Esse ponto precisa de conferencia do escritorio. Ja avisei Ana por aqui. Enquanto isso, posso continuar te ajudando com lancamentos, metas e organizacao do mes.
```

## Tools de entrega WhatsApp

Essas ficam fora da decisao livre do agente. Sao camada de delivery.

### split_message

Divide resposta em blocos naturais.

Regras:

- evitar bloco acima de 600 caracteres;
- nao quebrar numero, lista ou raciocinio;
- preservar ordem.

### simulate_typing

Calcula delay realista.

Regra inicial:

```ts
delayMs = Math.min(4000, 600 + characters * 25)
```

### send_whatsapp_message

Envia mensagem.

Regras:

- logar status;
- retry limitado;
- idempotencia por message id;
- nao duplicar envio.

## Retry

Padrao:

```ts
{
  "maxRetries": 2,
  "retryDelayMs": 500,
  "backoff": "linear"
}
```

Nao retentar automaticamente:

- operacoes que podem duplicar pagamento;
- apagamento;
- mudanca sensivel;
- envio externo critico sem idempotencia.
