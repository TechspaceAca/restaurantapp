import os
import time

history_dir = os.path.expandvars(r"%APPDATA%\Code\User\History")
four_hours_ago = time.time() - (4 * 3600)

matching_files = []

for root, _, files in os.walk(history_dir):
    for f in files:
        if f == 'entries.json':
            continue
        path = os.path.join(root, f)
        try:
            if os.path.getmtime(path) >= four_hours_ago:
                with open(path, 'r', encoding='utf-8') as file:
                    content = file.read()
                    if 'AdminDashboard' in content and 'export default function AdminDashboard' in content:
                        matching_files.append((path, os.path.getmtime(path)))
        except Exception:
            pass

# Sort by modification time, newest first
matching_files.sort(key=lambda x: x[1], reverse=True)
for p, t in matching_files:
    print(f"{time.ctime(t)} : {p}")
