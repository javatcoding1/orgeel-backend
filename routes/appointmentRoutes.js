const express = require('express');
const nodemailer = require('nodemailer');
const Appointment = require('../models/Appointment');
const Dentist = require('../models/Dentist');

const router = express.Router();

// POST /api/appointments - Create new appointment
router.post('/', async (req, res) => {
  try {
    const { patient_name, email, age, gender, appointment_date, dentist_id, dentist_name, clinic_name } = req.body;

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
      dentist_name: dentist_name || dentist.name,
      clinic_name: clinic_name || dentist.clinic_name,
    });

    // Send confirmation email
    let emailPreview = null;
    let emailSent = false;
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        const formattedDate = new Date(appointment_date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        const senderEmail = process.env.EMAIL_USER || 'noreply@dentbook.com';

        // 1. Send email to the patient
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

        console.log('📧 Confirmation email sent to:', email);

        // 2. Send email to the admin (yourself) as requested
        if (process.env.EMAIL_USER) {
          await transporter.sendMail({
            from: '"DentBook Alerts" <' + senderEmail + '>',
            to: process.env.EMAIL_USER,
            subject: 'New Appointment Booked: ' + patient_name,
            text: `A new appointment was booked!\n\nPatient: ${patient_name}\nEmail: ${email}\nDentist: ${dentist.name}\nClinic: ${dentist.clinic_name}\nDate: ${formattedDate}\n\nPlease check the admin panel for details.`,
          });
          console.log('📧 Admin notification sent to:', process.env.EMAIL_USER);
        }

        emailSent = true;
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
      dentist_name: a.dentist_name || a.dentist_id?.name || 'Unknown',
      clinic_name: a.clinic_name || a.dentist_id?.clinic_name || 'Unknown',
      location: a.dentist_id?.location || '',
      status: a.status || 'Scheduled',
    }));

    res.json(mapped);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// DELETE /api/appointments/:id - Delete an appointment (Admin only typically)
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Appointment.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

// PUT /api/appointments/:id/status - Update Status (Admin)
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await Appointment.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!updated) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Send email about status change
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS && updated.email) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        const senderEmail = process.env.EMAIL_USER || 'noreply@dentbook.com';
        
        // 1. Notify the patient
        await transporter.sendMail({
          from: '"DentBook" <' + senderEmail + '>',
          to: updated.email,
          subject: 'Appointment Status Update: ' + status,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>Appointment Update</h2>
              <p>Hello <strong>${updated.patient_name}</strong>,</p>
              <p>Your appointment with <strong>${updated.dentist_name}</strong> at <strong>${updated.clinic_name}</strong> has been updated.</p>
              <p>The new status is: <strong style="color: #0d9488">${status}</strong>.</p>
              <p>Thank you for using DentBook!</p>
            </div>
          `,
        });
        console.log('📧 Status update email sent to:', updated.email);

        // 2. Notify the admin
        await transporter.sendMail({
          from: '"DentBook Alerts" <' + senderEmail + '>',
          to: process.env.EMAIL_USER,
          subject: 'Status Changed: ' + updated.patient_name,
          text: `You just changed the status of ${updated.patient_name}'s appointment to ${status}.`,
        });
        console.log('📧 Admin status update sent to:', process.env.EMAIL_USER);
        
      } catch (emailErr) {
        console.error('Failed to send status update email:', emailErr.message);
      }
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;
