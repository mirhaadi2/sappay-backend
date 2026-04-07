import { UserRole } from "../modules/admin/users/models";

export { UserRole };

export interface UserPayload {
  id: string;
  name?: string;
  email: string;
  role: UserRole;
}
