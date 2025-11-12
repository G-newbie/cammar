// src/pages/Community_Page/PostCreate.js
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './PostCreate.css';
import logo from '../../Welcome_Page/logo.png';
import { getCommunities, createPost, uploadImage } from '../../lib/api';

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function PostCreate() {
  const nav = useNavigate();
  const [title, setTitle] = useState('');
  const [communityId, setCommunityId] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]); // File[]
  const [video, setVideo] = useState(null); // File | null
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const imgInput = useRef(null);
  const vidInput = useRef(null);

  useEffect(() => {
    const loadCommunities = async () => {
      try {
        const res = await getCommunities();
        if (res.res_code === 200) {
          setCommunities(res.communities || []);
        }
      } catch (e) {
        console.error('Failed to load communities:', e);
      }
    };
    loadCommunities();
  }, []);

  const contentWords = useMemo(() => wordCount(content), [content]);
  const contentOK = contentWords <= 50;
  const mediaOK = (video && images.length === 0) || (!video && images.length <= 4);
  const valid = title.trim() && communityId && contentOK && mediaOK;

  const onPickImages = (e) => {
    const files = Array.from(e.target.files || []);
    if (video) { alert('Video already selected. You can upload either photos or a single video.'); return; }
    const next = [...images, ...files].slice(0, 4);
    setImages(next);
  };

  const onPickVideo = (e) => {
    const file = (e.target.files || [])[0];
    if (!file) return;
    if (images.length > 0) { alert('Photos already added. Video is allowed only without photos.'); return; }
    setVideo(file);
  };

  const clearMedia = () => { setImages([]); setVideo(null); if (imgInput.current) imgInput.current.value=''; if (vidInput.current) vidInput.current.value=''; };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!valid || loading) return;

    setLoading(true);
    setError('');

    try {
      // Upload media files first
      const uploadedMedia = [];
      
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          console.info('[PostCreate] Uploading image', { index: i, name: images[i]?.name });
          const uploadRes = await uploadImage(images[i]);
          if (uploadRes.res_code === 201) {
            uploadedMedia.push({
              media_url: uploadRes.image_url,
              media_type: 'image',
              display_order: i + 1
            });
          } else {
            console.error('[PostCreate] Image upload failed', uploadRes);
            throw new Error(`${uploadRes.res_msg || 'Failed to upload image'} (code: ${uploadRes.res_code ?? 'unknown'})`);
          }
        }
      } else if (video) {
        // Video upload - using uploadImage for now (may need separate video upload API)
        console.info('[PostCreate] Uploading video', { name: video.name });
        const uploadRes = await uploadImage(video, 'images');
        if (uploadRes.res_code === 201) {
          uploadedMedia.push({
            media_url: uploadRes.image_url,
            media_type: 'video',
            display_order: 1
          });
        } else {
          console.error('[PostCreate] Video upload failed', uploadRes);
          throw new Error(`${uploadRes.res_msg || 'Failed to upload video'} (code: ${uploadRes.res_code ?? 'unknown'})`);
        }
      }

      // Create post
      console.info('[PostCreate] Creating post', {
        community_id: communityId,
        title: title.trim(),
        contentLength: content.trim().length,
        mediaCount: uploadedMedia.length
      });
      const postRes = await createPost({
        community_id: communityId,
        title: title.trim(),
        content: content.trim(),
        media: uploadedMedia
      });

      if (postRes.res_code === 201) {
        alert('Post created successfully!');
        nav('/community');
      } else {
        console.error('[PostCreate] createPost response indicates failure', postRes);
        const details = [
          postRes.res_msg && `msg: ${postRes.res_msg}`,
          postRes.res_code != null && `code: ${postRes.res_code}`,
          postRes.error?.message && `error: ${postRes.error.message}`,
          postRes.error?.details && `details: ${postRes.error.details}`,
          postRes.error?.hint && `hint: ${postRes.error.hint}`,
          postRes.error?.code && `errorCode: ${postRes.error.code}`
        ].filter(Boolean).join(' | ');
        setError(`Failed to create post. ${details || 'No additional details.'}`);
      }
    } catch (err) {
      console.error('[PostCreate] Unexpected error while submitting post', err);
      const debugMessage = [
        err?.message && `message: ${err.message}`,
        err?.status && `status: ${err.status}`,
        err?.response?.status && `responseStatus: ${err.response.status}`,
        err?.response?.data && `responseData: ${JSON.stringify(err.response.data)}`
      ].filter(Boolean).join(' | ');
      setError(`Unexpected error occurred. ${debugMessage || 'Check console for more details.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pc-wrap">
      <header className="pc-topbar">
        <Link to="/home"><img src={logo} alt="logo" className="pc-logo" /></Link>
        <div className="pc-top-title">Community</div>
      </header>

      <div className="pc-title">New Post</div>

      <form className="pc-form" onSubmit={onSubmit}>
        <label className="pc-label">Title</label>
        <input className="pc-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />

        <label className="pc-label">Community</label>
        <select className="pc-input" value={communityId} onChange={(e) => setCommunityId(e.target.value)}>
          <option value="">Select a community</option>
          {communities.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <label className="pc-label">Content (max 50 words)</label>
        <textarea className="pc-textarea" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write something..." />
        <div className={`pc-helper ${!contentOK ? 'over' : ''}`}>{contentWords}/50 words</div>

        <div className="pc-media">
          <div className="pc-media-title">Media (max 4 photos or 1 video)</div>

          <div className="pc-media-grid">
            <div className="pc-media-block">
              <button type="button" className="pc-plus" onClick={() => imgInput.current?.click()} disabled={!!video || images.length >= 4}>＋</button>
              <div className="pc-media-caption">Press to add photos</div>
              <input ref={imgInput} type="file" accept="image/*" multiple hidden onChange={onPickImages} />
            </div>

            <div className="pc-media-block">
              <button type="button" className="pc-plus" onClick={() => vidInput.current?.click()} disabled={images.length > 0 || !!video}>＋</button>
              <div className="pc-media-caption">Press to add a video</div>
              <input ref={vidInput} type="file" accept="video/*" hidden onChange={onPickVideo} />
            </div>
          </div>

          <div className="pc-preview">
            {images.map((f, i) => (
              <img key={i} className="pc-thumb" src={URL.createObjectURL(f)} alt={`p${i}`} />
            ))}
            {video && <div className="pc-video-name">🎬 {video.name}</div>}
            {(images.length > 0 || video) && <button type="button" className="pc-clear" onClick={clearMedia}>Clear media</button>}
          </div>
        </div>

        {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
        <button type="submit" className="pc-submit" disabled={!valid || loading}>
          {loading ? 'Posting...' : 'Click to post'}
        </button>
      </form>
    </div>
  );
}
