// Google Cloud TTS 6종 라디오 DJ 성우 전용 모델 매핑

export const DJ_VOICE_PRESETS = [
  { id: 'female_warm', label: '📻 따뜻한 아나운서 여성 DJ', gender: 'FEMALE', voiceName: 'ko-KR-Neural2-A', pitch: 0.0, rate: 0.95 },
  { id: 'male_deep', label: '🎙️ 나긋나긋 중저음 남성 DJ', gender: 'MALE', voiceName: 'ko-KR-Neural2-C', pitch: -1.5, rate: 0.88 },
  { id: 'female_gentle', label: '🌸 다정한 낭만 낭독 여성 DJ', gender: 'FEMALE', voiceName: 'ko-KR-Neural2-B', pitch: 0.5, rate: 0.90 },
  { id: 'male_soft', label: '🌙 꿀보이스 심야 낭독 남성 DJ', gender: 'MALE', voiceName: 'ko-KR-Wavenet-D', pitch: -0.5, rate: 0.85 },
  { id: 'female_sweet', label: '✨ 감미로운 추억의 여성 DJ', gender: 'FEMALE', voiceName: 'ko-KR-Neural2-A', pitch: 1.2, rate: 0.98 },
  { id: 'male_classic', label: '📻 클래식 명품 아나운서 DJ', gender: 'MALE', voiceName: 'ko-KR-Wavenet-C', pitch: -1.8, rate: 0.90 }
];

export const generateGeminiAudio = async (text, voicePresetId = 'female_warm', apiKey = null) => {
  const savedKey = typeof window !== 'undefined' ? localStorage.getItem('user_gemini_api_key') : null;
  const key = apiKey || savedKey || import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_TTS_API_KEY;
  const preset = DJ_VOICE_PRESETS.find(p => p.id === voicePresetId) || DJ_VOICE_PRESETS[0];

  if (!key || key.length < 15) {
    console.warn('Google Cloud TTS API 키가 유효하지 않습니다.');
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
          // 프리셋에 지정된 고유 성우 모델 전달 (Neural2-A/B/C, Wavenet-C/D)
          name: preset.voiceName,
          ssmlGender: preset.gender
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: preset.rate,
          pitch: preset.pitch
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
      console.error('Google Cloud TTS API 오류:', errorData);
    }
  } catch (err) {
    console.error('TTS 호출 중 네트워크 에러 발생:', err);
  }

  return { audioUrl: null, preset };
};
