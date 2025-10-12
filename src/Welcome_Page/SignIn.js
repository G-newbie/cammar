import './SignIn.css';

import logo from './logo.png';
import googleLogo from './Google.jpeg';

function SignIn() {
    const openGooglePage = () => {
        console.log("Continue with Google clicked");
        window.open('./GoogleSignIn', "_self");
    }

    return (
        <div className="signIn">
            <div className="row logoCtn">
                <img src={logo} className="mainLogo"></img>
            </div>
            <div className="row titleCtn">
                <div className="title">Sign In</div>
            </div>
            <div onClick={ openGooglePage } className="row googleBtnCtn">
                <div className="googleLogoCtn">
                    <img src={googleLogo} className="googleLogo"></img>
                </div>
                <div className="googleBtn">Continue with Google</div>
            </div>
        </div>
    )
}

export default SignIn;