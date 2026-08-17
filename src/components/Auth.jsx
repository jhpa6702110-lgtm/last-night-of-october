import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { LogIn, ShieldCheck, User, Sparkles, Crown, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Auth({ onAuthSuccess, onSelectMember }) {
  const [alumniList, setAlumniList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlumniList();
  }, []);

  const fetchAlumniList = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('alumni')
        .select('*')
        .order('is_president', { ascending: false });
      if (data && data.length > 0) {
        setAlumniList(data);
      }
    } catch (err) {
      console.warn('Error fetching alumni list:', err);
    } finally {
      setLoading(false);
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 }
    });
  };

  const handleMemberEntry = (alumnus) => {
    triggerConfetti();
    if (onSelectMember) {
      onSelectMember(alumnus);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 120px)',
      padding: '20px 16px'
    }}>
      <div className="glass fade-in" style={{
        width: '100%',
        maxWidth: '560px',
        padding: '40px 28px',
        borderRadius: '28px',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #06b6d4, #a855f7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            boxShadow: '0 0 25px rgba(6, 182, 212, 0.4)'
          }}>
            <Sparkles size={30} color="#ffffff" />
          </div>

          <h2 style={{ fontSize: '26px', fontWeight: '900', marginBottom: '10px', letterSpacing: '-0.5px' }}>
            🍂 시월의 마지막 밤 — 동창 1초 바로 입장
          </h2>

          <p style={{ color: 'var(--color-secondary)', fontSize: '15px', lineHeight: '1.6', maxWidth: '420px', margin: '0 auto' }}>
            비밀번호 입력 없이 <span style={{ color: 'var(--accent-cyan)', fontWeight: '800' }}>내 이름을 터치</span>하시면<br />
            추억 커뮤니티에 즉시 연결됩니다! 🚀
          </p>
        </div>

        {/* 6 Fixed Alumni Cards Grid */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px'
          }}>
            {alumniList.map((alumnus) => (
              <button
                key={alumnus.id}
                type="button"
                onClick={() => handleMemberEntry(alumnus)}
                className="glass hover-card"
                style={{
                  padding: '16px 14px',
                  borderRadius: '18px',
                  border: alumnus.is_president ? '2px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: alumnus.is_president 
                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(15, 23, 42, 0.8))'
                    : 'rgba(255, 255, 255, 0.04)',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  textAlign: 'center',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: alumnus.is_president ? '0 4px 20px rgba(245, 158, 11, 0.2)' : 'none'
                }}
              >
                {/* Avatar */}
                <div style={{ position: 'relative' }}>
                  <img
                    src={alumnus.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${alumnus.name}`}
                    alt={alumnus.name}
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid rgba(255, 255, 255, 0.2)'
                    }}
                  />
                  {alumnus.is_president && (
                    <div style={{
                      position: 'absolute',
                      bottom: '-4px',
                      right: '-4px',
                      background: '#f59e0b',
                      color: 'white',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.5)'
                    }}>
                      <Crown size={11} fill="white" />
                    </div>
                  )}
                </div>

                {/* Name & Title */}
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                    {alumnus.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--accent-cyan)', marginTop: '2px', fontWeight: '600' }}>
                    {alumnus.is_president ? '👑 동창회장' : '★ 동문 회원'}
                  </div>
                </div>

                {/* Action Badge */}
                <div style={{
                  fontSize: '12px',
                  fontWeight: '800',
                  color: 'white',
                  background: 'linear-gradient(135deg, #06b6d4, #10b981)',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  width: '100%',
                  marginTop: '4px',
                  boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)'
                }}>
                  1초 바로 입장 ▶️
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Security Info Footnote */}
        <div style={{
          textAlign: 'center',
          padding: '12px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          fontSize: '12px',
          color: 'var(--color-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}>
          <ShieldCheck size={16} color="var(--accent-green)" />
          <span>지정 6인 동창 전용 무비밀번호 1초 원클릭 시스템</span>
        </div>
      </div>
    </div>
  );
}
