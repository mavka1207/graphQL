import { login, logout } from './auth.js';
import { fetchUserData } from './userData.js';
import { showUserProfile, showLoginForm } from './uiToggle.js';

export function setupLoginFlow() {
    const loginForm = document.getElementById("login-section");
    const loginError = document.getElementById("login-error-message");
    const usernameInput = document.getElementById("username-or-email");
    const passwordInput = document.getElementById("password-login");
    const logoutBtn = document.getElementById("logout-button");

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
            const token = await login(usernameInput.value.trim(), passwordInput.value);
            localStorage.setItem("jwt", token);
            showUserProfile();
            await fetchUserData(token);
        } catch (err) {
            loginError.textContent = err.message;
        }
    });

    logoutBtn.addEventListener("click", () => {
        logout();
        showLoginForm();
    });
}