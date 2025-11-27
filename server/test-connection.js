import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Testing your MongoDB Atlas connection...');
console.log('Database: football');
console.log('Username: betelyehuala_db_user');

const testConnection = async () => {
  try {
    // Simple connection without deprecated options
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('✅ SUCCESS: Connected to MongoDB Atlas!');
    console.log('📍 Cluster: football.k2omt3m.mongodb.net');
    console.log('🗃️ Database: football');
    
    // Check if we can perform operations
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('📁 Collections found:', collections.length);
    
    await mongoose.connection.close();
    console.log('✅ Connection test completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ CONNECTION FAILED:', error.message);
    
    if (error.message.includes('bad auth') || error.message.includes('authentication')) {
      console.log('💡 Solution: Check your username/password in MongoDB Atlas');
    } else if (error.message.includes('whitelist')) {
      console.log('💡 Solution: Add your IP to MongoDB Atlas Network Access');
      console.log('   Go to: Network Access → Add IP Address → 0.0.0.0/0');
    } else if (error.message.includes('timeout')) {
      console.log('💡 Solution: Check internet connection or try different network');
    }
    
    process.exit(1);
  }
};

testConnection();