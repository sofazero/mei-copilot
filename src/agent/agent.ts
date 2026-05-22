import { logAuditEvent } from "./audit";
import { getConversationContext, saveConversationState } from "./conversation";
import { executeTool } from "./tools";
import type {
  ConversationMemory,
  ConversationState,
  FinancialEntryInput,
  JuliaTurnInput,
  JuliaTurnOutput,
  ToolCall
} from "./types";

const JULIA_MAX_STEPS = 8;

type JuliaDecision = Pick<JuliaTurnOutput, "answer" | "state" | "objective"> & {
  memoryPatch?: Partial<ConversationMemory>;
};

export async function runJuliaTurn(input: JuliaTurnInput, maxSteps = JULIA_MAX_STEPS): Promise<JuliaTurnOutput> {
  const runId = crypto.randomUUID();
  const startedAt = Date.now();

  logAuditEvent({
    type: "agent_run_started",
    tenant: input.tenant,
    phone: input.phone,
    messageId: input.messageId,
    runId,
    payload: {
      text: input.text,
      maxSteps
    }
  });

  if (maxSteps < 1) {
    return reply(
      input,
      runId,
      "human_review_needed",
      "maxSteps inválido",
      `Preciso revisar isso com mais calma. Vou sinalizar para a ${input.tenant.brandName} acompanhar esse ponto.`,
      0,
      startedAt
    );
  }

  const normalizedText = normalizeText(input.text);

  if (isOptOut(normalizedText)) {
    return reply(
      input,
      runId,
      "opt_out",
      "registrar opt-out",
      "Sem problema. Vou parar por aqui.\n\nSe quiser voltar depois, é só chamar a Julia neste número.",
      1,
      startedAt
    );
  }

  if (asksForHuman(normalizedText)) {
    return reply(
      input,
      runId,
      "human_review_needed",
      "pedir apoio humano",
      `Claro. Vou avisar o responsável da ${input.tenant.brandName} para te chamar.\n\nEu continuo por aqui se você quiser registrar alguma entrada, gasto ou tirar uma dúvida simples enquanto isso.`,
      1,
      startedAt
    );
  }

  const context = await getConversationContext(input);
  const next = await decideNextJuliaStep(input, context.state, context.memory, normalizedText, runId, 1);

  return reply(input, runId, next.state, next.objective, next.answer, 1, startedAt, next.memoryPatch);
}

async function decideNextJuliaStep(
  input: JuliaTurnInput,
  state: ConversationState,
  memory: ConversationMemory,
  normalizedText: string,
  runId: string,
  stepNumber: number
): Promise<JuliaDecision> {
  logAuditEvent({
    type: "agent_step",
    tenant: input.tenant,
    phone: input.phone,
    messageId: input.messageId,
    runId,
    stepNumber,
    payload: {
      state,
      normalizedText,
      memory
    }
  });

  if (state === "new") {
    return {
      state: "permission_sent",
      objective: "pedir permissão para iniciar conversa",
      answer: `Oi${input.name ? `, ${input.name}` : ""}. Tudo bem?\n\nMuito prazer, meu nome é Julia. Sou sua assessora pessoal MEI Saudável da ${input.tenant.brandName}.\n\nVocê tem uns minutinhos para falar comigo?`
    };
  }

  if (state === "opt_out") {
    return {
      state: "opt_out",
      objective: "respeitar opt-out",
      answer: "Você pediu para parar, então não vou continuar o acompanhamento por aqui. Se quiser reativar depois, fale com o escritório."
    };
  }

  if (state === "human_review_needed") {
    return {
      state: "human_review_needed",
      objective: "aguardar responsável humano",
      answer: `Esse ponto está com a ${input.tenant.brandName} para conferência. Enquanto isso, posso te ajudar com entradas, gastos e organização simples do mês.`
    };
  }

  if (state === "permission_sent") {
    if (!isAcceptance(normalizedText)) {
      return {
        state: "permission_sent",
        objective: "aguardar permissão clara",
        answer: 'Sem pressa. Quando puder, me responde com "pode" que eu te explico rapidinho.'
      };
    }

    return {
      state: "diagnostic_question_sent",
      objective: "mostrar proximidade e fazer pergunta diagnóstica",
      answer: await getSegmentPainAndQuestionMessage(input, runId, stepNumber)
    };
  }

  if (state === "segment_pain_sent") {
    return {
      state: "diagnostic_question_sent",
      objective: "fazer pergunta diagnóstica contextual",
      answer: await getDiagnosticQuestion(input, runId, stepNumber)
    };
  }

  if (state === "diagnostic_question_sent") {
    if (hasOpenMei(normalizedText)) {
      return {
        state: "onboarding",
        objective: "continuar onboarding de MEI ativo",
        answer: "Perfeito. Então vamos organizar em cima do que você já faz hoje.\n\nQuanto você costuma cobrar por serviço ou pacote?",
        memoryPatch: {
          diagnosticAnswer: input.text,
          businessStatus: "active_mei",
          onboardingStage: "pricing"
        }
      };
    }

    return {
      state: "onboarding",
      objective: "iniciar onboarding leve",
      answer: "Boa, entendi.\n\nPara eu te acompanhar direito, me diz uma coisa: hoje você já tem MEI aberto ou ainda está se organizando para abrir?",
      memoryPatch: {
        diagnosticAnswer: input.text,
        onboardingStage: "mei_status"
      }
    };
  }

  if (state === "onboarding" && hasOpenMei(normalizedText)) {
    return {
      state: "onboarding",
      objective: "continuar onboarding de MEI ativo",
      answer: "Perfeito. Então vamos organizar em cima do que você já faz hoje.\n\nQuanto você costuma cobrar por serviço ou pacote?",
      memoryPatch: {
        businessStatus: "active_mei",
        onboardingStage: "pricing"
      }
    };
  }

  if (state === "onboarding" && isStartingMei(normalizedText)) {
    return {
      state: "onboarding",
      objective: "continuar onboarding de quem vai abrir MEI",
      answer: "Entendi. Então vamos organizar do começo, sem atropelar.\n\nVocê já tem uma ideia de quanto quer faturar por mês com esse trabalho?",
      memoryPatch: {
        businessStatus: "starting_mei",
        onboardingStage: "monthly_goal"
      }
    };
  }

  if (state === "onboarding" && memory.onboardingStage === "pricing") {
    return {
      state: "onboarding",
      objective: "salvar preço informado e pedir meta mensal",
      answer: "Anotei.\n\nE olhando para o mês, quanto você gostaria que sobrasse para você depois dos custos?",
      memoryPatch: {
        pricingRaw: input.text,
        onboardingStage: "monthly_goal"
      }
    };
  }

  if (state === "onboarding" && memory.onboardingStage === "monthly_goal") {
    return {
      state: "daily_checkin",
      objective: "salvar meta inicial e iniciar acompanhamento",
      answer: 'Fechado, anotei aqui.\n\nA partir de agora eu consigo te acompanhar no dia a dia. Quando tiver uma entrada ou gasto do negócio, pode me mandar em linguagem normal, tipo: "recebi R$ 150 hoje" ou "paguei R$ 40 de material".',
      memoryPatch: {
        monthlyGoalRaw: input.text,
        onboardingStage: "done"
      }
    };
  }

  if (asksForFinancialSummary(normalizedText)) {
    const period = asksForMonthlySummary(normalizedText) ? "month" : "today";
    return getFinancialSummary(input, period, runId, stepNumber);
  }

  if (state === "daily_checkin" || state === "entry_capture") {
    const entries = extractFinancialEntries(input.text);
    if (entries.length > 0) {
      return saveFinancialEntries(input, entries, runId, stepNumber);
    }
  }

  if (looksLikeEntry(normalizedText)) {
    const entries = extractFinancialEntries(input.text);
    if (entries.length > 0) {
      return saveFinancialEntries(input, entries, runId, stepNumber);
    }

    return {
      state: "entry_capture",
      objective: "capturar lançamento financeiro",
      answer: "Anotei a ideia do lançamento. Para salvar certinho, me confirma: isso foi uma entrada ou um gasto do negócio?"
    };
  }

  return {
    state,
    objective: "continuar conversa",
    answer: "Entendi.\n\nMe conta em uma frase o que aconteceu hoje no negócio: teve entrada, gasto ou foi um dia sem movimento?"
  };
}

function reply(
  input: JuliaTurnInput,
  runId: string,
  state: ConversationState,
  objective: string,
  answer: string,
  stepsUsed: number,
  startedAt: number,
  memoryPatch: Partial<ConversationMemory> = {}
): JuliaTurnOutput {
  saveConversationState(input, state, memoryPatch);

  if (Object.keys(memoryPatch).length > 0) {
    logAuditEvent({
      type: "conversation_memory_updated",
      tenant: input.tenant,
      phone: input.phone,
      messageId: input.messageId,
      runId,
      payload: {
        memoryPatch
      }
    });
  }

  logAuditEvent({
    type: "agent_run_completed",
    tenant: input.tenant,
    phone: input.phone,
    messageId: input.messageId,
    runId,
    payload: {
      state,
      objective,
      answer,
      stepsUsed,
      durationMs: Date.now() - startedAt
    }
  });

  return {
    answer,
    state,
    objective,
    stepsUsed,
    runId
  };
}

function normalizeText(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isAcceptance(text: string) {
  return /\b(sim|pode|posso|bora|vamos|ok|claro|fala|manda|tenho|tenho sim)\b/.test(text);
}

function isOptOut(text: string) {
  return /\b(nao quero|parar|pare|cancelar|sair|remover|nao me chame)\b/.test(text);
}

function asksForHuman(text: string) {
  return /\b(humano|pessoa|contador|responsavel|atendente|falar com alguem)\b/.test(text);
}

function looksLikeEntry(text: string) {
  return /\b(recebi|entrou|ganhei|vendi|gastei|paguei|comprei|pix|dinheiro|cartao|r\$)\b/.test(text);
}

function hasOpenMei(text: string) {
  return /\b(ja tenho|tenho sim|ja tenho mei|tenho mei|mei aberto|ja sou mei|sou mei)\b/.test(text);
}

function isStartingMei(text: string) {
  return /\b(vou abrir|quero abrir|nao tenho mei|ainda nao|estou abrindo|pretendo abrir)\b/.test(text);
}

async function getSegmentPainAndQuestionMessage(input: JuliaTurnInput, runId: string, stepNumber: number) {
  const activity = input.activity ?? "seu tipo de trabalho";
  const pain = await runStringTool(input, "get_segment_pain", { activity: input.activity }, "pain", runId, stepNumber);
  const question = await getDiagnosticQuestion(input, runId, stepNumber);

  return `Perfeito.\n\nVi aqui que você trabalha com ${activity}. ${pain}\n\nA ideia é te ajudar justamente nisso, sem complicar sua rotina.\n\n${question}`;
}

async function getDiagnosticQuestion(input: JuliaTurnInput, runId: string, stepNumber: number) {
  return runStringTool(input, "get_diagnostic_question", { activity: input.activity }, "question", runId, stepNumber);
}

async function saveFinancialEntries(
  input: JuliaTurnInput,
  entries: FinancialEntryInput[],
  runId: string,
  stepNumber: number
): Promise<JuliaDecision> {
  const results = [];

  for (const entry of entries) {
    const result = await executeTool(
      {
        id: crypto.randomUUID(),
        name: "save_entry",
        input: entry
      },
      {
        tenant: input.tenant,
        phone: input.phone,
        runId,
        stepNumber
      }
    );

    results.push(result.result);
  }

  const savedCount = results.filter((result) => isRecord(result) && result.saved === true).length;
  const incomeTotal = sumEntries(entries, "income");
  const expenseTotal = sumEntries(entries, "expense");
  const balance = incomeTotal - expenseTotal;

  if (savedCount !== entries.length) {
    return {
      state: "entry_capture",
      objective: "registrar lançamentos financeiros",
      answer: "Entendi os lançamentos, mas não consegui salvar tudo com segurança agora.\n\nPode me mandar de novo em instantes? Eu não quero registrar informação pela metade."
    };
  }

  return {
    state: "daily_checkin",
    objective: "registrar lançamentos financeiros",
    answer: buildEntrySummary(entries, incomeTotal, expenseTotal, balance)
  };
}

function extractFinancialEntries(text: string): FinancialEntryInput[] {
  return text
    .split(/\s+e\s+|;|\n/gi)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((clause) => parseFinancialEntry(clause, text))
    .filter((entry): entry is FinancialEntryInput => Boolean(entry));
}

function parseFinancialEntry(clause: string, sourceText: string): FinancialEntryInput | null {
  const normalized = normalizeText(clause);
  const type = detectEntryType(normalized);
  const amount = extractAmount(clause);

  if (!type || !amount) return null;

  return {
    type,
    amount,
    category: inferEntryCategory(type, clause, sourceText),
    description: extractEntryDescription(clause),
    sourceText
  };
}

function detectEntryType(text: string): FinancialEntryInput["type"] | null {
  if (/\b(recebi|entrou|ganhei|vendi|venda|entrada|pix recebido)\b/.test(text)) return "income";
  if (/\b(gastei|paguei|comprei|compra|gasto|despesa|saida)\b/.test(text)) return "expense";
  return null;
}

function extractAmount(text: string) {
  const match = text.match(/(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)/i);
  if (!match) return null;

  const amount = Number(match[1].replace(",", "."));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function extractEntryDescription(text: string) {
  const withoutAmount = text
    .replace(/(?:r\$\s*)?\d+(?:[.,]\d{1,2})?/i, "")
    .replace(/\b(hoje|recebi|entrou|ganhei|vendi|venda|entrada|gastei|paguei|comprei|compra|gasto|despesa|saida|de|com|em)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return withoutAmount || undefined;
}

function inferEntryCategory(type: FinancialEntryInput["type"], clause: string, sourceText: string) {
  const text = normalizeText(`${clause} ${sourceText}`);

  if (type === "income") {
    if (text.includes("festa") || text.includes("kit") || text.includes("atendimento") || text.includes("servico")) {
      return "serviços/vendas";
    }

    return "receita operacional";
  }

  if (text.includes("material") || text.includes("peca") || text.includes("produto") || text.includes("estoque")) {
    return "materiais";
  }

  if (text.includes("entrega") || text.includes("frete") || text.includes("uber") || text.includes("combustivel")) {
    return "transporte/entrega";
  }

  if (text.includes("aluguel") || text.includes("energia") || text.includes("internet") || text.includes("telefone")) {
    return "estrutura";
  }

  return "despesas gerais";
}

function sumEntries(entries: FinancialEntryInput[], type: FinancialEntryInput["type"]) {
  return entries.filter((entry) => entry.type === type).reduce((total, entry) => total + entry.amount, 0);
}

function buildEntrySummary(entries: FinancialEntryInput[], incomeTotal: number, expenseTotal: number, balance: number) {
  const parts = entries.map((entry) => {
    const label = entry.type === "income" ? "entrada" : "gasto";
    const description = entry.description ? ` de ${entry.description}` : "";
    return `${label} de ${formatMoney(entry.amount)}${description} (${entry.category})`;
  });

  return `Anotei aqui: ${joinHuman(parts)}.\n\nNo resumo de hoje, entrou ${formatMoney(incomeTotal)}, saiu ${formatMoney(expenseTotal)} e o saldo ficou ${formatMoney(balance)}.`;
}

async function getFinancialSummary(
  input: JuliaTurnInput,
  period: "today" | "month",
  runId: string,
  stepNumber: number
): Promise<JuliaDecision> {
  const result = await executeTool(
    {
      id: crypto.randomUUID(),
      name: "get_entries",
      input: {
        period
      }
    },
    {
      tenant: input.tenant,
      phone: input.phone,
      runId,
      stepNumber
    }
  );

  const entries = isRecord(result.result) && Array.isArray(result.result.entries) ? result.result.entries : [];
  const summary = summarizeRows(entries);

  return {
    state: "daily_checkin",
    objective: period === "month" ? "resumir mês financeiro" : "resumir dia financeiro",
    answer: buildFinancialSummaryAnswer(period, summary)
  };
}

function summarizeRows(rows: unknown[]) {
  const summary = {
    income: 0,
    expense: 0,
    categories: new Map<string, number>()
  };

  for (const row of rows) {
    if (!isRecord(row)) continue;

    const amount = Number(row.amount);
    const type = row.type;
    const category = typeof row.category === "string" ? row.category : "sem categoria";

    if (!Number.isFinite(amount)) continue;

    if (type === "income") summary.income += amount;
    if (type === "expense") {
      summary.expense += amount;
      summary.categories.set(category, (summary.categories.get(category) ?? 0) + amount);
    }
  }

  return summary;
}

function buildFinancialSummaryAnswer(period: "today" | "month", summary: ReturnType<typeof summarizeRows>) {
  const label = period === "month" ? "este mês" : "hoje";
  const balance = summary.income - summary.expense;

  if (summary.income === 0 && summary.expense === 0) {
    return `Por enquanto, não tenho lançamentos salvos para ${label}.\n\nQuando tiver entrada ou gasto, pode me mandar em linguagem normal.`;
  }

  const categoryText = [...summary.categories.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount]) => `${category}: ${formatMoney(amount)}`)
    .join("\n");

  return `Resumo de ${label}:\n\nEntradas: ${formatMoney(summary.income)}\nGastos: ${formatMoney(summary.expense)}\nSaldo: ${formatMoney(balance)}${categoryText ? `\n\nGastos por categoria:\n${categoryText}` : ""}`;
}

function asksForFinancialSummary(text: string) {
  return /\b(como foi|resumo|quanto sobrou|saldo|fechou|resultado)\b/.test(text);
}

function asksForMonthlySummary(text: string) {
  return /\b(mes|mensal|esse mes|este mes)\b/.test(text);
}

function joinHuman(parts: string[]) {
  if (parts.length <= 1) return parts[0] ?? "";
  return `${parts.slice(0, -1).join(", ")} e ${parts[parts.length - 1]}`;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

async function runStringTool(
  input: JuliaTurnInput,
  name: ToolCall["name"],
  toolInput: Record<string, unknown>,
  field: string,
  runId: string,
  stepNumber: number
) {
  const result = await executeTool(
    {
      id: crypto.randomUUID(),
      name,
      input: toolInput
    },
    {
      tenant: input.tenant,
      phone: input.phone,
      runId,
      stepNumber
    }
  );

  if (isRecord(result.result) && typeof result.result[field] === "string") {
    return result.result[field];
  }

  return "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
