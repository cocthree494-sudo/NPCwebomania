/**
 * Scroll-velocity rows adapted for this HTML/Framer site from Magic UI:
 * https://magicui.design/docs/components/scroll-based-velocity (MIT).
 * Uses the same wrapped copies, opposing directions and scroll-speed multiplier.
 * A shadow root lets the original React graph hydrate the host safely.
 */
class NPCScrollVelocity extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; width:100%; min-width:0; color:var(--npc-paper, #f3f5eb); }
        .rows { display:grid; gap:12px; padding:20px 0 28px; overflow:hidden; }
        .row { overflow:hidden; white-space:nowrap; }
        .track { display:flex; width:max-content; will-change:transform; }
        .copy {
          flex:none; padding-right:.3em;
          font-family:Inter, sans-serif; font-weight:900;
          font-size:clamp(48px, 8.7vw, 156px); line-height:1.12;
          letter-spacing:-.055em;
        }
        .row:nth-child(2) { color:var(--npc-pear, #b9d879); }
        @media (max-width:600px) {
          .rows { gap:8px; padding:12px 0 20px; }
        }
        @media (prefers-reduced-motion:reduce) {
          .track { width:100%; justify-content:center; transform:none !important; will-change:auto; }
          .copy { font-size:clamp(24px, 6.8vw, 120px); padding:0; }
          .copy[aria-hidden] { display:none; }
        }
      </style>
      <div class="rows">
        <div class="row"><div class="track"><span class="copy">#NPC AUTOMATORS</span></div></div>
        <div class="row"><div class="track"><span class="copy">scale your business.</span></div></div>
      </div>`;
    this.rows = [...this.shadowRoot.querySelectorAll(".track")].map((track, index) => ({
      track, block: track.firstElementChild, width: 0, offset: 0,
      direction: index === 0 ? 1 : -1,
    }));
    this.frame = 0;
    this.visible = false;
    this.tick = this.tick.bind(this);
    this.updatePlayback = this.updatePlayback.bind(this);
  }

  connectedCallback() {
    this.motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
    this.motionPreference.addEventListener("change", this.updatePlayback);
    document.addEventListener("visibilitychange", this.updatePlayback);
    this.resizeObserver = new ResizeObserver(() => this.measure());
    this.resizeObserver.observe(this);
    this.rows.forEach(({ block }) => this.resizeObserver.observe(block));
    this.intersectionObserver = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      this.updatePlayback();
    });
    this.intersectionObserver.observe(this);
    this.measure();
  }

  disconnectedCallback() {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.resizeObserver.disconnect();
    this.intersectionObserver.disconnect();
    this.motionPreference.removeEventListener("change", this.updatePlayback);
    document.removeEventListener("visibilitychange", this.updatePlayback);
  }

  measure() {
    for (const row of this.rows) {
      row.width = row.block.getBoundingClientRect().width;
      if (!row.width) continue;
      const copies = Math.max(3, Math.ceil(this.clientWidth / row.width) + 2);
      while (row.track.children.length > copies) row.track.lastElementChild.remove();
      while (row.track.children.length < copies) {
        const copy = row.block.cloneNode(true);
        copy.setAttribute("aria-hidden", "true");
        row.track.append(copy);
      }
    }
  }

  updatePlayback() {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    if (!this.visible || document.hidden || this.motionPreference.matches) return;
    this.lastTime = performance.now();
    this.lastScroll = window.scrollY;
    this.smoothVelocity = 0;
    this.springVelocity = 0;
    this.scrollDirection = 1;
    this.frame = requestAnimationFrame(this.tick);
  }

  tick(now) {
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    const scroll = window.scrollY;
    const velocity = (scroll - this.lastScroll) / Math.max(dt, 0.001);
    this.lastScroll = scroll;
    // Integrate Magic UI's stiffness 400 / damping 50 spring in small steps.
    const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
    const step = dt / steps;
    for (let i = 0; i < steps; i++) {
      this.springVelocity += (400 * (velocity - this.smoothVelocity) - 50 * this.springVelocity) * step;
      this.smoothVelocity += this.springVelocity * step;
    }
    const factor = Math.min(5, Math.abs(this.smoothVelocity) / 200);
    if (factor > 0.1) this.scrollDirection = Math.sign(this.smoothVelocity);
    for (const row of this.rows) {
      if (!row.width) continue;
      // A 5% baseline keeps the large footer readable; scrolling accelerates it.
      row.offset += row.direction * this.scrollDirection * row.width * 0.05 * (1 + factor) * dt;
      row.offset = ((row.offset % row.width) + row.width) % row.width;
      row.track.style.transform = `translate3d(${-row.offset}px, 0, 0)`;
    }
    this.frame = requestAnimationFrame(this.tick);
  }
}

if (!customElements.get("npc-scroll-velocity")) {
  customElements.define("npc-scroll-velocity", NPCScrollVelocity);
}
