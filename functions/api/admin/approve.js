export async function onRequestPost(context) {
    try {
        const { request_id } = await context.request.json();
        
        // 1. Fetch the request data
        const req = await context.env.DB.prepare(
            "SELECT * FROM requests WHERE request_id = ?1"
        ).bind(request_id).first();

        if (!req) throw new Error("Request not found");

        // 2. Generate a new ID if joining, or use existing ID if updating
        const studentId = req.target_id || crypto.randomUUID();

        // 3. Move to Students table (Insert or Update)
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
            studentId, req.programme, req.start_year, req.end_year, req.name, req.department, 
            req.supervisor, req.permanent_email, req.niser_email, req.professional_email, 
            req.other_emails, req.phone_number, req.career_path, req.research_interests, 
            req.current_position, req.current_institute, req.future_plans, req.social_media_links, 
            req.comments_for_batch, req.additional_info, req.photo_url
        ).run();

        // 4. Delete from queue
        await context.env.DB.prepare("DELETE FROM requests WHERE request_id = ?1").bind(request_id).run();

        return Response.json({ success: true, student_id: studentId });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}