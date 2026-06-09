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

function buildSourceText(context: ChatContext) {
  return [context.propertyStatus?.box || "", context.propertyStatus?.gmail || "", context.propertyStatus?.fub || ""].join("\n\n");
}

function findMatchingLines(sourceText: string, terms: string[]) {
  const loweredTerms = terms.map((term) => term.toLowerCase()).filter(Boolean);

  if (!loweredTerms.length) return [];

  return sourceText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => loweredTerms.some((term) => line.toLowerCase().includes(term)))
    .slice(0, 4);
}

function extractNames(question: string) {
  const capitalizedMatches = question.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g) || [];
  return capitalizedMatches.map((value) => value.trim());
}

function extractSearchTerms(question: string) {
  return question
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.replace(/[^a-z0-9]/g, "").trim())
    .filter((term) => term.length > 3 && !["what", "when", "where", "name", "know", "want", "with", "from", "this", "that", "about", "please", "show", "tell"].includes(term));
}

export function answerPropertyQuestion(question: string, context: ChatContext): string {
  const normalized = question.toLowerCase().trim();
  const address = context.address || context.propertyStatus?.address || "this property";
  const parsed = context.parsedResponse;
  const sourceText = buildSourceText(context);
  const extractedNames = extractNames(question);
  const searchTerms = extractSearchTerms(question);

  if (!context.propertyStatus) {
    return "Search for a property first, then I can answer questions about the address, Box, Gmail, Google Drive, and Follow Up Boss integrations.";
  }

  if (/\b(address|where|property)\b/.test(normalized) || extractedNames.some((name) => sourceText.toLowerCase().includes(name.toLowerCase()))) {
    const matches = findMatchingLines(sourceText, [address, ...extractedNames, ...normalized.split(/\s+/).filter((term) => term.length > 3)]);

    if (matches.length) {
      return `I found matching source details for ${address}: ${matches.join(" ")}`;
    }

    return `The loaded property is ${address}. I do not see a confirmed source line for the name or address in the current response, so I will not invent one.`;
  }

  if (/\b(name|owner|contact|who is it|who owns|buyer|seller)\b/.test(normalized)) {
    const matches = findMatchingLines(sourceText, ["owned by", "owner", "contact", "agent", "buyer", "seller"]);

    if (matches.length) {
      return `Here is the confirmed name-related source detail for ${address}: ${matches.join(" ")}`;
    }

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

  if (/\b(summary|key findings|open items|pending responses|missing documents|sources|raw sources)\b/.test(normalized)) {
    const snippets = findMatchingLines(sourceText, normalized.split(/\s+/).filter((term) => term.length > 3));

    return snippets.length
      ? `Here are the matching source details for ${address}: ${snippets.join(" ")}`
      : `No confirmed data found yet for that source detail on ${address}.`;
  }

  if (searchTerms.length) {
    const snippets = findMatchingLines(sourceText, [...searchTerms, ...extractedNames]);

    if (snippets.length) {
      return `I found matching source details for ${address}: ${snippets.join(" ")}`;
    }
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
