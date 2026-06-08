import type { PropertyStatus } from "@/types/property";

export async function getPropertyStatus(address: string): Promise<PropertyStatus> {
  const response = await fetch("/api/property-status", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ address }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to retrieve property information.");
  }

  return (await response.json()) as PropertyStatus;
}
