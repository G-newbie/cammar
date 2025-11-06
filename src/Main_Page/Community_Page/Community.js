import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Navbar.js'; // Use your existing Navbar component
import './Community.css';
import { getCommunities, getCommunityPosts, joinCommunity, leaveCommunity } from '../../lib/api';

function Community() {
  const navigate = useNavigate();

  const [communities, setCommunities] = useState([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joinLeaveLoading, setJoinLeaveLoading] = useState({});

  useEffect(() => {
    const loadCommunities = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getCommunities();
        if (res.res_code === 200) {
          setCommunities(res.communities || []);
          if (res.communities && res.communities[0]) {
            setSelectedCommunityId(res.communities[0].id);
          }
        } else {
          setError(res.res_msg || 'Failed to load communities');
        }
      } catch (e) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };
    loadCommunities();
  }, []);

  useEffect(() => {
    const loadPosts = async () => {
      if (!selectedCommunityId) return;
      setLoading(true);
      setError('');
      try {
        const res = await getCommunityPosts(selectedCommunityId, { page: 1, limit: 20 });
        if (res.res_code === 200) {
          // API returns full content, so slice for preview
          const mapped = (res.posts || []).map(p => ({
            id: p.id,
            title: p.title,
            preview: (p.content || '').slice(0, 80),
            author: p.author?.display_name,
            community: communities.find(c => c.id === selectedCommunityId)?.name || '',
            time: new Date(p.created_at).toLocaleString(),
            img: (p.media && p.media[0] && p.media[0].media_url) || undefined
          }));
          setPosts(mapped);
        } else {
          setError(res.res_msg || 'Failed to load posts');
        }
      } catch (e) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };
    loadPosts();
  }, [selectedCommunityId, communities]);

  const handleJoinLeave = async (communityId, isJoined) => {
    if (joinLeaveLoading[communityId]) return;
    setJoinLeaveLoading(prev => ({ ...prev, [communityId]: true }));
    try {
      let res;
      if (isJoined) {
        res = await leaveCommunity(communityId);
      } else {
        res = await joinCommunity(communityId);
      }
      if (res.res_code === 200 || res.res_code === 201) {
        // Reload communities to update join status
        const communitiesRes = await getCommunities();
        if (communitiesRes.res_code === 200) {
          setCommunities(communitiesRes.communities || []);
        }
      } else {
        alert(res.res_msg || `Failed to ${isJoined ? 'leave' : 'join'} community`);
      }
    } catch (e) {
      alert('Network error');
    } finally {
      setJoinLeaveLoading(prev => ({ ...prev, [communityId]: false }));
    }
  };

  return (
    <>
      {/* Global Navbar (shared across all main pages) */}
      <Navbar />

      <div className="community-container">
        {/* Sidebar for community list */}
        <aside className="community-sidebar">
          <div className="sidebar-home">Home</div>
          <div className="sidebar-title">Community List</div>
          {communities.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                className={"sidebar-btn" + (c.id === selectedCommunityId ? ' active' : '')}
                onClick={() => setSelectedCommunityId(c.id)}
                style={{ flex: 1 }}
              >
                {c.name}
              </button>
              {c.is_member !== undefined && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleJoinLeave(c.id, c.is_member);
                  }}
                  disabled={joinLeaveLoading[c.id]}
                  style={{
                    padding: '4px 8px',
                    fontSize: 12,
                    backgroundColor: c.is_member ? '#ff4444' : '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: joinLeaveLoading[c.id] ? 'not-allowed' : 'pointer'
                  }}
                >
                  {joinLeaveLoading[c.id] ? '...' : (c.is_member ? 'Leave' : 'Join')}
                </button>
              )}
            </div>
          ))}

          <button
            className="sidebar-create"
            onClick={() => navigate('/community/create')}
          >
            ＋ Create
          </button>
        </aside>

        {/* Main content area with post cards */}
        <main className="community-main">
          {loading && <div style={{ padding: 12 }}>Loading...</div>}
          {(!loading && error) && <div style={{ padding: 12, color: 'red' }}>{error}</div>}
          {(!loading && !error) && posts.map((p) => (
            <div
              className="post-card"
              key={p.id}
              onClick={() => navigate(`/community/post/${p.id}`)}
            >
              <div>
                <div className="post-title">{p.title}</div>
                <div className="post-preview">{p.preview}</div>
              </div>

              <div className="post-meta">
                {p.img && <img src={p.img} alt="thumb" className="post-img" />}
                <div>
                  {p.community} · {p.author}
                  <br />
                  {p.time}
                </div>
              </div>
            </div>
          ))}
        </main>
      </div>
    </>
  );
}

export default Community;
