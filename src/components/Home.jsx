import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Image, Users, BookOpen, AlertCircle, X, ChevronRight } from 'lucide-react';

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
  const [showNotice, setShowNotice] = useState(false);
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

        // 4. Fetch notice/announcement (using adminSettings or custom check)
        // For simplicity, we can fetch the latest text-based post in 'gallery' tagged #공지사항
        const { data: noticePosts } = await supabase
          .from('gallery')
          .select('*')
          .contains('tags', ['공지사항'])
          .order('created_at', { ascending: false })
          .limit(1);

        if (noticePosts && noticePosts.length > 0) {
          const latestNotice = noticePosts[0];
          setNoticeContent(latestNotice.description || latestNotice.title);
          
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
                onClick={() => setActiveTab('gallery')}
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
          <div className="glass modal-content" style={{ maxWidth: '500px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-red)' }}>
                <AlertCircle size={20} />
                <span style={{ fontWeight: '700', fontSize: '18px' }}>공지사항</span>
              </div>
              <button 
                onClick={handleCloseNotice} 
                style={{ background: 'transparent', border: 'none', color: 'var(--color-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.03)', 
              padding: '20px', 
              borderRadius: '10px', 
              marginBottom: '20px',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap'
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
    </div>
  );
}
