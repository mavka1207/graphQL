export async function login(username, password) {
    if (!username || !password) {
        throw new Error("Please enter username and password.");
    }

    const credentials = btoa(`${username}:${password}`);
    
    const res = await fetch("https://01.gritlab.ax/api/auth/signin", {
        method: "POST",
        headers: {
            "Authorization": `Basic ${credentials}`
        }
    });

    if (!res.ok) {
        throw new Error('Invalid username or password');
    }

    const data = await res.json();
    return !data || typeof data !== 'string' ? data.token : data;
}

export function logout() {
    localStorage.removeItem("jwt");
}
