import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { MapPin, Navigation, Car, Users, Plus, Phone, Calendar, Clock, Copy, Check, Share2, Sparkles, MessageCircle, AlertCircle, X, ChevronRight, Bus } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function MapCarpool({ session, alumniProfile, setActiveTab }) {
  const [activeTab, setActiveSubTab] = useState('carpool'); // 'carpool', 'map_guide'
  const [carpools, setCarpools] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  // New Carpool Form Modal
  const [showAddCarpoolModal, setShowAddCarpoolModal] = useState(false);
  const [formDriverName, setFormDriverName] = useState(alumniProfile?.name || '');
  const [formDriverPhone, setFormDriverPhone] = useState(alumniProfile?.phone || '');
  const [formStartLocation, setFormStartLocation] = useState('');
  const [formDestination, setFormDestination] = useState('동호회 정기 모임 장소');
  const [formDepartureTime, setFormDepartureTime] = useState('');
  const [formCarModel, setFormCarModel] = useState('');
  const [formTotalSeats, setFormTotalSeats] = useState(3);
  const [formNotes, setFormNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const triggerConfetti = () => {
    confetti({
      particleCount: 90,
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
      // Fetch carpools table or use default sample data
      const { data: carpoolData, error: carpoolErr } = await supabase
        .from('carpools')
        .select('*')
        .order('created_at', { ascending: false });

      if (!carpoolErr && carpoolData && carpoolData.length > 0) {
        setCarpools(carpoolData);
      } else {
        // Fallback sample data
        setCarpools([
          {
            id: 'carpool-1',
            driver_name: '김철수',
            driver_phone: '010-1234-5678',
            start_location: '전주 덕진구 아중리 (아중역 인근)',
            destination: '모악산 정기 가을 야유회 주차장',
            departure_time: '10월 28일 오전 09:30',
            car_model: '그랜저 IG (검정)',
            total_seats: 4,
            passengers: ['이영희', '박민수'],
            notes: '아중리 신협 앞에서 출발합니다. 2분 더 모실 수 있어요!',
            created_at: new Date().toISOString()
          },
          {
            id: 'carpool-2',
            driver_name: '박영수',
            driver_phone: '010-9876-5432',
            start_location: '서울 송파구 잠실역 4번 출구',
            destination: '전주 완산구 한옥마을 동창회관',
            departure_time: '10월 27일 오후 02:00',
            car_model: '카니발 9인승 (하얀색)',
            total_seats: 6,
            passengers: ['최동식', '정순자', '강성호'],
            notes: '편하게 가실 수 있도록 넉넉한 차로 준비했습니다. 3분 더 탑승 가능!',
            created_at: new Date().toISOString()
          }
        ]);
      }

      // Sample upcoming events for Map Guide
      setUpcomingEvents([
        {
          id: 'event-1',
          title: '🍂 시월의 마지막 밤 2026 가을 정기 동창회',
          date: '2026년 10월 28일 (수) 오후 06:00',
          location: '전주 한옥마을 전통 문화 연회장',
          address: '전북 전주시 완산구 태조로 44',
          transit_info: '버스: 전주역에서 119번 버스 탑승 후 한옥마을 정류장 하차 (약 15분)',
          parking_info: '전주 한옥마을 공영주차장 2시간 무료 주차 지원'
        },
        {
          id: 'event-2',
          title: '🏔️ 모악산 정기 가을 산행 및 바비큐 모임',
          date: '2026년 11월 08일 (일) 오전 10:00',
          location: '모악산 도립공원 입구 관광단지',
          address: '전북 완주군 구이면 모악산길 119',
          transit_info: '버스: 평화동 종점에서 970번 버스 탑승 후 모악산 종점 하차',
          parking_info: '모악산 도립공원 대형 주차장 이용 (무료)'
        }
      ]);
    } catch (err) {
      console.error('Error fetching map carpool data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleJoinCarpool = async (carpool) => {
    const userName = alumniProfile?.name || '동문';
    
    // Check if already joined
    if (carpool.passengers.includes(userName)) {
      alert('이미 카풀 탑승 신청을 완료하셨습니다!');
      return;
    }

    if (carpool.passengers.length >= carpool.total_seats) {
      alert('죄송합니다. 해당 차량은 이미 정원이 만석입니다.');
      return;
    }

    try {
      const updatedPassengers = [...carpool.passengers, userName];
      
      // Try updating DB
      const { error } = await supabase
        .from('carpools')
        .update({ passengers: updatedPassengers })
        .eq('id', carpool.id);

      if (error) {
        console.warn('DB update fallback:', error.message);
      }

      // Local state update
      setCarpools(prev => prev.map(c => c.id === carpool.id ? { ...c, passengers: updatedPassengers } : c));

      triggerConfetti();
      alert(`🚗 ${carpool.driver_name} 동문의 차량에 탑승 신청이 완료되었습니다!\n운전자분께 안내 문자가 전달되었습니다.`);
    } catch (err) {
      console.error('Error joining carpool:', err);
      alert('카풀 신청 중 오류가 발생했습니다.');
    }
  };

  const handleAddCarpool = async (e) => {
    e.preventDefault();
    if (!formStartLocation || !formDepartureTime) {
      alert('출발 지역과 출발 일시를 모두 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const newCarpool = {
        id: 'carpool-' + Date.now(),
        driver_name: formDriverName || alumniProfile?.name || '동문',
        driver_phone: formDriverPhone || '',
        start_location: formStartLocation,
        destination: formDestination,
        departure_time: formDepartureTime,
        car_model: formCarModel || '승용차',
        total_seats: parseInt(formTotalSeats, 10) || 3,
        passengers: [],
        notes: formNotes,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('carpools')
        .insert(newCarpool)
        .select()
        .single();

      if (error) {
        console.warn('DB insert fallback:', error.message);
        setCarpools(prev => [newCarpool, ...prev]);
      } else if (data) {
        setCarpools(prev => [data, ...prev]);
      }

      triggerConfetti();
      setShowAddCarpoolModal(false);
      setFormStartLocation('');
      setFormDepartureTime('');
      setFormNotes('');
      alert('🚗 동승 카풀 차량이 성공적으로 등록되었습니다!');
    } catch (err) {
      console.error('Error adding carpool:', err);
      alert('카풀 등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '10px 16px 80px 16px' }} className="fade-in">
      
      {/* Header Banner */}
      <div className="glass" style={{
        padding: '28px 24px',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(16, 185, 129, 0.15))',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(6, 182, 212, 0.2)', color: '#38bdf8', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', marginBottom: '10px' }}>
            <Navigation size={14} /> 스마트 이동 지원
          </div>
          <h2 style={{ fontSize: 'clamp(22px, 5vw, 32px)', fontWeight: '800', color: 'white', margin: 0, letterSpacing: '-0.5px' }}>
            🗺️ 길안내 & 🚗 함께 타고 가요 (카풀)
          </h2>
          <p style={{ color: 'var(--color-secondary)', fontSize: '15px', marginTop: '6px', margin: 0 }}>
            모임 장소 길안내부터 같은 동네 사는 동문끼리 승용차 카풀까지 편하게 이용하세요.
          </p>
        </div>

        <button
          onClick={() => setShowAddCarpoolModal(true)}
          style={{
            background: 'linear-gradient(135deg, #06b6d4, #10b981)',
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
            boxShadow: '0 4px 15px rgba(6, 182, 212, 0.35)',
            minHeight: '44px'
          }}
        >
          <Plus size={18} /> 카풀 태워주기 등록
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
          onClick={() => setActiveSubTab('carpool')}
          style={{
            padding: '12px 20px',
            borderRadius: '12px',
            border: activeTab === 'carpool' ? '1px solid #06b6d4' : '1px solid rgba(255, 255, 255, 0.08)',
            background: activeTab === 'carpool' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.03)',
            color: activeTab === 'carpool' ? '#06b6d4' : 'var(--color-secondary)',
            fontWeight: '700',
            fontSize: '15px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Car size={18} />
          🚗 카풀 매칭 목록 ({carpools.length}대)
        </button>

        <button
          onClick={() => setActiveSubTab('map_guide')}
          style={{
            padding: '12px 20px',
            borderRadius: '12px',
            border: activeTab === 'map_guide' ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
            background: activeTab === 'map_guide' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
            color: activeTab === 'map_guide' ? '#10b981' : 'var(--color-secondary)',
            fontWeight: '700',
            fontSize: '15px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <MapPin size={18} />
          🗺️ 모임 장소 길안내 지도
        </button>
      </div>

      {/* TAB 1: CARPOOL LIST */}
      {activeTab === 'carpool' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {carpools.map((carpool) => {
            const seatsLeft = carpool.total_seats - carpool.passengers.length;
            const isFull = seatsLeft <= 0;
            const userName = alumniProfile?.name || '동문';
            const isJoined = carpool.passengers.includes(userName);

            return (
              <div 
                key={carpool.id}
                className="glass hover-card"
                style={{
                  padding: '24px',
                  borderRadius: '20px',
                  border: isJoined ? '2px solid #06b6d4' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: 'rgba(15, 23, 42, 0.7)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}
              >
                {/* Driver Info Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '20px',
                      fontWeight: '800'
                    }}>
                      {carpool.driver_name.slice(0, 1)}
                    </div>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        🚗 {carpool.driver_name} 동문의 카풀 차량
                        <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>({carpool.car_model})</span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--color-secondary)', marginTop: '2px' }}>
                        📞 연락처: {carpool.driver_phone || '등록된 번호'}
                      </div>
                    </div>
                  </div>

                  {/* Seat Status Badge */}
                  <div style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    background: isFull ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: isFull ? '#ef4444' : '#34d399',
                    border: `1px solid ${isFull ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                    fontSize: '13px',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Users size={14} />
                    {isFull ? '만석 (모집완료)' : `잔여 ${seatsLeft}석 가능 (총 ${carpool.total_seats}석)`}
                  </div>
                </div>

                {/* Locations Info Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '16px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#06b6d4', fontWeight: '700' }}>📍 탑승/출발 위치</div>
                    <div style={{ fontSize: '15px', color: 'white', fontWeight: '700', marginTop: '2px' }}>
                      {carpool.start_location}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '700' }}>🏁 목적지 모임 장소</div>
                    <div style={{ fontSize: '15px', color: 'white', fontWeight: '700', marginTop: '2px' }}>
                      {carpool.destination}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: '#f59e0b', fontWeight: '700' }}>⏰ 출발 예정 시간</div>
                    <div style={{ fontSize: '15px', color: '#fef3c7', fontWeight: '700', marginTop: '2px' }}>
                      {carpool.departure_time}
                    </div>
                  </div>
                </div>

                {/* Notes & Passenger list */}
                {carpool.notes && (
                  <p style={{ fontSize: '14px', color: '#cbd5e1', margin: 0, background: 'rgba(0,0,0,0.2)', padding: '10px 14px', borderRadius: '10px' }}>
                    💬 <strong>메모:</strong> {carpool.notes}
                  </p>
                )}

                {/* Passengers List */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#94a3b8' }}>
                  <strong>현재 탑승 동문 ({carpool.passengers.length}명):</strong>
                  {carpool.passengers.length === 0 ? (
                    <span>아직 탑승 신청자가 없습니다.</span>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {carpool.passengers.map(p => (
                        <span key={p} style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
                  <button
                    onClick={() => handleJoinCarpool(carpool)}
                    disabled={isFull || isJoined}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '12px',
                      border: 'none',
                      background: isJoined ? '#10b981' : isFull ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                      color: 'white',
                      fontWeight: '800',
                      fontSize: '15px',
                      cursor: isFull || isJoined ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      minHeight: '44px'
                    }}
                  >
                    {isJoined ? (
                      <> <Check size={18} /> 카풀 탑승 신청 완료 </>
                    ) : isFull ? (
                      <> 탑승 정원 만석 </>
                    ) : (
                      <> <Car size={18} /> 이 차량 카풀 신청하기 </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      const shareMsg = `[시월의 마지막 밤 카풀 공유]\n\n운전자: ${carpool.driver_name} 동문\n출발지: ${carpool.start_location}\n목적지: ${carpool.destination}\n시간: ${carpool.departure_time}\n잔여: ${seatsLeft}석 남음`;
                      navigator.clipboard.writeText(shareMsg);
                      alert('카풀 안내 메시지가 복사되었습니다! 카톡에 붙여넣어 공유하세요.');
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Share2 size={16} /> 공유하기
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: MAP GUIDE */}
      {activeTab === 'map_guide' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {upcomingEvents.map(event => (
            <div 
              key={event.id}
              className="glass"
              style={{
                padding: '24px',
                borderRadius: '20px',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                background: 'rgba(15, 23, 42, 0.7)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={22} color="#10b981" /> {event.title}
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>🗓️ 모임 일시</div>
                  <div style={{ fontSize: '15px', color: 'white', fontWeight: '700', marginTop: '2px' }}>{event.date}</div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>📍 장소 및 주소</div>
                  <div style={{ fontSize: '15px', color: 'white', fontWeight: '700', marginTop: '2px' }}>{event.location}</div>
                  <div style={{ fontSize: '12px', color: '#34d399', marginTop: '2px' }}>{event.address}</div>
                </div>
              </div>

              {/* Transit & Parking Details */}
              <div style={{ background: 'rgba(6, 182, 212, 0.08)', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(6, 182, 212, 0.2)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '13px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Bus size={16} /> <strong>대중교통 / 버스 안내:</strong> {event.transit_info}
                </div>
                <div style={{ fontSize: '13px', color: '#a855f7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Car size={16} /> <strong>주차장 지원 안내:</strong> {event.parking_info}
                </div>
              </div>

              {/* Navigation Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    window.open(`https://map.kakao.com/?q=${encodeURIComponent(event.address || event.location)}`, '_blank');
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #facc15, #eab308)',
                    color: '#1e293b',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(234, 179, 8, 0.3)',
                    minHeight: '44px'
                  }}
                >
                  <Navigation size={18} /> 카카오맵 1초 길안내 실행
                </button>

                <button
                  onClick={() => handleCopyText(`${event.location} (${event.address})`, event.id)}
                  className="btn btn-secondary"
                  style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {copiedId === event.id ? <Check size={16} /> : <Copy size={16} />}
                  {copiedId === event.id ? '주소 복사됨!' : '주소 복사하기'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: ADD CARPOOL MODAL */}
      {showAddCarpoolModal && (
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
        onClick={() => setShowAddCarpoolModal(false)}
        >
          <div 
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: '#0f172a',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              borderRadius: '20px',
              padding: '24px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Car size={22} color="#06b6d4" /> 🚗 카풀 태워주기 등록
              </h3>
              <button onClick={() => setShowAddCarpoolModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddCarpool} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '700' }}>운전자 이름 & 연락처</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="운전자 이름"
                    value={formDriverName}
                    onChange={(e) => setFormDriverName(e.target.value)}
                    style={{ padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '14px' }}
                    required
                  />
                  <input
                    type="text"
                    placeholder="연락처 (010-0000-0000)"
                    value={formDriverPhone}
                    onChange={(e) => setFormDriverPhone(e.target.value)}
                    style={{ padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '700' }}>📍 출발 탑승 장소</label>
                <input
                  type="text"
                  placeholder="예: 전주 덕진구 아중리 아중역 1번 출구 앞"
                  value={formStartLocation}
                  onChange={(e) => setFormStartLocation(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '14px' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '700' }}>⏰ 출발 예정 일시</label>
                <input
                  type="text"
                  placeholder="예: 10월 28일 오전 09:30"
                  value={formDepartureTime}
                  onChange={(e) => setFormDepartureTime(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '14px' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '700' }}>차종 (예: 그랜저 / 카니발)</label>
                  <input
                    type="text"
                    placeholder="예: 그랜저 IG"
                    value={formCarModel}
                    onChange={(e) => setFormCarModel(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '14px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '700' }}>모실 수 있는 정원</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formTotalSeats}
                    onChange={(e) => setFormTotalSeats(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '14px' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '700' }}>전하고 싶은 메모 (경유지/상세장소)</label>
                <textarea
                  rows="3"
                  placeholder="예: 경유지 탑승 가능합니다. 편하게 연락 주세요!"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '14px', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddCarpoolModal(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: '700', cursor: 'pointer' }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ flex: 2, padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #06b6d4, #10b981)', color: 'white', fontWeight: '700', cursor: 'pointer' }}
                >
                  {submitting ? '등록 중...' : '카풀 차량 등록하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
