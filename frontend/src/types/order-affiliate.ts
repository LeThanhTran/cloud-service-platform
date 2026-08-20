export interface CreateOrderRequestInput {
  customerName: string;
  email: string;
  phoneNumber: string;
  companyName?: string | null;
  billingCycle: string;
  note?: string | null;
  servicePlanId: string;
}

export interface OrderRequest {
  id: string;
  customerName: string;
  email: string;
  phoneNumber: string;
  companyName?: string | null;
  billingCycle: string;
  note?: string | null;
  status: string;
  servicePlanId: string;
  servicePlanName: string;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateAffiliateApplicationInput {
  fullName: string;
  email: string;
  phoneNumber: string;
  companyName?: string | null;
  website?: string | null;
  note?: string | null;
}

export interface AffiliateApplication {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  companyName?: string | null;
  website?: string | null;
  note?: string | null;
  status: string;
  createdAt: string;
  updatedAt?: string | null;
}
