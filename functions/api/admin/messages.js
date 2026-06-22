export async function onRequestGet(context) {
    try {
        const { results } = await context.env.DB.prepare(
            "SELECT * FROM messages ORDER BY created_at DESC"
        ).all();
        return Response.json(results);
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}