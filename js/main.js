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

  /* ---------- CTA: scroll to the form, then focus its input ---------- */
  $$('[data-focus]').forEach((a) => a.addEventListener('click', () => {
    setTimeout(() => $(a.dataset.focus)?.focus({ preventScroll: true }), 700);
  }));

  /* ---------- Count-up numbers ---------- */
  const countUp = (el) => {
    const end = +el.dataset.countup;
    const fmt = (n) => (el.dataset.format === 'comma' ? n.toLocaleString('en-US') : String(n));
    if (reduceMotion) { el.textContent = fmt(end); return; }
    const t0 = performance.now(), dur = 1800;
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

  /* ---------- Hero parallax (mouse + scroll) ---------- */
  const bg = $('[data-parallax]');
  if (bg && !reduceMotion) {
    let mx = 0, my = 0;
    addEventListener('mousemove', (e) => {
      mx = (e.clientX / innerWidth - 0.5) * 2;
      my = (e.clientY / innerHeight - 0.5) * 2;
    }, { passive: true });
    const loop = () => {
      const y = Math.min(scrollY, 900) * 0.25;
      bg.style.translate = `${mx * -12}px ${my * -8 + y}px`;
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
      if (list.includes(phone)) { toast('这个号码已经在 Waiting List 里啦 👍'); return; }
      list.push(phone);
      try { localStorage.setItem(STORE, JSON.stringify(list)); } catch {}
      // Demo only: hook a real endpoint here, e.g. fetch('/api/waitlist', { method: 'POST', body: ... })
      wlForm.reset();
      if (counter) counter.textContent = (parseInt(counter.textContent.replace(/,/g, ''), 10) + 1).toLocaleString('en-US');
      toast('🎉 成功加入 Waiting List！11.11 开卖前我们会第一时间通知你');
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
