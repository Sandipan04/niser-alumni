import pandas as pd
import uuid

input_file = 'Batchmate Records (Int MSc 2021) - Sheet1 (1).csv'
output_file = 'seed.sql'

# 1. Map CSV columns to EXACT Database columns
column_mapping = {
    'Name': 'name',
    'Permanent Email': 'permanent_email',
    'NISER Email': 'niser_email',
    'Professional affiliation email (after NISER)': 'professional_email',
    'Phone Number': 'phone_number',
    'Department': 'department',
    'Career Path': 'career_path',
    'Describe Future plans': 'future_plans',
    'Current Position': 'current_position',
    'Social media profiles (links/handles)': 'social_media_links',
    'Comments for the Batch': 'comments_for_batch'
}

def clean_data():
    try:
        df = pd.read_csv(input_file, dtype=str)
    except FileNotFoundError:
        print(f"Error: Could not find '{input_file}'")
        return

    df.columns = df.columns.str.strip()

    # Drop rows where Department or Permanent Email are missing
    if 'Department' in df.columns and 'Permanent Email' in df.columns:
        df = df.dropna(subset=['Department', 'Permanent Email'])
        df = df[df['Department'].str.strip() != '']
        df = df[df['Permanent Email'].str.strip() != '']
    else:
        print("Error: CSV must contain 'Department' and 'Permanent Email' columns.")
        return

    # Deduplicate by Permanent Email
    def merge_user_records(series):
        valid_entries = series.dropna().str.strip()
        valid_entries = valid_entries[valid_entries != '']
        if not valid_entries.empty:
            return valid_entries.iloc[-1]
        return None

    df_merged = df.groupby('Permanent Email', as_index=False).agg(merge_user_records)
    
    sql_statements = []
    
    for _, row in df_merged.iterrows():
        payload = {}
        
        # Map available CSV data
        for csv_col, db_col in column_mapping.items():
            val = row.get(csv_col) if csv_col in df_merged.columns else None
            if pd.isna(val) or str(val).strip() == "" or str(val).strip().lower() == "nan":
                payload[db_col] = "NULL"
            else:
                safe_val = str(val).replace("'", "''").strip()
                payload[db_col] = f"'{safe_val}'"
        
        # Add required DB fields
        payload['id'] = f"'{str(uuid.uuid4())}'"  # Generate unique string ID
        payload['programme'] = "'Int. MSc.'"
        payload['start_year'] = '2021'
        payload['end_year'] = '2026'
        
        columns = ", ".join(payload.keys())
        values = ", ".join(payload.values())
        
        sql = f"INSERT INTO students ({columns}) VALUES ({values});"
        sql_statements.append(sql)

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("\n".join(sql_statements))
        
    print(f"✅ Success! Generated {len(sql_statements)} valid SQL inserts.")
    print(f"🚀 Run: npx wrangler d1 execute alumni-db --file={output_file} --remote")

if __name__ == "__main__":
    clean_data()