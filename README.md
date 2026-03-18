# DentBook — Backend API Server

This is the Node.js/Express REST API that powers the DentBook application. It connects securely to **MongoDB Atlas** and handles database operations, dynamic appointment scheduling, and dispatches automated email notifications via Google SMTP.

## ✨ Features
- **RESTful Architecture**: Clean, modular route structure (`/api/dentists`, `/api/appointments`).
- **MongoDB Integration**: Persists all booking and dentist data rapidly via Mongoose models.
- **Automated Email Dispatch**: Uses `nodemailer` to send automated confirmation emails and status updates directly to patients.
- **Status Management**: Supports secure endpoints for Updating (`Scheduled`, `Completed`, `Cancelled`) and Deleting appointments.

## 🚀 Setup Guide

### 1. Install Dependencies
Make sure you are in the `backend/` directory, then run:
```bash
npm install
```

### 2. Environment Configuration
Create a file named precisely `.env` in the root of the `backend/` directory to store your secrets:
```env
# Your actual Gmail address
EMAIL_USER=your_email@gmail.com

# The 16-letter App Password you generated (No spaces)
EMAIL_PASS=your_16_letter_app_password

# Your MongoDB Connection String
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/
```
*Note: Standard Gmail passwords will be blocked by Google Security. To generate the required App Password, visit `myaccount.google.com/apppasswords`.*

### 3. Run the Development Server
```bash
# Starts the server using nodemon for hot-reloading
npm run dev
```
The terminal will output `🚀 Server running on http://localhost:5001` and verify the MongoDB connection. Keep this terminal running in the background alongside your frontend!
