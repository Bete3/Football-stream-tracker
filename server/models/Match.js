import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['goal', 'yellow_card', 'red_card', 'foul'],
    required: true
  },
  team: {
    type: String,
    enum: ['home', 'away'],
    required: true
  },
  player: {
    type: String,
    required: true
  },
  minute: {
    type: Number,
    required: true
  },
  description: String
}, { 
  timestamps: true 
});

const matchSchema = new mongoose.Schema({
  homeTeam: {
    type: String,
    required: true,
    trim: true
  },
  awayTeam: {
    type: String,
    required: true,
    trim: true
  },
  homeScore: {
    type: Number,
    default: 0,
    min: 0
  },
  awayScore: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'finished'],
    default: 'scheduled'
  },
  events: [eventSchema],
  startTime: Date,
  endTime: Date
}, { 
  timestamps: true 
});

// Add index for better performance
matchSchema.index({ status: 1 });
matchSchema.index({ createdAt: -1 });

export default mongoose.model('Match', matchSchema);