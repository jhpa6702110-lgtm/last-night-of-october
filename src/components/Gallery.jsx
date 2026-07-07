import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Search, Plus, ThumbsUp, Eye, MessageSquare, X, UploadCloud, MessageCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

const isVideoUrl = (url) => {
  if (!url) return false;
  if (url.startsWith('data:video/')) return true;
  const extensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
  return extensions.some(ext => url.toLowerCase().includes(ext));
};

export default function Gallery({ session, alumniProfile }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('전체');
  
  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  
  // Upload form state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Comment form state
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyToId, setReplyToId] = useState(null); // Parent comment ID for replies
  const [replyText, setReplyText] = useState('');

  // Edit post state
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editPostTitle, setEditPostTitle] = useState('');
  const [editPostDesc, setEditPostDesc] = useState('');
  const [editPostTags, setEditPostTags] = useState('');
  const [updatingPost, setUpdatingPost] = useState(false);

  // Edit comment state
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  // Calculate tag frequencies dynamically from posts
  const getDynamicTags = () => {
    const counts = {};
    posts.forEach(post => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => {
          const trimmed = tag.trim();
          if (trimmed) {
            counts[trimmed] = (counts[trimmed] || 0) + 1;
          }
        });
      }
    });

    // Convert to sorted array of objects [{ name: '업로드', count: 29 }, ...]
    const sortedTags = Object.keys(counts)
      .map(name => ({ name, count: counts[name] }))
      .sort((a, b) => b.count - a.count); // Sort descending by count

    return [
      { name: '전체', count: posts.length },
      ...sortedTags
    ];
  };

  const dynamicTags = getDynamicTags();

  const triggerConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 }
    });
  };

  const fetchPosts = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error('Error fetching gallery posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Fetch comments when a post is opened
  useEffect(() => {
    if (!selectedPost) {
      setComments([]);
      setIsEditingPost(false);
      return;
    }

    const fetchComments = async () => {
      try {
        const { data, error } = await supabase
          .from('comments')
          .select('*')
          .eq('post_id', selectedPost.id)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setComments(data || []);
      } catch (err) {
        console.error('Error fetching comments:', err);
      }
    };

    fetchComments();
    
    // Increment view count
    const incrementView = async () => {
      try {
        await supabase
          .from('gallery')
          .update({ views_count: (selectedPost.views_count || 0) + 1 })
          .eq('id', selectedPost.id);
        
        // Update local state views count
        setPosts(prev => prev.map(p => p.id === selectedPost.id ? { ...p, views_count: (p.views_count || 0) + 1 } : p));
      } catch (err) {
        console.error('Error incrementing views:', err);
      }
    };
    
    incrementView();
  }, [selectedPost]);

  const handleLike = async (postId, e) => {
    e.stopPropagation(); // Prevent opening lightbox
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      const { error } = await supabase
        .from('gallery')
        .update({ likes_count: (post.likes_count || 0) + 1 })
        .eq('id', postId);

      if (error) throw error;

      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: (p.likes_count || 0) + 1 } : p));
      
      // If the post is currently open in lightbox, update its likes count too
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost(prev => ({ ...prev, likes_count: (prev.likes_count || 0) + 1 }));
      }
      
      triggerConfetti();
    } catch (err) {
      console.error('Error liking post:', err);
    }
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
              // Extract original extension or default to jpg
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

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const originalFile = e.target.files[0];
      setUploadFile(originalFile); // Display filename immediately

      // Compress asynchronously
      const compressed = await compressImage(originalFile);
      setUploadFile(compressed);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('파일을 선택해 주세요.');
      return;
    }
    setUploading(true);
    setUploadError('');

    try {
      let imageUrl = '';
      
      // Convert tags text to array
      const tagsArray = uploadTags
        .split(',')
        .map(t => t.trim().replace('#', ''))
        .filter(t => t.length > 0);
      
      if (tagsArray.length === 0) tagsArray.push('업로드');

      // Helper function to convert file to Base64
      const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result);
          reader.onerror = (error) => reject(error);
        });
      };

      try {
        // Method A: Try uploading to Supabase Storage bucket 'gallery'
        const fileExt = uploadFile.name.split('.').pop();
        // Generate an ASCII-safe filename using timestamp and random string
        const safeName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const filePath = `${safeName}`;

        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('gallery')
          .upload(filePath, uploadFile, { cacheControl: '3600', upsert: true });

        if (uploadErr) {
          console.warn('Storage upload failed, falling back to Base64 direct DB storage:', uploadErr);
          throw uploadErr; // Trigger fallback
        }

        const { data: { publicUrl } } = supabase.storage
          .from('gallery')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      } catch (storageErr) {
        // Method B Fallback: Convert to base64 and write directly to database
        const base64Data = await convertToBase64(uploadFile);
        imageUrl = base64Data;
      }

      // Save record in 'gallery' table
      const { data, error: dbError } = await supabase
        .from('gallery')
        .insert({
          title: uploadTitle,
          description: uploadDesc,
          image_url: imageUrl,
          tags: tagsArray,
          author_id: alumniProfile?.id || null,
          author_name: alumniProfile?.name || '익명',
          likes_count: 0,
          views_count: 0
        })
        .select();

      if (dbError) throw dbError;

      triggerConfetti();
      setShowUploadModal(false);
      
      // Reset form
      setUploadTitle('');
      setUploadDesc('');
      setUploadTags('');
      setUploadFile(null);
      
      // Refresh list
      fetchPosts();
    } catch (err) {
      setUploadError(err.message || '사진 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleStartEditPost = () => {
    if (!selectedPost) return;
    setEditPostTitle(selectedPost.title);
    setEditPostDesc(selectedPost.description || '');
    setEditPostTags((selectedPost.tags || []).join(', '));
    setIsEditingPost(true);
  };

  const handleEditPostSubmit = async (e) => {
    e.preventDefault();
    if (!editPostTitle.trim()) return;
    setUpdatingPost(true);
    try {
      const tagsArray = editPostTags
        .split(',')
        .map(t => t.trim().replace('#', ''))
        .filter(t => t.length > 0);
      
      if (tagsArray.length === 0) tagsArray.push('업로드');

      const { data, error } = await supabase
        .from('gallery')
        .update({
          title: editPostTitle.trim(),
          description: editPostDesc.trim(),
          tags: tagsArray
        })
        .eq('id', selectedPost.id)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setPosts(prev => prev.map(p => p.id === selectedPost.id ? { ...p, title: data.title, description: data.description, tags: data.tags } : p));
      setSelectedPost(data);
      setIsEditingPost(false);
      triggerConfetti();
    } catch (err) {
      console.error('Error updating post:', err);
      alert('게시글 수정 중 오류가 발생했습니다.');
    } finally {
      setUpdatingPost(false);
    }
  };

  const handleDeletePost = async () => {
    if (!selectedPost) return;
    if (!window.confirm('정말로 이 사진을 삭제하시겠습니까? 이 사진에 작성된 모든 댓글도 함께 삭제됩니다.')) return;
    
    try {
      const { error } = await supabase
        .from('gallery')
        .delete()
        .eq('id', selectedPost.id);

      if (error) throw error;

      // Reset states
      setSelectedPost(null);
      setIsEditingPost(false);
      fetchPosts();
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('게시글 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleEditCommentSubmit = async (commentId) => {
    if (!editingCommentText.trim()) return;
    try {
      const { error } = await supabase
        .from('comments')
        .update({ content: editingCommentText.trim() })
        .eq('id', commentId);

      if (error) throw error;

      setComments(prev => prev.map(c => c.id === commentId ? { ...c, content: editingCommentText.trim() } : c));
      setEditingCommentId(null);
      setEditingCommentText('');
    } catch (err) {
      console.error('Error updating comment:', err);
      alert('댓글 수정 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('정말로 이 댓글을 삭제하시겠습니까?')) return;
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      console.error('Error deleting comment:', err);
      alert('댓글 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleAddComment = async (e, parentId = null) => {
    e.preventDefault();
    const content = parentId ? replyText : newCommentText;
    if (!content.trim()) return;

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: selectedPost.id,
          parent_id: parentId,
          content: content.trim(),
          author_id: alumniProfile?.id || null,
          author_name: alumniProfile?.name || '익명'
        })
        .select();

      if (error) throw error;

      // Append new comment
      setComments(prev => [...prev, ...data]);
      
      // Clear forms
      if (parentId) {
        setReplyText('');
        setReplyToId(null);
      } else {
        setNewCommentText('');
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  // Filter posts based on search query and selected tag
  const filteredPosts = posts.filter(post => {
    const matchesSearch = 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTag = 
      selectedTag === '전체' || 
      (post.tags && post.tags.includes(selectedTag));

    return matchesSearch && matchesTag;
  });

  // Helper to structure comments and replies (hierarchical nested render)
  const renderCommentTree = (parentId = null, depth = 0) => {
    const levelComments = comments.filter(c => c.parent_id === parentId);
    
    return levelComments.map(comment => (
      <div 
        key={comment.id} 
        style={{ 
          marginLeft: `${depth * 25}px`,
          padding: '12px 16px',
          borderLeft: depth > 0 ? '2px solid rgba(255, 255, 255, 0.08)' : 'none',
          background: 'rgba(255, 255, 255, 0.01)',
          borderRadius: '8px',
          marginBottom: '10px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--accent-cyan)' }}>
            {comment.author_name}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>
            {new Date(comment.created_at).toLocaleDateString()}
          </span>
        </div>
        {editingCommentId === comment.id ? (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleEditCommentSubmit(comment.id);
            }}
            style={{ display: 'flex', gap: '8px', marginTop: '8px', width: '100%' }}
          >
            <input
              type="text"
              required
              className="input-field"
              style={{ minHeight: '36px', height: '36px', fontSize: '13px', padding: '6px 12px', flex: 1 }}
              value={editingCommentText}
              onChange={(e) => setEditingCommentText(e.target.value)}
            />
            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ minHeight: '36px', height: '36px', padding: '0 12px', fontSize: '13px' }}
            >
              저장
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => {
                setEditingCommentId(null);
                setEditingCommentText('');
              }}
              style={{ minHeight: '36px', height: '36px', padding: '0 12px', fontSize: '13px' }}
            >
              취소
            </button>
          </form>
        ) : (
          <p style={{ fontSize: '14px', lineHeight: '1.5', color: '#e2e8f0' }}>{comment.content}</p>
        )}
        
        {/* Comment actions panel */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '6px', alignItems: 'center' }}>
          {/* Reply trigger button */}
          {depth < 2 && editingCommentId !== comment.id && ( // Limit depth of replies
            <button
              onClick={() => {
                setReplyToId(comment.id);
                setReplyText('');
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-secondary)',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <MessageCircle size={12} />
              답글 달기
            </button>
          )}

          {editingCommentId !== comment.id && (comment.author_id === alumniProfile?.id || alumniProfile?.is_president || alumniProfile?.is_treasurer) && (
            <>
              <button
                onClick={() => {
                  setEditingCommentId(comment.id);
                  setEditingCommentText(comment.content);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-secondary)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                편집
              </button>
              <button
                onClick={() => handleDeleteComment(comment.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(239, 68, 68, 0.8)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                삭제
              </button>
            </>
          )}
        </div>

        {/* Reply Input Form */}
        {replyToId === comment.id && (
          <form 
            onSubmit={(e) => handleAddComment(e, comment.id)}
            style={{ display: 'flex', gap: '8px', marginTop: '8px', width: '100%' }}
          >
            <input
              type="text"
              required
              placeholder="답글을 입력하세요..."
              className="input-field"
              style={{ minHeight: '36px', height: '36px', fontSize: '13px', padding: '6px 12px', flex: 1 }}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ minHeight: '36px', height: '36px', padding: '0 12px', fontSize: '13px' }}
            >
              등록
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => setReplyToId(null)}
              style={{ minHeight: '36px', height: '36px', padding: '0 12px', fontSize: '13px' }}
            >
              취소
            </button>
          </form>
        )}

        {/* Recursive render for child replies */}
        {renderCommentTree(comment.id, depth + 1)}
      </div>
    ));
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '60px' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '35px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ width: '4px', height: '24px', background: 'var(--accent-gradient)', borderRadius: '2px', display: 'inline-block' }} />
            소셜 갤러리
          </h2>
          <p style={{ color: 'var(--color-secondary)', fontSize: '15px' }}>
            친구들과 소중한 추억을 공유하고, 댓글과 좋아요로 소통하세요.
          </p>
        </div>
        
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn btn-primary"
          style={{ height: '44px', padding: '0 20px' }}
        >
          <Plus size={18} />
          미디어 업로드
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass" style={{ padding: '20px', marginBottom: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={18} color="var(--color-secondary)" style={{ position: 'absolute', left: '16px', top: '13px' }} />
          <input
            type="text"
            placeholder="사진 제목, 설명, 작성자 검색..."
            className="input-field"
            style={{ paddingLeft: '48px', minHeight: '44px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Tag pills */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', whiteSpace: 'nowrap' }}>
          {dynamicTags.map((tagObj) => (
            <button
              key={tagObj.name}
              onClick={() => setSelectedTag(tagObj.name)}
              style={{
                background: selectedTag === tagObj.name ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.04)',
                color: selectedTag === tagObj.name ? '#070b19' : 'var(--color-secondary)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '50px',
                padding: '6px 16px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'var(--transition-smooth)'
              }}
            >
              #{tagObj.name} ({tagObj.count})
            </button>
          ))}
        </div>
      </div>

      {/* Gallery Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '15px', color: 'var(--color-secondary)' }}>갤러리를 불러오는 중입니다...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="glass" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--color-secondary)' }}>
          조건에 부합하는 사진이 없습니다. 첫 번째 예쁜 추억을 공유해 보세요!
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '25px'
        }}>
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="glass"
              onClick={() => setSelectedPost(post)}
              style={{
                overflow: 'hidden',
                cursor: 'pointer',
                borderRadius: '16px',
                transition: 'var(--transition-smooth)',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              }}
            >
              {/* Photo */}
              <div style={{
                width: '100%',
                paddingBottom: '70%',
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: 'rgba(0,0,0,0.1)'
              }}>
                {isVideoUrl(post.image_url) ? (
                  <video
                    src={post.image_url}
                    muted
                    loop
                    playsInline
                    autoPlay
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url(${post.image_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }} />
                )}
              </div>

              {/* Tags inside card overlay */}
              <div style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                display: 'flex',
                gap: '4px',
                flexWrap: 'wrap'
              }}>
                {(post.tags || []).slice(0, 2).map((t) => (
                  <span key={t} style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    background: 'rgba(7, 11, 25, 0.75)',
                    color: 'var(--accent-cyan)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: '1px solid rgba(34, 211, 238, 0.2)'
                  }}>
                    #{t}
                  </span>
                ))}
              </div>

              {/* Content info */}
              <div style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '6px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {post.title}
                </h3>
                <span style={{ fontSize: '13px', color: 'var(--color-secondary)', display: 'block', marginBottom: '15px' }}>
                  작성자: {post.author_name}
                </span>

                {/* Footer buttons / stats */}
                <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-secondary)' }}>
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--color-secondary)' }}>
                      <Eye size={14} />
                      {post.views_count || 0}
                    </span>
                    
                    <button
                      onClick={(e) => handleLike(post.id, e)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '13px',
                        transition: 'var(--transition-smooth)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-cyan)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-secondary)'}
                    >
                      <ThumbsUp size={14} />
                      {post.likes_count || 0}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Media Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="glass modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700' }}>미디어 업로드</h3>
              <button 
                onClick={() => setShowUploadModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {uploadError && (
              <div className="alert alert-error">
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit}>
              {/* Image Uploader Selector box */}
              <div className="input-group">
                <label className="input-label">추억 사진 파일 선택</label>
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
                    accept="image/*,video/*"
                    required
                    onChange={handleFileChange}
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
                    {uploadFile ? uploadFile.name : '이곳을 클릭하거나 파일을 끌어다 놓으세요.'}
                  </p>
                  <span style={{ fontSize: '12px', color: 'var(--color-secondary)', marginTop: '6px', display: 'block' }}>
                    이미지 및 동영상 파일 지원 (최대 30MB)
                  </span>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">제목</label>
                <input
                  type="text"
                  required
                  placeholder="예: 제주도 가을 여행 맛집 앞에서"
                  className="input-field"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">설명</label>
                <textarea
                  placeholder="추억에 관한 설명을 적어보세요..."
                  className="input-field"
                  style={{ minHeight: '100px', resize: 'vertical', padding: '12px' }}
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">태그 (쉼표로 구분)</label>
                <input
                  type="text"
                  placeholder="예: 제주도, 여행, 친구 (기본: 업로드)"
                  className="input-field"
                  value={uploadTags}
                  onChange={(e) => setUploadTags(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '25px', justifySelf: 'stretch', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowUploadModal(false)}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="btn btn-primary"
                >
                  {uploading ? '업로드 중...' : '업로드 완료'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox / Post Detail View Modal */}
      {selectedPost && (
        <div className="modal-overlay" onClick={() => setSelectedPost(null)}>
          <div 
            className="glass modal-content" 
            onClick={(e) => e.stopPropagation()} // Prevent close
            style={{ maxWidth: '900px', width: '100%', padding: '0', overflow: 'hidden' }}
          >
            {/* Split layout: Photo on left/top, Comments on right/bottom */}
            <div className="detail-modal-layout">
              {/* Photo Area */}
              <div style={{
                background: '#040710',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                flex: 1.2
              }}>
                {isVideoUrl(selectedPost.image_url) ? (
                  <video 
                    src={selectedPost.image_url} 
                    controls
                    autoPlay
                    playsInline
                    style={{ width: '100%', maxHeight: '550px', objectFit: 'contain', display: 'block', outline: 'none' }}
                  />
                ) : (
                  <img 
                    src={selectedPost.image_url} 
                    alt={selectedPost.title}
                    style={{ width: '100%', maxHeight: '550px', objectFit: 'contain', display: 'block' }}
                  />
                )}
                
                {/* Close Button on Image */}
                <button
                  onClick={() => setSelectedPost(null)}
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: 'rgba(0,0,0,0.5)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    cursor: 'pointer',
                    zIndex: 10
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Interaction Details Area */}
              <div style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                height: '550px',
                flex: 1,
                borderLeft: '1px solid rgba(255,255,255,0.06)'
              }}>
                <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px', display: 'flex', flexDirection: 'column' }}>
                  {isEditingPost ? (
                    <form onSubmit={handleEditPostSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <div className="input-group" style={{ marginBottom: '0' }}>
                        <label className="input-label" style={{ fontSize: '12px' }}>제목</label>
                        <input
                          type="text"
                          required
                          className="input-field"
                          style={{ minHeight: '38px', height: '38px', fontSize: '14px', padding: '6px 12px' }}
                          value={editPostTitle}
                          onChange={(e) => setEditPostTitle(e.target.value)}
                        />
                      </div>

                      <div className="input-group" style={{ marginBottom: '0' }}>
                        <label className="input-label" style={{ fontSize: '12px' }}>태그 (쉼표로 구분)</label>
                        <input
                          type="text"
                          className="input-field"
                          style={{ minHeight: '38px', height: '38px', fontSize: '14px', padding: '6px 12px' }}
                          value={editPostTags}
                          onChange={(e) => setEditPostTags(e.target.value)}
                        />
                      </div>

                      <div className="input-group" style={{ marginBottom: '0' }}>
                        <label className="input-label" style={{ fontSize: '12px' }}>설명</label>
                        <textarea
                          className="input-field"
                          style={{ minHeight: '100px', fontSize: '14px', padding: '8px 12px', resize: 'vertical' }}
                          value={editPostDesc}
                          onChange={(e) => setEditPostDesc(e.target.value)}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '10px', alignSelf: 'flex-end', marginTop: '5px' }}>
                        <button 
                          type="button" 
                          className="btn btn-secondary" 
                          onClick={() => setIsEditingPost(false)}
                          style={{ minHeight: '34px', height: '34px', padding: '0 12px', fontSize: '13px' }}
                        >
                          취소
                        </button>
                        <button 
                          type="submit" 
                          disabled={updatingPost} 
                          className="btn btn-primary"
                          style={{ minHeight: '34px', height: '34px', padding: '0 12px', fontSize: '13px' }}
                        >
                          {updatingPost ? '저장 중...' : '저장 완료'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      {/* Header Title */}
                      <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
                        {selectedPost.title}
                      </h3>
                      
                      {/* Tags */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '15px' }}>
                        {(selectedPost.tags || []).map(t => (
                          <span key={t} style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: '600' }}>#{t}</span>
                        ))}
                      </div>

                      {/* Metadata */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: 'var(--color-secondary)', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '16px' }}>
                        <div>
                          <span>작성자: <strong style={{ color: 'var(--color-primary)' }}>{selectedPost.author_name}</strong></span>
                          <span style={{ marginLeft: '12px' }}>{new Date(selectedPost.created_at).toLocaleDateString()}</span>
                        </div>
                        
                        {((alumniProfile?.id && selectedPost.author_id === alumniProfile.id) || alumniProfile?.is_president || alumniProfile?.is_treasurer) && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={handleStartEditPost}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--color-secondary)',
                                fontSize: '12px',
                                cursor: 'pointer',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                border: '1px solid rgba(255,255,255,0.1)'
                              }}
                            >
                              편집
                            </button>
                            <button
                              onClick={handleDeletePost}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'rgba(239, 68, 68, 0.8)',
                                fontSize: '12px',
                                cursor: 'pointer',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                border: '1px solid rgba(239,68,68,0.2)'
                              }}
                            >
                              삭제
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      {selectedPost.description && (
                        <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#cbd5e1', marginBottom: '24px', whiteSpace: 'pre-wrap' }}>
                          {selectedPost.description}
                        </p>
                      )}
                    </>
                  )}

                  {/* Comments Section */}
                  <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MessageSquare size={16} />
                    댓글 ({comments.length})
                  </h4>

                  {comments.length === 0 ? (
                    <p style={{ color: 'var(--color-secondary)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
                      첫 번째 댓글을 달아 소통해 보세요!
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {renderCommentTree(null)}
                    </div>
                  )}
                </div>

                {/* Interaction Footer Stats & Comment Input */}
                <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', gap: '15px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--color-secondary)' }}>
                        <Eye size={14} />
                        {selectedPost.views_count}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleLike(selectedPost.id, e)}
                      className="btn btn-secondary"
                      style={{
                        padding: '6px 12px',
                        minHeight: '32px',
                        fontSize: '13px',
                        borderRadius: '8px',
                        gap: '6px'
                      }}
                    >
                      <ThumbsUp size={14} />
                      좋아요 ({selectedPost.likes_count})
                    </button>
                  </div>

                  {/* Main Comment Input Form */}
                  <form onSubmit={(e) => handleAddComment(e, null)} style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      required
                      placeholder="댓글을 남겨주세요..."
                      className="input-field"
                      style={{ minHeight: '38px', height: '38px', fontSize: '14px', padding: '6px 12px', flex: 1 }}
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                    />
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      style={{ minHeight: '38px', height: '38px', padding: '0 16px', fontSize: '14px' }}
                    >
                      등록
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Custom Responsive Styles for Detail Modal */}
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
              .detail-modal-layout {
                display: flex;
                flex-direction: row;
                width: 100%;
              }
              @media (max-width: 768px) {
                .detail-modal-layout {
                  flex-direction: column;
                }
                .detail-modal-layout > div {
                  height: auto !important;
                  border-left: none !important;
                }
                .detail-modal-layout img {
                  max-height: 300px !important;
                }
              }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
}
