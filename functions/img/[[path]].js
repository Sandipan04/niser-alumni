export async function onRequestGet(context) {
    const fileName = context.params.path.join('/');
    const object = await context.env.BUCKET.get(fileName);
    if (!object) return new Response('Image not found', { status: 404 });

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    return new Response(object.body, { headers });
}