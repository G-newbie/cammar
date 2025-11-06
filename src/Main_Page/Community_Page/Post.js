// src/pages/Community_Page/Post.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import './Post.css';
import logo from '../../Welcome_Page/logo.png';
import { getPostDetails, createComment, updateComment, deleteComment, voteOnPost, getPostVotes, updatePost, deletePost, getCurrentUser } from '../../lib/api';

export default function Post() {
  const { id } = useParams();
  const nav = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [voteLoading, setVoteLoading] = useState(false);
  const [userVote, setUserVote] = useState(null);
  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [commentUpdateLoading, setCommentUpdateLoading] = useState({});
  const [commentDeleteLoading, setCommentDeleteLoading] = useState({});

  useEffect(() => {
    const loadPost = async () => {
      if (!id) {
        setError('Post ID is required');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const res = await getPostDetails(id);
        if (res.res_code === 200) {
          setPost(res.post);
          setComments(res.post.comments || []);
          setUpvotes(res.post.upvotes || 0);
          setDownvotes(res.post.downvotes || 0);
        } else {
          setError(res.res_msg || 'Failed to load post');
        }
      } catch (e) {
        setError('Network error');
      } finally {
        setLoading(false);
      }

      // Load vote status
      try {
        const voteRes = await getPostVotes(id);
        if (voteRes.res_code === 200) {
          setUpvotes(voteRes.votes.upvotes || 0);
          setDownvotes(voteRes.votes.downvotes || 0);
          setUserVote(voteRes.votes.user_vote);
        }
      } catch (e) {
        console.error('Error loading votes:', e);
      }

      // Load current user for permission check
      try {
        const userRes = await getCurrentUser();
        if (userRes.res_code === 200 && userRes.user) {
          setCurrentUserId(userRes.user.id);
        }
      } catch (e) {
        console.error('Error loading current user:', e);
      }
    };
    loadPost();
  }, [id]);

  const handleUpdate = async () => {
    if (!editTitle.trim() || !editContent.trim() || !id || updateLoading) return;
    setUpdateLoading(true);
    try {
      const res = await updatePost(id, { title: editTitle.trim(), content: editContent.trim() });
      if (res.res_code === 200) {
        setIsEditing(false);
        // Reload post
        const postRes = await getPostDetails(id);
        if (postRes.res_code === 200) {
          setPost(postRes.post);
          setComments(postRes.post.comments || []);
        }
      } else {
        alert(res.res_msg || 'Failed to update post');
      }
    } catch (e) {
      alert('Network error');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || deleteLoading) return;
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    setDeleteLoading(true);
    try {
      const res = await deletePost(id);
      if (res.res_code === 200) {
        alert('Post deleted successfully');
        nav('/community');
      } else {
        alert(res.res_msg || 'Failed to delete post');
      }
    } catch (e) {
      alert('Network error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const startEdit = () => {
    if (post) {
      setEditTitle(post.title);
      setEditContent(post.content);
      setIsEditing(true);
    }
  };

  const handleVote = async (voteType) => {
    if (!id || voteLoading) return;
    
    // If clicking the same vote type, it will be removed (toggle)
    const newVoteType = userVote === voteType ? null : voteType;
    
    setVoteLoading(true);
    try {
      // If toggling off, we need to send the opposite to remove the vote
      // But voteOnPost handles this internally - if same vote type is sent, it removes it
      let voteToSend = newVoteType;
      if (newVoteType === null) {
        // If we're removing, send the current vote type which will toggle it off
        voteToSend = userVote;
      }
      
      const res = await voteOnPost(id, { vote_type: voteToSend });
      if (res.res_code === 200) {
        // Reload vote status
        const voteRes = await getPostVotes(id);
        if (voteRes.res_code === 200) {
          setUpvotes(voteRes.votes.upvotes || 0);
          setDownvotes(voteRes.votes.downvotes || 0);
          setUserVote(voteRes.votes.user_vote);
        }
        
        // Update post state
        if (post) {
          setPost({ ...post, upvotes: voteRes?.votes?.upvotes || post.upvotes, downvotes: voteRes?.votes?.downvotes || post.downvotes });
        }
      } else {
        alert(res.res_msg || 'Failed to vote');
      }
    } catch (e) {
      alert('Network error');
    } finally {
      setVoteLoading(false);
    }
  };

  const addComment = async () => {
    if (!text.trim() || !id) return;
    setCommentLoading(true);
    try {
      const res = await createComment(id, { content: text.trim() });
      if (res.res_code === 200 || res.res_code === 201) {
        const newComment = {
          id: res.data?.id || Date.now(),
          content: text.trim(),
          author: { display_name: 'You', id: currentUserId },
          created_at: new Date().toISOString()
        };
        setComments((v) => [newComment, ...v]);
        setText('');
        
        // Update post comment count if needed
        if (post) {
          setPost({ ...post, comment_count: (post.comment_count || 0) + 1 });
        }
      } else {
        alert(res.res_msg || 'Failed to create comment');
      }
    } catch (e) {
      alert('Network error');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleUpdateComment = async (commentId) => {
    if (!editCommentText.trim() || !id || commentUpdateLoading[commentId]) return;
    setCommentUpdateLoading(prev => ({ ...prev, [commentId]: true }));
    try {
      const res = await updateComment(id, commentId, editCommentText.trim());
      if (res.res_code === 200) {
        setComments(prev => prev.map(c => 
          c.id === commentId 
            ? { ...c, content: editCommentText.trim() }
            : c
        ));
        setEditingCommentId(null);
        setEditCommentText('');
      } else {
        alert(res.res_msg || 'Failed to update comment');
      }
    } catch (e) {
      alert('Network error');
    } finally {
      setCommentUpdateLoading(prev => ({ ...prev, [commentId]: false }));
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!id || commentDeleteLoading[commentId]) return;
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    setCommentDeleteLoading(prev => ({ ...prev, [commentId]: true }));
    try {
      const res = await deleteComment(id, commentId);
      if (res.res_code === 200) {
        setComments(prev => prev.filter(c => c.id !== commentId));
        if (post) {
          setPost({ ...post, comment_count: Math.max(0, (post.comment_count || 0) - 1) });
        }
      } else {
        alert(res.res_msg || 'Failed to delete comment');
      }
    } catch (e) {
      alert('Network error');
    } finally {
      setCommentDeleteLoading(prev => ({ ...prev, [commentId]: false }));
    }
  };

  const startEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditCommentText(comment.content || comment.text || '');
  };

  if (loading) {
    return (
      <div className="post-grid">
        <header className="post-topbar">
          <Link to="/home"><img src={logo} alt="logo" className="post-logo" /></Link>
          <div className="post-top-title">Community</div>
        </header>
        <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="post-grid">
        <header className="post-topbar">
          <Link to="/home"><img src={logo} alt="logo" className="post-logo" /></Link>
          <div className="post-top-title">Community</div>
        </header>
        <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>
          {error || 'Post not found'}
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="post-grid">
      <header className="post-topbar">
        <Link to="/home"><img src={logo} alt="logo" className="post-logo" /></Link>
        <div className="post-top-title">Community</div>
      </header>

      <aside className="post-sidebar">
        <div className="post-pill active">{post.community?.name || 'Community'}</div>
        <button className="post-pill" onClick={() => nav('/community')}>← Back to list</button>
      </aside>

      <main className="post-main">
        <div className="post-header">
          <div>
            {isEditing ? (
              <>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={{ width: '100%', padding: 8, marginBottom: 8, fontSize: 20, fontWeight: 'bold' }}
                />
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  style={{ width: '100%', minHeight: 200, padding: 8 }}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button onClick={handleUpdate} disabled={updateLoading} style={{ padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: 4 }}>
                    {updateLoading ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => setIsEditing(false)} disabled={updateLoading} style={{ padding: '8px 16px', backgroundColor: '#ccc', border: 'none', borderRadius: 4 }}>
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="post-title">{post.title}</div>
                <div className="post-author">{post.author?.display_name || 'Unknown'}</div>
              </>
            )}
          </div>
          <div className="post-meta-right">
            {!isEditing && (
              <>
                {post.community?.name || 'Community'}<br />{formatDate(post.created_at)}
                {currentUserId && post.author?.id === currentUserId && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                    <button
                      onClick={startEdit}
                      style={{ padding: '4px 8px', fontSize: 12, backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleteLoading}
                      style={{ padding: '4px 8px', fontSize: 12, backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: 4, cursor: deleteLoading ? 'not-allowed' : 'pointer' }}
                    >
                      {deleteLoading ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Vote Section */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
          <button
            onClick={() => handleVote('upvote')}
            disabled={voteLoading}
            style={{
              padding: '8px 16px',
              backgroundColor: userVote === 'upvote' ? '#4CAF50' : '#f0f0f0',
              color: userVote === 'upvote' ? 'white' : 'black',
              border: 'none',
              borderRadius: 4,
              cursor: voteLoading ? 'not-allowed' : 'pointer',
              fontSize: 14
            }}
          >
            ↑ {upvotes}
          </button>
          <button
            onClick={() => handleVote('downvote')}
            disabled={voteLoading}
            style={{
              padding: '8px 16px',
              backgroundColor: userVote === 'downvote' ? '#f44336' : '#f0f0f0',
              color: userVote === 'downvote' ? 'white' : 'black',
              border: 'none',
              borderRadius: 4,
              cursor: voteLoading ? 'not-allowed' : 'pointer',
              fontSize: 14
            }}
          >
            ↓ {downvotes}
          </button>
        </div>

        {post.media && post.media[0] && (
          <img src={post.media[0].media_url} alt="" className="post-image" />
        )}

        {!isEditing && (
          <div className="post-body">
            {post.content.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        )}

        <div className="comment-box">
          <input
            className="comment-input"
            placeholder="Comment"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !commentLoading) {
                addComment();
              }
            }}
          />
          <button 
            className="comment-btn" 
            onClick={addComment}
            disabled={commentLoading || !text.trim()}
          >
            {commentLoading ? 'Posting...' : 'Post'}
          </button>
        </div>

        {comments.map((c) => (
          <div className="comment-item" key={c.id}>
            {editingCommentId === c.id ? (
              <>
                <textarea
                  value={editCommentText}
                  onChange={(e) => setEditCommentText(e.target.value)}
                  style={{ width: '100%', minHeight: 60, padding: 8, marginBottom: 8 }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleUpdateComment(c.id)}
                    disabled={commentUpdateLoading[c.id]}
                    style={{ padding: '4px 8px', fontSize: 12, backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: 4 }}
                  >
                    {commentUpdateLoading[c.id] ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingCommentId(null);
                      setEditCommentText('');
                    }}
                    disabled={commentUpdateLoading[c.id]}
                    style={{ padding: '4px 8px', fontSize: 12, backgroundColor: '#ccc', border: 'none', borderRadius: 4 }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>{c.content || c.text}</div>
                <div className="comment-meta">
                  <div>
                    {c.author?.display_name || c.author || 'Unknown'}<br />
                    {formatDate(c.created_at) || c.time || ''}
                  </div>
                  {currentUserId && c.author?.id === currentUserId && (
                    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                      <button
                        onClick={() => startEditComment(c)}
                        style={{ padding: '2px 6px', fontSize: 11, backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: 3, cursor: 'pointer' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        disabled={commentDeleteLoading[c.id]}
                        style={{ padding: '2px 6px', fontSize: 11, backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: 3, cursor: commentDeleteLoading[c.id] ? 'not-allowed' : 'pointer' }}
                      >
                        {commentDeleteLoading[c.id] ? '...' : 'Delete'}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </main>
    </div>
  );
}
