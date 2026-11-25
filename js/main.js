(() => {
  document.getElementById('year').textContent = new Date().getFullYear();

  const canvas = document.getElementById('dots');
  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Settings you can tweak ----
  const GAP = 30;        // distance between dots (px)
  const BASE = 1.4;      // normal dot radius
  const GROW = 3.2;      // extra radius near the mouse
  const RADIUS = 150;    // mouse influence radius
  const PUSH = 22;       // how far dots are pushed away
  const EASE = 0.14;     // follow speed (0 to 1)
  let COLOR, ACCENT;     // read from the theme (--dot-rgb and --accent-rgb in css/style.css)
  const readColors = () => {
    const cs = getComputedStyle(document.documentElement);
    COLOR = cs.getPropertyValue('--dot-rgb').trim() || '55,51,46';
    ACCENT = cs.getPropertyValue('--accent-rgb').trim() || '43,75,219';
  };
  readColors();
  // --------------------------------

  let w, h, dpr, dots = [], raf = null;
  const mouse = { x: -9999, y: -9999 };

  function build() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dots = [];
    for (let y = GAP / 2; y < h + GAP; y += GAP)
      for (let x = GAP / 2; x < w + GAP; x += GAP)
        dots.push({ hx: x, hy: y, x, y, r: BASE, t: 0 });
    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    let moving = false;
    for (const d of dots) {
      const dx = d.hx - mouse.x, dy = d.hy - mouse.y;
      const dist = Math.hypot(dx, dy);
      let tx = d.hx, ty = d.hy, tr = BASE, tt = 0;
      if (dist < RADIUS) {
        const f = 1 - dist / RADIUS, e = f * f;
        const nx = dist ? dx / dist : 0, ny = dist ? dy / dist : 0;
        tx += nx * e * PUSH; ty += ny * e * PUSH;
        tr += e * GROW; tt = f;
      }
      d.x += (tx - d.x) * EASE; d.y += (ty - d.y) * EASE;
      d.r += (tr - d.r) * EASE; d.t += (tt - d.t) * EASE;
      if (Math.abs(tx - d.x) > .05 || Math.abs(tr - d.r) > .02) moving = true;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, 6.2832);
      ctx.fillStyle = d.t > .35 ? `rgba(${ACCENT},${.35 + d.t * .65})` : `rgba(${COLOR},${.28 + d.t * .5})`;
      ctx.fill();
    }
    raf = moving ? requestAnimationFrame(draw) : null;
  }
  const wake = () => { if (!raf) raf = requestAnimationFrame(draw); };
  window.addEventListener('themechange', () => { readColors(); wake(); });

  if (!reduce) {
    const leave = () => { mouse.x = mouse.y = -9999; wake(); };
    window.addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; wake(); }, { passive: true });
    document.addEventListener('mouseleave', leave);
    window.addEventListener('blur', leave);
  }
  let timer;
  window.addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(build, 120); });
  build();
})();

// ---- Certificate preview (dialog) ----
(() => {
  const clean2 = s => (s || '').replace(/\s+/g, ' ').trim();
  const dlg = document.getElementById('preview');
  if (!dlg) return;
  const img = document.getElementById('preview-img');
  const title = document.getElementById('preview-title');
  document.querySelectorAll('[data-preview]').forEach(btn => {
    btn.addEventListener('click', () => {
      img.src = btn.dataset.preview;
      img.alt = btn.dataset.title;
      title.textContent = btn.dataset.title;
      dlg.showModal();
    });
  });
  document.querySelectorAll('.project .shot').forEach(s => {
    s.addEventListener('click', () => {
      const im = s.querySelector('img');
      if (!im || im.style.display === 'none' || !im.naturalWidth) return;
      const t = clean2((s.closest('.project').querySelector('h3') || {}).textContent);
      img.src = im.currentSrc || im.src; img.alt = t; title.textContent = t;
      dlg.showModal();
    });
  });
  dlg.querySelector('.close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); }); // click outside to close
})();

// ---- Profile photo gallery ----
document.querySelectorAll('.gallery').forEach(gallery => {
  const wrap = gallery.closest('.gallery-wrap') || document;
  const order = [...gallery.querySelectorAll('.photo')];
  const count = wrap.querySelector('.sr-only');
  const total = order.length;
  const dots = [...wrap.querySelectorAll('.dots i')];
  const photos = [...order];           // original order, used for the "1 / 3" counter
  let busy = false;

  const render = () => {
    order.forEach((el, i) => { el.dataset.pos = Math.min(i, 2); });
    const cur = photos.indexOf(order[0]);
    if (count) count.textContent = 'Photo ' + (cur + 1) + ' of ' + total;
    dots.forEach((d, i) => d.classList.toggle('on', i === cur));
  };

  function next() {                    // front photo flies off to the right, goes to the back
    if (busy || total < 2) return;
    busy = true;
    const f = order.shift(); order.push(f);
    f.classList.add('fly');
    render();
    setTimeout(() => {
      f.classList.add('snap'); f.style.opacity = 0;
      f.classList.remove('fly');
      void f.offsetWidth;
      f.classList.remove('snap'); f.style.opacity = '';
      busy = false;
    }, 450);
  }

  function prev() {                    // last photo flies in from the left to the front
    if (busy || total < 2) return;
    busy = true;
    const b = order.pop(); order.unshift(b);
    b.classList.add('snap', 'enter');
    render();
    void b.offsetWidth;
    b.classList.remove('snap', 'enter');
    setTimeout(() => { busy = false; }, 550);
  }

  gallery.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
  });

  // click = next, swipe left = next, swipe right = previous
  let startX = null;
  gallery.addEventListener('pointerdown', e => { startX = e.clientX; });
  gallery.addEventListener('pointerup', e => {
    if (startX === null) return;
    const dx = e.clientX - startX; startX = null;
    if (dx > 40) prev(); else next();
  });
  gallery.addEventListener('pointercancel', () => { startX = null; });

  // hover = the photos start flipping by themselves; leave = they stop
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let first, loop;
  gallery.addEventListener('pointerenter', e => {
    if (e.pointerType !== 'mouse' || calm || document.documentElement.dataset.motion === 'off') return;
    clearTimeout(first); clearInterval(loop);
    first = setTimeout(() => { next(); loop = setInterval(next, 1900); }, 500);
  });
  gallery.addEventListener('pointerleave', () => { clearTimeout(first); clearInterval(loop); });
  render();
});

// ---- Scroll reveal: cards pop in, then the things inside them rise in one after another ----
(() => {
  const inner = 'h2, .two-col > *, .facts > div, .stack-group h4, .chips li, .timeline > li, .project, .cert, .contact > p, .contact-list li, .plate-sub, .req-bar, .reqs > li';
  document.querySelectorAll('.reveal').forEach(card => card.querySelectorAll(inner).forEach(el => el.classList.add('rv')));
  const items = [...document.querySelectorAll('.reveal, .rv')];
  if (!('IntersectionObserver' in window)) { items.forEach(el => el.classList.add('in')); return; }
  const io = new IntersectionObserver(entries => {
    let n = 0;
    entries
      .filter(e => e.isIntersecting)
      .sort((a, b) => (a.target.compareDocumentPosition(b.target) & 2 ? 1 : -1))
      .forEach(e => {
        e.target.style.setProperty('--d', Math.min(n++, 14) * 70 + 'ms');   // stagger items that appear together
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0 });
  items.forEach(el => io.observe(el));
})();

// ---- Tech icons: if an online icon fails to load, try the backup link, then a generic icon ----
(() => {
  function fail(img) {
    const next = (img.dataset.fb || '').split(' ').filter(Boolean);
    if (next.length) { img.dataset.fb = next.slice(1).join(' '); img.src = next[0]; return; }
    const t = document.createElement('template');
    t.innerHTML = '<svg class="ico" aria-hidden="true"><use href="#' + (img.dataset.g || 'i-code') + '"/></svg>';
    img.replaceWith(t.content.firstChild);
  }
  document.addEventListener('error', e => {
    if (e.target.tagName === 'IMG' && e.target.classList.contains('ico')) fail(e.target);
  }, true);
  document.querySelectorAll('img.ico').forEach(img => { if (img.complete && !img.naturalWidth) fail(img); });
})();

// ---- Progress bar (top of the navbar) ----
(() => {
  const bar = document.querySelector('.progress i');
  if (!bar) return;
  let ticking = false;
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.setProperty('--p', max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)).toFixed(4) : 0);
    ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

// ---- Dark / light mode ----
(() => {
  const root = document.documentElement, btn = document.getElementById('theme');
  if (!btn) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fl = btn.querySelector('.fl');
  const label = () => {
    const dark = root.dataset.theme === 'dark';
    btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    if (fl) fl.textContent = dark ? 'Light mode' : 'Dark mode';
  };
  const apply = t => {
    root.dataset.theme = t;
    try { localStorage.setItem('theme', t); } catch (e) {}
    label();
    window.dispatchEvent(new Event('themechange'));
  };
  label();
  btn.addEventListener('click', e => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    if (!document.startViewTransition || reduce.matches || root.dataset.motion === 'off') {          // fallback: soft color fade
      root.classList.add('theme-anim'); apply(next);
      setTimeout(() => root.classList.remove('theme-anim'), 700);
      return;
    }
    const r = btn.getBoundingClientRect();                // circle grows from the button
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const t = document.startViewTransition(() => apply(next));
    t.ready.then(() => root.animate(
      { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + rad + 'px at ' + x + 'px ' + y + 'px)'] },
      { duration: 700, easing: 'cubic-bezier(.22,1,.36,1)', pseudoElement: '::view-transition-new(root)' }
    )).catch(() => {});
  });
})();

// ---- Chill background music ----
(() => {
  const audio = document.getElementById('bgm'), btn = document.getElementById('music');
  if (!audio || !btn) return;
  const VOL = 0.3;
  let fade, wanted = true;
  try { wanted = localStorage.getItem('music') !== 'off'; } catch (e) {}
  audio.volume = 0;
  const ui = on => {
    btn.classList.toggle('on', on);
    btn.setAttribute('aria-pressed', on);
    btn.setAttribute('aria-label', on ? 'Turn music off' : 'Turn music on');
    const fl = btn.querySelector('.fl'); if (fl) fl.textContent = on ? 'Music: on' : 'Music: off';
  };
  const ramp = (to, done) => {
    clearInterval(fade);
    fade = setInterval(() => {
      const d = to - audio.volume;
      if (Math.abs(d) < 0.02) { audio.volume = to; clearInterval(fade); if (done) done(); }
      else audio.volume = Math.max(0, Math.min(1, audio.volume + Math.sign(d) * 0.02));
    }, 60);
  };
  const play = () => audio.play().then(() => { ui(true); btn.classList.remove('wait'); ramp(VOL); return true; }).catch(() => { ui(false); return false; });
  const stop = () => ramp(0, () => audio.pause());
  btn.addEventListener('click', () => {
    if (!btn.classList.contains('on')) { try { localStorage.setItem('music', 'on'); } catch (e) {} wanted = true; play(); }
    else { try { localStorage.setItem('music', 'off'); } catch (e) {} wanted = false; ui(false); stop(); }
  });
  ui(false);
  if (wanted) {
    play().then(ok => {
      if (ok) return;
      // browsers block sound until the visitor interacts: start on the first click, tap or key press
      btn.classList.add('wait');
      const go = e => {
        if (e.target.closest && e.target.closest('#music')) return;
        ['pointerdown', 'keydown', 'touchend'].forEach(t => window.removeEventListener(t, go, true));
        if (wanted && audio.paused) play();
      };
      ['pointerdown', 'keydown', 'touchend'].forEach(t => window.addEventListener(t, go, true));
    });
  }
})();

// ---- Scroll buttons: back to top + auto scroll down ----
(() => {
  const up = document.getElementById('to-top'), down = document.getElementById('auto-scroll');
  if (!up || !down) return;
  const SPEED = 130;                               // pixels per second
  let auto = false, raf = 0, last = 0, pos = 0;
  const maxY = () => document.documentElement.scrollHeight - window.innerHeight;
  const stop = () => {
    auto = false; cancelAnimationFrame(raf);
    down.classList.remove('active'); down.setAttribute('aria-pressed', 'false'); down.setAttribute('aria-label', 'Auto scroll down');
  };
  const step = t => {
    if (!auto) return;
    if (Math.abs(window.scrollY - pos) > 6) return stop();      // the visitor scrolled by hand
    pos = Math.min(maxY(), pos + SPEED * (t - last) / 1000); last = t;
    window.scrollTo({ top: pos, behavior: 'instant' });
    if (pos >= maxY()) return stop();
    raf = requestAnimationFrame(step);
  };
  down.addEventListener('click', () => {
    if (auto) return stop();
    auto = true; pos = window.scrollY; last = performance.now();
    down.classList.add('active'); down.setAttribute('aria-pressed', 'true'); down.setAttribute('aria-label', 'Stop auto scroll');
    raf = requestAnimationFrame(step);
  });
  up.addEventListener('click', () => { stop(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  ['wheel', 'touchstart', 'keydown'].forEach(ev => window.addEventListener(ev, () => { if (auto) stop(); }, { passive: true }));
  const toggle = () => {
    up.classList.toggle('show', window.scrollY > 500);
    down.classList.toggle('hide', window.scrollY >= maxY() - 24);
  };
  window.addEventListener('scroll', toggle, { passive: true });
  window.addEventListener('resize', toggle);
  toggle();
})();

// ---- Joshyyy: the portfolio chatbot ----
// Joshyyy has no outside AI. Every answer is built from the text that is on this page,
// so if you edit index.html (experience, stack, contact...) Joshyyy knows the new details automatically.
(() => {
  const chat = document.getElementById('chat');
  if (!chat) return;
  const fab = document.getElementById('chat-fab'), panel = document.getElementById('chat-panel');
  const body = document.getElementById('chat-body'), sugg = document.getElementById('chat-suggest');
  const form = document.getElementById('chat-form'), input = document.getElementById('chat-input');
  const tip = document.getElementById('chat-tip');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clean = s => (s || '').replace(/\s+/g, ' ').trim();
  const text = (s, r) => clean(($(s, r) || {}).textContent);

  // placeholder text from the template is never repeated by the bot
  const PLACEHOLDER = /^(describe\b|one or two sentences|write one or two|introduce yourself|add a second paragraph|honors, thesis)|your-profile|your-username|example\.com|^project (one|two|three)$/i;
  const real = s => !!s && !PLACEHOLDER.test(s);

  // ---------- 1. read the portfolio ----------
  function knowledge() {
    const k = {};
    k.name = text('.brand') || 'Joshua';
    k.first = k.name.split(' ')[0];
    k.roles = $$('.role span').map(e => clean(e.textContent));
    k.open = text('.kicker');
    k.intro = $$('#about .two-col > div p').map(e => clean(e.textContent)).filter(real);
    k.facts = $$('#about .facts > div').map(d => ({ label: text('dt', d), value: text('dd', d) }));
    k.stack = $$('#stack .stack-group').map(g => ({ group: text('h4', g), items: $$('.chips li', g).map(l => clean(l.textContent)) }));
    const timeline = id => $$('#' + id + ' .timeline > li').map(li => ({
      when: text('.when', li), title: text('h3', li), org: text('.org', li),
      points: [...$$('ul li', li).map(x => clean(x.textContent)), ...$$('div > p:not(.org)', li).map(x => clean(x.textContent))].filter(real)
    }));
    k.exp = timeline('experience');
    k.edu = timeline('education');
    k.projects = $$('.project').map(p => ({
      title: text('h3', p), desc: text('p:not(.tags):not(.links)', p), tags: text('.tags', p),
      links: $$('.links a', p).map(a => ({ text: clean(a.textContent), href: a.getAttribute('href') })).filter(l => l.href && l.href !== '#')
    }));
    k.reqs = $$('.req').map(li => ({ name: text('.req-name', li), alias: (li.dataset.alias || '').split(',').filter(Boolean), href: ($('.req-main', li) || {}).getAttribute ? $('.req-main', li).getAttribute('href') : '' }));
    k.certs = $$('.cert').map(c => ({ title: text('strong', c), issuer: text('.issuer', c) }));
    k.contact = $$('.contact-list li').map(li => ({ label: text('.lbl', li), value: text('a, .val', li), href: ($('a', li) || {}).getAttribute ? $('a', li).getAttribute('href') : '' }));
    const r = $('a[href*="resume"]'); k.resume = r ? r.getAttribute('href') : '';
    return k;
  }

  // ---------- 2. answer helpers ----------
  const P = t => ({ t: 'p', text: t });
  const L = items => ({ t: 'ul', items });
  const A = items => ({ t: 'links', items });
  const norm = s => ' ' + s.toLowerCase().replace(/[^a-z0-9+#]+/g, ' ').trim() + ' ';
  const word = (n, w) => n.includes(' ' + norm(w).trim() + ' ');
  const list = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
  const STOP = new Set('the and for with from that this what which does have has his her him your you are was were about tell can could would should how who why when where did any some more much many very also into out onto than then them they their there here know let get got just like please want need make made'.split(' '));
  const contactOf = (k, re) => k.contact.find(c => re.test(c.label.toLowerCase()));
  const goodContact = c => c && real(c.value) && real(c.href || c.value);
  const linkFor = c => ({ text: c.label, href: c.href });

  const ALIAS = { game: 'e-sports games', gamer: 'e-sports games', gaming: 'e-sports games', esports: 'e-sports games', 'e sports': 'e-sports games', games: 'e-sports games', drawing: 'digital drawing', 'graphic design': 'graphic designing', js: 'javascript', ts: 'typescript', vscode: 'visual studio code', 'vs code': 'visual studio code', tailwind: 'tailwind css', vuejs: 'vue', 'vue js': 'vue', node: 'node.js', nodejs: 'node.js', cpp: 'c++', gpt: 'chatgpt', 'chat gpt': 'chatgpt', claude: 'claude code', netbeans: 'apache netbeans', office: 'microsoft office', 'ms office': 'microsoft office', word: 'microsoft office', excel: 'microsoft office', powerbi: 'power bi', spring: 'spring boot', springboot: 'spring boot', google: 'google workspace', gsuite: 'google workspace', 'g suite': 'google workspace', ai: 'generative ai', 'gen ai': 'generative ai', copilot: 'copilot' };
  const SKILL_SKIP = new Set(['system', 'project', 'asset', 'application', 'support', 'manual', 'automated', 'data', 'generative', 'management', 'software']);

  function findTech(k, n) {
    const hits = [];
    const add = (g, item) => { if (!hits.some(h => h.item === item)) hits.push({ group: g.group, item }); };
    k.stack.forEach(g => g.items.forEach(item => {
      const it = item.toLowerCase();
      let ok = word(n, item);
      Object.keys(ALIAS).forEach(a => { if (ALIAS[a] === it && word(n, a)) ok = true; });
      const parts = it.split(/\s+/);
      if (!ok && parts.length > 1) {
        if (/skill/i.test(g.group)) ok = parts.some(p => p.length >= 5 && !SKILL_SKIP.has(p) && word(n, p));
        else ok = parts[0].length >= 5 && word(n, parts[0]);
      }
      if (ok) add(g, item);
    }));
    return hits;
  }

  const acronym = s => {
    const w = s.split(',')[0].split(' - ')[0].split(/\s+/).filter(x => x && !['of', 'and', 'the', 'for', 'in', 'at'].includes(x.toLowerCase()));
    return w.length >= 3 ? w.map(x => x[0]).join('').toLowerCase() : '';
  };
  function matchEntry(list, n, fields) {
    let best = null, score = 0;
    list.forEach(e => {
      let s = 0;
      fields(e).forEach(f => f.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).forEach(w => { if (w.length >= 4 && !STOP.has(w) && !['inc', 'city', 'campus', 'department'].includes(w) && word(n, w)) s++; }));
      const ac = acronym(fields(e)[1] || '');
      if (ac && word(n, ac)) s += 2;
      if (s > score) { score = s; best = e; }
    });
    return { e: best, s: score };
  }
  const pickEntry = (list, n, fields) => { const r = matchEntry(list, n, fields); return r.s >= 1 ? r.e : null; };

  // ---------- 3. the answers ----------
  const A_ = {};
  A_.about = k => {
    const loc = (k.facts.find(f => /location/i.test(f.label)) || {}).value;
    const lang = (k.facts.find(f => /language/i.test(f.label)) || {}).value;
    const out = [];
    out.push(P(k.name + (k.roles.length ? ' is a ' + list(k.roles) + ' professional' : ' is the person behind this portfolio') + (loc ? ', based in ' + loc + '.' : '.')));
    if (k.edu[0]) out.push(P('Education: ' + k.edu[0].title + ' at ' + k.edu[0].org + (k.edu[0].points[0] ? ' (' + k.edu[0].points[0] + ')' : '') + '.'));
    if (k.exp[0]) out.push(P('Most recently he worked as ' + k.exp[0].title + ' at ' + k.exp[0].org + '.'));
    if (lang) out.push(P('Languages: ' + lang + '.'));
    k.intro.forEach(t => out.push(P(t)));
    if (/available|open/i.test(k.open)) out.push(P('He is currently open to new opportunities.'));
    return out;
  };
  A_.role = k => [P(k.roles.length ? k.first + ' is a ' + list(k.roles) + ' professional.' : 'His role is not listed in the portfolio.'), ...(k.exp[0] ? [P('His latest position: ' + k.exp[0].title + ' at ' + k.exp[0].org + ' (' + k.exp[0].when + ').')] : [])];
  const entryLine = e => '<b>' + e.title + '</b>' + (e.org ? ' at ' + e.org : '') + (e.when ? ' (' + e.when + ')' : '');
  A_.exp = (k, n) => {
    if (!k.exp.length) return [P('No work experience is listed in the portfolio yet.')];
    const e = pickEntry(k.exp, n, x => [x.title, x.org]);
    if (e) return [P(e.title + ' at ' + e.org + ' (' + e.when + ').'), ...(e.points.length ? [L(e.points)] : [P('No further details are listed for this role yet. You can ask ' + k.first + ' directly.')])];
    return [P(k.first + "'s work experience, most recent first:"), L(k.exp.map(entryLine))];
  };
  A_.edu = (k, n) => {
    if (!k.edu.length) return [P('No education is listed in the portfolio yet.')];
    const e = pickEntry(k.edu, n, x => [x.title, x.org]);
    const one = x => x.title + ' at ' + x.org + ' (' + x.when + ')' + (x.points.length ? ', ' + x.points.join(', ') : '');
    if (e) return [P(one(e) + '.')];
    return [P(k.first + "'s education:"), L(k.edu.map(x => '<b>' + x.title + '</b>, ' + x.org + ' (' + x.when + ')' + (x.points.length ? ' - ' + x.points.join(', ') : '')))];
  };
  A_.certs = (k, n) => {
    if (!k.certs.length) return [P('No certifications are listed in the portfolio yet.')];
    const c = pickEntry(k.certs, n, x => [x.title, x.issuer]);
    if (c && !/\b(all|list|every|certifications|certificates)\b/.test(n)) return [P(c.title + ' from ' + c.issuer + '.'), P('You can preview or download the certificate from the Certifications section.')];
    const seen = new Set(), items = [];
    k.certs.forEach(x => { const s = x.title + ' - ' + x.issuer; if (!seen.has(s)) { seen.add(s); items.push('<b>' + x.title + '</b> - ' + x.issuer); } });
    return [P(k.first + ' holds ' + items.length + ' certification' + (items.length > 1 ? 's' : '') + ':'), L(items), P('Each one can be previewed or downloaded in the Certifications section.')];
  };
  A_.projects = k => {
    const done = k.projects.filter(p => real(p.title) && real(p.desc));
    if (!done.length) return [P('The project showcase is still being filled in, so there are no project details to share yet.'), P('You can ask ' + k.first + ' about his work directly.')];
    return [P(k.first + "'s projects:"), L(done.map(p => '<b>' + p.title + '</b> - ' + p.desc + (real(p.tags) ? ' (' + p.tags + ')' : '')))];
  };
  A_.stack = (k, n) => {
    const pick = [];
    if (/front ?end|frontend|\bui\b|client side/.test(n)) pick.push(/front/i);
    if (/back ?end|backend|server/.test(n)) pick.push(/back/i);
    if (/language|programming|\bcode\b|coding/.test(n)) pick.push(/language/i);
    if (/\btools?\b|software|\bide\b|editor/.test(n)) pick.push(/tool/i);
    if (/skill|strength|good at|abilit|specializ|expert/.test(n)) pick.push(/skill/i);
    const groups = pick.length ? k.stack.filter(g => pick.some(r => r.test(g.group))) : k.stack.filter(g => !/hobb/i.test(g.group));
    if (!groups.length) return [P('That part of the tech stack is not listed in the portfolio.')];
    if (groups.length === 1) return [P(k.first + "'s " + groups[0].group.toLowerCase() + ':'), P(groups[0].items.join(', ') + '.')];
    return [P(k.first + "'s tech stack:"), L(groups.map(g => '<b>' + g.group + ':</b> ' + g.items.join(', ')))];
  };
  A_.hobbies = k => {
    const g = k.stack.find(x => /hobb/i.test(x.group));
    return g ? [P('Outside of work, ' + k.first + ' enjoys ' + list(g.items.map(x => x.toLowerCase())) + '.')] : [P("Hobbies aren't listed in the portfolio.")];
  };
  const realHref = h => !!h && h !== '#' && !/your-|example\./i.test(h);
  A_.reqs = k => {
    if (!k.reqs.length) return [P('No employment requirements are listed in the portfolio.')];
    return [P(k.first + ' has all ' + k.reqs.length + ' employment requirements ready: ' + list(k.reqs.map(r => r.name)) + '. Copies can be sent upon request.'), ...A_.contactAll(k).slice(1)];
  };
  A_.req = (k, r) => [P('Yes, ' + k.first + ' has ' + r.name + ' ready, and a copy can be sent upon request.'), ...A_.contactAll(k).slice(1)];
  A_.tech = (k, hits) => {
    if (hits.length === 1 && /hobb/i.test(hits[0].group)) return [P('Yes. ' + hits[0].item + ' is one of ' + k.first + "'s hobbies.")];
    if (hits.length === 1) {
      const h = hits[0], g = k.stack.find(x => x.group === h.group);
      const sk = /skill/i.test(h.group);
      const others = g.items.filter(i => i !== h.item).slice(0, 4);
      return [P('Yes. ' + h.item + (sk ? ' is one of ' + k.first + "'s skills." : ' is part of ' + k.first + "'s " + h.group.toLowerCase() + ' stack.')), ...(others.length ? [P('Also in ' + h.group.toLowerCase() + ': ' + others.join(', ') + '.')] : [])];
    }
    const by = {};
    hits.forEach(h => (by[h.group] = by[h.group] || []).push(h.item));
    return [P('Yes. Here is what ' + k.first + ' has listed:'), L(Object.keys(by).map(g => '<b>' + g + ':</b> ' + by[g].join(', ')))];
  };
  A_.contactAll = k => {
    const links = [];
    k.contact.forEach(c => { if (goodContact(c) && !/location/i.test(c.label) && c.href) links.push({ text: c.label, href: c.href }); });
    const out = [P('You can reach ' + k.first + ' here. Email is the fastest way:')];
    out.push(links.length ? A(links) : P('Contact details are not available yet.'));
    return out;
  };
  A_.contactOne = (k, re, name) => {
    const c = contactOf(k, re);
    if (goodContact(c)) return [P(k.first + "'s " + name + ': ' + c.value), ...(c.href ? [A([linkFor(c)])] : [])];
    const mail = contactOf(k, /email/);
    return [P(k.first + " hasn't added his " + name + ' to the portfolio yet.'), ...(goodContact(mail) ? [P('The best way to reach him is email:'), A([linkFor(mail)])] : [])];
  };
  A_.location = k => {
    const c = contactOf(k, /location/);
    return [P(c ? k.first + ' is based in ' + c.value + '.' : "His location isn't listed in the portfolio.")];
  };
  A_.resume = k => k.resume ? [P("Here is " + k.first + "'s resume:"), A([{ text: 'Download resume', href: k.resume }]), P("If it doesn't open, please contact him directly and he will send it over.")] : [P('You can ask ' + k.first + ' for his resume by email.')];
  A_.hire = k => [P('Yes. ' + k.first + ' is open to new opportunities and interviews.'), ...A_.contactAll(k)];
  A_.identity = () => [P("I'm Joshyyy, the chatbot built into this portfolio. I'm not a live AI model: my answers come straight from the information on this page, so I can only talk about Joshua."), P('Try asking about his experience, tech stack, education, certifications or contact details.')];
  A_.fallback = k => [P("I can only answer questions from the information in this portfolio, and I couldn't find that here."), P('Try asking about ' + k.first + "'s experience, tech stack, education, certifications, or how to contact him.")];

  const NEXT = {
    about: ['What is his work experience?', 'What is his tech stack?', 'How can I contact him?'],
    exp: ['What is his tech stack?', 'Where did he study?', 'How can I contact him?'],
    edu: ['What certifications does he have?', 'What is his work experience?', 'How can I contact him?'],
    certs: ['What is his tech stack?', 'Where did he study?', 'Is he available for hire?'],
    stack: ['What is his work experience?', 'What are his skills?', 'How can I contact him?'],
    projects: ['What is his tech stack?', 'What is his work experience?', 'How can I contact him?'],
    reqs: ['What certifications does he have?', 'Is he available for hire?', 'How can I contact him?'],
    contact: ['Download resume', 'Is he available for hire?', 'Tell me about Joshua'],
    default: ['Tell me about Joshua', 'What is his work experience?', 'What is his tech stack?', 'Where did he study?', 'What certifications does he have?', 'How can I contact him?']
  };

  // ---------- 4. figure out what was asked ----------
  function answer(raw) {
    const k = knowledge(), t = raw.toLowerCase(), n = norm(raw);
    const done = (blocks, next) => ({ blocks, next: NEXT[next] || NEXT.default });

    if (/^\s*(hi|hello|hey|yo|hola|kumusta|musta|good (morning|afternoon|evening))\b/.test(t)) return done([P('Hi! I\'m Joshyyy. I can tell you about ' + k.first + "'s experience, tech stack, education, certifications and how to contact him. What would you like to know?")], 'default');
    if (/\b(thanks|thank you|salamat|ty)\b/.test(t)) return done([P("You're welcome! Anything else you'd like to know about " + k.first + '?')], 'default');
    if (/\b(bye|goodbye|see you|see ya)\b/.test(t)) return done([P('Thanks for stopping by! Feel free to reach out to ' + k.first + ' anytime.')], 'contact');
    if (/(who|what) are you|your name|are you (a |an )?(bot|ai|robot|human|real|chatgpt|gpt)|\bjoshyyy\b|how do you work/.test(t)) return done(A_.identity(k), 'default');

    if (/\b(hobb(y|ies)|interests?|free time|for fun|leisure|pastime|outside (of )?work)\b/.test(t)) return done(A_.hobbies(k), 'about');
    const rq = k.reqs.find(r => r.name !== 'Resume' && r.alias.some(a => word(n, a)));
    if (rq) return done(A_.req(k, rq), 'reqs');
    if (/\b(requirements?|documents?|papers|clearance|credentials?|docs|government ids?)\b/.test(t)) return done(A_.reqs(k), 'reqs');
    const wantsContact = /\b(link|profile|account|username|url|page|contact|reach|what'?s|whats|what is|what are|find|send|call|text|message|dm|handle)\b/.test(t);
    const kinds = [[/e-?mail|gmail/, /email/, 'email address'], [/\bviber\b/, /viber/, 'Viber number'], [/facebook|\bfb\b|messenger/, /facebook/, 'Facebook'], [/linkedin/, /linkedin/, 'LinkedIn'], [/\bgit ?hub\b/, /github/, 'GitHub profile'], [/phone|mobile|cell|number/, /phone/, 'phone number']];
    for (const [q, label, name] of kinds) if (q.test(t) && (wantsContact || !/github/.test(t))) return done(A_.contactOne(k, label, name), 'contact');

    if (/\b(resume|cv|curriculum)\b/.test(t)) return done(A_.resume(k), 'contact');
    if (/\b(salary|rate|pay|compensation|expected)\b/.test(t)) return done([P("Salary expectations aren't listed in the portfolio. Please contact " + k.first + ' directly to discuss.'), ...A_.contactAll(k).slice(1)], 'contact');
    if (/\b(hire|hiring|available|availability|opportunit|open to|looking for (a )?(job|work)|apply|interview)\b/.test(t)) return done(A_.hire(k), 'contact');
    if (/\b(where|location|address|based|live|lives|city|country|taguig|manila|philippines)\b/.test(t) && !/\b(study|studied|school|work|worked)\b/.test(t)) return done(A_.location(k), 'contact');
    if (/\b(contact|reach|email|e-mail|phone|call|message|get in touch|talk to)\b/.test(t)) return done(A_.contactAll(k), 'contact');

    const hits = findTech(k, n);
    const generic = /\b(tech stack|stacks?|technolog\w*|skills?|tools?|languages?|frameworks?|programming|front ?end|back ?end)\b/.test(t) && !hits.length;
    if (hits.length && !/\b(experience|worked|work history|education|school|cert)/.test(t.replace(/experience (with|in)/g, ''))) return done(A_.tech(k, hits), 'stack');
    if (hits.length && /experience (with|in)|do you|does he|can he|know|use/.test(t)) return done(A_.tech(k, hits), 'stack');

    const cand = [['exp', matchEntry(k.exp, n, x => [x.title, x.org]).s], ['edu', matchEntry(k.edu, n, x => [x.title, x.org]).s], ['certs', matchEntry(k.certs, n, x => [x.title, x.issuer]).s]].sort((x, y) => y[1] - x[1])[0];
    const listAsk = /\b(all|list|every|certifications|certificates|experience|education)\b/.test(t);
    if (cand[1] >= 1 && !generic && (!listAsk || cand[1] >= 2)) return done(A_[cand[0]](k, n), cand[0]);

    if (/\b(certif|credential|coursera|diploma|licen[cs]e)/.test(t)) return done(A_.certs(k, n), 'certs');
    if (/\b(educat|school|universit|college|degree|graduat|studied|study|course|bachelor|techvoc|honors?|cum laude|academic|alma mater)/.test(t)) return done(A_.edu(k, n), 'edu');
    if (/\b(projects?|built|build|portfolio work|case stud|repo|repositories|apps?)\b/.test(t) && !/\b(project management)\b/.test(t)) return done(A_.projects(k), 'projects');
    if (/\b(experience|work history|worked|working|career|employment|intern|company|companies|jobs?|previous|past|background)\b/.test(t) && !/\b(about)\b/.test(t)) return done(A_.exp(k, n), 'exp');
    if (generic || /\b(know|good at|proficient|familiar)\b/.test(t)) {
      const m = t.match(/(?:know|use|using|familiar with|experience (?:with|in)|worked with|work with|skilled in|proficient in)\s+([a-z0-9+#. -]{2,30})/);
      if (m && !hits.length && !generic) {
        const x = m[1].trim().split(/\s+/).slice(0, 3).join(' ');
        if (!STOP.has(x.split(' ')[0]) && !/^(a|an|any|some|it|him|you|them)\b/.test(x)) return done([P("I couldn't find " + x + " in " + k.first + "'s tech stack."), ...A_.stack(k, '')], 'stack');
      }
      return done(A_.stack(k, n), 'stack');
    }
    if (/\b(role|position|title|profession|current job|what does he do|do for a living|occupation)\b/.test(t)) return done(A_.role(k), 'exp');
    if (/\b(about|introduce|introduction|yourself|himself|summary|tell me|joshua|vidal|who is|bio|profile)\b/.test(t)) return done(A_.about(k), 'about');

    // last try: look for the best matching words anywhere in the portfolio
    const toks = n.trim().split(' ').filter(w => w.length >= 4 && !STOP.has(w));
    const hay = [['exp', k.exp.map(e => e.title + ' ' + e.org + ' ' + e.points.join(' '))], ['edu', k.edu.map(e => e.title + ' ' + e.org + ' ' + e.points.join(' '))], ['certs', k.certs.map(e => e.title + ' ' + e.issuer)], ['stack', k.stack.map(g => g.group + ' ' + g.items.join(' '))]];
    let top = null, sc = 0;
    hay.forEach(([key, arr]) => arr.forEach(s => { const x = toks.filter(w => word(norm(s), w)).length; if (x > sc) { sc = x; top = key; } }));
    if (top) return done(A_[top](k, n), top);
    return done(A_.fallback(k), 'default');
  }

  // ---------- 5. the chat window ----------
  let busy = false, greeted = false;
  const scrollDown = () => { body.scrollTop = body.scrollHeight; };
  const html = (el, s) => { // allow only <b> in the strings above; everything else stays plain text
    s.split(/(<b>.*?<\/b>)/).forEach(part => {
      const m = part.match(/^<b>(.*)<\/b>$/);
      if (m) { const b = document.createElement('strong'); b.textContent = m[1]; el.appendChild(b); }
      else if (part) el.appendChild(document.createTextNode(part));
    });
  };
  function addUser(s) {
    const m = document.createElement('div'); m.className = 'msg user'; m.textContent = s;
    body.appendChild(m); scrollDown();
  }
  function addBot(blocks) {
    const m = document.createElement('div'); m.className = 'msg bot';
    blocks.forEach((b, i) => {
      let el;
      if (b.t === 'p') { el = document.createElement('p'); html(el, b.text); }
      else if (b.t === 'ul') { el = document.createElement('ul'); b.items.forEach(x => { const li = document.createElement('li'); html(li, x); el.appendChild(li); }); }
      else { el = document.createElement('div'); b.items.forEach(x => { const a = document.createElement('a'); a.href = x.href; a.textContent = x.text; if (/^https?:/.test(x.href)) { a.target = '_blank'; a.rel = 'noopener'; } el.appendChild(a); }); }
      el.classList.add('blk'); if (b.t === 'links') el.classList.add('links');
      el.style.setProperty('--i', i); m.appendChild(el);
    });
    body.appendChild(m); scrollDown();
    [150, 350, 650].forEach(d => setTimeout(scrollDown, d));
  }
  function suggest(list) {
    sugg.innerHTML = '';
    list.forEach((q, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = q.replace(/^What is his /, '').replace(/\?$/, '');
      b.textContent = ({ 'Tell me about Joshua': 'About Joshua', 'What is his work experience?': 'Experience', 'What is his tech stack?': 'Tech stack', 'Where did he study?': 'Education', 'What certifications does he have?': 'Certifications', 'How can I contact him?': 'Contact him', 'Is he available for hire?': 'Available for hire?', 'What are his skills?': 'Skills', 'Download resume': 'Resume' })[q] || q;
      b.style.setProperty('--i', i); b.addEventListener('click', () => ask(q)); sugg.appendChild(b);
    });
  }
  function typing() {
    const t = document.createElement('div'); t.className = 'typing'; t.innerHTML = '<i></i><i></i><i></i>'; body.appendChild(t); scrollDown(); return t;
  }
  function reply(res, wait) {
    busy = true; form.classList.add('busy');
    const t = typing();
    const size = res.blocks.reduce((s, b) => s + (b.text ? b.text.length : (b.items || []).join('').length), 0);
    setTimeout(() => { t.remove(); addBot(res.blocks); suggest(res.next); busy = false; form.classList.remove('busy'); }, wait || 550 + Math.min(size * 5, 900));
  }
  function ask(s) {
    s = clean(s).slice(0, 200);
    if (!s || busy) return;
    addUser(s); input.value = '';
    reply(/^download resume$/i.test(s) ? { blocks: A_.resume(knowledge()), next: NEXT.contact } : answer(s));
  }
  form.addEventListener('submit', e => { e.preventDefault(); ask(input.value); });

  function open(state) {
    chat.classList.toggle('open', state);
    fab.setAttribute('aria-expanded', state); panel.setAttribute('aria-hidden', !state);
    fab.setAttribute('aria-label', state ? 'Close chat' : 'Chat with Joshyyy');
    tip.classList.remove('show');
    if (state) {
      document.dispatchEvent(new CustomEvent('panel:open', { detail: 'chat' }));
      if (!greeted) {
        greeted = true;
        const k = knowledge();
        setTimeout(() => reply({ blocks: [P("Hi! I'm Joshyyy, " + k.first + "'s portfolio assistant."), P('Ask me about his experience, tech stack, education, certifications or how to contact him.')], next: NEXT.default }, 900), 350);
      }
      setTimeout(() => input.focus({ preventScroll: true }), 450);
    }
  }
  fab.addEventListener('click', () => open(!chat.classList.contains('open')));
  document.addEventListener('panel:open', e => { tip.classList.remove('show'); if (e.detail !== 'chat' && chat.classList.contains('open')) open(false); });
  document.getElementById('chat-close').addEventListener('click', () => { open(false); fab.focus(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && chat.classList.contains('open')) { open(false); fab.focus(); } });

  // greeting bubble next to the button
  setTimeout(() => { if (!chat.classList.contains('open') && !chat.classList.contains('aopen')) { tip.classList.add('show'); setTimeout(() => tip.classList.remove('show'), 9000); } }, 3500);

  window.__joshyyy = { answer, knowledge };   // handy for testing in the browser console
})();

// ---- Accessibility window ----
(() => {
  const wrap = document.getElementById('chat'), btn = document.getElementById('access-btn'), panel = document.getElementById('a11y-panel');
  if (!wrap || !btn || !panel) return;
  const root = document.documentElement;
  const SIZES = [100, 112, 125, 140];
  const ON = { font: 'readable', spacing: 'wide', contrast: 'high', links: 'on', motion: 'off' };
  let s = { fs: 0 };
  try { s = Object.assign({ fs: 0 }, JSON.parse(localStorage.getItem('a11y') || '{}')); } catch (e) {}
  let fontLoaded = false;
  const loadFont = () => {
    if (fontLoaded) return; fontLoaded = true;
    const l = document.createElement('link'); l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap';
    document.head.appendChild(l);
  };
  const apply = () => {
    root.style.fontSize = s.fs ? SIZES[s.fs] + '%' : '';
    Object.keys(ON).forEach(k => { if (s[k]) root.dataset[k] = ON[k]; else delete root.dataset[k]; });
    if (s.font) loadFont();
    panel.querySelectorAll('.sw').forEach(b => b.setAttribute('aria-checked', !!s[b.dataset.key]));
    document.getElementById('size-val').textContent = SIZES[s.fs] + '%';
    document.getElementById('size-down').disabled = s.fs <= 0;
    document.getElementById('size-up').disabled = s.fs >= SIZES.length - 1;
    try { localStorage.setItem('a11y', JSON.stringify(s)); } catch (e) {}
  };
  panel.querySelectorAll('.sw').forEach(b => b.addEventListener('click', () => { s[b.dataset.key] = s[b.dataset.key] ? '' : 1; apply(); }));
  document.getElementById('size-up').addEventListener('click', () => { s.fs = Math.min(SIZES.length - 1, s.fs + 1); apply(); });
  document.getElementById('size-down').addEventListener('click', () => { s.fs = Math.max(0, s.fs - 1); apply(); });
  document.getElementById('a11y-reset').addEventListener('click', () => { s = { fs: 0 }; apply(); });
  apply();

  const open = state => {
    wrap.classList.toggle('aopen', state);
    btn.setAttribute('aria-expanded', state); panel.setAttribute('aria-hidden', !state);
    if (state) {
      document.dispatchEvent(new CustomEvent('panel:open', { detail: 'access' }));
      panel.querySelectorAll('.a11y-body > *').forEach((el, i) => el.style.setProperty('--i', i));
      setTimeout(() => { const f = panel.querySelector('.sw'); if (f) f.focus({ preventScroll: true }); }, 450);
    }
  };
  btn.addEventListener('click', () => open(!wrap.classList.contains('aopen')));
  document.getElementById('a11y-close').addEventListener('click', () => { open(false); btn.focus(); });
  document.addEventListener('panel:open', e => { if (e.detail !== 'access' && wrap.classList.contains('aopen')) open(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && wrap.classList.contains('aopen')) { open(false); btn.focus(); } });
})();

// ---- Read aloud ----
(() => {
  const btn = document.getElementById('voice-btn');
  if (!btn) return;
  if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') { btn.hidden = true; return; }
  const ids = ['#home', '#about', '#stack', '#experience', '#projects', '#education', '#certifications', '#requirements', '#contact'];
  let active = false, current = null, run = 0;

  const textOf = el => {
    const c = el.cloneNode(true);
    c.querySelectorAll('.shot, .gallery-wrap, .req-sub, .req-dl, .cert-actions, .links, .dots, svg, script, button, .sr-only, .actions').forEach(n => n.remove());
    c.querySelectorAll('*').forEach(n => n.append(' '));
    c.querySelectorAll('h1,h2,h3,h4,p,li,dt,dd,.role,.kicker').forEach(n => n.append('. '));
    return c.textContent.replace(/\s+/g, ' ').replace(/(\s*\.){2,}/g, '.').replace(/\s+\./g, '.').trim();
  };
  const chunks = text => {
    const out = []; let cur = '';
    text.split(/(?<=[.!?])\s+/).forEach(sn => {
      if ((cur + ' ' + sn).length > 200 && cur) { out.push(cur); cur = sn; } else cur = cur ? cur + ' ' + sn : sn;
    });
    if (cur) out.push(cur);
    return out;
  };
  const ui = on => {
    btn.classList.toggle('speaking', on);
    btn.setAttribute('aria-pressed', on);
    btn.setAttribute('aria-label', on ? 'Stop reading aloud' : 'Read the page aloud');
    btn.title = on ? 'Stop reading' : 'Read aloud';
  };
  const mark = el => {
    if (current) current.classList.remove('reading');
    current = el; if (el) el.classList.add('reading');
  };
  const stop = () => {
    active = false; run++;
    window.speechSynthesis.cancel(); mark(null); ui(false);
  };
  function section(list, i, id) {
    if (!active || id !== run) return;
    if (i >= list.length) return stop();
    const el = list[i];
    mark(el);
    el.scrollIntoView({ behavior: document.documentElement.dataset.motion === 'off' ? 'auto' : 'smooth', block: 'start' });
    const parts = chunks(textOf(el.id === 'home' ? (el.querySelector('.hero-text') || el) : el));
    let n = 0, started = false;
    const next = () => {
      if (!active || id !== run) return;
      if (n >= parts.length) return section(list, i + 1, id);
      const u = new SpeechSynthesisUtterance(parts[n++]);
      u.lang = 'en-US'; u.rate = 0.97;
      u.onstart = () => { started = true; };
      u.onend = next;
      u.onerror = e => { if (e.error !== 'interrupted' && e.error !== 'canceled') stop(); };
      window.speechSynthesis.speak(u);
      if (n === 1 && i === 0 || !started && n === 1) setTimeout(() => { if (active && id === run && !started && n === 1) stop(); }, 5000);  // no voice available
    };
    next();
  }
  btn.addEventListener('click', () => {
    if (active) return stop();
    document.dispatchEvent(new CustomEvent('panel:open', { detail: 'voice' }));   // closes the chat / accessibility windows
    const list = ids.map(s => document.querySelector(s)).filter(Boolean);
    let first = list.findIndex(el => el.getBoundingClientRect().bottom > 140);
    if (first < 0) first = 0;
    window.speechSynthesis.cancel();
    active = true; run++; ui(true);
    section(list, first, run);
  });
  window.addEventListener('pagehide', () => window.speechSynthesis.cancel());
})();

// ---- Links that are not filled in yet: shake instead of jumping to the top ----
(() => {
  const sel = '.cert-actions a, .links a, .req-main, .req-dl';
  document.querySelectorAll(sel).forEach(a => { if (a.getAttribute('href') === '#') a.title = 'Link coming soon'; });
  document.addEventListener('click', e => {
    const a = e.target.closest(sel);
    if (!a || a.getAttribute('href') !== '#') return;
    e.preventDefault();
    a.classList.remove('nope'); void a.offsetWidth; a.classList.add('nope');
  });
})();

// ---- Projects: keep hovering and the picture zooms in deeper ----
(() => {
  document.querySelectorAll('.project .shot').forEach(s => {
    let t;
    s.addEventListener('pointerenter', e => {
      if (e.pointerType !== 'mouse' || document.documentElement.dataset.motion === 'off') return;
      clearTimeout(t); t = setTimeout(() => s.classList.add('deep'), 900);
    });
    s.addEventListener('pointermove', e => {
      const r = s.getBoundingClientRect();
      s.style.setProperty('--ox', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      s.style.setProperty('--oy', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    });
    s.addEventListener('pointerleave', () => { clearTimeout(t); s.classList.remove('deep'); });
  });
})();

// ---- Employment requirements: static checklist (documents sent upon request) ----
(() => {
  const list = document.querySelector('.reqs');
  if (!list) return;
  const items = [...list.querySelectorAll('.req')];
  const count = document.getElementById('req-count'), fill = document.getElementById('req-fill');
  const ready = items.filter(li => !li.classList.contains('pending')).length;
  count.textContent = ready;
  const grow = () => {                      // the bar and number fill up when the card scrolls into view
    fill.style.width = (ready / items.length * 100) + '%';
    let n = 0; const tick = () => { count.textContent = Math.min(ready, n++); if (n <= ready) setTimeout(tick, 120); };
    if (ready) tick();
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { grow(); io.disconnect(); } }, { threshold: 0.25 });
    io.observe(list);
  } else grow();
  list.addEventListener('pointermove', e => {          // a soft spotlight follows the mouse
    const li = e.target.closest('.req');
    if (!li) return;
    const r = li.getBoundingClientRect();
    li.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    li.style.setProperty('--my', (e.clientY - r.top) + 'px');
  });
})();

// ---- Floating ID on a lanyard (hero background) ----
// A small rope simulation: the strap is a chain of points, the card hangs from the last one.
// Drag it, push it with the mouse, or click it to jump to the contact section.
(() => {
  const scene = document.getElementById('id-scene');
  if (!scene) return;
  const rig = document.getElementById('id-rig'), card = document.getElementById('id-card'), band = document.getElementById('id-band');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const calm = () => reduce.matches || document.documentElement.dataset.motion === 'off';
  const AX = 150, AY = -30, N = 5, SEG = 22, ROD = 300, G = 0.62, DAMP = 0.994;
  const pts = [];
  for (let i = 0; i <= N; i++) pts.push({ x: AX, y: AY + i * SEG, px: AX, py: AY + i * SEG, w: i ? 1 : 0 });
  const T = pts[N];
  const B = { x: AX, y: T.y + ROD, px: AX, py: T.y + ROD, w: 0.55 };
  const free = pts.slice(1).concat(B);
  free.forEach(p => { p.px = p.x - 3.2; });          // a little swing when the page loads
  let drag = null, press = null, tick = 0, acc = 0, last = 0, running = false;

  const link = (a, b, len) => {
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, k = (d - len) / d, w = (a.w + b.w) || 1;
    a.x += dx * k * a.w / w; a.y += dy * k * a.w / w; b.x -= dx * k * b.w / w; b.y -= dy * k * b.w / w;
  };
  const step = () => {
    tick++;
    free.forEach(p => { const vx = (p.x - p.px) * DAMP, vy = (p.y - p.py) * DAMP; p.px = p.x; p.py = p.y; p.x += vx; p.y += vy + G; });
    if (!calm()) for (let i = 1; i <= N; i++) pts[i].x += Math.sin(tick * 0.018 + i * 0.7) * 0.035;     // soft breeze
    for (let k = 0; k < 10; k++) {
      for (let i = 0; i < N; i++) link(pts[i], pts[i + 1], SEG);
      link(T, B, ROD);
      pts[0].x = AX; pts[0].y = AY;
    }
    if (drag) {
      let tx = drag.x - drag.ox - AX, ty = drag.y - drag.oy - AY;
      const m = Math.hypot(tx, ty), max = 255;
      if (m > max) { tx *= max / m; ty *= max / m; }
      const dx = (AX + tx - (T.x + B.x) / 2) * 0.28, dy = (AY + ty - (T.y + B.y) / 2) * 0.28;
      T.x += dx; T.y += dy; B.x += dx; B.y += dy;
    }
  };
  const render = () => {
    const a = Math.atan2(-(B.x - T.x), B.y - T.y);
    rig.style.transform = 'translate(' + T.x.toFixed(2) + 'px,' + T.y.toFixed(2) + 'px) rotate(' + a.toFixed(4) + 'rad)';
    card.style.setProperty('--sheen', (a * 180 / Math.PI * 1.6).toFixed(1) + '%');
    let d = 'M' + pts[0].x + ' ' + pts[0].y;
    for (let i = 1; i < N; i++) d += ' Q' + pts[i].x.toFixed(1) + ' ' + pts[i].y.toFixed(1) + ' ' + ((pts[i].x + pts[i + 1].x) / 2).toFixed(1) + ' ' + ((pts[i].y + pts[i + 1].y) / 2).toFixed(1);
    band.setAttribute('d', d + ' L' + T.x.toFixed(1) + ' ' + T.y.toFixed(1));
  };
  const frame = ts => {
    if (!running) return;
    acc += Math.min(50, ts - last); last = ts;
    for (let n = 0; acc >= 16.667 && n < 4; n++) { step(); acc -= 16.667; }
    render();
    requestAnimationFrame(frame);
  };
  const start = () => { if (running || calm()) return; running = true; last = performance.now(); requestAnimationFrame(frame); };
  const stop = () => { running = false; };

  if (calm()) {                                       // still picture: let it settle once, no movement
    free.forEach(p => { p.px = p.x; });
    for (let i = 0; i < 400; i++) step();
    render();
  } else {
    render();
    if ('IntersectionObserver' in window) new IntersectionObserver(es => (es[0].isIntersecting ? start() : stop())).observe(scene.parentElement);
    else start();
  }
  reduce.addEventListener && reduce.addEventListener('change', () => { if (calm()) stop(); else start(); });

  const local = e => { const r = scene.getBoundingClientRect(), s = r.width / 300 || 1; return { x: (e.clientX - r.left) / s, y: (e.clientY - r.top) / s }; };
  const goContact = () => {
    B.x += 22; T.x += 8;
    const c = document.getElementById('contact');
    if (c) c.scrollIntoView({ behavior: calm() ? 'auto' : 'smooth', block: 'start' });
  };
  card.addEventListener('pointerdown', e => {
    if (e.button > 0) return;
    card.setPointerCapture(e.pointerId);
    const p = local(e);
    drag = { x: p.x, y: p.y, ox: p.x - (T.x + B.x) / 2, oy: p.y - (T.y + B.y) / 2 };
    press = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 };
    scene.classList.add('used');
  });
  card.addEventListener('pointermove', e => {
    if (!drag) return;
    const p = local(e); drag.x = p.x; drag.y = p.y;
    press.moved = Math.max(press.moved, Math.hypot(e.clientX - press.x, e.clientY - press.y));
  });
  const release = e => {
    if (!drag) return;
    const click = e.type === 'pointerup' && press.moved < 6 && performance.now() - press.t < 500;
    drag = null;
    if (click) goContact();
  };
  card.addEventListener('pointerup', release);
  card.addEventListener('pointercancel', release);
  card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); scene.classList.add('used'); goContact(); } });

  // pushing the card with the mouse (no click needed)
  let lx = null, ly = null;
  window.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || drag || !running) { lx = null; return; }
    const p = local(e);
    if (lx !== null) {
      const vx = p.x - lx, vy = p.y - ly, cx = (T.x + B.x) / 2, cy = (T.y + B.y) / 2;
      if (Math.hypot(p.x - cx, p.y - cy) < 120 && Math.hypot(vx, vy) > 3) {
        const f = Math.min(1, Math.hypot(vx, vy) / 40);
        B.x += vx * 0.1 * f; T.x += vx * 0.04 * f;
      }
    }
    lx = p.x; ly = p.y;
  }, { passive: true });
})();
