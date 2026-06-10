import type { PropertyStatus } from "@/types/property";

export interface PendingPropertyStatus {
  status: "pending";
  address: string;
  message: string;
  retryAfterMs: number;
  upstreamStatus?: number;
}

export interface CompletePropertyStatus {
  status: "complete";
  propertyStatus: PropertyStatus;
}

export type PropertyStatusResult = PendingPropertyStatus | CompletePropertyStatus;

export interface ChatRequest {
  question: string;
  propertyStatus?: PropertyStatus | null;
}

export interface ChatResponse {
  answer: string;
}

const CLIENT_PROPERTY_TIMEOUT_MS = 190000;

export async function getPropertyStatus(address: string): Promise<PropertyStatusResult> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), CLIENT_PROPERTY_TIMEOUT_MS);

  try {
    const response = await fetch("/api/property-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ address }),
      cache: "no-store",
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        payload && typeof payload === "object" && "error" in payload
          ? String((payload as Record<string, unknown>).error)
          : "Unable to retrieve property information.";

      throw new Error(message);
    }

    if (payload && typeof payload === "object" && (payload as { status?: string }).status === "pending") {
      return payload as PendingPropertyStatus;
    }

    if (payload && typeof payload === "object" && (payload as { status?: string }).status === "complete") {
      return payload as CompletePropertyStatus;
    }

    if (payload && typeof payload === "object" && "answer" in payload) {
      return {
        status: "complete",
        propertyStatus: payload as PropertyStatus,
      };
    }

    throw new Error("Unexpected property status response.");
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        status: "pending",
        address,
        message: "The report is still running. The full Bedrock case review can take around two minutes.",
        retryAfterMs: 15000,
      };
    }

    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function askBedrockAgent({ question, propertyStatus }: ChatRequest): Promise<ChatResponse> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question, propertyStatus }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to send chat question.");
  }

  return (await response.json()) as ChatResponse;
}
