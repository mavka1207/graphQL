import { handleLogin } from './loginFlow.js';
import { checkToken } from './tokenCheck.js';

// Check token on page load
document.addEventListener('DOMContentLoaded', checkToken);

// Add login form event listener
document.getElementById('login-section').addEventListener('submit', handleLogin);

// Add logout handler
document.getElementById('logout-button').addEventListener('click', () => {
    localStorage.removeItem('token');
    location.reload();
});