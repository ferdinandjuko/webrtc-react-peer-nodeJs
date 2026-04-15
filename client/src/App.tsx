// App.tsx
import React, { useEffect } from 'react';
// import logo from './logo.svg';
import './App.css';
import { Join } from './components/Join';
import socketIOClient from 'socket.io-client';

const WS = 'localhost:5000';

function App() {

  useEffect(() => {
    // socketIOClient(WS);
  }, []);
  return (
    <div className="App flex items-center justify-center w-screen h-screen">
      <Join />
    </div>
  );
}

export default App;
