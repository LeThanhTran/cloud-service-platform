export interface DashboardRecentItem {
  type: "Order" | "Affiliate" | "Contact" | "News" | string;
  title: string;
  subtitle: string;
  status: string;
  link: string;
  createdAt: string;
}

export interface DashboardSummary {
  totalServicePlans: number;
  activeServicePlans: number;
  totalUsers: number;
  activeUsers: number;

  totalOrders: number;
  newOrders: number;
  processingOrders: number;
  completedOrders: number;
  rejectedOrders: number;

  totalAffiliates: number;
  newAffiliates: number;
  processingAffiliates: number;
  completedAffiliates: number;
  rejectedAffiliates: number;

  totalContacts: number;
  newContacts: number;
  processingContacts: number;
  resolvedContacts: number;

  totalNews: number;
  publishedNews: number;
  draftNews: number;

  pendingWork: number;
  recentItems: DashboardRecentItem[];
}
