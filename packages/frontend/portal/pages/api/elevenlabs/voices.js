// pages/api/elevenlabs/voices.js

// Mock voice data - replace with actual ElevenLabs API calls
const mockVoices = [
  {
    voice_id: 'pNInz6obpgDQGcFmaJgB',
    name: 'Adam',
    category: 'premade',
    description: 'Deep, authoritative male voice perfect for professional presentations',
    preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/pNInz6obpgDQGcFmaJgB/df6788f9-5c96-470d-8312-aab3b3d8f50a.mp3',
    labels: ['american', 'male', 'middle aged', 'authoritative']
  },
  {
    voice_id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Sarah',
    category: 'premade',
    description: 'Warm, friendly female voice ideal for customer service and sales',
    preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/EXAVITQu4vr4xnSDxMaL/b7d50ccb-934d-44bb-9bb4-9f4d0cb96b38.mp3',
    labels: ['american', 'female', 'young', 'friendly']
  },
  {
    voice_id: 'ErXwobaYiN019PkySvjV',
    name: 'Antoni',
    category: 'premade',
    description: 'Smooth, confident male voice with slight accent, great for storytelling',
    preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/ErXwobaYiN019PkySvjV/e4bb5ba7-f0c7-4d87-9f90-42ab9bb4cd7c.mp3',
    labels: ['american', 'male', 'young', 'confident']
  },
  {
    voice_id: '21m00Tcm4TlvDq8ikWAM',
    name: 'Rachel',
    category: 'premade',
    description: 'Professional, clear female voice perfect for business communications',
    preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/21m00Tcm4TlvDq8ikWAM/7db4d0ac-9aef-4999-a5b8-fb2e01b8b1f7.mp3',
    labels: ['american', 'female', 'mature', 'professional']
  },
  {
    voice_id: 'AZnzlk1XvdvUeBnXmlld',
    name: 'Domi',
    category: 'premade',
    description: 'Energetic, youthful female voice with enthusiasm',
    preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/AZnzlk1XvdvUeBnXmlld/69267136-1bdc-412c-b726-3b33d56e7d1b.mp3',
    labels: ['american', 'female', 'young', 'energetic']
  },
  {
    voice_id: 'VR6AewLTigWG4xSOukaG',
    name: 'Arnold',
    category: 'premade',
    description: 'Mature, experienced male voice with gravitas',
    preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/VR6AewLTigWG4xSOukaG/ce966f6b-7e48-4b2b-ab9e-b9b77cd7c4b6.mp3',
    labels: ['american', 'male', 'mature', 'authoritative']
  },
  {
    voice_id: 'MF3mGyEYCl7XYWbV9V6O',
    name: 'Bella',
    category: 'premade',
    description: 'Soft, gentle female voice perfect for calming interactions',
    preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/MF3mGyEYCl7XYWbV9V6O/f9f3abce-0f69-4b1e-b3a1-e3cffe35b8c8.mp3',
    labels: ['american', 'female', 'young', 'gentle']
  },
  {
    voice_id: 'TxGEqnHWrfWFTfGW9XjX',
    name: 'Josh',
    category: 'premade',
    description: 'Casual, approachable male voice great for conversational AI',
    preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/TxGEqnHWrfWFTfGW9XjX/b29d6748-1e7f-4f87-9f9b-b4b8c0c6d8f7.mp3',
    labels: ['american', 'male', 'young', 'casual']
  }
];

// Function to call actual ElevenLabs API
async function fetchElevenLabsVoices() {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    console.warn('ElevenLabs API key not found, using mock data');
    return mockVoices;
  }

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Transform ElevenLabs response to our format
    const voices = data.voices.map(voice => ({
      voice_id: voice.voice_id,
      name: voice.name,
      category: voice.category || 'premade',
      description: voice.description || `${voice.name} voice from ElevenLabs`,
      preview_url: voice.preview_url,
      labels: voice.labels || {}
    }));

    console.log(`Fetched ${voices.length} voices from ElevenLabs`);
    return voices;

  } catch (error) {
    console.error('Error fetching from ElevenLabs API:', error);
    console.log('Falling back to mock voice data');
    return mockVoices;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get tenant authentication (you might want to add auth middleware)
    const tenantId = req.headers['x-tenant-id'];

    if (!tenantId) {
      console.warn('No tenant ID provided, returning public voices');
    }

    console.log('Fetching available voices...');

    const voices = await fetchElevenLabsVoices();

    // Filter voices based on tenant plan or preferences if needed
    const filteredVoices = filterVoicesForTenant(voices, tenantId);

    // Add metadata
    const response = {
      voices: filteredVoices,
      total_count: filteredVoices.length,
      categories: [...new Set(filteredVoices.map(v => v.category))],
      last_updated: new Date().toISOString(),
      source: process.env.ELEVENLABS_API_KEY ? 'elevenlabs_api' : 'mock_data'
    };

    console.log(`Returning ${filteredVoices.length} voices for tenant ${tenantId || 'anonymous'}`);

    // Cache for 5 minutes
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.status(200).json(response);

  } catch (error) {
    console.error('Error in voices API:', error);

    return res.status(500).json({
      error: 'Failed to fetch voices',
      details: error.message,
      fallback: mockVoices.slice(0, 3) // Return first 3 mock voices as fallback
    });
  }
}

// Helper function to filter voices based on tenant plan
function filterVoicesForTenant(voices, tenantId) {
  // TODO: Implement plan-based filtering
  // For now, return all voices

  // Example filtering logic:
  // const tenantPlan = await getTenantPlan(tenantId);
  // if (tenantPlan === 'free') {
  //   return voices.filter(v => v.category === 'free');
  // }

  return voices;
}

// Helper function to get tenant plan (placeholder)
async function getTenantPlan(tenantId) {
  // TODO: Query database for tenant plan
  return 'professional'; // Default for now
}

// You can also export the mock data for testing
export { mockVoices };