import { fetchUserData } from './userData.js';
import { showUserProfile } from './uiToggle.js';

export function checkExistingToken() {
    const token = localStorage.getItem("jwt");
    if (token) {
        showUserProfile();
        fetchUserData(token);
    }
}