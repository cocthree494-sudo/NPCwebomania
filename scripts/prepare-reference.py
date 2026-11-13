"""Create a self-contained copy of the exact published component graph.

Visual markup, breakpoints, components and animation code are preserved.
Only asset locations, editor integration, analytics and form transport change.
"""
from pathlib import Path
from urllib.parse import urlparse
import hashlib
import html
import json
import re
from npc_branding import customize_html, customize_module

ROOT = Path(__file__).resolve().parent.parent
REF = ROOT / 'reference'
manifest = json.loads((REF / 'source-manifest.json').read_text())
velocity_source = ROOT / 'src/site/npc-scroll-velocity.js'
custom_sources = [velocity_source, ROOT / 'src/site/npc-dither-field.js', ROOT / 'src/site/npc-theme.css']
# Replacements preserve the original transparent canvases and hand positions.
image_overrides = {
    'VECrf96wv4y4HLDEnYgDsB5lJJo.png': ROOT / 'src/site/images/robotic-hand.png',
    'Ee7hP2Y7yDzDqqeGTbuJMdrKw.png': ROOT / 'src/site/images/robotic-palm.png',
}
revision = hashlib.sha256(
    Path(__file__).read_bytes()
    + Path(__file__).with_name('npc_branding.py').read_bytes()
    + b''.join(source.read_bytes() for source in custom_sources)
    + (REF / 'source-manifest.json').read_bytes()
    + b''.join(image.read_bytes() for image in image_overrides.values())
).hexdigest()[:12]
origin = manifest['origin']
site_prefix = 'https://framerusercontent.com/sites/4rNFdeBdiI5DhbZ97B7QKa/'
pages = ROOT / 'src/site/pages'
pages.mkdir(parents=True, exist_ok=True)
public = ROOT / 'public'
rewrites = {}
selected = {}

for entry in manifest['assets']:
    url = entry['url']
    parsed = urlparse(url)
    if parsed.hostname == urlparse(origin).hostname or parsed.path.endswith('/'):
        continue
    name = Path(parsed.path).name
    suffix = Path(name).suffix
    if suffix in ['.mjs', '.js', '.json', '.framercms']:
        dest = '/vendor/' + revision + '/' + name
    elif suffix in ['.woff', '.woff2', '.ttf', '.otf']:
        dest = '/assets/fonts/' + name
    elif suffix in ['.mp4', '.webm']:
        dest = '/assets/videos/' + name
    else:
        dest = '/assets/images/' + name
    if name in image_overrides:
        image = image_overrides[name]
        digest = hashlib.sha256(image.read_bytes()).hexdigest()[:12]
        dest = f'/assets/images/{image.stem}-{digest}{image.suffix}'
    rewrites[url] = dest
    base = url.split('?')[0]
    rewrites[base] = dest
    # All source srcset resolutions share one image. Keep the best available copy.
    if dest not in selected or entry['bytes'] > selected[dest]['bytes']:
        selected[dest] = entry

def localize(text):
    for remote, local in sorted(rewrites.items(), key=lambda item: -len(item[0])):
        text = text.replace(remote, local).replace(html.escape(remote, quote=True), local)
    text = text.replace(site_prefix, '/vendor/' + revision + '/')
    text = text.replace('https://framerusercontent.com/images/', '/assets/images/')
    text = text.replace('https://framerusercontent.com/assets/', '/assets/videos/')
    text = text.replace(origin, '')
    text = re.sub(r'//# sourceMappingURL=.*', '', text)
    # The two existing forms retain the original validation and animation states.
    text = text.replace('https://api.framer.com/forms/v1/forms/90f55354-85e9-40d3-8fdd-3c8758adcd1a/submit', '/api/forms/contact')
    text = text.replace('https://api.framer.com/forms/v1/forms/b6d29c2c-5627-4eaf-ace9-cdd920963c9f/submit', '/api/forms/newsletter')
    return text

for dest, entry in selected.items():
    target = public / dest.lstrip('/')
    target.parent.mkdir(parents=True, exist_ok=True)
    image = image_overrides.get(Path(urlparse(entry['url']).path).name)
    raw = (image if image else REF / 'upstream' / entry['file']).read_bytes()
    if target.suffix in ['.mjs', '.js', '.json', '.svg', '.css']:
        content = localize(raw.decode('utf-8'))
        # Preserve the text-wall output without creating a DOM element for each
        # character on every animation frame (thousands of transient nodes).
        content = content.replace('function hu(e){let t=document.createElement(`div`);return t.textContent=e,t.innerHTML}',
            'function hu(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\\u00a0/g,"&nbsp;")}')
        if 'function vu({preview:' in content:
            # Keep GSAP's clock running while avoiding invisible text-wall DOM
            # writes. Refresh every line before it enters the visible viewport.
            content = content.replace('i=t=>{let n=T.current[t],r=ee[t];', 'i=t=>{if(!mvnVisible)return;let n=T.current[t],r=ee[t];')
            content = content.replace('return a(),()=>{let e=E.current.loopTimeout;',
                'let mvnVisible=false;const mvnObserver=new IntersectionObserver(entries=>{mvnVisible=entries[0].isIntersecting;if(mvnVisible)e.forEach((_,index)=>i(index))},{rootMargin:"200px"});mvnObserver.observe(C.current);return a(),()=>{mvnObserver.disconnect();let e=E.current.loopTimeout;')
        # CMS chunks originally resolve against an absolute CDN module URL.
        # After localization resolve against this module's real local URL.
        content = re.sub(r'new URL\((`\./[^`]+\.framercms`),`/vendor/[^`]+`\)', r'new URL(\1,import.meta.url)', content)
        if target.name.startswith('script_main.'):
            # The edit pencil belongs to the Framer editor, not the website.
            content, count = re.subn(r'EditorBar:s===void 0\?void 0:.*?,adaptLayoutToTextDirection:', 'EditorBar:void 0,adaptLayoutToTextDirection:', content, count=1)
            assert count == 1, 'Source editor integration changed; review before rebuilding.'
        if target.name.startswith('framer.'):
            # Framer's lightbox assumes CDN URLs; resolve our same-origin images.
            content = content.replace('new URL(t.src)', 'new URL(t.src,document.baseURI)')
            start = content.index('async function zf(')
            end = content.index('function Bf(', start)
            content = content[:start] + '''async function zf(e,t,n,r){const response=await fetch(e,{method:"POST",body:t,credentials:"same-origin"});if(!response.ok){let data=await response.json();throw Error(data?.error?.message||"Unable to submit. Please try again.")}return response}''' + content[end:]
        content = customize_module(content, target.name)
        raw = content.encode('utf-8')
    target.write_bytes(raw)

for entry in manifest['assets']:
    if not entry['url'].startswith(origin):
        continue
    content = localize((REF / 'upstream' / entry['file']).read_text())
    content = re.sub(r'<script\b[^>]*src="https://events\.framer\.com/[^>]*></script>', '', content)
    content = re.sub(r'<script>try\{if\(localStorage\.getItem\("__framer_force_showing_editorbar_since"\)[\s\S]*?</script>', '', content)
    content = re.sub(r'<link\b[^>]*rel="preconnect"[^>]*>', '', content)
    content = content.replace('<head>', '<head>\n<meta name="color-scheme" content="dark">')
    content = customize_html(content, revision)
    (pages / entry['file']).write_text(content)

# Keep all recovered source files, including page/metadata files with equal names.
source_dir = REF / 'original-components'
source_dir.mkdir(exist_ok=True)
source_index = []
for source_map in (REF / 'maps').glob('*.map'):
    mapping = json.loads(source_map.read_text())
    for source, content in zip(mapping['sources'], mapping.get('sourcesContent', [])):
        if not content or '/modules/' not in source:
            continue
        name = hashlib.sha256(source.encode()).hexdigest()[:8] + '-' + Path(source).name
        (source_dir / name).write_text(content)
        source_index.append({'file': name, 'originalUrl': source, 'bundle': source_map.stem})
(REF / 'original-components.json').write_text(json.dumps(source_index, indent=2))
assets = {dest: {'source': entry['url'], 'bytes': (public / dest.lstrip('/')).stat().st_size} for dest, entry in selected.items()}
for source in custom_sources:
    dest = '/vendor/' + revision + '/' + source.name
    (public / dest.lstrip('/')).write_bytes(source.read_bytes())
    assets[dest] = {'source': str(source.relative_to(ROOT)), 'bytes': source.stat().st_size}
(ROOT / 'src/site/assets.json').write_text(json.dumps(assets, indent=2))
print(f'Prepared {len(selected)} local assets and {len(manifest["pages"])} routes.')
