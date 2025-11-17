import './AdminPosts.css'

import Navbar from "../Navbar";
import { Link } from 'react-router-dom';

function AdminPosts() {
  return (
    <div>
      <Navbar />

      <div className="adminPostsCtn">
        <div className="adminReturnBtn">
          <Link to='../admin'>
          <span className="bi bi-arrow-left"></span>
          <div className="returnDesc">Return</div>
          </Link>
        </div>
        <div className="adminPostsTitle">Configure Community Posts</div>
        <ul className="nav flex-column adminPostsList">
          <li className="nav-item adminPostsItem">Test</li>
        </ul>
      </div>
    </div>
  )
}

export default AdminPosts;