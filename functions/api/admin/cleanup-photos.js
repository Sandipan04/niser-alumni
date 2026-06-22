export async function onRequestPost(context) {
    try {
        // 1. Get all active photo URLs from the live directory
        const { results: studentResults } = await context.env.DB.prepare(
            "SELECT photo_url FROM students WHERE photo_url IS NOT NULL AND photo_url != ''"
        ).all();
        
        // 2. Get all pending photo URLs from the queue (so we don't delete waiting applications!)
        const { results: queueResults } = await context.env.DB.prepare(
            "SELECT photo_url FROM requests WHERE photo_url IS NOT NULL AND photo_url != ''"
        ).all();

        // Combine them and extract JUST the filename (e.g., 'profile-123.jpg')
        const allActiveUrls = [...studentResults, ...queueResults].map(r => r.photo_url);
        const activeFiles = new Set(allActiveUrls.map(url => url.split('/').pop()));

        // 3. List all files currently sitting in the R2 bucket
        const listed = await context.env.BUCKET.list();
        let deletedCount = 0;

        // 4. Compare and Delete
        for (const object of listed.objects) {
            // If the file in R2 is NOT in our database list, it's an orphan. Delete it.
            if (!activeFiles.has(object.key)) {
                await context.env.BUCKET.delete(object.key);
                deletedCount++;
            }
        }

        return Response.json({ success: true, deletedCount: deletedCount });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}