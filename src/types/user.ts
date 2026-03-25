import { UserRole } from "../modules/admin/users/models";

export { UserRole };

export interface UserPayload {
  id: string;
  email: string;
  role: UserRole;
}
