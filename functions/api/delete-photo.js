export async function onRequestPost(context) {
    try {
        const { url } = await context.request.json();
        if (!url) return Response.json({ success: true }); // Nothing to delete
        
        // Extract just the filename (e.g., 'profile-123.jpg') from the full URL
        const fileName = url.split('/').pop();
        
        // Delete it from R2
        await context.env.BUCKET.delete(fileName);
        
        return Response.json({ success: true });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}