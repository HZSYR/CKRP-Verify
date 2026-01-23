// Vercel serverless function to store verification data
import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('Store verification called with:', req.body);

  try {
    const verificationData = req.body;
    
    if (!verificationData || !verificationData.userId) {
      console.error('Invalid verification data:', verificationData);
      return res.status(400).json({ error: 'Invalid verification data' });
    }
    
    // Connect to MongoDB
    const uri = 'mongodb+srv://hzsyr:kapuyuak4444@kapuyuak4444.og6qyap.mongodb.net/CKRP?retryWrites=true&w=majority';
    const client = new MongoClient(uri);
    
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('CKRP');
    const collection = db.collection('verifications');
    
    // Prepare verification document
    const verificationDoc = {
      userId: verificationData.userId,
      username: verificationData.username,
      discriminator: verificationData.discriminator || '0',
      email: verificationData.email,
      avatar: verificationData.avatar,
      guildId: verificationData.guildId || '1463219682013348000',
      status: 'pending',
      verifiedAt: new Date(),
      ipAddress: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown'
    };
    
    console.log('Inserting verification document:', verificationDoc);
    
    // Store verification
    const result = await collection.insertOne(verificationDoc);
    console.log('Insert result:', result);
    
    await client.close();
    console.log('MongoDB connection closed');
    
    res.json({ 
      success: true, 
      message: 'Verification data stored successfully',
      insertedId: result.insertedId
    });
    
  } catch (error) {
    console.error('Store verification error:', error);
    res.status(500).json({ 
      error: 'Failed to store verification data',
      details: error.message 
    });
  }
}
