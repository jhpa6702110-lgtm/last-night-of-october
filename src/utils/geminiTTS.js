// Google Gemini & High-Quality Audio Voice Service Helper

export const DJ_VOICE_PRESETS = [
  { id: 'female_warm', label: '📻 따뜻한 아나운서 여성 DJ', voiceName: 'ko-KR-Neural2-A', gender: 'FEMALE', rate: 0.88, pitch: -0.5, mobileSpeed: 1.02 },
  { id: 'male_deep', label: '🎙️ 나긋나긋 중저음 남성 DJ', voiceName: 'ko-KR-Neural2-C', gender: 'MALE', rate: 0.88, pitch: -2.0, mobileSpeed: 0.82 },
  { id: 'female_gentle', label: '🌸 다정한 낭만 낭독 여성 DJ', voiceName: 'ko-KR-Wavenet-A', gender: 'FEMALE', rate: 0.86, pitch: -1.0, mobileSpeed: 0.94 },
  { id: 'male_soft', label: '🌙 꿀보이스 심야 낭독 남성 DJ', voiceName: 'ko-KR-Neural2-B', gender: 'MALE', rate: 0.86, pitch: -1.2, mobileSpeed: 0.88 },
  { id: 'female_sweet', label: '✨ 감미로운 추억의 여성 DJ', voiceName: 'ko-KR-Wavenet-B', gender: 'FEMALE', rate: 0.90, pitch: 0.0, mobileSpeed: 1.10 },
  { id: 'male_classic', label: '📻 클래식 명품 아나운서 DJ', voiceName: 'ko-KR-Wavenet-D', gender: 'MALE', rate: 0.86, pitch: -2.5, mobileSpeed: 0.78 }
];

export const generateGeminiAudio = async (text, voicePresetId = 'female_warm', apiKey = null) => {
  const savedKey = typeof window !== 'undefined' ? localStorage.getItem('user_gemini_api_key') : null;
  const key = apiKey || savedKey || import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_TTS_API_KEY;

  const preset = DJ_VOICE_PRESETS.find(p => p.id === voicePresetId) || DJ_VOICE_PRESETS[0];

  // 1. Try Google Cloud Neural2 API if valid API key is available
  if (key && key.length > 20) {
    try {
      const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text },
          voice: { languageCode: 'ko-KR', name: preset.voiceName, ssmlGender: preset.gender },
          audioConfig: { audioEncoding: 'MP3', speakingRate: preset.rate, pitch: preset.pitch }
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.audioContent) {
          return {
            audioUrl: `data:audio/mp3;base64,${data.audioContent}`,
            playbackRate: 1.0,
            preset
          };
        }
      }
    } catch (err) {
      console.warn('Cloud API fallback:', err);
    }
  }

  // 2. High-Quality Mobile-Compatible Audio Stream (Works on Android, iPhone, KakaoTalk browser!)
  try {
    const cleanText = text.replace(/[\n\r]+/g, ' ').slice(0, 200);
    const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ko&client=tw-ob&q=${encodeURIComponent(cleanText)}`;
    return {
      audioUrl,
      playbackRate: preset.mobileSpeed || 1.0,
      preset
    };
  } catch (err) {
    console.error('Error generating audio:', err);
  }

  return null;
};
