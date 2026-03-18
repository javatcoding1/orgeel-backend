require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Dentist = require('./models/Dentist');

const app = express();
const PORT = 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/dentistAppointments';

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');

    // Clear and re-seed dentists to ensure only Hyderabad locations
    await Dentist.deleteMany({});
    
    await Dentist.insertMany([
      { name: 'Dr. Sarah Mitchell', photo: 'https://api.dicebear.com/7.x/personas/svg?seed=Sarah', qualification: 'BDS, MDS - Orthodontics', experience: 12, clinic_name: 'Bright Smile Clinic', address: 'Road No 12, Banjara Hills', location: 'Hyderabad, India' },
      { name: 'Dr. James Wilson', photo: 'https://api.dicebear.com/7.x/personas/svg?seed=James', qualification: 'BDS, MDS - Endodontics', experience: 8, clinic_name: 'Pearl Dental Care', address: 'Plot 45, Jubilee Hills', location: 'Hyderabad, India' },
      { name: 'Dr. Priya Sharma', photo: 'https://api.dicebear.com/7.x/personas/svg?seed=Priya', qualification: 'BDS, MDS - Periodontics', experience: 15, clinic_name: 'Dental Excellence', address: 'DLF Cyber City, Gachibowli', location: 'Hyderabad, India' },
      { name: 'Dr. Michael Chen', photo: 'https://api.dicebear.com/7.x/personas/svg?seed=Michael', qualification: 'DDS, Prosthodontics', experience: 10, clinic_name: 'Golden Gate Dentistry', address: 'Inorbit Mall Road, Madhapur', location: 'Hyderabad, India' },
      { name: 'Dr. Emily Roberts', photo: 'https://api.dicebear.com/7.x/personas/svg?seed=Emily', qualification: 'BDS, MDS - Pediatric', experience: 6, clinic_name: 'Little Stars Dental', address: 'KPHB Colony, Kukatpally', location: 'Hyderabad, India' },
      { name: 'Dr. Arjun Patel', photo: 'https://api.dicebear.com/7.x/personas/svg?seed=Arjun', qualification: 'BDS, MDS - Oral Surgery', experience: 20, clinic_name: 'SmileCraft Hospital', address: 'SD Road, Secunderabad', location: 'Hyderabad, India' },
    ]);
    console.log('✅ Seeded 6 dentists into MongoDB (Hyderabad locations)');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// Routes
const dentistRoutes = require('./routes/dentistRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');

app.use('/api/dentists', dentistRoutes);
app.use('/api/appointments', appointmentRoutes);

// Admin auth endpoint
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123',
};

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    return res.json({ success: true, message: 'Login successful' });
  }
  return res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Server running on http://localhost:' + PORT);
});
