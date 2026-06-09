export interface ParsedSection {
  title: string;
  items: string[];
}

export interface ParsedAgentResponse {
  address: string;
  overallStatus: string;
  transactionStage: string;
  riskLevel: string;
  lastUpdated: string;
  activity: string[];
  done: string[];
  remaining: string[];
  risks: string[];
  documents: Array<{ name: string; source: string; date?: string }>;
  emails: string[];
  crm: string[];
  nextSteps: string[];
  sources: string[];
  rawSections: ParsedSection[];
  warnings: string[];
}

const SECTION_ALIASES: Record<string, string> = {
  summary: "What’s Happening Now",
  "key findings": "What’s Happening Now",
  "current activity": "What’s Happening Now",
  "what’s happening now": "What’s Happening Now",
  "whats happening now": "What’s Happening Now",
  "what’s done": "What’s Done",
  "whats done": "What’s Done",
  "open items": "What’s Remaining",
  "pending responses": "What’s Remaining",
  "missing documents": "What’s Remaining",
  "what’s remaining": "What’s Remaining",
  "whats remaining": "What’s Remaining",
  risks: "Risks / Red Flags",
  "risks / red flags": "Risks / Red Flags",
  "recommended next steps": "Recommended Next Steps",
  sources: "Sources Reviewed",
  "sources reviewed": "Sources Reviewed",
  documents: "Documents Found",
  "documents available": "Documents Found",
  "email activity": "Email Activity",
  "crm": "CRM / Follow Up Boss Activity",
  "crm / follow up boss activity": "CRM / Follow Up Boss Activity",
  "follow up boss": "CRM / Follow Up Boss Activity",
};

function normalizeHeading(value: string): string {
  const cleaned = value
    .replace(/^#{1,6}\s*/, "")
    .replace(/[>*_`]/g, "")
    .replace(/[:\-–—]\s*$/, "")
    .trim()
    .toLowerCase();

  return SECTION_ALIASES[cleaned] || cleaned || "general notes";
}

function cleanBullet(line: string): string {
  return line
    .replace(/^[-*•]\s*/, "")
    .replace(/^\d+[.)]\s*/, "")
    .replace(/[>*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractMetadata(text: string) {
  const metadata: Record<string, string> = {};
  const patterns: Array<[RegExp, string]> = [
    [/\baddress\s*[:\-]\s*(.+)/i, "address"],
    [/\blisting status\s*[:\-]\s*(.+)/i, "overallStatus"],
    [/overall status\s*[:\-]\s*(.+)/i, "overallStatus"],
    [/transaction stage\s*[:\-]\s*(.+)/i, "transactionStage"],
    [/transaction status\s*[:\-]\s*(.+)/i, "transactionStage"],
    [/risk level\s*[:\-]\s*(.+)/i, "riskLevel"],
    [/last updated\s*[:\-]\s*(.+)/i, "lastUpdated"],
    [/seller\s*[:\-]\s*(.+)/i, "seller"],
    [/listing agent\s*[:\-]\s*(.+)/i, "listingAgent"],
    [/current buyers\s*[:\-]\s*(.+)/i, "currentBuyers"],
  ];

  for (const [regex, key] of patterns) {
    const match = text.match(regex);
    if (match?.[1]) metadata[key] = match[1].trim();
  }

  return metadata;
}

function extractDocuments(text: string) {
  const documents: Array<{ name: string; source: string; date?: string }> = [];
  const lines = text.split(/\n+/);

  for (const line of lines) {
    const cleaned = cleanBullet(line);
    if (!cleaned) continue;
    const lower = cleaned.toLowerCase();
    if (lower.includes("box") || lower.includes("drive") || lower.includes("gmail") || lower.includes("follow up boss")) {
      const source = lower.includes("box") ? "Box" : lower.includes("drive") ? "Google Drive" : lower.includes("gmail") ? "Gmail" : "Follow Up Boss";
      const dateMatch = cleaned.match(/\((\d{1,2}\/\d{1,2}\/\d{1,2})\)/);
      documents.push({
        name: cleaned.replace(/\((\d{1,2}\/\d{1,2}\/\d{1,2})\)/g, "").trim(),
        source,
        date: dateMatch?.[1],
      });
    }
  }

  return documents.slice(0, 10);
}

export function parseAgentResponse(text: string): ParsedAgentResponse {
  const cleaned = text.replace(/\r/g, "").trim();
  const lines = cleaned.split("\n");
  const metadata = extractMetadata(cleaned);

  const sections = new Map<string, string[]>();
  let currentSection = "What’s Happening Now";

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const headingCandidate = cleanBullet(line);
    const headingMatch = headingCandidate.match(/^(#{1,6}\s+.+|summary|key findings|current activity|what’s happening now|whats happening now|what’s done|whats done|open items|pending responses|missing documents|what’s remaining|whats remaining|risks|risks \/ red flags|recommended next steps|sources|sources reviewed|documents|documents available|email activity|crm|crm \/ follow up boss activity|follow up boss)/i);
    if (headingMatch) {
      currentSection = normalizeHeading(headingCandidate);
      continue;
    }

    const content = cleanBullet(line);
    if (!content) continue;

    const list = sections.get(currentSection) || [];
    list.push(content);
    sections.set(currentSection, list);
  }

  if (sections.size === 0) {
    const fallback = cleaned
      .split(/\n\n+/)
      .map((entry) => entry.trim())
      .filter(Boolean);
    sections.set("What’s Happening Now", fallback.slice(0, 4));
  }

  const activity = sections.get("What’s Happening Now") || [];
  const remaining = sections.get("What’s Remaining") || [];
  const risks = sections.get("Risks / Red Flags") || [];
  const nextSteps = sections.get("Recommended Next Steps") || [];
  const sources = sections.get("Sources Reviewed") || [];
  const documents = extractDocuments(cleaned);

  const emails = sections.get("Email Activity") || activity.filter((item) => /gmail|email|reply|response/i.test(item));
  const crm = sections.get("CRM / Follow Up Boss Activity") || activity.filter((item) => /fub|follow up boss|contact|agent|stage/i.test(item));
  const done = sections.get("What’s Done") || activity.filter((item) => /completed|confirmed|signed|record|available/i.test(item));

  const warnings = [] as string[];
  if (!metadata.overallStatus && !metadata.transactionStage && !metadata.riskLevel && !metadata.lastUpdated) {
    warnings.push("Metadata was not fully reviewed in the source response.");
  }

  return {
    address: metadata.address || "Property review",
    overallStatus: metadata.overallStatus || "Status not specified",
    transactionStage: metadata.transactionStage || "Stage not specified",
    riskLevel: metadata.riskLevel || "Risk not specified",
    lastUpdated: metadata.lastUpdated || "Not provided in response",
    activity,
    done,
    remaining,
    risks,
    documents,
    emails,
    crm,
    nextSteps,
    sources,
    rawSections: Array.from(sections.entries()).map(([title, items]) => ({ title, items })),
    warnings,
  };
}
