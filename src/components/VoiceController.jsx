import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';

export default function VoiceController({ setActiveTab, onLogout }) {
  const [isListening, setIsListening] = useState(false);
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
        showToast('음성 인식 시작', '듣고 있습니다... 말씀해 주세요.');
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          showToast('오류', '마이크 권한을 허용해 주세요.');
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
    }, 3500);
  };

  const processVoiceCommand = (rawText) => {
    const text = rawText.replace(/\s+/g, '').replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
    let actionDescription = '';
    let matched = true;

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
      // Dispatch a custom event to open the manual in Home.jsx or Chatbot
      window.dispatchEvent(new CustomEvent('open-user-manual-voice'));
      actionDescription = '사용자 매뉴얼을 불러옵니다.';
    } else if (text.includes('시월이') || text.includes('챗봇')) {
      // Toggle chatbot open
      window.dispatchEvent(new CustomEvent('toggle-chatbot-voice'));
      actionDescription = '챗봇 시월이를 불러옵니다.';
    } else {
      matched = false;
    }

    if (matched) {
      showToast(`🎤 인식: "${rawText}"`, `➔ ${actionDescription}`);
      // TTS feedback (optional, reads out destination)
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(actionDescription);
        utterance.lang = 'ko-KR';
        window.speechSynthesis.speak(utterance);
      }
    } else {
      showToast(`🎤 인식: "${rawText}"`, '매칭되는 메뉴나 명령어가 없습니다. (예: "갤러리 가줘", "라디오 켜줘", "시월이 불러줘")');
    }
  };

  const toggleListening = () => {
    if (!recognition) return;
    
    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (err) {
        console.error(err);
      }
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
          right: '90px', // Placed to the left of the chatbot button
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: isListening 
            ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
            : 'rgba(30, 41, 59, 0.8)',
          border: isListening 
            ? '2px solid rgba(255, 255, 255, 0.4)' 
            : '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: isListening 
            ? '0 0 25px rgba(239, 68, 68, 0.7), inset 0 2px 4px rgba(255,255,255,0.4)' 
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
        title="음성 인식 제어 (마이크를 켜서 '갤러리 가줘', '라디오 켜줘' 등을 말해보세요)"
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
          border: isListening ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(34, 211, 238, 0.3)',
          boxShadow: isListening ? '0 10px 25px rgba(239, 68, 68, 0.2)' : '0 10px 25px rgba(6, 182, 212, 0.2)',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', color: isListening ? '#f87171' : 'var(--accent-cyan)' }}>
            <Volume2 size={16} />
            <span>{toast.text}</span>
          </div>
          <div style={{ color: 'var(--color-primary)', fontSize: '12px' }}>
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
