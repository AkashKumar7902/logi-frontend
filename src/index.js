// src/index.js
import React from 'react';
import ReactDOM from 'react-dom';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';
import './index.css'; 
import { Provider } from 'react-redux';
import store from './store';
import './leafletConfig'; 
import 'leaflet/dist/leaflet.css';


ReactDOM.render(
  <Provider store={store}>
    <AuthProvider>
      <App />
    </AuthProvider>
  </Provider>,
  document.getElementById('root')
);
