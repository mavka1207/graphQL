import { fetchUserData } from './userData.js';

// Constants for API endpoints and error messages
const API_URL = 'https://01.gritlab.ax/api/auth/signin';
const ERROR_MESSAGES = {
    emptyFields: 'Please fill in all fields',
    loginFailed: 'Login failed'
};

export async function handleLogin(event) {
    event.preventDefault();
    
    // Get form inputs and validate
    const usernameOrEmail = document.getElementById('username-or-email').value;
    const passwordElement = document.getElementById('password-login');
    let password = passwordElement.value;
    const errorMessage = document.getElementById('login-error-message');

    try {
        // Validate input fields
        if (!usernameOrEmail || !password) {
            throw new Error(ERROR_MESSAGES.emptyFields);
        }

        // Create Base64 encoded credentials
        const credentials = btoa(`${usernameOrEmail}:${password}`);
        
        // Send authentication request
        const response = await fetch('https://01.gritlab.ax/api/auth/signin', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            errorMessage.textContent = errorData.error || ERROR_MESSAGES.loginFailed;
            errorMessage.style.display = 'block';
            return;
        }

        // Handle successful login
        const token = await response.text();
        const cleanToken = token.replace(/^"|"$/g, '');
        errorMessage.style.display = 'none';
        
        // Clear sensitive data
        password = '';
        passwordElement.value = '';
        
        // Store token and update UI
        localStorage.setItem('token', cleanToken);

        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('user-info-header').classList.remove('hidden');
        document.getElementById('data-container').classList.remove('hidden');
        
        await fetchUserData(cleanToken);

    } catch (error) {
        errorMessage.textContent = error.message;
    }
}

// Clearing the password after use
function clearPassword(passwordElement) {
    passwordElement.value = '';
}