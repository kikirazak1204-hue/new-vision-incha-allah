const API_BASE = `${import.meta.env.VITE_API_URL}/api/auth`; // ✅ variable d'environnement

// 🔐 Inscription
export async function registerUser(userData) {
    const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    });
    return response.json();
}

// 🔐 Connexion + stockage du token
export async function loginUser(credentials) {
    const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
    });
    const result = await response.json();
    if (result.success && result.token) {
        localStorage.setItem('token', result.token);
    }
    return result;
}