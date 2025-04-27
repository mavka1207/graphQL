import { fetchUserData } from './userData.js';

export async function checkToken() {
    const token = localStorage.getItem('token');
    
    if (token) {
        try {
            // Hide login form
            document.getElementById('login-section').classList.add('hidden');
            // Show user info header
            document.getElementById('user-info-header').classList.remove('hidden');
            
            // Fetch and display user data
            await fetchUserData(token);
        } catch (error) {
            console.error('Token validation failed:', error);
            // If token is invalid, remove it and show login form
            localStorage.removeItem('token');
            document.getElementById('login-section').classList.remove('hidden');
            document.getElementById('user-info-header').classList.add('hidden');
        }
    } else {
        // No token, show login form
        document.getElementById('login-section').classList.remove('hidden');
        document.getElementById('user-info-header').classList.add('hidden');
    }
}