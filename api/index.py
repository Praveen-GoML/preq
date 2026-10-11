import sys
import os

backend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "preq-backend")
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from main import app as original_app

# Robust ASGI application wrapper for Vercel Serverless Function
async def app(scope, receive, send):
    if scope["type"] == "http":
        path = scope.get("path", "")
        # Strip script prefix if Vercel forwards with filename
        if path.startswith("/api/index.py"):
            path = path[len("/api/index.py"):] or "/"
        elif path.startswith("/index.py"):
            path = path[len("/index.py"):] or "/"
        
        # Ensure path routes correctly to /api endpoints
        if not path.startswith("/api") and path not in ["/", "/docs", "/redoc", "/openapi.json"]:
            if path.startswith("/"):
                path = "/api" + path
            else:
                path = "/api/" + path
                
        scope["path"] = path
    await original_app(scope, receive, send)
