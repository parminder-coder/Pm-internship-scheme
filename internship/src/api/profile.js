const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

function getAuthHeaders() {
    const token = localStorage.getItem("token");

    if (!token) {
        throw new Error("Your session has expired. Please sign in again.");
    }

    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

async function sendProfileRequest(method, profile) {
    let response;

    try {
        response = await fetch(`${API_BASE_URL}/student-profile`, {
            method,
            headers: getAuthHeaders(),
            body: JSON.stringify(profile),
        });
    } catch {
        throw new Error("Cannot connect to the backend. Start it with npm run dev in the backend folder.");
    }

    const result = await response.json();

    if (!response.ok) {
        const error = new Error(result.message || "Could not save your profile");
        error.status = response.status;
        throw error;
    }

    return result;
}

export async function saveStudentProfile(profile) {
    try {
        return await sendProfileRequest("POST", profile);
    } catch (error) {
        if (error.status !== 409) {
            throw error;
        }

        return sendProfileRequest("PATCH", profile);
    }
}
