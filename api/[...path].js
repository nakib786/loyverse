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

  const { path } = req.query;
  const fullPath = Array.isArray(path) ? path.join('/') : path || '';

  console.log(`Request path: ${fullPath}`);

  try {
    // Handle different API endpoints
    if (fullPath.startsWith('api/loyverse/')) {
      const endpoint = fullPath.replace('api/loyverse/', '');
      
      if (endpoint === 'data') {
        // Comprehensive data endpoint
        console.log('Fetching comprehensive Loyverse data...');
        
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

        const data = {
          items: itemsResponse.status === 'fulfilled' ? itemsResponse.value : { items: [] },
          categories: categoriesResponse.status === 'fulfilled' ? categoriesResponse.value : { categories: [] },
          modifiers: modifiersResponse.status === 'fulfilled' ? modifiersResponse.value : { modifiers: [] },
          stores: storesResponse.status === 'fulfilled' ? storesResponse.value : { stores: [] },
          taxes: taxesResponse.status === 'fulfilled' ? taxesResponse.value : { taxes: [] },
          errors: []
        };

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

        res.json(data);
      } else if (endpoint === 'modifiers') {
        const data = await makeLoyverseRequest('modifiers');
        res.json(data);
      } else if (endpoint === 'modifier-groups') {
        const modifiersData = await makeLoyverseRequest('modifiers');
        
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
      } else if (endpoint === 'variants') {
        const data = await makeLoyverseRequest('items');
        
        const itemsWithVariants = data.items.filter(item => 
          item.variants && item.variants.length > 1
        );
        
        res.json({ 
          items_with_variants: itemsWithVariants,
          total_items: data.items.length,
          items_with_variants_count: itemsWithVariants.length
        });
      } else {
        // Generic endpoint
        const data = await makeLoyverseRequest(endpoint, req.query);
        res.json(data);
      }
    } else {
      // Serve static files or handle root path
      res.status(404).json({ error: 'Not found' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
};
