import { UserRole } from "./user";

export interface JwtPayload {
  sub?: string;
  email?: string;
  role?: UserRole;
  iat?: number;
  exp?: number;
  // Guest checkout fields
  isGuest?: boolean;
  contact?: string;
  contactType?: 'email' | 'phone' | 'whatsapp';
}
