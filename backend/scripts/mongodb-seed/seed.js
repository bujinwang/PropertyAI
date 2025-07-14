const mongoose = require('mongoose');
const { Message, MaintenanceRecord } = require('../../src/models/mongoModels');
const messages = require('./data/messages.json');
const maintenanceRecords = require('./data/maintenanceRecords.json');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/propertyai');

  // Seed Messages
  await Message.deleteMany({});
  await Message.insertMany(messages);

  // Seed Maintenance Records
  await MaintenanceRecord.deleteMany({});
  await MaintenanceRecord.insertMany(maintenanceRecords);

  console.log('MongoDB seed complete!');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
}); 