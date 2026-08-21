export interface CustomerProfile {
  id: string;
  fullName: string;
  email: string;
  role: "User";
  createdAt: string;
}

export type CustomerRequestType = "Order" | "Contact" | "Affiliate";

export interface CustomerRequestItem {
  id: string;
  referenceCode: string;
  requestType: CustomerRequestType;
  title: string;
  subtitle?: string | null;
  status: string;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CustomerAccountOverview {
  profile: CustomerProfile;
  totalRequests: number;
  activeRequests: number;
  completedRequests: number;
  unreadNotifications: number;
  recentRequests: CustomerRequestItem[];
}
