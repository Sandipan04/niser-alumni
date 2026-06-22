export async function onRequestPost(context) {
    try {
        const { student_id } = await context.request.json();
        await context.env.DB.prepare(
            "DELETE FROM students WHERE id = ?1"
        ).bind(student_id).run();
        
        return Response.json({ success: true });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}