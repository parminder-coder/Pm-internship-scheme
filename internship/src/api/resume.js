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