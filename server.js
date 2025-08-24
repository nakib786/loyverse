const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());

// Serve static files
app.use(express.static('.'));

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

// Generic proxy endpoint for Loyverse API
app.get('/api/loyverse/:endpoint', async (req, res) => {
  try {
    const { endpoint } = req.params;
    const params = req.query;
    
    const data = await makeLoyverseRequest(endpoint, params);
    res.json(data);
  } catch (error) {
    console.error('Error fetching from Loyverse API:', error);
    res.status(500).json({ 
      error: 'Failed to fetch data from Loyverse API', 
      details: error.message 
    });
  }
});

// Comprehensive data endpoint that fetches all relevant data
app.get('/api/loyverse-data', async (req, res) => {
  try {
    console.log('Fetching comprehensive Loyverse data...');
    
    // Fetch all relevant data in parallel
    const [
      itemsResponse,
      categoriesResponse,
      modifiersResponse,
      storesResponse,
      taxesResponse
    ] = await Promise.allSettled([
      makeLoyverseRequest('items'),
      makeLoyverseRequest('categories'),
      makeLoyverseRequest('modifiers'),
      makeLoyverseRequest('stores'),
      makeLoyverseRequest('taxes')
    ]);

    // Process results
    const data = {
      items: itemsResponse.status === 'fulfilled' ? itemsResponse.value : { items: [] },
      categories: categoriesResponse.status === 'fulfilled' ? categoriesResponse.value : { categories: [] },
      modifiers: modifiersResponse.status === 'fulfilled' ? modifiersResponse.value : { modifiers: [] },
      stores: storesResponse.status === 'fulfilled' ? storesResponse.value : { stores: [] },
      taxes: taxesResponse.status === 'fulfilled' ? taxesResponse.value : { taxes: [] },
      errors: []
    };

    // Collect any errors
    [itemsResponse, categoriesResponse, modifiersResponse, storesResponse, taxesResponse]
      .forEach((result, index) => {
        if (result.status === 'rejected') {
          const endpoints = ['items', 'categories', 'modifiers', 'stores', 'taxes'];
          data.errors.push({
            endpoint: endpoints[index],
            error: result.reason.message
          });
        }
      });

    console.log('Comprehensive data fetched successfully');
    res.json(data);
  } catch (error) {
    console.error('Error fetching comprehensive data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch comprehensive data from Loyverse API', 
      details: error.message 
    });
  }
});

// Specific endpoint for modifiers only
app.get('/api/loyverse-modifiers', async (req, res) => {
  try {
    const data = await makeLoyverseRequest('modifiers');
    res.json(data);
  } catch (error) {
    console.error('Error fetching modifiers:', error);
    res.status(500).json({ 
      error: 'Failed to fetch modifiers from Loyverse API', 
      details: error.message 
    });
  }
});

// Specific endpoint for modifier groups (not available in API)
app.get('/api/loyverse-modifier-groups', async (req, res) => {
  try {
    // Since modifier_groups endpoint doesn't exist, we'll return an empty response
    // Modifier groups are actually part of the modifiers response
    const modifiersData = await makeLoyverseRequest('modifiers');
    
    // Extract unique modifier groups from modifiers
    const modifierGroups = [];
    const seenGroups = new Set();
    
    if (modifiersData.modifiers) {
      modifiersData.modifiers.forEach(modifier => {
        if (modifier.name && !seenGroups.has(modifier.name)) {
          seenGroups.add(modifier.name);
          modifierGroups.push({
            id: modifier.id,
            group_name: modifier.name,
            created_at: modifier.created_at,
            updated_at: modifier.updated_at
          });
        }
      });
    }
    
    res.json({ modifier_groups: modifierGroups });
  } catch (error) {
    console.error('Error fetching modifier groups:', error);
    res.status(500).json({ 
      error: 'Failed to fetch modifier groups from Loyverse API', 
      details: error.message 
    });
  }
});

// Specific endpoint for variants (items with variants)
app.get('/api/loyverse-variants', async (req, res) => {
  try {
    const data = await makeLoyverseRequest('items');
    
    // Filter items that have variants
    const itemsWithVariants = data.items.filter(item => 
      item.variants && item.variants.length > 1
    );
    
    res.json({ 
      items_with_variants: itemsWithVariants,
      total_items: data.items.length,
      items_with_variants_count: itemsWithVariants.length
    });
  } catch (error) {
    console.error('Error fetching variants:', error);
    res.status(500).json({ 
      error: 'Failed to fetch variants from Loyverse API', 
      details: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
  console.log(`Available endpoints:`);
  console.log(`  - /api/loyverse-data (comprehensive data)`);
  console.log(`  - /api/loyverse-modifiers (modifiers only)`);
  console.log(`  - /api/loyverse-modifier-groups (modifier groups)`);
  console.log(`  - /api/loyverse-variants (items with variants)`);
  console.log(`  - /api/loyverse/:endpoint (generic proxy)`);
});
