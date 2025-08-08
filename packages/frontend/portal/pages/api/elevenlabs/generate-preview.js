// pages/api/elevenlabs/generate-preview.js

// Function to generate audio using ElevenLabs API
async function generateElevenLabsAudio(text, voiceId, settings) {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    throw new Error('ElevenLabs API key not configured');
  }

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  const requestBody = {
    text: text,
    model_id: "eleven_monolingual_v1", // Can be made configurable
    voice_settings: {
      stability: settings.stability || 0.5,
      similarity_boost: settings.similarityBoost || 0.75,
      style: settings.style || 0.0,
      use_speaker_boost: settings.speakerBoost || true
    }
  };

  console.log('Generating audio with ElevenLabs:', {
    voiceId,
    textLength: text.length,
    settings
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    // Return the audio buffer
    const audioBuffer = await response.arrayBuffer();
    return Buffer.from(audioBuffer);

  } catch (error) {
    console.error('ElevenLabs API error:', error);
    throw error;
  }
}

// Mock audio generation for testing (returns a small audio file)
async function generateMockAudio(text, voiceId, settings) {
  console.log('Generating mock audio preview:', {
    text: text.substring(0, 50) + '...',
    voiceId,
    settings
  });

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Return a tiny MP3 buffer (empty audio - just for testing)
  // In a real scenario, you might return a pre-recorded sample
  const mockMp3Header = Buffer.from([
    0xFF, 0xFB, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
  ]);

  return mockMp3Header;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, voiceId, settings = {} } = req.body;

    // Validation
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required and must be a string' });
    }

    if (!voiceId || typeof voiceId !== 'string') {
      return res.status(400).json({ error: 'Voice ID is required' });
    }

    if (text.length > 1000) {
      return res.status(400).json({
        error: 'Text too long',
        details: 'Preview text must be under 1000 characters',
        current_length: text.length
      });
    }

    // Validate settings
    const validatedSettings = {
      stability: Math.max(0, Math.min(1, settings.stability || 0.5)),
      similarityBoost: Math.max(0, Math.min(1, settings.similarityBoost || 0.75)),
      style: Math.max(0, Math.min(1, settings.style || 0.0)),
      speakerBoost: Boolean(settings.speakerBoost !== false)
    };

    console.log('Voice preview request:', {
      textLength: text.length,
      voiceId,
      settings: validatedSettings
    });

    let audioBuffer;
    let usedMockData = false;

    try {
      // Try ElevenLabs API first
      if (process.env.ELEVENLABS_API_KEY) {
        audioBuffer = await generateElevenLabsAudio(text, voiceId, validatedSettings);
      } else {
        throw new Error('API key not available');
      }
    } catch (error) {
      console.warn('ElevenLabs API failed, using mock audio:', error.message);
      audioBuffer = await generateMockAudio(text, voiceId, validatedSettings);
      usedMockData = true;
    }

    // Set appropriate headers for audio response
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'attachment; filename="voice-preview.mp3"');
    res.setHeader('Content-Length', audioBuffer.length);

    // Add custom headers for debugging
    res.setHeader('X-Voice-ID', voiceId);
    res.setHeader('X-Text-Length', text.length.toString());
    res.setHeader('X-Mock-Data', usedMockData.toString());
    res.setHeader('X-Settings', JSON.stringify(validatedSettings));

    // Log successful generation
    console.log('Audio preview generated successfully:', {
      voiceId,
      audioSize: audioBuffer.length,
      usedMockData,
      settings: validatedSettings
    });

    return res.status(200).send(audioBuffer);

  } catch (error) {
    console.error('Error generating voice preview:', error);

    // Determine error type for better user feedback
    let errorCode = 500;
    let errorMessage = 'Failed to generate voice preview';

    if (error.message.includes('API key')) {
      errorCode = 503;
      errorMessage = 'Voice generation service temporarily unavailable';
    } else if (error.message.includes('quota') || error.message.includes('limit')) {
      errorCode = 429;
      errorMessage = 'Voice generation quota exceeded. Please try again later.';
    } else if (error.message.includes('voice')) {
      errorCode = 400;
      errorMessage = 'Invalid voice ID or voice not available';
    }

    return res.status(errorCode).json({
      error: errorMessage,
      details: error.message,
      voice_id: req.body.voiceId,
      suggestions: [
        'Try a different voice',
        'Reduce the text length',
        'Check your voice settings',
        'Try again in a few minutes'
      ]
    });
  }
}

// Utility function to validate voice settings
function validateVoiceSettings(settings) {
  const validated = {};

  // Stability: 0-1
  if (typeof settings.stability === 'number') {
    validated.stability = Math.max(0, Math.min(1, settings.stability));
  }

  // Similarity boost: 0-1
  if (typeof settings.similarityBoost === 'number') {
    validated.similarityBoost = Math.max(0, Math.min(1, settings.similarityBoost));
  }

  // Style: 0-1
  if (typeof settings.style === 'number') {
    validated.style = Math.max(0, Math.min(1, settings.style));
  }

  // Speaker boost: boolean
  validated.speakerBoost = Boolean(settings.speakerBoost);

  return validated;
}

// Export config for external use
export const config = {
  api: {
    responseLimit: '10mb', // Allow larger responses for audio
  },
};