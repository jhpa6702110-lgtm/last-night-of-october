// Google Gemini / Google Cloud Text-to-Speech AI Voice Service Helper

export const generateGeminiAudio = async (text, gender = 'female', apiKey = null) => {
  // Check localStorage first, then env variables
  const savedKey = typeof window !== 'undefined' ? localStorage.getItem('user_gemini_api_key') : null;
  const key = apiKey || savedKey || import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_TTS_API_KEY;

  if (!key) {
    console.warn('Gemini / Google Cloud TTS API Key not found in .env or localStorage. Falling back to tuned Web Speech API.');
    return null;
  }

  // Google Cloud Neural2 / WaveNet Voice selection for realistic Radio DJ quality
  // ko-KR-Neural2-A (Soft Female), ko-KR-Neural2-C (Smooth Male)
  const voiceName = gender === 'male' ? 'ko-KR-Neural2-C' : 'ko-KR-Neural2-A';

  const requestBody = {
    input: { text },
    voice: {
      languageCode: 'ko-KR',
      name: voiceName,
      ssmlGender: gender === 'male' ? 'MALE' : 'FEMALE'
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 0.88, // Calm radio DJ pace
      pitch: gender === 'male' ? -2.0 : -0.5 // Warm, silky DJ pitch
    }
  };

  try {
    const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('Gemini TTS API error:', errText);
      return null;
    }

    const data = await response.json();
    if (data.audioContent) {
      const audioUrl = `data:audio/mp3;base64,${data.audioContent}`;
      return audioUrl;
    }
  } catch (err) {
    console.error('Error generating Gemini Audio:', err);
  }

  return null;
};
