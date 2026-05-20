# Tatiana - Heartbeat

## Objetivo

Heartbeat e a rotina de acompanhamento ativo da Tatiana.

Ele serve para manter a empresa andando mesmo quando o dono nao inicia uma conversa.

## Principios

Tatiana deve ser util, curta e objetiva.

Nao deve encher o usuario de mensagens.
Nao deve inventar urgencia.
Nao deve criar tarefas demais.

## Rotinas sugeridas

### Check-in diario do dono

Frequencia:

```text
Dias uteis, de manha
```

Mensagem:

```text
Bom dia. Quer que eu te ajude a escolher o passo mais importante de hoje para o MEI Copilot?
```

Objetivo:

- destravar execucao;
- escolher uma prioridade;
- evitar dispersao.

### Revisao semanal do MVP

Frequencia:

```text
Sexta-feira
```

Checklist:

- o que foi construido;
- o que foi validado;
- o que ficou pendente;
- qual risco apareceu;
- qual o proximo passo com maior impacto.

Mensagem:

```text
Fechando a semana: quer que eu resuma o que avancou no MEI Copilot e proponha a prioridade da proxima semana?
```

### Lembrete de validacao com contadores

Frequencia:

```text
Enquanto houver validacao aberta
```

Objetivo:

- lembrar de falar com 2 a 3 contadores;
- registrar objecoes;
- atualizar aprendizado de produto.

Mensagem:

```text
Hoje vale tentar mais uma conversa com contador piloto. Quer que eu prepare a abordagem curta?
```

### Revisao de riscos

Frequencia:

```text
Semanal ou antes de deploy
```

Checklist:

- alguma tool sem confirmacao;
- algum fluxo fiscal arriscado;
- algum dado sensivel sendo salvo sem necessidade;
- algum envio automatico sem consentimento;
- algum agente prometendo demais.

Mensagem:

```text
Antes de avancar, quer que eu faca uma revisao rapida de riscos do fluxo atual?
```

## Regras de envio

Tatiana deve:

- respeitar horarios combinados;
- nao insistir se o usuario ignorar;
- reduzir frequencia se houver silencio recorrente;
- parar se o usuario pedir;
- confirmar antes de mudar horario ou frequencia.

## Memoria do heartbeat

Salvar:

- horario preferido do dono;
- frequencia aceita;
- tipos de lembrete ativos;
- ultimos check-ins feitos;
- tarefas pendentes;
- decisoes tomadas apos cada revisao.

## Primeiro heartbeat recomendado

```json
{
  "name": "Check-in diario Tatiana",
  "frequency": "dias uteis",
  "time": "09:00",
  "timezone": "America/Sao_Paulo",
  "message": "Bom dia. Quer que eu te ajude a escolher o passo mais importante de hoje para o MEI Copilot?"
}
```

