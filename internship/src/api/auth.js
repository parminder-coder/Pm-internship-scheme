const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

async function sendAuthRequest(endpoint, data) {
    let response;

    try {
        response = await fetch(`${API_BASE_URL}/auth/${endpoint}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(data),
        });
    } catch {
        throw new Error("Cannot connect to the backend. Start it with npm run dev in the backend folder.");
    }

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

export async function verifyUserToken(token) {
    const headers = {
        "Content-Type": "application/json",
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: "GET",
        headers,
        credentials: "include"
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "Token verification failed");
    }

    return result;
}