import { PrismaClient, UserRole } from '@prisma/client';
import { config } from 'dotenv';

config();

const prisma = new PrismaClient();

// Define rental permissions structure
const rentalPermissions = [
  {
    resource: 'rental',
    actions: ['create', 'read', 'update', 'delete'],
    roles: ['ADMIN', 'PROPERTY_MANAGER', 'OWNER']
  },
  {
    resource: 'rental_public',
    actions: ['read'],
    roles: ['ADMIN', 'PROPERTY_MANAGER', 'OWNER', 'TENANT', 'USER', 'VENDOR']
  },
  {
    resource: 'rental_stats',
    actions: ['read'],
    roles: ['ADMIN', 'PROPERTY_MANAGER', 'OWNER']
  },
  {
    resource: 'rental_availability',
    actions: ['update'],
    roles: ['ADMIN', 'PROPERTY_MANAGER', 'OWNER']
  },
  {
    resource: 'rental_status',
    actions: ['update'],
    roles: ['ADMIN', 'PROPERTY_MANAGER']
  }
];

class PermissionUpdateService {
  async updateRentalPermissions() {
    console.log('🔐 Updating user permissions for Rental system');
    console.log('=' .repeat(60));

    try {
      // Create or update permissions
      for (const permissionGroup of rentalPermissions) {
        for (const action of permissionGroup.actions) {
          const permissionName = `${permissionGroup.resource}:${action}`;
          
          // Create or update the permission
          const permission = await prisma.permission.upsert({
            where: { name: permissionName },
            update: {
              description: `${action.charAt(0).toUpperCase() + action.slice(1)} ${permissionGroup.resource}`,
              updatedAt: new Date()
            },
            create: {
              id: `perm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: permissionName,
              description: `${action.charAt(0).toUpperCase() + action.slice(1)} ${permissionGroup.resource}`,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });

          console.log(`✅ Permission created/updated: ${permissionName}`);

          // Assign permission to roles
          for (const roleName of permissionGroup.roles) {
            try {
              // Find or create the role
              const role = await prisma.role.upsert({
                where: { name: roleName },
                update: {
                  updatedAt: new Date()
                },
                create: {
                  id: `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  name: roleName,
                  createdAt: new Date(),
                  updatedAt: new Date()
                }
              });

              // Check if permission is already connected to role
              const existingConnection = await prisma.role.findFirst({
                where: {
                  id: role.id,
                  Permission: {
                    some: {
                      id: permission.id
                    }
                  }
                }
              });

              if (!existingConnection) {
                // Connect permission to role
                await prisma.role.update({
                  where: { id: role.id },
                  data: {
                    Permission: {
                      connect: { id: permission.id }
                    }
                  }
                });
                console.log(`  → Assigned to role: ${roleName}`);
              } else {
                console.log(`  → Already assigned to role: ${roleName}`);
              }

            } catch (error) {
              console.error(`❌ Failed to assign permission to role ${roleName}:`, error);
            }
          }
        }
      }

      // Update existing users with rental permissions
      await this.updateExistingUsers();

      console.log('\n🎉 Permission update completed successfully!');

    } catch (error) {
      console.error('❌ Permission update failed:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  private async updateExistingUsers() {
    console.log('\n👥 Updating existing users with rental permissions');
    console.log('-' .repeat(40));

    const users = await prisma.user.findMany();

    for (const user of users) {
      try {
        // Check user's current role (using the single role field)
        const userRole = user.role;
        
        // If user has property management roles, they already have rental access
        if (userRole === 'PROPERTY_MANAGER' || userRole === 'OWNER') {
          console.log(`✅ User ${user.email} already has rental access via ${userRole} role`);
        } else if (userRole === 'ADMIN') {
          console.log(`✅ User ${user.email} has admin access (includes all rental permissions)`);
        } else if (userRole === 'TENANT' || userRole === 'USER' || userRole === 'VENDOR') {
          console.log(`✅ User ${user.email} has ${userRole} role (basic rental access)`);
        } else {
          // This shouldn't happen with the current enum, but just in case
          console.log(`⚠️  User ${user.email} has unknown role: ${userRole}`);
        }

        // Also ensure the user has a corresponding Role record for the permission system
        const roleRecord = await prisma.role.findUnique({
          where: { name: userRole }
        });

        if (roleRecord) {
          // Check if user is already connected to this role record
          const userRoleConnection = await prisma.user.findFirst({
            where: {
              id: user.id,
              Role: {
                some: {
                  id: roleRecord.id
                }
              }
            }
          });

          if (!userRoleConnection) {
            // Connect user to the role record for permission system
            await prisma.user.update({
              where: { id: user.id },
              data: {
                Role: {
                  connect: { id: roleRecord.id }
                }
              }
            });
            console.log(`  → Connected user ${user.email} to ${userRole} role record`);
          }
        }

      } catch (error) {
        console.error(`❌ Failed to update user ${user.email}:`, error);
      }
    }
  }

  async createRentalMiddleware() {
    console.log('\n🛡️  Creating rental permission middleware');
    
    // This would be used in your rental routes
    const middlewareCode = `
// Rental Permission Middleware
export const rentalPermissions = {
  canCreate: requirePermission('rental:create'),
  canRead: requirePermission('rental:read'),
  canUpdate: requirePermission('rental:update'),
  canDelete: requirePermission('rental:delete'),
  canViewStats: requirePermission('rental_stats:read'),
  canUpdateAvailability: requirePermission('rental_availability:update'),
  canUpdateStatus: requirePermission('rental_status:update'),
  canViewPublic: requirePermission('rental_public:read'),
};

// Usage in routes:
// router.get('/rentals', rentalPermissions.canRead, getRentals);
// router.post('/rentals', rentalPermissions.canCreate, createRental);
// router.put('/rentals/:id', rentalPermissions.canUpdate, updateRental);
// router.delete('/rentals/:id', rentalPermissions.canDelete, deleteRental);
`;

    console.log('📝 Rental permission middleware template:');
    console.log(middlewareCode);
  }
}

async function main() {
  const permissionService = new PermissionUpdateService();
  await permissionService.updateRentalPermissions();
  await permissionService.createRentalMiddleware();
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Permission update failed:', error);
    process.exit(1);
  });
}

export { PermissionUpdateService };