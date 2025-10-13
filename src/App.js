import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import './App.css';
import Welcome from './Welcome_Page/Welcome.js';
import SignIn from './Welcome_Page/SignIn.js';
import SignUp from './Welcome_Page/SignUp.js';
import GoogleSignIn from './Welcome_Page/GoogleSignIn.js';

import MainContent from './Main_Page/MainContent.js';
import Community from './Main_Page/Community_Page/Community.js';
import Chat from './Main_Page/Chat_Page/ChattingPage.js';
import Search from './Main_Page/Market_Page/Search.js';
import SearchResult from './Main_Page/Market_Page/SearchResult.js';
import Item from './Main_Page/Market_Page/Item.js';
import ItemPost from './Main_Page/Market_Page/ItemPost.js';
import Profile from './Main_Page/Profile_Page/Profile.js';

import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Welcome />} />
        <Route path='/signIn' element={<SignIn />} />
        <Route path='/signUp' element={<SignUp />} />
        <Route path='/googleSignIn' element={<GoogleSignIn />} />

        <Route path='/home' element={<MainContent />} />
        <Route path='/community' element={<Community />} />
        <Route path='/chat' element={<Chat />} />
        <Route path='/search' element={<Search />} />
        <Route path='/search-result' element={<SearchResult />} />
        <Route path='/item' element={<Item />} />
        <Route path='/item-post' element={<ItemPost />} />
        <Route path='/profile' element={<Profile />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
