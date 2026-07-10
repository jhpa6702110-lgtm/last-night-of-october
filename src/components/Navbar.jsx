import React, { useState, useEffect } from 'react';
import { Home, Image, BookOpen, Users, Lock, LogOut, LogIn, Menu, X, Download, Film, Radio, MessageSquare } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, session, alumniProfile, activeUsers = [], onLogout, onInstallApp, isKakaoTalk, isInAppBrowser }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const checkStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone || 
      document.referrer.includes('android-app://');
    
    setIsStandalone(!!checkStandalone);
  }, []);

  const isAdmin = alumniProfile?.is_president || alumniProfile?.is_treasurer;

  const showInstallButton = !(isStandalone || isKakaoTalk || isInAppBrowser);

  const navItems = [
    { id: 'home', label: '홈', icon: Home, public: true },
    { id: 'board', label: '게시판', icon: MessageSquare, public: false },
    { id: 'gallery', label: '갤러리', icon: Image, public: false },
    { id: 'album', label: '앨범', icon: BookOpen, public: false },
    { id: 'cinema', label: '영화관', icon: Film, public: true },
    { id: 'radio', label: '라디오방송', icon: Radio, public: true },
    { id: 'friends', label: '친구들', icon: Users, public: false },
    ...(isAdmin ? [{ id: 'admin', label: '관리자', icon: Lock, public: false }] : []),
  ];

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setIsMenuOpen(false);
  };

  const hasBanner = isKakaoTalk || isInAppBrowser;

  return (
    <nav className="glass" style={{
      position: 'fixed',
      top: hasBanner ? '55px' : '15px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 40px)',
      maxWidth: '1400px',
      zIndex: 100,
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: '20px',
      border: '1px solid rgba(255, 255, 255, 0.08)'
    }}>
      {/* Logo */}
      <div 
        onClick={() => handleTabClick('home')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer'
        }}
      >
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'var(--accent-gradient)',
          boxShadow: 'var(--shadow-neon)'
        }} />
        <span style={{
          fontSize: '20px',
          fontWeight: '700',
          letterSpacing: '-0.5px',
          whiteSpace: 'nowrap'
        }} className="text-gradient">
          시월의 마지막 밤
        </span>
      </div>

      {/* Active Users Avatar Stack (visible if users are online) */}
      {activeUsers.length > 0 && (
        <div className="active-users-stack desktop-only-users" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px', 
          marginLeft: '12px',
          marginRight: 'auto', // Push desktop-nav to the right
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.05)',
          padding: '4px 10px',
          borderRadius: '12px'
        }}>
          <span style={{ 
            width: '6px', 
            height: '6px', 
            borderRadius: '50%', 
            background: '#10b981', 
            boxShadow: '0 0 6px #10b981', 
            display: 'inline-block' 
          }} />
          <span style={{ fontSize: '11px', color: 'var(--color-secondary)', display: 'inline-block' }}>온라인:</span>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {activeUsers.map((user, index) => (
              <div
                key={user.id || user.name}
                title={`${user.name} (접속 중)`}
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  backgroundImage: user.avatar_url ? `url(${user.avatar_url})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: '1.5px solid #070b19',
                  marginLeft: index === 0 ? '0' : '-8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '9px',
                  fontWeight: '700',
                  color: 'white',
                  boxShadow: '0 0 4px rgba(0,0,0,0.5)',
                  position: 'relative',
                  cursor: 'pointer'
                }}
              >
                {!user.avatar_url && user.name.slice(0, 1)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Desktop Navigation */}
      <div className="desktop-nav" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              style={{
                background: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                color: isActive ? 'var(--accent-cyan)' : 'var(--color-secondary)',
                border: isActive ? '1px solid rgba(34, 211, 238, 0.2)' : '1px solid transparent',
                borderRadius: '10px',
                padding: '6px 10px',
                fontSize: '13px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'var(--transition-smooth)'
              }}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}

        {showInstallButton && (
          <button
            onClick={onInstallApp}
            style={{
              background: 'transparent',
              color: 'var(--accent-cyan)',
              border: '1px solid rgba(34, 211, 238, 0.3)',
              borderRadius: '10px',
              padding: '6px 10px',
              fontSize: '13px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'var(--transition-smooth)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(34, 211, 238, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <Download size={16} />
            앱 설치
          </button>
        )}

        {showInstallButton && (
          <div style={{ width: '1px', height: '20px', background: 'rgba(255, 255, 255, 0.1)', margin: '0 8px' }} />
        )}

        {session ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* 현재 로그인한 사용자의 아바타 */}
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.1)',
              backgroundImage: alumniProfile?.avatar_url ? `url(${alumniProfile.avatar_url})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: '700',
              color: 'white',
              flexShrink: 0,
              border: '2px solid rgba(34, 211, 238, 0.3)'
            }}>
              {!alumniProfile?.avatar_url && (alumniProfile?.name?.charAt(0) || '')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: '600', whiteSpace: 'nowrap' }}>
                {alumniProfile?.name || '친구'} 님
              </span>
              <span style={{ fontSize: '10px', color: 'var(--accent-cyan)', fontWeight: '700', background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.2)', padding: '1px 5px', borderRadius: '4px', marginTop: '2px', whiteSpace: 'nowrap' }}>
                ★ {alumniProfile?.points || 0} XP
              </span>
            </div>
            <button
              onClick={onLogout}
              className="btn btn-secondary"
              style={{
                padding: '6px 12px',
                minHeight: '32px',
                fontSize: '14px',
                borderRadius: '8px'
              }}
            >
              <LogOut size={14} />
              로그아웃
            </button>
          </div>
        ) : (
          <button
            onClick={() => handleTabClick('login')}
            className="btn btn-primary"
            style={{
              padding: '6px 16px',
              minHeight: '32px',
              fontSize: '14px',
              borderRadius: '8px'
            }}
          >
            <LogIn size={14} />
            로그인
          </button>
        )}
      </div>

      {/* Mobile Hamburger Toggle */}
      <button
        className="mobile-nav-toggle"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--color-primary)',
          cursor: 'pointer',
          display: 'none',
          padding: '6px'
        }}
      >
        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Drawer menu */}
      {isMenuOpen && (
        <div className="glass fade-in" style={{
          position: 'absolute',
          top: 'calc(100% + 10px)',
          left: 0,
          right: 0,
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(14, 22, 43, 0.98)', // Highly opaque dark blue to prevent background text bleed-through
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
          zIndex: 9999
        }}>
          {/* Mobile Active Users List */}
          {activeUsers.length > 0 && (
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              padding: '12px',
              borderRadius: '12px',
              marginBottom: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <span style={{ 
                  width: '6px', 
                  height: '6px', 
                  borderRadius: '50%', 
                  background: '#10b981', 
                  boxShadow: '0 0 6px #10b981', 
                  display: 'inline-block' 
                }} />
                <span style={{ fontSize: '12px', color: 'var(--color-secondary)', fontWeight: '600' }}>현재 접속자 ({activeUsers.length}명)</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {activeUsers.map((user) => (
                  <div
                    key={user.id || user.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(255,255,255,0.05)',
                      padding: '4px 8px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: 'var(--color-primary)'
                    }}
                  >
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        backgroundImage: user.avatar_url ? `url(${user.avatar_url})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '8px',
                        fontWeight: '700',
                        color: 'white'
                      }}
                    >
                      {!user.avatar_url && user.name.slice(0, 1)}
                    </div>
                    <span>{user.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                style={{
                  background: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                  color: isActive ? 'var(--accent-cyan)' : 'var(--color-secondary)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  fontSize: '16px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%'
                }}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
          
          {showInstallButton && (
            <>
              <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.1)', margin: '8px 0' }} />
              
              <div style={{ padding: '0 8px', marginBottom: '8px' }}>
                <button
                  onClick={() => {
                    onInstallApp();
                    setIsMenuOpen(false);
                  }}
                  className="btn btn-secondary"
                  style={{ 
                    width: '100%', 
                    minHeight: '44px',
                    borderColor: 'var(--accent-cyan)',
                    color: 'var(--accent-cyan)',
                    background: 'rgba(34, 211, 238, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px'
                  }}
                >
                  <Download size={18} />
                  바탕화면에 앱 설치
                </button>
              </div>
            </>
          )}

          {session ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '12px 8px 4px 8px', 
              marginTop: '4px', 
              borderTop: '1px solid rgba(255, 255, 255, 0.1)' 
            }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '15px', color: 'var(--color-primary)', fontWeight: '600' }}>
                  {alumniProfile?.name || '친구'} 님
                </span>
                <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: '700', alignSelf: 'flex-start', background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.2)', padding: '2px 6px', borderRadius: '4px', marginTop: '2px' }}>
                  ★ {alumniProfile?.points || 0} XP
                </span>
              </div>
              <button
                onClick={() => {
                  onLogout();
                  setIsMenuOpen(false);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  transition: 'var(--transition-smooth)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ef4444';
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <LogOut size={14} />
                로그아웃
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleTabClick('login')}
              className="btn btn-primary"
              style={{ width: '100%', minHeight: '44px' }}
            >
              <LogIn size={16} />
              로그인
            </button>
          )}
        </div>
      )}

      {/* Responsive Inline CSS */}
      <style>{`
        @media (max-width: 1280px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-nav-toggle {
            display: block !important;
          }
        }
      `}</style>
    </nav>
  );
}
