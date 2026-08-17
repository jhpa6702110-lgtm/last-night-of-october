import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Trophy, Crown, Award, Star, Flame, Heart, Sparkles, Medal, User, MessageSquare, Image, Calendar, ChevronRight, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { shareContent } from '../utils/kakaoShare';

export default function HallOfFame({ session, alumniProfile, setActiveTab }) {
  const [activeTab, setActiveSubTab] = useState('total'); // 'total', 'attendance', 'communication'
  const [alumniList, setAlumniList] = useState([]);
  const [boardCountMap, setBoardCountMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [cheerCounts, setCheerCounts] = useState({});

  const triggerConfetti = () => {
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 }
    });
  };

  useEffect(() => {
    fetchHallOfFameData();
  }, []);

  const fetchHallOfFameData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Alumni Data
      const { data: alumniData, error: alumniErr } = await supabase
        .from('alumni')
        .select('*');

      if (!alumniErr && alumniData) {
        setAlumniList(alumniData);
      }

      // 2. Fetch Board Posts for Communication King calculation
      const { data: boardData } = await supabase
        .from('board')
        .select('author_name, author_id');

      if (boardData) {
        const counts = {};
        boardData.forEach(b => {
          const key = b.author_id || b.author_name;
          if (key) {
            counts[key] = (counts[key] || 0) + 1;
          }
        });
        setBoardCountMap(counts);
      }
    } catch (err) {
      console.error('Error fetching Hall of Fame data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheer = (alumniId, name) => {
    triggerConfetti();
    setCheerCounts(prev => ({
      ...prev,
      [alumniId]: (prev[alumniId] || 0) + 1
    }));
  };

  // 1. Total Points Ranking (종합 활동왕)
  const totalRankers = [...alumniList].sort((a, b) => (b.points || 0) - (a.points || 0));

  // 2. Attendance Ranking (이달의 출석왕) - sorted by points and last_visited_at
  const attendanceRankers = [...alumniList].sort((a, b) => {
    const pA = a.points || 0;
    const pB = b.points || 0;
    if (pB !== pA) return pB - pA;
    return (b.last_visited_at || '').localeCompare(a.last_visited_at || '');
  });

  // 3. Communication Ranking (소통왕) - sorted by post count + points
  const communicationRankers = [...alumniList].sort((a, b) => {
    const countA = boardCountMap[a.id] || boardCountMap[a.name] || 0;
    const countB = boardCountMap[b.id] || boardCountMap[b.name] || 0;
    if (countB !== countA) return countB - countA;
    return (b.points || 0) - (a.points || 0);
  });

  const getCurrentRankers = () => {
    if (activeTab === 'attendance') return attendanceRankers;
    if (activeTab === 'communication') return communicationRankers;
    return totalRankers;
  };

  const currentRankers = getCurrentRankers();
  const top3 = currentRankers.slice(0, 3);
  const restRankers = currentRankers.slice(3);

  // Podium Positions Order: [2nd (Left), 1st (Center), 3rd (Right)]
  const podiumData = [
    { rank: 2, data: top3[1], color: '#94a3b8', height: '180px', badge: '🥈 2위 챔피언', scale: 'scale(0.95)' },
    { rank: 1, data: top3[0], color: '#f59e0b', height: '220px', badge: '👑 1위 M.V.P', scale: 'scale(1.05)' },
    { rank: 3, data: top3[2], color: '#b45309', height: '160px', badge: '🥉 3위 챔피언', scale: 'scale(0.9)' }
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '10px 16px 80px 16px' }} className="fade-in">
      
      {/* Hall of Fame Hero Header */}
      <div className="glass" style={{
        padding: '32px 24px',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(168, 85, 247, 0.15))',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        marginBottom: '30px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(245, 158, 11, 0.2)',
          color: '#fbbf24',
          padding: '6px 16px',
          borderRadius: '20px',
          fontSize: '13px',
          fontWeight: '800',
          marginBottom: '12px'
        }}>
          <Trophy size={16} /> 명예의 전당 (HALL OF FAME)
        </div>
        <h2 style={{ fontSize: 'clamp(26px, 6vw, 38px)', fontWeight: '900', color: 'white', margin: 0, letterSpacing: '-0.5px' }}>
          👑 이달의 출석왕 & 명예의 전당
        </h2>
        <p style={{ color: 'var(--color-secondary)', fontSize: '16px', marginTop: '8px', maxWidth: '600px', margin: '8px auto 0 auto' }}>
          소중한 추억과 우정을 가꾸어 나가는 명예로운 동문 챔피언들을 소개합니다!
        </p>
      </div>

      {/* Sub Tabs */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '10px',
        marginBottom: '30px',
        flexWrap: 'wrap'
      }}>
        {[
          { id: 'total', label: '👑 종합 참여왕 (XP 순위)', icon: Crown, color: '#f59e0b' },
          { id: 'attendance', label: '📅 이달의 출석왕', icon: Calendar, color: '#06b6d4' },
          { id: 'communication', label: '💬 소통 & 댓글왕', icon: MessageSquare, color: '#a855f7' }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              style={{
                padding: '12px 22px',
                borderRadius: '14px',
                border: isActive ? `2px solid ${tab.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                background: isActive ? `${tab.color}25` : 'rgba(255, 255, 255, 0.03)',
                color: isActive ? tab.color : 'var(--color-secondary)',
                fontWeight: '800',
                fontSize: '15px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: isActive ? `0 0 15px ${tab.color}40` : 'none',
                transition: 'all 0.2s'
              }}>
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* KakaoTalk Ranking Share Button */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
        <button
          className="share-btn-kakao"
          style={{ padding: '10px 20px', fontSize: '14px' }}
          onClick={() => shareContent({
            title: '👑 10월의 마지막 밤 - 이달의 명예의 전당',
            text: '우리 친구들의 열정 활동 랭킹과 우정 포인트를 확인해 보세요!',
            url: window.location.href
          })}
        >
          <Share2 size={16} /> 카톡으로 랭킹 공유하기
        </button>
      </div>

      {/* TOP 3 PODIUM SECTION */}
      {top3.length > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          gap: '16px',
          marginBottom: '50px',
          paddingTop: '40px',
          flexWrap: 'wrap'
        }}>
          {podiumData.map(p => {
            const alumnus = p.data;
            if (!alumnus) return null;

            const is1st = p.rank === 1;
            const cheerCount = cheerCounts[alumnus.id] || 0;

            return (
              <div
                key={alumnus.id || p.rank}
                className="glass hover-card fade-in"
                style={{
                  width: '280px',
                  borderRadius: '24px',
                  border: `2px solid ${p.color}`,
                  background: is1st 
                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(15, 23, 42, 0.9))'
                    : 'rgba(15, 23, 42, 0.7)',
                  boxShadow: is1st ? '0 0 30px rgba(245, 158, 11, 0.4)' : 'none',
                  padding: '24px 16px 20px 16px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  position: 'relative',
                  transform: is1st ? 'translateY(-15px)' : 'none'
                }}
              >
                {/* Crown Header Icon for 1st Place */}
                {is1st && (
                  <div style={{
                    position: 'absolute',
                    top: '-24px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontWeight: '900',
                    fontSize: '13px',
                    boxShadow: '0 4px 15px rgba(245, 158, 11, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Crown size={18} fill="white" /> 1위 M.V.P
                  </div>
                )}

                {!is1st && (
                  <div style={{
                    position: 'absolute',
                    top: '-16px',
                    background: p.color,
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '14px',
                    fontWeight: '800',
                    fontSize: '12px'
                  }}>
                    {p.badge}
                  </div>
                )}

                {/* Avatar with Glow */}
                <div style={{
                  width: is1st ? '90px' : '76px',
                  height: is1st ? '90px' : '76px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backgroundImage: alumnus.avatar_url ? `url(${alumnus.avatar_url})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  fontWeight: '900',
                  color: 'white',
                  border: `3px solid ${p.color}`,
                  boxShadow: `0 0 20px ${p.color}60`,
                  marginTop: is1st ? '10px' : '8px',
                  marginBottom: '14px'
                }}>
                  {!alumnus.avatar_url && (alumnus.name || '동문').slice(0, 1)}
                </div>

                {/* Name */}
                <div style={{ fontSize: is1st ? '22px' : '18px', fontWeight: '800', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {alumnus.name}
                  {alumnus.is_president && <span style={{ fontSize: '10px', background: 'gold', color: 'black', padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>회장</span>}
                </div>

                {/* Points / Badges */}
                <div style={{ fontSize: '14px', color: p.color, fontWeight: '800', marginTop: '6px' }}>
                  ★ {alumnus.points || 0} XP 활동 포인트
                </div>

                {alumnus.description && (
                  <p style={{ fontSize: '12px', color: 'var(--color-secondary)', margin: '8px 0 14px 0', lineClamp: 2, WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    "{alumnus.description}"
                  </p>
                )}

                {/* Cheer Button */}
                <button
                  onClick={() => handleCheer(alumnus.id, alumnus.name)}
                  style={{
                    marginTop: '12px',
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    border: `1px solid ${p.color}60`,
                    background: `${p.color}15`,
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                >
                  <Heart size={14} fill="#f43f5e" color="#f43f5e" />
                  응원하기 {cheerCount > 0 && `(${cheerCount})`}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* FULL RANKING LIST TABLE */}
      <div className="glass" style={{
        padding: '24px',
        borderRadius: '20px',
        background: 'rgba(15, 23, 42, 0.7)'
      }}>
        <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'white', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Medal size={20} color="#06b6d4" /> 전체 동문 랭킹 순위표
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {currentRankers.map((alumnus, idx) => {
            const rank = idx + 1;
            const isTop3 = rank <= 3;
            const rankBadgeColor = rank === 1 ? '#f59e0b' : rank === 2 ? '#94a3b8' : rank === 3 ? '#b45309' : 'rgba(255, 255, 255, 0.2)';

            return (
              <div
                key={alumnus.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  borderRadius: '14px',
                  background: isTop3 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                  border: isTop3 ? `1px solid ${rankBadgeColor}40` : '1px solid rgba(255, 255, 255, 0.04)',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {/* Rank Badge */}
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    background: rankBadgeColor,
                    color: rank <= 3 ? 'black' : 'white',
                    fontSize: '15px',
                    fontWeight: '900',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {rank}
                  </div>

                  {/* Avatar */}
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backgroundImage: alumnus.avatar_url ? `url(${alumnus.avatar_url})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: '800',
                    color: 'white',
                    flexShrink: 0
                  }}>
                    {!alumnus.avatar_url && (alumnus.name || '동문').slice(0, 1)}
                  </div>

                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {alumnus.name}
                      {alumnus.is_president && <span style={{ fontSize: '10px', background: 'gold', color: 'black', padding: '1px 5px', borderRadius: '4px', fontWeight: '800' }}>회장</span>}
                      {alumnus.is_treasurer && <span style={{ fontSize: '10px', background: '#06b6d4', color: 'white', padding: '1px 5px', borderRadius: '4px', fontWeight: '800' }}>총무</span>}
                    </div>
                    {alumnus.last_visited_at && (
                      <div style={{ fontSize: '12px', color: 'var(--color-secondary)', marginTop: '2px' }}>
                        최근 방문: {alumnus.last_visited_at}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: '#06b6d4' }}>
                      {alumnus.points || 0} XP
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>
                      누적 활동 참여도
                    </div>
                  </div>

                  <button
                    onClick={() => handleCheer(alumnus.id, alumnus.name)}
                    style={{
                      background: 'rgba(244, 63, 94, 0.15)',
                      border: '1px solid rgba(244, 63, 94, 0.3)',
                      color: '#f43f5e',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Heart size={12} fill="#f43f5e" /> 응원
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
