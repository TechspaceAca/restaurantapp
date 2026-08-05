import os
import json
import urllib.parse
import shutil

history_dir = os.path.expandvars(r"%APPDATA%\Code\User\History")

target_path_raw = r"c:\Users\HP\t clock cafe billing\frontend\src\pages\admin\Dashboard.jsx"
# The resource is usually file:///c%3A/Users/HP/t%20clock%20cafe%20billing/...
# So let's just decode the resource before checking
target_path = target_path_raw.replace('\\', '/').lower()

found_folder = None
for root, _, files in os.walk(history_dir):
    if 'entries.json' in files:
        p = os.path.join(root, 'entries.json')
        try:
            with open(p, 'r', encoding='utf-8') as f:
                data = json.load(f)
                resource = data.get('resource', '')
                decoded = urllib.parse.unquote(resource).lower()
                if target_path in decoded:
                    found_folder = root
                    print(f"Found match in {found_folder}")
                    break
        except Exception:
            pass

if found_folder:
    latest_file = None
    latest_time = 0
    for f in os.listdir(found_folder):
        if f != 'entries.json':
            full_path = os.path.join(found_folder, f)
            mtime = os.path.getmtime(full_path)
            if mtime > latest_time:
                latest_time = mtime
                latest_file = full_path
                
    if latest_file:
        shutil.copy(latest_file, "recovered_Dashboard_from_vscode.jsx")
        print(f"Copied latest history file {latest_file} to recovered_Dashboard_from_vscode.jsx")
    else:
        print("No history files found in the folder.")
else:
    print("Could not find the target file in entries.json.")
