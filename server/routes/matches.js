import express from 'express';
import Match from '../models/Match.js';

const router = express.Router();

// Test route to check database connection
router.get('/test', async (req, res) => {
  try {
    const testMatch = await Match.findOne();
    res.json({ 
      message: 'Database connection successful',
      connected: true,
      sampleData: testMatch
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Database connection failed',
      connected: false,
      error: error.message 
    });
  }
});

// Get all matches
router.get('/', async (req, res) => {
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

// Get live matches
router.get('/live', async (req, res) => {
  try {
    const matches = await Match.find({ status: 'live' }).sort({ startTime: -1 });
    res.json(matches);
  } catch (error) {
    console.error('Error fetching live matches:', error);
    res.status(500).json({ 
      error: 'Failed to fetch live matches',
      details: error.message 
    });
  }
});

// Get single match
router.get('/:id', async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    res.json(match);
  } catch (error) {
    console.error('Error fetching match:', error);
    res.status(500).json({ 
      error: 'Failed to fetch match',
      details: error.message 
    });
  }
});

// Event stream for all live matches
router.get('/stream/live', async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  res.write('\n');

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Send initial data immediately
  try {
    const matches = await Match.find({ status: 'live' }).sort({ startTime: -1 });
    sendEvent({ type: 'initial', matches });
  } catch (error) {
    console.error('Error sending initial SSE data:', error);
    sendEvent({ type: 'error', message: 'Failed to fetch matches' });
  }

  // Check for updates every 3 seconds
  const interval = setInterval(async () => {
    try {
      const updatedMatches = await Match.find({ status: 'live' }).sort({ startTime: -1 });
      sendEvent({ type: 'update', matches: updatedMatches });
    } catch (error) {
      console.error('Error in SSE interval:', error);
      sendEvent({ type: 'error', message: 'Update failed' });
    }
  }, 3000);

  // Handle client disconnect
  req.on('close', () => {
    clearInterval(interval);
    console.log('Client disconnected from live matches stream');
    res.end();
  });

  // Handle errors
  req.on('error', (err) => {
    console.error('SSE connection error:', err);
    clearInterval(interval);
    res.end();
  });
});

// Event stream for specific match
router.get('/:id/stream', async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  res.write('\n');

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const checkMatchUpdates = async () => {
    try {
      const match = await Match.findById(req.params.id);
      if (match) {
        sendEvent({ type: 'update', match });
      } else {
        sendEvent({ type: 'error', message: 'Match not found' });
      }
    } catch (error) {
      console.error('Error fetching match for SSE:', error);
      sendEvent({ type: 'error', message: 'Failed to fetch match' });
    }
  };

  // Send initial data immediately
  checkMatchUpdates();

  // Check for updates every 3 seconds
  const interval = setInterval(checkMatchUpdates, 3000);

  // Handle client disconnect
  req.on('close', () => {
    clearInterval(interval);
    console.log(`Client disconnected from match ${req.params.id} stream`);
    res.end();
  });

  // Handle errors
  req.on('error', (err) => {
    console.error('SSE connection error:', err);
    clearInterval(interval);
    res.end();
  });
});

export default router;