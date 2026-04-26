#!/bin/sh
CONF="/www/server/panel/vhost/nginx/tuoitre.vnkgu.edu.vn.conf"

# Kiểm tra xem đã có rule chưa
if grep -q 'no-store' "$CONF"; then
  echo "nginx no-cache: already configured"
  exit 0
fi

# Thêm location = /index.html block trước location /
python3 - <<'PYEOF'
import re

path = "/www/server/panel/vhost/nginx/tuoitre.vnkgu.edu.vn.conf"
with open(path, 'r') as f:
    content = f.read()

no_cache_block = """    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        add_header Pragma "no-cache" always;
        add_header Expires "0" always;
        try_files $uri =404;
    }

"""

# Chèn trước "location / {"
new_content = content.replace("    location / {", no_cache_block + "    location / {", 1)

with open(path, 'w') as f:
    f.write(new_content)
print("nginx config updated")
PYEOF

# Test và reload
nginx -t && nginx -s reload && echo "nginx_reload_ok" || (cp "${CONF}.bak" "$CONF" && echo "rollback_done")
