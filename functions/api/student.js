export async function onRequestGet(context) {
    // 1. Extract the 'id' parameter from the URL
    const url = new URL(context.request.url);
    const id = url.searchParams.get('id');

    if (!id) {
        return new Response(JSON.stringify({ error: "Missing student ID" }), { 
            status: 400, headers: { "Content-Type": "application/json" } 
        });
    }

    try {
        // 2. Query the database for that specific ID
        const student = await context.env.DB.prepare(
            "SELECT * FROM students WHERE id = ?1"
        ).bind(id).first(); // .first() returns a single object instead of an array

        if (!student) {
            return new Response(JSON.stringify({ error: "Student not found" }), { 
                status: 404, headers: { "Content-Type": "application/json" } 
            });
        }

        // 3. Return the data
        return Response.json(student);

    } catch (error) {
        console.error("Database Error:", error);
        return new Response(JSON.stringify({ error: "Server error" }), { 
            status: 500, headers: { "Content-Type": "application/json" } 
        });
    }
}