export async function onRequestPost(context) {
    try {
        const formData = await context.request.formData();
        const file = formData.get('file');

        if (!file) throw new Error("No file uploaded");

        const arrayBuffer = await file.arrayBuffer();
        const fileName = `profile-${crypto.randomUUID()}.jpg`;

        await context.env.BUCKET.put(fileName, arrayBuffer, {
            httpMetadata: { contentType: 'image/jpeg' }
        });

        // Simply return the relative path. 
        // This tells the browser to look at yourdomain.com/img/filename, 
        // which triggers your [[path]].js function!
        return Response.json({ url: `/img/${fileName}` });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}