import express from "express";
import cors from "cors";
import helmet from "helmet";
import session from "express-session";
import { config } from "./config";
import { getSessionOptionsForPortal } from "./config/session";
import { Portal, portalConfigs } from "./config/portal-config";
import authRoutes from "./modules/auth/routes";
import userRoutes from "./modules/users/routes";
import addressRoutes from "./modules/address/routes";
import productRoutes from "./modules/products/routes";
import { errorHandler } from "./middleware/error.middleware";
import { sellerRoutes } from "./modules/sellers";
import { uploadsRoutes } from "./modules/uploads";

const app = express();

app.use(helmet());
app.use(cors({
  origin: config.frontendOrigin,
  credentials: true,
}));
app.use(express.json());


// Universal session middleware for all portals
app.use(["/api/auth", "/api/users", "/api/addresses", "/api/products", "/api/sellers", "/api/admin"], (req, res, next) => {
  // Detect portal from cookie
  const cookie = req.cookies || req.headers.cookie || '';
  let portal: Portal = Portal.WEBSITE;
  if (cookie.includes(portalConfigs[Portal.SELLER].cookieName)) {
    portal = Portal.SELLER;
  } else if (cookie.includes(portalConfigs[Portal.ADMIN].cookieName)) {
    portal = Portal.ADMIN;
  }
  return session(getSessionOptionsForPortal(portal))(req, res, next);
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sellers", sellerRoutes);
app.use("/api/uploads", uploadsRoutes);

app.use(errorHandler);

export default app;
