"""Check generated files and the local module/asset dependency closure."""
import json
import re
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / 'public'
assets = json.loads((ROOT / 'src/site/assets.json').read_text())
errors = []
checked = set()
# Original published form spinner returns HTTP 404 with and without its query.
# Keep its original invisible loading state; do not invent a replacement asset.
upstream_missing = {'/assets/images/pGiXYozQ3mE4cilNOItfe2L2fUA.svg'}

def check(reference, parent):
    path = unquote(urlsplit(reference).path)
    if path in upstream_missing:
        return
    if path.startswith(('/assets/', '/vendor/')):
        target = PUBLIC / path.lstrip('/')
    elif path.startswith('./') and Path(path).suffix in {'.mjs', '.js', '.json', '.framercms'}:
        target = parent / path
    else:
        return
    checked.add(str(target.relative_to(ROOT)))
    if not target.is_file() or target.stat().st_size == 0:
        errors.append(f'{reference} (from {parent.relative_to(ROOT)})')

for asset, info in assets.items():
    path = PUBLIC / asset.lstrip('/')
    check(asset, path.parent)
    if path.stat().st_size != info['bytes']:
        errors.append(f'Unexpected size: {asset}')

files = list((ROOT / 'src/site/pages').glob('*.html'))
files += [PUBLIC / name.lstrip('/') for name in assets if name.endswith(('.mjs', '.js', '.json', '.svg'))]
for path in files:
    content = path.read_text()
    for ref in re.findall(r'''["'`]((?:/assets/|/vendor/|\./)[^"'`\s<]+)["'`]''', content):
        # Exclude dynamic template strings and directory-prefix constants.
        if '${' not in ref and not ref.endswith('/'):
            check(ref, path.parent)
    if path.suffix == '.html' and 'https://events.framer.com/' in content:
        errors.append(f'Source analytics retained: {path.name}')

if errors:
    raise SystemExit('\n'.join(sorted(set(errors))))
print(f'Passed: {len(assets)} assets, 5 routes, {len(checked)} local dependency references.')
print('Known upstream limitation: one unavailable form spinner mask (source HTTP 404).')
