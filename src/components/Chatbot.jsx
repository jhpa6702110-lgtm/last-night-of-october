import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, Sparkles, User, HelpCircle } from 'lucide-react';

export default function Chatbot({ session, alumniProfile }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize greeting message
  useEffect(() => {
    const userName = alumniProfile?.name || '동창';
    setMessages([
      {
        id: 'welcome',
        sender: 'bot',
        text: `안녕하세요, ${userName} 동창님! 🍁\n'시월의 마지막 밤' 동창회 안내 챗봇 '시월이'입니다. 오늘 어떤 점이 궁금하신가요? 아래 추천 질문을 누르시거나 직접 물어보세요!`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, [alumniProfile]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const quickReplies = [
    { key: 'xp', label: '★ 포인트(XP) 모으는 법' },
    { key: 'gallery', label: '📸 사진 등록 방법' },
    { key: 'ranking', label: '👑 열정 랭킹 확인' },
    { key: 'signup', label: '🔐 회원가입 안 될 때' },
    { key: 'info', label: '🍁 시월이 정체는?' }
  ];

  const getBotResponse = (text) => {
    const cleanText = text.toLowerCase().trim();
    
    if (cleanText.includes('xp') || cleanText.includes('포인트') || cleanText.includes('점수')) {
      return `★ 활동 포인트(XP) 안내:\n\n동창회 사이트에서 활동하시면 포인트가 쌓이고 홈 화면의 '열정 랭킹'에 오르게 됩니다!\n\n1. 회원 가입 성공: +50 XP\n2. 갤러리 사진 공유: +10 XP\n3. 게시판 게시글 작성: +10 XP\n4. 각 게시글에 댓글 작성: +2 XP\n5. 매일 사이트 접속 시 출석 보너스: +1 XP\n(※ 3일 이상 미접속 시 하루 -1 XP 감점되니 자주 놀러 오세요! 😅)`;
    }
    
    if (cleanText.includes('사진') || cleanText.includes('갤러리') || cleanText.includes('앨범') || cleanText.includes('업로드')) {
      return `📸 사진 및 앨범 공유 안내:\n\n1. **갤러리**: 상단 메뉴의 '갤러리' 탭에 들어가 [사진 공유하기] 버튼을 누르고 이미지 파일과 제목을 채워 등록해 주세요.\n2. **앨범**: 소모임, 총동창회 등 특정 행사별로 사진을 모아서 앨범 형태로 관리합니다.\n\n사진을 올리실 때마다 +10 XP가 지급됩니다!`;
    }
    
    if (cleanText.includes('랭킹') || cleanText.includes('순위') || cleanText.includes('명예') || cleanText.includes('전당') || cleanText.includes('1등')) {
      return `👑 열정 랭킹(명예의 전당) 안내:\n\n홈 화면 중간에 보시면 현재 가장 활발하게 활동 중인 동창 Top 3가 표시되는 '👑 열정 랭킹' 구역이 있습니다. 포인트를 많이 쌓아 명예의 전당 황금 왕관을 차지해 보세요!`;
    }
    
    if (cleanText.includes('가입') || cleanText.includes('회원가입') || cleanText.includes('비밀번호') || cleanText.includes('로그인')) {
      return `🔐 회원가입 및 본인 인증 안내:\n\n본 사이트는 프라이빗 동창 공간입니다. 회장단이 미리 등록해 둔 주소록 정보(이름, 전화번호)와 일치해야 가입 및 비밀번호 설정이 가능합니다.\n\n가입 인증에 실패하시는 경우, 회장단에 성명과 전화번호가 올바르게 사전 등록되었는지 확인을 요청해 주세요.`;
    }

    if (cleanText.includes('시월') || cleanText.includes('누구') || cleanText.includes('정체') || cleanText.includes('소개')) {
      return `🍁 챗봇 시월이 소개:\n\n저는 '시월의 마지막 밤' 동창회 홈페이지를 이용하시는 동창님들을 돕기 위해 태어난 인공지능 안내 비서입니다. 사이트 사용법이나 포인트 등 궁금한 게 생기시면 언제든 저를 클릭해 주세요!`;
    }

    if (cleanText.includes('영화') || cleanText.includes('시네마') || cleanText.includes('비디오') || cleanText.includes('영상')) {
      return `🎬 영화관 안내:\n\n'영화관' 탭으로 이동하시면 우리 동창들이 감상할 수 있는 감동적인 영상 및 공유 영화 리스트가 준비되어 있습니다. 힐링이 필요할 때 이용해 보세요!`;
    }

    if (cleanText.includes('라디오') || cleanText.includes('음악') || cleanText.includes('방송')) {
      return `📻 라디오방송 안내:\n\n'라디오방송' 탭에서는 좋은 음악, 실시간 음악 사연 재생, 동창 라디오 녹음 스트리밍을 제공합니다. 추억의 음악을 들으며 소통해 보세요!`;
    }

    if (cleanText.includes('안녕') || cleanText.includes('반갑') || cleanText.includes('하이')) {
      const name = alumniProfile?.name || '동창';
      return `안녕 하세요, ${name} 동창님! 반갑습니다! 😊 오늘 알려드릴 동창회 소식이 있나요? 도움이 필요하시면 무엇이든 물어보세요!`;
    }

    // Default Fallback
    return `동창님, '${text}'에 대해 답변하기 어렵네요. 😅\n\n'포인트', '사진', '가입', '라디오', '영화관' 등 관련 있는 단어를 입력해 보시거나, 대화창 하단의 추천 질문 버튼을 눌러보세요!`;
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
