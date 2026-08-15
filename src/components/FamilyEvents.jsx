import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Cake, Heart, Calendar, MapPin, CreditCard, Share2, Plus, Sparkles, Copy, Check, MessageCircle, AlertCircle, X, Gift, Phone } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function FamilyEvents({ session, alumniProfile, setActiveTab }) {
  const [activeTab, setActiveSubTab] = useState('birthday'); // 'birthday', 'events'
  const [friends, setFriends] = useState([]);
  const [familyEvents, setFamilyEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  // New Event Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [formCategory, setFormCategory] = useState('wedding'); // 'wedding', 'funeral', 'party', 'other'
  const [formTitle, setFormTitle] = useState('');
  const [formAlumniName, setFormAlumniName] = useState(alumniProfile?.name || '');
  const [formEventDate, setFormEventDate] = useState('');
  const [formEventTime, setFormEventTime] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formBank, setFormBank] = useState('');
  const [formAccountNum, setFormAccountNum] = useState('');
  const [formAccountHolder, setFormAccountHolder] = useState(alumniProfile?.name || '');
  const [formContent, setFormContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Quick Wish State
  const [wishTarget, setWishTarget] = useState(null);
  const [wishMessage, setWishMessage] = useState('생일 축하해! 늘 건강하고 행복하자 🎂🎉');

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Alumni Profiles for Birthdays
      const { data: alumniData, error: alumniErr } = await supabase
        .from('alumni')
        .select('*');

      if (!alumniErr && alumniData) {
        setFriends(alumniData);
      }

      // 2. Fetch Family Events
      const { data: eventData, error: eventErr } = await supabase
        .from('family_events')
        .select('*')
        .order('event_date', { ascending: true });

      if (!eventErr && eventData) {
        setFamilyEvents(eventData);
      } else {
        // Fallback sample data if table not created in database yet
        setFamilyEvents([
          {
            id: 'sample-1',
            category: 'wedding',
            title: '김철수 동문 장녀 화목한 결혼식',
            alumni_name: '김철수',
            event_date: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10),
            event_time: '오후 12:30',
            location: '그랜드 힐스턴 컨벤션 3층 그랜드홀',
            address: '전북 전주시 완산구 온고을로 203',
            account_bank: '농협',
            account_number: '356-0123-4567-89',
            account_holder: '김철수',
            content: '사랑하는 저희 장녀의 새로운 출발을 축하해 주시면 더없는 기쁨이 되겠습니다.',
            created_at: new Date().toISOString()
          },
          {
            id: 'sample-2',
            category: 'funeral',
            title: '이영희 동문 모친상 부고 안내',
            alumni_name: '이영희',
            event_date: new Date().toISOString().slice(0, 10),
            event_time: '발인 8월 17일 오전 08:00',
            location: '전북대학교병원 장례식장 2호실',
            address: '전북 전주시 덕진구 건지로 20',
            account_bank: '카카오뱅크',
            account_number: '3333-01-9876543',
            account_holder: '이영희',
            content: '슬픔에 잠긴 이영희 동문과 가족분들께 따뜻한 위로와 조의를 부탁드립니다.',
            created_at: new Date().toISOString()
          }
        ]);
      }
    } catch (err) {
      console.error('Error fetching family events data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper: Calculate Birthday Info
  const currentMonth = new Date().getMonth() + 1;
  const todayStr = new Date().toISOString().slice(5, 10); // MM-DD

  const birthdayFriends = friends
    .filter(f => f.birthday)
    .map(f => {
      const bDate = new Date(f.birthday);
      const bMonth = bDate.getMonth() + 1;
      const bDay = bDate.getDate();
      const mmdd = `${String(bMonth).padStart(2, '0')}-${String(bDay).padStart(2, '0')}`;
      const isToday = mmdd === todayStr;
      const isThisMonth = bMonth === currentMonth;

      return {
        ...f,
        bMonth,
        bDay,
        mmdd,
        isToday,
        isThisMonth
      };
    })
    .filter(f => f.isThisMonth)
    .sort((a, b) => a.bDay - b.bDay);

  const handleCopyText = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendWish = async () => {
    if (!wishTarget || !wishMessage.trim()) return;

    try {
      // Create a congratulatory post in the board table
      const { error } = await supabase
        .from('board')
        .insert({
          title: `🎂 [생일 축하] ${wishTarget.name} 동문의 생일을 축하합니다!`,
          content: `${wishTarget.name} 동문님!\n\n${wishMessage}\n\n- ${alumniProfile?.name || '동문'} 올림`,
          author_id: alumniProfile?.id || null,
          author_name: alumniProfile?.name || '동문'
        });

      if (error) throw error;

      triggerConfetti();
      alert(`🎉 ${wishTarget.name} 동문에게 생일 축하 메시지가 전달되었습니다!`);
      setWishTarget(null);
    } catch (err) {
      console.error('Error sending wish:', err);
      alert('축하 메시지 전달 중 오류가 발생했습니다.');
    }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!formTitle || !formEventDate || !formLocation) {
      alert('제목, 일시, 장소를 모두 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const newEventData = {
        category: formCategory,
        title: formTitle,
        alumni_name: formAlumniName || alumniProfile?.name || '동문',
        event_date: formEventDate,
        event_time: formEventTime,
        location: formLocation,
        address: formAddress,
        account_bank: formBank,
        account_number: formAccountNum,
        account_holder: formAccountHolder,
        content: formContent,
        author_id: alumniProfile?.id || null
      };

      const { data, error } = await supabase
        .from('family_events')
        .insert(newEventData)
        .select()
        .single();

      if (error) {
        console.warn('DB insert fallback:', error.message);
        // Fallback local insert
        setFamilyEvents(prev => [{ ...newEventData, id: 'temp-' + Date.now() }, ...prev]);
      } else if (data) {
        setFamilyEvents(prev => [data, ...prev]);
      }

      triggerConfetti();
      setShowAddModal(false);
      // Reset form
      setFormTitle('');
      setFormLocation('');
      setFormAddress('');
      setFormContent('');
      alert('경조사 소식이 정상적으로 등록되었습니다!');
    } catch (err) {
      console.error('Error adding event:', err);
      alert('등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'wedding':
        return { label: '💒 결혼소식', bg: 'rgba(236, 72, 153, 0.15)', color: '#f43f5e', border: 'rgba(244, 63, 94, 0.3)' };
      case 'funeral':
        return { label: '🖤 부고소식', bg: 'rgba(100, 116, 139, 0.2)', color: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' };
      case 'party':
        return { label: '🎂 환갑/칠순/잔치', bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' };
      default:
        return { label: '🎉 경조사 안내', bg: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', border: 'rgba(6, 182, 212, 0.3)' };
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '10px 16px 80px 16px' }} className="fade-in">
      
      {/* Header Banner */}
      <div className="glass" style={{
        padding: '28px 24px',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.12), rgba(6, 182, 212, 0.12))',
        border: '1px solid rgba(236, 72, 153, 0.25)',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(236, 72, 153, 0.2)', color: '#f43f5e', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', marginBottom: '10px' }}>
            <Cake size={14} /> 동문 소식 아지트
          </div>
          <h2 style={{ fontSize: 'clamp(22px, 5vw, 32px)', fontWeight: '800', color: 'white', margin: 0, letterSpacing: '-0.5px' }}>
            🎂 생일 & 🌹 경조사 알림판
          </h2>
          <p style={{ color: 'var(--color-secondary)', fontSize: '15px', marginTop: '6px', margin: 0 }}>
            친구들의 기쁜 일과 슬픈 일을 함께 나누며 따뜻한 온기를 전하세요.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          style={{
            background: 'linear-gradient(135deg, #f43f5e, #ec4899)',
            color: 'white',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 15px rgba(244, 63, 94, 0.35)',
            minHeight: '44px'
          }}
        >
          <Plus size={18} /> 경조사 소식 등록
        </button>
      </div>

      {/* Main Sub Tabs */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '24px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        paddingBottom: '12px'
      }}>
        <button
          onClick={() => setActiveSubTab('birthday')}
          style={{
            padding: '12px 20px',
            borderRadius: '12px',
            border: activeTab === 'birthday' ? '1px solid #f43f5e' : '1px solid rgba(255, 255, 255, 0.08)',
            background: activeTab === 'birthday' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(255, 255, 255, 0.03)',
            color: activeTab === 'birthday' ? '#f43f5e' : 'var(--color-secondary)',
            fontWeight: '700',
            fontSize: '15px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Cake size={18} />
          이번 달 생일 친구들 ({birthdayFriends.length}명)
        </button>

        <button
          onClick={() => setActiveSubTab('events')}
          style={{
            padding: '12px 20px',
            borderRadius: '12px',
            border: activeTab === 'events' ? '1px solid #06b6d4' : '1px solid rgba(255, 255, 255, 0.08)',
            background: activeTab === 'events' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.03)',
            color: activeTab === 'events' ? '#06b6d4' : 'var(--color-secondary)',
            fontWeight: '700',
            fontSize: '15px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Heart size={18} />
          동문 경조사 소식 ({familyEvents.length}건)
        </button>
      </div>

      {/* TAB 1: BIRTHDAY FRIENDS */}
      {activeTab === 'birthday' && (
        <div>
          {birthdayFriends.length === 0 ? (
            <div className="glass" style={{ padding: '50px 20px', textAlign: 'center', borderRadius: '20px' }}>
              <Cake size={48} color="#94a3b8" style={{ marginBottom: '12px', opacity: 0.5 }} />
              <h3 style={{ fontSize: '18px', color: 'white', margin: 0 }}>이번 달({currentMonth}월)에 생일인 동문이 없습니다.</h3>
              <p style={{ fontSize: '14px', color: 'var(--color-secondary)', marginTop: '6px' }}>
                [친구들] 메뉴에서 생일을 등록하면 축하 알림판에 자동으로 표시됩니다.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
              {birthdayFriends.map((friend) => (
                <div 
                  key={friend.id} 
                  className="glass"
                  style={{
                    padding: '20px',
                    borderRadius: '20px',
                    border: friend.isToday ? '2px solid #f43f5e' : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: friend.isToday ? '0 0 20px rgba(244, 63, 94, 0.3)' : 'none',
                    background: friend.isToday ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.15), rgba(15, 23, 42, 0.8))' : 'rgba(15, 23, 42, 0.6)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {friend.isToday && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: '#f43f5e',
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: '800',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 2px 8px rgba(244, 63, 94, 0.5)'
                    }}>
                      <Sparkles size={12} /> TODAY 생일!
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                    {/* Avatar */}
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      backgroundImage: friend.avatar_url ? `url(${friend.avatar_url})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                      fontWeight: '800',
                      color: 'white',
                      border: '2px solid rgba(255, 255, 255, 0.15)'
                    }}>
                      {!friend.avatar_url && friend.name.slice(0, 1)}
                    </div>

                    <div>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {friend.name}
                        {friend.is_president && <span style={{ fontSize: '10px', background: 'gold', color: 'black', padding: '1px 6px', borderRadius: '4px', fontWeight: '800' }}>회장</span>}
                      </div>
                      <div style={{ fontSize: '13px', color: '#f43f5e', fontWeight: '700', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={13} /> {friend.bMonth}월 {friend.bDay}일 생일
                      </div>
                      {friend.phone && (
                        <div style={{ fontSize: '12px', color: 'var(--color-secondary)', marginTop: '2px' }}>
                          📞 {friend.phone}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Wish Action Button */}
                  <button
                    onClick={() => {
                      triggerConfetti();
                      setWishTarget(friend);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '12px',
                      border: 'none',
                      background: friend.isToday ? 'linear-gradient(135deg, #f43f5e, #ec4899)' : 'rgba(255, 255, 255, 0.08)',
                      color: 'white',
                      fontWeight: '700',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      minHeight: '44px'
                    }}
                  >
                    <Gift size={16} /> 생일 축하 메시지 보내기
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FAMILY EVENTS */}
      {activeTab === 'events' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {familyEvents.map((event) => {
            const badge = getCategoryBadge(event.category);
            return (
              <div 
                key={event.id}
                className="glass"
                style={{
                  padding: '24px',
                  borderRadius: '20px',
                  border: `1px solid ${badge.border}`,
                  background: 'rgba(15, 23, 42, 0.7)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      background: badge.bg,
                      color: badge.color,
                      border: `1px solid ${badge.border}`,
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '800'
                    }}>
                      {badge.label}
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--color-secondary)' }}>
                      작성자: {event.alumni_name} 동문
                    </span>
                  </div>

                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                    {new Date(event.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>

                {/* Title */}
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'white', margin: 0 }}>
                  {event.title}
                </h3>

                {/* Content */}
                {event.content && (
                  <p style={{ fontSize: '15px', color: '#e2e8f0', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-line' }}>
                    {event.content}
                  </p>
                )}

                {/* Info Grid (Date, Location, Account) */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '16px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}>
                  {/* Event Date & Time */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <Calendar size={18} color="#06b6d4" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>일시</div>
                      <div style={{ fontSize: '14px', color: 'white', fontWeight: '700', marginTop: '2px' }}>
                        {event.event_date} {event.event_time && `(${event.event_time})`}
                      </div>
                    </div>
                  </div>

                  {/* Location & Map */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <MapPin size={18} color="#a855f7" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>장소</div>
                      <div style={{ fontSize: '14px', color: 'white', fontWeight: '700', marginTop: '2px' }}>
                        {event.location}
                      </div>
                      {event.address && (
                        <div style={{ fontSize: '12px', color: 'var(--color-secondary)', marginTop: '2px' }}>
                          {event.address}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Account Info */}
                  {event.account_number && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <CreditCard size={18} color="#f59e0b" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>마음 전하실 곳 (계좌)</div>
                        <div style={{ fontSize: '14px', color: '#fef3c7', fontWeight: '700', marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                          <span>{event.account_bank} {event.account_number} ({event.account_holder})</span>
                          
                          <button
                            onClick={() => handleCopyText(`${event.account_bank} ${event.account_number} ${event.account_holder}`, event.id)}
                            style={{
                              background: copiedId === event.id ? '#10b981' : 'rgba(245, 158, 11, 0.2)',
                              color: copiedId === event.id ? 'white' : '#f59e0b',
                              border: '1px solid rgba(245, 158, 11, 0.4)',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            {copiedId === event.id ? <Check size={12} /> : <Copy size={12} />}
                            {copiedId === event.id ? '복사됨!' : '계좌 복사'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {event.address && (
                    <button
                      onClick={() => {
                        window.open(`https://map.kakao.com/?q=${encodeURIComponent(event.address || event.location)}`, '_blank');
                      }}
                      className="btn btn-secondary"
                      style={{ padding: '8px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <MapPin size={14} /> 지도 길안내
                    </button>
                  )}

                  <button
                    onClick={() => {
                      const shareText = `[시월의 마지막 밤 경조사 안내]\n\n제목: ${event.title}\n일시: ${event.event_date} ${event.event_time || ''}\n장소: ${event.location}\n계좌: ${event.account_bank || ''} ${event.account_number || ''}`;
                      navigator.clipboard.writeText(shareText);
                      alert('카카오톡/문자 공유용 메시지가 복사되었습니다!');
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '8px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Share2 size={14} /> 소식 공유하기 복사
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: ADD EVENT MODAL */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
        onClick={() => setShowAddModal(false)}
        >
          <div 
            style={{
              width: '100%',
              maxWidth: '550px',
              backgroundColor: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '20px',
              padding: '24px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={20} color="#f43f5e" /> 새 경조사 소식 등록
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddEvent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '700' }}>경조사 구분</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {[
                    { id: 'wedding', label: '💒 결혼' },
                    { id: 'funeral', label: '🖤 부고' },
                    { id: 'party', label: '🎂 잔치' },
                    { id: 'other', label: '🎉 기타' }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFormCategory(item.id)}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: formCategory === item.id ? '2px solid #f43f5e' : '1px solid rgba(255, 255, 255, 0.1)',
                        background: formCategory === item.id ? 'rgba(244, 63, 94, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                        color: 'white',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '700' }}>소식 제목</label>
                <input
                  type="text"
                  placeholder="예: 김철수 동문 장녀 결혼식 안내"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '14px' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '700' }}>행사 날짜</label>
                  <input
                    type="date"
                    value={formEventDate}
                    onChange={(e) => setFormEventDate(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '14px' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '700' }}>시간 안내</label>
                  <input
                    type="text"
                    placeholder="예: 오후 12:30 / 발인 8시"
                    value={formEventTime}
                    onChange={(e) => setFormEventTime(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '700' }}>장소 (예식장/장례식장 이름)</label>
                <input
                  type="text"
                  placeholder="예: 그랜드 힐스턴 컨벤션 3층"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '14px' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '700' }}>도로명 주소 (지도시 활용)</label>
                <input
                  type="text"
                  placeholder="예: 전북 전주시 완산구 온고을로 203"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '14px' }}
                />
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <label style={{ fontSize: '13px', color: '#f59e0b', display: 'block', marginBottom: '8px', fontWeight: '700' }}>💳 계좌 정보 (선택)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="은행 (농협/카카오)"
                    value={formBank}
                    onChange={(e) => setFormBank(e.target.value)}
                    style={{ padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '13px' }}
                  />
                  <input
                    type="text"
                    placeholder="계좌번호"
                    value={formAccountNum}
                    onChange={(e) => setFormAccountNum(e.target.value)}
                    style={{ padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '13px' }}
                  />
                  <input
                    type="text"
                    placeholder="예금주"
                    value={formAccountHolder}
                    onChange={(e) => setFormAccountHolder(e.target.value)}
                    style={{ padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '700' }}>상세 안내글</label>
                <textarea
                  rows="3"
                  placeholder="동문들에게전하고 싶은 인사말이나 상세 내용을 작성해 주세요."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '14px', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: '700', cursor: 'pointer' }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ flex: 2, padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #f43f5e, #ec4899)', color: 'white', fontWeight: '700', cursor: 'pointer' }}
                >
                  {submitting ? '등록 중...' : '경조사 등록하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BIRTHDAY WISH MODAL */}
      {wishTarget && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
        onClick={() => setWishTarget(null)}
        >
          <div 
            style={{
              width: '100%',
              maxWidth: '450px',
              backgroundColor: '#0f172a',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(244, 63, 94, 0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <Cake size={40} color="#f43f5e" style={{ marginBottom: '8px' }} />
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'white', margin: 0 }}>
                🎂 {wishTarget.name} 동문 생일 축하하기
              </h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
                축하 메시지를 남기시면 소통 게시판에 자동으로 전달됩니다.
              </p>
            </div>

            <textarea
              rows="3"
              value={wishMessage}
              onChange={(e) => setWishMessage(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(0, 0, 0, 0.4)',
                color: 'white',
                fontSize: '14px',
                resize: 'none',
                marginBottom: '16px'
              }}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setWishTarget(null)}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: '700', cursor: 'pointer' }}
              >
                취소
              </button>
              <button
                onClick={handleSendWish}
                style={{ flex: 2, padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #f43f5e, #ec4899)', color: 'white', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Sparkles size={16} /> 축하 전송하기
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
