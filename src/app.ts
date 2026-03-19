import express from "express";
import cors from "cors";
import helmet from "helmet";
import session from "express-session";
import { config } from "./config";
import { getSessionOptionsForPortal } from "./config/session";
import { Portal } from "./config/portal-config";
import authRoutes from "./modules/auth/routes";
import userRoutes from "./modules/users/routes";
import addressRoutes from "./modules/address/routes";
import productRoutes from "./modules/products/routes";
import { errorHandler } from "./middleware/error.middleware";
import { sellerRoutes } from "./modules/sellers";

const app = express();

app.use(helmet());
app.use(cors({
  origin: config.frontendOrigin,
  credentials: true,
}));
app.use(express.json());

// Website session (for /api/auth, /api/users, etc)
app.use(["/api/auth", "/api/users", "/api/addresses", "/api/products"], session(getSessionOptionsForPortal(Portal.WEBSITE)));

// Seller session (for /api/sellers)
app.use("/api/sellers", session(getSessionOptionsForPortal(Portal.SELLER)));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sellers", sellerRoutes);

app.use(errorHandler);

export default app;
