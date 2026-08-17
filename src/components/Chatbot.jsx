import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, Sparkles, User, HelpCircle } from 'lucide-react';

export default function Chatbot({ session, alumniProfile }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize greeting message with 8090 DJ persona
  useEffect(() => {
    const userName = alumniProfile?.name || '동창';
    setMessages([
      {
        id: 'welcome',
        sender: 'bot',
        text: `반갑습니다, ${userName} 동창님! 📻🎧\n'10월의 마지막 밤' 추억 라디오 DJ **시월이**입니다.\n학창 시절 명곡 추천, 사진 공유, 포인트 획득 방법 등 무엇이든 편하게 물어보세요!`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, [alumniProfile]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Handle voice command activation
  useEffect(() => {
    const handleVoiceToggle = () => {
      setIsOpen(true);
    };

    window.addEventListener('toggle-chatbot-voice', handleVoiceToggle);
    return () => {
      window.removeEventListener('toggle-chatbot-voice', handleVoiceToggle);
    };
  }, []);

  const quickReplies = [
    { key: 'music', label: '🎵 8090 명곡 추천' },
    { key: 'xp', label: '★ 포인트(XP) 모으는 법' },
    { key: 'gallery', label: '📸 사진 등록 방법' },
    { key: 'radio', label: '📻 사연 신청 방법' },
    { key: 'ranking', label: '👑 열정 랭킹 확인' }
  ];

  const getBotResponse = (text) => {
    const cleanText = text.toLowerCase().trim();
    
    if (cleanText.includes('노래') || cleanText.includes('음악') || cleanText.includes('추천') || cleanText.includes('곡')) {
      return `🎵 오늘 DJ 시월이가 추천하는 명곡:\n\n1. 🍂 **이용 - 잊혀진 계절**\n2. 🌊 **PoCo - Sea Of Heartbreak**\n3. 💡 **라라 / 황가람 - 나는 반딧불**\n4. 🎙️ **김기태 - 너를 보내고**\n5. 👑 **임영웅 - 그대 그리고 나**\n6. 🕊️ **소향 - Bridge Over Troubled Water**\n\n메인 대문의 **'시월의 테마 라디오 플레이어'**와 **'라디오 사연'** 신청곡 목록에서 언제든 감상하실 수 있습니다! 들어보실래요? 🎧`;
    }

    if (cleanText.includes('xp') || cleanText.includes('포인트') || cleanText.includes('점수')) {
      return `★ 활동 포인트(XP) 모으는 법:\n\n1. 회원 가입 성공: +50 XP\n2. 갤러리 사진 공유: +10 XP\n3. 게시판 게시글 작성: +10 XP\n4. 댓글 작성: +2 XP\n5. 매일 출석 보너스: +1 XP\n\n포인트를 모아 메인 대문의 '👑 명예의 전당 황금 왕관'을 차지하세요! 🏆`;
    }
    
    if (cleanText.includes('사진') || cleanText.includes('갤러리') || cleanText.includes('앨범') || cleanText.includes('업로드')) {
      return `📸 사진 및 앨범 공유 안내:\n\n1. **추억 갤러리**: 상단 메뉴나 화면 하단 모바일 바의 📷 아이콘을 눌러 사진을 올려주세요.\n2. **앨범**: 소모임, 여행, 수학여행 사진을 모아서 간직할 수 있습니다.\n\n사진 1장 업로드할 때마다 **+10 XP**가 적립됩니다!`;
    }
    
    if (cleanText.includes('사연') || cleanText.includes('라디오') || cleanText.includes('방송')) {
      return `📻 라디오 사연 신청 안내:\n\n'라디오사연' 탭으로 이동하시면 친구들에게 전하고 싶은 추억 사연과 신청곡을 남기실 수 있습니다.\n채택된 사연은 라디오 방송을 통해 플레이됩니다!`;
    }

    if (cleanText.includes('랭킹') || cleanText.includes('순위') || cleanText.includes('명예') || cleanText.includes('전당') || cleanText.includes('1등')) {
      return `👑 명예의 전당 안내:\n\n'명예의전당' 탭에서 동창님들의 우정 포인트와 활동 현황을 함께 확인하실 수 있습니다. 카카오톡으로 동창 소식을 바로 공유할 수도 있어요!`;
    }
    
    if (cleanText.includes('시월') || cleanText.includes('누구') || cleanText.includes('정체') || cleanText.includes('소개')) {
      return `🍁 AI DJ 시월이 소개:\n\n저는 '10월의 마지막 밤' 동창 커뮤니티의 8090 음악 & 추억 라디오 DJ 시월이입니다. 궁금한 기능이나 음악이 필요할 땐 언제나 찾아주세요! 📻`;
    }

    if (cleanText.includes('안녕') || cleanText.includes('반갑') || cleanText.includes('하이')) {
      const name = alumniProfile?.name || '동창';
      return `안녕하세요, ${name} 동창님! 오늘 어떤 추억 노래나 이야기를 나누고 싶으신가요? 😊`;
    }

    // Default Fallback
    return `동창님, '${text}'에 대한 사연을 이해했어요! 📻\n\n'명곡 추천', '포인트 모으는 법', '사진 업로드', '라디오 사연' 등 원하시는 단어를 입력하시거나 아래 버튼을 선택해 보세요!`;
  };

  const handleSendMessage = (textToSend) => {
    if (!textToSend.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const responseText = getBotResponse(textToSend);
      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: responseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 700);
  };

  return (
    <>
      {/* Chatbot Bubble Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '25px',
          right: '25px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'var(--accent-gradient)',
          border: 'none',
          boxShadow: '0 8px 30px rgba(6, 182, 212, 0.4), inset 0 2px 4px rgba(255,255,255,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          cursor: 'pointer',
          zIndex: 9999,
          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1) translateY(-3px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1) translateY(0)';
        }}
      >
        {isOpen ? <X size={26} /> : <MessageCircle size={26} />}
      </button>

      {/* Chat Window Panel */}
      {isOpen && (
        <div 
          className="glass fade-in"
          style={{
            position: 'fixed',
            bottom: '95px',
            right: '25px',
            width: '360px',
            maxWidth: 'calc(100vw - 50px)',
            height: '500px',
            maxHeight: 'calc(100vh - 150px)',
            borderRadius: '20px',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 9998,
            animation: 'slideUp 0.3s cubic-bezier(0.1, 0.76, 0.55, 0.94)'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(147, 51, 234, 0.2) 100%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: 'var(--accent-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 10px rgba(6, 182, 212, 0.5)'
              }}>
                <Bot size={18} color="white" />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  안내원 시월이 <Sparkles size={12} color="#22d3ee" />
                </h4>
                <span style={{ fontSize: '10px', color: '#a7f3d0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  실시간 도움 대기 중
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '4px' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div style={{
            flex: 1,
            padding: '16px 20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            background: 'rgba(7, 11, 25, 0.4)'
          }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-end',
                  gap: '6px'
                }}
              >
                {msg.sender === 'bot' && (
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    alignSelf: 'flex-start',
                    marginTop: '2px',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <Bot size={14} color="var(--accent-cyan)" />
                  </div>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '75%' }}>
                  <div
                    style={{
                      background: msg.sender === 'user' ? 'var(--accent-gradient)' : 'rgba(255, 255, 255, 0.06)',
                      border: msg.sender === 'user' ? 'none' : '1px solid rgba(255,255,255,0.08)',
                      padding: '10px 14px',
                      borderRadius: msg.sender === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                      color: msg.sender === 'user' ? 'white' : 'var(--color-primary)',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                      boxShadow: msg.sender === 'user' ? '0 4px 15px rgba(6,182,212,0.15)' : 'none'
                    }}
                  >
                    {msg.text}
                  </div>
                  <span style={{
                    fontSize: '9px',
                    color: 'rgba(255,255,255,0.3)',
                    marginTop: '2px',
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                  }}>
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                  <Bot size={14} color="var(--accent-cyan)" />
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.06)', padding: '10px 14px', borderRadius: '16px 16px 16px 2px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span className="dot-blink" style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--color-secondary)' }} />
                  <span className="dot-blink" style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--color-secondary)', animationDelay: '0.2s' }} />
                  <span className="dot-blink" style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--color-secondary)', animationDelay: '0.4s' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies Buttons */}
          <div style={{
            padding: '10px 16px',
            background: 'rgba(7, 11, 25, 0.5)',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            scrollbarWidth: 'none' // Firefox
          }}>
            {quickReplies.map((qr) => (
              <button
                key={qr.key}
                onClick={() => handleSendMessage(qr.label.replace(/^[^\s]+\s/, ''))} // strip emoji prefix for sending
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '30px',
                  padding: '6px 12px',
                  fontSize: '11px',
                  color: 'var(--color-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'var(--transition-smooth)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.4)';
                  e.currentTarget.style.background = 'rgba(6, 182, 212, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                }}
              >
                {qr.label}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            style={{
              padding: '12px 16px',
              background: 'rgba(14, 22, 43, 0.95)',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              gap: '8px',
              alignItems: 'center'
            }}
          >
            <input
              type="text"
              placeholder="질문을 입력하세요..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '30px',
                padding: '10px 16px',
                fontSize: '13px',
                color: 'white',
                outline: 'none',
                transition: 'var(--transition-smooth)'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-cyan)';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(6, 182, 212, 0.2)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: inputText.trim() ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.05)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: inputText.trim() ? 'white' : 'rgba(255,255,255,0.3)',
                cursor: inputText.trim() ? 'pointer' : 'default',
                transition: 'var(--transition-smooth)'
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      {/* Extra styles for chatbot animations */}
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .dot-blink {
          animation: dotBlink 1.4s infinite both;
        }
        @keyframes dotBlink {
          0% { opacity: .2; }
          20% { opacity: 1; }
          100% { opacity: .2; }
        }
      `}</style>
    </>
  );
}
