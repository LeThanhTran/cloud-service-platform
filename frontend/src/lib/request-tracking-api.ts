import { apiFetch, readProblemDetails } from "@/lib/api";
import type {
  RequestTrackingLookupInput,
  RequestTrackingResult,
} from "@/types/request-tracking";

export async function lookupRequest(payload: RequestTrackingLookupInput) {
  const response = await apiFetch("/api/request-tracking/lookup", {
    auth: false,
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const problem = await readProblemDetails(response);
    throw new Error(
      problem.detail ?? problem.title ?? "Không thể tra cứu yêu cầu.",
    );
  }

  return (await response.json()) as RequestTrackingResult;
}
