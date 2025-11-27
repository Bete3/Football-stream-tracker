import express from 'express';
import Match from '../models/Match.js';

const router = express.Router();

// Create a new match
router.post('/matches', async (req, res) => {
  try {
    const { homeTeam, awayTeam } = req.body;
    
    if (!homeTeam || !awayTeam) {
      return res.status(400).json({ 
        error: 'Both homeTeam and awayTeam are required' 
      });
    }

    const match = new Match({
      homeTeam: homeTeam.trim(),
      awayTeam: awayTeam.trim()
    });

    await match.save();
    
    console.log(`✅ New match created: ${homeTeam} vs ${awayTeam}`);
    res.status(201).json({
      message: 'Match created successfully',
      match: match
    });
  } catch (error) {
    console.error('Error creating match:', error);
    res.status(500).json({ 
      error: 'Failed to create match',
      details: error.message 
    });
  }
});

// Start a match
router.post('/matches/:id/start', async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    if (match.status === 'live') {
      return res.status(400).json({ error: 'Match is already live' });
    }

    if (match.status === 'finished') {
      return res.status(400).json({ error: 'Cannot start a finished match' });
    }

    match.status = 'live';
    match.startTime = new Date();
    await match.save();

    console.log(`✅ Match started: ${match.homeTeam} vs ${match.awayTeam}`);
    res.json({
      message: 'Match started successfully',
      match: match
    });
  } catch (error) {
    console.error('Error starting match:', error);
    res.status(500).json({ 
      error: 'Failed to start match',
      details: error.message 
    });
  }
});

// Add event to match (goal, card, foul)
router.post('/matches/:id/events', async (req, res) => {
  try {
    const { type, team, player, minute, description } = req.body;
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    if (match.status !== 'live') {
      return res.status(400).json({ error: 'Match is not live' });
    }

    // Validate event data
    if (!type || !team || !player || !minute) {
      return res.status(400).json({ 
        error: 'Type, team, player, and minute are required' 
      });
    }

    const event = { 
      type, 
      team, 
      player: player.trim(), 
      minute: parseInt(minute),
      description: description?.trim() || `${type} for ${team} team`
    };

    match.events.push(event);

    // Update score if it's a goal
    if (type === 'goal') {
      if (team === 'home') {
        match.homeScore += 1;
      } else {
        match.awayScore += 1;
      }
    }

    await match.save();

    console.log(`✅ Event added: ${type} for ${team} team in ${match.homeTeam} vs ${match.awayTeam}`);
    res.json({
      message: 'Event added successfully',
      match: match
    });
  } catch (error) {
    console.error('Error adding event:', error);
    res.status(500).json({ 
      error: 'Failed to add event',
      details: error.message 
    });
  }
});

// Get all matches (for admin)
router.get('/matches', async (req, res) => {
  try {
    const matches = await Match.find().sort({ createdAt: -1 });
    res.json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ 
      error: 'Failed to fetch matches',
      details: error.message 
    });
  }
});

// Finish a match
router.post('/matches/:id/finish', async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    match.status = 'finished';
    match.endTime = new Date();
    await match.save();

    console.log(`✅ Match finished: ${match.homeTeam} vs ${match.awayTeam}`);
    res.json({
      message: 'Match finished successfully',
      match: match
    });
  } catch (error) {
    console.error('Error finishing match:', error);
    res.status(500).json({ 
      error: 'Failed to finish match',
      details: error.message 
    });
  }
});

export default router;