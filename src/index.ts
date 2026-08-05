import dns from "node:dns";

// Force Node.js to prefer IPv4 over IPv6
dns.setDefaultResultOrder("ipv4first");

import app from "./app";
import { config } from "./config";
import { sequelize } from "./db/sequelize";

const port = config.port;

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");

    app.listen(port, () => {
      console.log(`🚀 Server listening on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

start();
