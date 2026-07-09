import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import { FolderPlus, BookOpen, ChevronLeft, Plus, X, UploadCloud, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { shareImageToKakao } from '../utils/kakaoShare';

export default function Album({ session, alumniProfile, onAwardActivityPoint }) {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [albumImages, setAlbumImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddPhotoModal, setShowAddPhotoModal] = useState(false);
  const [showUploadPhotoModal, setShowUploadPhotoModal] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(null); // Lightbox inside album

  // Pinch-to-zoom & Pan states for mobile image viewer
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const touchStartRef = useRef({ distance: 0, x: 0, y: 0, scale: 1 });

  const handleTouchStart = (e) => {
    const touches = e.touches;
    if (touches.length === 1) {
      touchStartRef.current.x = touches[0].clientX - position.x;
      touchStartRef.current.y = touches[0].clientY - position.y;
    } else if (touches.length === 2) {
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
      const newX = touches[0].clientX - touchStartRef.current.x;
      const newY = touches[0].clientY - touchStartRef.current.y;
      setPosition({ x: newX, y: newY });
    } else if (touches.length === 2) {
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
    setActiveImageIndex(null);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Create Album Form State
  const [albumTitle, setAlbumTitle] = useState('');
  const [albumDesc, setAlbumDesc] = useState('');
  const [albumCoverFile, setAlbumCoverFile] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Add Photo from Gallery State
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [selectedGalleryPhotoIds, setSelectedGalleryPhotoIds] = useState([]);
  const [loadingGallery, setLoadingGallery] = useState(false);

  // Upload Photo directly to Album State
  const [albumPhotoFile, setAlbumPhotoFile] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadPhotoError, setUploadPhotoError] = useState('');

  // Deletion and authorization states
  const [deletingAlbum, setDeletingAlbum] = useState(false);
  const [deletingImage, setDeletingImage] = useState(false);
  const [activeImageAuthorId, setActiveImageAuthorId] = useState(null);

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const fetchAlbums = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('albums')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlbums(data || []);
    } catch (err) {
      console.error('Error fetching albums:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbumImages = async (albumId) => {
    setLoadingImages(true);
    try {
      const { data, error } = await supabase
        .from('album_images')
        .select('*')
        .eq('album_id', albumId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlbumImages(data || []);
    } catch (err) {
      console.error('Error fetching album images:', err);
    } finally {
      setLoadingImages(false);
    }
  };

  const handleAlbumClick = (album) => {
    setSelectedAlbum(album);
    fetchAlbumImages(album.id);
  };

  const handleBackToAlbums = () => {
    setSelectedAlbum(null);
    setAlbumImages([]);
    setActiveImageIndex(null);
  };

  const compressImage = (file) => {
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
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
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
              const compressedFile = new File([blob], `${baseName}_compressed.jpg`, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          }, 'image/jpeg', 0.7);
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  const handleCoverFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const originalFile = e.target.files[0];
      setAlbumCoverFile(originalFile);
      const compressed = await compressImage(originalFile);
      setAlbumCoverFile(compressed);
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

  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    if (!albumTitle.trim()) {
      setCreateError('앨범 제목을 입력해 주세요.');
      return;
    }
    setCreating(true);
    setCreateError('');

    try {
      let coverImageUrl = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600'; // Default book cover

      if (albumCoverFile) {
        try {
          // Try Supabase Storage
          const fileExt = albumCoverFile.name.split('.').pop();
          const safeName = `cover-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${fileExt}`;
          const filePath = `${safeName}`;

          const { error: uploadErr } = await supabase.storage
            .from('gallery')
            .upload(filePath, albumCoverFile, { cacheControl: '3600', upsert: true });

          if (uploadErr) throw uploadErr;

          const { data: { publicUrl } } = supabase.storage
            .from('gallery')
            .getPublicUrl(filePath);

          coverImageUrl = publicUrl;
        } catch (storageErr) {
          // Base64 Fallback
          const base64Data = await convertToBase64(albumCoverFile);
          coverImageUrl = base64Data;
        }
      }

      const { data, error } = await supabase
        .from('albums')
        .insert({
          title: albumTitle,
          description: albumDesc,
          cover_image_url: coverImageUrl
        })
        .select();

      if (error) throw error;

      triggerConfetti();
      setShowCreateModal(false);
      
      // Reset Form
      setAlbumTitle('');
      setAlbumDesc('');
      setAlbumCoverFile(null);
      
      fetchAlbums();
    } catch (err) {
      setCreateError(err.message || '앨범 생성 중 오류가 발생했습니다.');
    } finally {
      setCreating(false);
    }
  };

  // Open "Add Photo from Gallery" modal
  const handleOpenAddPhotoModal = async () => {
    setShowAddPhotoModal(true);
    setLoadingGallery(true);
    setSelectedGalleryPhotoIds([]);
    try {
      // 1. Fetch all gallery posts
      const { data: galleryData, error: galleryErr } = await supabase
        .from('gallery')
        .select('*')
        .order('created_at', { ascending: false });

      if (galleryErr) throw galleryErr;

      // 2. Filter out photos already in the current album
      const currentImageUrls = albumImages.map(img => img.image_url);
      const availablePhotos = (galleryData || []).filter(
        post => !currentImageUrls.includes(post.image_url)
      );

      setGalleryPhotos(availablePhotos);
    } catch (err) {
      console.error('Error fetching gallery photos for album:', err);
    } finally {
      setLoadingGallery(false);
    }
  };

  const handleAddPhotosFromGallerySubmit = async () => {
    if (selectedGalleryPhotoIds.length === 0) return;
    setLoadingImages(true);

    try {
      // Get URLs of selected gallery photos
      const selectedUrls = galleryPhotos
        .filter(photo => selectedGalleryPhotoIds.includes(photo.id))
        .map(photo => photo.image_url);

      // Insert records into album_images
      const inserts = selectedUrls.map(url => ({
        album_id: selectedAlbum.id,
        image_url: url
      }));

      const { error } = await supabase
        .from('album_images')
        .insert(inserts);

      if (error) throw error;

      if (onAwardActivityPoint) {
        await onAwardActivityPoint('앨범 사진 가져오기');
      }

      triggerConfetti();
      setShowAddPhotoModal(false);
      
      // Refresh current album images
      fetchAlbumImages(selectedAlbum.id);
      
      // If we added photos, let's update album cover image to the latest photo if no custom cover was set
      if (selectedAlbum.cover_image_url.includes('unsplash.com/photo-1544947950-fa07a98d237f')) {
        await supabase
          .from('albums')
          .update({ cover_image_url: selectedUrls[0] })
          .eq('id', selectedAlbum.id);
        
        fetchAlbums(); // Refresh albums list
      }
    } catch (err) {
      console.error('Error adding photos to album:', err);
    } finally {
      setLoadingImages(false);
    }
  };

  const handleToggleGallerySelection = (photoId) => {
    setSelectedGalleryPhotoIds(prev => 
      prev.includes(photoId) 
        ? prev.filter(id => id !== photoId) 
        : [...prev, photoId]
    );
  };

  const handleAlbumPhotoFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const originalFile = e.target.files[0];
      setAlbumPhotoFile(originalFile);
      const compressed = await compressImage(originalFile);
      setAlbumPhotoFile(compressed);
    }
  };

  // Upload photo directly to album
  const handleUploadPhotoSubmit = async (e) => {
    e.preventDefault();
    if (!albumPhotoFile) {
      setUploadPhotoError('사진 파일을 선택해 주세요.');
      return;
    }
    setUploadingPhoto(true);
    setUploadPhotoError('');

    try {
      let imageUrl = '';

      try {
        // Try Storage
        const fileExt = albumPhotoFile.name.split('.').pop();
        const safeName = `album-${selectedAlbum.id}-${Date.now()}.${fileExt}`;
        const filePath = `${safeName}`;

        const { error: uploadErr } = await supabase.storage
          .from('gallery')
          .upload(filePath, albumPhotoFile, { cacheControl: '3600', upsert: true });

        if (uploadErr) throw uploadErr;

        const { data: { publicUrl } } = supabase.storage
          .from('gallery')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      } catch (storageErr) {
        // Base64 fallback
        const base64Data = await convertToBase64(albumPhotoFile);
        imageUrl = base64Data;
      }

      // Add to album_images table
      const { error: insertErr } = await supabase
        .from('album_images')
        .insert({
          album_id: selectedAlbum.id,
          image_url: imageUrl
        });

      if (insertErr) throw insertErr;

      if (onAwardActivityPoint) {
        await onAwardActivityPoint('앨범 사진 직접 업로드');
      }

      triggerConfetti();
      setShowUploadPhotoModal(false);
      setAlbumPhotoFile(null);
      
      // Refresh
      fetchAlbumImages(selectedAlbum.id);

      // Add it as a post to general gallery too, so it registers in the feed!
      await supabase
        .from('gallery')
        .insert({
          title: `${selectedAlbum.title} 앨범에 추가된 사진`,
          description: `${selectedAlbum.title} 앨범에 직접 업로드한 추억입니다.`,
          image_url: imageUrl,
          tags: ['업로드', '앨범사진'],
          author_id: alumniProfile?.id || null,
          author_name: alumniProfile?.name || '익명'
        });

    } catch (err) {
      setUploadPhotoError(err.message || '사진 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Effect to fetch the author of the active lightbox image from gallery table
  useEffect(() => {
    if (activeImageIndex === null || !albumImages[activeImageIndex]) {
      setActiveImageAuthorId(null);
      return;
    }

    const fetchAuthorId = async () => {
      try {
        const activeImageUrl = albumImages[activeImageIndex].image_url;
        const { data, error } = await supabase
          .from('gallery')
          .select('author_id')
          .eq('image_url', activeImageUrl)
          .maybeSingle();

        if (error) throw error;
        setActiveImageAuthorId(data ? data.author_id : null);
      } catch (err) {
        console.error('Error fetching image author:', err);
        setActiveImageAuthorId(null);
      }
    };

    fetchAuthorId();
  }, [activeImageIndex, albumImages]);

  const handleDeleteAlbum = async (albumId, e) => {
    if (e) e.stopPropagation(); // Prevent entering album detail when card delete is clicked
    
    if (!window.confirm('정말로 이 앨범을 삭제하시겠습니까?')) return;

    setDeletingAlbum(true);
    try {
      // Check if sub-photos exist
      const { data: images, error: checkError } = await supabase
        .from('album_images')
        .select('id')
        .eq('album_id', albumId);

      if (checkError) throw checkError;

      // Double confirmation if there are photos in the album
      if (images && images.length > 0) {
        if (!window.confirm('이 앨범에는 하위 사진들이 등록되어 있습니다. 앨범을 삭제하면 사진들도 함께 삭제됩니다. 정말로 삭제하시겠습니까?')) {
          setDeletingAlbum(false);
          return;
        }
      }

      const { error } = await supabase
        .from('albums')
        .delete()
        .eq('id', albumId);

      if (error) throw error;

      // Reset state if deleted the currently selected album
      if (selectedAlbum && selectedAlbum.id === albumId) {
        setSelectedAlbum(null);
        setAlbumImages([]);
      }
      fetchAlbums();
    } catch (err) {
      console.error('Error deleting album:', err);
      alert('앨범 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingAlbum(false);
    }
  };

  const handleDeleteAlbumImage = async (imageId) => {
    if (!window.confirm('정말로 이 사진을 앨범에서 삭제하시겠습니까?')) return;

    setDeletingImage(true);
    try {
      const { error } = await supabase
        .from('album_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      // Close lightbox and refresh album images
      setActiveImageIndex(null);
      fetchAlbumImages(selectedAlbum.id);
    } catch (err) {
      console.error('Error deleting album image:', err);
      alert('사진 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingImage(false);
    }
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '60px' }}>
      
      {!selectedAlbum ? (
        <>
          {/* Albums List Screen */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '35px' }}>
            <div>
              <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '4px', height: '24px', background: 'var(--accent-gradient)', borderRadius: '2px', display: 'inline-block' }} />
                앨범 관리
              </h2>
              <p style={{ color: 'var(--color-secondary)', fontSize: '15px' }}>
                소중한 추억들을 테마별로 정리하여 보관하세요.
              </p>
            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
              style={{ height: '44px', padding: '0 20px' }}
            >
              <FolderPlus size={18} />
              새 앨범 만들기
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: '15px', color: 'var(--color-secondary)' }}>앨범을 불러오는 중입니다...</p>
            </div>
          ) : albums.length === 0 ? (
            <div className="glass" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--color-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
              <div style={{ color: 'var(--color-secondary)' }}><BookOpen size={48} /></div>
              <h3>첫 번째 앨범을 만들어보세요</h3>
              <p style={{ maxWidth: '400px', fontSize: '14px', lineHeight: '1.6' }}>
                소중한 추억들을 테마별로 정리해보세요. 친구들과의 모임, 여행 일기를 앨범에 모아볼 수 있습니다.
              </p>
              <button onClick={() => setShowCreateModal(true)} className="btn btn-primary" style={{ padding: '10px 20px', minHeight: '44px' }}>
                첫 앨범 만들기
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '30px'
            }}>
              {albums.map((album) => (
                <div
                  key={album.id}
                  onClick={() => handleAlbumClick(album)}
                  style={{ cursor: 'pointer', position: 'relative' }}
                >
                  {/* Styled Book/Stack Album Card Effect */}
                  <div style={{ position: 'relative', width: '100%', paddingBottom: '125%', overflow: 'visible' }}>
                    {/* Back decorative stack sheet */}
                    <div style={{
                      position: 'absolute',
                      top: '-10px',
                      left: '8px',
                      right: '8px',
                      bottom: '10px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.04)',
                      borderRadius: '12px',
                      zIndex: 1
                    }} />
                    
                    {/* Middle decorative stack sheet */}
                    <div style={{
                      position: 'absolute',
                      top: '-5px',
                      left: '4px',
                      right: '4px',
                      bottom: '5px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '12px',
                      zIndex: 2
                    }} />

                    {/* Front Main cover book */}
                    <div className="glass" style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 3,
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      transition: 'var(--transition-smooth)'
                    }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-8px) rotate(-1deg)';
                        e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0) rotate(0)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      }}
                    >
                      {/* Album Cover Photo */}
                      <div style={{
                        flex: 1,
                        backgroundImage: `url(${album.cover_image_url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        position: 'relative'
                      }}>
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: '50%',
                          background: 'linear-gradient(to top, rgba(7,11,25,0.9) 0%, rgba(7,11,25,0) 100%)'
                        }} />
                      </div>

                      {/* Album Info */}
                      <div style={{ padding: '20px', background: 'rgba(7, 11, 25, 0.85)', minHeight: '100px', position: 'relative' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', paddingRight: (alumniProfile?.is_president || alumniProfile?.is_treasurer) ? '30px' : '0' }}>
                          {album.title}
                        </h3>
                        <p style={{ fontSize: '13px', color: 'var(--color-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: '1.4' }}>
                          {album.description || '작성된 설명이 없습니다.'}
                        </p>
                        {(alumniProfile?.is_president || alumniProfile?.is_treasurer) && (
                          <button
                            onClick={(e) => handleDeleteAlbum(album.id, e)}
                            disabled={deletingAlbum}
                            style={{
                              position: 'absolute',
                              right: '15px',
                              top: '20px',
                              background: 'transparent',
                              border: 'none',
                              color: 'rgba(239, 68, 68, 0.8)',
                              cursor: 'pointer',
                              padding: '4px',
                              zIndex: 10,
                              transition: 'var(--transition-smooth)'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-red)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(239, 68, 68, 0.8)'}
                            title="앨범 삭제"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Inside Album Screen */
        <div className="fade-in">
          {/* Navigation/Actions bar inside Album */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
            <button
              onClick={handleBackToAlbums}
              className="btn btn-secondary"
              style={{ padding: '8px 16px', minHeight: '38px', borderRadius: '10px' }}
            >
              <ChevronLeft size={16} />
              전체 앨범 목록
            </button>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleOpenAddPhotoModal}
                className="btn btn-secondary"
                style={{ padding: '8px 16px', minHeight: '38px', borderRadius: '10px', gap: '6px' }}
              >
                <Plus size={16} />
                갤러리에서 추가
              </button>
              <button
                onClick={() => setShowUploadPhotoModal(true)}
                className="btn btn-primary"
                style={{ padding: '8px 16px', minHeight: '38px', borderRadius: '10px', gap: '6px' }}
              >
                <UploadCloud size={16} />
                직접 사진 업로드
              </button>
            </div>
          </div>

          {/* Album Title/Desc Block */}
          <div className="glass" style={{ padding: '30px', marginBottom: '35px', display: 'flex', gap: '30px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{
              width: '120px',
              height: '150px',
              borderRadius: '8px',
              backgroundImage: `url(${selectedAlbum.cover_image_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: '1px solid rgba(255,255,255,0.1)',
              flexShrink: 0,
              boxShadow: 'var(--shadow-glow)'
            }} />
            <div>
              <h2 style={{ fontSize: '26px', fontWeight: '700', marginBottom: '8px' }}>{selectedAlbum.title}</h2>
              <p style={{ color: 'var(--color-secondary)', fontSize: '15px', lineHeight: '1.6', maxWidth: '600px' }}>
                {selectedAlbum.description || '등록된 설명이 없는 앨범입니다.'}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '15px' }}>
                <span style={{ fontSize: '12px', color: 'var(--accent-cyan)', fontWeight: '600' }}>
                  사진 수: {albumImages.length}장
                </span>
                {(alumniProfile?.is_president || alumniProfile?.is_treasurer) && (
                  <button
                    onClick={(e) => handleDeleteAlbum(selectedAlbum.id, e)}
                    disabled={deletingAlbum}
                    className="btn btn-secondary"
                    style={{
                      padding: '4px 12px',
                      minHeight: '30px',
                      fontSize: '12px',
                      borderRadius: '6px',
                      borderColor: 'rgba(239, 68, 68, 0.2)',
                      color: 'rgba(239, 68, 68, 0.8)',
                      gap: '4px'
                    }}
                  >
                    <Trash2 size={12} />
                    앨범 삭제
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Inside Album Photo Grid */}
          {loadingImages ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: '15px', color: 'var(--color-secondary)' }}>사진을 불러오는 중입니다...</p>
            </div>
          ) : albumImages.length === 0 ? (
            <div className="glass" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--color-secondary)' }}>
              앨범이 아직 비어 있습니다. 상단의 버튼들을 클릭하여 이 앨범에 추억 사진을 채워보세요!
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '20px'
            }}>
              {albumImages.map((image, index) => (
                <div
                  key={image.id}
                  className="glass"
                  onClick={() => setActiveImageIndex(index)}
                  style={{
                    paddingBottom: '100%',
                    position: 'relative',
                    backgroundImage: `url(${image.image_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    cursor: 'pointer',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    transition: 'var(--transition-smooth)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.03)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-neon)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 1. Create Album Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="glass modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700' }}>새 앨범 만들기</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {createError && (
              <div className="alert alert-error">
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAlbum}>
              <div className="input-group">
                <label className="input-label">앨범 제목</label>
                <input
                  type="text"
                  required
                  placeholder="예: 2026 봄 벚꽃 모임"
                  className="input-field"
                  value={albumTitle}
                  onChange={(e) => setAlbumTitle(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">앨범 설명 (선택)</label>
                <textarea
                  placeholder="앨범에 대한 간단한 설명을 적어주세요..."
                  className="input-field"
                  style={{ minHeight: '80px', resize: 'vertical', padding: '12px' }}
                  value={albumDesc}
                  onChange={(e) => setAlbumDesc(e.target.value)}
                />
              </div>

              {/* Cover Image Selector */}
              <div className="input-group">
                <label className="input-label">앨범 대표 커버 사진 (선택)</label>
                <div style={{
                  border: '2px dashed rgba(255,255,255,0.15)',
                  borderRadius: '12px',
                  padding: '24px 16px',
                  textAlign: 'center',
                  background: 'rgba(255,255,255,0.01)',
                  cursor: 'pointer',
                  position: 'relative'
                }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverFileChange}
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
                  <UploadCloud size={28} color="var(--accent-cyan)" style={{ marginBottom: '8px' }} />
                  <p style={{ fontSize: '14px', fontWeight: '600' }}>
                    {albumCoverFile ? albumCoverFile.name : '클릭하여 대표 사진을 설정하세요.'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '25px', justifySelf: 'stretch', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>취소</button>
                <button type="submit" disabled={creating} className="btn btn-primary">
                  {creating ? '생성 중...' : '앨범 생성'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Add Photo from Gallery Modal */}
      {showAddPhotoModal && (
        <div className="modal-overlay">
          <div className="glass modal-content" style={{ maxWidth: '750px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700' }}>갤러리에서 사진 가져오기</h3>
              <button onClick={() => setShowAddPhotoModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ color: 'var(--color-secondary)', fontSize: '14px', marginBottom: '20px' }}>
              현재 앨범에 추가되지 않은 갤러리 공유 사진들입니다. 추가할 사진을 모두 체크해 주세요.
            </p>

            {loadingGallery ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : galleryPhotos.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-secondary)' }}>
                가져올 수 있는 새 갤러리 사진이 없습니다.
              </div>
            ) : (
              <div style={{
                maxHeight: '400px',
                overflowY: 'auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: '12px',
                paddingRight: '6px',
                marginBottom: '20px'
              }}>
                {galleryPhotos.map((photo) => {
                  const isChecked = selectedGalleryPhotoIds.includes(photo.id);
                  return (
                    <div
                      key={photo.id}
                      onClick={() => handleToggleGallerySelection(photo.id)}
                      style={{
                        position: 'relative',
                        paddingBottom: '100%',
                        backgroundImage: `url(${photo.image_url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        cursor: 'pointer',
                        borderRadius: '8px',
                        border: isChecked ? '3px solid var(--accent-cyan)' : '1px solid rgba(255,255,255,0.1)',
                        opacity: isChecked ? 1 : 0.7,
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      {/* Checkbox indicator overlay */}
                      <div style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                        background: isChecked ? 'var(--accent-cyan)' : 'rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#070b19',
                        fontWeight: '700',
                        fontSize: '11px'
                      }}>
                        {isChecked ? '✓' : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifySelf: 'stretch', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '15px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddPhotoModal(false)}>취소</button>
              <button
                type="button"
                onClick={handleAddPhotosFromGallerySubmit}
                disabled={selectedGalleryPhotoIds.length === 0}
                className="btn btn-primary"
              >
                앨범에 사진 추가 ({selectedGalleryPhotoIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Direct Upload Photo to Album Modal */}
      {showUploadPhotoModal && (
        <div className="modal-overlay">
          <div className="glass modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700' }}>앨범 사진 업로드</h3>
              <button onClick={() => setShowUploadPhotoModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {uploadPhotoError && (
              <div className="alert alert-error">
                <span>{uploadPhotoError}</span>
              </div>
            )}

            <form onSubmit={handleUploadPhotoSubmit}>
              <div className="input-group">
                <label className="input-label">사진 파일 선택</label>
                <div style={{
                  border: '2px dashed rgba(255,255,255,0.15)',
                  borderRadius: '12px',
                  padding: '30px 20px',
                  textAlign: 'center',
                  background: 'rgba(255,255,255,0.01)',
                  cursor: 'pointer',
                  position: 'relative'
                }}>
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={handleAlbumPhotoFileChange}
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
                  <UploadCloud size={36} color="var(--accent-cyan)" style={{ marginBottom: '10px' }} />
                  <p style={{ fontSize: '15px', fontWeight: '600' }}>
                    {albumPhotoFile ? albumPhotoFile.name : '이곳을 클릭하여 사진을 올리세요.'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '25px', justifySelf: 'stretch', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowUploadPhotoModal(false)}>취소</button>
                <button type="submit" disabled={uploadingPhoto} className="btn btn-primary">
                  {uploadingPhoto ? '업로드 중...' : '업로드'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Inside-Album Photo Lightbox Slider */}
      {activeImageIndex !== null && (
        <div 
          className="modal-overlay" 
          onClick={handleCloseLightbox}
          style={{ background: 'rgba(0, 0, 0, 0.95)', overflow: 'hidden', touchAction: 'none' }}
        >
          <div 
            className="lightbox-wrapper" 
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'relative', width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            {/* Close */}
            <button
              onClick={handleCloseLightbox}
              style={{
                position: 'absolute',
                top: '-45px',
                right: '0',
                background: 'transparent',
                border: 'none',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              <X size={28} />
            </button>

            {/* Photo */}
            <img
              src={albumImages[activeImageIndex].image_url}
              alt="Album slide"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onDoubleClick={handleDoubleClick}
              style={{ 
                width: '100%', 
                maxHeight: '75vh', 
                objectFit: 'contain', 
                borderRadius: '8px',
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transition: scale === 1 ? 'transform 0.25s cubic-bezier(0.1, 0.76, 0.55, 0.94)' : 'none',
                cursor: scale > 1 ? 'grab' : 'zoom-in',
                userSelect: 'none',
                WebkitUserDrag: 'none',
                touchAction: 'none'
              }}
            />

            {/* Slider arrows navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '20px', gap: '20px' }}>
              <button
                disabled={activeImageIndex === 0}
                onClick={() => setActiveImageIndex(prev => prev - 1)}
                className="btn btn-secondary"
                style={{ padding: '8px 16px', flex: 1, minHeight: '38px', opacity: activeImageIndex === 0 ? 0.3 : 1 }}
              >
                이전 사진
              </button>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', alignSelf: 'center' }}>
                <span style={{ fontSize: '14px', color: 'var(--color-secondary)' }}>
                  {activeImageIndex + 1} / {albumImages.length}
                </span>

                {/* KakaoTalk Share Button */}
                <button
                  onClick={() => shareImageToKakao(albumImages[activeImageIndex], 'album')}
                  style={{
                    background: '#fee500',
                    color: '#1e293b',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 4px rgba(254, 229, 0, 0.15)',
                    transition: 'var(--transition-smooth)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3c-5.52 0-10 3.73-10 8.33 0 2.98 1.87 5.58 4.7 6.96-.34 1.28-1.23 4.54-1.26 4.67-.04.16.05.3.2.22.11-.06 1.83-1.24 3.7-2.52.84.23 1.73.37 2.66.37 5.52 0 10-3.73 10-8.33S17.52 3 12 3z"/>
                  </svg>
                  카톡 보내기
                </button>

                {(alumniProfile?.is_president || 
                  alumniProfile?.is_treasurer || 
                  (activeImageAuthorId && activeImageAuthorId === alumniProfile?.id)) && (
                  <button
                    onClick={() => handleDeleteAlbumImage(albumImages[activeImageIndex].id)}
                    disabled={deletingImage}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'rgba(239, 68, 68, 0.8)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      transition: 'var(--transition-smooth)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--accent-red)';
                      e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'rgba(239, 68, 68, 0.8)';
                      e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                    }}
                  >
                    <Trash2 size={12} />
                    사진 삭제
                  </button>
                )}
              </div>
              <button
                disabled={activeImageIndex === albumImages.length - 1}
                onClick={() => setActiveImageIndex(prev => prev + 1)}
                className="btn btn-secondary"
                style={{ padding: '8px 16px', flex: 1, minHeight: '38px', opacity: activeImageIndex === albumImages.length - 1 ? 0.3 : 1 }}
              >
                다음 사진
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
