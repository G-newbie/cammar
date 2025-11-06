import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Popup from 'reactjs-popup';

import './Profile.css'
import profile from './profile.png';
import Navbar from '../Navbar.js';
import { getCurrentUser } from '../../lib/api';

function Profile() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadUser = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await getCurrentUser();
                if (res.res_code === 200) {
                    setUser(res.user);
                } else {
                    setError(res.res_msg || 'Failed to load profile');
                }
            } catch (e) {
                setError('Network error');
            } finally {
                setLoading(false);
            }
        };
        loadUser();
    }, []);

    if (loading) {
        return (
            <div>
                <Navbar />
                <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div>
                <Navbar />
                <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>
                    {error || 'User not found'}
                </div>
            </div>
        );
    }

    return (
        <div>
            <Navbar />
            <div className="row upperCtn">
                <div className="col-md-3 pfpCtn">
                    <img src={user.profile_image_url || profile} className="pfp" alt="Profile" />
                </div>
                <div className="col-md-6 userInfoCtn">
                    <div className="username">{user.display_name || 'User'}</div>
                    <div className="school">{user.school_verified ? 'SUNY Korea (Verified)' : 'SUNY Korea'}</div>
                    <div className="reputation">Current Reputation: {user.trust_score || 0}/5.0 ({user.total_reviews || 0} reviews)</div>
                </div>
                <div className="col-md-3 editBtnCtn">
                    <Link to='../profileEdit'>
                        <div className="editBtn">Edit</div>
                    </Link>
                </div>
            </div>
            <ul className="nav flex-column optionList">
                <li className="nav-item optionItem">
                    <Link to='../option'>
                        <div className="option postHistory">Post History</div>
                    </Link>
                </li>
                <li className="nav-item optionItem">
                    <Link to='../option'>
                        <div className="option myPosts">My Posts</div>
                    </Link>
                </li>
                <li className="nav-item optionItem">
                    <Link to='../option'>
                        <div className="option favPosts">My Favorite Posts</div>
                    </Link>
                </li>
                <li className="nav-item optionItem">
                    <Link to='../option'>
                        <div className="option myComments">My Comments</div>
                    </Link>
                </li>
            </ul>
        </div>
    )
}

export default Profile;