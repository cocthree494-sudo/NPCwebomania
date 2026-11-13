"""Apply site branding to both the published HTML and its hydration graph."""
import re


def customize_palette(content):
    """Keep server HTML and client hydration on the same restrained green palette.

    Map the template's theme colours, leaving black/transparent mask stops and
    error colours intact. White sections become a warm, pale botanical neutral.
    """
    palette = {
        '#050505': '#080f0c',  # Almost-black ink with a green undertone.
        '#131415': '#141f18',  # Raised surfaces.
        '#333333': '#2d3b32',
        '#373737': '#35443a',
        '#666666': '#748278',
        '#999999': '#98a69a',
        '#9ba1a5': '#a5b3a8',
        '#b3b3b3': '#b5bfb3',
        '#f5f5f5': '#edf1e7',
        '#ffffff': '#f3f5eb',
        '#ff4d00': '#d3ea2b',  # Pear highlights, reserved for small details.
        '#0099ff': '#b9d879',
        '#9966ff': '#b9d879',
        '#c699fe': '#c8dda5',
        '#ea797d': '#98bc7b',
    }

    def replace_hex(match):
        value = match.group(0).lower()
        if len(value) == 4:
            value = '#' + ''.join(c * 2 for c in value[1:])
        return palette.get(value, match.group(0))

    def replace_rgb(match):
        channels = [int(match.group(i)) for i in (2, 3, 4)]
        value = '#' + ''.join(f'{c:02x}' for c in channels)
        mapped = palette.get(value)
        # Recolour the footer's atmospheric blue gradients as muted green.
        mapped = {(52, 81, 130): '#4c7658', (13, 43, 94): '#1a3827'}.get(
            tuple(channels), mapped)
        if not mapped:
            return match.group(0)
        rgb = ', '.join(str(int(mapped[i:i + 2], 16)) for i in (1, 3, 5))
        return f'{match.group(1)}({rgb}{match.group(5) or ""})'

    content = re.sub(r'#[0-9a-fA-F]{3,8}\b', replace_hex, content)
    return re.sub(
        r'\b(rgb|rgba)\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(\s*,\s*[\d.]+\s*)?\)',
        replace_rgb,
        content)


def customize_module(content, name):
    # Do not modify colour utilities inside third-party animation/React code.
    if not name.startswith(('framer.', 'motion.', 'chunk.')):
        content = customize_palette(content)
    content = content.replace('MVN STUDIO', 'NPC AUTOMATORS')
    content = content.replace('MVN Studio', 'NPC Automators')
    # The expanded navbar uses native nested scrolling on short screens.
    # Mark it in the client graph too, so Lenis does not intercept its wheel/touch.
    content = content.replace('"data-framer-name":`Menu`',
        '"data-framer-name":`Menu`,"data-lenis-prevent":`true`')

    hero_video = 'srcFile:`/assets/videos/zs7SbYRps3jWP1IznHGH8PAxsGw.mp4`'
    if hero_video in content:
        # Match the HTML replacement in the React graph as well, so hydration
        # and client-side navigation never recreate or download the hero video.
        source = content.index(hero_video)
        start = content.rfind('/*#__PURE__*/ _(Se,{', 0, source)
        tail = '...Ct({EH2E7hx0q:{playing:!0}},m,y)})'
        end = content.index(tail, source) + len(tail)
        assert start >= 0, 'Hero video component changed upstream.'
        content = content[:start] + '/*#__PURE__*/ _(`npc-dither-field`,{"aria-hidden":!0,pattern:`waves`,"dot-size":1,intensity:.7,speed:1.8,fps:60,interactive:!0})' + content[end:]

    if name.startswith('toplevel-deps.'):
        # Replace the footer's fit-to-width SVG with an isolated web component.
        start = content.index('className:`framer-fjf8g6`')
        start = content.index('children:', start)
        end = content.index('}),/*#__PURE__*/ d(y.div,{className:`framer-10cs52l`', start)
        content = content[:start] + 'children:f(`npc-scroll-velocity`,{})' + content[end:]
        content, count = re.subn(
            r'children:\[`© 2026 NPC Automators Created by `,.*?children:`Ahmet Köse`\}\)\}\)\]',
            'children:`© 2026 NPC Automators`', content)
        assert count == 1, 'Footer credit changed upstream; review the branding patch.'

        # Remove the complete responsive template-purchase component.
        start = content.index('/*#__PURE__*/ f(ce,{breakpoint:_,overrides:{H6KKVigC4:{href:`https://ahmetkose.lemonsqueezy.com/')
        end = content.index(']}),/*#__PURE__*/ f(`div`,{id:`template-overlay`})', start)
        content = content[:start] + 'null' + content[end:]

    if name.startswith('script_main.'):
        content, count = re.subn(
            r'\(function\(\)\{X&&i\(\(\)=>\{_\(document\.getElementById\(`__framer-badge-container`\).*?\}\)\}\)\(\)',
            'void 0', content)
        assert count == 1, 'Framer badge bootstrap changed upstream.'
    return content


def customize_html(content, revision):
    content = customize_palette(content)
    content = content.replace('MVN STUDIO', 'NPC AUTOMATORS')
    content = content.replace('MVN Studio', 'NPC Automators')
    content = content.replace('data-framer-name="Menu"',
        'data-framer-name="Menu" data-lenis-prevent="true"')
    content = re.sub(
        r'<video\b[^>]*src="/assets/videos/zs7SbYRps3jWP1IznHGH8PAxsGw\.mp4"[^>]*></video>',
        '<npc-dither-field aria-hidden="true" pattern="waves" dot-size="1" intensity="0.7" speed="1.8" fps="60" interactive="true"></npc-dither-field>', content)
    content = re.sub(
        r'(<div class="framer-fjf8g6"[^>]*>)<svg\b.*?</svg>',
        r'\1<npc-scroll-velocity></npc-scroll-velocity>', content)
    content = re.sub(
        r'© 2026 NPC Automators Created by <!--\$--><a\b[^>]*>Ahmet Köse</a><!--/\$-->',
        '© 2026 NPC Automators', content)
    content = re.sub(
        r'<div class="ssr-variant[^\"]*"><!--\$--><a class="framer-mla5ug\b.*?</a><!--/\$--></div>',
        '', content)
    content = re.sub(
        r'<div id="__framer-badge-container">.*?</a><!--/\$--><!--/\$--><!--/\$--></div>',
        '', content)
    # Load before the original module graph. Shadow DOM keeps the animated rows
    # outside React's hydration ownership and works on client-side navigation.
    content = content.replace('</head>', f'''<link rel="stylesheet" href="/vendor/{revision}/npc-theme.css">
<style>
npc-scroll-velocity {{ display: block; width: 100%; min-width: 0; }}
@media (max-width: 600px) {{
  .framer-L0CJy .framer-ffqhzt h3 {{ font-size: clamp(22px, 6vw, 36px) !important; }}
}}
</style>
<script type="module" src="/vendor/{revision}/npc-scroll-velocity.js"></script>
<script type="module" src="/vendor/{revision}/npc-dither-field.js"></script>
</head>''')
    return content
