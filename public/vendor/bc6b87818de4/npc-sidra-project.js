// SIDRA portfolio folder. Shadow DOM keeps its interactive contents outside
// the recovered Framer/React hydration graph; native dialog owns modal focus.
const screens = [
  { name: 'Dashboard', file: 'dashboard', caption: 'A clear view of orders, customers and connected channels.' },
  { name: 'Chat', file: 'chat', caption: 'A helpful business assistant, with context from your workspace.' },
  { name: 'Comments', file: 'comments', caption: 'Review social comments and prepare thoughtful replies.' },
  { name: 'Inbox', file: 'inbox', caption: 'Customer conversations from every channel, in one place.' },
];
const imagePath = file => `/assets/images/sidra/${file}.jpg`;
const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
const styles = `
  :host { display:block; width:533.3333px; aspect-ratio:4/3; font-family:Inter,Arial,sans-serif; color:#f3f5eb; -webkit-user-select:auto; user-select:auto; }
  * { box-sizing:border-box; }
  button { font:inherit; cursor:pointer; -webkit-tap-highlight-color:transparent; }
  button:focus-visible { outline:3px solid #b9d879; outline-offset:5px; }
  svg { width:22px; height:22px; flex-shrink:0; }
  .card { width:100%; height:100%; position:relative; overflow:hidden; border-radius:20px; background:radial-gradient(ellipse at 52% 35%,#285441 0%,#183e2e 52%,#123023 100%); isolation:isolate; }
  .card::after { content:''; position:absolute; width:68%; height:11%; left:16%; bottom:20%; border-radius:50%; background:#071b12; filter:blur(18px); opacity:.46; z-index:-1; }
  .eyebrow { position:absolute; top:7%; left:7%; right:7%; display:flex; justify-content:space-between; gap:12px; font-size:10px; letter-spacing:.14em; color:#c0d3c5; text-transform:uppercase; }
  .eyebrow span:last-child { color:#a3bfae; letter-spacing:.08em; }
  .folder-button { position:absolute; inset:14% 9% 20%; display:block; background:none; padding:0; border:0; color:#36512b; perspective:900px; }
  .folder { position:absolute; inset:15% 9% 4%; transform:rotate(-5deg); transition:transform .45s cubic-bezier(.2,.7,.2,1); }
  .folder-back { position:absolute; inset:0; background:linear-gradient(135deg,#d4c47c,#b3a358); border-radius:12px 18px 16px 16px; box-shadow:0 1px 0 #f3e8a0 inset,0 18px 35px #041d1840; }
  .folder-back::before { content:''; position:absolute; width:43%; height:15%; top:-13%; left:0; background:linear-gradient(120deg,#dace93,#d4c47c); border-radius:12px 16px 0 0; }
  .paper { position:absolute; width:78%; height:85%; left:11%; top:-18%; overflow:hidden; border:5px solid #f4f3e9; border-radius:8px; background:#f4f3e9; box-shadow:0 5px 14px #061d2528; transition:transform .45s cubic-bezier(.2,.7,.2,1); }
  .paper img { width:100%; height:100%; object-fit:cover; object-position:left top; display:block; }
  .paper.one { transform:translate(-10px,-4px) rotate(-8deg); }
  .paper.two { transform:translate(17px,-10px) rotate(9deg); }
  .paper.three { transform:translate(0,0) rotate(1deg); }
  .folder-front { position:absolute; inset:16% -3% -3%; border-radius:10px 16px 16px 16px; background:linear-gradient(145deg,#f8edb4 0%,#eade95 40%,#d9ca7a 100%); box-shadow:0 1px 1px #fff8d4 inset,0 -1px 1px #b7a353 inset,0 12px 20px #0c241a24; display:flex; flex-direction:column; align-items:flex-start; justify-content:center; padding:0 12%; transform:rotate(2deg); }
  .folder-front::before { content:''; position:absolute; left:0; right:0; top:0; height:30%; border-radius:inherit; background:linear-gradient(#fff6d23b,transparent); }
  .wordmark { font-size:clamp(60px,6.5vw,98px); font-weight:500; letter-spacing:-.085em; line-height:1; position:relative; margin-left:-.06em; }
  .folder-note { margin-top:14px; font-size:9px; letter-spacing:.16em; text-transform:uppercase; color:#686b42; }
  .open-hint { position:absolute; right:12%; bottom:10%; display:flex; align-items:center; gap:6px; font-size:10px; color:#59643d; }
  .open-hint svg { width:14px; height:14px; transform:rotate(-35deg); }
  .folder-button:hover .folder,.folder-button:focus-visible .folder { transform:translateY(-6px) rotate(-3deg); }
  .folder-button:hover .paper.one,.folder-button:focus-visible .paper.one { transform:translate(-18px,-19px) rotate(-12deg); }
  .folder-button:hover .paper.two,.folder-button:focus-visible .paper.two { transform:translate(25px,-26px) rotate(13deg); }
  .folder-button:hover .paper.three,.folder-button:focus-visible .paper.three { transform:translate(0,-13px) rotate(1deg); }
  .card-bottom { position:absolute; bottom:6%; left:7%; right:7%; display:flex; align-items:center; justify-content:space-between; gap:12px; }
  .project-type { font-size:12px; color:#c1d2c5; line-height:1.6; }
  .project-type small { display:block; color:#8dab99; font-size:10px; }
  .overview-link { display:flex; align-items:center; gap:10px; border:0; background:none; padding:0; color:#e1e8d9; font-size:11px; }
  .overview-link .circle { width:40px; height:40px; display:grid; place-items:center; border:1px solid #6c927a; border-radius:50%; transition:background .2s,transform .2s; }
  .overview-link:hover .circle { background:#36583f; transform:rotate(-35deg); }
  dialog { color:#26382b; background:#f3f5eb; border:1px solid #ffffff50; border-radius:22px; width:min(1280px,calc(100vw - 48px)); max-width:none; max-height:calc(100dvh - 48px); padding:0; overflow:auto; margin:auto; box-shadow:0 32px 100px #061a1459; font-size:14px; }
  dialog::backdrop { background:#071c16c9; backdrop-filter:blur(12px); }
  dialog[open] { animation:dialog-in .25s ease-out; }
  .modal-header { position:sticky; top:0; z-index:3; background:#f3f5eb; display:flex; align-items:center; justify-content:space-between; gap:20px; padding:22px 28px; border-bottom:1px solid #dce2d3; }
  .modal-brand { display:flex; align-items:center; gap:15px; }
  .modal-brand strong { font-size:34px; font-weight:500; letter-spacing:-.08em; line-height:1; }
  .modal-brand span { font-size:11px; color:#788471; padding-left:15px; border-left:1px solid #cad4bf; }
  .header-actions { display:flex; gap:8px; align-items:center; }
  .mode-button { border:0; border-radius:30px; padding:10px 16px; color:#617259; background:transparent; font-size:12px; }
  .mode-button[aria-pressed=true] { color:#eff3e6; background:#294332; }
  .close { width:40px; height:40px; margin-left:8px; border:1px solid #d1dac8; border-radius:50%; display:grid; place-items:center; color:#36513a; background:transparent; }
  .close svg { width:18px; height:18px; }
  .gallery { padding:20px 28px 22px; }
  .screen-tabs { display:flex; align-items:center; gap:6px; margin-bottom:16px; }
  .screen-tab { background:transparent; color:#6c7c62; border:1px solid transparent; padding:10px 15px; border-radius:8px; font-size:12px; }
  .screen-tab[aria-pressed=true] { background:#e5ebdb; color:#30492e; border-color:#d4dfc5; }
  .screen-tab small { font-size:10px; opacity:.55; margin-right:8px; }
  .screen-frame { display:flex; align-items:center; justify-content:center; background:#e5eadf; border:1px solid #d9e0d1; border-radius:12px; overflow:hidden; min-height:160px; }
  .screen-image { display:block; width:100%; height:auto; max-height:calc(100dvh - 265px); object-fit:contain; }
  .screen-footer { display:flex; align-items:center; justify-content:space-between; gap:20px; margin-top:17px; }
  .caption { margin:0; font-size:12px; line-height:1.6; color:#54664b; }
  .demo-note { display:block; margin-top:4px; color:#85927a; font-size:10px; }
  .paging { display:flex; gap:9px; align-items:center; white-space:nowrap; font-size:11px; color:#7b8a6f; }
  .full-size { color:#526b45; font-size:11px; text-decoration:none; margin-right:8px; }
  .full-size:hover { text-decoration:underline; }
  .paging button { display:grid; place-items:center; width:36px; height:36px; border:1px solid #d2dbc9; border-radius:50%; background:transparent; color:#36513a; }
  .paging svg { width:16px; height:16px; }
  .previous svg { transform:rotate(180deg); }
  .overview { padding:42px 44px; }
  .overview-label { margin:0 0 16px; color:#85917b; font-size:10px; letter-spacing:.14em; text-transform:uppercase; }
  .overview-grid { display:grid; grid-template-columns:1.15fr 1fr; align-items:start; gap:50px; }
  h2 { margin:0 0 20px; font-size:clamp(30px,3.6vw,49px); font-weight:500; letter-spacing:-.055em; line-height:1.12; max-width:530px; }
  .intro { margin:0; color:#68795d; line-height:1.8; max-width:510px; font-size:14px; }
  .overview-image { width:100%; max-height:240px; object-fit:contain; background:#e5eadf; border:1px solid #d1dac8; border-radius:12px; margin-top:25px; display:block; }
  .feature { padding:18px 0; border-bottom:1px solid #d6dfcc; display:grid; grid-template-columns:28px 1fr; gap:12px; }
  .feature:first-child { padding-top:0; }
  .feature-number { font-size:11px; color:#a0aa94; padding-top:3px; }
  h3 { font-size:16px; font-weight:500; letter-spacing:-.02em; margin:0 0 8px; }
  .feature p { font-size:12px; line-height:1.75; color:#718166; margin:0; }
  .overview-bottom { margin-top:30px; display:flex; align-items:center; justify-content:space-between; gap:20px; color:#839077; font-size:11px; }
  .browse-button { display:flex; align-items:center; gap:15px; padding:13px 19px; border:0; border-radius:25px; background:#294332; color:#f0f4e6; font-size:12px; }
  .browse-button svg { width:17px; height:17px; }
  [hidden] { display:none !important; }
  @keyframes dialog-in { from { opacity:0; transform:translateY(12px) scale(.99); } to { opacity:1; transform:none; } }
  @media (min-width:810px) and (max-width:1199.98px) { :host { width:400px; } .wordmark { font-size:75px; } .folder-note { font-size:8px; } }
  @media (max-width:809.98px) { :host { width:333.3333px; } .wordmark { font-size:64px; } .eyebrow { font-size:8px; } .folder-note { font-size:7px; margin-top:9px; } .open-hint { font-size:8px; } .project-type { font-size:10px; } .project-type small { font-size:8px; } .overview-link { font-size:9px; gap:8px; } .overview-link .circle { width:32px; height:32px; } }
  @media (max-width:650px) { dialog { width:calc(100vw - 20px); max-height:calc(100dvh - 20px); border-radius:16px; } .modal-header { padding:17px 16px; gap:10px; } .modal-brand { gap:0; } .modal-brand strong { font-size:29px; } .modal-brand span { display:none; } .mode-button { padding:9px 12px; font-size:11px; } .close { width:34px; height:34px; margin-left:0; } .gallery { padding:18px 12px; } .screen-tabs { gap:2px; justify-content:space-between; } .screen-tab { font-size:11px; padding:10px 9px; } .screen-tab small { display:none; } .screen-frame { min-height:0; } .screen-image { max-height:none; } .screen-footer { gap:10px; align-items:flex-start; margin-top:16px; } .caption { font-size:11px; } .demo-note { font-size:9px; } .paging { gap:6px; } .paging button { width:34px; height:34px; } .overview { padding:26px 20px; } .overview-grid { grid-template-columns:1fr; gap:30px; } h2 { font-size:34px; } .overview-bottom { flex-wrap:wrap; gap:16px; } }
  @media (max-width:650px) { .screen-footer { flex-direction:column; } .paging { width:100%; } .full-size { margin-right:auto; } }
  @media (max-width:360px) { .screen-tab { padding:10px 6px; } .mode-button { padding:9px 10px; } .modal-header { padding:17px 12px; } }
  @media (prefers-reduced-motion:reduce) { *,*::before,*::after { transition:none !important; animation:none !important; } }
`;

class SidraProject extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.screenIndex = 0;
    this.shadowRoot.innerHTML = `<style>${styles}</style>
      <article class="card" aria-label="SIDRA project">
        <div class="eyebrow"><span>Selected work / SIDRA</span><span>Made by NPC Automators</span></div>
        <button class="folder-button" type="button" aria-label="Open SIDRA screenshots" aria-haspopup="dialog">
          <span class="folder" aria-hidden="true">
            <span class="folder-back"></span>
            <span class="paper one"><img src="${imagePath('chat')}" loading="lazy" alt="" draggable="false"></span>
            <span class="paper two"><img src="${imagePath('inbox')}" loading="lazy" alt="" draggable="false"></span>
            <span class="paper three"><img src="${imagePath('dashboard')}" loading="lazy" alt="" draggable="false"></span>
            <span class="folder-front"><span class="wordmark">sidra</span><span class="folder-note">A smarter way to run your business</span><span class="open-hint">Open project ${arrow}</span></span>
          </span>
        </button>
        <div class="card-bottom"><div class="project-type">AI business workspace<small>Dashboard · Chat · Comments · Inbox</small></div><button class="overview-link" type="button" aria-label="View SIDRA project overview" aria-haspopup="dialog"><span>Project overview</span><span class="circle">${arrow}</span></button></div>
      </article>
      <dialog aria-label="SIDRA project" data-lenis-prevent>
        <header class="modal-header"><div class="modal-brand"><strong>sidra</strong><span>Inside the project</span></div><div class="header-actions"><button class="mode-button" data-mode="screens" aria-pressed="true" type="button">Screens</button><button class="mode-button" data-mode="overview" aria-pressed="false" type="button">Overview</button><button class="close" type="button" aria-label="Close SIDRA project"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6"/></svg></button></div></header>
        <section class="gallery" aria-label="SIDRA screenshots">
          <nav class="screen-tabs" aria-label="Project screens">${screens.map((screen, index) => `<button class="screen-tab" type="button" data-screen="${index}" aria-pressed="${index === 0}"><small>0${index + 1}</small>${screen.name}</button>`).join('')}</nav>
          <div class="screen-frame"><img class="screen-image" src="${imagePath('dashboard')}" alt="SIDRA Dashboard with fictional orders, customers and activity"></div>
          <footer class="screen-footer"><div><p class="caption" aria-live="polite">${screens[0].caption}</p><small class="demo-note">Actual SIDRA interface · Fictional demo data</small></div><div class="paging"><a class="full-size" href="${imagePath('dashboard')}" target="_blank" rel="noopener" aria-label="Open full resolution SIDRA screenshot">Full size ↗</a><button class="previous" type="button" aria-label="Previous SIDRA screenshot">${arrow}</button><span class="page-count" aria-live="polite">01 / 04</span><button class="next" type="button" aria-label="Next SIDRA screenshot">${arrow}</button></div></footer>
        </section>
        <section class="overview" aria-label="SIDRA project overview" hidden>
          <p class="overview-label">Project overview / Digital product</p>
          <div class="overview-grid"><div><h2>Every conversation.<br>One thoughtful workspace.</h2><p class="intro">SIDRA brings customer conversations, social comments and business operations together. An AI assistant helps with the everyday work, while your team stays in control of the decisions that matter.</p><img class="overview-image" src="${imagePath('inbox')}" alt="SIDRA unified customer inbox with fictional demo conversations" loading="lazy"></div>
          <div><div class="feature"><span class="feature-number">01</span><div><h3>A clear business dashboard</h3><p>See orders, new customers and connected accounts at a glance, with activity over time and a workspace for your documents.</p></div></div><div class="feature"><span class="feature-number">02</span><div><h3>An assistant with context</h3><p>Chat with SIDRA about your business, review information and plan the next step. A customer test mode lets you explore the agent experience.</p></div></div><div class="feature"><span class="feature-number">03</span><div><h3>Social comments, considered</h3><p>Manage Facebook and Instagram comments, preview reply rules and review responses before they go out.</p></div></div><div class="feature"><span class="feature-number">04</span><div><h3>One inbox. A human touch.</h3><p>Bring Messenger, WhatsApp, Instagram, Telegram and email into one place. Take over a conversation when it needs your attention.</p></div></div></div></div>
          <footer class="overview-bottom"><span>Designed & built by NPC Automators</span><button class="browse-button" type="button">Explore the screens ${arrow}</button></footer>
        </section>
      </dialog>`;
    const root = this.shadowRoot;
    this.dialog = root.querySelector('dialog');
    root.querySelector('.folder-button').addEventListener('click', () => this.open('screens'));
    root.querySelector('.overview-link').addEventListener('click', () => this.open('overview'));
    root.querySelector('.close').addEventListener('click', () => this.dialog.close());
    root.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => this.setMode(button.dataset.mode)));
    root.querySelector('.browse-button').addEventListener('click', () => this.setMode('screens'));
    root.querySelectorAll('[data-screen]').forEach(button => button.addEventListener('click', () => this.setScreen(Number(button.dataset.screen))));
    root.querySelector('.previous').addEventListener('click', () => this.setScreen(this.screenIndex - 1));
    root.querySelector('.next').addEventListener('click', () => this.setScreen(this.screenIndex + 1));
    this.dialog.addEventListener('keydown', event => {
      if (this.mode !== 'screens' || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault(); this.setScreen(this.screenIndex + (event.key === 'ArrowRight' ? 1 : -1));
      }
    });
    this.dialog.addEventListener('click', event => {
      if (event.target !== this.dialog) return;
      const box = this.dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) this.dialog.close();
    });
    this.dialog.addEventListener('close', () => {
      document.documentElement.style.overflow = this.previousOverflow;
      this.removeAttribute('data-lenis-prevent');
    });
  }
  open(mode) {
    this.setMode(mode);
    if (this.dialog.open) return;
    this.previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    this.setAttribute('data-lenis-prevent', 'true');
    this.dialog.showModal();
  }
  setMode(mode) {
    this.mode = mode;
    const root = this.shadowRoot;
    root.querySelector('.gallery').hidden = mode !== 'screens';
    root.querySelector('.overview').hidden = mode !== 'overview';
    root.querySelectorAll('[data-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
    this.dialog.scrollTop = 0;
  }
  setScreen(index) {
    this.screenIndex = (index + screens.length) % screens.length;
    const screen = screens[this.screenIndex], root = this.shadowRoot;
    const img = root.querySelector('.screen-image');
    img.src = imagePath(screen.file);
    img.alt = `SIDRA ${screen.name} interface with fictional demo data`;
    root.querySelector('.full-size').href = imagePath(screen.file);
    root.querySelector('.caption').textContent = screen.caption;
    root.querySelector('.page-count').textContent = `0${this.screenIndex + 1} / 04`;
    root.querySelectorAll('[data-screen]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.screen) === this.screenIndex)));
  }
  disconnectedCallback() {
    if (this.dialog.open) this.dialog.close();
  }
}
if (!customElements.get('npc-sidra-project')) customElements.define('npc-sidra-project', SidraProject);
