import { Request, Response, NextFunction } from "express";
import { getStaffPermissions } from "./service";

/**
 * Permission cache to reduce database queries
 * In production, use Redis for distributed caching
 */
const permissionCache = new Map<
  string,
  { permissions: string[]; expiresAt: number }
>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export interface AuthenticatedRequest extends Request {
  staff?: {
    id: string;
    email: string;
    name: string;
    status?: string;
  };
  user?: any; // For regular users from website
}

/**
 * Middleware to require authentication
 */
export const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  // Extract staff OR admin from session (both can authenticate to admin portal)
  const staff = (req.session as any)?.staff || (req.session as any)?.admin;

  if (!staff || !staff.id) {
    console.log("[requireAuth] FAILED - No staff or admin in session");
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Attach staff to request for use in controllers
  req.staff = staff;
  next();
};

/**
 * Middleware to require active staff status
 */
export const requireActiveStaff = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  // Extract staff or admin from session if not already attached
  if (!req.staff) {
    const staff = (req.session as any)?.staff || (req.session as any)?.admin;
    if (!staff || !staff.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    req.staff = staff;
  }

  if (req.staff && req.staff.status === "suspended") {
    return res.status(403).json({ error: "Your account has been suspended" });
  }

  next();
};

/**
 * Middleware to require specific permission
 * Usage: app.get('/admin/staff', requirePermission('admin.staff.read'), handler)
 */
export const requirePermission = (requiredPermission: string) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      // Extract staff or admin from session if not already attached
      if (!req.staff) {
        const staff =
          (req.session as any)?.staff || (req.session as any)?.admin;
        if (!staff || !staff.id) {
          return res.status(401).json({ error: "Unauthorized" });
        }
        req.staff = staff;
      }

      // Admins have full permissions - skip permission check
      if ((req.session as any)?.admin) {
        console.log("[requirePermission] Admin user - granting full access");
        next();
        return;
      }

      const staffId = req.staff?.id;
      if (!staffId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Check cache first
      let staffPermissions: string[];
      const cached = permissionCache.get(staffId);

      if (cached && cached.expiresAt > Date.now()) {
        staffPermissions = cached.permissions;
      } else {
        // Fetch from database
        staffPermissions = await getStaffPermissions(staffId);
        // Cache the permissions
        permissionCache.set(staffId, {
          permissions: staffPermissions,
          expiresAt: Date.now() + CACHE_DURATION,
        });
      }

      // Check if staff has the required permission
      if (!staffPermissions.includes(requiredPermission)) {
        return res.status(403).json({
          error: `Forbidden: ${requiredPermission} permission required`,
        });
      }

      (req as any).staffPermissions = staffPermissions;
      next();
    } catch (error) {
      console.error("Permission check error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
};

/**
 * Middleware to require multiple permissions (all must be present)
 */
export const requireAllPermissions = (permissions: string[]) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      // Extract staff or admin from session if not already attached
      if (!req.staff) {
        const staff =
          (req.session as any)?.staff || (req.session as any)?.admin;
        if (!staff || !staff.id) {
          return res.status(401).json({ error: "Unauthorized" });
        }
        req.staff = staff;
      }

      // Admins have full permissions - skip permission check
      if ((req.session as any)?.admin) {
        console.log(
          "[requireAllPermissions] Admin user - granting full access",
        );
        next();
        return;
      }

      const staffId = req.staff?.id;
      if (!staffId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const cached = permissionCache.get(staffId);
      let staffPermissions: string[];

      if (cached && cached.expiresAt > Date.now()) {
        staffPermissions = cached.permissions;
      } else {
        staffPermissions = await getStaffPermissions(staffId);
        permissionCache.set(staffId, {
          permissions: staffPermissions,
          expiresAt: Date.now() + CACHE_DURATION,
        });
      }

      const hasAllPermissions = permissions.every((perm) =>
        staffPermissions.includes(perm),
      );

      if (!hasAllPermissions) {
        const missing = permissions.filter(
          (perm) => !staffPermissions.includes(perm),
        );
        return res.status(403).json({
          error: `Forbidden: Missing permissions: ${missing.join(", ")}`,
        });
      }

      (req as any).staffPermissions = staffPermissions;
      next();
    } catch (error) {
      console.error("Permission check error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
};

/**
 * Middleware to require any one of multiple permissions
 */
export const requireAnyPermission = (permissions: string[]) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      // Extract staff or admin from session if not already attached
      if (!req.staff) {
        const staff =
          (req.session as any)?.staff || (req.session as any)?.admin;
        if (!staff || !staff.id) {
          return res.status(401).json({ error: "Unauthorized" });
        }
        req.staff = staff;
      }

      // Admins have full permissions - skip permission check
      if ((req.session as any)?.admin) {
        console.log("[requireAnyPermission] Admin user - granting full access");
        next();
        return;
      }

      const staffId = req.staff?.id;
      if (!staffId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const cached = permissionCache.get(staffId);
      let staffPermissions: string[];

      if (cached && cached.expiresAt > Date.now()) {
        staffPermissions = cached.permissions;
      } else {
        staffPermissions = await getStaffPermissions(staffId);
        permissionCache.set(staffId, {
          permissions: staffPermissions,
          expiresAt: Date.now() + CACHE_DURATION,
        });
      }

      const hasAnyPermission = permissions.some((perm) =>
        staffPermissions.includes(perm),
      );

      if (!hasAnyPermission) {
        return res.status(403).json({
          error: `Forbidden: None of the required permissions: ${permissions.join(", ")}`,
        });
      }

      (req as any).staffPermissions = staffPermissions;
      next();
    } catch (error) {
      console.error("Permission check error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
};

/**
 * Clear permission cache for a staff member (call after role changes)
 */
export const invalidatePermissionCache = (staffId: string) => {
  permissionCache.delete(staffId);
};

/**
 * Clear all permission cache (call periodically or on deployment)
 */
export const clearPermissionCache = () => {
  permissionCache.clear();
};
