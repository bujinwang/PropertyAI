import { PrismaClient } from '@prisma/client';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import mongoManager from '../src/utils/mongoManager';
import '../src/models/mongoModels'; // Import models to register them with Mongoose
import { seedAiContent } from './seed/data/aiContent';
import { seedMarketData } from './seed/data/marketData';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../src/config/database.env') });

const prisma = new PrismaClient();

// --- PostgreSQL Seeding ---
async function seedPostgres() {
  console.log('🌱 Starting PostgreSQL database seeding...');
  try {
    // Clear existing data in a specific order to avoid foreign key constraints
    console.log('Clearing existing PostgreSQL data...');
    await prisma.$transaction([
      prisma.permission.deleteMany(),
      prisma.role.deleteMany(),
      prisma.transaction.deleteMany(),
      prisma.notification.deleteMany(),
      prisma.message.deleteMany(),
      prisma.document.deleteMany(),
      prisma.maintenanceRequest.deleteMany(),
      prisma.lease.deleteMany(),
      prisma.unitImage.deleteMany(),
      prisma.unit.deleteMany(),
      prisma.propertyImage.deleteMany(),
      prisma.marketData.deleteMany(),
      prisma.property.deleteMany(),
      prisma.user.deleteMany(),
    ]);
    console.log('PostgreSQL data cleared.');

    // Seed Permissions
    const permissions = await prisma.permission.createManyAndReturn({
        data: [
            { name: 'create:user' },
            { name: 'read:user' },
            { name: 'update:user' },
            { name: 'delete:user' },
            { name: 'create:property' },
            { name: 'read:property' },
            { name: 'update:property' },
            { name: 'delete:property' },
        ]
    });
    console.log(`Seeded ${permissions.length} permissions.`);

    // Seed Roles and associate permissions
    const adminRole = await prisma.role.create({
        data: {
            name: 'ADMIN',
            permissions: {
                connect: permissions.map(p => ({ id: p.id }))
            }
        }
    });

    const managerRole = await prisma.role.create({
        data: {
            name: 'PROPERTY_MANAGER',
            permissions: {
                connect: permissions.filter(p => p.name.includes('property')).map(p => ({ id: p.id }))
            }
        }
    });

    const tenantRole = await prisma.role.create({
        data: {
            name: 'TENANT',
            permissions: {
                connect: [{ id: permissions.find(p => p.name === 'read:property')!.id }]
            }
        }
    });
    console.log('Seeded 3 roles and associated permissions.');

    // Seed Users
    const adminUser = await prisma.user.create({
        data: {
            id: 'user_admin_1', email: 'admin@propertyai.com', password: 'hashed_password_placeholder', firstName: 'Admin', lastName: 'User',
            roles: { connect: { id: adminRole.id } }
        }
    });
    const managerUser = await prisma.user.create({
        data: {
            id: 'user_manager_1', email: 'manager@propertyai.com', password: 'hashed_password_placeholder', firstName: 'Manager', lastName: 'Person',
            roles: { connect: { id: managerRole.id } }
        }
    });
    const tenant1User = await prisma.user.create({
        data: {
            id: 'user_tenant_1', email: 'tenant1@propertyai.com', password: 'hashed_password_placeholder', firstName: 'Jane', lastName: 'Doe',
            roles: { connect: { id: tenantRole.id } }
        }
    });
    const tenant2User = await prisma.user.create({
        data: {
            id: 'user_tenant_2', email: 'tenant2@propertyai.com', password: 'hashed_password_placeholder', firstName: 'John', lastName: 'Smith',
            roles: { connect: { id: tenantRole.id } }
        }
    });
    const users = [adminUser, managerUser, tenant1User, tenant2User];
    console.log(`Seeded ${users.length} users.`);

    // Seed Properties
    const property = await prisma.property.create({
      data: {
        id: 'prop_sunset_1',
        name: 'Sunset Apartments',
        address: '123 Main St',
        city: 'Cityville',
        state: 'CA',
        zipCode: '90001',
        country: 'USA',
        propertyType: 'APARTMENT',
        totalUnits: 10,
        managerId: managerUser.id,
        ownerId: adminUser.id,
      },
    });
    console.log(`Seeded 1 property: "${property.name}".`);

    // Seed Units with relationship to the property
    const unit = await prisma.unit.create({
        data: {
            id: 'unit_101',
            propertyId: property.id,
            unitNumber: '101',
            bedrooms: 2,
            bathrooms: 1.5,
            size: 950,
            isAvailable: false,
            rent: 2200,
        }
    });
    console.log(`Seeded 1 unit: #${unit.unitNumber} for property "${property.name}".`);

    // Seed Maintenance Request with relationships
    const maintenanceRequest = await prisma.maintenanceRequest.create({
      data: {
        id: 'maint_req_1',
        title: 'Leaking Faucet',
        description: 'The kitchen faucet has a persistent drip.',
        propertyId: property.id, // Foreign Key to Property
        unitId: unit.id,         // Foreign Key to Unit
        requestedById: users.find(u => u.email === 'tenant1@propertyai.com')?.id!, // Foreign Key to User
        status: 'OPEN',
      },
    });
    console.log(`Seeded 1 maintenance request: "${maintenanceRequest.title}".`);

    console.log('✅ PostgreSQL database seeding completed successfully.');
  } catch (error) {
    console.error('❌ Error seeding PostgreSQL database:', error);
    throw error; // Propagate error to exit process
  }
}

// --- MongoDB Seeding ---
async function seedMongo() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in your environment variables.');
  }
  
  console.log('🌱 Starting MongoDB database seeding...');
  
  try {
    console.log(`Connecting to MongoDB at ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connection successful.');

    await mongoManager.initializeDatabase();

    // Seed AI Content from the new script
    await seedAiContent();

    console.log('Creating MongoDB indexes...');
    await mongoManager.createIndexes();
    console.log('MongoDB indexes created.');

    console.log('✅ MongoDB database seeding completed successfully.');
  } catch (error) {
    console.error('❌ Error seeding MongoDB database:', error);
    throw error; // Propagate error
  }
}

// --- Main Orchestration ---
async function main() {
  try {
    await seedPostgres();
    await seedMarketData();
    await seedMongo();
  } catch (error) {
    console.error('🔥 A critical error occurred during the seeding process. Halting execution.', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await mongoose.disconnect();
    console.log('Database connections closed.');
  }
}

main().catch((e) => {
  console.error('🚨 Unhandled exception in main execution:', e);
  process.exit(1);
});
