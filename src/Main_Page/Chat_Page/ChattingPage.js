import { Link } from 'react-router-dom';

import logo from '../../Welcome_Page/logo.png';

function ChattingPage() {
    return (
        <div>
            <Link to='/home'>
                <img src={logo}></img>
            </Link>
            <p>This is the ChattingPage page</p>
        </div>
    )
}

export default ChattingPage;