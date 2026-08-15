// Google Cloud Neural2 Real AI Voice Engine Presets

export const DJ_VOICE_PRESETS = [
  { id: 'female_warm', label: '📻 따뜻한 아나운서 여성 DJ', voiceName: 'ko-KR-Neural2-A', gender: 'FEMALE', pitch: 1.15, rate: 0.95 },
  { id: 'male_deep', label: '🎙️ 나긋나긋 중저음 남성 DJ', voiceName: 'ko-KR-Neural2-C', gender: 'MALE', pitch: 0.45, rate: 0.82 },
  { id: 'female_gentle', label: '🌸 다정한 낭만 낭독 여성 DJ', voiceName: 'ko-KR-Wavenet-A', gender: 'FEMALE', pitch: 1.05, rate: 0.88 },
  { id: 'male_soft', label: '🌙 꿀보이스 심야 낭독 남성 DJ', voiceName: 'ko-KR-Neural2-B', gender: 'MALE', pitch: 0.60, rate: 0.85 },
  { id: 'female_sweet', label: '✨ 감미로운 추억의 여성 DJ', voiceName: 'ko-KR-Wavenet-B', gender: 'FEMALE', pitch: 1.35, rate: 1.02 },
  { id: 'male_classic', label: '📻 클래식 명품 아나운서 DJ', voiceName: 'ko-KR-Wavenet-D', gender: 'MALE', pitch: 0.35, rate: 0.78 }
];

export const generateGeminiAudio = async (text, voicePresetId = 'female_warm', apiKey = null) => {
  const savedKey = typeof window !== 'undefined' ? localStorage.getItem('user_gemini_api_key') : null;
  const key = apiKey || savedKey || import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_TTS_API_KEY;

  const preset = DJ_VOICE_PRESETS.find(p => p.id === voicePresetId) || DJ_VOICE_PRESETS[0];

  if (key && key.length > 15) {
    try {
      const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: 'ko-KR',
            name: preset.voiceName,
            ssmlGender: preset.gender
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: preset.rate,
            pitch: preset.gender === 'MALE' ? -1.5 : 0.0
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
        const errText = await response.text();
        console.warn('Cloud Neural2 TTS fallback to local engine:', errText);
      }
    } catch (err) {
      console.warn('Cloud Neural2 TTS network fallback:', err);
    }
  }

  return { audioUrl: null, preset };
};
