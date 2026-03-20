module.exports = {
  up: async (queryInterface: any, Sequelize: any) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Insert permissions
      const permissions = [
        // Staff Management
        { code: 'admin.staff.create', name: 'Create Staff', category: 'staff', description: 'Create new staff members' },
        { code: 'admin.staff.read', name: 'View Staff', category: 'staff', description: 'View staff information' },
        { code: 'admin.staff.update', name: 'Update Staff', category: 'staff', description: 'Edit staff information' },
        { code: 'admin.staff.delete', name: 'Delete Staff', category: 'staff', description: 'Delete staff members' },
        { code: 'admin.staff.suspend', name: 'Suspend Staff', category: 'staff', description: 'Suspend/deactivate staff' },

        // Role Management
        { code: 'admin.roles.create', name: 'Create Roles', category: 'roles', description: 'Create custom roles' },
        { code: 'admin.roles.read', name: 'View Roles', category: 'roles', description: 'View role information' },
        { code: 'admin.roles.update', name: 'Update Roles', category: 'roles', description: 'Edit role details' },
        { code: 'admin.roles.delete', name: 'Delete Roles', category: 'roles', description: 'Delete custom roles' },
        { code: 'admin.roles.assign', name: 'Assign Roles', category: 'roles', description: 'Assign roles to staff' },

        // Seller Management
        { code: 'admin.sellers.read', name: 'View Sellers', category: 'sellers', description: 'View seller information' },
        { code: 'admin.sellers.approve', name: 'Approve Sellers', category: 'sellers', description: 'Approve seller registrations' },
        { code: 'admin.sellers.reject', name: 'Reject Sellers', category: 'sellers', description: 'Reject seller registrations' },
        { code: 'admin.sellers.update', name: 'Update Sellers', category: 'sellers', description: 'Edit seller information' },
        { code: 'admin.sellers.suspend', name: 'Suspend Sellers', category: 'sellers', description: 'Suspend seller accounts' },

        // User Management
        { code: 'admin.users.read', name: 'View Users', category: 'users', description: 'View user information' },
        { code: 'admin.users.update', name: 'Update Users', category: 'users', description: 'Edit user information' },
        { code: 'admin.users.delete', name: 'Delete Users', category: 'users', description: 'Delete user accounts' },
        { code: 'admin.users.suspend', name: 'Suspend Users', category: 'users', description: 'Suspend user accounts' },

        // Product Management
        { code: 'admin.products.read', name: 'View Products', category: 'products', description: 'View all products' },
        { code: 'admin.products.approve', name: 'Approve Products', category: 'products', description: 'Approve new products' },
        { code: 'admin.products.delete', name: 'Delete Products', category: 'products', description: 'Delete products' },
        { code: 'admin.products.update', name: 'Update Products', category: 'products', description: 'Edit product information' },

        // Inventory Management
        { code: 'admin.inventory.read', name: 'View Inventory', category: 'inventory', description: 'View inventory data' },
        { code: 'admin.inventory.update', name: 'Manage Inventory', category: 'inventory', description: 'Update inventory levels' },
        { code: 'admin.inventory.export', name: 'Export Inventory', category: 'inventory', description: 'Export inventory reports' },

        // Order Management
        { code: 'admin.orders.read', name: 'View Orders', category: 'orders', description: 'View all orders' },
        { code: 'admin.orders.refund', name: 'Process Refunds', category: 'orders', description: 'Process order refunds' },
        { code: 'admin.orders.cancel', name: 'Cancel Orders', category: 'orders', description: 'Cancel orders' },

        // Reports & Analytics
        { code: 'admin.reports.read', name: 'View Reports', category: 'reports', description: 'View analytics and reports' },
        { code: 'admin.reports.export', name: 'Export Reports', category: 'reports', description: 'Export report data' },

        // Audit & Security
        { code: 'admin.audit.read', name: 'View Audit Logs', category: 'audit', description: 'View activity logs' },
        { code: 'admin.settings.read', name: 'View Settings', category: 'settings', description: 'View system settings' },
        { code: 'admin.settings.update', name: 'Update Settings', category: 'settings', description: 'Edit system settings' },
      ];

      const insertedPermissions = await queryInterface.bulkInsert(
        'permissions',
        permissions.map((p) => ({
          id: require('uuid').v4(),
          code: p.code,
          name: p.name,
          category: p.category,
          description: p.description,
          created_at: new Date(),
          updated_at: new Date(),
        })),
        { transaction, returning: true }
      );

      // Get all inserted permission IDs
      const allPermissions = await queryInterface.sequelize.query(
        'SELECT id, code FROM permissions',
        { type: 'SELECT', transaction }
      );

      const permissionMap = (allPermissions as any[]).reduce((acc: Record<string, string>, p) => {
        acc[p.code] = p.id;
        return acc;
      }, {});

      // Define system roles
      const systemRoles = [
        {
          code: 'SUPER_ADMIN',
          name: 'Super Administrator',
          description: 'Full access to all features',
          type: 'admin',
          is_system: true,
          permissions: Object.keys(permissionMap), // All permissions
        },
        {
          code: 'ADMIN_MANAGER',
          name: 'Admin Manager',
          description: 'Manage staff and assign roles',
          type: 'admin',
          is_system: true,
          permissions: [
            'admin.staff.create',
            'admin.staff.read',
            'admin.staff.update',
            'admin.staff.delete',
            'admin.staff.suspend',
            'admin.roles.read',
            'admin.roles.assign',
            'admin.audit.read',
          ],
        },
        {
          code: 'SELLER_MANAGER',
          name: 'Seller Manager',
          description: 'Manage seller registrations and accounts',
          type: 'staff',
          is_system: true,
          permissions: [
            'admin.sellers.read',
            'admin.sellers.approve',
            'admin.sellers.reject',
            'admin.sellers.update',
            'admin.sellers.suspend',
            'admin.users.read',
            'admin.audit.read',
          ],
        },
        {
          code: 'SUPPORT_AGENT',
          name: 'Support Agent',
          description: 'Handle customer support and queries',
          type: 'staff',
          is_system: true,
          permissions: [
            'admin.orders.read',
            'admin.users.read',
            'admin.sellers.read',
            'admin.audit.read',
          ],
        },
        {
          code: 'INVENTORY_MANAGER',
          name: 'Inventory Manager',
          description: 'Manage inventory and stock levels',
          type: 'staff',
          is_system: true,
          permissions: [
            'admin.inventory.read',
            'admin.inventory.update',
            'admin.inventory.export',
            'admin.products.read',
            'admin.audit.read',
          ],
        },
        {
          code: 'REPORTS_ANALYST',
          name: 'Reports Analyst',
          description: 'View and export reports (read-only)',
          type: 'staff',
          is_system: true,
          permissions: [
            'admin.reports.read',
            'admin.reports.export',
            'admin.orders.read',
            'admin.audit.read',
          ],
        },
        {
          code: 'CONTENT_MODERATOR',
          name: 'Content Moderator',
          description: 'Moderate products and seller content',
          type: 'staff',
          is_system: true,
          permissions: [
            'admin.products.read',
            'admin.products.approve',
            'admin.products.delete',
            'admin.products.update',
            'admin.sellers.read',
            'admin.audit.read',
          ],
        },
      ];

      // Insert roles
      for (const role of systemRoles) {
        const result = await queryInterface.sequelize.query(
          `INSERT INTO roles (id, code, name, description, type, is_system, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          {
            bind: [
              require('uuid').v4(),
              role.code,
              role.name,
              role.description,
              role.type,
              role.is_system,
              new Date(),
              new Date(),
            ],
            type: 'INSERT',
            transaction,
          }
        );

        const roleId = (result as any[])[0][0]?.id;

        // Insert role-permission associations
        for (const permCode of role.permissions) {
          const permId = permissionMap[permCode];
          if (permId) {
            await queryInterface.sequelize.query(
              `INSERT INTO role_permissions (id, role_id, permission_id, created_at)
               VALUES ($1, $2, $3, $4)`,
              {
                bind: [require('uuid').v4(), roleId, permId, new Date()],
                type: 'INSERT',
                transaction,
              }
            );
          }
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface: any, Sequelize: any) => {
    // Clear the seeded data
    await queryInterface.sequelize.query('DELETE FROM role_permissions WHERE id IS NOT NULL');
    await queryInterface.sequelize.query('DELETE FROM roles WHERE is_system = true');
    await queryInterface.sequelize.query('DELETE FROM permissions WHERE id IS NOT NULL');
  },
};
