import { PrismaClient } from "@prisma/client";
import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";
import mongoManager from "../src/utils/mongoManager";
import "../src/models/mongoModels"; // Import models to register them with Mongoose
import { seedAiContent } from "./seed/data/aiContent";
import { seedMarketData } from "./seed/data/marketData";
import { users } from "./seed/data/users";
import { properties } from "./seed/data/properties";
import { units } from "./seed/data/units";
import { leases } from "./seed/data/leases";
import { maintenanceRequests } from "./seed/data/maintenanceRequests";
import { messages } from "./seed/data/messages";
import { notifications } from "./seed/data/notifications";
import { listings } from "./seed/data/listings";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../src/config/database.env") });

const prisma = new PrismaClient();

// --- PostgreSQL Seeding ---
async function seedPostgres() {
  console.log("🌱 Starting PostgreSQL database seeding...");
  try {
    // Clear existing data in a specific order to avoid foreign key constraints
    console.log("Clearing existing PostgreSQL data...");
    await prisma.$transaction([
      // Delete in reverse dependency order
      prisma.listingImage.deleteMany(),
      prisma.listing.deleteMany(),
      prisma.application.deleteMany(),
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
    console.log("PostgreSQL data cleared.");

    // Seed Permissions
    const permissions = await prisma.permission.createManyAndReturn({
      data: [
        { name: "create:user" },
        { name: "read:user" },
        { name: "update:user" },
        { name: "delete:user" },
        { name: "create:property" },
        { name: "read:property" },
        { name: "update:property" },
        { name: "delete:property" },
      ],
    });
    console.log(`Seeded ${permissions.length} permissions.`);

    // Seed Roles and associate permissions
    const adminRole = await prisma.role.create({
      data: {
        name: "ADMIN",
        permissions: {
          connect: permissions.map((p) => ({ id: p.id })),
        },
      },
    });

    const managerRole = await prisma.role.create({
      data: {
        name: "PROPERTY_MANAGER",
        permissions: {
          connect: permissions
            .filter((p) => p.name.includes("property"))
            .map((p) => ({ id: p.id })),
        },
      },
    });

    const tenantRole = await prisma.role.create({
      data: {
        name: "TENANT",
        permissions: {
          connect: [
            { id: permissions.find((p) => p.name === "read:property")!.id },
          ],
        },
      },
    });
    console.log("Seeded 3 roles and associated permissions.");

    // Seed Users with proper password hashing
    const createdUsers = [];
    for (const userData of users) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      let roleToConnect;
      if (userData.role === "ADMIN") {
        roleToConnect = adminRole;
      } else if (userData.role === "PROPERTY_MANAGER") {
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
          roles: { connect: { id: roleToConnect.id } },
        },
      });
      createdUsers.push(user);
    }
    console.log(`Seeded ${createdUsers.length} users.`);

    // Get specific users for property relationships
    const adminUser = createdUsers.find((u) => u.role === "ADMIN")!;
    const managerUser = createdUsers.find(
      (u) => u.role === "PROPERTY_MANAGER"
    )!;

    // Seed Properties using comprehensive data
    const createdProperties = [];
    for (const propertyData of properties) {
      // Find manager and owner by their position in the users array
      const manager = createdUsers.find((u) => u.role === "PROPERTY_MANAGER");
      const owner = createdUsers.find((u) => u.role === "ADMIN");

      if (!manager || !owner) {
        throw new Error(
          "Manager or owner user not found for property creation"
        );
      }

      const property = await prisma.property.create({
        data: {
          ...propertyData,
          managerId: manager.id,
          ownerId: owner.id,
        },
      });
      createdProperties.push(property);
    }
    console.log(`Seeded ${createdProperties.length} properties.`);

    // Seed Units using comprehensive data
    const tenantUsers = createdUsers.filter((u) => u.role === "TENANT");
    const createdUnits = [];

    for (const unitData of units) {
      // Map property references to actual property IDs
      const propertyIndex = parseInt(unitData.propertyId) - 1;
      const property = createdProperties[propertyIndex];

      if (!property) {
        console.warn(
          `Property not found for unit ${unitData.unitNumber}, skipping...`
        );
        continue;
      }

      // Map tenant references to actual tenant IDs
      let tenantId = null;
      if (unitData.tenantId) {
        const tenantIndex = parseInt(unitData.tenantId) - 4; // Tenant IDs start from 4
        const tenant = tenantUsers[tenantIndex];
        tenantId = tenant?.id || null;
      }

      const unit = await prisma.unit.create({
        data: {
          unitNumber: unitData.unitNumber,
          floorNumber: unitData.floorNumber,
          size: unitData.size,
          bedrooms: unitData.bedrooms,
          bathrooms: unitData.bathrooms,
          rent: unitData.rent,
          deposit: unitData.deposit,
          isAvailable: unitData.isAvailable ?? true,
          dateAvailable: unitData.dateAvailable
            ? new Date(unitData.dateAvailable)
            : null,
          features: unitData.features,
          propertyId: property.id,
          tenantId: tenantId,
        },
      });
      createdUnits.push(unit);
    }
    console.log(`Seeded ${createdUnits.length} units.`);

    // Seed Leases for occupied units
    const createdLeases = [];
    for (const leaseData of leases) {
      // Find the unit by matching the lease unitId to our created units
      const unitIndex = parseInt(leaseData.unitId) - 1;
      const unit = createdUnits[unitIndex];

      if (!unit || !unit.tenantId) {
        console.warn(`Unit or tenant not found for lease, skipping...`);
        continue;
      }

      const lease = await prisma.lease.create({
        data: {
          startDate: new Date(leaseData.startDate),
          endDate: new Date(leaseData.endDate),
          rentAmount: leaseData.rentAmount,
          securityDeposit: leaseData.securityDeposit,
          leaseTerms: leaseData.leaseTerms,
          status: leaseData.status,
          signedDate: leaseData.signedDate
            ? new Date(leaseData.signedDate)
            : new Date(),
          renewalDate: leaseData.renewalDate
            ? new Date(leaseData.renewalDate)
            : null,
          unitId: unit.id,
          tenantId: unit.tenantId,
        },
      });
      createdLeases.push(lease);
    }
    console.log(`Seeded ${createdLeases.length} leases.`);

    // Seed Maintenance Requests using comprehensive data
    const createdMaintenanceRequests = [];
    for (const requestData of maintenanceRequests) {
      // Map property and unit references
      const propertyIndex = parseInt(requestData.propertyId) - 1;
      const unitIndex = parseInt(requestData.unitId) - 1;
      const requesterIndex = parseInt(requestData.requestedById) - 4; // Tenant IDs start from 4

      const property = createdProperties[propertyIndex];
      const unit = createdUnits[unitIndex];
      const requester = tenantUsers[requesterIndex];

      if (!property || !unit || !requester) {
        console.warn(
          `Property, unit, or requester not found for maintenance request "${requestData.title}", skipping...`
        );
        continue;
      }

      const maintenanceRequest = await prisma.maintenanceRequest.create({
        data: {
          title: requestData.title,
          description: requestData.description,
          status: requestData.status,
          priority: requestData.priority,
          createdAt: requestData.createdAt
            ? new Date(requestData.createdAt)
            : new Date(),
          scheduledDate: requestData.scheduledDate
            ? new Date(requestData.scheduledDate)
            : null,
          completedDate: requestData.completedDate
            ? new Date(requestData.completedDate)
            : null,
          notes: requestData.notes,
          estimatedCost: requestData.estimatedCost,
          actualCost: requestData.actualCost,
          propertyId: property.id,
          unitId: unit.id,
          requestedById: requester.id,
        },
      });
      createdMaintenanceRequests.push(maintenanceRequest);
    }
    console.log(
      `Seeded ${createdMaintenanceRequests.length} maintenance requests.`
    );

    // Seed Messages
    const createdMessages = [];
    for (const messageData of messages) {
      // Map sender references
      const senderIndex = parseInt(messageData.senderId) - 1;
      const sender = createdUsers[senderIndex];

      if (!sender) {
        console.warn(`Sender not found for message, skipping...`);
        continue;
      }

      // Map maintenance request references if present
      let maintenanceRequestId = null;
      if (messageData.maintenanceRequestId) {
        const requestIndex = parseInt(messageData.maintenanceRequestId) - 1;
        const request = createdMaintenanceRequests[requestIndex];
        maintenanceRequestId = request?.id || null;
      }

      // For messages, we need to determine the receiver
      // For maintenance-related messages, alternate between tenant and manager
      let receiverId;
      if (maintenanceRequestId) {
        const request = createdMaintenanceRequests.find(
          (r) => r.id === maintenanceRequestId
        );
        if (request) {
          // If sender is tenant, receiver is manager; if sender is manager, receiver is tenant
          if (sender.role === "TENANT") {
            receiverId = createdUsers.find(
              (u) => u.role === "PROPERTY_MANAGER"
            )?.id;
          } else {
            receiverId = request.requestedById;
          }
        }
      }

      if (!receiverId) {
        console.warn(`Receiver not found for message, skipping...`);
        continue;
      }

      const message = await prisma.message.create({
        data: {
          content: messageData.content,
          sentAt: messageData.createdAt
            ? new Date(messageData.createdAt)
            : new Date(),
          readAt: messageData.readAt ? new Date(messageData.readAt) : null,
          senderId: sender.id,
          receiverId: receiverId,
          maintenanceRequestId: maintenanceRequestId,
        },
      });
      createdMessages.push(message);
    }
    console.log(`Seeded ${createdMessages.length} messages.`);

    // Seed Notifications
    const createdNotifications = [];
    for (const notificationData of notifications) {
      // Map user references
      const userIndex = parseInt(notificationData.userId) - 1;
      const user = createdUsers[userIndex];

      if (!user) {
        console.warn(`User not found for notification, skipping...`);
        continue;
      }

      const notification = await prisma.notification.create({
        data: {
          message: notificationData.message,
          type: notificationData.type,
          createdAt: notificationData.createdAt
            ? new Date(notificationData.createdAt)
            : new Date(),
          isRead: notificationData.isRead ?? false,
          userId: user.id,
          link: notificationData.link,
        },
      });
      createdNotifications.push(notification);
    }
    console.log(`Seeded ${createdNotifications.length} notifications.`);

    // Seed Listings for available units
    const createdListings = [];
    for (const listingData of listings) {
      // Map property and unit references
      const propertyIndex = parseInt(listingData.propertyId) - 1;
      const property = createdProperties[propertyIndex];

      if (!property) {
        console.warn(
          `Property not found for listing "${listingData.title}", skipping...`
        );
        continue;
      }

      // Map unit reference if present
      let unitId = null;
      if (listingData.unitId) {
        const unitIndex = parseInt(listingData.unitId) - 1;
        const unit = createdUnits[unitIndex];
        unitId = unit?.id || null;
      }

      // Map creator reference
      const creatorIndex = parseInt(listingData.createdById) - 1;
      const creator = createdUsers[creatorIndex];

      if (!creator) {
        console.warn(
          `Creator not found for listing "${listingData.title}", skipping...`
        );
        continue;
      }

      const listing = await prisma.listing.create({
        data: {
          title: listingData.title,
          description: listingData.description,
          rent: listingData.rent,
          availableDate: new Date(listingData.availableDate),
          leaseTerms: listingData.leaseTerms,
          isActive: listingData.isActive ?? true,
          status: listingData.status || "ACTIVE",
          viewCount: listingData.viewCount || 0,
          propertyId: property.id,
          unitId: unitId,
          createdById: creator.id,
        },
      });
      createdListings.push(listing);
    }
    console.log(`Seeded ${createdListings.length} listings.`);

    console.log("✅ PostgreSQL database seeding completed successfully.");
  } catch (error) {
    console.error("❌ Error seeding PostgreSQL database:", error);
    throw error; // Propagate error to exit process
  }
}

// --- MongoDB Seeding ---
async function seedMongo() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is not defined in your environment variables."
    );
  }

  console.log("🌱 Starting MongoDB database seeding...");

  try {
    console.log(`Connecting to MongoDB at ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connection successful.");

    await mongoManager.initializeDatabase();

    // Seed AI Content from the new script
    await seedAiContent();

    console.log("Creating MongoDB indexes...");
    await mongoManager.createIndexes();
    console.log("MongoDB indexes created.");

    console.log("✅ MongoDB database seeding completed successfully.");
  } catch (error) {
    console.error("❌ Error seeding MongoDB database:", error);
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
    console.error(
      "🔥 A critical error occurred during the seeding process. Halting execution.",
      error
    );
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await mongoose.disconnect();
    console.log("Database connections closed.");
  }
}

main().catch((e) => {
  console.error("🚨 Unhandled exception in main execution:", e);
  process.exit(1);
});
