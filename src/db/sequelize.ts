import { Sequelize } from "sequelize";
import { config } from "../config";

export const sequelize = new Sequelize(config.databaseUrl, {
  dialect: "postgres",
  logging: false,
});

// Import models - they will self-initialize with the sequelize instance
import "../modules/admin/users/models";
import "../modules/admin/users/otp.model";
