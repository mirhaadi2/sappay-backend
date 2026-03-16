import { User, UserRole } from "./models";

export const createUser = async (data: {
  email: string;
  password: string;
  role?: UserRole;
}) => {
  return User.create(data);
};

export const findUserByEmail = async (email: string) => {
  return User.findOne({ where: { email } });
};

export const findUserById = async (id: string) => {
  return User.findByPk(id);
};
