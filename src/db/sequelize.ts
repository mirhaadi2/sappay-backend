import { Sequelize } from "sequelize";
import { config } from "../config";
// Import models to register them
import "../modules/users/models";

export const sequelize = new Sequelize(config.databaseUrl, {
  dialect: "postgres",
  logging: false,
});
