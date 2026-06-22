// Path: functions/api/request.js

export async function onRequestPost(context) {
    try {
        // 1. Read the JSON payload sent from the frontend
        const data = await context.request.json();
        
        // 2. Generate a secure, unique ID for this specific request
        const requestId = crypto.randomUUID();

        // 3. Prepare the SQL insert statement
        const stmt = context.env.DB.prepare(`
            INSERT INTO requests (
                request_id, request_type, target_id, 
                programme, start_year, end_year, name, department, supervisor, 
                permanent_email, niser_email, professional_email, other_emails, 
                phone_number, career_path, research_interests, current_position, 
                current_institute, future_plans, social_media_links, 
                comments_for_batch, additional_info, photo_url
            ) VALUES (
                ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, 
                ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?23
            )
        `);

        // 4. Bind the data (Fallbacks to null if the user left the optional field empty)
        await stmt.bind(
            requestId,
            data.request_type || 'JOIN', 
            data.target_id || null,
            data.programme,
            data.start_year,
            data.end_year,
            data.name,
            data.department,
            data.supervisor || null,
            data.permanent_email,
            data.niser_email || null,
            data.professional_email || null,
            data.other_emails || null,
            data.phone_number || null,
            data.career_path || null,
            data.research_interests || null,
            data.current_position || null,
            data.current_institute || null,
            data.future_plans || null,
            data.social_media_links || null,
            data.comments_for_batch || null,
            data.additional_info || null,
            data.photo_url || null
        ).run();

        // 5. Return success
        return Response.json({ success: true, message: "Request queued successfully", request_id: requestId });

    } catch (error) {
        console.error("Submission Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}