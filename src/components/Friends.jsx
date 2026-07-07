import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Search, Plus, Mail, Phone, Calendar, Edit3, X, UploadCloud, User } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Friends({ session, alumniProfile }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [selectedFriendForView, setSelectedFriendForView] = useState(null);
  const [editingProfile, setEditingProfile] = useState(null); // Profile currently editing (self or admin editing anyone)
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formBirthday, setFormBirthday] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formIsPresident, setFormIsPresident] = useState(false);
  const [formIsTreasurer, setFormIsTreasurer] = useState(false);
  const [formAvatarFile, setFormAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const isAdmin = alumniProfile?.is_president || alumniProfile?.is_treasurer;

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 }
    });
  };

  const fetchFriends = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('alumni')
        .select('*');

      if (error) throw error;

      // Sort friends: Me -> President -> Treasurer -> Member
      const sorted = (data || []).sort((a, b) => {
        const isSelfA = a.auth_id === session?.user?.id;
        const isSelfB = b.auth_id === session?.user?.id;
        if (isSelfA && !isSelfB) return -1;
        if (!isSelfA && isSelfB) return 1;

        // Rank computed value
        const getRank = (p) => {
          if (p.is_president && p.is_treasurer) return 0; // President + Treasurer
          if (p.is_president) return 1; // President
          if (p.is_treasurer) return 2; // Treasurer
          return 3; // Regular Member
        };

        const rankDiff = getRank(a) - getRank(b);
        if (rankDiff !== 0) return rankDiff;

        // If rank is same, sort alphabetically
        return a.name.localeCompare(b.name, 'ko');
      });

      setFriends(sorted);
    } catch (err) {
      console.error('Error fetching friends:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  const compressAvatar = (file) => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        resolve(file);
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 300;
          const MAX_HEIGHT = 300;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              const origName = file.name;
              const dotIndex = origName.lastIndexOf('.');
              const baseName = dotIndex !== -1 ? origName.substring(0, dotIndex) : origName;
              const compressedFile = new File([blob], `${baseName}_avatar.jpg`, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          }, 'image/jpeg', 0.8);
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  const handleAvatarFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const originalFile = e.target.files[0];
      setFormAvatarFile(originalFile); // Set immediate filename
      
      const compressed = await compressAvatar(originalFile);
      setFormAvatarFile(compressed);
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

  // Open Add Friend Modal
  const handleOpenAddModal = () => {
    setFormName('');
    setFormPhone('');
    setFormBirthday('');
    setFormDesc('');
    setFormIsPresident(false);
    setFormIsTreasurer(false);
    setFormAvatarFile(null);
    setFormError('');
    setShowAddModal(true);
  };

  // Add new friend (Admin Only)
  const handleAddFriendSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('이름을 입력해 주세요.');
      return;
    }
    setSaving(true);
    setFormError('');

    try {
      let avatarUrl = '';

      if (formAvatarFile) {
        try {
          const fileExt = formAvatarFile.name.split('.').pop();
          const safeName = `avatar-${Date.now()}.${fileExt}`;
          const filePath = `${safeName}`;

          const { error: uploadErr } = await supabase.storage
            .from('gallery')
            .upload(filePath, formAvatarFile, { cacheControl: '3600', upsert: true });

          if (uploadErr) throw uploadErr;

          const { data: { publicUrl } } = supabase.storage
            .from('gallery')
            .getPublicUrl(filePath);

          avatarUrl = publicUrl;
        } catch (storageErr) {
          const base64Data = await convertToBase64(formAvatarFile);
          avatarUrl = base64Data;
        }
      }

      const { error } = await supabase
        .from('alumni')
        .insert({
          name: formName,
          phone: formPhone,
          birthday: formBirthday || null,
          description: formDesc,
          is_president: formIsPresident,
          is_treasurer: formIsTreasurer,
          avatar_url: avatarUrl || null
        });

      if (error) throw error;

      triggerConfetti();
      setShowAddModal(false);
      fetchFriends();
    } catch (err) {
      setFormError(err.message || '친구를 추가하는 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // Open Edit Profile Modal
  const handleOpenEditModal = (friend) => {
    setEditingProfile(friend);
    setFormName(friend.name);
    setFormPhone(friend.phone || '');
    setFormBirthday(friend.birthday || '');
    setFormDesc(friend.description || '');
    setFormIsPresident(friend.is_president || false);
    setFormIsTreasurer(friend.is_treasurer || false);
    setFormAvatarFile(null);
    setFormError('');
  };

  // Update friend profile
  const handleEditFriendSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');

    try {
      let avatarUrl = editingProfile.avatar_url;

      if (formAvatarFile) {
        try {
          const fileExt = formAvatarFile.name.split('.').pop();
          const safeName = `avatar-${editingProfile.id}-${Date.now()}.${fileExt}`;
          const filePath = `${safeName}`;

          const { error: uploadErr } = await supabase.storage
            .from('gallery')
            .upload(filePath, formAvatarFile, { cacheControl: '3600', upsert: true });

          if (uploadErr) throw uploadErr;

          const { data: { publicUrl } } = supabase.storage
            .from('gallery')
            .getPublicUrl(filePath);

          avatarUrl = publicUrl;
        } catch (storageErr) {
          const base64Data = await convertToBase64(formAvatarFile);
          avatarUrl = base64Data;
        }
      }

      // Fields to update
      const updates = {
        name: formName,
        phone: formPhone,
        birthday: formBirthday || null,
        description: formDesc,
        avatar_url: avatarUrl,
        // Only Admin can change roles
        ...(isAdmin ? {
          is_president: formIsPresident,
          is_treasurer: formIsTreasurer
        } : {})
      };

      const { error } = await supabase
        .from('alumni')
        .update(updates)
        .eq('id', editingProfile.id);

      if (error) throw error;

      triggerConfetti();
      setEditingProfile(null);
      
      // If we updated our own profile, trigger a reload to update navbar username
      if (editingProfile.auth_id === session?.user?.id) {
        window.location.reload();
      } else {
        fetchFriends();
      }
    } catch (err) {
      setFormError(err.message || '프로필 수정 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // Delete Friend (Admin Only)
  const handleDeleteFriend = async (friendId) => {
    if (!window.confirm('정말로 이 친구를 명단에서 삭제하시겠습니까? 이 회원과 연동된 계정도 접근할 수 없게 됩니다.')) return;
    
    try {
      const { error } = await supabase
        .from('alumni')
        .delete()
        .eq('id', friendId);

      if (error) throw error;
      
      setEditingProfile(null);
      fetchFriends();
    } catch (err) {
      alert(err.message || '삭제 중 오류가 발생했습니다.');
    }
  };

  // Filter based on search query
  const filteredFriends = friends.filter(friend => {
    const matchesSearch = 
      friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (friend.phone || '').includes(searchQuery) ||
      (friend.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="fade-in" style={{ paddingBottom: '60px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '35px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ width: '4px', height: '24px', background: 'var(--accent-gradient)', borderRadius: '2px', display: 'inline-block' }} />
            친구들 명단
          </h2>
          <p style={{ color: 'var(--color-secondary)', fontSize: '15px' }}>
            함께 추억을 쌓아가는 우리 동호회 멤버들입니다.
          </p>
        </div>
        
        {isAdmin && (
          <button
            onClick={handleOpenAddModal}
            className="btn btn-primary"
            style={{ height: '44px', padding: '0 20px' }}
          >
            <Plus size={18} />
            신규 회원 등록
          </button>
        )}
      </div>

      {/* Search Field */}
      <div className="glass" style={{ padding: '16px 20px', marginBottom: '30px' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={18} color="var(--color-secondary)" style={{ position: 'absolute', left: '16px', top: '13px' }} />
          <input
            type="text"
            placeholder="친구 이름, 연락처, 소개 글 검색..."
            className="input-field"
            style={{ paddingLeft: '48px', minHeight: '44px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Friends Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '15px', color: 'var(--color-secondary)' }}>친구 목록을 불러오는 중입니다...</p>
        </div>
      ) : filteredFriends.length === 0 ? (
        <div className="glass" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--color-secondary)' }}>
          등록된 친구가 없거나 검색 조건에 맞는 회원이 없습니다.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '25px'
        }}>
          {filteredFriends.map((friend) => {
            const isSelf = friend.auth_id === session?.user?.id;
            
            // Role Display compute
            let roleText = '회원';
            let roleColor = 'rgba(255, 255, 255, 0.15)';
            let roleTextColor = 'var(--color-primary)';
            
            if (friend.is_president && friend.is_treasurer) {
              roleText = '회장 / 홈피지기';
              roleColor = 'rgba(239, 68, 68, 0.15)';
              roleTextColor = 'var(--accent-red)';
            } else if (friend.is_president) {
              roleText = '회장';
              roleColor = 'rgba(167, 139, 250, 0.15)';
              roleTextColor = 'var(--accent-violet)';
            } else if (friend.is_treasurer) {
              roleText = '홈피지기';
              roleColor = 'rgba(6, 182, 212, 0.15)';
              roleTextColor = 'var(--accent-cyan)';
            }

            return (
              <div
                key={friend.id}
                className="glass"
                onClick={() => setSelectedFriendForView(friend)}
                style={{
                  padding: '25px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  borderRadius: '16px',
                  position: 'relative',
                  border: isSelf ? '1.5px solid var(--accent-cyan)' : '1px solid rgba(255,255,255,0.08)',
                  transition: 'var(--transition-smooth)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = isSelf ? 'var(--shadow-neon)' : 'var(--shadow-glow)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
                }}
              >
                {/* Role Badge */}
                <span style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: roleColor,
                  color: roleTextColor,
                  border: `1px solid ${roleTextColor}30`
                }}>
                  {roleText}
                </span>

                {/* Self Badge */}
                {isSelf && (
                  <span style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    fontSize: '10px',
                    fontWeight: '700',
                    padding: '3px 6px',
                    borderRadius: '4px',
                    background: 'var(--accent-cyan)',
                    color: '#070b19'
                  }}>
                    나
                  </span>
                )}

                {/* Avatar Photo */}
                <div style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  margin: '15px auto 15px auto',
                  backgroundImage: friend.avatar_url ? `url(${friend.avatar_url})` : 'none',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid rgba(255,255,255,0.1)'
                }}>
                  {!friend.avatar_url && <User size={40} color="var(--color-secondary)" />}
                </div>

                {/* Name */}
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
                  {friend.name}
                </h3>
                
                {/* Description snippet */}
                <p style={{
                  fontSize: '13px',
                  color: 'var(--color-secondary)',
                  minHeight: '36px',
                  lineHeight: '1.4',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  marginBottom: '15px'
                }}>
                  {friend.description || '반갑습니다! 시월의 마지막 밤 회원입니다.'}
                </p>

                {/* Edit Button overlay (Only for Self or Admin) */}
                {(isSelf || isAdmin) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Stop parent click view
                      handleOpenEditModal(friend);
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'var(--color-secondary)',
                      borderRadius: '8px',
                      padding: '5px 10px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'var(--transition-smooth)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-cyan)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-secondary)'}
                  >
                    <Edit3 size={12} />
                    편집
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 1. View Profile Card Detail Modal */}
      {selectedFriendForView && (
        <div className="modal-overlay" onClick={() => setSelectedFriendForView(null)}>
          <div className="glass modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedFriendForView(null)} style={{ background: 'transparent', border: 'none', color: 'var(--color-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{
              width: '110px',
              height: '110px',
              borderRadius: '50%',
              margin: '0 auto 20px auto',
              backgroundImage: selectedFriendForView.avatar_url ? `url(${selectedFriendForView.avatar_url})` : 'none',
              backgroundColor: 'rgba(255,255,255,0.05)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid rgba(255,255,255,0.1)'
            }}>
              {!selectedFriendForView.avatar_url && <User size={50} color="var(--color-secondary)" />}
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '6px' }}>{selectedFriendForView.name}</h2>
            
            {/* Roles detail */}
            <div style={{ marginBottom: '24px' }}>
              <span style={{
                fontSize: '12px',
                fontWeight: '700',
                padding: '4px 10px',
                borderRadius: '50px',
                background: selectedFriendForView.is_president || selectedFriendForView.is_treasurer ? 'rgba(34, 211, 238, 0.15)' : 'rgba(255,255,255,0.05)',
                color: selectedFriendForView.is_president || selectedFriendForView.is_treasurer ? 'var(--accent-cyan)' : 'var(--color-secondary)',
                border: '1px solid rgba(255,255,255,0.08)'
              }}>
                {selectedFriendForView.is_president && selectedFriendForView.is_treasurer ? '임원 (회장 / 홈피지기 겸임)' : selectedFriendForView.is_president ? '임원 (회장)' : selectedFriendForView.is_treasurer ? '임원 (홈피지기)' : '회원'}
              </span>
            </div>

            <p style={{
              fontSize: '14px',
              lineHeight: '1.6',
              color: '#cbd5e1',
              background: 'rgba(255,255,255,0.02)',
              padding: '16px',
              borderRadius: '10px',
              marginBottom: '24px',
              textAlign: 'left',
              whiteSpace: 'pre-wrap'
            }}>
              {selectedFriendForView.description || '등록된 자기소개가 없습니다.'}
            </p>

            {/* Contact details */}
            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
                <Phone size={16} color="var(--accent-cyan)" />
                <span style={{ color: 'var(--color-secondary)' }}>전화번호:</span>
                <span style={{ fontWeight: '500' }}>{selectedFriendForView.phone || '비공개'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
                <Calendar size={16} color="var(--accent-violet)" />
                <span style={{ color: 'var(--color-secondary)' }}>생년월일:</span>
                <span style={{ fontWeight: '500' }}>{selectedFriendForView.birthday ? new Date(selectedFriendForView.birthday).toLocaleDateString() : '미등록'}</span>
              </div>
            </div>

            <button 
              onClick={() => setSelectedFriendForView(null)} 
              className="btn btn-secondary" 
              style={{ width: '100%', marginTop: '25px', minHeight: '44px' }}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 2. Add Friend Modal (Admin Only) */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="glass modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700' }}>신규 회원 명단 추가</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="alert alert-error">
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddFriendSubmit}>
              <div className="input-group">
                <label className="input-label">이름</label>
                <input
                  type="text"
                  required
                  placeholder="예: 홍길동"
                  className="input-field"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">전화번호</label>
                <input
                  type="tel"
                  placeholder="010-1234-5678"
                  className="input-field"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">생년월일</label>
                <input
                  type="date"
                  className="input-field"
                  value={formBirthday}
                  onChange={(e) => setFormBirthday(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">임원 직책 설정 (중복 겸임 선택 가능)</label>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <label className="checkbox-group">
                    <input
                      type="checkbox"
                      className="checkbox-input"
                      checked={formIsPresident}
                      onChange={(e) => setFormIsPresident(e.target.checked)}
                    />
                    회장 지정
                  </label>
                  <label className="checkbox-group">
                    <input
                      type="checkbox"
                      className="checkbox-input"
                      checked={formIsTreasurer}
                      onChange={(e) => setFormIsTreasurer(e.target.checked)}
                    />
                    홈피지기 지정
                  </label>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">자기소개 / 설명</label>
                <textarea
                  placeholder="친구 명단에 노출될 자기소개 글입니다..."
                  className="input-field"
                  style={{ minHeight: '80px', resize: 'vertical', padding: '12px' }}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">프로필 사진 업로드</label>
                <div style={{
                  border: '2px dashed rgba(255,255,255,0.15)',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                  background: 'rgba(255,255,255,0.01)',
                  cursor: 'pointer',
                  position: 'relative'
                }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0,
                      cursor: 'pointer'
                    }}
                  />
                  <UploadCloud size={24} color="var(--accent-cyan)" style={{ marginBottom: '6px' }} />
                  <p style={{ fontSize: '13px', fontWeight: '600' }}>
                    {formAvatarFile ? formAvatarFile.name : '프로필 이미지를 선택하세요.'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '25px', justifySelf: 'stretch', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>취소</button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? '추가 중...' : '회원 등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Edit Friend Modal (Self or Admin Editing) */}
      {editingProfile && (
        <div className="modal-overlay">
          <div className="glass modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700' }}>프로필 수정 ({editingProfile.name})</h3>
              <button onClick={() => setEditingProfile(null)} style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="alert alert-error">
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleEditFriendSubmit}>
              <div className="input-group">
                <label className="input-label">이름</label>
                <input
                  type="text"
                  required
                  disabled={!isAdmin} // Regular member cannot edit name to prevent bypass
                  className="input-field"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">전화번호</label>
                <input
                  type="tel"
                  placeholder="010-1234-5678"
                  className="input-field"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">생년월일</label>
                <input
                  type="date"
                  className="input-field"
                  value={formBirthday}
                  onChange={(e) => setFormBirthday(e.target.value)}
                />
              </div>

              {isAdmin && (
                <div className="input-group">
                  <label className="input-label">임원 직책 설정 (관리자 전용)</label>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <label className="checkbox-group">
                      <input
                        type="checkbox"
                        className="checkbox-input"
                        checked={formIsPresident}
                        onChange={(e) => setFormIsPresident(e.target.checked)}
                      />
                      회장 지정
                    </label>
                    <label className="checkbox-group">
                      <input
                        type="checkbox"
                        className="checkbox-input"
                        checked={formIsTreasurer}
                        onChange={(e) => setFormIsTreasurer(e.target.checked)}
                      />
                      홈피지기 지정
                    </label>
                  </div>
                </div>
              )}

              <div className="input-group">
                <label className="input-label">자기소개 / 설명</label>
                <textarea
                  placeholder="자기소개를 기입해 주세요..."
                  className="input-field"
                  style={{ minHeight: '100px', resize: 'vertical', padding: '12px' }}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">프로필 사진 변경</label>
                <div style={{
                  border: '2px dashed rgba(255,255,255,0.15)',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                  background: 'rgba(255,255,255,0.01)',
                  cursor: 'pointer',
                  position: 'relative'
                }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0,
                      cursor: 'pointer'
                    }}
                  />
                  <UploadCloud size={24} color="var(--accent-cyan)" style={{ marginBottom: '6px' }} />
                  <p style={{ fontSize: '13px', fontWeight: '600' }}>
                    {formAvatarFile ? formAvatarFile.name : '프로필 사진을 변경하려면 클릭해 파일을 고르세요.'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '25px', justifySelf: 'stretch', justifyContent: 'space-between' }}>
                {isAdmin && (
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => handleDeleteFriend(editingProfile.id)}
                  >
                    삭제
                  </button>
                )}
                
                <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setEditingProfile(null)}>취소</button>
                  <button type="submit" disabled={saving} className="btn btn-primary">
                    {saving ? '수정 중...' : '프로필 저장'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
