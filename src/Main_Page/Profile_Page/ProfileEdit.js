import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import './ProfileEdit.css';
import Navbar from '../Navbar.js';
import { getCurrentUser, updateUserProfile, uploadImage } from '../../lib/api';

function ProfileEdit() {
    const navigate = useNavigate();
    const [displayName, setDisplayName] = useState('');
    const [profileImage, setProfileImage] = useState('');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const res = await getCurrentUser();
                if (res.res_code === 200 && res.user) {
                    setDisplayName(res.user.display_name || '');
                    setProfileImage(res.user.profile_image_url || '');
                }
            } catch (e) {
                console.error('Failed to load user:', e);
            }
        };
        loadUser();
    }, []);

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        try {
            const res = await uploadImage(selectedFile);
            if (res.res_code === 201) {
                setProfileImage(res.image_url);
            } else {
                alert(res.res_msg || 'Failed to upload image');
            }
        } catch (err) {
            alert('Upload error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;

        setLoading(true);
        setError('');

        try {
            const updates = {};
            if (displayName.trim()) {
                updates.display_name = displayName.trim();
            }
            if (profileImage) {
                updates.profile_image_url = profileImage;
            }

            if (Object.keys(updates).length === 0) {
                setError('No changes to save');
                setLoading(false);
                return;
            }

            const res = await updateUserProfile(updates);
            if (res.res_code === 200) {
                alert('Profile updated successfully!');
                navigate('/profile');
            } else {
                setError(res.res_msg || 'Failed to update profile');
            }
        } catch (err) {
            setError(err.message || 'Network error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <Navbar />
            <div className="profileEditCtn">
                <div className="profileTitleCtn">
                    <div className="profileTitle">Edit Profile</div>
                </div>
                <form className="pfpEdit" onSubmit={(e) => e.preventDefault()}>
                    <label htmlFor="newProfilePic" className="form-label">Insert new profile image</label>
                    {profileImage && (
                        <div style={{ marginBottom: 10 }}>
                            <img src={profileImage} alt="Preview" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8 }} />
                        </div>
                    )}
                    <input 
                        type="file" 
                        className="form-control" 
                        id="newProfilePic"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                </form>
                <form className="nameEdit" onSubmit={(e) => e.preventDefault()}>
                    <label htmlFor="newUsername" className="form-label">Name</label>
                    <input 
                        type="text" 
                        className="form-control" 
                        id="newUsername"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                    />
                </form>
                {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
            </div>
            <button 
                className="btn btn-primary fixed-bottom"
                onClick={handleSubmit}
                disabled={loading}
            >
                {loading ? 'Saving...' : 'Submit'}
            </button>
        </div>
    )
}

export default ProfileEdit;