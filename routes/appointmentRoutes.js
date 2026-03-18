const express = require('express');
const nodemailer = require('nodemailer');
const Appointment = require('../models/Appointment');
const Dentist = require('../models/Dentist');

const router = express.Router();

// Configure nodemailer transporter
let transporter;
let usingEthereal = false;

(async () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS.replace(/\s+/g, ''),
      },
    });
    console.log('📧 Email configured with Gmail SMTP (' + process.env.EMAIL_USER + ')');
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    usingEthereal = true;
    console.log('📧 Email configured with Ethereal test account (set EMAIL_USER & EMAIL_PASS for real emails)');
  }
})();

// POST /api/appointments - Create new appointment
router.post('/', async (req, res) => {
  try {
    const { patient_name, email, age, gender, appointment_date, dentist_id } = req.body;

    if (!patient_name || !email || !appointment_date || !dentist_id) {
      return res.status(400).json({ error: 'Missing required fields: patient_name, email, appointment_date, dentist_id' });
    }

    const dentist = await Dentist.findById(dentist_id);
    if (!dentist) {
      return res.status(404).json({ error: 'Dentist not found' });
    }

    const appointment = await Appointment.create({
      patient_name,
      email,
      age,
      gender,
      appointment_date,
      dentist_id,
    });

    // Send confirmation email
    let emailPreview = null;
    let emailSent = false;
    if (transporter) {
      try {
        const formattedDate = new Date(appointment_date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        const senderEmail = process.env.EMAIL_USER || 'noreply@dentbook.com';

        const info = await transporter.sendMail({
          from: '"DentBook" <' + senderEmail + '>',
          to: email,
          subject: 'Appointment Confirmed with ' + dentist.name,
          html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafb; border-radius: 12px; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #0d9488, #14b8a6); padding: 32px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 700;">Appointment Confirmed</h1>
                <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px;">Your dental visit has been scheduled</p>
              </div>
              <div style="padding: 32px;">
                <p style="font-size: 15px; color: #1e293b;">Hi <strong>${patient_name}</strong>,</p>
                <p style="font-size: 14px; color: #475569; line-height: 1.6;">Your appointment has been successfully booked. Here are the details:</p>
                <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #0d9488;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <tr><td style="padding: 6px 0; color: #64748b;">Dentist</td><td style="padding: 6px 0; font-weight: 600; color: #1e293b; text-align: right;">${dentist.name}</td></tr>
                    <tr><td style="padding: 6px 0; color: #64748b;">Clinic</td><td style="padding: 6px 0; font-weight: 600; color: #1e293b; text-align: right;">${dentist.clinic_name}</td></tr>
                    <tr><td style="padding: 6px 0; color: #64748b;">Address</td><td style="padding: 6px 0; color: #1e293b; text-align: right;">${dentist.address}, ${dentist.location}</td></tr>
                    <tr><td style="padding: 6px 0; color: #64748b;">Date</td><td style="padding: 6px 0; font-weight: 600; color: #0d9488; text-align: right;">${formattedDate}</td></tr>
                  </table>
                </div>
                <p style="font-size: 13px; color: #94a3b8;">Please arrive 10 minutes before your scheduled time.</p>
              </div>
              <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
                DentBook &mdash; Your Dental Health Partner
              </div>
            </div>
          `,
        });

        emailSent = true;
        if (usingEthereal) {
          emailPreview = nodemailer.getTestMessageUrl(info);
          console.log('📧 Test email sent! Preview:', emailPreview);
        } else {
          console.log('📧 Confirmation email sent to:', email);
        }
      } catch (emailError) {
        console.error('Failed to send email:', emailError.message);
      }
    }

    res.status(201).json({
      message: 'Appointment booked successfully!',
      appointment_id: appointment._id,
      email_sent: emailSent,
      email_preview: emailPreview,
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// GET /api/appointments - Fetch all appointments with dentist info
router.get('/', async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('dentist_id', 'name clinic_name location')
      .sort({ createdAt: -1 });

    // Map to a flat structure the frontend expects
    const mapped = appointments.map((a) => ({
      id: a._id,
      patient_name: a.patient_name,
      email: a.email,
      age: a.age,
      gender: a.gender,
      appointment_date: a.appointment_date,
      created_at: a.createdAt,
      dentist_name: a.dentist_id?.name || 'Unknown',
      clinic_name: a.dentist_id?.clinic_name || 'Unknown',
      location: a.dentist_id?.location || '',
    }));

    res.json(mapped);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

module.exports = router;
