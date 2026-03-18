const express = require('express');
const Dentist = require('../models/Dentist');

const router = express.Router();

// GET /api/dentists - Fetch all dentists
router.get('/', async (req, res) => {
  try {
    const dentists = await Dentist.find();
    res.json(dentists);
  } catch (error) {
    console.error('Error fetching dentists:', error);
    res.status(500).json({ error: 'Failed to fetch dentists' });
  }
});

// GET /api/dentists/:id - Get single dentist
router.get('/:id', async (req, res) => {
  try {
    const dentist = await Dentist.findById(req.params.id);
    if (!dentist) {
      return res.status(404).json({ error: 'Dentist not found' });
    }
    res.json(dentist);
  } catch (error) {
    console.error('Error fetching dentist:', error);
    res.status(500).json({ error: 'Failed to fetch dentist' });
  }
});

module.exports = router;
