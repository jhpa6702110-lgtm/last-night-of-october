import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import { generateGeminiAudio, DJ_VOICE_PRESETS } from '../utils/geminiTTS';
import { Radio, Volume2, VolumeX, Music, Heart, Plus, Sparkles, MessageCircle, Send, Play, Pause, Square, User, X, Check, Share2, HelpCircle, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function RadioStories({ session, alumniProfile, setActiveTab }) {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeAudioStoryId, setActiveAudioStoryId] = useState(null);
  const [speakingStoryId, setSpeakingStoryId] = useState(null);
  const [likesMap, setLikesMap] = useState({});

  // Comments / Replies state
  const [expandedCommentsId, setExpandedCommentsId] = useState(null);
  const [commentsMap, setCommentsMap] = useState({});
  const [newCommentText, setNewCommentText] = useState('');

  // New Story Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [formSenderName, setFormSenderName] = useState(alumniProfile?.name || '');
  const [formRecipientName, setFormRecipientName] = useState('사랑하는 동창 친구들 전체');
  const [formSongTitle, setFormSongTitle] = useState('');
  const [formArtistName, setFormArtistName] = useState('');
  const [formContent, setFormContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // User Preferred DJ Voice State (Persisted in localStorage)
  const [userDjVoice, setUserDjVoice] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('user_preferred_dj_voice') || 'female_warm';
    }
    return 'female_warm';
  });

  const handleSelectVoice = (presetId) => {
    setUserDjVoice(presetId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_preferred_dj_voice', presetId);
    }
  };

  // API Key Modal State
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [userApiKeyInput, setUserApiKeyInput] = useState(
    typeof window !== 'undefined' ? (localStorage.getItem('user_gemini_api_key') || '') : ''
  );

  // Audio & TTS refs
  const audioRef = useRef(null);
  const utteranceRef = useRef(null);

  const triggerConfetti = () => {
    confetti({
      particleCount: 85,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  // Web Audio Soft Radio Chime Sound (띵동~)
  const playRadioChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.35); // G5
      
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.7);
    } catch (err) {
      console.log('Chime sound blocked:', err);
    }
  };

  useEffect(() => {
    fetchStories();

    return () => {
      stopTTS();
      stopBGM();
    };
  }, []);

  const fetchStories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('radio_stories')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setStories(data);
      } else {
        // Fallback sample data if DB table is not created yet
        setStories([
          {
            id: 'story-1',
            sender_name: '김철수',
            recipient_name: '3학년 2반 친구들 전체',
            song_title: '잊혀진 계절',
            artist_name: '이용',
            song_url: 'https://jinheestate.blog/wp-content/uploads/2026/07/잊혀진-계절.mp3',
            content: `어느덧 세월이 흘러 5070이 된 사랑하는 친구들아!\n시월의 마지막 밤 노래만 나오면 고등학교 때 교정에 흩날리던 붉은 단풍잎과, 수업 마치고 빵집에 모여 도란도란 수다 떨던 너희들 얼굴이 눈에 선하단다.\n다들 건강 잘 챙기고 10월 정기 모임에서 반가운 얼굴로 꼭 만나자구나!`,
            likes_count: 14,
            created_at: new Date().toISOString()
          },
          {
            id: 'story-2',
            sender_name: '이영희',
            recipient_name: '보고 싶은 친구 박영수에게',
            song_title: 'Sea Of Heartbreak',
            artist_name: 'Original',
            song_url: 'https://jinheestate.blog/wp-content/uploads/2026/07/Sea-Of-Heartbreak-Ori.mp3',
            content: `영수야, 지난번 야유회 때 맛있는 과일 챙겨줘서 너무 고마웠어.\n우리가 벌써 환갑을 지나 70을 바라보는 나이가 되었지만, 마음만은 여전히 18세 청춘 같구나.\n네가 좋아하던 올드팝 함께 들으며 건강하길 바란다!`,
            likes_count: 9,
            created_at: new Date(Date.now() - 86400000 * 2).toISOString()
          }
        ]);
      }
    } catch (err) {
      console.error('Error fetching radio stories:', err);
    } finally {
      setLoading(false);
    }
  };

  // TTS Helper Functions
  const stopTTS = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingStoryId(null);
  };

  const stopBGM = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setActiveAudioStoryId(null);
  };

  // Find best natural Korean voice
  const selectBestVoice = (gender) => {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    const koVoices = voices.filter(v => v.lang.includes('ko') || v.lang.includes('KO'));
    if (koVoices.length === 0) return null;

    if (gender === 'male') {
      const maleVoice = koVoices.find(v => 
        v.name.includes('InJoon') || v.name.includes('YunJie') || v.name.includes('MinJae') || 
        v.name.includes('Male') || v.name.includes('남성') || v.name.includes('남자')
      );
      // 남성 DJ 선택 시 여성 성우 프로필 반환을 원천 차단하여 피치 변조가 중저음 남성 톤으로 적용되게 합니다.
      return maleVoice || null;
    }

    const femaleVoice = koVoices.find(v => 
      v.name.includes('SunHi') || v.name.includes('Heami') || v.name.includes('Female') || 
      v.name.includes('여성') || v.name.includes('Yuna')
    );
    return femaleVoice || koVoices[0];
  };

  const handlePlayTTS = async (story) => {
    // If currently speaking this story, stop it
    if (speakingStoryId === story.id) {
      stopTTS();
      return;
    }

    stopTTS(); // Stop any active speech

    // Play subtle radio chime sound effect
    playRadioChime();

    // Natural Speech Formatting with radio DJ pauses
    const formattedContent = (story.content || '')
      .replace(/!/g, '! ... ')
      .replace(/\?/g, '? ... ')
      .replace(/\./g, '. ... ')
      .replace(/,/g, ', ... ')
      .replace(/\n/g, ' ... ');

    const currentPreset = DJ_VOICE_PRESETS.find(p => p.id === userDjVoice) || DJ_VOICE_PRESETS[0];

    const senderName = story.sender_name || '동문';
    const recipientName = story.recipient_name || '동문들';
    const songTitle = story.song_title || '추억의 곡';

    const djGreeting = `안녕하세요. 시월의 밤 라디오 ${currentPreset.label.replace(/^[^\s]+\s*/, '')}입니다. ... `;
    const djIntro = `${djGreeting} ... ${senderName} 동문이 ${recipientName}에게 전하는 따뜻한 사연입니다. ... 사연 함께 들어보시죠. ... `;
    const djOutro = ` ... 이상 ${senderName} 동문의 사연이었습니다. ... 신청곡 ${songTitle} 함께 감상해 보세요.`;

    const fullSpeechText = `${djIntro} ${formattedContent} ${djOutro}`;

    if (!('speechSynthesis' in window)) {
      alert('사용 중이신 브라우저는 음성 낭독(TTS)을 지원하지 않습니다.');
      setSpeakingStoryId(null);
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Cancel any existing queue

      const utterance = new SpeechSynthesisUtterance(fullSpeechText);
      utterance.lang = 'ko-KR';
      utterance.rate = currentPreset.rate || 0.88;
      utterance.pitch = currentPreset.pitch || 1.0; // Pitch 0.50 ~ 1.35 distinct voice modulation

      const bestVoice = selectBestVoice(currentPreset.gender === 'MALE' ? 'male' : 'female');
      if (bestVoice) {
        try {
          utterance.voice = bestVoice;
        } catch (vErr) {
          console.warn('Voice set error:', vErr);
        }
      }

      utterance.onstart = () => {
        setSpeakingStoryId(story.id);
      };

      utterance.onend = () => {
        setSpeakingStoryId(null);
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis event notice:', e);
        setSpeakingStoryId(null);
      };

      // Play soft BGM simultaneously underneath DJ voice
      if (story.song_url) {
        stopBGM();
        const audio = new Audio(story.song_url);
        audio.volume = 0.15;
        audioRef.current = audio;
        audio.play().catch(err => console.log('BGM play blocked:', err));
        setActiveAudioStoryId(story.id);
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('SpeechSynthesis error:', err);
      setSpeakingStoryId(null);
    }
  };

  const handleToggleBGMOnly = (story) => {
    if (activeAudioStoryId === story.id) {
      stopBGM();
      return;
    }

    stopBGM();
    const songUrl = story.song_url || 'https://jinheestate.blog/wp-content/uploads/2026/07/잊혀진-계절.mp3';
    const audio = new Audio(songUrl);
    audio.volume = 0.7;
    audioRef.current = audio;
    audio.play().catch(err => console.log('BGM error:', err));
    setActiveAudioStoryId(story.id);
  };

  const handleLike = (storyId) => {
    triggerConfetti();
    setLikesMap(prev => ({
      ...prev,
      [storyId]: (prev[storyId] || 0) + 1
    }));
  };

  const handleAddStory = async (e) => {
    e.preventDefault();
    if (!formSongTitle || !formContent.trim()) {
      alert('신청곡 제목과 사연 내용을 모두 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const newStory = {
        id: 'story-' + Date.now(),
        sender_name: formSenderName || alumniProfile?.name || '동문',
        recipient_name: formRecipientName || '동창 친구들 전체',
        song_title: formSongTitle,
        artist_name: formArtistName || '가수 미지정',
        song_url: 'https://jinheestate.blog/wp-content/uploads/2026/07/잊혀진-계절.mp3',
        content: formContent,
        likes_count: 1,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('radio_stories')
        .insert(newStory)
        .select()
        .single();

      if (error) {
        console.warn('DB fallback:', error.message);
        setStories(prev => [newStory, ...prev]);
      } else if (data) {
        setStories(prev => [data, ...prev]);
      }

      triggerConfetti();
      setShowAddModal(false);
      setFormSongTitle('');
      setFormArtistName('');
      setFormContent('');
      alert('📻 라디오 사연과 신청곡이 성공적으로 방송판에 등록되었습니다!');
    } catch (err) {
      console.error('Error adding story:', err);
      alert('사연 등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = (storyId) => {
    if (!newCommentText.trim()) return;

    const authorName = alumniProfile?.name || '동문';
    const newComment = {
      id: 'c-' + Date.now(),
      author_name: authorName,
      content: newCommentText,
      created_at: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };

    setCommentsMap(prev => ({
      ...prev,
      [storyId]: [...(prev[storyId] || []), newComment]
    }));

    setNewCommentText('');
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '10px 16px 80px 16px' }} className="fade-in">
      
      {/* Header Banner */}
      <div className="glass" style={{
        padding: '28px 24px',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.15))',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', marginBottom: '10px' }}>
            <Radio size={14} /> 7080 추억의 오디오 아지트
          </div>
          <h2 style={{ fontSize: 'clamp(22px, 5vw, 32px)', fontWeight: '800', color: 'white', margin: 0, letterSpacing: '-0.5px' }}>
            📻 라디오 사연 & 추억의 신청곡
          </h2>
          <p style={{ color: 'var(--color-secondary)', fontSize: '15px', marginTop: '6px', margin: 0 }}>
            친구에게 전하고 싶은 사연과 노래를 보내세요. <strong>[🔊 DJ가 읽어주기]</strong>로 따뜻한 음성을 청취하실 수 있습니다!
          </p>

          {/* Preferred DJ Voice Selection Bar */}
          <div style={{ marginTop: '14px' }}>
            <div style={{ fontSize: '13px', color: '#c084fc', fontWeight: '800', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Radio size={14} /> 👑 내 전담 DJ 목소리 선택 (선택 시 내 기본 목소리로 자동 저장됩니다)
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              {DJ_VOICE_PRESETS.map((preset) => {
                const isSelected = userDjVoice === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectVoice(preset.id)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '10px',
                      border: isSelected ? '1px solid #c084fc' : '1px solid rgba(255,255,255,0.1)',
                      background: isSelected ? 'linear-gradient(135deg, rgba(192, 132, 252, 0.35), rgba(168, 85, 247, 0.2))' : 'rgba(255,255,255,0.04)',
                      color: isSelected ? '#white' : 'var(--color-secondary)',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: isSelected ? '0 0 12px rgba(192, 132, 252, 0.3)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {isSelected && <CheckCircle size={13} color="#c084fc" />}
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          style={{
            background: 'linear-gradient(135deg, #a855f7, #06b6d4)',
            color: 'white',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 15px rgba(168, 85, 247, 0.35)',
            minHeight: '44px'
          }}
        >
          <Plus size={18} /> 사연 & 신청곡 보내기
        </button>
      </div>

      {/* Stories List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {stories.map((story) => {
          const isSpeaking = speakingStoryId === story.id;
          const isPlayingBGM = activeAudioStoryId === story.id;
          const extraLikes = likesMap[story.id] || 0;
          const totalLikes = (story.likes_count || 0) + extraLikes;
          const comments = commentsMap[story.id] || [];

          return (
            <div
              key={story.id}
              className="glass hover-card"
              style={{
                padding: '24px',
                borderRadius: '24px',
                border: isSpeaking ? '2px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.08)',
                background: isSpeaking ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(15, 23, 42, 0.8))' : 'rgba(15, 23, 42, 0.7)',
                boxShadow: isSpeaking ? '0 0 25px rgba(168, 85, 247, 0.3)' : 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              {/* Story Header (Sender -> Recipient & Song Badge) */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '18px',
                    fontWeight: '800'
                  }}>
                    {(story.sender_name || '동문').slice(0, 1)}
                  </div>
                  <div>
                    <div style={{ fontSize: '17px', fontWeight: '800', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      👤 {story.sender_name || '동문'} 동문의 사연
                      <span style={{ fontSize: '13px', color: '#c084fc', fontWeight: '500' }}>➔ 💌 {story.recipient_name || '동문들'}에게</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-secondary)', marginTop: '2px' }}>
                      {story.created_at ? new Date(story.created_at).toLocaleDateString('ko-KR') : '최근'} 작성
                    </div>
                  </div>
                </div>

                {/* Song Info Badge */}
                <div style={{
                  background: 'rgba(6, 182, 212, 0.15)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  color: '#38bdf8',
                  fontSize: '13px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Music size={14} /> 신청곡: {story.song_title} ({story.artist_name})
                </div>
              </div>

              {/* Story Content Box */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '20px',
                borderRadius: '16px',
                borderLeft: '4px solid #a855f7',
                fontSize: '16px',
                lineHeight: '1.7',
                color: '#f1f5f9',
                whiteSpace: 'pre-line'
              }}>
                "{story.content}"
              </div>

              {/* Action Bar (TTS DJ Voice Play, BGM Play, Like, Comment Toggle) */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {/* TTS DJ Voice Play Button */}
                  <button
                    onClick={() => handlePlayTTS(story)}
                    style={{
                      background: isSpeaking ? '#a855f7' : 'linear-gradient(135deg, #a855f7, #8b5cf6)',
                      color: 'white',
                      border: 'none',
                      padding: '10px 18px',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)',
                      minHeight: '44px'
                    }}
                  >
                    {isSpeaking ? (
                      <> <Square size={16} fill="white" /> 🔊 라디오 DJ 낭독 멈추기 </>
                    ) : (
                      <> <Volume2 size={18} /> 🔊 DJ가 사연 읽어주기 (TTS) </>
                    )}
                  </button>

                  {/* BGM Only Play Button */}
                  <button
                    onClick={() => handleToggleBGMOnly(story)}
                    style={{
                      background: isPlayingBGM ? 'rgba(6, 182, 212, 0.3)' : 'rgba(255, 255, 255, 0.06)',
                      color: isPlayingBGM ? '#06b6d4' : 'var(--color-secondary)',
                      border: isPlayingBGM ? '1px solid #06b6d4' : '1px solid rgba(255, 255, 255, 0.1)',
                      padding: '10px 16px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      minHeight: '44px'
                    }}
                  >
                    {isPlayingBGM ? <Pause size={16} /> : <Play size={16} />}
                    {isPlayingBGM ? '신청곡 재생 중...' : '▶️ 신청곡 들으며 읽기'}
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Like Button */}
                  <button
                    onClick={() => handleLike(story.id)}
                    style={{
                      background: 'rgba(244, 63, 94, 0.15)',
                      border: '1px solid rgba(244, 63, 94, 0.3)',
                      color: '#f43f5e',
                      padding: '8px 14px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Heart size={15} fill="#f43f5e" /> 공감 {totalLikes}
                  </button>

                  {/* Comment Toggle Button */}
                  <button
                    onClick={() => setExpandedCommentsId(expandedCommentsId === story.id ? null : story.id)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      padding: '8px 14px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <MessageCircle size={15} /> 댓글 ({comments.length})
                  </button>
                </div>
              </div>

              {/* Comments Accordion Section */}
              {expandedCommentsId === story.id && (
                <div style={{
                  marginTop: '10px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingTop: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8' }}>💬 사연 댓글 목록 ({comments.length}개)</div>

                  {comments.length === 0 ? (
                    <div style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic' }}>아직 남겨진 댓글이 없습니다. 따뜻한 마음의 댓글을 남겨보세요!</div>
                  ) : (
                    comments.map(c => (
                      <div key={c.id} style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#38bdf8', fontWeight: '700', marginBottom: '4px' }}>
                          <span>{c.author_name} 동문</span>
                          <span style={{ color: '#64748b', fontWeight: '500' }}>{c.created_at}</span>
                        </div>
                        <div style={{ fontSize: '14px', color: '#e2e8f0' }}>{c.content}</div>
                      </div>
                    ))
                  )}

                  {/* Add Comment Input */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <input
                      type="text"
                      placeholder="따뜻한 한 마디 댓글을 입력해 주세요..."
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(story.id); }}
                      style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '14px' }}
                    />
                    <button
                      onClick={() => handleAddComment(story.id)}
                      style={{ background: '#a855f7', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Send size={14} /> 작성
                    </button>
                  </div>
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* MODAL: ADD STORY & SONG REQUEST */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
        onClick={() => setShowAddModal(false)}
        >
          <div 
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: '#0f172a',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '20px',
              padding: '24px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Radio size={22} color="#a855f7" /> 📻 라디오 사연 & 신청곡 작성
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddStory} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '700' }}>보내는 사람 & 받는 사람</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="보내는 동문 이름"
                    value={formSenderName}
                    onChange={(e) => setFormSenderName(e.target.value)}
                    style={{ padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '14px' }}
                    required
                  />
                  <input
                    type="text"
                    placeholder="받는 사람 (예: 3반 친구들)"
                    value={formRecipientName}
                    onChange={(e) => setFormRecipientName(e.target.value)}
                    style={{ padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#38bdf8', display: 'block', marginBottom: '6px', fontWeight: '700' }}>🎵 추억의 신청곡 (곡 제목 & 가수)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="신청곡 제목 (예: 잊혀진 계절)"
                    value={formSongTitle}
                    onChange={(e) => setFormSongTitle(e.target.value)}
                    style={{ padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '14px' }}
                    required
                  />
                  <input
                    type="text"
                    placeholder="가수 이름 (예: 이용)"
                    value={formArtistName}
                    onChange={(e) => setFormArtistName(e.target.value)}
                    style={{ padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '700' }}>💌 진솔한 라디오 사연 편지글</label>
                <textarea
                  rows="5"
                  placeholder="친구들과 함께 나누고 싶은 학창 시절 추억이나 안부 인사를 편지처럼 자유롭게 적어주세요. (DJ가 따뜻한 음성으로 직접 읽어드립니다)"
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '14px', resize: 'none', lineHeight: '1.6' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: '700', cursor: 'pointer' }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ flex: 2, padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #a855f7, #06b6d4)', color: 'white', fontWeight: '700', cursor: 'pointer' }}
                >
                  {submitting ? '등록 중...' : '사연 방송 등록하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



    </div>
  );
}
