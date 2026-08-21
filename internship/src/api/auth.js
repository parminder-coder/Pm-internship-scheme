const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

async function sendAuthRequest(endpoint, data) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/${endpoint}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(data),
        });

        const contentType = response.headers.get("content-type");
        let result;
        if (contentType && contentType.includes("application/json")) {
            result = await response.json();
        } else {
            const text = await response.text();
            console.error(`Non-JSON API error on /auth/${endpoint} [${response.status}]:`, text);
            throw new Error(`Server error (${response.status}): ${response.statusText || "Request failed"}`);
        }

        if (!response.ok) {
            console.error(`API Error on /auth/${endpoint} [${response.status}]:`, result);
            throw new Error(result.message || `Request to /auth/${endpoint} failed with status ${response.status}`);
        }

        return result;
    } catch (err) {
        console.error(`Fetch Error on /auth/${endpoint}:`, err);
        throw err;
    }
}

export function registerUser(data) {
    return sendAuthRequest("register", data);
}

export function loginUser(data) {
    return sendAuthRequest("login", data);
}

export function logoutApiUser() {
    return sendAuthRequest("logout", {});
}

export async function verifyUserToken() {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include"
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "Token verification failed");
    }

    return result;
}

export async function completeUserProfile(token) {
    const headers = {
        "Content-Type": "application/json",
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/auth/complete-profile`, {
        method: "POST",
        headers,
        credentials: "include"
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "Failed to update profile status");
    }

    return result;
}

export async function saveStudentProfileForm(formData, token) {
    const headers = {
        "Content-Type": "application/json",
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/student-profile`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify(formData)
    });

    const contentType = response.headers.get("content-type");
    let result;
    if (contentType && contentType.includes("application/json")) {
        result = await response.json();
    } else {
        const text = await response.text();
        console.error("Non-JSON API response from /student-profile:", response.status, text);
        throw new Error(`Server error (${response.status}): ${response.statusText || "Unable to reach server"}`);
    }

    if (!response.ok) {
        throw new Error(result.message || "Failed to save profile form to database");
    }

    return result;
}

export async function getRecommendationsApi(token) {
    const headers = {
        "Content-Type": "application/json",
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/student-profile/recommendations`, {
        method: "GET",
        headers,
        credentials: "include"
    });

    const contentType = response.headers.get("content-type");
    let result;
    if (contentType && contentType.includes("application/json")) {
        result = await response.json();
    } else {
        const text = await response.text();
        console.error("Non-JSON API response from /recommendations:", response.status, text);
        throw new Error(`Server error (${response.status}): ${response.statusText || "Unable to reach server"}`);
    }

    if (!response.ok) {
        throw new Error(result.message || "Failed to fetch recommendations");
    }

    return result;
}

export async function uploadResumeApi(file, token) {
    const headers = {};
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const formData = new FormData();
    formData.append("resume", file);

    const response = await fetch(`${API_BASE_URL}/student-profile/resume`, {
        method: "POST",
        headers,
        credentials: "include",
        body: formData
    });

    const contentType = response.headers.get("content-type");
    let result;
    if (contentType && contentType.includes("application/json")) {
        result = await response.json();
    } else {
        const text = await response.text();
        console.error("Non-JSON API response from /resume:", response.status, text);
        throw new Error(`Server error (${response.status}): ${response.statusText || "Unable to process resume"}`);
    }

    if (!response.ok) {
        throw new Error(result.message || "Failed to upload resume");
    }

    return result;
}