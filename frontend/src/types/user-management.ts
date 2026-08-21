import type { UserRole } from "@/types/auth";

export interface ManagedUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface UpdateUserRoleInput {
  role: UserRole;
}

export interface UpdateUserStatusInput {
  isActive: boolean;
}
