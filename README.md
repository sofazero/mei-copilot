# MEI Copilot

MEI Copilot e um SaaS para escritorios contabeis acompanharem clientes MEI pelo WhatsApp com a Julia, uma agente operacional com memoria, tools, check-in diario, registros financeiros e alertas de risco.

## Foco atual

Construir a Julia como produto real em TypeScript, com deploy no Railway, banco Supabase e integracao WhatsApp via Evolution API.

OpenClaw pode continuar como apoio externo de planejamento, mas nao sera o runtime da Julia.

## Arquitetura da Julia

```text
WhatsApp
  -> Evolution API
  -> Webhook no Railway
  -> Buffer de mensagens
  -> Estado da conversa
  -> Runtime agentico da Julia
  -> Tools controladas
  -> Supabase memoria/logs
  -> Split + typing delay
  -> Evolution API
  -> WhatsApp
```

## Essencia da Julia

Julia nao e um chatbot simples.

Ela deve:

- entender objetivo da conversa;
- consultar memoria antes de perguntar;
- decidir proximos passos;
- usar tools quando necessario;
- respeitar `maxSteps`, retry e timeout;
- salvar entradas, despesas e contexto;
- fazer check-in diario;
- acionar alerta para o contador quando houver risco;
- responder como uma conversa real de WhatsApp.

## Documentos canonicos

- `PRODUCT.md`: produto, publico, promessa e escopo.
- `FLOWS.md`: fluxos do contador, MEI, onboarding e check-in.
- `ARCHITECTURE.md`: arquitetura tecnica do runtime da Julia.
- `AGENTS.md`: comportamento agentico, limites e tom.
- `TOOLS.md`: catalogo de tools e regras.
- `SECURITY.md`: seguranca, logs, LGPD e auditoria.

## Codigo atual

- `src/agent`: runtime, tipos e tools da Julia.
- `src/webhook`: entrada da Evolution API.
- `src/server.ts`: servidor HTTP para Railway/local.

## Comandos

```bash
npm run typecheck
npm run simulate:julia
npm run test:webhook
npm run dev
```

## Rotas HTTP

- `GET /health`: verifica se o serviço está online.
- `GET /audit`: mostra eventos de auditoria em memória.
- `POST /webhook/evolution`: recebe webhook da Evolution API.

## Variáveis de Ambiente

Copie `.env.example` para `.env` quando for rodar localmente.

```text
PORT=3000
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_KEY=sua-chave-aqui
EVOLUTION_DRY_RUN=true
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

Com `EVOLUTION_DRY_RUN=true`, a Julia processa tudo e registra logs, mas não envia mensagem real.

## Principios

- Conversa humana antes de automacao bonita.
- Buffer, split e typing sao parte do produto.
- Toda tool relevante gera log.
- Nenhuma acao critica sem confirmacao.
- Toda resposta fiscal sensivel deve acionar cuidado humano.
- Nunca apagar dados sem autorizacao explicita.
- Deploy so depois de typecheck e teste manual do fluxo WhatsApp.
