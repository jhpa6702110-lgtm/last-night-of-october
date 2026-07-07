import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Gallery from './components/Gallery';
import Album from './components/Album';
import Cinema from './components/Cinema';
import Friends from './components/Friends';
import Admin from './components/Admin';
import Auth from './components/Auth';
import { supabase, isSupabaseConfigured, saveSupabaseCredentials } from './utils/supabaseClient';
import { Database, ShieldAlert, KeyRound, Save } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [session, setSession] = useState(null);
  const [alumniProfile, setAlumniProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [authKey, setAuthKey] = useState(0);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if device is iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iosDevice);

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (isIOS) {
      alert('아이폰(iOS) 설치 안내:\n\n사파리(Safari) 브라우저 하단의 [공유] (📤) 아이콘을 클릭한 뒤, 아래로 스크롤하여 [홈 화면에 추가] (➕) 버튼을 눌러주시면 바탕화면에 앱 아이콘이 설치됩니다!');
      return;
    }

    if (!deferredPrompt) {
      alert('설치 안내:\n\n1. 모바일(크롬/삼성인터넷) 또는 PC(크롬/웨일): 브라우저 주소창 우측 끝에 있는 [앱 설치] 아이콘(또는 점 3개 메뉴 ➔ 홈 화면에 추가)을 클릭하여 설치하실 수 있습니다.\n\n2. 아이폰(Safari): 하단의 공유(📤) 버튼을 누르고 [홈 화면에 추가](➕)를 터치해 주세요!\n\n(이미 설치가 완료된 경우 바탕화면의 아이콘을 클릭해 재접속해 주세요.)');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // Supabase Setup Form (if env variables not configured yet)
  const [setupUrl, setSetupUrl] = useState('');
  const [setupKey, setSetupKey] = useState('');
  const configured = isSupabaseConfigured();

  // 1. Subscribe to Supabase Auth State changes
  useEffect(() => {
    if (!configured) return;

    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setAlumniProfile(null);
      }
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [configured]);

  // 2. Fetch Alumni Profile once Session is available
  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user?.id || !configured) return;
      setLoadingProfile(true);

      try {
        const { data, error } = await supabase
          .from('alumni')
          .select('*')
          .eq('auth_id', session.user.id)
          .single();

        if (error) {
          console.warn('Error fetching alumni profile:', error.message);
          // If profile is not found in alumni but user is signed up in auth.users
          // We can create a default alumni profile or fetch details from user metadata
          if (error.code === 'PGRST116') {
            const { data: inserted, error: insertError } = await supabase
              .from('alumni')
              .insert({
                auth_id: session.user.id,
                name: session.user.user_metadata?.name || '신규친구',
                phone: session.user.user_metadata?.phone || '',
                description: '반갑습니다! 새로 오신 친구입니다.',
                is_president: false,
                is_treasurer: false
              })
              .select()
              .single();
            
            if (insertError) throw insertError;
            setAlumniProfile(inserted);
          }
        } else {
          setAlumniProfile(data);
        }
      } catch (err) {
        console.error('Alumni Profile fetch error:', err);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [session, configured]);

  const handleLogout = async () => {
    if (configured) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setAlumniProfile(null);
    setActiveTab('home');
  };

  const handleSetupSubmit = (e) => {
    e.preventDefault();
    if (!setupUrl.trim() || !setupKey.trim()) return;
    saveSupabaseCredentials(setupUrl, setupKey);
  };

  // Render Setup Config screen if Supabase credentials are missing
  if (!configured) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--color-primary)',
        fontFamily: 'var(--font-main)',
        padding: '20px'
      }}>
        <div className="glass fade-in" style={{
          width: '100%',
          maxWidth: '500px',
          padding: '40px 30px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(34, 211, 238, 0.1)',
            border: '1px solid rgba(34, 211, 238, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
            color: 'var(--accent-cyan)'
          }}>
            <Database size={28} />
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '10px' }}>Supabase 연동이 필요합니다</h2>
          <p style={{ color: 'var(--color-secondary)', fontSize: '14px', lineHeight: '1.6', marginBottom: '30px' }}>
            이 웹 애플리케이션은 Supabase 서버 DB를 활용합니다.<br />
            프로젝트의 <strong>Project URL</strong>과 <strong>Anon Key</strong>를 입력해 주시면 연동이 완료됩니다.
          </p>

          <form onSubmit={handleSetupSubmit} style={{ textAlign: 'left' }}>
            <div className="input-group">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldAlert size={14} />
                Supabase Project URL
              </label>
              <input
                type="url"
                required
                placeholder="https://your-project-id.supabase.co"
                className="input-field"
                value={setupUrl}
                onChange={(e) => setSetupUrl(e.target.value)}
              />
            </div>

            <div className="input-group" style={{ marginBottom: '25px' }}>
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <KeyRound size={14} />
                Supabase Anon Key
              </label>
              <input
                type="password"
                required
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="input-field"
                value={setupKey}
                onChange={(e) => setSetupKey(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '46px', gap: '8px' }}>
              <Save size={18} />
              연동 설정 저장
            </button>
          </form>
          
          <div style={{ marginTop: '20px', fontSize: '12px', color: 'var(--color-secondary)', textAlign: 'left', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
            <strong>💡 참고 사항:</strong><br />
            설정값은 브라우저 로컬 저장소(LocalStorage)에 안전하게 임시 보관되며, 언제든지 관리자 페이지에서 수정 또는 초기화할 수 있습니다.
          </div>
        </div>
      </div>
    );
  }

  // Render Component depending on active tab
  const renderContent = () => {
    if (activeTab === 'login') {
      return (
        <Auth 
          key={`auth-${authKey}`}
          onAuthSuccess={(sess) => {
            setSession(sess);
            setActiveTab('home');
          }} 
        />
      );
    }

    switch (activeTab) {
      case 'home':
        return (
          <Home 
            session={session} 
            alumniProfile={alumniProfile} 
            setActiveTab={setActiveTab} 
          />
        );
      
      case 'gallery':
        // Guard tab for authenticated users
        return session ? (
          <Gallery 
            session={session} 
            alumniProfile={alumniProfile} 
          />
        ) : (
          <Auth key={`auth-${authKey}`} onAuthSuccess={(s) => { setSession(s); setActiveTab('gallery'); }} />
        );

      case 'album':
        // Guard tab for authenticated users
        return session ? (
          <Album 
            session={session} 
            alumniProfile={alumniProfile} 
          />
        ) : (
          <Auth key={`auth-${authKey}`} onAuthSuccess={(s) => { setSession(s); setActiveTab('album'); }} />
        );

      case 'cinema':
        return <Cinema />;

      case 'friends':
        // Guard tab for authenticated users
        return session ? (
          <Friends 
            session={session} 
            alumniProfile={alumniProfile} 
          />
        ) : (
          <Auth key={`auth-${authKey}`} onAuthSuccess={(s) => { setSession(s); setActiveTab('friends'); }} />
        );

      case 'admin':
        // Guard tab for administrators only
        const isAdmin = alumniProfile?.is_president || alumniProfile?.is_treasurer;
        return (session && isAdmin) ? (
          <Admin 
            session={session} 
            alumniProfile={alumniProfile} 
          />
        ) : (
          <Home session={session} alumniProfile={alumniProfile} setActiveTab={setActiveTab} />
        );

      default:
        return (
          <Home 
            session={session} 
            alumniProfile={alumniProfile} 
            setActiveTab={setActiveTab} 
          />
        );
    }
  };

  const handleSetActiveTab = (tab) => {
    if (tab === 'login') {
      setAuthKey(prev => prev + 1);
    }
    setActiveTab(tab);
  };

  return (
    <div className="app-container">
      {/* Sticky Header Navbar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={handleSetActiveTab} 
        session={session} 
        alumniProfile={alumniProfile} 
        onLogout={handleLogout} 
        onInstallApp={handleInstallApp}
      />

      {/* Main Pages Container */}
      <main className="main-content">
        {loadingProfile ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <div style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: '15px', color: 'var(--color-secondary)', fontSize: '14px' }}>프로필 정보를 불러오는 중입니다...</p>
          </div>
        ) : (
          renderContent()
        )}
      </main>
    </div>
  );
}
