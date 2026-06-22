export async function onRequestPost(context) {
    try {
        const { request_id } = await context.request.json();
        await context.env.DB.prepare(
            "DELETE FROM requests WHERE request_id = ?1"
        ).bind(request_id).run();
        
        return Response.json({ success: true });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}