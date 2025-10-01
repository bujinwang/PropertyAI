import { PrismaClient, UserRole, MaintenanceStatus, Priority, TransactionType, TransactionStatus, PropertyType, ListingStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seedEnhancedData() {
  console.log("🌱 Starting enhanced database seeding...");

  try {
    // Get existing users to build relationships
    const existingUsers = await prisma.user.findMany();
    const adminUser = existingUsers.find(u => u.role === UserRole.ADMIN);
    const managerUsers = existingUsers.filter(u => u.role === UserRole.PROPERTY_MANAGER);
    const tenantUsers = existingUsers.filter(u => u.role === UserRole.TENANT);
    const vendorUsers = existingUsers.filter(u => u.role === UserRole.VENDOR);

    if (!adminUser || managerUsers.length === 0) {
      throw new Error("Base users not found. Please run the basic seed first.");
    }

    // Create additional users
    console.log("Creating additional users...");
    const additionalUsers = [];
    const userPasswords = await Promise.all([
      bcrypt.hash("Password123!", 10),
      bcrypt.hash("Password123!", 10),
      bcrypt.hash("Password123!", 10),
      bcrypt.hash("Password123!", 10),
      bcrypt.hash("Password123!", 10),
    ]);

    // Additional property managers (check for existing emails)
    const newManagers = [];
    const managerEmails = ['alex.manager@propertyai.com', 'jessica.manager@propertyai.com'];

    for (let i = 0; i < managerEmails.length; i++) {
      const email = managerEmails[i];
      const existingUser = await prisma.user.findUnique({ where: { email } });

      if (!existingUser) {
        const manager = await prisma.user.create({
          data: {
            email: email,
            password: userPasswords[i],
            firstName: i === 0 ? 'Alex' : 'Jessica',
            lastName: i === 0 ? 'Rodriguez' : 'Chen',
            phone: i === 0 ? '555-111-3333' : '555-222-4444',
            role: UserRole.PROPERTY_MANAGER,
          },
        });
        newManagers.push(manager);
      }
    }
    additionalUsers.push(...newManagers);

    // Additional tenants (check for existing emails)
    const newTenants = [];
    const tenantEmails = ['robert.tenant@example.com', 'anna.tenant@example.com', 'mark.tenant@example.com'];
    const tenantNames = [
      { first: 'Robert', last: 'Garcia', phone: '555-333-5555' },
      { first: 'Anna', last: 'Taylor', phone: '555-444-6666' },
      { first: 'Mark', last: 'Anderson', phone: '555-555-7777' }
    ];

    for (let i = 0; i < tenantEmails.length; i++) {
      const email = tenantEmails[i];
      const existingUser = await prisma.user.findUnique({ where: { email } });

      if (!existingUser) {
        const tenant = await prisma.user.create({
          data: {
            email: email,
            password: userPasswords[i + 2], // Start from index 2
            firstName: tenantNames[i].first,
            lastName: tenantNames[i].last,
            phone: tenantNames[i].phone,
            role: UserRole.TENANT,
          },
        });
        newTenants.push(tenant);
      }
    }
    additionalUsers.push(...newTenants);

    // Additional vendors (check for existing emails)
    const newVendors = [];
    const vendorEmails = ['hvac.vendor@propertyai.com', 'carpenter.vendor@propertyai.com', 'painter.vendor@propertyai.com'];
    const vendorNames = [
      { first: 'Tom', last: 'HVAC', phone: '555-666-8888' },
      { first: 'David', last: 'Carpenter', phone: '555-777-9999' },
      { first: 'Lisa', last: 'Painter', phone: '555-888-0000' }
    ];

    for (let i = 0; i < vendorEmails.length; i++) {
      const email = vendorEmails[i];
      const existingUser = await prisma.user.findUnique({ where: { email } });

      if (!existingUser) {
        const vendor = await prisma.user.create({
          data: {
            email: email,
            password: userPasswords[i], // Reuse first 3 passwords
            firstName: vendorNames[i].first,
            lastName: vendorNames[i].last,
            phone: vendorNames[i].phone,
            role: UserRole.VENDOR,
          },
        });
        newVendors.push(vendor);
      }
    }
    additionalUsers.push(...newVendors);

    console.log(`Created ${additionalUsers.length} additional users.`);

    // Create additional vendors for new vendor users
    const newVendorUsers = additionalUsers.filter(u => u.role === UserRole.VENDOR);
    const newVendorRecords = [];

    for (const vendorUser of newVendorUsers) {
      const vendor = await prisma.vendor.create({
        data: {
          name: `${vendorUser.firstName} ${vendorUser.lastName}`,
          contactPersonId: vendorUser.id,
          phone: vendorUser.phone || '555-000-0000',
          email: vendorUser.email,
          address: '123 Contractor St, City, State 12345',
          specialty: getVendorSpecialty(vendorUser.email),
          certifications: ['Licensed', 'Insured', 'Bonded'],
          hourlyRate: Math.floor(Math.random() * 50) + 50, // 50-100
          serviceAreas: ['Downtown', 'Midtown', 'Uptown', 'Suburbs'],
          availability: 'AVAILABLE',
        },
      });
      newVendorRecords.push(vendor);
    }
    console.log(`Created ${newVendorRecords.length} additional vendor records.`);

    // Create additional properties across different cities
    console.log("Creating additional properties...");
    const additionalProperties = [
      {
        name: "Sunset Apartments Complex",
        description: "Modern apartment complex with city views",
        address: "456 Oak Street",
        city: "Los Angeles",
        state: "CA",
        zipCode: "90210",
        latitude: 34.0522,
        longitude: -118.2437,
        propertyType: PropertyType.APARTMENT,
        yearBuilt: 2018,
        totalUnits: 24,
        amenities: {
          pool: true,
          gym: true,
          parking: true,
          laundry: true,
          elevator: true
        },
      },
      {
        name: "Riverside Townhomes",
        description: "Beautiful townhomes along the river",
        address: "789 River Road",
        city: "Austin",
        state: "TX",
        zipCode: "78701",
        latitude: 30.2672,
        longitude: -97.7431,
        propertyType: PropertyType.TOWNHOUSE,
        yearBuilt: 2015,
        totalUnits: 16,
        amenities: {
          riverView: true,
          garage: true,
          patio: true,
          fireplace: true
        },
      },
      {
        name: "Downtown Lofts",
        description: "Industrial-style lofts in the heart of downtown",
        address: "321 Industrial Blvd",
        city: "Seattle",
        state: "WA",
        zipCode: "98101",
        latitude: 47.6062,
        longitude: -122.3321,
        propertyType: PropertyType.APARTMENT,
        yearBuilt: 2020,
        totalUnits: 12,
        amenities: {
          highCeilings: true,
          exposedBrick: true,
          rooftop: true,
          modernAppliances: true
        },
      },
      {
        name: "Garden District Houses",
        description: "Charming single-family homes in historic district",
        address: "654 Garden Street",
        city: "New Orleans",
        state: "LA",
        zipCode: "70115",
        latitude: 29.9511,
        longitude: -90.0715,
        propertyType: PropertyType.HOUSE,
        yearBuilt: 1920,
        totalUnits: 8,
        amenities: {
          garden: true,
          historic: true,
          hardwoodFloors: true,
          fireplace: true
        },
      },
      {
        name: "Mountain View Condos",
        description: "Luxury condos with mountain views",
        address: "987 Mountain View Drive",
        city: "Denver",
        state: "CO",
        zipCode: "80202",
        latitude: 39.7392,
        longitude: -104.9903,
        propertyType: PropertyType.CONDO,
        yearBuilt: 2019,
        totalUnits: 20,
        amenities: {
          mountainView: true,
          skiStorage: true,
          balcony: true,
          inUnitLaundry: true
        },
      },
    ];

    const additionalRentals = [];
    for (let i = 0; i < additionalProperties.length; i++) {
      const property = additionalProperties[i];
      const manager = managerUsers[i % managerUsers.length];

      const rental = await prisma.rental.create({
        data: {
          title: property.name,
          description: property.description,
          address: property.address,
          city: property.city,
          state: property.state,
          zipCode: property.zipCode,
          country: 'USA',
          latitude: property.latitude,
          longitude: property.longitude,
          propertyType: property.propertyType,
          yearBuilt: property.yearBuilt,
          totalUnits: property.totalUnits,
          amenities: property.amenities,
          rent: Math.floor(Math.random() * 2000) + 1500, // 1500-3500
          deposit: Math.floor(Math.random() * 1000) + 1000, // 1000-2000
          isAvailable: Math.random() > 0.3, // 70% available
          status: ListingStatus.ACTIVE,
          slug: `${property.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${i + 100}`,
          managerId: manager.id,
          ownerId: adminUser.id,
          createdById: adminUser.id,
        },
      });
      additionalRentals.push(rental);
    }
    console.log(`Created ${additionalRentals.length} additional properties.`);

    // Create additional leases (only for rentals without existing leases)
    console.log("Creating additional leases...");
    const additionalLeases = [];
    const allRentals = await prisma.rental.findMany();
    const existingLeases = await prisma.lease.findMany();
    const leasedRentalIds = new Set(existingLeases.map(lease => lease.rentalId));
    const allTenants = [...tenantUsers, ...newTenants];

    // Filter to only rentals without leases
    const availableRentals = allRentals.filter(rental => !leasedRentalIds.has(rental.id));

    for (let i = 0; i < Math.min(15, availableRentals.length); i++) {
      const rental = availableRentals[i];
      const tenant = allTenants[i % allTenants.length];

      if (rental.isAvailable) continue; // Skip available rentals

      const lease = await prisma.lease.create({
        data: {
          startDate: new Date(2024, Math.floor(Math.random() * 6), 1), // Random month in 2024
          endDate: new Date(2025, Math.floor(Math.random() * 12), 1), // Random month in 2025
          rentAmount: rental.rent,
          securityDeposit: rental.deposit || 1000, // Default to 1000 if null
          leaseTerms: "Standard 12-month lease agreement",
          status: "ACTIVE",
          signedDate: new Date(2024, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1),
          rentalId: rental.id,
          tenantId: tenant.id,
        },
      });
      additionalLeases.push(lease);
    }
    console.log(`Created ${additionalLeases.length} additional leases.`);

    // Create comprehensive maintenance requests
    console.log("Creating comprehensive maintenance requests...");
    const priorities = [Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.EMERGENCY];
    const statuses = [MaintenanceStatus.OPEN, MaintenanceStatus.IN_PROGRESS, MaintenanceStatus.COMPLETED, MaintenanceStatus.ON_HOLD];

    const maintenanceIssues = [
      "Leaky faucet in kitchen",
      "Air conditioning not working",
      "Broken window in living room",
      "Garage door opener malfunctioning",
      "Toilet running continuously",
      "Electrical outlet not working",
      "Heating system making noise",
      "Dishwasher not draining",
      "Oven temperature inconsistent",
      "Bathroom exhaust fan broken",
      "Front door lock sticking",
      "Ceiling fan wobbling",
      "Dryer not heating properly",
      "Refrigerator making loud noise",
      "Microwave door not closing",
      "Garbage disposal jammed",
      "Shower head leaking",
      "Bathtub drain clogged",
      "Light fixture flickering",
      "Doorbell not ringing",
      "Smoke detector beeping",
      "Carbon monoxide detector error",
      "Water heater leaking",
      "Sump pump not working",
      "Basement flooding",
    ];

    const additionalMaintenanceRequests = [];
    for (let i = 0; i < 25; i++) {
      const rental = allRentals[Math.floor(Math.random() * allRentals.length)];
      const tenant = allTenants[Math.floor(Math.random() * allTenants.length)];
      const issue = maintenanceIssues[Math.floor(Math.random() * maintenanceIssues.length)];
      const priority = priorities[Math.floor(Math.random() * priorities.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      const maintenanceRequest = await prisma.maintenanceRequest.create({
        data: {
          title: `${issue} - ${rental.title}`,
          description: `Tenant reports: ${issue}. This needs immediate attention.`,
          status: status,
          priority: priority,
          createdAt: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          scheduledDate: status === MaintenanceStatus.IN_PROGRESS ? new Date() : null,
          completedDate: status === MaintenanceStatus.COMPLETED ? new Date() : null,
          notes: status === MaintenanceStatus.COMPLETED ? "Issue resolved successfully" : "Awaiting contractor assignment",
          estimatedCost: Math.floor(Math.random() * 500) + 100, // 100-600
          actualCost: status === MaintenanceStatus.COMPLETED ? Math.floor(Math.random() * 500) + 100 : null,
          rentalId: rental.id,
          requestedById: tenant.id,
        },
      });
      additionalMaintenanceRequests.push(maintenanceRequest);
    }
    console.log(`Created ${additionalMaintenanceRequests.length} additional maintenance requests.`);

    // Create transactions and payments
    console.log("Creating transactions and payments...");
    const transactionTypes = [TransactionType.RENT_PAYMENT, TransactionType.SECURITY_DEPOSIT, TransactionType.MAINTENANCE_FEE];
    const transactionStatuses = [TransactionStatus.COMPLETED, TransactionStatus.PENDING, TransactionStatus.FAILED];

    const additionalTransactions = [];
    for (let i = 0; i < 30; i++) {
      const lease = additionalLeases[Math.floor(Math.random() * additionalLeases.length)];
      const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
      const status = transactionStatuses[Math.floor(Math.random() * transactionStatuses.length)];

      let amount = 0;
      let description = "";

      switch (type) {
        case TransactionType.RENT_PAYMENT:
          amount = lease.rentAmount;
          description = `Monthly rent payment for ${lease.rentalId}`;
          break;
        case TransactionType.SECURITY_DEPOSIT:
          amount = lease.securityDeposit;
          description = `Security deposit for lease ${lease.id}`;
          break;
        case TransactionType.MAINTENANCE_FEE:
          amount = Math.floor(Math.random() * 300) + 50;
          description = `Maintenance fee for ${lease.rentalId}`;
          break;
      }

      const transaction = await prisma.transaction.create({
        data: {
          amount: amount,
          type: type,
          status: status,
          description: description,
          createdAt: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          transactionDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          leaseId: lease.id,
          approvedById: status === TransactionStatus.COMPLETED ? adminUser.id : null,
        },
      });
      additionalTransactions.push(transaction);
    }
    console.log(`Created ${additionalTransactions.length} additional transactions.`);

    // Create work orders and assignments
    console.log("Creating work orders and assignments...");
    const additionalWorkOrders = [];
    const maintenanceRequests = await prisma.maintenanceRequest.findMany({
      where: { status: { in: [MaintenanceStatus.OPEN, MaintenanceStatus.IN_PROGRESS] } }
    });

    // Get all available vendors (both new and existing)
    const allVendors = await prisma.vendor.findMany();
    if (allVendors.length === 0) {
      console.log("No vendors found, skipping work order assignments");
    } else {
      // Get existing work orders to avoid duplicates
      const existingWorkOrders = await prisma.workOrder.findMany();
      const existingMaintenanceRequestIds = new Set(existingWorkOrders.map(wo => wo.maintenanceRequestId));

      // Filter to only maintenance requests without work orders
      const requestsWithoutWorkOrders = maintenanceRequests.filter(req => !existingMaintenanceRequestIds.has(req.id));

      for (const request of requestsWithoutWorkOrders.slice(0, 15)) {
        const workOrder = await prisma.workOrder.create({
          data: {
            title: `Work Order: ${request.title}`,
            description: request.description,
            status: request.status === MaintenanceStatus.OPEN ? "OPEN" : "IN_PROGRESS",
            priority: request.priority,
            createdAt: request.createdAt,
            maintenanceRequestId: request.id,
          },
        });
        additionalWorkOrders.push(workOrder);

        // Assign to a vendor (use all available vendors)
        const vendor = allVendors[Math.floor(Math.random() * allVendors.length)];
        await prisma.workOrderAssignment.create({
          data: {
            workOrderId: workOrder.id,
            vendorId: vendor.id,
            assignedAt: new Date(),
            notes: "Assigned via automated system",
          },
        });
      }
    }
    console.log(`Created ${additionalWorkOrders.length} work orders with assignments.`);

    // Create additional market data for different cities
    console.log("Creating additional market data...");
    const cities = [
      { name: "Los Angeles, CA", lat: 34.0522, lng: -118.2437 },
      { name: "Austin, TX", lat: 30.2672, lng: -97.7431 },
      { name: "Seattle, WA", lat: 47.6062, lng: -122.3321 },
      { name: "New Orleans, LA", lat: 29.9511, lng: -90.0715 },
      { name: "Denver, CO", lat: 39.7392, lng: -104.9903 },
      { name: "Miami, FL", lat: 25.7617, lng: -80.1918 },
      { name: "Portland, OR", lat: 45.5152, lng: -122.6784 },
      { name: "Nashville, TN", lat: 36.1627, lng: -86.7816 },
    ];

    const additionalMarketData = [];
    for (const city of cities) {
      for (let bedrooms = 1; bedrooms <= 4; bedrooms++) {
        const propertyTypes = [PropertyType.APARTMENT, PropertyType.HOUSE, PropertyType.CONDO];

        for (const propertyType of propertyTypes) {
          const marketData = await prisma.marketData.create({
            data: {
              location: city.name,
              averageRent: Math.floor(Math.random() * 2000) + 1200 + (bedrooms * 300), // 1200-4000+ based on bedrooms
              vacancyRate: Math.random() * 0.1, // 0-10%
              bedrooms: bedrooms,
              propertyType: propertyType,
              dataDate: new Date(2025, Math.floor(Math.random() * 12), 1),
            },
          });
          additionalMarketData.push(marketData);
        }
      }
    }
    console.log(`Created ${additionalMarketData.length} additional market data records.`);

    // Create notifications for various events
    console.log("Creating notifications...");
    const notifications = [];
    for (let i = 0; i < 20; i++) {
      const user = [...tenantUsers, ...newTenants][Math.floor(Math.random() * (tenantUsers.length + newTenants.length))];
      const notificationTypes = [
        "MAINTENANCE_UPDATE",
        "PAYMENT_REMINDER",
        "LEASE_RENEWAL",
        "INSPECTION_SCHEDULED",
        "RENT_INCREASE",
        "COMMUNITY_EVENT"
      ];

      const notification = await prisma.notification.create({
        data: {
          message: `Test notification ${i + 1}: ${notificationTypes[Math.floor(Math.random() * notificationTypes.length)]}`,
          isRead: Math.random() > 0.5, // 50% read
          createdAt: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          userId: user.id,
          type: notificationTypes[Math.floor(Math.random() * notificationTypes.length)],
          link: Math.random() > 0.5 ? `/dashboard/notifications/${i + 1}` : null,
        },
      });
      notifications.push(notification);
    }
    console.log(`Created ${notifications.length} notifications.`);

    console.log("✅ Enhanced database seeding completed successfully!");
    console.log(`📊 Summary:`);
    console.log(`   - Additional Users: ${additionalUsers.length}`);
    console.log(`   - Additional Properties: ${additionalRentals.length}`);
    console.log(`   - Additional Leases: ${additionalLeases.length}`);
    console.log(`   - Additional Maintenance Requests: ${additionalMaintenanceRequests.length}`);
    console.log(`   - Additional Transactions: ${additionalTransactions.length}`);
    console.log(`   - Additional Work Orders: ${additionalWorkOrders.length}`);
    console.log(`   - Additional Market Data: ${additionalMarketData.length}`);
    console.log(`   - Additional Notifications: ${notifications.length}`);

  } catch (error) {
    console.error("❌ Error seeding enhanced database:", error);
    throw error;
  }
}

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

async function main() {
  await seedEnhancedData();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });