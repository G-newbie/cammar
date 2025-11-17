import './AdminItems.css'

import Navbar from "../Navbar";
import { Link } from 'react-router-dom';

function AdminItems() {
  return (
    <div>
      <Navbar />

      <div className="adminItemsCtn">
        <div className="adminReturnBtn">
          <Link to='../admin'>
          <span className="bi bi-arrow-left"></span>
          <div className="returnDesc">Return</div>
          </Link>
        </div>
        <div className="adminItemsTitle">Configure Market Item Posts</div>
        <ul className="nav flex-column adminItemsList">
          <li className="nav-item adminItemsItem">Test</li>
        </ul>
      </div>
    </div>
  )
}

export default AdminItems;