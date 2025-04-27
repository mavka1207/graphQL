export function showUserProfile() {
    document.getElementById("login-section").style.display = "none";
    document.getElementById("header").style.display = "block";
    document.getElementById("user-info-header").classList.remove("hidden");
    document.getElementById("data-container").style.display = "grid";
}

export function showLoginForm() {
    document.getElementById("login-section").style.display = "block";
    document.getElementById("header").style.display = "none";
    document.getElementById("user-info-header").classList.add("hidden");
    document.getElementById("data-container").style.display = "none";
    document.getElementById("username-display").textContent = "";
    document.getElementById("username-or-email").value = "";
    document.getElementById("password-login").value = "";
}