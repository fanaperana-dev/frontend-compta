import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Garde-fou : si un outil de traduction (Google Translate…) a quand même modifié le DOM,
// React ne doit pas planter en essayant de retirer/insérer un nœud qui a changé de parent.
if (typeof Node === 'function' && Node.prototype) {
  const retirer = Node.prototype.removeChild;
  Node.prototype.removeChild = function (enfant) {
    if (enfant.parentNode !== this) return enfant;
    return retirer.apply(this, arguments);
  };
  const inserer = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (nouveau, reference) {
    if (reference && reference.parentNode !== this) return nouveau;
    return inserer.apply(this, arguments);
  };
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
