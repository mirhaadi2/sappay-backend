import type { NextFunction, Request, Response } from 'express';
import session from 'express-session';
import { Portal, getPortalFromPath } from '../config/portal-config';
import { getSessionOptionsForPortal } from '../config/session';

export const portalSessionPaths: string[] = [
    '/api/auth',
    '/api/customers',
    '/api/addresses',
    '/api/products',
    '/api/sellers',
    '/api/farmers',
    '/api/admin',
    '/api/staff',
    '/api/orders',
    '/api/notifications',
    '/api/bulk-orders',
    '/api/reviews',
    '/api/delhivery',
];

const websiteSession = session(getSessionOptionsForPortal(Portal.WEBSITE));
const sellerSession = session(getSessionOptionsForPortal(Portal.SELLER));
const adminSession = session(getSessionOptionsForPortal(Portal.ADMIN));

const getCookieHeader = (req: Request): string => {
    if (typeof req.headers.cookie === 'string') {
        return req.headers.cookie;
    }

    if (req.cookies && typeof req.cookies === 'object') {
        return Object.keys(req.cookies).join('; ');
    }

    return '';
};

export const portalSessionMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const effectivePath = (req.originalUrl || req.baseUrl || req.path || '').toString();
    const cookieHeader = getCookieHeader(req);
    const portal = getPortalFromPath(effectivePath, cookieHeader);

    const sessionMiddleware =
        portal === Portal.SELLER
            ? sellerSession
            : portal === Portal.ADMIN
              ? adminSession
              : websiteSession;

    return sessionMiddleware(req, res, next);
};
