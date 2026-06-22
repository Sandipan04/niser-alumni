-- Main Directory Table
CREATE TABLE students (
    id TEXT PRIMARY KEY, -- Auto-generated UUID
    programme TEXT NOT NULL,
    start_year INTEGER NOT NULL,
    end_year INTEGER NOT NULL,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    supervisor TEXT,
    permanent_email TEXT NOT NULL,
    niser_email TEXT,
    professional_email TEXT,
    other_emails TEXT,
    phone_number TEXT,
    career_path TEXT,
    research_interests TEXT,
    current_position TEXT,
    current_institute TEXT,
    future_plans TEXT,
    social_media_links TEXT,
    comments_for_batch TEXT,
    additional_info TEXT,
    photo_url TEXT,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Action Queue Table (For pending requests)
CREATE TABLE requests (
    request_id TEXT PRIMARY KEY,
    request_type TEXT NOT NULL, -- 'JOIN' or 'UPDATE'
    target_id TEXT,             -- Null for joins, holds the 'id' for updates
    
    -- Mirrored fields
    programme TEXT NOT NULL,
    start_year INTEGER NOT NULL,
    end_year INTEGER NOT NULL,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    supervisor TEXT,
    permanent_email TEXT NOT NULL,
    niser_email TEXT,
    professional_email TEXT,
    other_emails TEXT,
    phone_number TEXT,
    career_path TEXT,
    research_interests TEXT,
    current_position TEXT,
    current_institute TEXT,
    future_plans TEXT,
    social_media_links TEXT,
    comments_for_batch TEXT,
    additional_info TEXT,
    photo_url TEXT,
    
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);