import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, Sparkles } from 'lucide-react';

export default function VoiceController({ setActiveTab, onLogout, alumniProfile }) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingGreeting, setIsSpeakingGreeting] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [toast, setToast] = useState({ show: false, text: '', action: '' });
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.lang = 'ko-KR';
      rec.interimResults = false;
      
      rec.onstart = () => {
        setIsListening(true);
        showToast('음성 인식 활성화', '듣고 있습니다... 말씀해 주세요.');
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          showToast('오류', '마이크 권한을 허용해 주세요.');
        } else if (event.error === 'no-speech') {
          // Silent end when no speech detected, no need for spamming error alerts
        } else {
          showToast('오류', '음성 인식에 실패했습니다. 다시 시도해 주세요.');
        }
      };

      rec.onresult = (event) => {
        const resultText = event.results[0][0].transcript;
        processVoiceCommand(resultText);
      };

      setRecognition(rec);
      setIsSupported(true);
    }
  }, []);

  const showToast = (text, action) => {
    setToast({ show: true, text, action });
    // Hide toast after 3.5 seconds
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3800);
  };

  const speakTTS = (text, callback) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Cancel ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      if (callback) {
        utterance.onend = callback;
        utterance.onerror = (e) => {
          console.error('TTS error:', e);
          callback();
        };
      }
      window.speechSynthesis.speak(utterance);
    } else if (callback) {
      callback();
    }
  };

  const getWeatherDesc = (code) => {
    const codes = {
      0: '맑음',
      1: '대체로 맑음',
      2: '구름 조금',
      3: '흐림',
      45: '안개',
      48: '짙은 안개',
      51: '가벼운 이슬비',
      53: '이슬비',
      55: '강한 이슬비',
      61: '가벼운 비',
      63: '비',
      65: '강한 비',
      71: '가벼운 눈',
      73: '눈',
      75: '폭설',
      80: '가벼운 소나기',
      81: '소나기',
      82: '폭우',
      95: '뇌우',
    };
    return codes[code] || '정보 없음';
  };

  const fetchWeatherAndSpeak = () => {
    const speakWeather = (weather, locationName) => {
      if (!weather) {
        const errMsg = '날씨 정보를 현재 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.';
        showToast('날씨 정보 오류', errMsg);
        speakTTS(errMsg);
        return;
      }
      const temp = Math.round(weather.temperature);
      const desc = getWeatherDesc(weather.weathercode);
      const msg = `오늘 ${locationName}의 현재 온도는 영상 ${temp}도이며, ${desc} 상태입니다.`;
      showToast('⛅ 실시간 날씨 정보', msg);
      speakTTS(msg);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=Asia/Seoul`);
            const data = await res.json();
            speakWeather(data.current_weather, '현재 지역');
          } catch (err) {
            console.error(err);
            // Fallback to Seoul
            const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=37.5665&longitude=126.9780&current_weather=true&timezone=Asia/Seoul');
            const data = await res.json();
            speakWeather(data.current_weather, '서울');
          }
        },
        async (err) => {
          console.warn('Geolocation error:', err);
          // Fallback to Seoul
          try {
            const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=37.5665&longitude=126.9780&current_weather=true&timezone=Asia/Seoul');
            const data = await res.json();
            speakWeather(data.current_weather, '서울');
          } catch (fetchErr) {
            console.error(fetchErr);
            speakWeather(null);
          }
        },
        { timeout: 5000 }
      );
    } else {
      // Geolocation unsupported fallback to Seoul
      fetch('https://api.open-meteo.com/v1/forecast?latitude=37.5665&longitude=126.9780&current_weather=true&timezone=Asia/Seoul')
        .then(res => res.json())
        .then(data => speakWeather(data.current_weather, '서울'))
        .catch(err => {
          console.error(err);
          speakWeather(null);
        });
    }
  };

  const processVoiceCommand = (rawText) => {
    const text = rawText.replace(/\s+/g, '').replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
    let actionDescription = '';
    let matched = true;

    if (text.includes('날씨') || text.includes('기온') || text.includes('온도') || text.includes('어때')) {
      fetchWeatherAndSpeak();
      return; // Handled asynchronously by fetchWeatherAndSpeak
    }

    if (text.includes('홈') || text.includes('메인') || text.includes('처음')) {
      setActiveTab('home');
      actionDescription = '홈 화면으로 이동합니다.';
    } else if (text.includes('게시판') || text.includes('소통') || text.includes('글')) {
      setActiveTab('board');
      actionDescription = '게시판으로 이동합니다.';
    } else if (text.includes('갤러리') || text.includes('사진')) {
      setActiveTab('gallery');
      actionDescription = '추억 갤러리로 이동합니다.';
    } else if (text.includes('앨범') || text.includes('사진첩')) {
      setActiveTab('album');
      actionDescription = '테마 앨범으로 이동합니다.';
    } else if (text.includes('영화') || text.includes('시네마') || text.includes('비디오') || text.includes('영상')) {
      setActiveTab('cinema');
      actionDescription = '영화관으로 이동합니다.';
    } else if (text.includes('라디오') || text.includes('방송') || text.includes('음악')) {
      setActiveTab('radio');
      actionDescription = '라디오방송으로 이동합니다.';
    } else if (text.includes('친구') || text.includes('동창') || text.includes('주소')) {
      setActiveTab('friends');
      actionDescription = '친구들 목록으로 이동합니다.';
    } else if (text.includes('관리자') || text.includes('설정') || text.includes('운영')) {
      setActiveTab('admin');
      actionDescription = '관리자 페이지로 이동합니다.';
    } else if (text.includes('로그아웃')) {
      if (onLogout) {
        onLogout();
        actionDescription = '로그아웃을 완료했습니다.';
      } else {
        matched = false;
      }
    } else if (text.includes('매뉴얼') || text.includes('도움말') || text.includes('안내')) {
      window.dispatchEvent(new CustomEvent('open-user-manual-voice'));
      actionDescription = '사용자 매뉴얼을 불러옵니다.';
    } else if (text.includes('시월이') || text.includes('챗봇')) {
      window.dispatchEvent(new CustomEvent('toggle-chatbot-voice'));
      actionDescription = '챗봇 시월이를 불러옵니다.';
    } else {
      matched = false;
    }

    if (matched) {
      showToast(`🎤 인식: "${rawText}"`, `➔ ${actionDescription}`);
      speakTTS(actionDescription);
    } else {
      showToast(`🎤 인식: "${rawText}"`, '알맞은 메뉴가 없습니다. 날씨, 갤러리, 라디오, 매뉴얼 등을 말해보세요.');
    }
  };

  const toggleListening = () => {
    if (!recognition) return;
    
    if (isListening) {
      recognition.stop();
      setIsListening(false);
      window.speechSynthesis.cancel();
    } else if (isSpeakingGreeting) {
      // Stop speaking and cancel listening
      window.speechSynthesis.cancel();
      setIsSpeakingGreeting(false);
    } else {
      const name = alumniProfile?.name || '동창';
      setIsSpeakingGreeting(true);
      const greetingMsg = `안녕하세요, ${name} 동창님! 시월이가 들을 준비를 하고 있어요. 무엇을 도와드릴까요?`;
      
      showToast('안내원 시월이', greetingMsg);
      
      speakTTS(greetingMsg, () => {
        setIsSpeakingGreeting(false);
        try {
          recognition.start();
        } catch (err) {
          console.error(err);
        }
      });
    }
  };

  if (!isSupported) return null;

  return (
    <>
      {/* Voice Control Button */}
      <button
        onClick={toggleListening}
        style={{
          position: 'fixed',
          bottom: '25px',
          right: '90px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: isListening 
            ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
            : isSpeakingGreeting 
            ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' // Gold/Amber during greeting
            : 'rgba(30, 41, 59, 0.8)',
          border: (isListening || isSpeakingGreeting)
            ? '2px solid rgba(255, 255, 255, 0.4)' 
            : '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: isListening 
            ? '0 0 25px rgba(239, 68, 68, 0.7), inset 0 2px 4px rgba(255,255,255,0.4)' 
            : isSpeakingGreeting
            ? '0 0 25px rgba(245, 158, 11, 0.7), inset 0 2px 4px rgba(255,255,255,0.4)'
            : '0 8px 30px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255,255,255,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          cursor: 'pointer',
          zIndex: 9999,
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
        title="음성 인식 제어 (마이크를 켜서 '갤러리 가줘', '오늘 날씨 어때?' 등을 말해보세요)"
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1) translateY(-3px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1) translateY(0)';
        }}
      >
        {isListening ? (
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mic size={24} className="mic-listening" />
            <span style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              border: '2px solid #ef4444',
              animation: 'ripple 1.5s infinite ease-out'
            }} />
          </div>
        ) : isSpeakingGreeting ? (
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={24} className="mic-speaking" />
            <span style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              border: '2px solid #f59e0b',
              animation: 'ripple 1.5s infinite ease-out'
            }} />
          </div>
        ) : (
          <Mic size={24} color="var(--accent-cyan)" />
        )}
      </button>

      {/* Voice Control Feedback Toast */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          bottom: '100px',
          right: '25px',
          background: 'rgba(15, 23, 42, 0.9)',
          border: isListening 
            ? '1px solid rgba(239, 68, 68, 0.3)' 
            : isSpeakingGreeting
            ? '1px solid rgba(245, 158, 11, 0.3)'
            : '1px solid rgba(34, 211, 238, 0.3)',
          boxShadow: isListening 
            ? '0 10px 25px rgba(239, 68, 68, 0.2)' 
            : isSpeakingGreeting
            ? '0 10px 25px rgba(245, 158, 11, 0.2)'
            : '0 10px 25px rgba(6, 182, 212, 0.2)',
          padding: '12px 18px',
          borderRadius: '12px',
          zIndex: 9997,
          color: 'white',
          fontSize: '13px',
          lineHeight: '1.4',
          maxWidth: '320px',
          backdropFilter: 'blur(5px)',
          animation: 'slideUpToast 0.3s ease-out',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', color: isListening ? '#f87171' : isSpeakingGreeting ? '#fbbf24' : 'var(--accent-cyan)' }}>
            <Volume2 size={16} />
            <span>{toast.text}</span>
          </div>
          <div style={{ color: 'var(--color-primary)', fontSize: '12px', whiteSpace: 'pre-wrap' }}>
            {toast.action}
          </div>
        </div>
      )}

      {/* Mic custom styles */}
      <style>{`
        @keyframes ripple {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1.6);
            opacity: 0;
          }
        }
        @keyframes slideUpToast {
          from {
            transform: translateY(15px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
