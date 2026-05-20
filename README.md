# MEI Copilot

Assistente financeiro e fiscal via WhatsApp para MEIs, vendido para escritorios de contabilidade em modelo white label.

O contador oferece ao cliente MEI um numero com nome e identidade do proprio escritorio. Por baixo, a plataforma opera com IA agentica, ferramentas controladas, memoria, agenda de tarefas e painel para o contador acompanhar riscos.

## Objetivo atual

Rodar o mais rapido possivel um MVP validavel com contadores e clientes MEI reais, sem perder controle operacional.

Prioridades:

1. Validar com 2 a 3 contadores.
2. Estruturar agente do WhatsApp com `maxSteps`, memoria e tools.
3. Implementar onboarding, lancamentos e diagnostico simples.
4. Adicionar lembretes ativos e alertas fiscais.
5. Evoluir para painel B2B white label.

## Documentos canonicos

- `PRODUCT.md`: visao de produto, publico, proposta de valor e escopo.
- `FLOWS.md`: fluxos do dono da plataforma, contador e MEI.
- `ARCHITECTURE.md`: arquitetura multi-tenant, fluxo WhatsApp, jobs e dados.
- `AGENTS.md`: comportamento do agente, loop `maxSteps`, memoria e autonomia controlada.
- `TOOLS.md`: catalogo de tools, schemas esperados e regras de execucao.
- `SECURITY.md`: mitigacao de erros, auditoria, logs, LGPD e deploy seguro.

## Artefatos atuais

- `forms/validacao-contadores.html`: formulario estilo Typeform com envio automatico via Formspree.
- `src/agent`: esqueleto TypeScript do agente e tools.
- `src/webhook/evolution.ts`: esqueleto do webhook da Evolution API.
- `docs/`: documentos iniciais de exploracao e validacao.

## Como ativar o formulario

1. Crie uma conta em `https://formspree.io`.
2. Crie um novo form.
3. Copie o ID do endpoint, por exemplo `xyzabc123`.
4. Abra `forms/validacao-contadores.html`.
5. Troque `SEU_FORMSPREE_ID` pelo ID real.
6. Publique o HTML no Netlify, Vercel ou outro host estatico.

## Principios de implementacao

- Simples antes de completo.
- Toda tool tem schema de entrada e saida.
- Toda execucao relevante gera log.
- Nenhuma acao critica sem confirmacao humana.
- Todo agente tem `maxSteps`, `maxRetries` e `timeout`.
- Toda resposta financeira/fiscal deve recomendar conferencia com contador.
- Nunca apagar dados sem aprovacao explicita.
- Separar dev, staging e producao desde cedo.
- Testes obrigatorios antes de deploy.
- Auditoria recorrente contra codigo morto, fluxo confuso e complexidade desnecessaria.

## Proximo passo recomendado

Antes das conversas de quinta-feira, usar o formulario com os 2 contadores e anotar:

- dor espontanea com cliente MEI;
- reacao ao white label;
- disposicao para piloto;
- objecoes de responsabilidade, WhatsApp, IA e preco.

Depois disso, iniciar o MVP tecnico com webhook Evolution, banco multi-tenant, agente e envio humanizado.
