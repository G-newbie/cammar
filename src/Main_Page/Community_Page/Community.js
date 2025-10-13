import { Link } from 'react-router-dom';

import logo from '../../Welcome_Page/logo.png';

function Community() {
    return (
        <div>
            <Link to='/home'>
                <img src={logo}></img>
            </Link>
            <p>This is the community page</p>
        </div>
    )
}

export default Community;