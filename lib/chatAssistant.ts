import type { ParsedAgentResponse } from "@/lib/parseAgentResponse";
import type { PropertyStatus } from "@/types/property";

export interface ChatContext {
  address: string;
  propertyStatus: PropertyStatus | null;
  parsedResponse: ParsedAgentResponse | null;
}

function listToSentence(items: string[], fallback = "No confirmed data found yet") {
  if (!items.length) return fallback;
  return items.join(" ");
}

function extractTopItems(text: string, limit = 3) {
  return text
    .split(/\n+/)
    .map((line) => line.replace(/^\s*[-*•\d.)]+\s*/, "").trim())
    .filter(Boolean)
    .slice(0, limit);
}

export function answerPropertyQuestion(question: string, context: ChatContext): string {
  const normalized = question.toLowerCase().trim();
  const address = context.address || context.propertyStatus?.address || "this property";
  const parsed = context.parsedResponse;

  if (!context.propertyStatus) {
    return "Search for a property first, then I can answer questions about the address, Box, Gmail, Google Drive, and Follow Up Boss integrations.";
  }

  if (/\b(address|where|property)\b/.test(normalized)) {
    return `The loaded property is ${address}.`;
  }

  if (/\b(name|owner|contact|who is it|who owns|buyer|seller)\b/.test(normalized)) {
    return "I do not see a confirmed owner or contact name in the current response, so I will not invent one. If the source data includes a name later, I can surface it here.";
  }

  if (/\b(all integrations|integration|connected systems|sources|what can you see)\b/.test(normalized)) {
    return `I can review Box, Gmail, Google Drive, and Follow Up Boss for ${address}. Current source list: ${listToSentence(parsed?.sources || ["Box", "Gmail", "Google Drive", "Follow Up Boss"])}.`;
  }

  if (/\b(box|document|file|drive)\b/.test(normalized)) {
    const docs = parsed?.documents?.length ? parsed.documents.map((doc) => `${doc.source}: ${doc.name}${doc.date ? ` (${doc.date})` : ""}`) : [];
    return docs.length
      ? `For ${address}, here are the top document findings: ${docs.slice(0, 3).join("; ")}.`
      : "No confirmed data found yet for Box or Drive documents.";
  }

  if (/\b(email|gmail|message|reply|response)\b/.test(normalized)) {
    const emailDetails = parsed?.emails?.length ? parsed.emails : [];
    return emailDetails.length
      ? `Gmail activity for ${address}: ${emailDetails.join(" ")}`
      : "No confirmed data found yet for Gmail activity.";
  }

  if (/\b(fub|follow up boss|crm|agent|lead|stage)\b/.test(normalized)) {
    const crmDetails = parsed?.crm?.length ? parsed.crm : [];
    return crmDetails.length
      ? `Follow Up Boss activity for ${address}: ${crmDetails.join(" ")}`
      : "No confirmed data found yet for Follow Up Boss activity.";
  }

  if (/\b(next steps|what should i do|what now|action|remaining|pending|open items)\b/.test(normalized)) {
    const steps = parsed?.nextSteps?.length ? parsed.nextSteps : parsed?.remaining || [];
    return steps.length
      ? `Recommended next steps for ${address}: ${steps.join(" ")}`
      : "No confirmed data found yet for next steps or open items.";
  }

  if (/\b(risk|red flag|inspection|title|escrow|missing)\b/.test(normalized)) {
    const risks = parsed?.risks?.length ? parsed.risks : [];
    return risks.length
      ? `Risk review for ${address}: ${risks.join(" ")}`
      : "No confirmed data found yet for risks or red flags.";
  }

  return `I can answer questions about the loaded property at ${address}, including Box documents, Gmail activity, Google Drive references, Follow Up Boss CRM activity, risks, remaining items, and next steps. Ask me something specific like “What Box files were found?”, “What is the Gmail status?”, or “What are the next steps?”`;
}

export function getStarterPrompt(context: ChatContext): string {
  if (!context.propertyStatus) {
    return "Search for a property first, then ask me about Box, Gmail, Drive, FUB, risks, next steps, or the address.";
  }

  return `Loaded property: ${context.address || context.propertyStatus.address}. Ask me about Box, Gmail, Google Drive, Follow Up Boss, risks, next steps, or any specific source.`;
}
