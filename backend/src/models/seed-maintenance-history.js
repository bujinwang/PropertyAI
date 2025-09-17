const MaintenanceHistory = require('./MaintenanceHistory');
const Property = require('./Property');
const sequelize = require('../config/database');

const seedMaintenanceHistory = async () => {
  try {
    // Get all properties
    const properties = await Property.findAll({ attributes: ['id', 'name'] });

    if (properties.length === 0) {
      console.log('No properties found. Please create properties first.');
      return;
    }

    const maintenanceTypes = [
      'plumbing', 'electrical', 'hvac', 'roofing', 'appliance',
      'structural', 'painting', 'flooring', 'pest_control', 'landscaping', 'security'
    ];

    const sampleData = [];

    // Generate sample maintenance records for each property
    properties.forEach(property => {
      // Generate 5-15 random maintenance records per property
      const numRecords = Math.floor(Math.random() * 10) + 5;

      for (let i = 0; i < numRecords; i++) {
        const randomDays = Math.floor(Math.random() * 365 * 2); // Last 2 years
        const date = new Date();
        date.setDate(date.getDate() - randomDays);

        const type = maintenanceTypes[Math.floor(Math.random() * maintenanceTypes.length)];
        const cost = Math.floor(Math.random() * 5000) + 100; // $100 - $5100

        sampleData.push({
          propertyId: property.id,
          type,
          description: `Routine ${type} maintenance and repair`,
          date,
          cost: cost.toFixed(2),
          priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
          status: 'completed',
          contractor: `ABC ${type.charAt(0).toUpperCase() + type.slice(1)} Services`,
          notes: `Completed maintenance work on ${property.name}`,
          predictedFailure: false,
        });
      }
    });

    // Bulk insert
    await MaintenanceHistory.bulkCreate(sampleData);
    console.log(`Seeded ${sampleData.length} maintenance history records`);

  } catch (error) {
    console.error('Error seeding maintenance history:', error);
  }
};

// Run if called directly
if (require.main === module) {
  seedMaintenanceHistory().then(() => {
    console.log('Seeding completed');
    process.exit(0);
  }).catch(error => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
}

module.exports = seedMaintenanceHistory;