import './App.css';
import Welcome from './Welcome_Page/Welcome.js';
import SignIn from './Welcome_Page/SignIn.js';
import SignUp from './Welcome_Page/SignUp.js';
import GoogleSignIn from './Welcome_Page/GoogleSignIn.js';

import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Welcome />} />
        <Route path='/SignIn' element={<SignIn />} />
        <Route path='/SignUp' element={<SignUp />} />
        <Route path='/GoogleSignIn' element={<GoogleSignIn />} />

        
      </Routes>
    </BrowserRouter>
  );
}

export default App;
