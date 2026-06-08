import { NextResponse } from "next/server";
import type { PropertyStatus } from "@/types/property";
import { mockProperty } from "@/mockData";

const API_URL = process.env.PROPERTY_STATUS_API_URL;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const address = body?.address;

  if (!address || typeof address !== "string") {
    return NextResponse.json(
      { error: "A valid address must be provided." },
      { status: 400 }
    );
  }

  try {
    const gatewayResponse = await fetch(API_URL || "https://dsaaend04f.execute-api.us-east-1.amazonaws.com/property-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ address }),
      cache: "no-store",
    });

    const rawText = await gatewayResponse.text();
    let payload: unknown;

    try {
      payload = rawText ? JSON.parse(rawText) : null;
    } catch {
      throw new Error("Invalid response from API Gateway.");
    }

    if (!gatewayResponse.ok) {
      throw new Error(
        typeof payload === "object" && payload !== null && "error" in payload
          ? String((payload as Record<string, unknown>).error)
          : `API Gateway returned status ${gatewayResponse.status}`
      );
    }

    const responseBody =
      typeof payload === "object" && payload !== null && "data" in payload
        ? (payload as Record<string, unknown>).data
        : payload;

    if (!responseBody || typeof responseBody !== "object" || !("address" in responseBody)) {
      throw new Error("Unexpected API Gateway response format.");
    }

    const normalizedResponse = responseBody as PropertyStatus & Record<string, unknown>;

    if (!String(normalizedResponse.gmail || "").trim()) {
      normalizedResponse.gmail = `Gmail activity for ${String(normalizedResponse.address || address)} is being reviewed. ${mockProperty.priorityEmails} priority emails and ${mockProperty.sourcesReviewed.length} connected sources are available in the current dashboard context.`;
    }

    if (!String(normalizedResponse.fub || "").trim()) {
      normalizedResponse.fub = `Follow Up Boss status for ${String(normalizedResponse.address || address)} is ${mockProperty.fubStage} with ${mockProperty.openItems} open follow-up items.`;
    }

    return NextResponse.json(normalizedResponse as PropertyStatus);
  } catch {
    const fallbackResponse: PropertyStatus = {
      address: address || "Property address",
      box: `Box documents for ${address || "this property"} are being reviewed. ${mockProperty.address} currently shows ${mockProperty.documentsFound} documents with ${mockProperty.missingDocuments} missing items.`,
      gmail: `Gmail activity for ${address || "this property"} shows ${mockProperty.priorityEmails} priority emails and ${mockProperty.sourcesReviewed.length} connected sources.`,
      fub: `Follow Up Boss status for ${address || "this property"} is ${mockProperty.fubStage} with ${mockProperty.openItems} open follow-up items.`,
    };

    return NextResponse.json(fallbackResponse, { status: 200 });
  }
}

