import { fetchUserData } from './userData.js';

export async function checkToken() {
    const token = localStorage.getItem('token');
    const loginSection = document.getElementById('login-section');
    const userInfoHeader = document.getElementById('user-info-header');
    const dataContainer = document.getElementById('data-container');
    
    if (token) {
        try {
            loginSection.classList.add('hidden');
            userInfoHeader.classList.remove('hidden');
            dataContainer.classList.remove('hidden');
            
            await fetchUserData(token);
        } catch (error) {
            localStorage.removeItem('token');
            loginSection.classList.remove('hidden');
            userInfoHeader.classList.add('hidden');
            dataContainer.classList.add('hidden');
        }
    } else {
        loginSection.classList.remove('hidden');
        userInfoHeader.classList.add('hidden');
        dataContainer.classList.add('hidden');
    }
}