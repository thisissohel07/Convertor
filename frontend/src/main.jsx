import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

window.onerror = function(msg, url, line, col, error) {
  alert("Error: " + msg + "\nURL: " + url + "\nLine: " + line);
  return false;
};

ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
)
