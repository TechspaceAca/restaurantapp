import json
import re
from datetime import datetime

transcript_path = r"C:\Users\HP\.gemini\antigravity-ide\brain\c9c2342a-9f3a-4af0-ab9d-af27fabd0bd4\.system_generated\logs\transcript.jsonl"

file_parts = {}

cutoff_time = datetime.strptime("2026-08-04T06:09:40Z", "%Y-%m-%dT%H:%M:%SZ")

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            
            # Check cutoff
            created_at = data.get('created_at')
            if created_at:
                dt = datetime.strptime(created_at, "%Y-%m-%dT%H:%M:%SZ")
                if dt > cutoff_time:
                    break
                    
            content = data.get('content', '')
            if 'Dashboard.jsx' in content and 'Showing lines' in content:
                lines = content.split('\n')
                for l in lines:
                    match = re.match(r'^(\d+):\s(.*)', l)
                    if match:
                        line_num = int(match.group(1))
                        line_content = match.group(2)
                        file_parts[line_num] = line_content
        except Exception as e:
            pass

# Reconstruct file
if not file_parts:
    print("No parts found")
else:
    max_line = max(file_parts.keys())
    with open('recovered_Dashboard.jsx', 'w', encoding='utf-8') as out:
        for i in range(1, max_line + 1):
            out.write(file_parts.get(i, '') + '\n')
    print(f"Recovered up to line {max_line} to recovered_Dashboard.jsx")
