export async function onRequestPost(context) {
    try {
        const { name, batch, content } = await context.request.json();
        
        // 1. Save directly to the Admin D1 Database
        await context.env.DB.prepare(
            "INSERT INTO messages (name, batch, content) VALUES (?, ?, ?)"
        ).bind(
            name || "Anonymous", 
            batch || "Not Provided", 
            content
        ).run();

        // 2. Dispatch the real-time Discord Webhook (if configured)
        if (context.env.DISCORD_WEBHOOK_DM) {
            const embed = {
                title: "📩 New Message for Admin",
                color: 3447003, 
                fields: [
                    { name: "Name", value: name || "Anonymous", inline: true },
                    { name: "Batch", value: batch || "Not provided", inline: true },
                    { name: "Message", value: content }
                ],
                timestamp: new Date().toISOString()
            };

            // Fire and forget - don't let a Discord failure block the user response
            context.waitUntil(
                fetch(context.env.DISCORD_WEBHOOK_DM, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ embeds: [embed] })
                }).catch(err => console.error("Discord Webhook failed", err))
            );
        }
        
        return Response.json({ success: true });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}