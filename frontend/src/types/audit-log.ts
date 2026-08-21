export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  referenceCode?: string | null;
  description?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string;
}

export interface AuditLogPagedResult {
  items: AuditLog[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface AuditLogQuery {
  search?: string;
  action?: string;
  entityType?: string;
  userRole?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}
