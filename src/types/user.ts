import { UserRole } from "../modules/users/models";

export { UserRole };

export interface UserPayload {
  id: string;
  email: string;
  role: UserRole;
}
