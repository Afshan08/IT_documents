#!/bin/sh
set -e

echo "=========================================================="
echo " Starting Frontend Container - Preparing Latest Build...  "
echo "=========================================================="

cd /app

# Ensure dependencies are available (especially if mounted via volume)
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.bin/vite" ]; then
    echo "===> Installing frontend dependencies..."
    npm install
fi

echo "===> Compiling latest frontend application..."

# Attempt to build with Vite
if npm run build; then
    echo "=========================================================="
    echo "✅ [SUCCESS] Frontend compiled successfully!"
    echo "Deploying fresh assets to Nginx..."
    echo "=========================================================="
    rm -rf /usr/share/nginx/html/*
    cp -r /app/dist/* /usr/share/nginx/html/
    echo "===> Starting Nginx on port 80..."
    exec nginx -g "daemon off;"
else
    echo "=========================================================="
    echo "❌ [ERROR] FRONTEND COMPILATION FAILED!"
    echo "Check the Vite / React error output above."
    echo "PREVENTING FALLBACK: Stale cached version is purged."
    echo "=========================================================="

    # Wipe old html files so stale version is never served
    rm -rf /usr/share/nginx/html/*
    mkdir -p /usr/share/nginx/html

    cat << 'EOF' > /usr/share/nginx/html/index.html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Frontend Build Error</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #fff1f2; color: #9f1239; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; box-sizing: border-box; }
    .box { background: white; border: 1px solid #fecaca; border-radius: 12px; padding: 32px; max-width: 640px; width: 100%; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    h1 { color: #be123c; margin-top: 0; font-size: 1.5rem; display: flex; align-items: center; gap: 8px; }
    p { color: #475569; line-height: 1.6; }
    .code-box { background: #0f172a; color: #38bdf8; padding: 12px 16px; border-radius: 8px; font-family: monospace; font-size: 0.95rem; margin: 16px 0; overflow-x: auto; }
  </style>
</head>
<body>
  <div class="box">
    <h1>⚠️ Frontend Build Error</h1>
    <p>The latest build failed compilation. Stale cached files were deleted so you do not see outdated code.</p>
    <p>To view the exact compilation error and line number, run:</p>
    <div class="code-box">docker logs app_frontend</div>
    <p>After fixing the code error, restart the container:</p>
    <div class="code-box">docker compose restart frontend</div>
  </div>
</body>
</html>
EOF

    exec nginx -g "daemon off;"
fi
