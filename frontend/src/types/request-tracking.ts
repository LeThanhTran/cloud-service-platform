export interface RequestTrackingLookupInput {
  referenceCode: string;
  email: string;
}

export interface RequestTrackingResult {
  referenceCode: string;
  requestType: "Order" | "Affiliate" | "Contact";
  status: string;
  title: string;
  subtitle?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}
