import React, { useState } from 'react';
import { Home, Image, BookOpen, Users, Lock, LogOut, LogIn, Menu, X, Download, Film, Radio } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, session, alumniProfile, onLogout, onInstallApp }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isAdmin = alumniProfile?.is_president || alumniProfile?.is_treasurer;

  const navItems = [
    { id: 'home', label: '홈', icon: Home, public: true },
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

  return (
    <nav className="glass" style={{
      position: 'fixed',
      top: '15px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 40px)',
      maxWidth: '1200px',
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
          letterSpacing: '-0.5px'
        }} className="text-gradient">
          시월의 마지막 밤
        </span>
      </div>

      {/* Desktop Navigation */}
      <div className="desktop-nav" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
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
                padding: '8px 16px',
                fontSize: '15px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'var(--transition-smooth)'
              }}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}

        <button
          onClick={onInstallApp}
          style={{
            background: 'transparent',
            color: 'var(--accent-cyan)',
            border: '1px solid rgba(34, 211, 238, 0.3)',
            borderRadius: '10px',
            padding: '8px 16px',
            fontSize: '15px',
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

        <div style={{ width: '1px', height: '20px', background: 'rgba(255, 255, 255, 0.1)', margin: '0 8px' }} />

        {session ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '14px', color: 'var(--color-secondary)' }}>
              {alumniProfile?.name || '친구'} 님
            </span>
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
          border: '1px solid rgba(255, 255, 255, 0.08)'
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

          {session ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 8px' }}>
              <div style={{ fontSize: '15px', color: 'var(--color-secondary)', marginBottom: '4px' }}>
                {alumniProfile?.name || '친구'} 님
              </div>
              <button
                onClick={() => {
                  onLogout();
                  setIsMenuOpen(false);
                }}
                className="btn btn-secondary"
                style={{ width: '100%', minHeight: '44px' }}
              >
                <LogOut size={16} />
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
        @media (max-width: 768px) {
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
