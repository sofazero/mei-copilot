import type { DeliveryPlan } from "./types";

const MAX_BLOCK_LENGTH = 360;
const MIN_TYPING_DELAY_MS = 700;
const MAX_TYPING_DELAY_MS = 4200;

export function createDeliveryPlan(text: string): DeliveryPlan {
  const messages = splitWhatsAppMessage(text).map((block) => ({
    text: block,
    typingDelayMs: getTypingDelayMs(block)
  }));

  return {
    messages,
    totalTypingDelayMs: messages.reduce((total, message) => total + message.typingDelayMs, 0)
  };
}

export function splitWhatsAppMessage(text: string) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  const blocks: string[] = [];

  for (const paragraph of paragraphs) {
    if (paragraph.length <= MAX_BLOCK_LENGTH) {
      blocks.push(paragraph);
      continue;
    }

    blocks.push(...splitLongParagraph(paragraph));
  }

  return blocks.length ? blocks : [text.trim()];
}

export function getTypingDelayMs(text: string) {
  return Math.min(MAX_TYPING_DELAY_MS, Math.max(MIN_TYPING_DELAY_MS, 500 + text.length * 22));
}

function splitLongParagraph(paragraph: string) {
  const sentences = paragraph.match(/[^.!?]+[.!?]*/g)?.map((sentence) => sentence.trim()).filter(Boolean) ?? [
    paragraph
  ];

  const blocks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    const candidate = current ? `${current} ${sentence}` : sentence;

    if (candidate.length > MAX_BLOCK_LENGTH && current) {
      blocks.push(current);
      current = sentence;
    } else {
      current = candidate;
    }
  }

  if (current) blocks.push(current);
  return blocks;
}
