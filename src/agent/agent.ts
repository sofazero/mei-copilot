import { executeTool } from "./tools";
import type { AgentMessage, AgentTurnInput, AgentTurnOutput, ToolCall, ToolResult } from "./types";

const DEFAULT_MAX_STEPS = 12;

type ModelResponse =
  | { type: "answer"; text: string }
  | { type: "tool_calls"; calls: ToolCall[] };

export async function runAgentTurn(input: AgentTurnInput, maxSteps = DEFAULT_MAX_STEPS): Promise<AgentTurnOutput> {
  const messages: AgentMessage[] = [
    {
      role: "user",
      content: input.text
    }
  ];

  const toolResults: ToolResult[] = [];

  for (let step = 1; step <= maxSteps; step += 1) {
    const response = await callModel(input, messages);

    if (response.type === "answer") {
      return {
        answer: response.text,
        stepsUsed: step,
        toolResults
      };
    }

    for (const call of response.calls) {
      const result = await executeTool(call, {
        tenant: input.tenant,
        phone: input.phone
      });

      toolResults.push(result);
      messages.push({
        role: "tool",
        toolCallId: call.id,
        toolName: call.name,
        content: JSON.stringify(result.result)
      });
    }
  }

  return {
    answer: "Preciso revisar essa informacao com mais calma. Vou acionar o escritorio para continuar seu atendimento.",
    stepsUsed: maxSteps,
    toolResults
  };
}

async function callModel(input: AgentTurnInput, messages: AgentMessage[]): Promise<ModelResponse> {
  const lastTool = [...messages].reverse().find((message) => message.role === "tool");

  if (!lastTool) {
    return {
      type: "tool_calls",
      calls: [
        {
          id: crypto.randomUUID(),
          name: "get_user",
          input: {}
        }
      ]
    };
  }

  if (lastTool.toolName === "get_user" && lastTool.content === "null") {
    return {
      type: "tool_calls",
      calls: [
        {
          id: crypto.randomUUID(),
          name: "create_user",
          input: {
            name: undefined
          }
        },
        {
          id: crypto.randomUUID(),
          name: "get_onboarding_state",
          input: {}
        }
      ]
    };
  }

  if (looksLikeActivityMessage(input.text)) {
    return {
      type: "tool_calls",
      calls: [
        {
          id: crypto.randomUUID(),
          name: "save_onboarding_step",
          input: extractActivity(input.text)
        },
        {
          id: crypto.randomUUID(),
          name: "research_market",
          input: extractActivity(input.text)
        }
      ]
    };
  }

  return {
    type: "answer",
    text: `${input.tenant.brandName}: Entendi. Para comecar certo, me diga se voce ja tem o negocio aberto ou se ainda esta planejando abrir.`
  };
}

function looksLikeActivityMessage(text: string) {
  const normalized = text.toLowerCase();
  return normalized.includes("sou ") || normalized.includes("trabalho com") || normalized.includes("quero abrir");
}

function extractActivity(text: string) {
  const normalized = text.toLowerCase();
  const cityMatch = normalized.match(/\bem\s+([a-zA-ZÀ-ÿ\s]+)$/);

  return {
    activity: text,
    city: cityMatch?.[1]?.trim()
  };
}

