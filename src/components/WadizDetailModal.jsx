import React, { useState } from 'react';
import { X, Sparkles, Mic, Radio, Film, FileSpreadsheet, Bot, Users, Music, Play, CheckCircle2, ChevronRight, HelpCircle, Gift, Award, Star, Heart } from 'lucide-react';

export default function WadizDetailModal({ isOpen, onClose, setActiveTab }) {
  const [activeSubTab, setActiveSubTab] = useState('story'); // 'story', 'features', 'radio_cinema', 'reward', 'faq'

  if (!isOpen) return null;

  return (
    <div 
      className="fade-in"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 8, 22, 0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '900px',
          maxHeight: '90vh',
          backgroundColor: '#0d1326',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(6, 182, 212, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.15), rgba(139, 92, 246, 0.15))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
              padding: '6px 12px',
              borderRadius: '20px',
              color: 'white',
              fontSize: '12px',
              fontWeight: '800',
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Sparkles size={14} /> WADIZ 펀딩 상세기능
            </div>
            <span style={{ fontSize: '18px', fontWeight: '700', color: '#f8fafc' }}>
              시월의 마지막 밤 상세안내
            </span>
          </div>

          <button 
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            className="hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Wadiz Crowdfunding Top Stats Banner */}
        <div style={{
          background: '#070b19',
          padding: '16px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>펀딩 달성률</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#06b6d4' }}>4,890%</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>참여 서포터</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#a855f7' }}>1,240명</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>서포터 만족도</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <Star size={16} fill="#f59e0b" /> 4.9 / 5.0
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>주 요 타 겟</div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>5070 동문/동호회</div>
          </div>
        </div>

        {/* Sub Navigation Tabs inside Modal */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(255, 255, 255, 0.02)',
          overflowX: 'auto',
          padding: '0 16px'
        }}>
          {[
            { id: 'story', label: '📖 펀딩 스토리 & 개요' },
            { id: 'features', label: '🎙️ 음성제어 & Big UI' },
            { id: 'radio_cinema', label: '📻 라디오 & 🎬 영화관' },
            { id: 'admin_ai', label: '📊 엑셀 & 🤖 AI 챗봇' },
            { id: 'reward', label: '🎁 리워드 구성' },
            { id: 'faq', label: '❓ FAQ 질문' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              style={{
                padding: '14px 18px',
                border: 'none',
                background: 'transparent',
                color: activeSubTab === tab.id ? '#06b6d4' : '#94a3b8',
                fontWeight: activeSubTab === tab.id ? '700' : '500',
                fontSize: '14px',
                borderBottom: activeSubTab === tab.id ? '3px solid #06b6d4' : '3px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Modal Content Body */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          flex: 1,
          color: '#e2e8f0',
          fontSize: '15px',
          lineHeight: '1.7'
        }}>
          
          {/* TAB 1: STORY */}
          {activeSubTab === 'story' && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(139, 92, 246, 0.1))',
                padding: '20px',
                borderRadius: '16px',
                border: '1px solid rgba(6, 182, 212, 0.2)'
              }}>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#f8fafc', marginBottom: '8px' }}>
                  "회장님, 카톡 공지 뒤로 밀렸어요! 사진 기간 만료됐대요!"
                </h3>
                <p style={{ color: '#cbd5e1', fontSize: '15px' }}>
                  더 이상 카톡방에서 중요 공지나 야유회 사진을 놓치지 마세요. 
                  5070 시니어 동문도 말 한마디로 쉽게 조작하는 우리들만의 디지털 낭만 아지트 
                  <strong> &lt;시월의 마지막 밤&gt;</strong>을 소개합니다.
                </p>
              </div>

              {/* Problem vs Solution Table */}
              <h4 style={{ fontSize: '17px', fontWeight: '700', color: '#06b6d4', marginTop: '10px' }}>
                🚨 왜 카카오톡 단톡방 대신 &lt;시월의 마지막 밤&gt;인가요?
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '16px', borderRadius: '12px' }}>
                  <div style={{ fontWeight: '700', color: '#f87171', marginBottom: '8px' }}>❌ 기존 카카오톡 단톡방</div>
                  <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '13px', color: '#fca5a5' }}>
                    <li>수다에 묻히는 모임 공지사항</li>
                    <li>다운로드 기간 지나서 사라지는 사진들</li>
                    <li>총무가 일일이 엑셀에 적어야 하는 회비/참가자</li>
                    <li>어르신들이 눌러보기엔 너무 작은 글씨</li>
                  </ul>
                </div>

                <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '16px', borderRadius: '12px' }}>
                  <div style={{ fontWeight: '700', color: '#34d399', marginBottom: '8px' }}>✅ &lt;시월의 마지막 밤&gt; 스마트 아지트</div>
                  <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '13px', color: '#6ee7b7' }}>
                    <li>첫 화면 팝업 & 고정 게시판으로 공지 한눈에!</li>
                    <li>영구 보관 3열 고화질 추억 갤러리</li>
                    <li>1초 만에 완료되는 참가자 명단 CSV 엑셀 추출</li>
                    <li>버튼 안 눌러도 되는 말로 하는 음성 제어 & Big UI</li>
                  </ul>
                </div>
              </div>

              {/* Maker Quote */}
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '12px', borderLeft: '4px solid #06b6d4' }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#cbd5e1', fontStyle: 'italic' }}>
                  "이용의 &lt;잊혀진 계절&gt; 가사처럼, 세월이 흘러도 동창회와 친목 모임의 소중한 추억은 잊혀지면 안 됩니다. 어르신들도 편하게 들어오셔서 음악과 영화를 들으며 우정을 나눌 수 있도록 만들었습니다."
                </p>
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>— 메이커 &lt;시월의 마지막 밤&gt; 개발팀 드림</div>
              </div>
            </div>
          )}

          {/* TAB 2: FEATURES - VOICE & BIG UI */}
          {activeSubTab === 'features' && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(6, 182, 212, 0.1)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <Mic size={24} />
                </div>
                <div>
                  <h4 style={{ fontSize: '18px', fontWeight: '700', color: 'white', margin: 0 }}>🎙️ "손가락 안 눌러도 돼요!" 음성 인식 제어 (Voice Control)</h4>
                  <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>스마트폰 조작이 어려운 5070 시니어 동문님을 위한 최고의 배려</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ fontWeight: '700', color: '#06b6d4', marginBottom: '6px' }}>🗣️ 주요 음성 명령어</div>
                  <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px', color: '#cbd5e1' }}>
                    <li>"라디오 틀어줘" ➔ 실시간 방송 실행</li>
                    <li>"영화관 열어줘" ➔ 영화 검색 이동</li>
                    <li>"게시판 보여줘" ➔ 게시글 목록 이동</li>
                    <li>"오늘 날씨 어때?" ➔ 음성 안내(TTS)</li>
                  </ul>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ fontWeight: '700', color: '#a855f7', marginBottom: '6px' }}>🔍 시니어 맞춤 Big UI</div>
                  <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px', color: '#cbd5e1' }}>
                    <li>모든 터치 버튼 최소 44px 이상 확보</li>
                    <li>눈이 편안한 선명한 글자 크기 & 고대비 UI</li>
                    <li>터치 미스 방지 간격 최적화</li>
                  </ul>
                </div>
              </div>

              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ fontWeight: '700', color: '#34d399' }}>🔊 마이크 아이콘 클릭으로 바로 테스트해보세요!</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>화면 우측 하단 마이크 버튼을 누르면 음성 명령어가 작동합니다.</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RADIO & CINEMA */}
          {activeSubTab === 'radio_cinema' && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Radio Section */}
              <div style={{ background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.4), rgba(15, 23, 42, 0.6))', padding: '20px', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: '#2563eb', padding: '8px', borderRadius: '10px', color: 'white' }}>
                      <Radio size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '17px', fontWeight: '700', color: 'white', margin: 0 }}>📻 7080 추억의 라디오 사연 & 실시간 방송</h4>
                      <p style={{ fontSize: '12px', color: '#93c5fd', margin: 0 }}>Google Cloud AI DJ 성우 + 무배포 음원 라이브러리 + 지상파 13개 무료 라이브</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { onClose(); setActiveTab('radio'); }}
                    style={{ background: '#2563eb', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    라디오 바로가기 <ChevronRight size={14} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '12px', borderRadius: '10px', fontSize: '13px', borderLeft: '3px solid #38bdf8' }}>
                    <strong style={{ color: '#38bdf8', display: 'block', marginBottom: '4px' }}>🎙️ 5종 고유 AI DJ 성우</strong>
                    Neural2-A/B/C, Wavenet-C/D 실제 성우 모델 할당으로 감미로운 심야 DJ부터 중저음 남성 DJ까지 완벽 지원!
                  </div>
                  <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '12px', borderRadius: '10px', fontSize: '13px', borderLeft: '3px solid #c084fc' }}>
                    <strong style={{ color: '#c084fc', display: 'block', marginBottom: '4px' }}>🎵 무배포 자동 음원 등록</strong>
                    신청곡 작성 시 새 MP3를 입력하면 별도 배포/작업 없이 전 회원 보유 음원 라이브러리에 100% 자동 등록!
                  </div>
                  <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '12px', borderRadius: '10px', fontSize: '13px', borderLeft: '3px solid #34d399' }}>
                    <strong style={{ color: '#34d399', display: 'block', marginBottom: '4px' }}>✏️ 실시간 수정 & 삭제</strong>
                    모바일과 PC 간 사연 작성, 수정, 삭제가 Supabase DB 서버를 통해 100% 실시간으로 즉시 공유!
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '10px 12px', borderRadius: '8px', fontSize: '12px' }}>
                    <strong style={{ color: '#60a5fa' }}>KBS 라디오:</strong> Classic FM(93.1), Cool FM, 1라디오
                  </div>
                  <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '10px 12px', borderRadius: '8px', fontSize: '12px' }}>
                    <strong style={{ color: '#c084fc' }}>MBC 라디오:</strong> 광주 FM4U(95.1), 표준FM
                  </div>
                  <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '10px 12px', borderRadius: '8px', fontSize: '12px' }}>
                    <strong style={{ color: '#34d399' }}>SBS 라디오:</strong> 파워FM(107.7), 러브FM
                  </div>
                  <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '10px 12px', borderRadius: '8px', fontSize: '12px' }}>
                    <strong style={{ color: '#fbbf24' }}>CBS / EBS / TBS:</strong> 올드팝 전문 CBS 음악FM, EBS 등
                  </div>
                </div>
              </div>

              {/* Cinema Section */}
              <div style={{ background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.4), rgba(15, 23, 42, 0.6))', padding: '20px', borderRadius: '16px', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: '#a855f7', padding: '8px', borderRadius: '10px', color: 'white' }}>
                      <Film size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '17px', fontWeight: '700', color: 'white', margin: 0 }}>🎬 추억의 영화관 (Cinema 모듈)</h4>
                      <p style={{ fontSize: '12px', color: '#e9d5ff', margin: 0 }}>실시간 개봉 영화부터 명작 영화 줄거리, 포스터, 예고편 탐색</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { onClose(); setActiveTab('cinema'); }}
                    style={{ background: '#a855f7', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    영화관 바로가기 <ChevronRight size={14} />
                  </button>
                </div>

                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#e2e8f0' }}>
                  <li>영화진흥위원회(KOBIS) & TMDB 데이터베이스 연동으로 검증된 정보 제공</li>
                  <li>포스터 및 상세 줄거리, 출연진 정보 한눈에 보기</li>
                  <li>영화 예고편 영상 즉시 감상 기능 지원</li>
                </ul>
              </div>

            </div>
          )}

          {/* TAB 4: ADMIN & AI CHATBOT */}
          {activeSubTab === 'admin_ai' && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '18px', borderRadius: '14px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <FileSpreadsheet size={22} color="#10b981" />
                  <h4 style={{ fontSize: '17px', fontWeight: '700', color: '#34d399', margin: 0 }}>📊 총무님 전용 1초 엑셀(CSV) 출석부</h4>
                </div>
                <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0 }}>
                  야유회, 송년모임, 정기 동창회 참가 신청 명단과 회비 입금 현황을 클릭 한 번으로 CSV 엑셀 파일로 바로 다운로드받을 수 있습니다. 카톡에서 이름 받아 적던 노가다는 이제 그만!
                </p>
              </div>

              <div style={{ background: 'rgba(139, 92, 246, 0.08)', padding: '18px', borderRadius: '14px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <Bot size={22} color="#a855f7" />
                  <h4 style={{ fontSize: '17px', fontWeight: '700', color: '#c084fc', margin: 0 }}>🤖 24시간 스마트 AI 동호회 매니저 챗봇</h4>
                </div>
                <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0 }}>
                  "회비 입금 계좌가 어디지?", "다음 모임 장소가 언제지?" 질문이 있으시면 화면 오른쪽 아래 챗봇에게 언제든 대화로 편하게 물어보세요. AI 가이드가 24시간 친절히 안내해 드립니다.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: REWARD */}
          {activeSubTab === 'reward' && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ fontSize: '17px', fontWeight: '700', color: '#06b6d4', margin: 0 }}>🎁 와디즈 서포터 펀딩 리워드 구성</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '14px', padding: '18px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#f59e0b', marginBottom: '4px' }}>SUPER EARLY BIRD</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: 'white' }}>🥉 시월의 밤 기본 팩</div>
                  <div style={{ fontSize: '22px', fontWeight: '900', color: '#06b6d4', margin: '10px 0' }}>₩ 150,000</div>
                  <ul style={{ paddingLeft: '18px', fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                    <li>독자 커스텀 도메인 세팅</li>
                    <li>명부 / 게시판 / 갤러리 / 앨범</li>
                    <li>실시간 지상파 라디오 & BGM</li>
                  </ul>
                </div>

                <div style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(139, 92, 246, 0.15))', border: '1px solid rgba(6, 182, 212, 0.4)', borderRadius: '14px', padding: '18px', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '-10px', right: '14px', background: '#06b6d4', color: 'black', fontSize: '10px', fontWeight: '900', padding: '2px 8px', borderRadius: '10px' }}>BEST CHOICE</div>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#a855f7', marginBottom: '4px' }}>EARLY BIRD</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: 'white' }}>🥈 스마트 총무 패키지</div>
                  <div style={{ fontSize: '22px', fontWeight: '900', color: '#06b6d4', margin: '10px 0' }}>₩ 290,000</div>
                  <ul style={{ paddingLeft: '18px', fontSize: '12px', color: '#e2e8f0', margin: 0 }}>
                    <li>기본 팩 전체 기능 지원</li>
                    <li><strong>추억의 영화관 (Cinema) 모듈</strong></li>
                    <li><strong>행사 관리 & 1초 CSV 엑셀 추출</strong></li>
                    <li><strong>말로 하는 음성 인식 제어</strong></li>
                  </ul>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '14px', padding: '18px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#10b981', marginBottom: '4px' }}>WADIZ SPECIAL</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: 'white' }}>🥇 올인원 낭만 아지트 팩</div>
                  <div style={{ fontSize: '22px', fontWeight: '900', color: '#06b6d4', margin: '10px 0' }}>₩ 450,000</div>
                  <ul style={{ paddingLeft: '18px', fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                    <li>스마트 총무 패키지 전체 지원</li>
                    <li><strong>AI 동호회 챗봇 가이드 구축</strong></li>
                    <li>5070 전용 간편 매뉴얼 제공</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: FAQ */}
          {activeSubTab === 'faq' && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h4 style={{ fontSize: '17px', fontWeight: '700', color: '#06b6d4', margin: 0 }}>❓ 자주 묻는 질문 (FAQ)</h4>

              {[
                { q: 'Q1. 70대 어르신들도 진짜 사용할 수 있나요?', a: '네! 복잡한 앱 메뉴를 찾지 않고 마이크 버튼을 누르고 "라디오 틀어줘", "영화관 보여줘"라고 말하면 화면이 자동으로 이동합니다. 글씨와 버튼도 큼직합니다.' },
                { q: 'Q2. 라디오를 청취하면서 다른 기능(게시판, 갤러리)을 이용할 수 있나요?', a: '네! 백그라운드 라디오 플레이어로 작동하므로 음악이나 라디오를 청취하면서 자유롭게 소식글이나 사진을 감상할 수 있습니다.' },
                { q: 'Q3. 스마트폰 모바일에서도 잘 나오나요?', a: '100% 반응형 웹 디자인으로 제작되어 갤럭시, 아이폰, 태블릿, PC 상관없이 완벽히 구동됩니다.' }
              ].map((item, idx) => (
                <div key={idx} style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ fontWeight: '700', color: '#38bdf8', marginBottom: '4px' }}>{item.q}</div>
                  <div style={{ fontSize: '13px', color: '#cbd5e1' }}>👉 {item.a}</div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Footer Bar */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: '#070b19',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
            5070 동문회를 위한 스마트 낭만 아지트 &lt;시월의 마지막 밤&gt;
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
              color: 'white',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '30px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(6, 182, 212, 0.4)'
            }}
          >
            확인 및 닫기
          </button>
        </div>

      </div>
    </div>
  );
}
