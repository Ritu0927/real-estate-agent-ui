import type { PropertyStatus } from "@/types/property";

export type Urgency = "Critical" | "High" | "Medium" | "Low";

export interface ParsedSection {
  title: string;
  items: string[];
}

export interface CaseDocument {
  source?: string;
  fileName: string;
  date?: string;
  documentType?: string;
}

export interface RecommendedAction {
  label: string;
  urgency: Urgency;
  timeframe: "Immediate" | "This Week" | "Ongoing";
}

export interface SourceReview {
  source: string;
  count?: number;
  limitation?: string;
}

export interface TimelineEvent {
  date: string;
  timestamp: number;
  event: string;
}

export interface TransactionProgressStep {
  label: "Listing" | "Offer Accepted" | "Escrow" | "Inspections" | "Contingencies" | "Closing";
  status: "complete" | "active" | "blocked" | "unknown";
}

export interface ParsedPropertyCaseResponse {
  address?: string;
  transactionStatus?: string;
  sellerClient?: string;
  buyer?: string;
  agent?: string;
  stage?: string;
  lastActivity?: string;
  riskLevel?: string;
  riskScore: number;
  kpis: {
    openItemsCount: number;
    missingDocumentsCount: number;
    risksCount: number;
    sourcesReviewedCount: number;
  };
  timeline: TimelineEvent[];
  progress: TransactionProgressStep[];
  currentNegotiation: string[];
  recentDocumentActivity: string[];
  recentEmailActivity: string[];
  recentCrmActivity: string[];
  completedDocuments: string[];
  signedDocuments: string[];
  availableReports: string[];
  completedSteps: string[];
  missingDocuments: string[];
  missingSignatures: string[];
  pendingResponses: string[];
  unansweredEmails: string[];
  unknownEscrowTitleLenderItems: string[];
  highPriorityRisks: string[];
  communicationGaps: string[];
  missingFinancials: string[];
  missingExecutedContracts: string[];
  unknownEscrowTitleStatus: string[];
  previousFailedDealConcerns: string[];
  recommendedNextSteps: RecommendedAction[];
  documentsFound: CaseDocument[];
  emailsReviewedCount?: number;
  priorityEmails: string[];
  missingCommunicationTrails: string[];
  fubContactName?: string;
  fubStage?: string;
  fubAssignedAgent?: string;
  fubLastActivity?: string;
  fubOpenFollowUps: string[];
  sourcesReviewed: SourceReview[];
  reviewLimitations: string[];
  rawSections: ParsedSection[];
  reportSections: {
    summary: string[];
    keyFindings: string[];
    openItems: string[];
    missingDocuments: string[];
    risks: string[];
    recommendedNextSteps: RecommendedAction[];
    sources: string[];
  };
  rawText: string;
  warnings: string[];
  // Backward-compatible fields for older panels/helpers.
  overallStatus: string;
  transactionStage: string;
  activity: string[];
  done: string[];
  remaining: string[];
  risks: string[];
  documents: Array<{ name: string; source: string; date?: string }>;
  emails: string[];
  crm: string[];
  nextSteps: string[];
  sources: string[];
}

export type ParsedAgentResponse = ParsedPropertyCaseResponse;

const NO_DATA = "No confirmed data found.";

const SECTION_ALIASES: Record<string, string> = {
  summary: "SUMMARY",
  overview: "SUMMARY",
  "key findings": "KEY FINDINGS",
  "transaction status": "KEY FINDINGS",
  "property & seller": "KEY FINDINGS",
  "current activity": "WHAT'S HAPPENING NOW",
  "whats happening now": "WHAT'S HAPPENING NOW",
  "what's happening now": "WHAT'S HAPPENING NOW",
  "what’s happening now": "WHAT'S HAPPENING NOW",
  "what is happening now": "WHAT'S HAPPENING NOW",
  "open items": "OPEN ITEMS",
  "pending responses": "PENDING RESPONSES",
  "missing documents": "MISSING DOCUMENTS",
  "what remains": "WHAT'S REMAINING",
  "whats remaining": "WHAT'S REMAINING",
  "what's remaining": "WHAT'S REMAINING",
  "what’s remaining": "WHAT'S REMAINING",
  "whats done": "WHAT'S DONE",
  "what's done": "WHAT'S DONE",
  "what’s done": "WHAT'S DONE",
  completed: "WHAT'S DONE",
  risks: "RISKS",
  "risk assessment": "RISKS",
  "critical risks": "RISKS",
  "red flags": "RISKS",
  "recommended next steps": "RECOMMENDED NEXT STEPS",
  "next steps": "RECOMMENDED NEXT STEPS",
  "immediate": "RECOMMENDED NEXT STEPS",
  "immediate (today)": "RECOMMENDED NEXT STEPS",
  "today": "RECOMMENDED NEXT STEPS",
  "this week": "RECOMMENDED NEXT STEPS",
  "ongoing": "RECOMMENDED NEXT STEPS",
  documents: "DOCUMENTS FOUND",
  "documents found": "DOCUMENTS FOUND",
  "documents available": "DOCUMENTS FOUND",
  "document activity": "DOCUMENTS FOUND",
  "prior offer history": "RISKS",
  sources: "SOURCES",
  "sources reviewed": "SOURCES",
  "email activity": "EMAIL ACTIVITY",
  gmail: "EMAIL ACTIVITY",
  "fub": "FUB / CRM ACTIVITY",
  "crm": "FUB / CRM ACTIVITY",
  "crm activity": "FUB / CRM ACTIVITY",
  "fub / crm activity": "FUB / CRM ACTIVITY",
  "follow up boss": "FUB / CRM ACTIVITY",
  "follow up boss activity": "FUB / CRM ACTIVITY",
};

function cleanInline(value: string) {
  return value
    .replace(/[>*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeHeading(value: string) {
  const normalized = cleanInline(value)
    .replace(/^#{1,6}\s*/, "")
    .replace(/^[-*•]\s*/, "")
    .replace(/^\d+[.)]\s*/, "")
    .replace(/[:\-–—]\s*$/, "")
    .trim()
    .toLowerCase();

  return SECTION_ALIASES[normalized] || "";
}

function cleanBullet(line: string) {
  return cleanInline(
    line
      .replace(/^#{1,6}\s*/, "")
      .replace(/^[-*•]\s*/, "")
      .replace(/^\[[ xX]\]\s*/, "")
      .replace(/^\d+[.)]\s*/, "")
      .replace(/^:\s*/, "")
  );
}

function uniq(items: string[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const cleaned = cleanInline(item);
    const key = cleaned.toLowerCase();
    if (!cleaned || seen.has(key) || cleaned === NO_DATA) return false;
    seen.add(key);
    return true;
  });
}

function hasAny(value: string, terms: RegExp[]) {
  return terms.some((term) => term.test(value));
}

function firstMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const value = match?.slice(1).filter(Boolean).at(-1);
    if (value) {
      const cleaned = cleanInline(value.replace(/[.;]$/, ""));
      if (cleaned) return cleaned;
    }
  }

  return undefined;
}

function parseCount(text: string, source: string) {
  const escaped = source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`${escaped}\\s*\\((\\d+)\\+?\\s+(?:items?|files?|documents?|emails?|records?|results?)\\s+reviewed`, "i"),
    new RegExp(`${escaped}[^\\n]{0,60}?(\\d+)\\+?\\s+(?:items?|files?|documents?|emails?|records?|results?)\\s+reviewed`, "i"),
    new RegExp(`(\\d+)\\+?\\s+(?:items?|files?|documents?|emails?|records?|results?)\\s+(?:from|in|reviewed in)?\\s*${escaped}`, "i"),
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return Number(match[1]);
  }

  return undefined;
}

function parseDateToTimestamp(value: string) {
  const withYear = /\b\d{4}\b/.test(value) ? value : `${value}, 2026`;
  const timestamp = Date.parse(withYear);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function extractTimelineEvents(items: string[]) {
  const events: TimelineEvent[] = [];
  const datePattern = /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}(?:[-–]\d{1,2})?(?:,\s*\d{4})?|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/gi;

  for (const item of items) {
    const matches = item.match(datePattern) || [];

    for (const match of matches) {
      const rangeParts = match.match(/^([A-Za-z]+)\s+(\d{1,2})[-–](\d{1,2})(?:,\s*(\d{4}))?$/);
      const date = rangeParts ? `${rangeParts[1]} ${rangeParts[2]}${rangeParts[4] ? `, ${rangeParts[4]}` : ""}` : match;
      events.push({
        date,
        timestamp: parseDateToTimestamp(date),
        event: item,
      });
    }
  }

  return events
    .filter((event, index, list) => list.findIndex((item) => item.date === event.date && item.event === event.event) === index)
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(0, 12);
}

function inferProgress(text: string, riskItems: string[]): TransactionProgressStep[] {
  const lower = text.toLowerCase();
  const hasListing = /\blisting|listed|re-listed|active listing|rla\b/.test(lower);
  const hasOffer = /\boffer accepted|accepted offer|ratified|fully executed|purchase agreement|counter offer|sco1|rpa\b/.test(lower);
  const offerBlocked = /\bno confirmation of buyer acceptance|current offer status unclear|no executed purchase agreement|ratified.*missing\b/.test(lower);
  const hasEscrow = /\bescrow opened|escrow number|opening of escrow confirmation\b/.test(lower);
  const escrowBlocked = riskItems.some((item) => /\bno escrow|escrow.*unknown|escrow.*missing|no title\/escrow/i.test(item));
  const hasInspection = /\binspection|general inspection|repair|credit\b/.test(lower);
  const hasContingency = /\bcontingenc|appraisal|loan progress|removal deadline\b/.test(lower);
  const hasClosing = /\bclosing date|close of escrow|final walkthrough|closing\b/.test(lower);
  const closingBlocked = /\bclosing date unknown|closing unknown\b/.test(lower);

  return [
    { label: "Listing", status: hasListing ? "complete" : "unknown" },
    { label: "Offer Accepted", status: offerBlocked ? "blocked" : hasOffer ? "active" : "unknown" },
    { label: "Escrow", status: escrowBlocked ? "blocked" : hasEscrow ? "active" : "unknown" },
    { label: "Inspections", status: hasInspection ? "complete" : "unknown" },
    { label: "Contingencies", status: hasContingency ? "active" : "unknown" },
    { label: "Closing", status: closingBlocked ? "blocked" : hasClosing ? "active" : "unknown" },
  ];
}

function computeRiskScore(riskLevel: string | undefined, risksCount: number, missingDocumentsCount: number, openItemsCount: number) {
  const levelScore = /\bcritical\b/i.test(riskLevel || "")
    ? 92
    : /\bhigh\b/i.test(riskLevel || "")
      ? 78
      : /\bmedium\b/i.test(riskLevel || "")
        ? 55
        : /\blow\b/i.test(riskLevel || "")
          ? 25
          : 35;

  return Math.min(100, levelScore + Math.min(15, risksCount * 2) + Math.min(10, missingDocumentsCount) + Math.min(8, openItemsCount));
}

function getSections(text: string) {
  const sections = new Map<string, string[]>();
  let currentSection = "SUMMARY";

  for (const rawLine of text.replace(/\r/g, "").split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;

    const explicitMarkdownHeading = line.match(/^#{1,6}\s+(.+)/);
    const colonHeading = line.match(/^([A-Z][A-Z /&'’_-]{2,})(?:\s*:)?$/);
    const aliasHeading = normalizeHeading(line);

    if (explicitMarkdownHeading || colonHeading || aliasHeading) {
      currentSection = aliasHeading || normalizeHeading(explicitMarkdownHeading?.[1] || colonHeading?.[1] || line) || cleanInline(line).toUpperCase();
      if (!sections.has(currentSection)) sections.set(currentSection, []);
      continue;
    }

    const cleaned = cleanBullet(line);
    if (!cleaned) continue;
    sections.set(currentSection, [...(sections.get(currentSection) || []), cleaned]);
  }

  if (!sections.size && text.trim()) {
    sections.set(
      "SUMMARY",
      text
        .split(/\n{2,}/)
        .map(cleanBullet)
        .filter(Boolean)
    );
  }

  return sections;
}

function sectionItems(sections: Map<string, string[]>, names: string[]) {
  return uniq(names.flatMap((name) => sections.get(name) || []));
}

function filterItems(items: string[], terms: RegExp[]) {
  return uniq(items.filter((item) => hasAny(item, terms)));
}

function parseUrgency(item: string): Urgency {
  if (/\b(critical|urgent|immediate|today|asap|blocker)\b/i.test(item)) return "Critical";
  if (/\b(high|priority|soon|escalate|24 hours)\b/i.test(item)) return "High";
  if (/\b(medium|this week|follow up|confirm|review)\b/i.test(item)) return "Medium";
  return "Low";
}

function parseTimeframe(item: string): RecommendedAction["timeframe"] {
  if (/\b(immediate|today|asap|critical|urgent|now)\b/i.test(item)) return "Immediate";
  if (/\b(this week|week|soon|next few days)\b/i.test(item)) return "This Week";
  return "Ongoing";
}

function parseDocument(item: string): CaseDocument | null {
  if (!/\b(pdf|docx?|xlsx?|csv|report|disclosure|contract|agreement|escrow|title|inspection|document|file|signed|executed|box|drive|gmail)\b/i.test(item)) {
    return null;
  }

  const source = firstMatch(item, [/\b(source|system)\s*[:\-]\s*([^|,;]+)/i]) ||
    (/\bbox\b/i.test(item) ? "Box" : /\bgoogle drive|drive\b/i.test(item) ? "Google Drive" : /\bgmail|email\b/i.test(item) ? "Gmail" : /\bfub|follow up boss\b/i.test(item) ? "Follow Up Boss" : undefined);
  const date = firstMatch(item, [/\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/, /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})\b/i]);
  const documentType = firstMatch(item, [/\b(type|document type)\s*[:\-]\s*([^|,;]+)/i]) ||
    firstMatch(item, [/\b(disclosure|contract|agreement|inspection report|title report|escrow|listing agreement|financials?|addendum|offer)\b/i]);
  const fileName = firstMatch(item, [/\b(file(?: name)?|document)\s*[:\-]\s*([^|;]+)/i]) || item;

  return {
    source,
    fileName: cleanInline(fileName.replace(/\b(source|type|date)\s*[:\-].*$/i, "")) || item,
    date,
    documentType,
  };
}

function parseSources(text: string, sections: Map<string, string[]>, property?: PropertyStatus) {
  const sourceNames = ["Box", "Gmail", "Google Drive", "Follow Up Boss"];
  const sectionText = sectionItems(sections, ["SOURCES"]).join(" ");
  const combined = `${sectionText}\n${text}`;

  return sourceNames
    .filter((source) => {
      if (source === "Box" && property?.box) return true;
      if (source === "Gmail" && property?.gmail) return true;
      if (source === "Follow Up Boss" && property?.fub) return true;
      return new RegExp(source === "Follow Up Boss" ? "follow up boss|\\bfub\\b" : source, "i").test(combined);
    })
    .map((source) => ({
      source,
      count: parseCount(combined, source),
      limitation: firstMatch(combined, [
        new RegExp(`(${source}[^\\n]*(?:limit(?:ation)?|unable|not reviewed|unknown|partial)[^\\n.]*)`, "i"),
      ]),
    }));
}

function buildRawText(input: string | PropertyStatus) {
  if (typeof input === "string") return input.trim();
  return [input.answer, input.box, input.gmail, input.fub].filter(Boolean).join("\n\n").trim();
}

export function parsePropertyCaseResponse(input: string | PropertyStatus): ParsedPropertyCaseResponse {
  const property = typeof input === "string" ? undefined : input;
  const rawText = buildRawText(input);
  const sections = getSections(rawText);
  const allItems = uniq(Array.from(sections.values()).flat());
  const summaryItems = sectionItems(sections, ["SUMMARY", "KEY FINDINGS", "WHAT'S HAPPENING NOW"]);
  const onlySummaryItems = sectionItems(sections, ["SUMMARY"]);
  const keyFindingItems = sectionItems(sections, ["KEY FINDINGS"]);
  const openItems = sectionItems(sections, ["OPEN ITEMS", "PENDING RESPONSES"]);
  const doneItems = sectionItems(sections, ["WHAT'S DONE"]);
  const remainingItems = sectionItems(sections, ["WHAT'S REMAINING", "OPEN ITEMS", "PENDING RESPONSES", "MISSING DOCUMENTS"]);
  const riskItems = sectionItems(sections, ["RISKS"]);
  const nextStepItems = sectionItems(sections, ["RECOMMENDED NEXT STEPS"]);
  const emailItems = sectionItems(sections, ["EMAIL ACTIVITY"]);
  const crmItems = sectionItems(sections, ["FUB / CRM ACTIVITY"]);
  const documentSectionItems = sectionItems(sections, ["DOCUMENTS FOUND"]);
  const documentActivity = uniq([
    ...documentSectionItems,
    ...filterItems(summaryItems, [/\bbox\b/i, /\bdrive\b/i, /\bdocument|file|report|signed|executed\b/i]),
  ]);
  const sourceReviews = parseSources(rawText, sections, property);
  const reviewLimitations = uniq([
    ...filterItems(allItems, [/\blimit(?:ation)?\b/i, /\bnot reviewed\b/i, /\bpartial\b/i, /\bunable\b/i, /\bunknown\b/i]),
    ...sourceReviews.map((source) => source.limitation || "").filter(Boolean),
  ]);
  const documentsFound = uniq([...documentSectionItems, ...documentActivity])
    .map(parseDocument)
    .filter((doc): doc is CaseDocument => Boolean(doc));
  const warnings: string[] = [];

  if (!rawText) warnings.push("The backend returned no source text to parse.");

  const plainText = rawText.replace(/[>*_`#]/g, "");
  const transactionStatus = firstMatch(plainText, [/\blisting status\s*[:\-]\s*([^\n]+)/i, /\btransaction status\s*[:\-]\s*([^\n]+)/i, /\boverall status\s*[:\-]\s*([^\n]+)/i, /\bstatus\s*[:\-]\s*([^\n]+)/i]);
  const stage = firstMatch(plainText, [/\bstage\s*[:\-]\s*([^\n]+)/i, /\btransaction stage\s*[:\-]\s*([^\n]+)/i, /\bfub stage\s*[:\-]\s*([^\n]+)/i]) ||
    (/\bactive negotiations?\b/i.test(plainText) ? "Active negotiations" : undefined);
  const riskLevel = firstMatch(rawText, [/\brisk level\s*[:\-]\s*([^\n]+)/i, /\brisk\s*[:\-]\s*(critical|high|medium|low)[^\n]*/i]) ||
    (riskItems.some((item) => /\bcritical\b/i.test(item)) ? "Critical" : riskItems.some((item) => /\bhigh\b/i.test(item)) ? "High" : undefined);
  const address = property?.address || firstMatch(rawText, [/\baddress\s*[:\-]\s*([^\n]+)/i, /\bproperty\s*[:\-]\s*([^\n]+)/i]);
  const missingDocumentItems = sectionItems(sections, ["MISSING DOCUMENTS"]);
  const timeline = extractTimelineEvents(allItems);
  const lastActivity = timeline.at(-1)?.event || firstMatch(plainText, [/\brecent activity\s*[:\-]\s*([^\n]+)/i, /\blast activity\s*[:\-]\s*([^\n]+)/i]);
  const openItemCount = openItems.length || remainingItems.length;
  const missingDocumentCount = missingDocumentItems.length;
  const risksCount = riskItems.length;
  const sourcesReviewedCount = sourceReviews.length || sectionItems(sections, ["SOURCES"]).length;

  const parsed: ParsedPropertyCaseResponse = {
    address,
    transactionStatus,
    sellerClient: firstMatch(plainText, [/\b(?:seller|client|seller\/client)\s*[:\-]\s*([^\n]+)/i]),
    buyer: firstMatch(plainText, [/\b(?:current buyers?|buyers?)\s*[:\-]\s*([^\n]+)/i]),
    agent: firstMatch(plainText, [/\blisting agent\s*[:\-]\s*([^\n]+)/i, /\bassigned agent\s*[:\-]\s*([^\n]+)/i, /\bbuyer's agent\s*[:\-]\s*([^\n]+)/i, /\bbuyer agent\s*[:\-]\s*([^\n]+)/i, /\bagent\s*[:\-]\s*([^\n]+)/i]),
    stage,
    lastActivity,
    riskLevel,
    riskScore: computeRiskScore(riskLevel, risksCount, missingDocumentCount, openItemCount),
    kpis: {
      openItemsCount: openItemCount,
      missingDocumentsCount: missingDocumentCount,
      risksCount,
      sourcesReviewedCount,
    },
    timeline,
    progress: inferProgress(rawText, riskItems),
    currentNegotiation: filterItems(summaryItems, [/\bnegotiat|offer|counter|buyer|seller|activity|currently|deal\b/i]),
    recentDocumentActivity: documentActivity,
    recentEmailActivity: uniq([...emailItems, ...filterItems(summaryItems, [/\bemail|gmail|reply|response|message\b/i])]),
    recentCrmActivity: uniq([...crmItems, ...filterItems(summaryItems, [/\bfub|follow up boss|crm|lead|contact|stage|agent\b/i])]),
    completedDocuments: filterItems(doneItems, [/\bdocument|file|report|disclosure|contract|agreement\b/i]),
    signedDocuments: filterItems(doneItems, [/\bsigned|executed|signature\b/i]),
    availableReports: filterItems(doneItems, [/\breport|inspection|title|disclosure\b/i]),
    completedSteps: doneItems,
    missingDocuments: uniq([...missingDocumentItems, ...filterItems(remainingItems, [/\bmissing\b.*\b(document|file|report|contract|agreement|financial)\b/i])]),
    missingSignatures: filterItems(remainingItems, [/\bmissing\b.*\bsignature|unsigned|not signed\b/i]),
    pendingResponses: uniq([...sectionItems(sections, ["PENDING RESPONSES"]), ...filterItems(remainingItems, [/\bpending|awaiting|waiting|response|reply\b/i])]),
    unansweredEmails: filterItems(remainingItems, [/\bunanswered|no reply|email|gmail\b/i]),
    unknownEscrowTitleLenderItems: filterItems(remainingItems, [/\bunknown|unclear|not confirmed\b/i, /\bescrow|title|lender|loan\b/i]),
    highPriorityRisks: filterItems(riskItems, [/\bcritical|high|urgent|priority|risk|concern|red flag\b/i]),
    communicationGaps: filterItems(riskItems, [/\bcommunication|gap|no reply|unanswered|email|response\b/i]),
    missingFinancials: filterItems(riskItems, [/\bfinancial|proof of funds|pof|loan|lender|preapproval|pre-approval\b/i]),
    missingExecutedContracts: filterItems(riskItems, [/\bexecuted|contract|agreement|signed\b/i]),
    unknownEscrowTitleStatus: filterItems(riskItems, [/\bescrow|title\b/i, /\bunknown|unclear|not confirmed|missing\b/i]),
    previousFailedDealConcerns: filterItems(riskItems, [/\bfailed|fell through|cancelled|canceled|previous deal|back on market\b/i]),
    recommendedNextSteps: nextStepItems.map((item) => ({
      label: item.replace(/^(critical|high|medium|low)\s*[:\-]\s*/i, ""),
      urgency: parseUrgency(item),
      timeframe: parseTimeframe(item),
    })),
    documentsFound,
    emailsReviewedCount: firstMatch(rawText, [/\bemails reviewed\s*[:\-]\s*(\d+)/i, /\breviewed\s+(\d+)\s+emails/i]) ? Number(firstMatch(rawText, [/\bemails reviewed\s*[:\-]\s*(\d+)/i, /\breviewed\s+(\d+)\s+emails/i])) : undefined,
    priorityEmails: filterItems(emailItems, [/\bpriority|urgent|important|critical|high\b/i]),
    missingCommunicationTrails: filterItems(emailItems, [/\bmissing|gap|trail|thread|not found|unanswered|no reply\b/i]),
    fubContactName: firstMatch(rawText, [/\bcontact name\s*[:\-]\s*([^\n]+)/i, /\bfub contact\s*[:\-]\s*([^\n]+)/i]),
    fubStage: firstMatch(rawText, [/\bfub stage\s*[:\-]\s*([^\n]+)/i, /\bcrm stage\s*[:\-]\s*([^\n]+)/i]) || stage,
    fubAssignedAgent: firstMatch(rawText, [/\bassigned agent\s*[:\-]\s*([^\n]+)/i]),
    fubLastActivity: firstMatch(rawText, [/\blast activity\s*[:\-]\s*([^\n]+)/i]),
    fubOpenFollowUps: filterItems(crmItems, [/\bfollow.?up|open|task|call|reminder|pending\b/i]),
    sourcesReviewed: sourceReviews,
    reviewLimitations,
    rawSections: Array.from(sections.entries()).map(([title, items]) => ({ title, items: uniq(items) })),
    reportSections: {
      summary: onlySummaryItems,
      keyFindings: keyFindingItems,
      openItems,
      missingDocuments: missingDocumentItems,
      risks: riskItems,
      recommendedNextSteps: nextStepItems.map((item) => ({
        label: item.replace(/^(critical|high|medium|low)\s*[:\-]\s*/i, ""),
        urgency: parseUrgency(item),
        timeframe: parseTimeframe(item),
      })),
      sources: sectionItems(sections, ["SOURCES"]),
    },
    rawText,
    warnings,
    overallStatus: transactionStatus || "Status not specified",
    transactionStage: stage || "Stage not specified",
    activity: summaryItems,
    done: doneItems,
    remaining: remainingItems,
    risks: riskItems,
    documents: documentsFound.map((doc) => ({ name: doc.fileName, source: doc.source || "Source not specified", date: doc.date })),
    emails: uniq([...emailItems, ...filterItems(summaryItems, [/\bemail|gmail|reply|response|message\b/i])]),
    crm: uniq([...crmItems, ...filterItems(summaryItems, [/\bfub|follow up boss|crm|lead|contact|stage|agent\b/i])]),
    nextSteps: nextStepItems,
    sources: sourceReviews.map((source) => source.source),
  };

  return parsed;
}

export function parseAgentResponse(input: string | PropertyStatus): ParsedPropertyCaseResponse {
  return parsePropertyCaseResponse(input);
}
