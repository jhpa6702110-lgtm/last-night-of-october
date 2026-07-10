import React, { useState, useEffect } from 'react';
import { supabase, saveSupabaseCredentials, clearSupabaseCredentials } from '../utils/supabaseClient';
import { Database, Image, Users, Download, CheckCircle, HelpCircle, Save, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Admin({ _session, _alumniProfile }) {
  const [activeSubTab, setActiveSubTab] = useState('settings');
  const [friendsList, setFriendsList] = useState([]);
  const [heroList, setHeroList] = useState([]);
  const [_loading, setLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState({ photos: 0, comments: 0, albums: 0 });

  // Config State
  const [sbUrl, setSbUrl] = useState(localStorage.getItem('supabase_url') || '');
  const [sbKey, setSbKey] = useState(localStorage.getItem('supabase_anon_key') || '');
  const [configSuccess, setConfigSuccess] = useState('');

  // Hero Upload State
  const [heroFile, setHeroFile] = useState(null);
  const [uploadingHero, setUploadingHero] = useState(false);

  const fetchAdminData = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      // Fetch friends
      const { data: friends } = await supabase.from('alumni').select('*').order('name');
      if (friends) setFriendsList(friends);

      // Fetch background images
      const { data: heros } = await supabase.from('hero_images').select('*').order('created_at', { ascending: false });
      if (heros) setHeroList(heros);

      // Fetch stats
      const { count: countPhotos } = await supabase.from('gallery').select('*', { count: 'exact', head: true });
      const { count: countComments } = await supabase.from('comments').select('*', { count: 'exact', head: true });
      const { count: countAlbums } = await supabase.from('albums').select('*', { count: 'exact', head: true });
      
      setDbStatus({
        photos: countPhotos || 0,
        comments: countComments || 0,
        albums: countAlbums || 0
      });
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleSaveConfig = (e) => {
    e.preventDefault();
    if (!sbUrl || !sbKey) {
      alert('Supabase URL과 Anon Key를 모두 입력해 주세요.');
      return;
    }
    saveSupabaseCredentials(sbUrl, sbKey);
    setConfigSuccess('연동 정보가 성공적으로 임시 저장되었습니다! 페이지를 다시 불러옵니다...');
  };

  const handleClearConfig = () => {
    if (window.confirm('저장된 Supabase 설정을 지우고 기본값으로 초기화하시겠습니까?')) {
      clearSupabaseCredentials();
    }
  };

  const handleHeroFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setHeroFile(e.target.files[0]);
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Upload landing page background slider image
  const handleUploadHero = async (e) => {
    e.preventDefault();
    if (!heroFile) return;
    setUploadingHero(true);

    try {
      let imageUrl = '';
      
      try {
        const fileExt = heroFile.name.split('.').pop();
        const safeName = `hero-${Date.now()}.${fileExt}`;
        const filePath = `${safeName}`;

        const { error: uploadErr } = await supabase.storage
          .from('gallery')
          .upload(filePath, heroFile, { cacheControl: '3600', upsert: true });

        if (uploadErr) throw uploadErr;

        const { data: { publicUrl } } = supabase.storage
          .from('gallery')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      } catch (_) {
        const base64Data = await convertToBase64(heroFile);
        imageUrl = base64Data;
      }

      const { error } = await supabase
        .from('hero_images')
        .insert({ image_url: imageUrl });

      if (error) throw error;

      confetti({ particleCount: 50, spread: 40 });
      setHeroFile(null);
      fetchAdminData();
    } catch (err) {
      alert('대문 배경 업로드 실패: ' + err.message);
    } finally {
      setUploadingHero(false);
    }
  };

  const handleDeleteHero = async (id) => {
    if (!window.confirm('이 배경 이미지를 대문 슬라이더에서 삭제하시겠습니까?')) return;
    try {
      const { error } = await supabase
        .from('hero_images')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchAdminData();
    } catch (err) {
      alert('삭제 중 오류: ' + err.message);
    }
  };

  // Export Friends List as CSV (Korean UTF-8 Bom support)
  const handleDownloadCSV = () => {
    if (friendsList.length === 0) {
      alert('내려받을 회원 데이터가 없습니다.');
      return;
    }

    // CSV Headers
    const headers = ['이름', '전화번호', '생년월일', '직책', '계정 연동 상태', '설명/소개'];
    
    // CSV Rows
    const rows = friendsList.map(friend => {
      let role = '회원';
      if (friend.is_president && friend.is_treasurer) role = '회장 / 홈피지기';
      else if (friend.is_president) role = '회장';
      else if (friend.is_treasurer) role = '홈피지기';

      return [
        friend.name,
        friend.phone || '',
        friend.birthday || '',
        role,
        friend.auth_id ? '가입 완료' : '미가입',
        (friend.description || '').replace(/\n/g, ' ') // Strip newlines for CSV safety
      ];
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Add UTF-8 BOM for Microsoft Excel Korean support
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    
    // Korean file name
    const koreanFileName = `시월의마지막밤_주소록_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute('download', koreanFileName);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const SQL_SCHEMA = `-- Supabase 테이블 생성용 SQL문
-- SQL Editor에 복사 후 실행하세요.

CREATE TABLE alumni (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  birthday DATE,
  avatar_url TEXT,
  description TEXT,
  is_president BOOLEAN DEFAULT false,
  is_treasurer BOOLEAN DEFAULT false,
  points INT DEFAULT 0, -- 누적 참여 포인트
  last_visited_at DATE DEFAULT CURRENT_DATE, -- 마지막 방문 일자
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  likes_count INT DEFAULT 0,
  views_count INT DEFAULT 0,
  author_id UUID,
  author_name TEXT DEFAULT '익명',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES gallery(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  author_id UUID,
  author_name TEXT DEFAULT '익명',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE album_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID REFERENCES albums(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE hero_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 신규 추가: 소통 게시판 테이블
CREATE TABLE board (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_notice BOOLEAN DEFAULT false,
  author_id UUID REFERENCES alumni(id) ON DELETE SET NULL,
  author_name TEXT DEFAULT '익명',
  views_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 신규 추가: 게시판 댓글 및 대댓글 테이블
CREATE TABLE board_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES board(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES board_comments(id) ON DELETE CASCADE,
  author_id UUID REFERENCES alumni(id) ON DELETE SET NULL,
  author_name TEXT DEFAULT '익명',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 신규 추가: 포인트 이력 로그 테이블
CREATE TABLE point_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumni_id UUID REFERENCES alumni(id) ON DELETE CASCADE,
  points INT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);`;

  return (
    <div className="fade-in" style={{ paddingBottom: '60px' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '35px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ width: '4px', height: '24px', background: 'var(--accent-gradient)', borderRadius: '2px', display: 'inline-block' }} />
          관리자 설정
        </h2>
        <p style={{ color: 'var(--color-secondary)', fontSize: '15px' }}>
          홈페이지 데이터베이스 연동 정보와 관리용 편의 도구를 제공합니다.
        </p>
      </div>

      {/* Admin sub-navigation tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px', marginBottom: '30px', overflowX: 'auto' }}>
        <button
          onClick={() => setActiveSubTab('settings')}
          className="btn"
          style={{
            background: activeSubTab === 'settings' ? 'rgba(255,255,255,0.06)' : 'transparent',
            color: activeSubTab === 'settings' ? 'var(--accent-cyan)' : 'var(--color-secondary)',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '14px',
            minHeight: '38px'
          }}
        >
          <Database size={14} />
          서버 연동
        </button>

        <button
          onClick={() => setActiveSubTab('backgrounds')}
          className="btn"
          style={{
            background: activeSubTab === 'backgrounds' ? 'rgba(255,255,255,0.06)' : 'transparent',
            color: activeSubTab === 'backgrounds' ? 'var(--accent-cyan)' : 'var(--color-secondary)',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '14px',
            minHeight: '38px'
          }}
        >
          <Image size={14} />
          대문 배경 이미지
        </button>

        <button
          onClick={() => setActiveSubTab('members')}
          className="btn"
          style={{
            background: activeSubTab === 'members' ? 'rgba(255,255,255,0.06)' : 'transparent',
            color: activeSubTab === 'members' ? 'var(--accent-cyan)' : 'var(--color-secondary)',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '14px',
            minHeight: '38px'
          }}
        >
          <Users size={14} />
          가입 현황 관리
        </button>

        <button
          onClick={() => setActiveSubTab('sql')}
          className="btn"
          style={{
            background: activeSubTab === 'sql' ? 'rgba(255,255,255,0.06)' : 'transparent',
            color: activeSubTab === 'sql' ? 'var(--accent-cyan)' : 'var(--color-secondary)',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '14px',
            minHeight: '38px'
          }}
        >
          <HelpCircle size={14} />
          SQL 스키마
        </button>
      </div>

      {/* Tab A: Supabase Configuration Settings */}
      {activeSubTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div className="glass" style={{ padding: '30px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Supabase 클라우드 연동 정보
            </h3>
            
            {configSuccess && (
              <div className="alert alert-success">
                <span>{configSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveConfig}>
              <div className="input-group">
                <label className="input-label">Supabase Project URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://your-project-id.supabase.co"
                  className="input-field"
                  value={sbUrl}
                  onChange={(e) => setSbUrl(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Supabase Anon Key</label>
                <input
                  type="password"
                  required
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="input-field"
                  value={sbKey}
                  onChange={(e) => setSbKey(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '25px' }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px' }}>
                  <Save size={16} />
                  저장 및 동기화
                </button>
                <button type="button" onClick={handleClearConfig} className="btn btn-secondary">
                  설정 초기화
                </button>
              </div>
            </form>
          </div>

          {/* Database Info Dashboard */}
          <div className="glass" style={{ padding: '30px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>데이터베이스 현황</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: '13px', color: 'var(--color-secondary)' }}>사진 게시글</span>
                <h4 style={{ fontSize: '28px', fontWeight: '700', marginTop: '8px' }}>{dbStatus.photos}개</h4>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: '13px', color: 'var(--color-secondary)' }}>등록된 댓글</span>
                <h4 style={{ fontSize: '28px', fontWeight: '700', marginTop: '8px' }}>{dbStatus.comments}개</h4>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: '13px', color: 'var(--color-secondary)' }}>테마별 앨범</span>
                <h4 style={{ fontSize: '28px', fontWeight: '700', marginTop: '8px' }}>{dbStatus.albums}개</h4>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab B: Landing Page Custom Background Slider Management */}
      {activeSubTab === 'backgrounds' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div className="glass" style={{ padding: '30px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>새 배경 사진 추가</h3>
            <form onSubmit={handleUploadHero} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div className="input-group" style={{ flex: 1, minWidth: '250px', marginBottom: 0 }}>
                <label className="input-label">가로형 이미지 파일 선택</label>
                <input
                  type="file"
                  required
                  accept="image/*"
                  onChange={handleHeroFileChange}
                  className="input-field"
                  style={{ padding: '8px 12px' }}
                />
              </div>
              <button
                type="submit"
                disabled={uploadingHero || !heroFile}
                className="btn btn-primary"
                style={{ height: '44px', padding: '0 24px' }}
              >
                {uploadingHero ? '업로드 중...' : '배경으로 등록'}
              </button>
            </form>
          </div>

          {/* List of custom backgrounds */}
          <div className="glass" style={{ padding: '30px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>배경 이미지 리스트</h3>
            
            {heroList.length === 0 ? (
              <p style={{ color: 'var(--color-secondary)', fontSize: '14px' }}>
                등록된 사용자 지정 대문 배경 이미지가 없습니다. (기본 이미지 3장이 순환 적용됩니다)
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                {heroList.map((hero) => (
                  <div
                    key={hero.id}
                    style={{
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.08)',
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    <div style={{
                      width: '100%',
                      paddingBottom: '56.25%', // 16:9 ratio
                      backgroundImage: `url(${hero.image_url})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }} />
                    
                    <div style={{ padding: '10px', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>
                        {new Date(hero.created_at).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => handleDeleteHero(hero.id)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--accent-red)', cursor: 'pointer' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab C: Member Signup Progress Tracker & Address Book Download */}
      {activeSubTab === 'members' && (
        <div className="glass" style={{ padding: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '25px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700' }}>회원 가입 현황 및 주소록</h3>
            <button onClick={handleDownloadCSV} className="btn btn-secondary" style={{ padding: '8px 16px', minHeight: '38px', gap: '6px' }}>
              <Download size={14} />
              CSV 주소록 다운로드
            </button>
          </div>

          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '12px 10px', color: 'var(--color-secondary)', fontSize: '14px' }}>이름</th>
                  <th style={{ padding: '12px 10px', color: 'var(--color-secondary)', fontSize: '14px' }}>전화번호</th>
                  <th style={{ padding: '12px 10px', color: 'var(--color-secondary)', fontSize: '14px' }}>생년월일</th>
                  <th style={{ padding: '12px 10px', color: 'var(--color-secondary)', fontSize: '14px' }}>직책</th>
                  <th style={{ padding: '12px 10px', color: 'var(--color-secondary)', fontSize: '14px' }}>가입 상태</th>
                </tr>
              </thead>
              <tbody>
                {friendsList.map((friend) => {
                  let role = '회원';
                  if (friend.is_president && friend.is_treasurer) role = '회장 / 홈피지기';
                  else if (friend.is_president) role = '회장';
                  else if (friend.is_treasurer) role = '홈피지기';

                  return (
                    <tr key={friend.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px 10px', fontSize: '14px', fontWeight: '600' }}>{friend.name}</td>
                      <td style={{ padding: '12px 10px', fontSize: '14px', color: 'var(--color-secondary)' }}>{friend.phone || '-'}</td>
                      <td style={{ padding: '12px 10px', fontSize: '14px', color: 'var(--color-secondary)' }}>{friend.birthday || '-'}</td>
                      <td style={{ padding: '12px 10px', fontSize: '14px' }}>{role}</td>
                      <td style={{ padding: '12px 10px', fontSize: '14px' }}>
                        {friend.auth_id ? (
                          <span style={{ color: 'var(--accent-green)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                            <CheckCircle size={14} />
                            가입 완료
                          </span>
                        ) : (
                          <span style={{ color: 'var(--color-secondary)' }}>미가입 (대기)</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab D: Copyable SQL Schema guide */}
      {activeSubTab === 'sql' && (
        <div className="glass" style={{ padding: '30px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '10px' }}>Supabase SQL 스키마 가이드</h3>
          <p style={{ color: 'var(--color-secondary)', fontSize: '14px', marginBottom: '20px', lineHeight: '1.6' }}>
            Supabase 대시보드의 <strong>SQL Editor</strong>에 아래의 스크립트를 붙여넣고 실행(Run)해 주세요. 
            테이블이 정상적으로 생성이 되어야 데이터를 기록할 수 있습니다.
          </p>

          <pre style={{
            background: 'rgba(0,0,0,0.3)',
            padding: '20px',
            borderRadius: '10px',
            overflowX: 'auto',
            fontSize: '13px',
            lineHeight: '1.5',
            fontFamily: 'monospace',
            color: '#a78bfa',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            {SQL_SCHEMA}
          </pre>
        </div>
      )}
    </div>
  );
}
