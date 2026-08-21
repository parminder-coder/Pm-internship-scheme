const ML_API_BASE_URL = import.meta.env.VITE_ML_API_URL || "http://localhost:8000/api";

export async function parseResume(file) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${ML_API_BASE_URL}/parse-resume`, {
        method: "POST",
        body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.detail || "Resume parsing failed");
    }

    return result;
}

export async function getRecommendations(candidate) {
    let response;

    try {
        response = await fetch(`${ML_API_BASE_URL}/recommend`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(candidate),
        });
    } catch {
        throw new Error("Cannot connect to the ML service. Make sure it is running on port 8000.");
    }

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.detail || "Recommendations could not be loaded");
    }

    return result.recommendations;
}