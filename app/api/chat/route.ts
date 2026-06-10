import { NextResponse } from "next/server";
import type { PropertyStatus } from "@/types/property";

const CHAT_API_URL = process.env.CHAT_API_URL || process.env.BEDROCK_AGENT_API_URL;
const PROPERTY_STATUS_API_URL = process.env.PROPERTY_STATUS_API_URL;
const REQUEST_TIMEOUT_MS = 180000;

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

function normalizeAnswer(payload: unknown): string {
  if (typeof payload === "string") return payload;

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const data = record.data;

    for (const key of ["answer", "response", "message", "text", "output"]) {
      if (typeof record[key] === "string") return record[key] as string;
    }

    if (data && typeof data === "object") {
      for (const key of ["answer", "response", "message", "text", "output"]) {
        const value = (data as Record<string, unknown>)[key];
        if (typeof value === "string") return value;
      }
    }
  }

  return "";
}

function buildPropertyContext(propertyStatus?: PropertyStatus | null) {
  if (!propertyStatus) return "";

  return [
    `Address: ${propertyStatus.address}`,
    propertyStatus.answer ? `Agent answer:\n${propertyStatus.answer}` : "",
    propertyStatus.box ? `Box:\n${propertyStatus.box}` : "",
    propertyStatus.gmail ? `Gmail:\n${propertyStatus.gmail}` : "",
    propertyStatus.fub ? `Follow Up Boss:\n${propertyStatus.fub}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const question = body?.question;
  const propertyStatus = body?.propertyStatus as PropertyStatus | null | undefined;

  if (!question || typeof question !== "string") {
    return NextResponse.json(
      { error: "A valid question must be provided." },
      { status: 400 }
    );
  }

  const propertyContext = buildPropertyContext(propertyStatus);
  const backendUrl = CHAT_API_URL || PROPERTY_STATUS_API_URL;
  const prompt = propertyContext
    ? `Use the loaded property context when it is relevant. Do not invent facts that are not in the context.\n\n${propertyContext}\n\nUser question: ${question}`
    : question;

  if (!backendUrl) {
    return NextResponse.json(
      {
        answer: "CHAT_API_URL or PROPERTY_STATUS_API_URL is not configured. Add your working API Gateway URL to .env.local, then restart npm run dev.",
      },
      { status: 200 }
    );
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const gatewayResponse = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question,
        prompt,
        address: propertyStatus?.address,
        context: propertyContext || undefined,
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

    if (!gatewayResponse.ok) {
      throw new Error(`Backend returned status ${gatewayResponse.status}`);
    }

    const answer = normalizeAnswer(unwrapPayload(payload));

    return NextResponse.json({
      answer: answer || "No confirmed answer was returned by the Bedrock Agent.",
    });
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "The chat request timed out while waiting for API Gateway."
        : "I could not reach the Bedrock Agent for that question.";

    return NextResponse.json(
      {
        answer: `${message} Upstream: ${backendUrl}`,
      },
      { status: 200 }
    );
  }
}
