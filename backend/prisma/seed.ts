import { PrismaClient } from '@prisma/client';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';
import mongoManager from '../src/utils/mongoManager';
import '../src/models/mongoModels'; // Import models to register them with Mongoose
import { seedAiContent } from './seed/data/aiContent';
import { seedMarketData } from './seed/data/marketData';
import { users } from './seed/data/users';

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

    // Seed Users with proper password hashing
    const createdUsers = [];
    for (const userData of users) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      let roleToConnect;
      if (userData.role === 'ADMIN') {
        roleToConnect = adminRole;
      } else if (userData.role === 'PROPERTY_MANAGER') {
        roleToConnect = managerRole;
      } else {
        roleToConnect = tenantRole;
      }
      
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          role: userData.role,
          isActive: userData.isActive ?? true,
          roles: { connect: { id: roleToConnect.id } }
        }
      });
      createdUsers.push(user);
    }
    console.log(`Seeded ${createdUsers.length} users.`);
    
    // Get specific users for property relationships
    const adminUser = createdUsers.find(u => u.role === 'ADMIN')!;
    const managerUser = createdUsers.find(u => u.role === 'PROPERTY_MANAGER')!;

    // Seed Properties
    const property1 = await prisma.property.create({
        data: {
            id: 'prop_1',
            name: 'Sunset Apartments',
            address: '123 Main St',
            city: 'San Francisco',
            state: 'CA',
            zipCode: '94102',
            country: 'USA',
            propertyType: 'APARTMENT',
            totalUnits: 50,
            managerId: managerUser.id,
            ownerId: adminUser.id
        }
    });
    const property2 = await prisma.property.create({
        data: {
            id: 'prop_2',
            name: 'Ocean View Condos',
            address: '456 Beach Blvd',
            city: 'Los Angeles',
            state: 'CA',
            zipCode: '90210',
            country: 'USA',
            propertyType: 'CONDO',
            totalUnits: 25,
            managerId: managerUser.id,
            ownerId: adminUser.id
        }
    });
    console.log('Seeded 2 properties.');
    
    // Get tenant users for unit assignments
    const tenantUsers = createdUsers.filter(u => u.role === 'TENANT');

    // Seed Units with relationship to the properties
    const unit1 = await prisma.unit.create({
        data: {
            id: 'unit_1a',
            unitNumber: '1A',
            bedrooms: 2,
            bathrooms: 1,
            size: 850,
            rent: 2500,
            isAvailable: false,
            propertyId: property1.id,
            tenantId: tenantUsers[0]?.id,
        }
    });
    const unit2 = await prisma.unit.create({
        data: {
            id: 'unit_2b',
            unitNumber: '2B',
            bedrooms: 1,
            bathrooms: 1,
            size: 650,
            rent: 2000,
            isAvailable: false,
            propertyId: property1.id,
            tenantId: tenantUsers[1]?.id,
        }
    });
    const unit3 = await prisma.unit.create({
        data: {
            id: 'unit_3c',
            unitNumber: '3C',
            bedrooms: 3,
            bathrooms: 2,
            size: 1200,
            rent: 3200,
            isAvailable: true,
            propertyId: property2.id,
        }
    });
    console.log('Seeded 3 units.');

    // Seed Maintenance Request with relationships
    const maintenanceRequest = await prisma.maintenanceRequest.create({
      data: {
        id: 'maint_req_1',
        title: 'Leaking Faucet',
        description: 'The kitchen faucet has a persistent drip.',
        propertyId: property1.id, // Foreign Key to Property
        unitId: unit1.id,         // Foreign Key to Unit
        requestedById: tenantUsers[0]?.id!, // Foreign Key to User
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
