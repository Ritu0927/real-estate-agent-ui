import type { ParsedAgentResponse } from "@/lib/parseAgentResponse";
import type { PropertyStatus } from "@/types/property";

export interface ChatContext {
  address: string;
  propertyStatus: PropertyStatus | null;
  parsedResponse: ParsedAgentResponse | null;
}

const NO_DATA = "No confirmed data found.";

function take(items: string[] | undefined, count = 5) {
  return (items || []).filter(Boolean).slice(0, count);
}

function bullets(items: string[] | undefined, fallback = NO_DATA) {
  const visibleItems = take(items);

  if (!visibleItems.length) return fallback;

  return visibleItems.map((item) => `- ${item}`).join("\n");
}

function matchingReportLines(report: string, patterns: RegExp[], limit = 6) {
  return report
    .split(/\n+/)
    .map((line) => line.replace(/^[-*•\d.)\s]+/, "").replace(/[>*_`]/g, "").trim())
    .filter(Boolean)
    .filter((line) => patterns.some((pattern) => pattern.test(line)))
    .slice(0, limit);
}

function answerContingencies(context: ChatContext) {
  const parsed = context.parsedResponse;
  const rawText = context.propertyStatus?.answer || parsed?.rawText || "";
  const contingencyLines = matchingReportLines(rawText, [
    /\bcontingenc/i,
    /\binspection/i,
    /\bappraisal/i,
    /\bloan\b/i,
    /\bdisclosure/i,
    /\bescrow|title/i,
  ]);

  const confirmed = contingencyLines.filter((line) => !/\b(no |not |unable|unknown|missing|cannot|without|no confirmed)/i.test(line));
  const unconfirmed = [
    ...take(parsed?.reportSections.openItems.filter((item) => /\bcontingenc|inspection|appraisal|loan|escrow|title|deadline/i.test(item)), 4),
    ...take(parsed?.reportSections.missingDocuments.filter((item) => /\bcontingenc|removal|purchase agreement|escrow|disclosure|tds|spq|nhd/i.test(item)), 4),
    ...take(parsed?.reportSections.risks.filter((item) => /\bcontingenc|inspection|timeline|escrow|contract/i.test(item)), 4),
  ];
  const nextSteps = take(parsed?.reportSections.recommendedNextSteps.map((step) => step.label).filter((item) => /\bcontingenc|inspection|escrow|purchase|timeline|deadline|disclosure/i.test(item)), 4);

  return [
    `For ${context.propertyStatus?.address || context.address || "this property"}, I cannot confirm the exact contingency deadlines from the loaded report.`,
    "",
    "Confirmed or likely contingency-related items:",
    bullets(confirmed.length ? confirmed : contingencyLines),
    "",
    "Missing or unconfirmed:",
    bullets(unconfirmed),
    "",
    "Recommended next step:",
    bullets(nextSteps.length ? nextSteps : ["Obtain the fully executed purchase agreement and transaction timeline, then confirm inspection, appraisal, loan, disclosure, and escrow/title deadlines."]),
  ].join("\n");
}

function sectionAnswer(title: string, items: string[] | undefined) {
  return `${title}:\n${bullets(items)}`;
}

export function answerFromLoadedReport(question: string, context: ChatContext): string | null {
  if (!context.propertyStatus || !context.parsedResponse) return null;

  const normalized = question.toLowerCase();
  const parsed = context.parsedResponse;

  if (/\bcontingenc|contingencies|deadline|removal|inspection contingency|loan contingency|appraisal contingency\b/i.test(normalized)) {
    return answerContingencies(context);
  }

  if (/\bmissing documents?|docs? missing|what.*missing\b/i.test(normalized)) {
    return sectionAnswer("Missing documents", parsed.reportSections.missingDocuments.length ? parsed.reportSections.missingDocuments : parsed.missingDocuments);
  }

  if (/\brisks?|red flags?|concerns?\b/i.test(normalized)) {
    return sectionAnswer("Risks", parsed.reportSections.risks.length ? parsed.reportSections.risks : parsed.risks);
  }

  if (/\bopen items?|pending|remaining|to do\b/i.test(normalized)) {
    return sectionAnswer("Open items", parsed.reportSections.openItems.length ? parsed.reportSections.openItems : parsed.remaining);
  }

  if (/\bnext steps?|what should|what now|action\b/i.test(normalized)) {
    const actions = parsed.reportSections.recommendedNextSteps.length ? parsed.reportSections.recommendedNextSteps : parsed.recommendedNextSteps;
    return sectionAnswer("Recommended next steps", actions.map((action) => `${action.urgency}: ${action.label}`));
  }

  if (/\bsummary|status|where.*stand|what.*happening\b/i.test(normalized)) {
    return [
      `Status for ${context.propertyStatus.address}:`,
      `- Stage: ${parsed.stage || parsed.transactionStatus || NO_DATA}`,
      `- Seller: ${parsed.sellerClient || NO_DATA}`,
      `- Buyer: ${parsed.buyer || NO_DATA}`,
      `- Risk score: ${parsed.riskScore}`,
      "",
      "Summary:",
      bullets(parsed.reportSections.summary.length ? parsed.reportSections.summary : parsed.activity, "No summary was confirmed in the loaded report."),
    ].join("\n");
  }

  if (/\bsources?|reviewed|box|gmail|drive|follow up boss|fub\b/i.test(normalized)) {
    return sectionAnswer("Sources reviewed", parsed.reportSections.sources.length ? parsed.reportSections.sources : parsed.sources);
  }

  const terms = normalized
    .split(/\s+/)
    .map((term) => term.replace(/[^a-z0-9]/g, ""))
    .filter((term) => term.length > 4);
  const matches = matchingReportLines(context.propertyStatus.answer, terms.map((term) => new RegExp(term, "i")), 5);

  if (matches.length) {
    return `I found these matching details in the loaded report:\n${bullets(matches)}`;
  }

  return null;
}
