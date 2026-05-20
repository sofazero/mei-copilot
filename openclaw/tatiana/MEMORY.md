# Tatiana - Memoria

## Objetivo da memoria

A memoria da Tatiana serve para preservar contexto estruturado da empresa, do produto, das decisoes tomadas e dos proximos passos.

Memoria estruturada e mais importante que historico bruto.

## Regras gerais

Tatiana deve:

- consultar memoria antes de perguntar algo ja respondido;
- salvar decisoes importantes;
- salvar contexto de produto;
- salvar proximos passos combinados;
- salvar configuracoes de agentes;
- minimizar dados sensiveis;
- confirmar antes de sobrescrever informacao contraditoria.

## Tipos de memoria

### Perfil da empresa

- nome do produto;
- publico pagante;
- usuario final;
- proposta de valor;
- modelo white label;
- fase atual do MVP;
- pilotos em andamento.

### Decisoes de produto

- escopo do MVP;
- o que fica fora do MVP;
- fluxo de onboarding;
- fluxo de check-in;
- politica de alertas;
- regras de notificacao ao contador.

### Agentes

- agentes criados;
- papel de cada agente;
- instrucoes principais;
- tools permitidas;
- limites de autonomia;
- status de configuracao.

### Operacao

- contadores em validacao;
- clientes MEI de piloto;
- pendencias operacionais;
- proximos passos;
- riscos abertos.

### Preferencias do dono

- trabalhar passo a passo;
- confirmar um passo antes do proximo;
- linguagem direta;
- foco em execucao pratica.

## Memoria inicial

```json
{
  "empresa": {
    "nome": "SaaS MEI Contabilidade",
    "produto": "MEI Copilot",
    "modelo": "white label para escritorios contabeis",
    "cliente_pagante": "escritorio de contabilidade",
    "usuario_final": "MEI ou futuro MEI",
    "fase": "MVP e validacao inicial"
  },
  "openclaw": {
    "status": "instalado em VPS Hostinger",
    "canal_ativo": "Telegram",
    "agente_atual": "Tatiana"
  },
  "preferencias": {
    "modo_de_trabalho": "um passo por vez",
    "aguardar_ok": true,
    "idioma": "pt-BR"
  },
  "regras": {
    "nao_substituir_contador": true,
    "confirmar_acoes_sensiveis": true,
    "notificar_contador_em_risco": true,
    "nao_apagar_dados_sem_confirmacao": true
  }
}
```

## Quando salvar memoria

Salvar memoria quando:

- um agente novo for criado;
- um fluxo for aprovado;
- uma decisao de MVP for tomada;
- um contador piloto for cadastrado;
- uma integracao for ativada;
- uma regra de operacao mudar;
- uma pendencia importante aparecer.

## Quando pedir confirmacao

Pedir confirmacao antes de sobrescrever memoria quando:

- o usuario mudar o publico-alvo;
- o usuario mudar modelo de negocio;
- o usuario mudar promessa do produto;
- houver conflito com uma decisao anterior;
- envolver dado fiscal, cliente real ou configuracao sensivel.

