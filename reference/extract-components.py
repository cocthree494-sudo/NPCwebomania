"""Preserve the source component files that the published source maps expose."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import urlparse
import json
import subprocess

root = Path(__file__).resolve().parent
manifest = json.loads((root / 'source-manifest.json').read_text())
maps = root / 'maps'
components = root / 'components'
maps.mkdir(exist_ok=True)
components.mkdir(exist_ok=True)

def extract(entry):
    name = Path(urlparse(entry['url']).path).name
    if not name.endswith('.mjs') or name.startswith(('react.', 'framer.', 'motion.', 'rolldown-runtime.')):
        return []
    dest = maps / (name + '.map')
    if not dest.exists():
        p = subprocess.run(['curl', '--fail', '--silent', '--show-error', '--location', '--max-time', '45', entry['url'] + '.map', '-o', str(dest)], capture_output=True)
        if p.returncode:
            return []
    data = json.loads(dest.read_text())
    result = []
    for source, content in zip(data['sources'], data.get('sourcesContent', [])):
        if content is None or '/modules/' not in source:
            continue
        target = Path(source).name
        (components / target).write_text(content)
        result.append({'file': target, 'source': source, 'bundle': name})
    return result

with ThreadPoolExecutor(max_workers=6) as pool:
    entries = [item for group in pool.map(extract, manifest['assets']) for item in group]
(root / 'component-manifest.json').write_text(json.dumps(entries, indent=2))
print(f'Preserved {len(set(e["file"] for e in entries))} original component source files.')
