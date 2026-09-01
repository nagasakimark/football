#!/usr/bin/env python3
"""Local server that plays audio inline instead of offering downloads."""
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))

class Handler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        '.html': 'text/html; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.avif': 'image/avif',
        '.svg': 'image/svg+xml',
        '.wav': 'audio/wav',
        '.mp3': 'audio/mpeg',
        '.ogg': 'audio/ogg',
    }

    def end_headers(self):
        path = self.translate_path(self.path).lower()
        if path.endswith(('.wav', '.mp3', '.ogg')):
            self.send_header('Content-Disposition', 'inline')
            self.send_header('Accept-Ranges', 'bytes')
        super().end_headers()

if __name__ == '__main__':
    os.chdir(ROOT)
    port = int(os.environ.get('PORT', '8080'))
    server = ThreadingHTTPServer(('127.0.0.1', port), Handler)
    print(f'Serving Pokémon Soccer at http://127.0.0.1:{port}')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nStopped')
