import path from "path";
import { Umzug, SequelizeStorage } from "umzug";
import { sequelize } from "./sequelize";

const migrationsPath = path.join(__dirname, "migrations", "*.{ts,cjs}");

const umzug = new Umzug({
  migrations: { glob: migrationsPath },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

const main = async () => {
  const undo = process.argv.includes("--undo");

  if (undo) {
    console.log("⏮️  Reverting last migration...");
    await umzug.down();
    console.log("✅ Migration reverted");
  } else {
    console.log("⬆️  Running migrations...");
    await umzug.up();
    console.log("✅ All migrations applied");
  }

  await sequelize.close();
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
