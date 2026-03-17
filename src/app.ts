import express from "express";
import cors from "cors";
import helmet from "helmet";
import session from "express-session";
import { config } from "./config";
import { sessionOptions } from "./config/session";
import authRoutes from "./modules/auth/routes";
import userRoutes from "./modules/users/routes";
import addressRoutes from "./modules/address/routes";
import { errorHandler } from "./middleware/error.middleware";

const app = express();

app.use(helmet());
app.use(cors({
  origin: config.frontendOrigin,
  credentials: true,
}));
app.use(express.json());
app.use(session(sessionOptions));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/addresses", addressRoutes);

app.use(errorHandler);

export default app;
