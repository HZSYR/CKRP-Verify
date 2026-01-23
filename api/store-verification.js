// Vercel serverless function to store verification data
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const verificationData = req.body;
    
    // Connect to MongoDB and store verification data
    const { MongoClient } = require('mongodb');
    const uri = 'mongodb+srv://hzsyr:kapuyuak4444@kapuyuak4444.og6qyap.mongodb.net/CKRP?retryWrites=true&w=majority';
    
    const client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db('CKRP');
    const collection = db.collection('verifications');
    
    // Store verification with pending status
    await collection.insertOne({
      ...verificationData,
      status: 'pending',
      verifiedAt: new Date(),
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    });
    
    await client.close();
    
    res.json({ success: true, message: 'Verification data stored' });
    
  } catch (error) {
    console.error('Store verification error:', error);
    res.status(500).json({ error: 'Failed to store verification data' });
  }
}
