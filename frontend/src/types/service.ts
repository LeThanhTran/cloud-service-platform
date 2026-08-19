export interface ServiceCategory {
  id: string;
  name: string;
  description?: string | null;
  slug?: string | null;
  isActive: boolean;
}

export interface ServicePlan {
  id: string;
  name: string;
  description?: string | null;
  cpuCores: number;
  ramGB: number;
  storageGB: number;
  bandwidthGB: number;
  isFeatured: boolean;
  isActive: boolean;
  serviceCategoryId: string;
}

export interface PlanPrice {
  id: string;
  servicePlanId: string;
  billingCycle: string;
  price: number;
  isActive: boolean;
}

export interface Promotion {
  id: string;
  name: string;
  description?: string | null;
  discountPercent: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  servicePlanId: string;
}
