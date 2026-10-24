(() => {
  'use strict';

  /* =====================================================
     UTILIDADES
     ===================================================== */
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = id => document.getElementById(id);
  const rand = (min, max) => min + Math.random() * (max - min);
  const BUTTERFLY_SVG = '<svg viewBox="0 0 100 80" aria-hidden="true"><use href="#butterfly"/></svg>';

  // Iconos del sprite del HTML (<symbol id="i-nombre">)
  const icon = (name, cls = '') =>
    `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const SPARK = icon('sparkle', 'i-fill');
  const HEART = icon('heart', 'i-fill i-inline');
  const MAIL  = icon('mail');

  function make(tag, className, parent) {
    const el = document.createElement(tag);
    el.className = className;
    if (parent) parent.appendChild(el);
    return el;
  }

  /* =====================================================
     1. APARICIÓN DE SECCIONES (escalonada)
     ===================================================== */
  function initReveal() {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
      [...section.children].forEach((child, i) => child.style.setProperty('--i', i));
      section.querySelectorAll('.detail').forEach((card, i) => card.style.setProperty('--i', i));
    });

    if (!('IntersectionObserver' in window)) {
      sections.forEach(s => s.classList.add('visible'));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        document.dispatchEvent(new Event('section-in'));
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    sections.forEach(s => observer.observe(s));
  }

  /* =====================================================
     2. PORTADA: nombre letra por letra + destellos
     ===================================================== */
  function initHero() {
    const name = document.querySelector('.hero .name');
    const text = name.textContent.trim();
    name.setAttribute('aria-label', text);
    name.textContent = '';
    [...text].forEach((char, i) => {
      const letter = make('span', 'letter', name);
      letter.textContent = char;
      letter.style.setProperty('--i', i);
      letter.setAttribute('aria-hidden', 'true');
    });

    if (reduce) return;
    const hero = $('hero');
    for (let i = 0; i < 16; i++) {
      const star = make('span', 'twinkle', hero);
      star.innerHTML = SPARK;
      star.style.left = rand(3, 95) + '%';
      star.style.top = rand(3, 95) + '%';
      star.style.fontSize = rand(.6, 1.3) + 'rem';
      star.style.animationDelay = rand(0, 3) + 's';
      star.style.animationDuration = rand(2, 4) + 's';
    }
  }

  /* =====================================================
     3. SCROLL: barra de progreso y parallax
     ===================================================== */
  function initScroll() {
    const root = document.documentElement;
    let ticking = false;
    const update = () => {
      const max = root.scrollHeight - window.innerHeight;
      root.style.setProperty('--sy', window.scrollY);
      root.style.setProperty('--p', max > 0 ? window.scrollY / max : 0);
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* =====================================================
     4. MARIPOSAS VOLADORAS (cruzan la pantalla)
     ===================================================== */
  function initFlyers() {
    if (reduce) return;
    const sky = $('sky');
    const MAX_FLYERS = 4;

    function fly() {
      if (sky.children.length >= MAX_FLYERS) return;
      const vw = window.innerWidth, vh = window.innerHeight;
      const dir = Math.random() < .5 ? 1 : -1;
      const steps = 5;
      const el = make('span', 'butterfly flyer', sky);
      el.innerHTML = BUTTERFLY_SVG;
      el.style.width = rand(28, 50) + 'px';

      let x = dir === 1 ? -70 : vw + 70;
      let y = rand(vh * .1, vh * .85);
      const points = [[x, y]];
      for (let i = 1; i <= steps; i++) {
        x += dir * (vw + 140) / steps;
        y = Math.min(vh - 40, Math.max(20, y + rand(-vh * .3, vh * .3)));
        points.push([x, y]);
      }

      const frames = points.map(([px, py], i) => {
        const prev = points[Math.max(i - 1, 0)];
        const next = points[Math.min(i + 1, steps)];
        const angle = Math.atan2(next[1] - prev[1], next[0] - prev[0]) * 180 / Math.PI + 90;
        return { transform: `translate(${px}px, ${py}px) rotate(${angle}deg)`, offset: i / steps };
      });

      el.animate(frames, { duration: rand(10000, 16000), easing: 'linear' })
        .onfinish = () => el.remove();
    }

    setTimeout(fly, 700);
    setInterval(fly, 3200);
  }

  /* =====================================================
     5. MAGIA AL TOCAR: destellos y mariposas pequeñas
     ===================================================== */
  function initBursts() {
    if (reduce) return;
    const fx = $('fx');

    function burst(x, y, count = 9) {
      for (let i = 0; i < count; i++) {
        const isButterfly = i % 3 === 0;
        const el = isButterfly ? make('span', 'mini-butterfly', fx) : make('span', 'spark', fx);
        el.innerHTML = isButterfly ? BUTTERFLY_SVG : SPARK;

        const angle = rand(0, Math.PI * 2);
        const dist = rand(50, isButterfly ? 150 : 110);
        const dx = Math.cos(angle) * dist, dy = Math.sin(angle) * dist - 30;
        el.animate([
          { transform: `translate(${x}px, ${y}px) scale(.3) rotate(0deg)`, opacity: 1 },
          { transform: `translate(${x + dx}px, ${y + dy}px) scale(1) rotate(${rand(-90, 90)}deg)`, opacity: 0 }
        ], { duration: rand(900, 1500), easing: 'cubic-bezier(.2,.7,.3,1)' })
          .onfinish = () => el.remove();
      }
    }

    document.addEventListener('pointerdown', e => burst(e.clientX, e.clientY));

    // Estela de destellos solo con mouse
    let last = 0;
    document.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse' || e.timeStamp - last < 70) return;
      last = e.timeStamp;
      const s = make('span', 'spark', fx);
      s.innerHTML = SPARK;
      s.animate([
        { transform: `translate(${e.clientX}px, ${e.clientY}px) scale(.8)`, opacity: .9 },
        { transform: `translate(${e.clientX + rand(-14, 14)}px, ${e.clientY + 28}px) scale(.2)`, opacity: 0 }
      ], { duration: 800, easing: 'ease-out' }).onfinish = () => s.remove();
    });

    return burst;
  }

  /* =====================================================
     6. CUENTA REGRESIVA (26 dic 2026, 8:00 p. m. Colombia, UTC-5)
     ===================================================== */
  function initCountdown() {
    const target = Date.parse('2026-12-27T01:00:00Z');
    const pad = n => String(n).padStart(2, '0');

    function setValue(id, value) {
      const el = $(id);
      if (el.textContent === value) return;
      el.textContent = value;
      if (reduce) return;
      el.classList.remove('flip');
      void el.offsetWidth;            // reinicia la animación
      el.classList.add('flip');
    }

    function tick() {
      let diff = target - Date.now();
      if (diff <= 0) {
        ['days', 'hours', 'minutes', 'seconds'].forEach(id => setValue(id, '00'));
        $('countMessage').innerHTML = diff > -86400000
          ? `¡Hoy es la gran noche de Angella! ${HEART}`
          : `¡Gracias por celebrar conmigo! ${HEART}`;
        return;
      }
      const d = Math.floor(diff / 86400000); diff %= 86400000;
      const h = Math.floor(diff / 3600000);  diff %= 3600000;
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setValue('days', pad(d));
      setValue('hours', pad(h));
      setValue('minutes', pad(m));
      setValue('seconds', pad(s));
    }

    tick();
    setInterval(tick, 1000);
  }

  /* =====================================================
     7. PÉTALOS VERDES CAYENDO
     ===================================================== */
  function initPetals() {
    if (reduce) return;
    const layer = $('petals');

    function petal() {
      const p = make('span', 'petal', layer);
      p.style.left = rand(0, 100) + 'vw';
      p.style.setProperty('--drift', rand(-85, 85) + 'px');
      p.style.animationDuration = rand(8, 16) + 's';
      setTimeout(() => p.remove(), 17000);
    }

    for (let i = 0; i < 12; i++) setTimeout(petal, i * 240);
    setInterval(petal, 900);
  }

  /* =====================================================
     8. LLUVIA DE SOBRES (solo mientras la sección es visible)
     ===================================================== */
  function initEnvelopeRain() {
    const rain = $('rain');
    if (reduce || !('IntersectionObserver' in window)) return;
    let timer = null;

    function drop() {
      const e = make('span', 'rain-env', rain);
      e.innerHTML = MAIL;
      e.style.left = rand(0, 94) + '%';
      e.style.fontSize = rand(1.1, 2) + 'rem';
      e.style.animationDuration = rand(4, 7) + 's';
      e.style.setProperty('--sway', rand(-40, 40) + 'px');
      e.addEventListener('animationend', () => e.remove());
    }

    new IntersectionObserver(([entry]) => {
      clearInterval(timer);
      if (entry.isIntersecting) timer = setInterval(drop, 380);
    }).observe(rain.parentElement);
  }

  /* =====================================================
     8b. PRINCESA: camina mientras bajas (la posición la mueve el CSS con --p)
     ===================================================== */
  function initPrincess() {
    const princess = $('princess');
    if (!princess || reduce) return;
    let stopTimer;
    window.addEventListener('scroll', () => {
      princess.classList.add('walking');
      clearTimeout(stopTimer);
      stopTimer = setTimeout(() => princess.classList.remove('walking'), 260);
    }, { passive: true });
  }

  /* =====================================================
     8c. CARTA DE ENTRADA: el clic en el sello abre la invitación
     ===================================================== */
  function initIntro(burst) {
    const intro = $('intro');
    if (!intro) { document.body.classList.add('opened'); return; }
    document.body.classList.add('locked');

    if (!reduce) {                                   // polvo dorado de fondo
      const dust = $('introDust');
      for (let i = 0; i < 26; i++) {
        const star = make('span', 'twinkle', dust);
        star.innerHTML = SPARK;
        star.style.left = rand(2, 98) + '%';
        star.style.top = rand(2, 98) + '%';
        star.style.fontSize = rand(.6, 1.4) + 'rem';
        star.style.animationDelay = rand(0, 3) + 's';
        star.style.animationDuration = rand(2, 4.5) + 's';
      }
    }

    let opened = false;
    function open() {
      if (opened) return;
      opened = true;
      const r = $('seal').getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;

      intro.classList.add('opening');                // rompe el sello, abre la solapa, sube la carta
      if (!music.isPlaying()) music.toggle();
      if (burst) {
        burst(cx, cy, 28);
        setTimeout(() => burst(cx, cy - 90, 24), 900);
        setTimeout(() => burst(cx - 60, cy - 120, 20), 1500);
      }
      setTimeout(() => intro.classList.add('leaving'), reduce ? 100 : 2400);
      setTimeout(() => {
        intro.remove();
        document.body.classList.remove('locked');
        document.body.classList.add('opened');       // arranca la portada y aparece la princesa
        window.scrollTo(0, 0);
        if (burst) burst(window.innerWidth / 2, window.innerHeight * .4, 32);
      }, reduce ? 300 : 3300);
    }
    $('seal').addEventListener('click', open);
    $('envelope').addEventListener('click', open);
  }

  /* =====================================================
     9. MÚSICA (melodía instrumental sintetizada)
     ===================================================== */
  const music = (() => {
    const NOTES = [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880, 698.46,
                   523.25, 659.25, 783.99, 1046.5, 880, 783.99, 659.25, 587.33];
    const btn = $('musicBtn');
    let ctx = null, master = null, timer = null, playing = false, index = 0;

    function playNote(freq, when, dur) {
      const layers = [
        { type: 'sine',     mult: 1, peak: .065, length: dur },
        { type: 'triangle', mult: 2, peak: .009, length: dur * .8 }
      ];
      layers.forEach(({ type, mult, peak, length }) => {
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq * mult, when);
        gain.gain.setValueAtTime(.0001, when);
        gain.gain.exponentialRampToValueAtTime(peak, when + .06);
        gain.gain.exponentialRampToValueAtTime(.0001, when + length);
        osc.connect(gain);
        gain.connect(master);
        osc.start(when);
        osc.stop(when + length + .03);
      });
    }

    function loop() {
      if (!playing || !ctx) return;
      const now = ctx.currentTime;
      for (let i = 0; i < 4; i++) playNote(NOTES[(index + i) % NOTES.length], now + i * .42, .65);
      index = (index + 4) % NOTES.length;
      timer = setTimeout(loop, 1680);
    }

    // Botón: nota musical al sonar, nota tachada al estar en pausa
    function setUi(on) {
      btn.innerHTML = icon(on ? 'music' : 'music-off');
      btn.classList.toggle('on', on);
      btn.setAttribute('aria-label', on ? 'Pausar música' : 'Activar música');
    }

    async function toggleSynth() {
      try {
        if (!ctx) {
          ctx = new (window.AudioContext || window.webkitAudioContext)();
          master = ctx.createGain();
          master.gain.value = .38;
          master.connect(ctx.destination);
        }
        if (!playing) {
          await ctx.resume();
          playing = true;
          setUi(true);
          loop();
        } else {
          playing = false;
          clearTimeout(timer);
          await ctx.suspend();
          setUi(false);
        }
      } catch (err) {
        setUi(false);
      }
    }

    // --- Tu MP3: edita el nombre del archivo en <audio id="bgMusic" src="..."> del HTML ---
    const file = $('bgMusic');
    let fileOk = !!file && !!file.getAttribute('src');
    if (file) file.addEventListener('error', () => { fileOk = false; });

    async function toggle() {
      if (fileOk) {
        try {
          if (!playing) { await file.play(); playing = true; setUi(true); }
          else { file.pause(); playing = false; setUi(false); }
          return;
        } catch (err) {
          fileOk = false;      // archivo ausente o bloqueado: usa la melodía de respaldo
          playing = false;
        }
      }
      return toggleSynth();
    }

    btn.addEventListener('click', toggle);
    return { toggle, isPlaying: () => playing };
  })();

  /* =====================================================
     INICIO
     ===================================================== */
  initReveal();
  initHero();
  initScroll();
  initFlyers();
  const burst = initBursts();
  initCountdown();
  initPetals();
  initEnvelopeRain();
  initPrincess();
  initIntro(burst);

  $('openInvite').addEventListener('click', e => {
    if (!music.isPlaying()) music.toggle();
    if (burst) burst(e.clientX, e.clientY, 18);
    $('welcome').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  });
})();