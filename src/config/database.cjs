require('dotenv').config();

module.exports = {
  development: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    migrationStorageTableName: 'sequelize_meta',
  },
  test: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    migrationStorageTableName: 'sequelize_meta',
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    migrationStorageTableName: 'sequelize_meta',
  },
};