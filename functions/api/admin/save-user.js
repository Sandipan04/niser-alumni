export async function onRequestPost(context) {
    try {
        const data = await context.request.json();
        
        // Use provided ID (for edits) or generate a new UUID (for new users)
        const studentId = data.id || crypto.randomUUID();

        const stmt = context.env.DB.prepare(`
            INSERT INTO students (
                id, programme, start_year, end_year, name, department, supervisor, 
                permanent_email, niser_email, professional_email, other_emails, 
                phone_number, career_path, research_interests, current_position, 
                current_institute, future_plans, social_media_links, comments_for_batch, 
                additional_info, photo_url, last_updated
            ) VALUES (
                ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, 
                ?16, ?17, ?18, ?19, ?20, ?21, CURRENT_TIMESTAMP
            )
            ON CONFLICT(id) DO UPDATE SET 
                programme=excluded.programme, start_year=excluded.start_year, end_year=excluded.end_year,
                name=excluded.name, department=excluded.department, supervisor=excluded.supervisor,
                permanent_email=excluded.permanent_email, niser_email=excluded.niser_email,
                professional_email=excluded.professional_email, other_emails=excluded.other_emails,
                phone_number=excluded.phone_number, career_path=excluded.career_path,
                research_interests=excluded.research_interests, current_position=excluded.current_position,
                current_institute=excluded.current_institute, future_plans=excluded.future_plans,
                social_media_links=excluded.social_media_links, comments_for_batch=excluded.comments_for_batch,
                additional_info=excluded.additional_info, photo_url=excluded.photo_url,
                last_updated=CURRENT_TIMESTAMP;
        `);

        await stmt.bind(
            studentId, data.programme, data.start_year, data.end_year, data.name, data.department, 
            data.supervisor || null, data.permanent_email, data.niser_email || null, 
            data.professional_email || null, data.other_emails || null, data.phone_number || null, 
            data.career_path || null, data.research_interests || null, data.current_position || null, 
            data.current_institute || null, data.future_plans || null, data.social_media_links || null, 
            data.comments_for_batch || null, data.additional_info || null, data.photo_url || null
        ).run();

        return Response.json({ success: true, id: studentId });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}