import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Search, Plus, X, Eye, MessageSquare, MessageCircle, Megaphone, FileText, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { shareBoardToKakao } from '../utils/kakaoShare';

export default function Board({ session, alumniProfile, onAwardActivityPoint }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'notice', 'general'
  
  // Modals
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  
  // Write form state
  const [writeTitle, setWriteTitle] = useState('');
  const [writeContent, setWriteContent] = useState('');
  const [writeIsNotice, setWriteIsNotice] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [writeError, setWriteError] = useState('');

  // Comment form state
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyToId, setReplyToId] = useState(null); // Parent comment ID for replies
  const [replyText, setReplyText] = useState('');

  // Edit post state
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editIsNotice, setEditIsNotice] = useState(false);
  const [updatingPost, setUpdatingPost] = useState(false);

  // Edit comment state
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  const isManager = alumniProfile?.is_president || alumniProfile?.is_treasurer;

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const fetchPosts = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('board')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error('Error fetching board posts:', err);
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
          .from('board_comments')
          .select('*')
          .eq('board_id', selectedPost.id)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setComments(data || []);
      } catch (err) {
        console.error('Error fetching board comments:', err);
      }
    };

    fetchComments();
    
    // Increment view count
    const incrementView = async () => {
      try {
        await supabase
          .from('board')
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

  // Reset write form states when modal is closed
  useEffect(() => {
    if (!showWriteModal) {
      setWriteTitle('');
      setWriteContent('');
      setWriteIsNotice(false);
      setWriteError('');
    }
  }, [showWriteModal]);

  const handleWriteSubmit = async (e) => {
    e.preventDefault();
    if (!writeTitle.trim() || !writeContent.trim()) {
      setWriteError('제목과 내용을 모두 기입해 주세요.');
      return;
    }
    setSubmitting(true);
    setWriteError('');

    try {
      const { data, error } = await supabase
        .from('board')
        .insert({
          title: writeTitle.trim(),
          content: writeContent.trim(),
          is_notice: writeIsNotice && isManager, // Checkbox values only if manager
          author_id: alumniProfile?.id || null,
          author_name: alumniProfile?.name || '익명',
          views_count: 0
        })
        .select();

      if (error) throw error;

      triggerConfetti();
      setShowWriteModal(false);
      
      // Award point for activity (Board write = +1 point)
      if (onAwardActivityPoint) {
        await onAwardActivityPoint('게시판 글 작성');
      }

      fetchPosts();
    } catch (err) {
      setWriteError(err.message || '글 등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEditPost = () => {
    if (!selectedPost) return;
    setEditTitle(selectedPost.title);
    setEditContent(selectedPost.content);
    setEditIsNotice(selectedPost.is_notice);
    setIsEditingPost(true);
  };

  const handleEditPostSubmit = async (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editContent.trim()) return;
    setUpdatingPost(true);
    try {
      const { data, error } = await supabase
        .from('board')
        .update({
          title: editTitle.trim(),
          content: editContent.trim(),
          is_notice: editIsNotice && isManager // Only manager can toggle notice status
        })
        .eq('id', selectedPost.id)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setPosts(prev => prev.map(p => p.id === selectedPost.id ? { ...p, title: data.title, content: data.content, is_notice: data.is_notice } : p));
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
    if (!window.confirm('정말로 이 게시글을 삭제하시겠습니까? 이 글에 달린 모든 댓글도 삭제됩니다.')) return;
    
    try {
      const { error } = await supabase
        .from('board')
        .delete()
        .eq('id', selectedPost.id);

      if (error) throw error;

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
        .from('board_comments')
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
        .from('board_comments')
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
        .from('board_comments')
        .insert({
          board_id: selectedPost.id,
          parent_id: parentId,
          content: content.trim(),
          author_id: alumniProfile?.id || null,
          author_name: alumniProfile?.name || '익명'
        })
        .select();

      if (error) throw error;

      setComments(prev => [...prev, ...data]);
      
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

  // Filter & Search logic
  const filteredPosts = posts.filter(post => {
    const matchesSearch = 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeFilter === 'notice') return matchesSearch && post.is_notice;
    if (activeFilter === 'general') return matchesSearch && !post.is_notice;
    return matchesSearch;
  });

  // Sort: Notices first, then by date descending
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (a.is_notice && !b.is_notice) return -1;
    if (!a.is_notice && b.is_notice) return 1;
    return new Date(b.created_at) - new Date(a.created_at);
  });

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
        
        <div style={{ display: 'flex', gap: '12px', marginTop: '6px', alignItems: 'center' }}>
          {depth < 2 && editingCommentId !== comment.id && (
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

          {editingCommentId !== comment.id && (comment.author_id === alumniProfile?.id || isManager) && (
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
                  cursor: 'pointer'
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
                  cursor: 'pointer'
                }}
              >
                삭제
              </button>
            </>
          )}
        </div>

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
            소통 게시판
          </h2>
          <p style={{ color: 'var(--color-secondary)', fontSize: '15px' }}>
            공지사항과 동호회 소식 및 업데이트 현황을 확인하고 자유롭게 글을 남겨보세요.
          </p>
        </div>
        
        <button
          onClick={() => setShowWriteModal(true)}
          className="btn btn-primary"
          style={{ height: '44px', padding: '0 20px' }}
        >
          <Plus size={18} />
          새 글 쓰기 (+1 XP)
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass" style={{ padding: '20px', marginBottom: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={18} color="var(--color-secondary)" style={{ position: 'absolute', left: '16px', top: '13px' }} />
          <input
            type="text"
            placeholder="글 제목, 내용, 작성자 검색..."
            className="input-field"
            style={{ paddingLeft: '48px', minHeight: '44px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Tab pills */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveFilter('all')}
            style={{
              background: activeFilter === 'all' ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.04)',
              color: activeFilter === 'all' ? '#070b19' : 'var(--color-secondary)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '50px',
              padding: '6px 18px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'var(--transition-smooth)'
            }}
          >
            전체글 ({posts.length})
          </button>
          <button
            onClick={() => setActiveFilter('notice')}
            style={{
              background: activeFilter === 'notice' ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.04)',
              color: activeFilter === 'notice' ? '#070b19' : 'var(--color-secondary)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '50px',
              padding: '6px 18px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'var(--transition-smooth)'
            }}
          >
            공지사항 ({posts.filter(p => p.is_notice).length})
          </button>
          <button
            onClick={() => setActiveFilter('general')}
            style={{
              background: activeFilter === 'general' ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.04)',
              color: activeFilter === 'general' ? '#070b19' : 'var(--color-secondary)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '50px',
              padding: '6px 18px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'var(--transition-smooth)'
            }}
          >
            자유글 ({posts.filter(p => !p.is_notice).length})
          </button>
        </div>
      </div>

      {/* Board Post Table List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '15px', color: 'var(--color-secondary)' }}>게시판을 불러오는 중입니다...</p>
        </div>
      ) : sortedPosts.length === 0 ? (
        <div className="glass" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--color-secondary)' }}>
          등록된 게시글이 없습니다. 첫 글을 작성하여 이야기를 공유해보세요!
        </div>
      ) : (
        <div className="glass" style={{ padding: '10px 0', overflowX: 'auto', borderRadius: '16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <th style={{ padding: '16px 20px', color: 'var(--color-secondary)', fontSize: '14px', width: '80px' }}>유형</th>
                <th style={{ padding: '16px 20px', color: 'var(--color-secondary)', fontSize: '14px' }}>제목</th>
                <th style={{ padding: '16px 20px', color: 'var(--color-secondary)', fontSize: '14px', width: '120px' }}>작성자</th>
                <th style={{ padding: '16px 20px', color: 'var(--color-secondary)', fontSize: '14px', width: '120px' }}>작성일</th>
                <th style={{ padding: '16px 20px', color: 'var(--color-secondary)', fontSize: '14px', width: '80px' }}>조회</th>
              </tr>
            </thead>
            <tbody>
              {sortedPosts.map((post) => (
                <tr 
                  key={post.id} 
                  onClick={() => setSelectedPost(post)}
                  style={{ 
                    borderBottom: '1px solid rgba(255,255,255,0.04)', 
                    cursor: 'pointer',
                    background: post.is_notice ? 'rgba(6, 182, 212, 0.03)' : 'transparent',
                    transition: 'var(--transition-smooth)'
                  }}
                  className="post-row"
                >
                  <td style={{ padding: '16px 20px' }}>
                    {post.is_notice ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                        color: '#070b19',
                        background: 'var(--accent-gradient)',
                        padding: '3px 8px',
                        borderRadius: '4px'
                      }}>
                        <Megaphone size={11} />
                        공지
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: '500',
                        color: 'var(--color-secondary)',
                        background: 'rgba(255,255,255,0.03)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: '1px solid rgba(255,255,255,0.06)'
                      }}>
                        <FileText size={11} />
                        자유
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: post.is_notice ? '600' : 'normal' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ 
                        color: post.is_notice ? 'var(--accent-cyan)' : 'var(--color-primary)', 
                        textOverflow: 'ellipsis', 
                        overflow: 'hidden', 
                        whiteSpace: 'nowrap',
                        maxWidth: '350px' 
                      }}>
                        {post.title}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '14px', color: 'var(--color-secondary)' }}>{post.author_name}</td>
                  <td style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--color-secondary)' }}>
                    {new Date(post.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--color-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Eye size={12} />
                      {post.views_count || 0}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <style>{`
            .post-row:hover {
              background: rgba(255, 255, 255, 0.02) !important;
            }
          `}</style>
        </div>
      )}

      {/* Write New Post Modal */}
      {showWriteModal && (
        <div className="modal-overlay">
          <div className="glass modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700' }}>새 게시글 쓰기</h3>
              <button 
                onClick={() => setShowWriteModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {writeError && (
              <div className="alert alert-error">
                <span>{writeError}</span>
              </div>
            )}

            <form onSubmit={handleWriteSubmit}>
              <div className="input-group">
                <label className="input-label">제목</label>
                <input
                  type="text"
                  required
                  placeholder="제목을 입력하세요..."
                  className="input-field"
                  value={writeTitle}
                  onChange={(e) => setWriteTitle(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">내용</label>
                <textarea
                  required
                  placeholder="이곳에 내용을 작성해 주세요..."
                  className="input-field"
                  style={{ minHeight: '200px', resize: 'vertical', padding: '12px', lineHeight: '1.6' }}
                  value={writeContent}
                  onChange={(e) => setWriteContent(e.target.value)}
                />
              </div>

              {/* Notice toggle option (only for president or treasurer) */}
              {isManager && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '15px', background: 'rgba(6, 182, 212, 0.05)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(6, 182, 212, 0.15)' }}>
                  <input
                    type="checkbox"
                    id="is_notice"
                    checked={writeIsNotice}
                    onChange={(e) => setWriteIsNotice(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="is_notice" style={{ fontSize: '14px', fontWeight: '600', color: 'var(--accent-cyan)', cursor: 'pointer' }}>
                    📢 이 글을 공지사항으로 등록하여 최상단에 고정합니다.
                  </label>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '25px', justifySelf: 'stretch', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowWriteModal(false)}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? '등록 중...' : '작성 완료'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post Detail View Modal */}
      {selectedPost && (
        <div className="modal-overlay" onClick={() => setSelectedPost(null)}>
          <div 
            className="glass modal-content" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '850px', width: '100%', padding: '0', overflow: 'hidden' }}
          >
            {/* Header section */}
            <div style={{ padding: '24px 30px', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                {selectedPost.is_notice && (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#070b19',
                    background: 'var(--accent-gradient)',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    공지사항
                  </span>
                )}
                <span style={{ fontSize: '13px', color: 'var(--color-secondary)' }}>
                  작성자: <strong style={{ color: 'var(--color-primary)' }}>{selectedPost.author_name}</strong>
                </span>
                <span style={{ fontSize: '13px', color: 'var(--color-secondary)', marginLeft: '12px' }}>
                  {new Date(selectedPost.created_at).toLocaleDateString()}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--color-secondary)', marginLeft: '12px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Eye size={13} /> {selectedPost.views_count}
                </span>
              </div>

              {isEditingPost ? (
                <form onSubmit={handleEditPostSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div className="input-group" style={{ marginBottom: '0' }}>
                    <label className="input-label" style={{ fontSize: '12px' }}>제목</label>
                    <input
                      type="text"
                      required
                      className="input-field"
                      style={{ minHeight: '38px', height: '38px', fontSize: '14px', padding: '6px 12px' }}
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                  </div>

                  <div className="input-group" style={{ marginBottom: '0' }}>
                    <label className="input-label" style={{ fontSize: '12px' }}>본문 내용</label>
                    <textarea
                      required
                      className="input-field"
                      style={{ minHeight: '180px', fontSize: '14px', padding: '8px 12px', resize: 'vertical', lineHeight: '1.6' }}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                    />
                  </div>

                  {isManager && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '6px' }}>
                      <input
                        type="checkbox"
                        id="edit_is_notice"
                        checked={editIsNotice}
                        onChange={(e) => setEditIsNotice(e.target.checked)}
                      />
                      <label htmlFor="edit_is_notice" style={{ fontSize: '13px', color: 'var(--accent-cyan)', cursor: 'pointer' }}>공지로 등록</label>
                    </div>
                  )}

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
                  <h3 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--color-primary)' }}>
                    {selectedPost.title}
                  </h3>
                  
                  {((alumniProfile?.id && selectedPost.author_id === alumniProfile.id) || isManager) && (
                    <div style={{ position: 'absolute', right: '50px', top: '24px', display: 'flex', gap: '8px' }}>
                      <button
                        onClick={handleStartEditPost}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--color-secondary)',
                          fontSize: '12px',
                          cursor: 'pointer',
                          padding: '4px 8px',
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
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '1px solid rgba(239,68,68,0.2)'
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Close Button */}
              <button
                onClick={() => setSelectedPost(null)}
                style={{
                  position: 'absolute',
                  top: '24px',
                  right: '20px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-primary)',
                  cursor: 'pointer'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Area */}
            <div style={{ padding: '30px', maxHeight: '550px', overflowY: 'auto' }}>
              {!isEditingPost && (
                <>
                  <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#cbd5e1', whiteSpace: 'pre-wrap', marginBottom: '20px' }}>
                    {selectedPost.content}
                  </p>
                  
                  {/* KakaoTalk Share Button */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '35px' }}>
                    <button
                      onClick={() => shareBoardToKakao(selectedPost)}
                      style={{
                        background: '#fee500',
                        color: '#1e293b',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 8px rgba(254, 229, 0, 0.2)',
                        transition: 'var(--transition-smooth)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 3c-5.52 0-10 3.73-10 8.33 0 2.98 1.87 5.58 4.7 6.96-.34 1.28-1.23 4.54-1.26 4.67-.04.16.05.3.2.22.11-.06 1.83-1.24 3.7-2.52.84.23 1.73.37 2.66.37 5.52 0 10-3.73 10-8.33S17.52 3 12 3z"/>
                      </svg>
                      카톡 단톡방에 알리기
                    </button>
                  </div>
                </>
              )}

              {/* Comments Section */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '25px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MessageSquare size={16} />
                  댓글 ({comments.length})
                </h4>

                {comments.length === 0 ? (
                  <p style={{ color: 'var(--color-secondary)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
                    첫 번째 댓글을 달아 이야기를 나눠보세요!
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {renderCommentTree(null)}
                  </div>
                )}

                {/* Comment Input */}
                <form onSubmit={(e) => handleAddComment(e, null)} style={{ display: 'flex', gap: '8px', marginTop: '25px' }}>
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
        </div>
      )}

    </div>
  );
}
