import { fetchUserData } from './userData.js';

export async function handleLogin(event) {
    event.preventDefault();
    
    const usernameOrEmail = document.getElementById('username-or-email').value;
    const passwordElement = document.getElementById('password-login');
    let password = passwordElement.value;
    const errorMessage = document.getElementById('login-error-message');

    try {
        errorMessage.textContent = '';
        
        if (!usernameOrEmail || !password) {
            throw new Error('Please fill in all fields');
        }

        const credentials = btoa(`${usernameOrEmail}:${password}`);
        
        const response = await fetch('https://01.gritlab.ax/api/auth/signin', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            errorMessage.textContent = errorData.error || 'Login failed';
            errorMessage.style.display = 'block';
            return;
        }

        const token = await response.text();
        const cleanToken = token.replace(/^"|"$/g, '');
        errorMessage.style.display = 'none';
        password = '';
        passwordElement.value = '';
        
        localStorage.setItem('token', cleanToken);

        
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('user-info-header').classList.remove('hidden');
        document.getElementById('data-container').classList.remove('hidden');
        
        await fetchUserData(cleanToken);

    } catch (error) {
        errorMessage.textContent = error.message;
    }
}