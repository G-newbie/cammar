import { useEffect, useState } from 'react';
import { getCurrentUser, signOut } from '../../lib/api/index.js';

import Navbar from '../Navbar.js';
import './Admin.css'
import { Link } from 'react-router-dom';

function Admin() {
  const [isAdmin, setAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
        const checkAdmin = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await getCurrentUser();
                if (res.res_code === 200) {
                  if (res.user && res.user.is_admin) {
                    setAdmin(res.user);
                  } else {
                    setError('You are not authorized to access this page');
                  }
                } else {
                    setError(res.res_msg || 'Failed to load user');
                }
            } catch (e) {
                setError('Network error');
            } finally {
                setLoading(false);
            }
        };
        checkAdmin();
    }, []);

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="adminCtn">
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !isAdmin) {
    return (
      <div>
        <Navbar />
        <div className="adminCtn">
          <div className="adminTitle">Access Denied</div>
          <div className="adminDesc" style={{ color: 'red' }}>
            {error || 'You are not authorized to access this page'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />

      <div className="adminCtn">
        <div className="adminTitle">Dashboard</div>
        <div className="adminDesc">Welcome, Admin.</div>

        <ul className="nav flex-column adminOptionList">
          <li className="nav-item adminOptionItem">
            <Link to='./users'>
              <div className="adminOption">Configure Users</div>
            </Link>
          </li>
          <li className="nav-item adminOptionItem">
            <Link to='./items'>
              <div className="adminOption">Configure Market Item Posts</div>
            </Link>
          </li>
          <li className="nav-item adminOptionItem">
            <Link to='./posts'>
              <div className="adminOption">Configure Community Posts</div>
            </Link>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default Admin;