/**
 * Dither Field adapted from https://magicui.design/docs/components/dither-field
 * for the site's existing HTML/Framer hydration graph.
 *
 * MIT License
 * 
 * Copyright (c) Magic UI
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * 
 */

const PATTERNS = {
    // A low sun on the bottom edge, with haze bands that drift up through it.
    horizon: `
    float r = max(min(size.x * 0.42, size.y * 0.8), 90.0);
    vec2 d = (p - vec2(0.5 * size.x, -0.15 * r)) / vec2(1.25 * r, r);
    float wobble = fbm(vec2(atan(d.y, d.x) * 1.8, t * 0.04)) - 0.5;
    float rim = length(d) * (1.0 + 0.14 * wobble);
    float sun = exp(-3.4 * max(rim - 0.42, 0.0)) * 0.78;
    float h = p.y / r;
    float drift = (fbm(vec2(p.x / 320.0, t * 0.03)) - 0.5) * 2.4;
    float band = 0.5 + 0.5 * sin(log(1.0 + 7.0 * h) * 8.0 - t * 0.45 + drift);
    float haze = smoothstep(0.25, 0.95, band) * exp(-1.9 * h) * 0.5;
    float ground = exp(-p.y / 22.0) * 0.32;
    float sides = smoothstep(0.0, 0.2, p.x / size.x) * smoothstep(1.0, 0.8, p.x / size.x);
    return (sun * (1.0 + haze) + haze * 0.35 + ground) * sides * (1.0 + 0.04 * sin(t * 0.4));
  `,
    // A soft orb in the middle that breathes and wanders a little.
    glow: `
    vec2 c = 0.5 * size + vec2(sin(t * 0.21), cos(t * 0.17)) * 0.05 * size;
    float r = 0.5 * min(size.x, size.y);
    float d = length(p - c) / r;
    float n = fbm(p / 170.0 + vec2(t * 0.05, -t * 0.04));
    return exp(-1.7 * d * d) * (0.75 + 0.45 * n) + 0.12 * n * exp(-d);
  `,
    // Curtains of light that hang from the top and sway.
    aurora: `
    float sway = fbm(vec2(p.x / 600.0, t * 0.05));
    float d = p.y / size.y - (0.45 + 0.35 * (sway - 0.5));
    float curtain = d > 0.0 ? exp(-d * 4.0) : exp(d * 22.0);
    float rays = fbm(vec2(p.x / 70.0 + sway * 6.0, p.y / 900.0 - t * 0.08));
    float shimmer = fbm(vec2(p.x / 40.0 - t * 0.05, 3.0));
    return curtain * (0.25 + 0.75 * smoothstep(0.3, 0.75, rays)) * (0.6 + 0.5 * shimmer);
  `,
    // Slow diagonal swells, like dunes or contour lines.
    waves: `
    vec2 q = p / 32.0;
    float warp = fbm(q * 0.09 + vec2(t * 0.035, t * 0.02));
    float s = 0.5 + 0.5 * sin(q.x * 0.9 + q.y * 0.6 + warp * 5.0 - t * 0.4);
    float crest = s * s * s * s;
    return crest * (0.5 + 0.5 * p.y / size.y) + 0.12 * warp;
  `,
    // Drifting clouds that fill the whole area evenly.
    clouds: `
    float n = fbm(p / 210.0 + vec2(t * 0.03, t * 0.012));
    float m = fbm(p / 80.0 - vec2(t * 0.02, 0.0));
    return smoothstep(0.28, 0.78, n) * (0.7 + 0.5 * m);
  `,
};
const VERTEX = `#version 300 es
void main() {
  vec2 corner = vec2(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0);
  gl_Position = vec4(corner, 0.0, 1.0);
}`;
const FIELD_HEADER = `#version 300 es
precision highp float;
uniform vec2 uSize;
uniform vec2 uView;
uniform float uTime;
out vec4 outColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float sum = 0.0;
  float amp = 0.5;
  mat2 turn = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    sum += amp * noise(p);
    p = turn * p * 2.0 + 11.7;
    amp *= 0.5;
  }
  return sum;
}
`;
const FIELD_MAIN = `
void main() {
  vec2 p = gl_FragCoord.xy / uView * uSize;
  float v = pattern(p, uSize, uTime);
  outColor = vec4(clamp(v, 0.0, 1.0), 0.0, 0.0, 1.0);
}`;
// Image and video: luminance under a cover fit, so bright areas get more dots.
const MEDIA_PATTERN = `
uniform sampler2D uMedia;
uniform vec2 uMediaSize;

float pattern(vec2 p, vec2 size, float t) {
  float scale = max(size.x / uMediaSize.x, size.y / uMediaSize.y);
  vec2 uv = (p - 0.5 * size) / (uMediaSize * scale) + 0.5;
  vec4 c = texture(uMedia, vec2(uv.x, 1.0 - uv.y));
  return dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
}
`;
const DITHER = `#version 300 es
precision highp float;
uniform sampler2D uField;
uniform vec2 uView;
uniform vec4 uLow;
uniform vec4 uMid;
uniform vec4 uHigh;
uniform float uIntensity;
uniform vec3 uPointer;
uniform float uDot;
out vec4 outColor;

// 8x8 ordered-dither threshold, built from the 2x2 matrix [0 2; 3 1]. The
// lowest bit of the cell position carries the largest weight.
float threshold(vec2 cell) {
  vec2 c = floor(cell);
  float sum = 0.0;
  float weight = 16.0;
  for (int i = 0; i < 3; i++) {
    vec2 b = mod(c, 2.0);
    sum += weight * mod(2.0 * b.x + 3.0 * b.y, 4.0);
    c = floor(c * 0.5);
    weight *= 0.25;
  }
  return (sum + 0.5) / 64.0;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uView;
  float base = texture(uField, uv).r;
  float halo = textureLod(uField, uv, 1.0).r * 0.45
    + textureLod(uField, uv, 2.2).r * 0.35
    + textureLod(uField, uv, 3.4).r * 0.2;
  float v = base + 0.55 * halo;
  float over = max(v - 0.85, 0.0);
  v = min(v, 0.85) + over / (1.0 + 4.0 * over);
  v = clamp(v * uIntensity, 0.0, 1.0);
  // The pointer glow comes after intensity, so it shows on quiet fields too.
  vec2 away = gl_FragCoord.xy * uDot - uPointer.xy;
  v = min(v + uPointer.z * 0.9 * exp(-dot(away, away) / 28000.0) * (0.35 + 0.5 * v), 1.0);
  // Drop the faintest light, so empty areas stay empty instead of showing
  // a sparse, even grid.
  v = max(v - 0.02, 0.0) / 0.98;
  float on = step(threshold(gl_FragCoord.xy), v);
  vec4 c = v < 0.5 ? mix(uLow, uMid, v * 2.0) : mix(uMid, uHigh, v * 2.0 - 1.0);
  outColor = vec4(c.rgb * c.a, c.a) * on;
}`;
/** The light field renders at this fraction of the CSS size, then blooms. */
const FIELD_SCALE = 0.6;
const POINTER_EASE = 6;
const VIDEO_FILE = /^data:video\/|\.(mp4|webm|ogv|mov|m4v)(\?|#|$)/i;
function compile(gl, fragment) {
    const program = gl.createProgram();
    for (const [type, source] of [
        [gl.VERTEX_SHADER, VERTEX],
        [gl.FRAGMENT_SHADER, fragment],
    ]) {
        const shader = gl.createShader(type);
        if (!shader)
            return null;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.warn("DitherField: shader error", gl.getShaderInfoLog(shader));
        }
        gl.attachShader(program, shader);
        gl.deleteShader(shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        gl.deleteProgram(program);
        return null;
    }
    return program;
}
function createTexture(gl, mipmaps) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    const min = mipmaps ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, min);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
}
/**
 * Two passes: the light field renders small into a mipmapped texture, then
 * the dither pass reads it with a bloom from the blurred mip levels and
 * thresholds it into dots, one canvas pixel per dot. Returns null when the
 * shaders do not compile, so the caller can fall back.
 */
function createRenderer(gl, patternSource) {
    const field = compile(gl, `${FIELD_HEADER}${patternSource}${FIELD_MAIN}`);
    const dither = compile(gl, DITHER);
    if (!field || !dither) {
        gl.deleteProgram(field);
        gl.deleteProgram(dither);
        return null;
    }
    const at = (program, name) => gl.getUniformLocation(program, name);
    const fieldTexture = createTexture(gl, true);
    const mediaTexture = createTexture(gl, false);
    const framebuffer = gl.createFramebuffer();
    let media = null;
    // Images upload once; video uploads a new frame on every draw.
    let mediaStale = false;
    let view = [1, 1];
    let fieldView = [1, 1];
    let css = [1, 1];
    gl.useProgram(dither);
    gl.uniform1i(at(dither, "uField"), 0);
    gl.useProgram(field);
    gl.uniform1i(at(field, "uMedia"), 1);
    return {
        resize(dotsX, dotsY, cssX, cssY) {
            view = [dotsX, dotsY];
            css = [cssX, cssY];
            fieldView = [
                Math.max(1, Math.round(cssX * FIELD_SCALE)),
                Math.max(1, Math.round(cssY * FIELD_SCALE)),
            ];
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, fieldTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, fieldView[0], fieldView[1], 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fieldTexture, 0);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        },
        setRamp([low, mid, high]) {
            gl.useProgram(dither);
            gl.uniform4f(at(dither, "uLow"), ...low);
            gl.uniform4f(at(dither, "uMid"), ...mid);
            gl.uniform4f(at(dither, "uHigh"), ...high);
        },
        setIntensity(intensity) {
            gl.useProgram(dither);
            gl.uniform1f(at(dither, "uIntensity"), intensity);
        },
        setMedia(next) {
            media = next;
            mediaStale = true;
        },
        draw(time, pointer) {
            gl.useProgram(field);
            if (media) {
                const source = media;
                const isVideo = source instanceof HTMLVideoElement;
                const width = isVideo ? source.videoWidth : source.naturalWidth;
                const height = isVideo ? source.videoHeight : source.naturalHeight;
                if (!width || !height)
                    return;
                if (mediaStale || isVideo) {
                    gl.activeTexture(gl.TEXTURE1);
                    gl.bindTexture(gl.TEXTURE_2D, mediaTexture);
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
                    gl.uniform2f(at(field, "uMediaSize"), width, height);
                    mediaStale = false;
                }
            }
            gl.uniform2f(at(field, "uSize"), css[0], css[1]);
            gl.uniform2f(at(field, "uView"), fieldView[0], fieldView[1]);
            gl.uniform1f(at(field, "uTime"), time);
            gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
            gl.viewport(0, 0, fieldView[0], fieldView[1]);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, fieldTexture);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.useProgram(dither);
            gl.uniform2f(at(dither, "uView"), view[0], view[1]);
            gl.uniform1f(at(dither, "uDot"), css[0] / view[0]);
            gl.uniform3f(at(dither, "uPointer"), ...pointer);
            gl.viewport(0, 0, view[0], view[1]);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
        },
        dispose() {
            gl.deleteProgram(field);
            gl.deleteProgram(dither);
            gl.deleteTexture(fieldTexture);
            gl.deleteTexture(mediaTexture);
            gl.deleteFramebuffer(framebuffer);
        },
    };
}
const toRamp = (color) => typeof color === "string" ? [color, color, color] : [...color];
/**
 * Resolves CSS colours (`var(--x)`, `currentColor`, `oklch()`) in the
 * context of `host`, then reads them back as straight RGBA through a
 * 1x1 canvas. A single colour fades from 35% to full opacity.
 */
function resolveRamp(host, color) {
    const probe = document.createElement("span");
    probe.style.display = "none";
    host.appendChild(probe);
    const context = document
        .createElement("canvas")
        .getContext("2d", { willReadFrequently: true });
    const fades = typeof color === "string" ? [0.35, 0.75, 1] : [1, 1, 1];
    const ramp = toRamp(color).map((value, index) => {
        probe.style.color = "";
        probe.style.color = value;
        if (!context)
            return [0.5, 0.5, 0.5, fades[index]];
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = "#808080";
        context.fillStyle = getComputedStyle(probe).color;
        context.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
        return [r / 255, g / 255, b / 255, (a / 255) * fades[index]];
    });
    probe.remove();
    return ramp;
}
function loadMedia(src, onReady, onError) {
    if (VIDEO_FILE.test(src)) {
        const video = document.createElement("video");
        video.crossOrigin = "anonymous";
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = "auto";
        video.addEventListener("loadeddata", () => onReady(video), { once: true });
        video.addEventListener("error", onError, { once: true });
        video.src = src;
        return video;
    }
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.addEventListener("load", () => onReady(image), { once: true });
    image.addEventListener("error", onError, { once: true });
    image.src = src;
    return image;
}
const ease = (from, to, rate, dt) => from + (to - from) * (1 - Math.exp(-rate * dt));
class NPCDitherField extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.shadowRoot.innerHTML = `
            <style>
                :host { display:block; position:relative; width:100%; height:100%; overflow:hidden; pointer-events:none; background:#050505; }
                .layer { position:absolute; inset:0; contain:paint; transform:translateZ(0); backface-visibility:hidden; }
                canvas { position:absolute; top:0; left:0; image-rendering:pixelated; opacity:0; transition:opacity .7s; }
                canvas[data-ready] { opacity:1; }
                .fallback { background-image:radial-gradient(#8b5cf6 .7px,transparent 1px); background-size:3px 3px; mask-image:radial-gradient(ellipse at 50% 100%,black,transparent 75%); opacity:.75; }
                @media (prefers-reduced-motion:reduce) { canvas { transition:none; } }
            </style>
            <div class="layer fallback" aria-hidden="true"></div>`;
        this.time = 10;
        this.shown = false;
        this.visible = false;
    }

    connectedCallback() {
        this.observer = new IntersectionObserver(([entry]) => {
            this.visible = entry.isIntersecting;
            if (this.visible && !this.stop) this.start();
            else this.syncPlayback?.();
        }, { rootMargin: "100px" });
        this.observer.observe(this);
    }

    disconnectedCallback() {
        this.observer.disconnect();
        this.release();
    }

    release() {
        this.stop?.();
        this.stop = null;
        this.syncPlayback = null;
    }

    start() {
        const root = this;
        const layer = this.shadowRoot.querySelector(".layer");
        const canvas = document.createElement("canvas");
        const gl = canvas.getContext("webgl2", {
            alpha: true, premultipliedAlpha: true, antialias: false,
            depth: false, stencil: false, powerPreference: "low-power",
        });
        const renderer = gl && createRenderer(gl,
            `float pattern(vec2 p, vec2 size, float t) {${PATTERNS.horizon}}`);
        if (!renderer) {
            gl?.getExtension("WEBGL_lose_context")?.loseContext();
            layer.classList.add("fallback");
            return;
        }

        const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
        const ramp = [[46 / 255, 16 / 255, 101 / 255, 1], [139 / 255, 92 / 255, 246 / 255, 1], [237 / 255, 233 / 255, 254 / 255, 1]];
        let frame = 0, previous = 0, cssHeight = 0, lost = false;
        let scrolling = false, scrollTimer = 0, resizePending = false;
        layer.appendChild(canvas);
        if (this.shown) canvas.dataset.ready = "";
        renderer.setRamp(ramp);
        renderer.setIntensity(0.75);

        const draw = () => {
            if (!cssHeight || lost) return;
            // Keep the field animated without any mouse or touch glow.
            renderer.draw(this.time, [0, 0, 0]);
            canvas.dataset.ready = "";
            layer.classList.remove("fallback");
            this.shown = true;
        };
        const resize = () => {
            if (scrolling) { resizePending = true; return; }
            const width = root.clientWidth, height = root.clientHeight;
            if (!width || !height) return;
            const dpr = devicePixelRatio || 1;
            const devicePerDot = Math.max(1, Math.round(dpr));
            const cssPerDot = devicePerDot / dpr;
            const dotsX = Math.ceil(width / cssPerDot);
            const dotsY = Math.ceil(height / cssPerDot);
            // Assigning canvas dimensions clears its pixels and reallocates
            // the GL textures, even if the dimensions did not change.
            if (canvas.width === dotsX && canvas.height === dotsY && cssHeight === dotsY * cssPerDot) return;
            cssHeight = dotsY * cssPerDot;
            canvas.width = dotsX;
            canvas.height = dotsY;
            canvas.style.width = `${dotsX * cssPerDot}px`;
            canvas.style.height = `${cssHeight}px`;
            renderer.resize(dotsX, dotsY, dotsX * cssPerDot, cssHeight);
            draw();
        };
        const tick = (now) => {
            frame = requestAnimationFrame(tick);
            if (previous && now - previous < 1000 / 30 - 2) return;
            const dt = previous ? Math.min((now - previous) / 1000, 2) : 0;
            previous = now;
            this.time += dt;
            draw();
        };
        const sync = () => {
            cancelAnimationFrame(frame);
            frame = 0;
            previous = 0;
            if (this.visible && !scrolling && !lost && !document.hidden && !reducedMotion.matches) frame = requestAnimationFrame(tick);
            else if (reducedMotion.matches) {
                draw();
            }
        };
        this.syncPlayback = sync;
        const onScroll = () => {
            if (!this.visible || document.hidden) return;
            if (!scrolling) {
                scrolling = true;
                canvas.dataset.scrolling = "";
                sync();
            }
            clearTimeout(scrollTimer);
            // Let native/Lenis scrolling move the existing composited texture.
            // Resume the same animation clock once scrolling has settled.
            scrollTimer = setTimeout(() => {
                scrolling = false;
                delete canvas.dataset.scrolling;
                if (resizePending) { resizePending = false; resize(); }
                sync();
            }, 140);
        };
        const onLost = (event) => {
            event.preventDefault();
            lost = true;
            sync();
            canvas.removeAttribute("data-ready");
            layer.classList.add("fallback");
        };
        const onRestored = () => { this.release(); if (this.isConnected) this.start(); };
        let ratioQuery;
        const watchRatio = () => {
            ratioQuery?.removeEventListener("change", onRatio);
            ratioQuery = matchMedia(`(resolution: ${devicePixelRatio}dppx)`);
            ratioQuery.addEventListener("change", onRatio);
        };
        const onRatio = () => { resize(); watchRatio(); };
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(root);
        watchRatio();
        resize();
        sync();
        reducedMotion.addEventListener("change", sync);
        document.addEventListener("visibilitychange", sync);
        window.addEventListener("scroll", onScroll, { passive: true });
        canvas.addEventListener("webglcontextlost", onLost);
        canvas.addEventListener("webglcontextrestored", onRestored);

        this.stop = () => {
            cancelAnimationFrame(frame);
            clearTimeout(scrollTimer);
            resizeObserver.disconnect();
            ratioQuery?.removeEventListener("change", onRatio);
            reducedMotion.removeEventListener("change", sync);
            document.removeEventListener("visibilitychange", sync);
            window.removeEventListener("scroll", onScroll);
            canvas.removeEventListener("webglcontextlost", onLost);
            canvas.removeEventListener("webglcontextrestored", onRestored);
            renderer.dispose();
            gl.getExtension("WEBGL_lose_context")?.loseContext();
            canvas.remove();
        };
    }
}

if (!customElements.get("npc-dither-field")) {
    customElements.define("npc-dither-field", NPCDitherField);
}
