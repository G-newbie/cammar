import { useEffect, useState } from 'react';
import { getCurrentUser, signOut } from '../../lib/api';

import Navbar from '../Navbar.js';
import './Admin.css'

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
                  if (res.is_admin)
                    setAdmin(res.user);
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

  return (
    <div>
      <Navbar />
      {
      isAdmin ? (
        <div>Hello, Admin.</div>
      ) :
      (
        <div>You are unauthorized to open this page.</div>
      )
      }
    </div>
  )
}

export default Admin;