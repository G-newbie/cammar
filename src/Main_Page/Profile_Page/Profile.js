import { Link } from 'react-router-dom';

import logo from '../../Welcome_Page/logo.png';

function Profile() {
    return (
        <div>
            <Link to='/home'>
                <img src={logo}></img>
            </Link>
            <p>This is the Profile page</p>
        </div>
    )
}

export default Profile;