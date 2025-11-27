import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import adminRoutes from './routes/admin.js';
import matchRoutes from './routes/matches.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/matches', matchRoutes);

// Simple MongoDB connection (removed deprecated options)
const connectDB = async () => {
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    console.log('📦 Database: football');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('✅ MongoDB Atlas Connected!');
    console.log(`📍 Host: ${conn.connection.host}`);
    console.log(`🗃️ Database: ${conn.connection.name}`);
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('authentication')) {
      console.log('💡 Check your MongoDB Atlas username and password');
    } else if (error.message.includes('whitelist')) {
      console.log('💡 Add your IP to MongoDB Atlas Network Access');
      console.log('   Go to Network Access → Add IP Address → 0.0.0.0/0');
    }
    
    process.exit(1);
  }
};

// Connect to MongoDB
connectDB();

// Connection events
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB Atlas');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

// Health check
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ 
    status: 'OK', 
    database: dbStatus,
    databaseName: 'football',
    cluster: 'football.k2omt3m.mongodb.net',
    timestamp: new Date().toISOString()
  });
});

// Simple test
app.get('/', (req, res) => {
  res.json({ 
    message: 'Football Match Tracker API',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    version: '1.0.0'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Health: http://localhost:${PORT}/api/health`);
  console.log(`🔧 API: http://localhost:${PORT}/api`);
});