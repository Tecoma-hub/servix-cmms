
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('./models/User');
const Equipment = require('./models/Equipment');

// Load env vars
dotenv.config({ path: './config/config.env' });

// Connect to DB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Sample data
const users = [
  {
    name: 'Dr. Sarah Johnson',
    email: 'sarah@hospital.com',
    password: 'password123',
    role: 'Engineer',
    department: 'Engineering',
    phone: '555-0101'
  },
  {
    name: 'John Doe',
    email: 'john@hospital.com',
    password: 'password123',
    role: 'Technician',
    department: 'Engineering',
    phone: '555-0102'
  },
  {
    name: 'Jane Smith',
    email: 'jane@hospital.com',
    password: 'password123',
    role: 'Technician',
    department: 'Engineering',
    phone: '555-0103'
  }
];

const equipment = [
  {
    name: 'MRI Machine',
    brand: 'Siemens',
    model: 'MAGNETOM Skyra',
    serialNumber: 'MRI-12345',
    hospitalId: 'ICU-001',
    status: 'Active',
    sparePartsNeeded: ['Coolant Pump', 'Gradient Coil'],
    comments: 'Regular maintenance scheduled',
    department: 'Radiology',
    critical: true,
    lastMaintenance: '2024-01-15',
    nextMaintenance: '2024-04-15',
    maintenanceSchedule: 'Monthly'
  },
  {
    name: 'Ventilator',
    brand: 'Philips',
    model: 'Respironics',
    serialNumber: 'VEN-67890',
    hospitalId: 'ICU-002',
    status: 'Under Maintenance',
    sparePartsNeeded: ['Air Filter'],
    comments: 'Scheduled for PM',
    department: 'ICU',
    critical: true,
    lastMaintenance: '2024-01-20',
    nextMaintenance: '2024-04-20',
    maintenanceSchedule: 'Monthly'
  },
  {
    name: 'Centrifuge',
    brand: 'Eppendorf',
    model: '5430',
    serialNumber: 'LAB-11223',
    hospitalId: 'LAB-001',
    status: 'Active',
    sparePartsNeeded: [],
    comments: 'Operating normally',
    department: 'Laboratory',
    critical: false,
    lastMaintenance: '2024-01-10',
    nextMaintenance: '2024-07-10',
    maintenanceSchedule: 'Quarterly'
  }
];

// Import into DB
const importData = async () => {
  try {
    await User.deleteMany();
    await Equipment.deleteMany();
    
    await User.create(users);
    await Equipment.create(equipment);
    
    console.log('Data Imported!');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

// Delete data
const deleteData = async () => {
  try {
    await User.deleteMany();
    await Equipment.deleteMany();
    
    console.log('Data Destroyed!');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

if (process.argv[2] === '-i') {
  importData();
} else if (process.argv[2] === '-d') {
  deleteData();
}