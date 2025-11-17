import './AdminUsers.css'

import Navbar from "../Navbar";
import { Link } from 'react-router-dom';

function AdminUsers() {
  return (
    <div>
      <Navbar />

      <div className="adminUsersCtn">
        <div className="adminReturnBtn">
          <Link to='../admin'>
          <span className="bi bi-arrow-left"></span>
          <div className="returnDesc">Return</div>
          </Link>
        </div>
        <div className="adminUsersTitle">Configure Users</div>
        <ul className="nav flex-column adminUsersList">
          <li className="nav-item adminUsersItem">Test</li>
        </ul>
      </div>
    </div>
  )
}

export default AdminUsers;