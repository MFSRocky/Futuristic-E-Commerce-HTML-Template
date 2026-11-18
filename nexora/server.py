#!/usr/bin/env python3
"""
NEXORA Local Development & Testing Server
Serves:
  - http://localhost:8080/              -> nexora/site/ (Live Storefront Preview)
  - http://localhost:8080/documentation/ -> nexora/documentation/ (Full Docs)
  - http://localhost:8080/release/       -> nexora/release/ (Packaging Artifacts)
Features:
  - Cache-busting headers for instant live testing
  - Full MIME type support (.webp, .woff2, .svg, .js, .css)
  - CORS enabled
"""
import http.server
import mimetypes
import os
import socketserver
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SITE_DIR = os.path.join(BASE_DIR, 'site')
DOC_DIR = os.path.join(BASE_DIR, 'documentation')
REL_DIR = os.path.join(BASE_DIR, 'release')

# Ensure standard MIME types
mimetypes.add_type('image/webp', '.webp')
mimetypes.add_type('font/woff2', '.woff2')
mimetypes.add_type('image/svg+xml', '.svg')
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('application/json', '.json')

PORT = int(os.environ.get('PORT', 8080))

class NexoraRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=SITE_DIR, **kwargs)

    def translate_path(self, path):
        clean_path = path.split('?', 1)[0].split('#', 1)[0]
        
        # Route documentation
        if clean_path == '/documentation' or clean_path.startswith('/documentation/'):
            sub = clean_path[len('/documentation'):].lstrip('/')
            return os.path.join(DOC_DIR, sub) if sub else DOC_DIR
        if clean_path == '/doc' or clean_path.startswith('/doc/'):
            sub = clean_path[len('/doc'):].lstrip('/')
            return os.path.join(DOC_DIR, sub) if sub else DOC_DIR

        # Route release files
        if clean_path == '/release' or clean_path.startswith('/release/'):
            sub = clean_path[len('/release'):].lstrip('/')
            return os.path.join(REL_DIR, sub) if sub else REL_DIR

        return super().translate_path(path)

    def end_headers(self):
        # Prevent browser caching during local development & testing
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

class ThreadingTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True

def run():
    with ThreadingTCPServer(('127.0.0.1', PORT), NexoraRequestHandler) as httpd:
        print(f"==================================================")
        print(f"  NEXORA Live Server running at:")
        print(f"  ➜ Storefront:    http://127.0.0.1:{PORT}/")
        print(f"  ➜ Documentation: http://127.0.0.1:{PORT}/documentation/")
        print(f"  ➜ Releases:      http://127.0.0.1:{PORT}/release/")
        print(f"==================================================")
        sys.stdout.flush()
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")

if __name__ == '__main__':
    run()
