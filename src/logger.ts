type LogLevel = "info" | "warn" | "error";

type LogInput = {
  level: LogLevel;
  event: string;
  message: string;
  attributes?: Record<string, unknown>;
};

export function logInfo(event: string, message: string, attributes?: Record<string, unknown>) {
  writeLog({
    level: "info",
    event,
    message,
    attributes
  });
}

export function logError(event: string, error: unknown, attributes?: Record<string, unknown>) {
  const errorMessage = error instanceof Error ? error.message : String(error);

  writeLog({
    level: "error",
    event,
    message: `[${event}] ${errorMessage}`,
    attributes: {
      ...attributes,
      error: errorMessage
    }
  });
}

function writeLog(input: LogInput) {
  const line = JSON.stringify({
    message: input.message,
    severity: input.level,
    event: input.event,
    attributes: input.attributes ?? {}
  });

  if (input.level === "error") {
    console.error(line);
    return;
  }

  console.log(line);
}
