const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

async function sendAuthRequest(endpoint, data) {
    const response = await fetch(`${API_BASE_URL}/auth/${endpoint}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "Authentication request failed");
    }

    return result;
}

export function registerUser(data) {
    return sendAuthRequest("register", data);
}

export function loginUser(data) {
    return sendAuthRequest("login", data);
}