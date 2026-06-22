// Path: public/js/api.js

/**
 * Fetches the public directory of approved alumni.
 */
export async function getAlumni() {
    try {
        const response = await fetch('/api/alumni');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch alumni:", error);
        throw error;
    }
}

/**
 * Submits a new join or update request to the queue.
 */
export async function submitRequest(payload) {
    try {
        const response = await fetch('/api/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Failed to submit request:", error);
        throw error;
    }
}

/**
 * Fetches a single alumni profile by ID.
 */
export async function getStudent(id) {
    try {
        const response = await fetch(`/api/student?id=${id}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch student profile:", error);
        throw error;
    }
}