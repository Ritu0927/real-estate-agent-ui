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
  "open items": "What’s Remaining",
  "pending responses": "What’s Remaining",
  "missing documents": "What’s Remaining",
  risks: "Risks / Red Flags",
  "recommended next steps": "Recommended Next Steps",
  sources: "Sources Reviewed",
  documents: "Documents Found",
  "email activity": "Email Activity",
  "crm": "CRM / Follow Up Boss Activity",
  "follow up boss": "CRM / Follow Up Boss Activity",
};

function normalizeHeading(value: string): string {
  const cleaned = value
    .replace(/^#{1,6}\s*/, "")
    .replace(/[:*-]\s*$/, "")
    .trim();

  const lowered = cleaned.toLowerCase();
  return SECTION_ALIASES[lowered] || cleaned || "General Notes";
}

function cleanBullet(line: string): string {
  return line
    .replace(/^[-*•]\s*/, "")
    .replace(/^\d+[.)]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractMetadata(text: string) {
  const metadata: Record<string, string> = {};
  const patterns: Array<[RegExp, keyof Record<string, string>]> = [
    [/overall status\s*[:\-]\s*(.+)/i, "overallStatus"],
    [/transaction stage\s*[:\-]\s*(.+)/i, "transactionStage"],
    [/risk level\s*[:\-]\s*(.+)/i, "riskLevel"],
    [/last updated\s*[:\-]\s*(.+)/i, "lastUpdated"],
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

    const headingMatch = line.match(/^(#{1,6}\s+.+|SUMMARY|KEY FINDINGS|OPEN ITEMS|PENDING RESPONSES|MISSING DOCUMENTS|RISKS|RECOMMENDED NEXT STEPS|SOURCES|DOCUMENTS|EMAIL ACTIVITY|CRM|FOLLOW UP BOSS)/i);
    if (headingMatch) {
      currentSection = normalizeHeading(line);
      continue;
    }

    const bullet = cleanBullet(line);
    if (bullet) {
      const list = sections.get(currentSection) || [];
      list.push(bullet);
      sections.set(currentSection, list);
    }
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
    address: metadata.overallStatus ? "Property review" : "Property review",
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
