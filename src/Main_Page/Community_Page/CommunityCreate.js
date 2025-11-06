// src/pages/Community_Page/CommunityCreate.js
import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './CommunityCreate.css';
import logo from '../../Welcome_Page/logo.png';
import { createCommunity } from '../../lib/api';

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function CommunityCreate() {
  const nav = useNavigate();
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const descCount = useMemo(() => wordCount(desc), [desc]);
  const valid = title.trim().length > 0 && descCount <= 20;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!valid || loading) return;

    setLoading(true);
    setError('');

    try {
      const res = await createCommunity({
        name: title.trim(),
        description: desc.trim()
      });

      if (res.res_code === 201) {
        alert('Community created successfully!');
        nav('/community');
      } else {
        setError(res.res_msg || 'Failed to create community');
      }
    } catch (err) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cc-wrap">
      <header className="cc-topbar">
        <Link to="/home"><img src={logo} alt="logo" className="cc-logo" /></Link>
        <div className="cc-top-title">Community</div>
      </header>

      <div className="cc-title">New Community</div>

      <form className="cc-form" onSubmit={onSubmit}>
        <label className="cc-label">Title</label>
        <input
          className="cc-input"
          placeholder="Community title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label className="cc-label">Description (max 20 words)</label>
        <textarea
          className="cc-textarea"
          placeholder="Describe your community briefly"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
        <div className={`cc-helper ${descCount > 20 ? 'over' : ''}`}>{descCount}/20 words</div>

        {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}

        <div className="cc-btn-row">
          <button type="button" className="cc-btn" onClick={() => nav(-1)} disabled={loading}>Cancel</button>
          <button type="submit" className="cc-btn primary" disabled={!valid || loading}>
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}
