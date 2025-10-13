import { Link } from 'react-router-dom';

import logo from '../../Welcome_Page/logo.png';

function Search() {
    return (
        <div>
            <Link to='/home'>
                <img src={logo}></img>
            </Link>
            <p>This is the Search page</p>
        </div>
    )
}

export default Search;