import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles } from 'lucide-react';

export default function VoiceController({ setActiveTab, onLogout, alumniProfile }) {
  // Modes: 'off' (inactive), 'greeting' (speaking greeting), 'standby' (listening for wake word), 'active' (listening for command)
  const [mode, setMode] = useState('off');
  const [recognition, setRecognition] = useState(null);
  const [toast, setToast] = useState({ show: false, text: '', action: '' });
  const [isSupported, setIsSupported] = useState(false);

  // Use ref to avoid stale closures in SpeechRecognition event handlers
  const modeRef = useRef('off');
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // Safe wrapper to start Speech Recognition with a short delay to let browser release mic
  const safeStartRecognition = () => {
    if (!recognition) return;
    setTimeout(() => {
      try {
        recognition.start();
      } catch (err) {
        console.log('SpeechRecognition start status:', err.message);
      }
    }, 150);
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true; // Continuous listening for standby mode
      rec.lang = 'ko-KR';
      rec.interimResults = false;
      
      rec.onstart = () => {
        if (modeRef.current === 'standby') {
          showToast('시월이 호출 대기 중 🍁', '"하이 시월이" 또는 "시월아"라고 불러보세요.');
        } else if (modeRef.current === 'active') {
          showToast('명령어 입력 대기 🎤', '이동할 메뉴나 날씨를 말씀해 주세요.');
        }
      };

      rec.onend = () => {
        const currentMode = modeRef.current;
        if (currentMode === 'standby') {
          safeStartRecognition();
        } else if (currentMode === 'active') {
          setMode('standby');
          safeStartRecognition();
        }
      };

      rec.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          showToast('오류', '마이크 권한을 허용해 주세요.');
          setMode('off');
        } else if (event.error === 'no-speech') {
          // Gracefully let onend handle it
        } else {
          if (modeRef.current !== 'off') {
            setMode('standby');
            safeStartRecognition();
          }
        }
      };

      rec.onresult = (event) => {
        const latestIndex = event.results.length - 1;
        const resultText = event.results[latestIndex][0].transcript;
        console.log('Speech recognition raw result:', resultText);
        handleSpeechResult(resultText);
      };

      setRecognition(rec);
      setIsSupported(true);
    }
  }, []);

  const showToast = (text, action) => {
    setToast({ show: true, text, action });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4500);
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

  const handleSpeechResult = (rawText) => {
    const currentMode = modeRef.current;
    const cleanText = rawText.replace(/\s+/g, '').toLowerCase();
    console.log(`Speech Mode: ${currentMode}, Cleaned text: ${cleanText}`);

    if (currentMode === 'standby') {
      // WAKE WORD MATCHING (supports numeric translation like "10월" and phonetic typos)
      const isWakeWord = 
        // 1. 하이/헤이/안녕 + 시월/10월/십월 (이/아 생략 가능)
        cleanText.includes('하이시월') || 
        cleanText.includes('하이10월') || 
        cleanText.includes('하이십월') || 
        cleanText.includes('헤이시월') || 
        cleanText.includes('헤이10월') || 
        cleanText.includes('헤이십월') || 
        cleanText.includes('안녕시월') || 
        cleanText.includes('안녕10월') || 
        cleanText.includes('안녕십월') ||
        // 2. 그냥 시월이/시월아/10월이/10월아/십월이/십월아 (이/아 필수)
        cleanText.includes('시월이') || 
        cleanText.includes('시월아') || 
        cleanText.includes('10월이') || 
        cleanText.includes('10월아') || 
        cleanText.includes('십월이') || 
        cleanText.includes('십월아') ||
        // 3. 발음 유사 오타 대응 ("시어리", "시어라", "10월", "시월")
        cleanText.includes('시어리') ||
        cleanText.includes('시어라') ||
        cleanText.includes('아이시월') ||
        cleanText.includes('파이시월') ||
        cleanText.includes('타이시월');

      if (isWakeWord) {
        triggerWakeUp();
      }
    } else if (currentMode === 'active') {
      // Process voice command
      processVoiceCommand(rawText);
    }
  };

  const triggerWakeUp = () => {
    // Stop standby listening before TTS plays
    if (recognition) {
      try {
        recognition.stop();
      } catch (e) {}
    }

    setMode('greeting');
    const name = alumniProfile?.name || '동창';
    const wakeMsg = `네, 말씀하세요 ${name} 동창님!`;
    showToast('호출 인식 완료', `🎤 "하이 시월이" ➔ ${wakeMsg}`);

    speakTTS(wakeMsg, () => {
      // Transition to active command listening mode
      setMode('active');
      safeStartRecognition();
    });
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
        const errMsg = '날씨 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
        showToast('날씨 정보 오류', errMsg);
        speakTTS(errMsg, () => {
          returnToStandby();
        });
        return;
      }
      const temp = Math.round(weather.temperature);
      const desc = getWeatherDesc(weather.weathercode);
      const msg = `오늘 ${locationName}의 현재 온도는 영상 ${temp}도이며, ${desc} 상태입니다.`;
      showToast('⛅ 실시간 날씨 정보', msg);
      speakTTS(msg, () => {
        returnToStandby();
      });
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=Asia/Seoul`);
            const data = await res.json();
            speakWeather(data.current_weather, '현재 위치');
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

  const returnToStandby = () => {
    setMode('standby');
    if (recognition) {
      try {
        recognition.stop(); // stop triggers onend, which safely starts standby via safeStartRecognition
      } catch (e) {
        safeStartRecognition();
      }
    }
  };

  const processVoiceCommand = (rawText) => {
    const text = rawText.replace(/\s+/g, '').replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
    let actionDescription = '';
    let matched = true;

    if (text.includes('날씨') || text.includes('기온') || text.includes('온도') || text.includes('어때')) {
      fetchWeatherAndSpeak();
      return; // Async weather fetch handles returnToStandby
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
      speakTTS(actionDescription, () => {
        returnToStandby();
      });
    } else {
      showToast(`🎤 인식: "${rawText}"`, '일치하는 명령어가 없습니다. 날씨, 갤러리, 챗봇 등을 말해보세요.');
      setTimeout(() => {
        returnToStandby();
      }, 2500);
    }
  };

  const toggleListening = () => {
    if (!recognition) return;
    
    if (mode !== 'off') {
      // Turn off voice activation completely
      window.speechSynthesis.cancel();
      setMode('off');
      try {
        recognition.stop();
      } catch (e) {}
      showToast('음성 제어 종료', '시월이 호출 대기 모드를 종료합니다.');
    } else {
      // Start Standby Wake Word listening
      const name = alumniProfile?.name || '동창';
      setMode('greeting');
      const startMsg = `시월이 음성 호출 서비스를 활성화합니다. 언제든 '하이 시월이' 또는 '시월아'라고 불러주세요.`;
      
      showToast('호출 대기 활성화 중', startMsg);
      
      speakTTS(startMsg, () => {
        setMode('standby');
        safeStartRecognition();
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
          background: mode === 'active' 
            ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' // Active listening: Red
            : mode === 'greeting'
            ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' // Speaking: Amber/Gold
            : mode === 'standby'
            ? 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' // Standby background listening: Cyan/Blue
            : 'rgba(30, 41, 59, 0.8)',                          // Off: Dark
          border: mode !== 'off'
            ? '2px solid rgba(255, 255, 255, 0.4)' 
            : '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: mode === 'active' 
            ? '0 0 25px rgba(239, 68, 68, 0.7), inset 0 2px 4px rgba(255,255,255,0.4)' 
            : mode === 'greeting'
            ? '0 0 25px rgba(245, 158, 11, 0.7), inset 0 2px 4px rgba(255,255,255,0.4)'
            : mode === 'standby'
            ? '0 0 25px rgba(6, 182, 212, 0.6), inset 0 2px 4px rgba(255,255,255,0.4)'
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
        title="음성 인식 제어 (마이크를 켜두시면 '하이 시월이' 또는 '시월아'로 부를 수 있습니다)"
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1) translateY(-3px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1) translateY(0)';
        }}
      >
        {mode === 'active' ? (
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
        ) : mode === 'greeting' ? (
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
        ) : mode === 'standby' ? (
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mic size={24} className="mic-standby" />
            <span style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              border: '2px solid #06b6d4',
              animation: 'ripple-slow 2.5s infinite ease-out'
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
          border: mode === 'active' 
            ? '1px solid rgba(239, 68, 68, 0.3)' 
            : mode === 'greeting'
            ? '1px solid rgba(245, 158, 11, 0.3)'
            : mode === 'standby'
            ? '1px solid rgba(34, 211, 238, 0.3)'
            : '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: mode === 'active' 
            ? '0 10px 25px rgba(239, 68, 68, 0.2)' 
            : mode === 'greeting'
            ? '0 10px 25px rgba(245, 158, 11, 0.2)'
            : mode === 'standby'
            ? '0 10px 25px rgba(6, 182, 212, 0.2)'
            : 'none',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', color: mode === 'active' ? '#f87171' : mode === 'greeting' ? '#fbbf24' : 'var(--accent-cyan)' }}>
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
        @keyframes ripple-slow {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            opacity: 0.4;
          }
          100% {
            transform: scale(1.4);
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
