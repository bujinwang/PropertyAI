import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { users } from "./seed/data/users";
import { properties } from "./seed/data/properties";
import { units } from "./seed/data/units";
import { leases } from "./seed/data/leases";
import { maintenanceRequests } from "./seed/data/maintenanceRequests";

const prisma = new PrismaClient();

function getVendorSpecialty(email: string): string {
  if (email.includes("plumber")) return "PLUMBING";
  if (email.includes("electrician")) return "ELECTRICAL";
  if (email.includes("hvac")) return "HVAC";
  if (email.includes("carpenter")) return "CARPENTRY";
  if (email.includes("painter")) return "PAINTING";
  if (email.includes("landscaper")) return "LANDSCAPING";
  if (email.includes("cleaner")) return "CLEANING";
  if (email.includes("handyman")) return "GENERAL_MAINTENANCE";
  return "GENERAL_MAINTENANCE";
}

async function seedPostgreSQL() {
  console.log("🌱 Starting PostgreSQL database seeding...");
  try {
    // Clear existing data in a specific order to avoid foreign key constraints
    console.log("Clearing existing PostgreSQL data...");
    await prisma.$transaction([
      // Delete in reverse dependency order
      prisma.application.deleteMany(),
      prisma.permission.deleteMany(),
      prisma.role.deleteMany(),
      prisma.transaction.deleteMany(),
      prisma.notification.deleteMany(),
      prisma.message.deleteMany(),
      prisma.document.deleteMany(),
      prisma.maintenanceRequest.deleteMany(),
      prisma.lease.deleteMany(),
      prisma.rentalImage.deleteMany(),
      prisma.rental.deleteMany(),
      prisma.marketData.deleteMany(),
      prisma.vendor.deleteMany(),
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
        Permission: {
          connect: permissions.map((p) => ({ id: p.id })),
        },
      },
    });

    const managerRole = await prisma.role.create({
      data: {
        name: "PROPERTY_MANAGER",
        Permission: {
          connect: permissions
            .filter((p) => p.name.includes("property"))
            .map((p) => ({ id: p.id })),
        },
      },
    });

    const tenantRole = await prisma.role.create({
      data: {
        name: "TENANT",
        Permission: {
          connect: [
            { id: permissions.find((p) => p.name === "read:property")!.id },
          ],
        },
      },
    });

    const vendorRole = await prisma.role.create({
      data: {
        name: "VENDOR",
        Permission: {
          connect: [
            { id: permissions.find((p) => p.name === "read:property")!.id },
          ],
        },
      },
    });
    console.log("Seeded 4 roles and associated permissions.");

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
      } else if (userData.role === "VENDOR") {
        roleToConnect = vendorRole;
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
          Role: { connect: { id: roleToConnect.id } },
        },
      });
      createdUsers.push(user);
    }
    console.log(`Seeded ${createdUsers.length} users.`);

    // Create Vendor records for VENDOR role users
    const vendorUsers = createdUsers.filter((u) => u.role === "VENDOR");
    const createdVendors = [];

    for (const vendorUser of vendorUsers) {
      const vendor = await prisma.vendor.create({
        data: {
          name: `${vendorUser.firstName} ${vendorUser.lastName}`,
          contactPersonId: vendorUser.id,
          phone: vendorUser.phone || '555-000-0000',
          email: vendorUser.email,
          address: '123 Contractor St, City, State 12345',
          specialty: getVendorSpecialty(vendorUser.email),
          certifications: ['Licensed', 'Insured'],
          hourlyRate: 75.0,
          serviceAreas: ['Downtown', 'Suburbs'],
          availability: 'AVAILABLE',
        },
      });
      createdVendors.push(vendor);
    }
    console.log(`Seeded ${createdVendors.length} vendors.`);

    // Get specific users for rental relationships
    const adminUser = createdUsers.find((u) => u.role === "ADMIN")!;
    const managerUser = createdUsers.find(
      (u) => u.role === "PROPERTY_MANAGER"
    )!;
    const tenantUsers = createdUsers.filter((u) => u.role === "TENANT");

    // Seed Rentals by combining property and unit data
    const createdRentals: any[] = [];
    
    // Create rentals from properties and units data
    for (let i = 0; i < properties.length; i++) {
      const propertyData = properties[i];
      const relatedUnits = units.filter(unit => parseInt(unit.propertyId) === i + 1);
      
      if (relatedUnits.length === 0) {
        // Property without units - create a single rental
        const rental = await prisma.rental.create({
          data: {
            title: propertyData.name,
            description: propertyData.description || `Beautiful ${propertyData.propertyType.toLowerCase()} property`,
            address: propertyData.address,
            city: propertyData.city,
            state: propertyData.state,
            zipCode: propertyData.zipCode,
            country: propertyData.country || 'USA',
            latitude: propertyData.latitude,
            longitude: propertyData.longitude,
            propertyType: propertyData.propertyType,
            yearBuilt: propertyData.yearBuilt,
            totalUnits: propertyData.totalUnits || 1,
            amenities: propertyData.amenities,
            rent: 2000, // Default rent
            deposit: 2000, // Default deposit
            isAvailable: true,
            status: 'ACTIVE',
            slug: `${propertyData.name.toLowerCase().replace(/\s+/g, '-')}-${i + 1}`,
            managerId: managerUser.id,
            ownerId: adminUser.id,
            createdById: adminUser.id,
          },
        });
        createdRentals.push(rental);
      } else {
        // Property with units - create a rental for each unit
        for (const unitData of relatedUnits) {
          const rental = await prisma.rental.create({
            data: {
              title: `${propertyData.name} - Unit ${unitData.unitNumber}`,
              description: propertyData.description || `Beautiful ${propertyData.propertyType.toLowerCase()} unit`,
              address: propertyData.address,
              city: propertyData.city,
              state: propertyData.state,
              zipCode: propertyData.zipCode,
              country: propertyData.country || 'USA',
              latitude: propertyData.latitude,
              longitude: propertyData.longitude,
              propertyType: propertyData.propertyType,
              yearBuilt: propertyData.yearBuilt,
              totalUnits: propertyData.totalUnits || 1,
              amenities: { ...propertyData.amenities, ...unitData.features },
              unitNumber: unitData.unitNumber,
              floorNumber: unitData.floorNumber,
              size: unitData.size,
              bedrooms: unitData.bedrooms,
              bathrooms: unitData.bathrooms,
              rent: unitData.rent || 2000, // Provide default if undefined
              deposit: unitData.deposit,
              availableDate: unitData.dateAvailable ? new Date(unitData.dateAvailable) : null,
              isAvailable: unitData.isAvailable ?? true,
              status: 'ACTIVE',
              slug: `${propertyData.name.toLowerCase().replace(/\s+/g, '-')}-unit-${unitData.unitNumber}-${createdRentals.length + 1}`,
              managerId: managerUser.id,
              ownerId: adminUser.id,
              createdById: adminUser.id,
            },
          });
          createdRentals.push(rental);
        }
      }
    }
    console.log(`Seeded ${createdRentals.length} rentals.`);

    // Seed Leases for occupied rentals
    const createdLeases = [];
    for (const leaseData of leases) {
      // Find the rental by matching the lease unitId to our created rentals
      const unitIndex = parseInt(leaseData.unitId) - 1;
      const unitData = units[unitIndex];
      const rental = createdRentals.find(r => r.unitNumber === unitData?.unitNumber);

      if (!rental) {
        console.warn(`Rental not found for lease, skipping...`);
        continue;
      }

      // Find tenant
      if (!unitData?.tenantId) {
        console.warn(`Tenant not found for lease, skipping...`);
        continue;
      }

      const tenantUserIndex = parseInt(unitData.tenantId) - 4;
      const tenant = tenantUsers[tenantUserIndex];
      if (!tenant) {
        console.warn(`Tenant user not found for lease, skipping...`);
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
          rentalId: rental.id,
          tenantId: tenant.id,
        },
      });
      createdLeases.push(lease);
    }
    console.log(`Seeded ${createdLeases.length} leases.`);

    // Seed Maintenance Requests using comprehensive data
    const createdMaintenanceRequests = [];
    for (const requestData of maintenanceRequests) {
      // Map rental references
      const unitIndex = parseInt(requestData.unitId) - 1;
      const unitData = units[unitIndex];
      const rental = createdRentals.find(r => r.unitNumber === unitData?.unitNumber);
      
      const requesterIndex = parseInt(requestData.requestedById) - 4; // Tenant IDs start from 4
      const requester = tenantUsers[requesterIndex];

      if (!rental || !requester) {
        console.warn(
          `Rental or requester not found for maintenance request "${requestData.title}", skipping...`
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
          rentalId: rental.id,
          requestedById: requester.id,
        },
      });
      createdMaintenanceRequests.push(maintenanceRequest);
    }
    console.log(
      `Seeded ${createdMaintenanceRequests.length} maintenance requests.`
    );

    // Seed Market Data
    const marketDataItems = [
      {
        location: "San Francisco, CA",
        averageRent: 3500.00,
        vacancyRate: 0.05,
        bedrooms: 1,
        propertyType: "APARTMENT" as const,
        dataDate: new Date('2025-01-01'),
      },
      {
        location: "San Francisco, CA",
        averageRent: 4200.00,
        vacancyRate: 0.04,
        bedrooms: 2,
        propertyType: "APARTMENT" as const,
        dataDate: new Date('2025-01-01'),
      },
      {
        location: "New York, NY",
        averageRent: 3200.00,
        vacancyRate: 0.06,
        bedrooms: 1,
        propertyType: "APARTMENT" as const,
        dataDate: new Date('2025-01-01'),
      },
    ];

    const createdMarketData = [];
    for (const marketDataItem of marketDataItems) {
      const marketDataRecord = await prisma.marketData.create({
        data: {
          location: marketDataItem.location,
          averageRent: marketDataItem.averageRent,
          vacancyRate: marketDataItem.vacancyRate,
          bedrooms: marketDataItem.bedrooms,
          propertyType: marketDataItem.propertyType,
          dataDate: marketDataItem.dataDate,
        },
      });
      createdMarketData.push(marketDataRecord);
    }
    console.log(`Seeded ${createdMarketData.length} market data records.`);

    console.log("✅ PostgreSQL database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding PostgreSQL database:", error);
    throw error;
  }
}

async function main() {
  await seedPostgreSQL();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
