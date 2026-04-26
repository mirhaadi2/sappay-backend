/**
 * Portal Configuration
 * Defines all portals and their specific configurations
 */

export enum Portal {
  WEBSITE = 'WEBSITE',
  SELLER = 'SELLER',
  ADMIN = 'ADMIN',
}

export interface PortalConfig {
  name: string;
  cookieName: string;
  tokenPrefix: string;
  sessionPrefix: string;
  allowedRoles: string[];
  redirectUrl: string;
}

export const portalConfigs: Record<Portal, PortalConfig> = {
  [Portal.WEBSITE]: {
    name: 'Website Portal',
    cookieName: 'sappey_token_website',
    tokenPrefix: 'website_token',
    sessionPrefix: 'website_session',
    allowedRoles: ['USER'],
    redirectUrl: 'http://localhost:5173', // website-frontend
  },
  [Portal.SELLER]: {
    name: 'Seller Portal',
    cookieName: 'sappey_token_seller',
    tokenPrefix: 'seller_token',
    sessionPrefix: 'seller_session',
    allowedRoles: ['SELLER'],
    redirectUrl: 'http://localhost:5174', // seller-frontend
  },
  [Portal.ADMIN]: {
    name: 'Admin Portal',
    cookieName: 'sappey_token_admin',
    tokenPrefix: 'admin_token',
    sessionPrefix: 'admin_session',
    allowedRoles: ['ADMIN'],
    redirectUrl: 'http://localhost:5175', // admin-frontend
  },
};

export const portalRoutePatterns: Array<{ portal: Portal; patterns: string[] }> = [
  {
    portal: Portal.ADMIN,
    patterns: ['/api/staff', '/staff', '/api/admin', '/admin'],
  },
  {
    portal: Portal.SELLER,
    patterns: ['/api/sellers', '/sellers', '/api/products/seller'],
  },
  {
    portal: Portal.WEBSITE,
    patterns: [
      '/api/auth',
      '/api/customers',
      '/api/addresses',
      '/api/products',
      '/api/homepage',
      '/api/orders',
      '/api/notifications',
      '/api/bulk-orders',
      '/api/reviews',
    ],
  },
];

export const getPortalFromPath = (effectivePath: string, cookieHeader: string): Portal => {
  const lowerPath = effectivePath.toLowerCase();
  const lowerCookie = cookieHeader.toLowerCase();

  for (const route of portalRoutePatterns) {
    if (route.patterns.some((pattern) => lowerPath.includes(pattern))) {
      return route.portal;
    }
  }

  if (lowerCookie.includes(portalConfigs[Portal.SELLER].cookieName.toLowerCase())) {
    return Portal.SELLER;
  }

  if (lowerCookie.includes(portalConfigs[Portal.ADMIN].cookieName.toLowerCase())) {
    return Portal.ADMIN;
  }

  return Portal.WEBSITE;
};

export const getPortalFromRole = (role: string): Portal => {
  switch (role.toUpperCase()) {
    case 'USER':
      return Portal.WEBSITE;
    case 'SELLER':
      return Portal.SELLER;
    case 'ADMIN':
      return Portal.ADMIN;
    default:
      return Portal.WEBSITE;
  }
};
