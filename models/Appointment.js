const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient_name: { type: String, required: true },
  email: { type: String, required: true },
  age: Number,
  gender: String,
  appointment_date: String,
  dentist_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Dentist', required: true },
  dentist_name: String,
  clinic_name: String,
  status: { type: String, enum: ['Scheduled', 'Completed', 'Cancelled'], default: 'Scheduled' },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Appointment', appointmentSchema);
