import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Sparkles, CheckSquare, Square } from 'lucide-react';

export default function AutumnTripModal({ isOpen, onClose }) {
  const [dontShowToday, setDontShowToday] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIframeLoading(true);
      setDontShowToday(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (dontShowToday) {
      const todayStr = new Date().toISOString().slice(0, 10);
      localStorage.setItem('october_hide_travel_popup_date', todayStr);
    }
    onClose();
  };

  const handleOpenExternal = () => {
    window.open('https://elegant-beignet-a55c12.netlify.app/', '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      className="fade-in"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 8, 22, 0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={handleClose}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '960px',
          maxHeight: '92vh',
          backgroundColor: '#0d1326',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 35px rgba(6, 182, 212, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.2), rgba(168, 85, 247, 0.2))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #06b6d4, #a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)'
            }}>
              <Sparkles size={20} color="white" />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                🍂 2026년 시월의밤 가을여행 일정
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--accent-cyan)', margin: '2px 0 0 0', fontWeight: '600' }}>
                통영 모나미 펜션 & 양산 도킹 가을여행 안내
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleOpenExternal}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
              title="새 창에서 원본 웹페이지 열기"
            >
              <ExternalLink size={14} />
              <span>새 창에서 보기</span>
            </button>

            <button
              onClick={handleClose}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: 'white',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body with iFrame */}
        <div style={{
          position: 'relative',
          flex: 1,
          width: '100%',
          minHeight: '460px',
          height: '70vh',
          background: '#090d1a'
        }}>
          {iframeLoading && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              background: '#0d1326',
              zIndex: 2
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                border: '3px solid rgba(255,255,255,0.1)',
                borderTopColor: 'var(--accent-cyan)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <p style={{ color: 'var(--color-secondary)', fontSize: '14px', margin: 0 }}>
                가을여행 일정을 불러오는 중입니다...
              </p>
            </div>
          )}

          <iframe
            src="https://elegant-beignet-a55c12.netlify.app/"
            title="2026 가을여행 일정"
            onLoad={() => setIframeLoading(false)}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: 'block'
            }}
          />
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(13, 19, 38, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setDontShowToday(!dontShowToday)}
            style={{
              background: 'transparent',
              border: 'none',
              color: dontShowToday ? 'var(--accent-cyan)' : 'var(--color-secondary)',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              userSelect: 'none'
            }}
          >
            {dontShowToday ? (
              <CheckSquare size={18} color="var(--accent-cyan)" />
            ) : (
              <Square size={18} color="var(--color-secondary)" />
            )}
            <span>오늘 하루 동안 이 팝업 보지 않기</span>
          </button>

          <button
            onClick={handleClose}
            style={{
              background: 'linear-gradient(135deg, #06b6d4, #10b981)',
              color: 'white',
              border: 'none',
              padding: '8px 22px',
              borderRadius: '12px',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(6, 182, 212, 0.3)'
            }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
