const mongoose = require('mongoose');

const dentistSchema = new mongoose.Schema({
  name: { type: String, required: true },
  photo: String,
  qualification: String,
  experience: Number,
  clinic_name: String,
  address: String,
  location: String,
});

module.exports = mongoose.model('Dentist', dentistSchema);
