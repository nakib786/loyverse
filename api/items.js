const fetch = require('node-fetch');

// Loyverse API configuration
const LOYVERSE_API_BASE = 'https://api.loyverse.com/v1.0';
const API_TOKEN = process.env.LOYVERSE_API_TOKEN || "a45dfe9831c44977b53c546676e71d6a";

// Helper function to make Loyverse API requests
async function makeLoyverseRequest(endpoint, params = {}) {
  const url = new URL(`${LOYVERSE_API_BASE}/${endpoint}`);
  
  // Add query parameters
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });

  console.log(`Making request to Loyverse API: ${url.toString()}`);
  
  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
  
  console.log(`Loyverse API response status: ${response.status}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Loyverse API error: ${response.status} - ${errorText}`);
    throw new Error(`Loyverse API error: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  console.log(`Loyverse API response for ${endpoint}:`, data);
  return data;
}

// Vercel serverless function handler
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    console.log('Fetching Loyverse items...');
    const data = await makeLoyverseRequest('items', req.query);
    res.json(data);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ 
      error: 'Failed to fetch items from Loyverse API', 
      details: error.message 
    });
  }
};
