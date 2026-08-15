// 7080 Radio DJ Voice Engine Presets for All Browsers & Mobile Devices

export const DJ_VOICE_PRESETS = [
  { id: 'female_warm', label: '📻 따뜻한 아나운서 여성 DJ', pitch: 1.10, rate: 0.95, gender: 'FEMALE' },
  { id: 'male_deep', label: '🎙️ 나긋나긋 중저음 남성 DJ', pitch: 0.60, rate: 0.85, gender: 'MALE' },
  { id: 'female_gentle', label: '🌸 다정한 낭만 낭독 여성 DJ', pitch: 1.02, rate: 0.88, gender: 'FEMALE' },
  { id: 'male_soft', label: '🌙 꿀보이스 심야 낭독 남성 DJ', pitch: 0.75, rate: 0.88, gender: 'MALE' },
  { id: 'female_sweet', label: '✨ 감미로운 추억의 여성 DJ', pitch: 1.35, rate: 1.02, gender: 'FEMALE' },
  { id: 'male_classic', label: '📻 클래식 명품 아나운서 DJ', pitch: 0.50, rate: 0.80, gender: 'MALE' }
];

export const generateGeminiAudio = async (text, voicePresetId = 'female_warm') => {
  const preset = DJ_VOICE_PRESETS.find(p => p.id === voicePresetId) || DJ_VOICE_PRESETS[0];
  return { preset };
};
