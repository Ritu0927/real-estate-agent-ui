import { NextResponse } from "next/server";
import type { PropertyStatus } from "@/types/property";

export const maxDuration = 180;

const API_URL =
  process.env.PROPERTY_STATUS_API_URL ||
  "https://laer5u45nxx772b23ly22bgtii0erapo.lambda-url.us-east-1.on.aws/";
const REQUEST_TIMEOUT_MS = 180000;
const RETRY_AFTER_MS = 15000;

function readString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return "";
}

function unwrapPayload(payload: unknown) {
  if (payload && typeof payload === "object" && "body" in payload) {
    const body = (payload as Record<string, unknown>).body;

    if (typeof body === "string") {
      try {
        return JSON.parse(body);
      } catch {
        return body;
      }
    }

    return body;
  }

  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as Record<string, unknown>).data;
  }

  return payload;
}

function normalizePropertyResponse(payload: unknown, address: string): PropertyStatus {
  const responseBody = unwrapPayload(payload);

  if (typeof responseBody === "string") {
    return {
      address,
      answer: responseBody,
    };
  }

  if (!responseBody || typeof responseBody !== "object") {
    throw new Error("Unexpected API Gateway response format.");
  }

  const record = responseBody as Record<string, unknown>;
  const answer = readString(record, ["answer", "response", "message", "text", "output"]);
  const resolvedAddress = readString(record, ["address", "propertyAddress", "property_address"]) || address;

  if (!answer) {
    throw new Error("API Gateway did not return an answer field.");
  }

  return {
    address: resolvedAddress,
    answer,
    box: readString(record, ["box", "box_summary", "boxSummary"]) || undefined,
    gmail: readString(record, ["gmail", "gmail_summary", "gmailSummary"]) || undefined,
    fub: readString(record, ["fub", "followUpBoss", "follow_up_boss", "crm"]) || undefined,
  };
}

function pendingResponse(address: string, message: string, upstreamStatus?: number) {
  return NextResponse.json(
    {
      status: "pending",
      address,
      message,
      retryAfterMs: RETRY_AFTER_MS,
      upstreamStatus,
    },
    { status: 202 }
  );
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const address = body?.address;

  if (!address || typeof address !== "string") {
    return NextResponse.json(
      { error: "A valid address must be provided." },
      { status: 400 }
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const gatewayResponse = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        address,
        question: `For ${address}, return the current property transaction status report with these sections: SUMMARY, KEY FINDINGS, OPEN ITEMS, MISSING DOCUMENTS, RISKS, RECOMMENDED NEXT STEPS, SOURCES. Use only confirmed data from Box, Gmail, Google Drive, and Follow Up Boss. Do not invent missing information.`,
      }),
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const rawText = await gatewayResponse.text();
    let payload: unknown = rawText;

    try {
      payload = rawText ? JSON.parse(rawText) : null;
    } catch {
      payload = rawText;
    }

    if (gatewayResponse.status === 503 || gatewayResponse.status === 504 || gatewayResponse.status === 429) {
      const message =
        payload && typeof payload === "object" && "message" in payload
          ? String((payload as Record<string, unknown>).message)
          : "The property report is still running. Bedrock can take around two minutes for a full case review.";

      return pendingResponse(address, message, gatewayResponse.status);
    }

    const unwrappedPayload = unwrapPayload(payload);
    const lambdaStatus =
      payload && typeof payload === "object" && typeof (payload as Record<string, unknown>).statusCode === "number"
        ? Number((payload as Record<string, unknown>).statusCode)
        : undefined;

    if (lambdaStatus && lambdaStatus >= 500) {
      const message =
        unwrappedPayload && typeof unwrappedPayload === "object" && "message" in unwrappedPayload
          ? String((unwrappedPayload as Record<string, unknown>).message)
          : `Lambda returned status ${lambdaStatus}`;

      return pendingResponse(address, message, lambdaStatus);
    }

    if (lambdaStatus && lambdaStatus >= 400) {
      const message =
        unwrappedPayload && typeof unwrappedPayload === "object" && "error" in unwrappedPayload
          ? String((unwrappedPayload as Record<string, unknown>).error)
          : unwrappedPayload && typeof unwrappedPayload === "object" && "message" in unwrappedPayload
            ? String((unwrappedPayload as Record<string, unknown>).message)
            : `Lambda returned status ${lambdaStatus}`;

      return NextResponse.json({ error: message, upstreamStatus: lambdaStatus }, { status: 502 });
    }

    if (!gatewayResponse.ok) {
      const message =
        payload && typeof payload === "object" && "error" in payload
          ? String((payload as Record<string, unknown>).error)
          : payload && typeof payload === "object" && "message" in payload
            ? String((payload as Record<string, unknown>).message)
            : `API Gateway returned status ${gatewayResponse.status}`;

      return NextResponse.json(
        {
          error: message,
          upstreamStatus: gatewayResponse.status,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      status: "complete",
      propertyStatus: normalizePropertyResponse(payload, address),
    });
  } catch (error) {
    clearTimeout(timeout);

    if (error instanceof Error && error.name === "AbortError") {
      return pendingResponse(
        address,
        "The property report is still running. This full Bedrock review can take around two minutes."
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to retrieve property information.",
      },
      { status: 502 }
    );
  }
}
