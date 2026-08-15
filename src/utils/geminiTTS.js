// 7080 Radio DJ Voice Engine - 100% Mobile & PC Compatible MP3 Audio Streamer

export const DJ_VOICE_PRESETS = [
  { id: 'female_warm', label: '📻 따뜻한 아나운서 여성 DJ', gender: 'FEMALE', rate: 0.95, pitch: 1.15, speed: 1.02 },
  { id: 'male_deep', label: '🎙️ 나긋나긋 중저음 남성 DJ', gender: 'MALE', rate: 0.82, pitch: 0.45, speed: 0.80 },
  { id: 'female_gentle', label: '🌸 다정한 낭만 낭독 여성 DJ', gender: 'FEMALE', rate: 0.88, pitch: 1.05, speed: 0.94 },
  { id: 'male_soft', label: '🌙 꿀보이스 심야 낭독 남성 DJ', gender: 'MALE', rate: 0.85, pitch: 0.60, speed: 0.84 },
  { id: 'female_sweet', label: '✨ 감미로운 추억의 여성 DJ', gender: 'FEMALE', rate: 1.02, pitch: 1.35, speed: 1.12 },
  { id: 'male_classic', label: '📻 클래식 명품 아나운서 DJ', gender: 'MALE', rate: 0.78, pitch: 0.35, speed: 0.76 }
];

export const generateGeminiAudio = async (text, voicePresetId = 'female_warm', apiKey = null) => {
  const savedKey = typeof window !== 'undefined' ? localStorage.getItem('user_gemini_api_key') : null;
  const key = apiKey || savedKey || import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_TTS_API_KEY;
  const preset = DJ_VOICE_PRESETS.find(p => p.id === voicePresetId) || DJ_VOICE_PRESETS[0];

  // 1. Try Google Cloud TTS REST API if key is valid and active
  if (key && key.length > 15) {
    try {
      let semitonePitch = 0.0;
      if (preset.id === 'male_deep') semitonePitch = -6.5;
      else if (preset.id === 'male_classic') semitonePitch = -9.0;
      else if (preset.id === 'male_soft') semitonePitch = -4.5;
      else if (preset.id === 'female_sweet') semitonePitch = 2.5;

      const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: 'ko-KR',
            name: preset.gender === 'MALE' ? 'ko-KR-Neural2-C' : 'ko-KR-Neural2-A',
            ssmlGender: preset.gender
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: preset.rate || 0.88,
            pitch: semitonePitch
          }
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

  // 2. High-Quality 100% Mobile Compatible Audio Engine (Android, iPhone, KakaoTalk browser!)
  try {
    const cleanText = text
      .replace(/[^a-zA-Z0-9가-힣ㄱ-ㅎㅏ-ㅣ\s.,!?]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 140); // 140 char clean chunk for 100% reliable streaming MP3

    if (cleanText.length > 0) {
      const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ko&client=tw-ob&q=${encodeURIComponent(cleanText)}`;
      return {
        audioUrl,
        playbackRate: preset.speed || 1.0,
        preset
      };
    }
  } catch (err) {
    console.error('Audio Stream error:', err);
  }

  return { audioUrl: null, preset };
};
