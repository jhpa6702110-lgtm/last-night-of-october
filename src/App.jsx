import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Gallery from './components/Gallery';
import Album from './components/Album';
import Cinema from './components/Cinema';
import Radio from './components/Radio';
import Friends from './components/Friends';
import Admin from './components/Admin';
import Auth from './components/Auth';
import Board from './components/Board';
import { supabase, isSupabaseConfigured, saveSupabaseCredentials } from './utils/supabaseClient';
import { Database, ShieldAlert, KeyRound, Save } from 'lucide-react';

export default function App() {
  // Get initial tab from URL hash
  const getTabFromHash = () => {
    const hash = window.location.hash;
    if (!hash || hash === '#/') return 'home';
    return hash.replace(/^#\/?/, '');
  };

  const [activeTab, setActiveTabState] = useState(getTabFromHash());
  const [session, setSession] = useState(null);
  const [alumniProfile, setAlumniProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [authKey, setAuthKey] = useState(0);
  const [isKakaoTalk, setIsKakaoTalk] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const isKakao = ua.includes('kakaotalk');
    const isInApp = ua.includes('instagram') || ua.includes('fb') || ua.includes('line') || ua.includes('everytimeapp');
    
    if (isKakao) {
      setIsKakaoTalk(true);
    } else if (isInApp) {
      setIsInAppBrowser(true);
    }
  }, []);

  // Sync hashchange event (for back/forward buttons)
  useEffect(() => {
    const handleHashChange = () => {
      const tab = getTabFromHash();
      setActiveTabState(tab || 'home');
    };

    window.addEventListener('hashchange', handleHashChange);

    // If there is no hash when entering the site, default to #/home
    if (!window.location.hash || window.location.hash === '#/') {
      window.location.hash = '#/home';
    }

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const setActiveTab = (tab) => {
    if (tab === 'login') {
      setAuthKey(prev => prev + 1);
    }
    window.location.hash = '#/' + tab;
  };

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

  const [activeUsers, setActiveUsers] = useState([]);

  const checkAttendanceAndDeduction = async (profile) => {
    if (!profile || !profile.id || !configured) return;
    
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const lastVisitedStr = profile.last_visited_at;
      
      if (!lastVisitedStr) {
        // No visit record, just update visited date to today
        await supabase
          .from('alumni')
          .update({ last_visited_at: todayStr })
          .eq('id', profile.id);
        setAlumniProfile(prev => prev ? { ...prev, last_visited_at: todayStr } : null);
        return;
      }

      const lastVisited = new Date(lastVisitedStr);
      const today = new Date(todayStr);
      
      // Calculate date difference
      const diffTime = today - lastVisited;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      let currentPoints = profile.points || 0;
      let updated = false;
      let profileUpdates = {};
      
      // 1. Check deduction for inactivity (>= 3 days)
      if (diffDays >= 3) {
        const penalty = -1;
        currentPoints += penalty;
        
        await supabase
          .from('point_logs')
          .insert({
            alumni_id: profile.id,
            points: penalty,
            reason: `3일 이상 미방문 감점 (${diffDays}일 동안 미방문)`
          });
          
        profileUpdates.points = currentPoints;
        updated = true;
      }
      
      // 2. Check daily attendance
      if (diffDays > 0) {
        const bonus = 1;
        currentPoints += bonus;
        
        await supabase
          .from('point_logs')
          .insert({
            alumni_id: profile.id,
            points: bonus,
            reason: '일일 출석'
          });
          
        profileUpdates.points = currentPoints;
        profileUpdates.last_visited_at = todayStr;
        updated = true;
      }
      
      if (updated) {
        const { error } = await supabase
          .from('alumni')
          .update(profileUpdates)
          .eq('id', profile.id);
          
        if (error) throw error;
        
        setAlumniProfile(prev => prev ? {
          ...prev,
          ...profileUpdates
        } : null);
      }
    } catch (err) {
      console.error('Error during attendance / deduction check:', err);
    }
  };

  const handleAwardActivityPoint = async (reason) => {
    if (!alumniProfile?.id || !configured) return;
    
    try {
      // 1. Insert Point Log
      const { error: logError } = await supabase
        .from('point_logs')
        .insert({
          alumni_id: alumniProfile.id,
          points: 1,
          reason: reason
        });
        
      if (logError) throw logError;
      
      // 2. Update alumni points
      const newPoints = (alumniProfile.points || 0) + 1;
      const { error: updateError } = await supabase
        .from('alumni')
        .update({ points: newPoints })
        .eq('id', alumniProfile.id);
        
      if (updateError) throw updateError;
      
      // 3. Update local state
      setAlumniProfile(prev => prev ? { ...prev, points: newPoints } : null);
    } catch (err) {
      console.error('Error awarding activity point:', err);
    }
  };

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
          
          if (error.code === 'PGRST116') {
            const userName = session.user.user_metadata?.name || session.user.user_metadata?.full_name || '';
            let matchedAlumni = null;

            if (userName) {
              const { data: existingAlumni } = await supabase
                .from('alumni')
                .select('*')
                .eq('name', userName)
                .is('auth_id', null)
                .limit(1);
              
              if (existingAlumni && existingAlumni.length > 0) {
                matchedAlumni = existingAlumni[0];
              }
            }

            if (matchedAlumni) {
              console.log('Mapping existing alumni record with user auth_id:', matchedAlumni.name);
              const { data: updated, error: updateError } = await supabase
                .from('alumni')
                .update({ auth_id: session.user.id })
                .eq('id', matchedAlumni.id)
                .select()
                .single();
              
              if (updateError) throw updateError;
              setAlumniProfile(updated);
              await checkAttendanceAndDeduction(updated);
            } else {
              const { data: inserted, error: insertError } = await supabase
                .from('alumni')
                .insert({
                  auth_id: session.user.id,
                  name: userName || '신규친구',
                  phone: session.user.user_metadata?.phone || '',
                  description: '반갑습니다! 새로 오신 친구입니다.',
                  is_president: false,
                  is_treasurer: false,
                  points: 0,
                  last_visited_at: new Date().toISOString().slice(0, 10)
                })
                .select()
                .single();
              
              if (insertError) throw insertError;
              setAlumniProfile(inserted);
              await checkAttendanceAndDeduction(inserted);
            }
          }
        } else {
          setAlumniProfile(data);
          await checkAttendanceAndDeduction(data);
        }
      } catch (err) {
        console.error('Alumni Profile fetch error:', err);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [session, configured]);

  // Realtime Active Users via DB Heartbeat (Runs every 30 seconds, allowing guests to view but only members to track)
  useEffect(() => {
    if (!configured || !supabase) return;

    const updateHeartbeat = async () => {
      // Only track heartbeat if user is logged in
      if (!alumniProfile?.id) return;
      try {
        await supabase
          .from('alumni')
          .update({ last_active_at: new Date().toISOString() })
          .eq('id', alumniProfile.id);
      } catch (err) {
        console.error('Error updating heartbeat:', err);
      }
    };

    const fetchActiveUsers = async () => {
      try {
        // Considered active if updated within the last 90 seconds
        const ninetySecondsAgo = new Date(Date.now() - 90000).toISOString();
        const { data, error } = await supabase
          .from('alumni')
          .select('id, name, avatar_url')
          .gte('last_active_at', ninetySecondsAgo);

        if (error) throw error;
        
        if (data) {
          // Deduplicate by name to keep it clean
          const uniqueUsers = Array.from(new Map(data.map(u => [u.name, u])).values());
          setActiveUsers(uniqueUsers);
        }
      } catch (err) {
        console.error('Error fetching active users:', err);
      }
    };

    // Run immediately on load
    updateHeartbeat();
    fetchActiveUsers();

    // Set intervals
    const heartbeatInterval = setInterval(updateHeartbeat, 30000); // Update last active state every 30s
    const fetchInterval = setInterval(fetchActiveUsers, 30000); // Fetch list every 30s

    return () => {
      clearInterval(heartbeatInterval);
      clearInterval(fetchInterval);
    };
  }, [configured, alumniProfile?.id]);

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
            onAwardActivityPoint={handleAwardActivityPoint}
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
            onAwardActivityPoint={handleAwardActivityPoint}
          />
        ) : (
          <Auth key={`auth-${authKey}`} onAuthSuccess={(s) => { setSession(s); setActiveTab('album'); }} />
        );

      case 'board':
        // Guard tab for authenticated users
        return session ? (
          <Board 
            session={session} 
            alumniProfile={alumniProfile} 
            onAwardActivityPoint={handleAwardActivityPoint}
          />
        ) : (
          <Auth key={`auth-${authKey}`} onAuthSuccess={(s) => { setSession(s); setActiveTab('board'); }} />
        );

      case 'cinema':
        return <Cinema />;

      case 'radio':
        return <Radio />;

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

  const hasBanner = isKakaoTalk || isInAppBrowser;

  return (
    <div className="app-container" style={{ paddingTop: hasBanner ? '40px' : '0' }}>
      {/* KakaoTalk Warning Banner */}
      {isKakaoTalk && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(90deg, #fee500, #fcd34d)',
          color: '#1e293b',
          zIndex: 9999,
          padding: '8px 16px',
          fontSize: '13px',
          fontWeight: '600',
          textAlign: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
          minHeight: '40px'
        }}>
          <span>📢 카카오톡에서는 모바일 기기 사양에 따라 사진 업로드 시 화면이 새로고침될 수 있습니다.</span>
          <button
            onClick={() => {
              window.location.href = 'kakaotalk://web/openExternalApp?url=' + encodeURIComponent(window.location.href);
            }}
            style={{
              background: '#1e293b',
              color: '#f8fafc',
              border: 'none',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            기본 브라우저로 열기
          </button>
        </div>
      )}

      {/* General In-App Browser Warning Banner */}
      {isInAppBrowser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(90deg, #f43f5e, #ec4899)',
          color: '#f8fafc',
          zIndex: 9999,
          padding: '8px 16px',
          fontSize: '13px',
          fontWeight: '600',
          textAlign: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
          minHeight: '40px'
        }}>
          <span>📢 인앱 브라우저(인스타/페북 등)에서는 기기 사양에 따라 사진 업로드 시 화면이 새로고침될 수 있습니다.</span>
          <span style={{ fontSize: '12px', opacity: 0.9 }}>우측 상단 메뉴를 눌러 [다른 브라우저로 열기]를 권장합니다.</span>
        </div>
      )}

      {/* Sticky Header Navbar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        session={session} 
        alumniProfile={alumniProfile} 
        activeUsers={activeUsers}
        onLogout={handleLogout} 
        onInstallApp={handleInstallApp}
        isKakaoTalk={isKakaoTalk}
        isInAppBrowser={isInAppBrowser}
      />

      {/* Main Pages Container */}
      <main className="main-content" style={{ paddingTop: hasBanner ? '150px' : '110px' }}>
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
