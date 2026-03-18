const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient_name: { type: String, required: true },
  email: { type: String, required: true },
  age: Number,
  gender: String,
  appointment_date: String,
  dentist_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Dentist', required: true },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Appointment', appointmentSchema);
