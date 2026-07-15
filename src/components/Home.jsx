import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Image, Users, BookOpen, AlertCircle, X, ChevronRight, HelpCircle, Award, MessageSquare, Film, Key, Play, Pause, Volume2, VolumeX, Music } from 'lucide-react';

const DEFAULT_HEROS = [
  'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&q=80&w=1600', // Starry night
  'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=1600', // Friends gather bonfire
  'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&q=80&w=1600'  // Autumn evening trees
];

export default function Home({ session, alumniProfile, setActiveTab }) {
  const [heroImages, setHeroImages] = useState(DEFAULT_HEROS);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [stats, setStats] = useState({ photos: 0, friends: 0, albums: 0 });
  const [recentPhotos, setRecentPhotos] = useState([]);
  const [topRankers, setTopRankers] = useState([]);
  const [activeImageUrl, setActiveImageUrl] = useState(null);
  const [showUserManual, setShowUserManual] = useState(false);

  // Audio Player states for background theme song
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const audioRef = useRef(null);

  // Initialize and handle background music for logged in alumni
  useEffect(() => {
    // Only initialize audio if the user is logged in
    if (!session || !alumniProfile) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
        setIsPlaying(false);
      }
      return;
    }

    const audioUrl = 'https://jinheestate.blog/wp-content/uploads/2026/07/잊혀진-계절.mp3';
    const audio = new Audio(audioUrl);
    audio.loop = true;
    audioRef.current = audio;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration || 0);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    // Apply volume
    audio.volume = isMuted ? 0 : volume / 100;

    // Try autoplay (often blocked by browser until user interaction)
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          setAutoplayBlocked(false);
        })
        .catch((error) => {
          console.log('Autoplay prevented:', error);
          setAutoplayBlocked(true);
          setIsPlaying(false);
        });
    }

    return () => {
      audio.pause();
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audioRef.current = null;
      setIsPlaying(false);
    };
  }, [session, alumniProfile]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play()
        .then(() => setAutoplayBlocked(false))
        .catch(err => console.log('Play failed:', err));
    }
  };

  const handleSeek = (e) => {
    if (!audioRef.current) return;
    const seekTime = parseFloat(e.target.value);
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return '0:00';
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Handle voice command to open user manual
  useEffect(() => {
    const handleVoiceManual = () => {
      setShowUserManual(true);
    };

    window.addEventListener('open-user-manual-voice', handleVoiceManual);
    return () => {
      window.removeEventListener('open-user-manual-voice', handleVoiceManual);
    };
  }, []);
  
  // Pinch-to-zoom & Pan states for mobile image viewer
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const touchStartRef = useRef({ distance: 0, x: 0, y: 0, scale: 1 });

  const handleTouchStart = (e) => {
    const touches = e.touches;
    if (touches.length === 1) {
      // Single touch for panning
      touchStartRef.current.x = touches[0].clientX - position.x;
      touchStartRef.current.y = touches[0].clientY - position.y;
    } else if (touches.length === 2) {
      // Multi touch for pinching
      const dist = Math.hypot(
        touches[0].clientX - touches[1].clientX,
        touches[0].clientY - touches[1].clientY
      );
      touchStartRef.current.distance = dist;
      touchStartRef.current.scale = scale;
    }
  };

  const handleTouchMove = (e) => {
    const touches = e.touches;
    if (touches.length === 1 && scale > 1) {
      // Pan only when zoomed in
      const newX = touches[0].clientX - touchStartRef.current.x;
      const newY = touches[0].clientY - touchStartRef.current.y;
      setPosition({ x: newX, y: newY });
    } else if (touches.length === 2) {
      // Prevent browser default gesture zoom
      if (e.cancelable) e.preventDefault();
      const dist = Math.hypot(
        touches[0].clientX - touches[1].clientX,
        touches[0].clientY - touches[1].clientY
      );
      const factor = dist / touchStartRef.current.distance;
      const newScale = Math.max(1, Math.min(touchStartRef.current.scale * factor, 4));
      setScale(newScale);
      
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
    }
  };

  const handleTouchEnd = () => {
    if (scale <= 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleDoubleClick = () => {
    if (scale > 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(2.5);
    }
  };

  const handleCloseLightbox = () => {
    setActiveImageUrl(null);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const [showNotice, setShowNotice] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [dontShowNoticeToday, setDontShowNoticeToday] = useState(false);



  // Background Slider interval
  useEffect(() => {
    if (heroImages.length === 0) return;
    const interval = setInterval(() => {
      setCurrentHeroIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
    }, 4500); // Cross-fade every 4.5s
    return () => clearInterval(interval);
  }, [heroImages]);

  // Load stats, recent photos, hero images, and notices from database
  useEffect(() => {
    const fetchData = async () => {
      if (!supabase) return;

      try {
        // 1. Fetch statistics
        const { count: photosCount } = await supabase.from('gallery').select('*', { count: 'exact', head: true });
        const { count: friendsCount } = await supabase.from('alumni').select('*', { count: 'exact', head: true });
        const { count: albumsCount } = await supabase.from('albums').select('*', { count: 'exact', head: true });
        
        setStats({
          photos: photosCount || 0,
          friends: friendsCount || 0,
          albums: albumsCount || 0
        });

        // 2. Fetch recent 6 gallery photos
        const { data: latestPics } = await supabase
          .from('gallery')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(6);
        
        if (latestPics) setRecentPhotos(latestPics);

        // 3. Fetch custom hero backgrounds
        const { data: customHeros } = await supabase.from('hero_images').select('image_url');
        if (customHeros && customHeros.length > 0) {
          setHeroImages(customHeros.map(item => item.image_url));
        }

        // 4. Fetch latest board post (is_notice: true가 우선, 없으면 일반 최신글)
        let { data: noticePosts } = await supabase
          .from('board')
          .select('*')
          .eq('is_notice', true)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!noticePosts || noticePosts.length === 0) {
          const { data: latestGeneral } = await supabase
            .from('board')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);
          noticePosts = latestGeneral;
        }

        if (noticePosts && noticePosts.length > 0) {
          const latestNotice = noticePosts[0];
          setNoticeTitle(latestNotice.title);
          setNoticeContent(latestNotice.content);
          
          // Check localStorage "do not show today" flag
          const lastNoticeDismissed = localStorage.getItem('notice_dismissed_time');
          const noticeDismissedId = localStorage.getItem('notice_dismissed_id');
          
          if (lastNoticeDismissed && noticeDismissedId === latestNotice.id) {
            const timePassed = Date.now() - parseInt(lastNoticeDismissed, 10);
            if (timePassed < 24 * 60 * 60 * 1000) {
              setShowNotice(false);
              return;
            }
          }
          setShowNotice(true);
          // Keep a temporary reference to current notice ID
          localStorage.setItem('temp_notice_id', latestNotice.id);
        }

        // 5. Fetch Top 3 rankers based on points
        const { data: rankers } = await supabase
          .from('alumni')
          .select('name, points, avatar_url')
          .order('points', { ascending: false })
          .limit(3);
        
        if (rankers) setTopRankers(rankers);
      } catch (err) {
        console.error('Error fetching Home data:', err);
      }
    };

    fetchData();
  }, []);

  const handleCloseNotice = () => {
    if (dontShowNoticeToday) {
      const noticeId = localStorage.getItem('temp_notice_id') || 'default';
      localStorage.setItem('notice_dismissed_time', Date.now().toString());
      localStorage.setItem('notice_dismissed_id', noticeId);
    }
    setShowNotice(false);
  };

  return (
    <div style={{ position: 'relative', minHeight: 'calc(100vh - 80px)', paddingBottom: '60px' }}>
      
      {/* Background Image Slider with cross-fade */}
      {heroImages.map((imgUrl, idx) => (
        <div
          key={imgUrl}
          className="hero-slider-bg"
          style={{
            backgroundImage: `url(${imgUrl})`,
            opacity: idx === currentHeroIndex ? 1 : 0,
            backgroundAttachment: window.innerWidth <= 768 ? 'scroll' : 'fixed'
          }}
        />
      ))}
      <div className="hero-slider-overlay" />

      {/* Hero Core Content */}
      <div style={{
        paddingTop: '80px',
        paddingBottom: '60px',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        maxWidth: '700px',
        zIndex: 5
      }}>
        {/* Badge */}
        <div className="glass" style={{
          padding: '6px 16px',
          borderRadius: '50px',
          fontSize: '14px',
          fontWeight: '500',
          color: 'var(--accent-cyan)',
          marginBottom: '20px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-cyan)', display: 'inline-block' }} />
          친구들과 함께하는 추억 공간
        </div>

        {/* Heading */}
        <h1 style={{
          fontSize: 'clamp(40px, 8vw, 64px)',
          fontWeight: '800',
          lineHeight: '1.15',
          marginBottom: '20px',
          letterSpacing: '-1.5px'
        }}>
          시월의<br />
          <span className="text-gradient">마지막 밤</span>
        </h1>

        {/* Description */}
        <p style={{
          fontSize: '18px',
          color: 'var(--color-secondary)',
          lineHeight: '1.6',
          marginBottom: '35px',
          maxWidth: '550px'
        }}>
          친구들과 함께하는 특별한 순간들을 공유하고 간직해 보세요. 
          우리들만의 소중한 사진과 앨범이 안전하게 보관되는 공간입니다.
        </p>

        {/* Theme Song Radio Player (Only for logged-in alumni) */}
        {session && alumniProfile && (
          <div className="radio-player-card fade-in">
            <div className="radio-visual-section">
              {/* LP Turntable Graphic */}
              <div className="lp-disc-container">
                <div className={`lp-disc ${isPlaying ? 'lp-disc-spinning' : ''}`}>
                  <div className="lp-disc-grooves" />
                  <div className="lp-disc-label">
                    <span style={{ fontSize: '12px' }}>🍂</span>
                  </div>
                  <div className="lp-disc-center-hole" />
                </div>
                {/* LP Tonearm Graphic */}
                <svg className="lp-tonearm" style={{ transform: isPlaying ? 'rotate(18deg)' : 'rotate(0deg)' }} viewBox="0 0 40 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M25 8C25 9.10457 24.1046 10 23 10C21.8954 10 21 9.10457 21 8C21 6.89543 21.8954 6 23 6C24.1046 6 25 6.89543 25 8Z" fill="#a0aec0"/>
                  <path d="M23 8L15 28L18 52" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="15" y="48" width="6" height="8" rx="1" transform="rotate(15 15 48)" fill="#718096"/>
                </svg>
              </div>

              {/* Music Metadata Info */}
              <div className="radio-info-meta">
                <div className="radio-song-title">잊혀진 계절</div>
                <div className="radio-artist-name">
                  <Music size={13} style={{ color: 'var(--accent-cyan)' }} />
                  시월의 마지막 밤 주제곡
                </div>
              </div>

              {/* Audio Equalizer dancing bars */}
              <div className="eq-bars-container">
                <div className={`eq-bar ${isPlaying ? 'eq-bar-active-1' : ''}`} />
                <div className={`eq-bar ${isPlaying ? 'eq-bar-active-2' : ''}`} />
                <div className={`eq-bar ${isPlaying ? 'eq-bar-active-3' : ''}`} />
                <div className={`eq-bar ${isPlaying ? 'eq-bar-active-4' : ''}`} />
                <div className={`eq-bar ${isPlaying ? 'eq-bar-active-5' : ''}`} />
              </div>
            </div>

            {/* Controls and progress row */}
            <div className="radio-controls-row">
              {/* Play / Pause Toggle Button */}
              <button className="radio-play-btn" onClick={togglePlay} aria-label={isPlaying ? '일시정지' : '재생'}>
                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" style={{ marginLeft: '2px' }} />}
              </button>

              {/* Progress Slider */}
              <div className="radio-progress-container">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="radio-progress-slider"
                />
                <div className="radio-time-labels">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Volume Slider */}
              <div className="radio-volume-container">
                <button 
                  onClick={() => setIsMuted(!isMuted)} 
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                  aria-label="음소거 토글"
                >
                  {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(parseInt(e.target.value));
                    if (isMuted) setIsMuted(false);
                  }}
                  className="radio-volume-slider"
                />
              </div>
            </div>

            {/* Autoplay blocked fallback guide */}
            {autoplayBlocked && (
              <div className="radio-autoplay-banner">
                <span>📻 터치하여 시월의 마지막 밤 주제곡을 들어보세요!</span>
              </div>
            )}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab(session ? 'gallery' : 'login')}
            className="btn btn-primary"
            style={{ padding: '14px 28px' }}
          >
            친구들과 시작하기
            <ChevronRight size={18} />
          </button>
          
          <a
            href="#recent-section"
            className="btn btn-secondary"
            style={{ padding: '14px 24px' }}
          >
            최근 사진 보기
          </a>

          <button
            onClick={() => setShowUserManual(true)}
            className="btn btn-secondary"
            style={{ 
              padding: '14px 24px', 
              borderColor: 'rgba(34, 211, 238, 0.4)', 
              color: 'var(--accent-cyan)',
              background: 'rgba(34, 211, 238, 0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <HelpCircle size={16} />
            사용자 매뉴얼
          </button>
        </div>
      </div>

      {/* Stats Counter Board */}
      <div className="glass" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        padding: '30px 20px',
        width: '100%',
        maxWidth: '750px',
        marginTop: '20px',
        marginBottom: '60px',
        gap: '20px',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ color: 'var(--accent-violet)', marginBottom: '8px' }}>
            <Image size={24} />
          </div>
          <span style={{ fontSize: '32px', fontWeight: '800', fontFamily: 'Outfit' }} className="text-gradient">
            {stats.photos}+
          </span>
          <span style={{ fontSize: '13px', color: 'var(--color-secondary)', marginTop: '4px' }}>공유된 사진</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderLeft: '1px solid rgba(255,255,255,0.08)', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ color: 'var(--accent-cyan)', marginBottom: '8px' }}>
            <Users size={24} />
          </div>
          <span style={{ fontSize: '32px', fontWeight: '800', fontFamily: 'Outfit' }} className="text-gradient">
            {stats.friends}
          </span>
          <span style={{ fontSize: '13px', color: 'var(--color-secondary)', marginTop: '4px' }}>등록된 친구</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ color: 'var(--accent-green)', marginBottom: '8px' }}>
            <BookOpen size={24} />
          </div>
          <span style={{ fontSize: '32px', fontWeight: '800', fontFamily: 'Outfit' }} className="text-gradient">
            {stats.albums}
          </span>
          <span style={{ fontSize: '13px', color: 'var(--color-secondary)', marginTop: '4px' }}>추억 앨범</span>
        </div>
      </div>

      {/* Top Rankers / Hall of Fame Widget */}
      <div id="ranking-section" style={{ marginBottom: '60px' }}>
        <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ width: '4px', height: '18px', background: 'var(--accent-gradient)', borderRadius: '2px', display: 'inline-block' }} />
          👑 열정 랭킹 (명예의 전당)
        </h3>
        
        {topRankers.length === 0 ? (
          <div className="glass" style={{ padding: '30px', textAlign: 'center', color: 'var(--color-secondary)' }}>
            아직 랭킹 데이터가 없습니다. 첫 활동을 시작해 보세요!
          </div>
        ) : (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '20px',
            flexWrap: 'wrap',
            width: '100%'
          }}>
            {topRankers.map((ranker, index) => {
              const rankColors = [
                { border: 'rgba(234, 179, 8, 0.4)', bg: 'rgba(234, 179, 8, 0.04)', text: '#eab308', title: '1등 (Gold)' },
                { border: 'rgba(148, 163, 184, 0.4)', bg: 'rgba(148, 163, 184, 0.04)', text: '#94a3b8', title: '2등 (Silver)' },
                { border: 'rgba(180, 83, 9, 0.4)', bg: 'rgba(180, 83, 9, 0.04)', text: '#b45309', title: '3등 (Bronze)' }
              ];
              const currentRank = rankColors[index] || rankColors[2];
              
              return (
                <div
                  key={ranker.name}
                  className="glass"
                  style={{
                    flex: 1,
                    minWidth: '180px',
                    padding: '24px 20px',
                    textAlign: 'center',
                    borderRadius: '16px',
                    border: `1px solid ${currentRank.border}`,
                    background: currentRank.bg,
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    transition: 'var(--transition-smooth)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = `0 10px 25px ${currentRank.border}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
                  }}
                >
                  {/* Rank Badge */}
                  <span style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    fontSize: '11px',
                    fontWeight: '800',
                    color: currentRank.text,
                    border: `1px solid ${currentRank.border}`,
                    borderRadius: '4px',
                    padding: '2px 6px',
                    textTransform: 'uppercase'
                  }}>
                    {index + 1}st
                  </span>
                  
                  {/* Avatar or Icon */}
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundImage: ranker.avatar_url ? `url(${ranker.avatar_url})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: `2px solid ${currentRank.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px',
                    fontSize: '24px'
                  }}>
                    {!ranker.avatar_url && (index === 0 ? '👑' : index === 1 ? '🥈' : '🥉')}
                  </div>
                  
                  <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px', color: 'var(--color-primary)' }}>
                    {ranker.name}
                  </h4>
                  <span style={{ fontSize: '13px', color: 'var(--color-secondary)' }}>
                    누적 포인트: <strong style={{ color: currentRank.text }}>{ranker.points || 0} XP</strong>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Photos Section */}
      <div id="recent-section" style={{ marginTop: '80px' }}>
        <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ width: '4px', height: '18px', background: 'var(--accent-cyan)', borderRadius: '2px', display: 'inline-block' }} />
          최근 공유된 사진들
        </h3>
        
        {recentPhotos.length === 0 ? (
          <div className="glass" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-secondary)' }}>
            아직 업로드된 사진이 없습니다. 갤러리 탭에서 첫 사진을 공유해 보세요!
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '20px',
            width: '100%'
          }}>
            {recentPhotos.map((photo) => (
              <div
                key={photo.id}
                className="glass"
                onClick={() => setActiveImageUrl(photo.image_url)}
                style={{
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)',
                  borderRadius: '12px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-neon)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
                }}
              >
                <div style={{
                  width: '100%',
                  paddingBottom: '100%',
                  position: 'relative',
                  backgroundImage: `url(${photo.image_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }} />
                <div style={{ padding: '12px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {photo.title}
                  </h4>
                  <span style={{ fontSize: '12px', color: 'var(--color-secondary)', marginTop: '4px', display: 'block' }}>
                    {photo.author_name} • {new Date(photo.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notice / Announcement Overlay Popup */}
      {showNotice && (
        <div className="modal-overlay">
          <div className="glass modal-content" style={{ maxWidth: '500px', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)' }}>
                <AlertCircle size={20} />
                <span style={{ fontWeight: '700', fontSize: '18px' }}>최신 소식</span>
              </div>
              <button 
                onClick={handleCloseNotice} 
                style={{ background: 'transparent', border: 'none', color: 'var(--color-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: 'var(--color-primary)', textAlign: 'left' }}>
              {noticeTitle}
            </h4>

            <div style={{ 
              background: 'rgba(255, 255, 255, 0.03)', 
              padding: '20px', 
              borderRadius: '10px', 
              marginBottom: '20px',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              fontSize: '14px',
              color: 'var(--color-secondary)',
              textAlign: 'left',
              maxHeight: '260px',
              overflowY: 'auto'
            }}>
              {noticeContent}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="checkbox-group" style={{ fontSize: '14px', color: 'var(--color-secondary)' }}>
                <input 
                  type="checkbox" 
                  className="checkbox-input"
                  checked={dontShowNoticeToday}
                  onChange={(e) => setDontShowNoticeToday(e.target.checked)}
                />
                오늘 하루 동안 보지 않기
              </label>
              
              <button onClick={handleCloseNotice} className="btn btn-secondary" style={{ padding: '8px 16px', minHeight: '36px' }}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {activeImageUrl && (
        <div 
          className="modal-overlay" 
          onClick={handleCloseLightbox}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(7, 11, 25, 0.96)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            overflow: 'hidden',
            touchAction: 'none' // Prevent default browser scrolling/zooming gestures
          }}
        >
          <div 
            style={{ 
              position: 'relative', 
              maxWidth: '90%', 
              maxHeight: '90%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={activeImageUrl} 
              alt="크게 보기" 
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onDoubleClick={handleDoubleClick}
              style={{ 
                maxWidth: '100%', 
                maxHeight: '85vh', 
                borderRadius: '12px', 
                boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
                border: '1px solid rgba(255,255,255,0.15)',
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transition: scale === 1 ? 'transform 0.25s cubic-bezier(0.1, 0.76, 0.55, 0.94)' : 'none',
                cursor: scale > 1 ? 'grab' : 'zoom-in',
                userSelect: 'none',
                WebkitUserDrag: 'none',
                touchAction: 'none'
              }} 
            />
            <button 
              onClick={handleCloseLightbox}
              style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'var(--color-primary)',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '50px',
                backdropFilter: 'blur(5px)',
                zIndex: 10000
              }}
            >
              <X size={16} />
              닫기
            </button>
          </div>
        </div>
      )}

      {/* User Manual Modal */}
      {showUserManual && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="glass modal-content" style={{ 
            maxWidth: '650px', 
            width: '90%',
            maxHeight: '85vh',
            overflowY: 'auto',
            border: '1px solid rgba(34, 211, 238, 0.2)',
            padding: '30px',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)' }}>
                <BookOpen size={22} />
                <span style={{ fontWeight: '800', fontSize: '20px' }}>📖 시월의 마지막 밤 사용자 매뉴얼</span>
              </div>
              <button 
                onClick={() => setShowUserManual(false)} 
                style={{ background: 'transparent', border: 'none', color: 'var(--color-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', color: 'var(--color-secondary)', fontSize: '14px', lineHeight: '1.7' }}>
              
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <h4 style={{ color: 'var(--color-primary)', fontWeight: '700', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Key size={16} style={{ color: 'var(--accent-cyan)' }} />
                  1. 회원 가입 및 로그인
                </h4>
                <p style={{ margin: 0, paddingLeft: '24px' }}>
                  본 동창회 공간은 사전에 등록된 동창 전용 프라이빗 공간입니다. 처음 가입 시, 회장단에 사전 제출한 <strong>이름</strong>과 <strong>전화번호</strong>를 입력하여 매칭을 완료한 뒤 본인이 사용할 비밀번호를 등록해 가입할 수 있습니다.
                </p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <h4 style={{ color: 'var(--color-primary)', fontWeight: '700', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <MessageSquare size={16} style={{ color: 'var(--accent-cyan)' }} />
                  2. 소통 게시판
                </h4>
                <p style={{ margin: 0, paddingLeft: '24px' }}>
                  동창들과 자유로운 대화와 소식을 나누는 광장입니다. 일반 대화글 외에도 회장단의 <strong>중요 공지사항</strong>이 업로드됩니다. 각 글에 댓글 및 대댓글을 달아 실시간으로 의견과 안부를 주고받으실 수 있습니다.
                </p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <h4 style={{ color: 'var(--color-primary)', fontWeight: '700', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Image size={16} style={{ color: 'var(--accent-cyan)' }} />
                  3. 추억 갤러리 및 테마 앨범
                </h4>
                <p style={{ margin: 0, paddingLeft: '24px' }}>
                  <strong>갤러리</strong>: 모임이나 일상 사진을 자유롭게 올려 동창들과 공유할 수 있는 곳입니다. 마음에 드는 사진에는 하트(좋아요)를 눌러 공감할 수 있습니다.<br />
                  <strong>테마 앨범</strong>: 체육 대회, 정기 총회 등 큰 모임이나 테마에 따라 사진 폴더를 구분하여 보기 좋게 기록하고 아카이빙하는 공간입니다.
                </p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <h4 style={{ color: 'var(--color-primary)', fontWeight: '700', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Film size={16} style={{ color: 'var(--accent-cyan)' }} />
                  4. 영화관 및 라디오 방송
                </h4>
                <p style={{ margin: 0, paddingLeft: '24px' }}>
                  동창들과 공유하고 싶은 영상과 음악, 라디오 사연 및 스트리밍 방송 등을 함께 감상하며 휴식을 취하는 문화 공간입니다.
                </p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <h4 style={{ color: 'var(--color-primary)', fontWeight: '700', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Award size={16} style={{ color: 'var(--accent-cyan)' }} />
                  5. 활동 포인트(XP)와 열정 랭킹
                </h4>
                <div style={{ margin: 0, paddingLeft: '24px' }}>
                  동창회 사이트에서 소통 활동을 즐기다 보면 자동으로 XP(활동 포인트)가 누적됩니다.
                  <ul style={{ margin: '5px 0 0 0', paddingLeft: '18px', listStyleType: 'circle' }}>
                    <li>회원 가입 성공: <strong>+50 XP</strong></li>
                    <li>새 게시글 등록 및 사진 공유: <strong>+10 XP</strong></li>
                    <li>댓글 작성: <strong>+2 XP</strong></li>
                  </ul>
                  포인트가 많이 누적될수록 메인 페이지의 **'👑 열정 랭킹 (명예의 전당)'** 최상단에 이름과 아바타가 노출되는 영예를 안을 수 있습니다.
                </div>
              </div>

            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '25px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '15px' }}>
              <button 
                onClick={() => setShowUserManual(false)} 
                className="btn btn-primary" 
                style={{ padding: '8px 24px', minHeight: '38px' }}
              >
                확인 및 닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
