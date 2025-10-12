import './Welcome.css';

import logo from './logo.png';

function Welcome() {
    const openSignInPage = () => {
        console.log("Sign In Clicked");
        window.open('./SignIn', "_self");
    }

    const openSignUpPage = () => {
        console.log("Sign Up Clicked");
        window.open('./SignUp', "_self");
    }

    return (
        <div className="signIn">
            <div className="row logoCtn">
                <img src={logo} className="mainLogo"></img>
            </div>
            <div className="row signInBtnCtn">
                <btn onClick={ openSignInPage } className="signInBtn">Sign In</btn>
            </div>
            <div className="row signUpBtnCtn">
                <btn onClick={ openSignUpPage } className="signUpBtn">Sign Up</btn>
            </div>
        </div>
    )
}

export default Welcome;