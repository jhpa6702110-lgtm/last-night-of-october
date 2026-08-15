// Google Gemini / Google Cloud Text-to-Speech AI Voice Service Helper

export const DJ_VOICE_PRESETS = [
  { id: 'female_warm', label: '📻 따뜻한 아나운서 여성 DJ', voiceName: 'ko-KR-Neural2-A', gender: 'FEMALE', rate: 0.88, pitch: -0.5 },
  { id: 'male_deep', label: '🎙️ 나긋나긋 중저음 남성 DJ', voiceName: 'ko-KR-Neural2-C', gender: 'MALE', rate: 0.88, pitch: -2.0 },
  { id: 'female_gentle', label: '🌸 다정한 낭만 낭독 여성 DJ', voiceName: 'ko-KR-Wavenet-A', gender: 'FEMALE', rate: 0.86, pitch: -1.0 },
  { id: 'male_soft', label: '🌙 꿀보이스 심야 낭독 남성 DJ', voiceName: 'ko-KR-Neural2-B', gender: 'MALE', rate: 0.86, pitch: -1.2 },
  { id: 'female_sweet', label: '✨ 감미로운 추억의 여성 DJ', voiceName: 'ko-KR-Wavenet-B', gender: 'FEMALE', rate: 0.90, pitch: 0.0 },
  { id: 'male_classic', label: '📻 클래식 명품 아나운서 DJ', voiceName: 'ko-KR-Wavenet-D', gender: 'MALE', rate: 0.86, pitch: -2.5 }
];

export const generateGeminiAudio = async (text, voicePresetId = 'female_warm', apiKey = null) => {
  // Check localStorage first, then env variables
  const savedKey = typeof window !== 'undefined' ? localStorage.getItem('user_gemini_api_key') : null;
  const key = apiKey || savedKey || import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_TTS_API_KEY;

  if (!key) {
    console.warn('Gemini / Google Cloud TTS API Key not found in .env or localStorage. Falling back to tuned Web Speech API.');
    return null;
  }

  // Match voice preset
  const preset = DJ_VOICE_PRESETS.find(p => p.id === voicePresetId) || DJ_VOICE_PRESETS[0];

  const requestBody = {
    input: { text },
    voice: {
      languageCode: 'ko-KR',
      name: preset.voiceName,
      ssmlGender: preset.gender
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: preset.rate,
      pitch: preset.pitch
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
