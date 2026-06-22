export async function onRequestPost(context) {
    try {
        const { id } = await context.request.json();
        await context.env.DB.prepare("DELETE FROM messages WHERE id = ?").bind(id).run();
        return Response.json({ success: true });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}