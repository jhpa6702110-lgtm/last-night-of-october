// Google Cloud Neural2 Real AI Voice Engine Presets

export const DJ_VOICE_PRESETS = [
  { id: 'female_warm', label: '📻 따뜻한 아나운서 여성 DJ', gender: 'FEMALE', voiceName: 'ko-KR-Neural2-A', pitch: 0.0, rate: 0.95 },
  { id: 'male_deep', label: '🎙️ 나긋나긋 중저음 남성 DJ', gender: 'MALE', voiceName: 'ko-KR-Neural2-C', pitch: -2.0, rate: 0.90 },
  { id: 'female_gentle', label: '🌸 다정한 낭만 낭독 여성 DJ', gender: 'FEMALE', voiceName: 'ko-KR-Neural2-B', pitch: 0.5, rate: 0.92 },
  { id: 'male_soft', label: '🌙 꿀보이스 심야 낭독 남성 DJ', gender: 'MALE', voiceName: 'ko-KR-Neural2-C', pitch: -1.0, rate: 0.92 },
  { id: 'female_sweet', label: '✨ 감미로운 추억의 여성 DJ', gender: 'FEMALE', voiceName: 'ko-KR-Neural2-A', pitch: 1.0, rate: 0.98 },
  { id: 'male_classic', label: '📻 클래식 명품 아나운서 DJ', gender: 'MALE', voiceName: 'ko-KR-Neural2-C', pitch: -2.5, rate: 0.88 }
];

export const generateGeminiAudio = async (text, voicePresetId = 'female_warm', apiKey = null) => {
  const savedKey = typeof window !== 'undefined' ? localStorage.getItem('user_gemini_api_key') : null;
  const key = apiKey || savedKey || import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_TTS_API_KEY;
  const preset = DJ_VOICE_PRESETS.find(p => p.id === voicePresetId) || DJ_VOICE_PRESETS[0];

  if (!key || key.length < 15) {
    console.error('TTS API Key가 누락되었거나 유효하지 않습니다.');
    return { audioUrl: null, preset };
  }

  try {
    const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: 'ko-KR',
          name: preset.voiceName || (preset.gender === 'MALE' ? 'ko-KR-Neural2-C' : 'ko-KR-Neural2-A'),
          ssmlGender: preset.gender
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: preset.rate || 0.92,
          pitch: preset.pitch || 0.0
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.audioContent) {
        return {
          audioUrl: `data:audio/mp3;base64,${data.audioContent}`,
          preset
        };
      }
    } else {
      const errorData = await response.json();
      console.error('Google Cloud TTS Error:', errorData);
    }
  } catch (err) {
    console.error('Cloud Neural2 TTS Network Error:', err);
  }

  return { audioUrl: null, preset };
};
