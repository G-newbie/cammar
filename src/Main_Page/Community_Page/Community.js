import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navbar from '../Navbar.js'; // Use your existing Navbar component
import './Community.css';

function Community() {
  const navigate = useNavigate();

  /* Community ID
    all: 0
    CSE Lounge: 1
    League of Legend: 2
    Singer: 3
    Triple Street: 4
    Playboys: 5
  */
  const [currComm, setComm] = useState(0);

  // Example post data (can be replaced with API data)
  const posts = [
    {
      id: 1,
      title: 'Someone help me with this assignment?',
      preview: 'I’m currently doing CSE300...',
      author: 'Jane Doe',
      community_id: 1,
      time: '09.15.2025 17:31',
    },
    {
      id: 2,
      title: 'Anyone playing League right now?',
      preview: 'Finished my assignment just before and...',
      author: 'Sophia Kim',
      community_id: 2,
      time: '09.15.2025 03:31',
    },
    {
      id: 3,
      title: 'I’m so burnt out...',
      preview: 'Mid-semester, my grades are...',
      author: 'Bongpal Park',
      community_id: 1,
      time: '09.14.2025 22:19',
      img: 'https://placekitten.com/200/200',
    },
  ];

  function changeCommunity(community_id) {
    const communityList = document.getElementsByClassName("sidebar-btn");
    const homeBtn = document.getElementsByClassName("sidebar-home")[0];

    if(currComm != 0)
      communityList[currComm - 1].classList.remove("active");
    else
      homeBtn.classList.remove("active");

    setComm(community_id);

    if(community_id != 0) {
      for(let i = 0; i < communityList.length; i++)
        if((i + 1) == community_id)
          communityList[i].classList.add("active");
    }
    else
      homeBtn.classList.add("active");
  }

  return (
    <>
      {/* Global Navbar (shared across all main pages) */}
      <Navbar />

      <div className="community-container">
        {/* Sidebar for community list */}
        <aside className="community-sidebar">
          <div className="sidebar-home active" onClick={() => changeCommunity(0)}>Home</div>
          <div className="sidebar-title">Community List</div>
          <button className="sidebar-btn" onClick={() => changeCommunity(1)}>CSE Lounge</button>
          <button className="sidebar-btn" onClick={() => changeCommunity(2)}>League of Legend</button>
          <button className="sidebar-btn" onClick={() => changeCommunity(3)}>Singer</button>
          <button className="sidebar-btn" onClick={() => changeCommunity(4)}>Triple Street</button>
          <button className="sidebar-btn" onClick={() => changeCommunity(5)}>Playboys</button>

          <button
            className="sidebar-create"
            onClick={() => navigate('/community/create')}
          >
            ＋ Create
          </button>
        </aside>

        {/* Main content area with post cards */}
        <main className="community-main">
          <div className="postButton">
            <div className="postBtn" onClick={() => navigate(`./post/create`)}>
                <div>Upload post</div>
            </div>
          </div>
          {posts.map((p) => (
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
