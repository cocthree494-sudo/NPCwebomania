"""Download the supplied site's public pages and their exact dependency graph."""
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen
import hashlib
import html
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parent
ORIGIN = 'https://welcomed-vacation-356902.framer.app'
PAGES = ['/', '/contact', '/404', '/legal-pages/privacy-policy', '/legal-pages/terms-of-service']
ALLOWED = {'framerusercontent.com', 'fonts.gstatic.com'}
OUT = ROOT / 'upstream'
OUT.mkdir(exist_ok=True)
manifest = {}
failed = {}

def fetch(url):
    path = urlparse(url).path
    filename = hashlib.sha256(url.encode()).hexdigest()[:12] + '-' + (path.rsplit('/', 1)[-1] or 'index.html')
    if url in [ORIGIN + p for p in PAGES]:
        filename = ('home' if path == '/' else path.strip('/').replace('/', '-')) + '.html'
    dest = OUT / filename
    suffix = Path(path).suffix
    if dest.exists() and dest.stat().st_size:
        mime = {'html':'text/html', '.mjs':'text/javascript', '.js':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml'}.get(suffix, 'application/octet-stream')
        if filename.endswith('.html'):
            mime = 'text/html'
    else:
        result = subprocess.run(['curl', '--silent', '--show-error', '--location', '--max-time', '35', '--retry', '2', '--user-agent', 'Mozilla/5.0', '--output', str(dest), '--write-out', '%{http_code}\n%{content_type}', url], capture_output=True, text=True)
        code, _, mime = result.stdout.partition('\n')
        if result.returncode or (code != '200' and url != ORIGIN + '/404'):
            raise RuntimeError(result.stderr or f'HTTP {code}')
    data = dest.read_bytes()
    return {'url': url, 'file': filename, 'bytes': len(data), 'contentType': mime}, data

def discover(url, data, mime):
    if not any(t in mime for t in ['text/', 'javascript', 'json']):
        return set()
    text = html.unescape(data.decode('utf-8', errors='replace')).replace('\\/', '/')
    found = set(re.findall(r'https://(?:framerusercontent\.com|fonts\.gstatic\.com)/[^\s"\'`<>\\)]+', text))
    if '.mjs' in url or 'javascript' in mime:
        for relative in re.findall(r'["\'`]([^"\'`\s]+\.(?:mjs|js|css)(?:\?[^"\'`\s]*)?)["\'`]', text):
            if relative.startswith('.'):
                found.add(urljoin(url, relative))
    return {u.rstrip(';,') for u in found if urlparse(u).hostname in ALLOWED}

pending = {ORIGIN + p for p in PAGES}
pending.add('https://framerusercontent.com/sites/4rNFdeBdiI5DhbZ97B7QKa/script_main.N8E-AT9a.mjs')
with ThreadPoolExecutor(max_workers=8) as executor:
    while pending:
        batch = sorted(pending - manifest.keys() - failed.keys())
        pending = set()
        if not batch:
            break
        futures = {executor.submit(fetch, url): url for url in batch}
        for future in as_completed(futures):
            url = futures[future]
            try:
                entry, data = future.result()
                manifest[url] = entry
                pending.update(discover(url, data, entry['contentType']))
                (ROOT / 'source-manifest.json').write_text(json.dumps({'origin': ORIGIN, 'pages': PAGES, 'assets': list(manifest.values()), 'failures': failed}, indent=2))
                print(f"Downloaded {entry['file']} ({entry['bytes']} bytes)", flush=True)
            except Exception as exc:
                failed[url] = str(exc)
                print(f'FAILED {url}: {exc}', flush=True)
        (ROOT / 'source-manifest.json').write_text(json.dumps({'origin': ORIGIN, 'pages': PAGES, 'assets': list(manifest.values()), 'failures': failed}, indent=2))
print(f'Total: {len(manifest)} files, {sum(v["bytes"] for v in manifest.values()) / 1e6:.1f} MB, {len(failed)} failures')
