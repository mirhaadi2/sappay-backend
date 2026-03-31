import express from "express";
import cors from "cors";
import helmet from "helmet";
import session from "express-session";
import cookieParser from "cookie-parser";
import { config } from "./config";
import { getSessionOptionsForPortal } from "./config/session";
import { Portal, portalConfigs } from "./config/portal-config";
import authRoutes from "./modules/website/auth/routes";
import userRoutes from "./modules/website/users/routes";
import addressRoutes from "./modules/website/address/routes";
import productRoutes from "./modules/website/products/routes";
import { homepageRoutes } from "./modules/website/homepage";
import { errorHandler } from "./middleware/error.middleware";
import { requestLoggingMiddleware, errorLoggingMiddleware } from "./middleware/logging.middleware";
import { sellerRoutes } from "./modules/sellers";
import { uploadsRoutes } from "./modules/uploads";
import adminAuthRoutes from "./modules/admin/auth/routes";
import adminRoutes from "./modules/admin";
import staffAuthRoutes from "./modules/staff/auth/routes";
import { staffRouter } from "./modules/staff/routes";

const app = express();

app.set('trust proxy', 1); // Trust first proxy for development/production

// Add request logging middleware as the first middleware
app.use(requestLoggingMiddleware);

app.use(helmet());
app.use(cors({
  origin: config.frontendOrigin,
  credentials: true,
}));
app.use(cookieParser(config.session.secret));
app.use(express.json());

// Create session middleware instances for each portal upfront (not per-request)
const websiteSession = session(getSessionOptionsForPortal(Portal.WEBSITE));
const sellerSession = session(getSessionOptionsForPortal(Portal.SELLER));
const adminSession = session(getSessionOptionsForPortal(Portal.ADMIN));

// Universal session middleware for all portals
app.use(["/api/auth", "/api/users", "/api/addresses", "/api/products", "/api/sellers", "/api/admin", "/api/staff"], (req, res, next) => {
  // Determine the effective path to support mounted routers (req.path may be stripped)
  const effectivePath = (req.originalUrl || req.baseUrl || req.path || '').toLowerCase();

  // Detect portal from URL path.
  // Ensure routes like /api/auth remain WEBSITE even when seller/admin cookies exist.
  let portal: Portal = Portal.WEBSITE;

  if (effectivePath.includes('/api/staff') || effectivePath.includes('/staff')) {
    portal = Portal.ADMIN;
  } else if (effectivePath.includes('/api/admin') || effectivePath.includes('/admin')) {
    portal = Portal.ADMIN;
  } else if (effectivePath.includes('/api/sellers') || effectivePath.includes('/sellers') || effectivePath.includes('/api/products/seller')) {
    portal = Portal.SELLER;
  } else if (effectivePath.includes('/api/auth') || effectivePath.includes('/api/users') || effectivePath.includes('/api/addresses') || effectivePath.includes('/api/products') || effectivePath.includes('/api/homepage')) {
    portal = Portal.WEBSITE;
  } else {
    // For any other unknown route, preserve existing portal via cookie. Useful for routes outside our explicit prefix list.
    const cookie = (req.cookies || req.headers.cookie || '').toString();
    if (cookie.includes(portalConfigs[Portal.SELLER].cookieName)) {
      portal = Portal.SELLER;
    } else if (cookie.includes(portalConfigs[Portal.ADMIN].cookieName)) {
      portal = Portal.ADMIN;
    }
  }

  // Use the appropriate session middleware instance
  const sessionMiddleware =
    portal === Portal.SELLER ? sellerSession :
    portal === Portal.ADMIN ? adminSession :
    websiteSession;

  return sessionMiddleware(req, res, next);
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/products", productRoutes);
app.use("/api/homepage", homepageRoutes);
app.use("/api/sellers", sellerRoutes);
app.use("/api/uploads", uploadsRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/staff/auth", staffAuthRoutes);
app.use("/api/staff", staffRouter);

app.use(errorLoggingMiddleware);
app.use(errorHandler);

export default app;
