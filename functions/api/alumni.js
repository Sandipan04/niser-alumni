// Path: functions/api/alumni.js

export async function onRequestGet(context) {
    try {
        // context.env.DB is the binding to your Cloudflare D1 database
        const { results } = await context.env.DB.prepare(
            "SELECT * FROM students ORDER BY start_year DESC, name ASC"
        ).all();

        // Return the data as a clean JSON response
        return Response.json(results);
        
    } catch (error) {
        console.error("Database Error:", error);
        return new Response(JSON.stringify({ error: "Failed to fetch directory" }), { 
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}