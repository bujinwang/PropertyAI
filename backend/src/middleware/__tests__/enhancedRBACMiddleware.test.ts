import { enhancedRBACService } from '../enhancedRBACMiddleware';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

describe('EnhancedRBACService', () => {
  beforeEach(async () => {
    // Clear test data
    await prisma.permission.deleteMany();
    await prisma.role.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('checkPermission', () => {
    it('should allow admin access to all resources', async () => {
      const user = {
        id: 'admin-user',
        role: UserRole.ADMIN,
      } as any;

      const hasPermission = await enhancedRBACService.checkPermission(user, {
        resource: 'users',
        action: 'delete',
      });

      expect(hasPermission).toBe(true);
    });

    it('should allow property manager to manage properties', async () => {
      const user = {
        id: 'pm-user',
        role: UserRole.PROPERTY_MANAGER,
      } as any;

      const hasPermission = await enhancedRBACService.checkPermission(user, {
        resource: 'properties',
        action: 'create',
      });

      expect(hasPermission).toBe(true);
    });

    it('should deny tenant access to admin resources', async () => {
      const user = {
        id: 'tenant-user',
        role: UserRole.TENANT,
      } as any;

      const hasPermission = await enhancedRBACService.checkPermission(user, {
        resource: 'users',
        action: 'delete',
      });

      expect(hasPermission).toBe(false);
    });
  });

  describe('checkOwnership', () => {
    it('should allow user to access their own profile', async () => {
      const user = {
        id: 'user-123',
        role: UserRole.TENANT,
      } as any;

      const hasOwnership = await enhancedRBACService.checkOwnership(user, 'tenant', 'user-123');
      expect(hasOwnership).toBe(true);
    });

    it('should deny user access to another user profile', async () => {
      const user = {
        id: 'user-123',
        role: UserRole.TENANT,
      } as any;

      const hasOwnership = await enhancedRBACService.checkOwnership(user, 'tenant', 'user-456');
      expect(hasOwnership).toBe(false);
    });
  });

  describe('role management', () => {
    it('should create role with permissions', async () => {
      // Create permissions first
      const perm1 = await prisma.permission.create({
        data: { name: 'properties:read', description: 'Read properties' }
      });
      const perm2 = await prisma.permission.create({
        data: { name: 'properties:create', description: 'Create properties' }
      });

      const role = await enhancedRBACService.createRole('Property Viewer', [perm1.id, perm2.id]);

      expect(role.name).toBe('Property Viewer');
      expect(role.Permission).toHaveLength(2);
    });

    it('should assign role to user', async () => {
      // Create user and role
      const user = await prisma.user.create({
        data: {
          email: 'assign@example.com',
          password: 'hashed',
          firstName: 'Assign',
          lastName: 'Test',
          role: UserRole.TENANT,
        }
      });

      const role = await prisma.role.create({
        data: { name: 'Test Role' }
      });

      await enhancedRBACService.assignRoleToUser(user.id, role.id);

      // Verify assignment
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { Role: true }
      });

      expect(updatedUser?.Role).toContainEqual(expect.objectContaining({ id: role.id }));
    });

    it('should remove role from user', async () => {
      // Create user and role
      const user = await prisma.user.create({
        data: {
          email: 'remove@example.com',
          password: 'hashed',
          firstName: 'Remove',
          lastName: 'Test',
          role: UserRole.TENANT,
        }
      });

      const role = await prisma.role.create({
        data: { name: 'Test Role to Remove' }
      });

      // Assign role
      await prisma.user.update({
        where: { id: user.id },
        data: {
          Role: {
            connect: { id: role.id }
          }
        }
      });

      // Remove role
      await enhancedRBACService.removeRoleFromUser(user.id, role.id);

      // Verify removal
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { Role: true }
      });

      expect(updatedUser?.Role).not.toContainEqual(expect.objectContaining({ id: role.id }));
    });
  });

  describe('permission management', () => {
    it('should create permission', async () => {
      const permission = await enhancedRBACService.createPermission(
        'test:permission',
        'Test permission description'
      );

      expect(permission.name).toBe('test:permission');
      expect(permission.description).toBe('Test permission description');
    });

    it('should get all permissions', async () => {
      await prisma.permission.create({
        data: { name: 'perm1', description: 'Permission 1' }
      });
      await prisma.permission.create({
        data: { name: 'perm2', description: 'Permission 2' }
      });

      const permissions = await enhancedRBACService.getAllPermissions();
      expect(permissions).toHaveLength(2);
    });
  });

  describe('getUserPermissions', () => {
    it('should get user permissions from roles', async () => {
      // Create user
      const user = await prisma.user.create({
        data: {
          email: 'perms@example.com',
          password: 'hashed',
          firstName: 'Perms',
          lastName: 'Test',
          role: UserRole.TENANT,
        }
      });

      // Create role with permissions
      const perm = await prisma.permission.create({
        data: { name: 'properties:read' }
      });

      const role = await prisma.role.create({
        data: {
          name: 'Property Reader',
          Permission: {
            connect: { id: perm.id }
          }
        }
      });

      // Assign role to user
      await prisma.user.update({
        where: { id: user.id },
        data: {
          Role: {
            connect: { id: role.id }
          }
        }
      });

      const permissions = await enhancedRBACService.getUserPermissions(user.id);

      expect(permissions).toContainEqual({
        resource: 'properties',
        action: 'read',
      });
    });
  });
});