/* Top Scholar 11.11 — shared interactions for index.html and order.html */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Toast ---------- */
  const toastEl = $('#toast');
  let toastTimer;
  const toast = (msg) => {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-show'), 3200);
  };

  /* ---------- Nav: scrolled state + mobile menu ---------- */
  const nav = $('#nav');
  const onScroll = () => nav && nav.classList.toggle('is-scrolled', scrollY > 30);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  $('#navToggle')?.addEventListener('click', () => nav.classList.toggle('is-open'));
  $$('#navLinks a').forEach((a) => a.addEventListener('click', () => nav.classList.remove('is-open')));

  /* ---------- Countdowns ---------- */
  const pad = (n) => String(n).padStart(2, '0');
  const countdowns = $$('[data-countdown]').map((el) => ({
    el,
    target: new Date(el.dataset.countdown).getTime(),
    units: Object.fromEntries($$('[data-unit]', el).map((u) => [u.dataset.unit, u])),
  }));
  const tickCountdowns = () => {
    const now = Date.now();
    countdowns.forEach((c) => {
      let diff = Math.max(0, c.target - now);
      if (diff === 0 && c.el.dataset.done && !c.el.classList.contains('is-done')) {
        c.el.classList.add('is-done');
        c.el.textContent = c.el.dataset.done;
        return;
      }
      const vals = {
        d: Math.floor(diff / 864e5),
        h: Math.floor((diff / 36e5) % 24),
        m: Math.floor((diff / 6e4) % 60),
        s: Math.floor((diff / 1e3) % 60),
      };
      for (const [k, node] of Object.entries(c.units)) {
        const v = pad(vals[k]);
        if (node.textContent !== v) {
          node.textContent = v;
          if (!reduceMotion && node.closest('.cd, .s1__tile')) {
            node.classList.remove('tick');
            void node.offsetWidth; // restart animation
            node.classList.add('tick');
          }
        }
      }
    });
  };
  if (countdowns.length) {
    tickCountdowns();
    setInterval(tickCountdowns, 1000);
  }

  /* ---------- Count-up numbers ---------- */
  const countUp = (el) => {
    const end = +el.dataset.countup;
    const fmt = (n) => (el.dataset.format === 'comma' ? n.toLocaleString('en-US') : String(n));
    if (reduceMotion) { el.textContent = fmt(end); return; }
    const t0 = performance.now(), dur = +el.dataset.duration || 1800;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      el.textContent = fmt(Math.round(end * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      $$('[data-countup]', e.target).forEach(countUp);
      if (e.target.matches('[data-countup]')) countUp(e.target);
      io.unobserve(e.target);
    });
  }, { threshold: 0.15 });
  $$('.reveal, .wl-note').forEach((el) => io.observe(el));

  /* ---------- Hero parallax (mouse only; a scroll offset would pull the photo away from the section) ---------- */
  const bg = $('[data-parallax]');
  if (bg && !reduceMotion) {
    let mx = 0, my = 0;
    addEventListener('mousemove', (e) => {
      mx = (e.clientX / innerWidth - 0.5) * 2;
      my = (e.clientY / innerHeight - 0.5) * 2;
    }, { passive: true });
    const loop = () => {
      bg.style.translate = `${mx * -10}px ${my * -6}px`;
      requestAnimationFrame(loop);
    };
    loop();
  }

  /* ---------- Sea spray / golden dust particles ---------- */
  $$('[data-spray]').forEach((canvas) => {
    if (reduceMotion) return;
    const ctx = canvas.getContext('2d');
    let w, h, dpr, parts = [];
    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(90, w / 14));
      parts = Array.from({ length: n }, () => spawn(true));
    };
    const spawn = (anywhere) => ({
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : h + 10,
      r: Math.random() * 1.8 + 0.4,
      vy: -(Math.random() * 0.35 + 0.1),
      vx: (Math.random() - 0.5) * 0.25,
      a: Math.random() * 0.6 + 0.2,
      warm: Math.random() < 0.55,
      tw: Math.random() * Math.PI * 2,
    });
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      parts.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy; p.tw += 0.04;
        if (p.y < -10) parts[i] = spawn(false);
        const alpha = p.a * (0.6 + 0.4 * Math.sin(p.tw));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.warm ? `rgba(255,170,90,${alpha})` : `rgba(220,235,255,${alpha})`;
        ctx.shadowBlur = 8; ctx.shadowColor = p.warm ? 'rgba(255,140,60,.8)' : 'rgba(200,225,255,.6)';
        ctx.fill();
      });
      requestAnimationFrame(draw);
    };
    resize();
    addEventListener('resize', resize);
    draw();
  });

  /* ---------- Live sea on the section 1 photo (WebGL) ----------
     Re-draws the photo with one continuous wave field below the horizon:
     four swells of different sizes and directions roll toward the viewer
     (spaced by perspective, so they bunch up near the horizon) with a fine
     chop on top, and their strength drifts slowly up and down. The two
     riders ride the same swell: each bobs and tilts as one rigid piece.
     Without WebGL the CSS background shows instead. */
  const SEA_LOOP = 3600;                  // seconds; keeps shader time precise
  $$('[data-water]').forEach((canvas) => {
    if (reduceMotion) return;
    const gl = canvas.getContext('webgl', { premultipliedAlpha: false, antialias: false });
    if (!gl) return;
    const host = canvas.parentElement;

    const vs = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';
    const fs = `
      #ifdef GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
      #else
      precision mediump float;
      #endif
      uniform sampler2D tex;
      uniform vec2 res, img, pos;
      uniform float t;
      const float HORIZON = .565;
      // jet-ski riders in image uv (x, y from top), their half sizes, and where they sit on the water
      const vec2 R1 = vec2(.355, .655), R2 = vec2(.64, .655), RS = vec2(.11, .18);
      const vec2 P1 = vec2(.355, .76), P2 = vec2(.64, .76);

      float rider(vec2 uv, vec2 c) { return 1.0 - smoothstep(.85, 1.1, length((uv - c) / RS)); }

      // sea surface height at a screen point; slope gets the (sideways, toward-viewer) gradient
      float sea(vec2 uv, out vec2 slope) {
        float z = 1.0 / (max(uv.y - HORIZON, 0.0) + .035);          // distance from the camera
        vec2 w = vec2((uv.x - .5) * z * 1.6, z);                    // world position on the water
        float h = 0.0; slope = vec2(0.0);
        // direction (sideways, toward), wavenumber, speed, height
        vec4 dir[4]; vec3 k[4];
        dir[0] = vec4(0.0, 1.0, 0, 0);   k[0] = vec3(.9, 1.15, 1.0);
        dir[1] = vec4(.36, .93, 0, 0);   k[1] = vec3(1.45, 1.55, .55);
        dir[2] = vec4(-.42, .91, 0, 0);  k[2] = vec3(2.3, 1.95, .34);
        dir[3] = vec4(.16, .99, 0, 0);   k[3] = vec3(3.4, 2.5, .2);
        for (int i = 0; i < 4; i++) {
          float ph = k[i].x * dot(dir[i].xy, w) + k[i].y * t;      // + t: crests move to smaller z, toward us
          h += k[i].z * sin(ph);
          slope += k[i].z * k[i].x * cos(ph) * dir[i].xy;
        }
        return h;
      }

      vec2 riderSample(vec2 uv, vec2 pivot, float swell) {
        vec2 sl; float h = sea(pivot, sl);
        float tilt = sl.x * .012 * swell;                          // roll with the sideways slope
        vec2 q = uv - pivot;
        q = vec2(cos(tilt) * q.x - sin(tilt) * q.y * (img.y / img.x),
                 sin(tilt) * q.x * (img.x / img.y) + cos(tilt) * q.y);
        return pivot + q - vec2(0.0, h * .0045 * swell);          // bob up and down
      }

      void main() {
        vec2 frag = vec2(gl_FragCoord.x, res.y - gl_FragCoord.y);
        float s = max(res.x / img.x, res.y / img.y);                // background-size: cover
        vec2 size = img * s;
        vec2 uv = (frag - (res - size) * pos) / size;

        // strength drifts slowly, so the sea is sometimes calmer, sometimes rougher
        float swell = .85 + .2 * sin(t * .23) * sin(t * .11 + 1.3) + .15 * sin(t * .071 + .4);

        float water = smoothstep(HORIZON, HORIZON + .02, uv.y);
        float depth = max(uv.y - HORIZON, 0.0);                      // perspective: nearer water moves more
        vec2 sl; float h = sea(uv, sl);
        vec2 d = vec2(sl.x * .006, h * .028) * depth * swell;
        float k = clamp(depth / (1.0 - HORIZON), 0.0, 1.0);
        float f = mix(300.0, 50.0, k);                               // fine chop
        vec2 chop = vec2(sin(uv.y * f * .7 + t * 1.9 + sin(uv.x * 23.0 + t * .6) * 1.6),
                         sin(uv.y * f + t * 2.4 + cos(uv.x * 17.0 - t * .8) * 2.0)) * mix(.0005, .0035, k * k);
        vec2 seaUv = uv + (d + chop) * water;

        float m1 = rider(uv, R1), m2 = rider(uv, R2);
        vec2 at = seaUv;
        at = mix(at, riderSample(uv, P1, swell), m1);
        at = mix(at, riderSample(uv, P2, swell), m2);
        vec4 c = texture2D(tex, clamp(at, .001, .999));

        // light catching the swell faces, plus a glint on the sun path
        float lit = max(0.0, -sl.y) * water * (1.0 - max(m1, m2)) * k;
        c.rgb += lit * .035 * swell * vec3(1.0, .82, .62);
        float sunPath = exp(-pow((uv.x - .505) / .045, 2.0));
        c.rgb += sunPath * water * max(0.0, chop.y / mix(.0005, .0035, k * k)) * .1 * vec3(1.0, .75, .45);
        gl_FragColor = c;
      }`;
    const sh = (type, src) => { const o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); return o; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const u = (n) => gl.getUniformLocation(prog, n);

    const image = new Image();
    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach((w) => gl.texParameteri(gl.TEXTURE_2D, w, gl.CLAMP_TO_EDGE));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.uniform2f(u('img'), image.naturalWidth, image.naturalHeight);

      const resize = () => {
        const dpr = Math.min(devicePixelRatio || 1, 1.5);
        canvas.width = Math.round(host.clientWidth * dpr);
        canvas.height = Math.round(host.clientHeight * dpr);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(u('res'), canvas.width, canvas.height);
        const cs = getComputedStyle(host);
        gl.uniform2f(u('pos'), parseFloat(cs.backgroundPositionX) / 100, parseFloat(cs.backgroundPositionY) / 100);
      };
      resize();
      addEventListener('resize', resize);

      let visible = true;
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(host);
      const t0 = performance.now();
      const frame = (now) => {
        if (visible) {
          gl.uniform1f(u('t'), ((now - t0) / 1000) % SEA_LOOP);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    };
    image.src = canvas.dataset.water;
  });

  /* ---------- Waving flag (section 3) ----------
     Draws the flag cut-out in thin vertical slices, each nudged up or down
     by a travelling sine wave that grows toward the free (right) end, then
     shades the slices so the folds catch the light. */
  $$('[data-flag]').forEach((canvas) => {
    const ctx = canvas.getContext('2d');
    const img = new Image();
    let w = 0, h = 0;                                     // canvas size in device pixels
    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.width = Math.round(canvas.clientWidth * dpr);
      h = canvas.height = Math.round(canvas.clientHeight * dpr);
    };
    const draw = (t) => {
      ctx.clearRect(0, 0, w, h);
      // whole-pixel slices that neither overlap nor leave gaps, so the soft edges stay clean
      const amp = h * 0.035, slice = 3, sx = img.naturalWidth / w;
      for (let x = 0; x < w; x += slice) {
        const sw = Math.min(slice, w - x);
        const free = Math.pow(x / w, 0.8);                 // the hoist side barely moves
        const ph = x / w * 9 - t * 2.2;
        const dy = Math.round(-amp * free * (1 + Math.sin(ph)) / 2);   // never drops below the top edge
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(img, x * sx, 0, sw * sx, img.naturalHeight, x, dy, sw, h);
        const light = Math.cos(ph) * free;
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = light > 0 ? `rgba(255,255,255,${light * 0.07})` : `rgba(0,0,0,${-light * 0.16})`;
        ctx.fillRect(x, 0, sw, h);
      }
      ctx.globalCompositeOperation = 'source-over';
    };
    img.onload = () => {
      resize();
      addEventListener('resize', () => { resize(); if (reduceMotion) draw(0); });
      if (reduceMotion) { draw(0); return; }
      let visible = true;
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
      const t0 = performance.now();
      const loop = (now) => { if (visible) draw((now - t0) / 1000); requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    };
    img.src = canvas.dataset.flag;
  });

  /* ---------- Modals ---------- */
  const openModal = (id) => {
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.add('is-open');
    m.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => m.querySelector('input, .modal__x')?.focus(), 50);
  };
  const closeModals = () => {
    $$('.modal.is-open').forEach((m) => { m.classList.remove('is-open'); m.setAttribute('aria-hidden', 'true'); });
    document.body.style.overflow = '';
  };
  $$('[data-open]').forEach((b) => b.addEventListener('click', () => openModal(b.dataset.open)));
  $$('[data-close]').forEach((b) => b.addEventListener('click', closeModals));
  addEventListener('keydown', (e) => e.key === 'Escape' && closeModals());

  /* ---------- Phone validation ---------- */
  const validPhone = (v) => /^\+?[\d\s-]{8,16}$/.test(v.trim());
  const flagInvalid = (input) => {
    input.classList.remove('is-invalid');
    void input.offsetWidth;
    input.classList.add('is-invalid');
    input.focus();
  };

  /* ---------- Waiting list form (index) ---------- */
  const wlForm = $('#waitlistForm');
  if (wlForm) {
    const input = wlForm.phone;
    const counter = $('#wlCount b');
    const STORE = 'ts_waitlist';
    const read = () => { try { return JSON.parse(localStorage.getItem(STORE) || '[]'); } catch { return []; } };
    input.addEventListener('input', () => input.classList.remove('is-invalid'));
    wlForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const phone = input.value.trim();
      if (!validPhone(phone)) { flagInvalid(input); toast('请输入有效的 WhatsApp / 电话号码'); return; }
      const list = read();
      if (list.includes(phone)) { toast('这个号码已经在 Priority List 里啦 👍'); return; }
      list.push(phone);
      try { localStorage.setItem(STORE, JSON.stringify(list)); } catch {}
      // Demo only: hook a real endpoint here, e.g. fetch('/api/waitlist', { method: 'POST', body: ... })
      wlForm.reset();
      if (counter) counter.textContent = (parseInt(counter.textContent.replace(/,/g, ''), 10) + 1).toLocaleString('en-US');
      toast('🎉 成功加入 Priority List！11.11 开卖前我们会第一时间通知你');
      confetti();
    });
  }

  /* ---------- Package tabs (order) ---------- */
  const tabs = $('.tabs');
  if (tabs) {
    const pill = $('.tabs__pill', tabs);
    const movePill = (btn) => {
      pill.style.width = btn.offsetWidth + 'px';
      pill.style.transform = `translateX(${btn.offsetLeft}px)`;
    };
    const apply = (btn) => {
      $$('.tab', tabs).forEach((t) => t.classList.toggle('is-active', t === btn));
      movePill(btn);
      const f = btn.dataset.filter;
      $$('#cards .card').forEach((c) => {
        const show = f === 'all' || c.dataset.cat.split(' ').includes(f);
        c.classList.toggle('is-hidden', !show);
        if (show) c.animate?.([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 400, easing: 'ease-out' });
      });
    };
    $$('.tab', tabs).forEach((t) => t.addEventListener('click', () => apply(t)));
    const init = () => movePill($('.tab.is-active', tabs));
    addEventListener('resize', init);
    document.fonts?.ready.then(init);
    init();
    // The design shows all four packages under the default tab, so start unfiltered.
  }

  /* ---------- Buy modal (order) ---------- */
  const buyForm = $('#buyForm');
  $$('[data-buy]').forEach((b) => b.addEventListener('click', () => {
    $('#buyName').textContent = b.dataset.buy;
    openModal('buyModal');
  }));
  if (buyForm) {
    buyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const { name, phone, grade } = buyForm;
      $$('.is-invalid', buyForm).forEach((x) => x.classList.remove('is-invalid'));
      if (!name.value.trim()) return flagInvalid(name);
      if (!validPhone(phone.value)) return flagInvalid(phone);
      if (!grade.value) return flagInvalid(grade);
      closeModals();
      buyForm.reset();
      toast(`✅ 已为你保留「${$('#buyName').textContent}」名额，客服将通过 WhatsApp 联系你`);
      confetti();
    });
  }

  /* ---------- Mobile sticky buy bar (order) ---------- */
  const mbar = $('#mbar');
  const salebar = $('#salebar');
  if (mbar && salebar) {
    new IntersectionObserver(([e]) => mbar.classList.toggle('is-show', !e.isIntersecting && e.boundingClientRect.top < 0))
      .observe(salebar);
  }

  /* ---------- Active nav link on scroll (order) ---------- */
  const navLinks = $$('.nav__links--cn a:not(.btn)');
  if (navLinks.length) {
    const sections = navLinks.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    addEventListener('scroll', () => {
      let current = sections[0];
      sections.forEach((s) => { if (s.getBoundingClientRect().top < 120) current = s; });
      navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + current.id));
    }, { passive: true });
  }

  /* ---------- Tiny confetti burst ---------- */
  function confetti() {
    if (reduceMotion) return;
    const c = document.createElement('canvas');
    Object.assign(c.style, { position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 130 });
    document.body.appendChild(c);
    const ctx = c.getContext('2d');
    c.width = innerWidth; c.height = innerHeight;
    const colors = ['#ff6a1a', '#ff8a3d', '#ffd29d', '#ffffff'];
    const bits = Array.from({ length: 140 }, () => ({
      x: innerWidth / 2, y: innerHeight * 0.6,
      vx: (Math.random() - 0.5) * 16, vy: -Math.random() * 16 - 6,
      s: Math.random() * 6 + 3, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3,
      c: colors[(Math.random() * colors.length) | 0],
    }));
    let frame = 0;
    const step = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      bits.forEach((b) => {
        b.vy += 0.45; b.vx *= 0.99; b.x += b.vx; b.y += b.vy; b.r += b.vr;
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.r);
        ctx.fillStyle = b.c; ctx.fillRect(-b.s / 2, -b.s / 4, b.s, b.s / 2);
        ctx.restore();
      });
      if (++frame < 130) requestAnimationFrame(step); else c.remove();
    };
    step();
  }
})();
