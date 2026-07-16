/**
 * main.js — Grief-Tech Ethics Console
 * Team Maze · MUJ Hackathon 2026
 *
 * Handles: custom cursor, chart, metrics, session dots,
 *          weekly bars, tapering steps, modals, scroll-reveal
 */

/* ── Custom Cursor ──────────────────────────────────────── */
const cur  = document.getElementById('cur');
const curR = document.getElementById('cur-r');
let mx = -100, my = -100, rx = -100, ry = -100;

document.addEventListener('mousemove', e => {
  mx = e.clientX;
  my = e.clientY;
  cur.style.transform = `translate3d(${mx}px,${my}px,0) translate(-50%,-50%)`;
});

(function animateCursor() {
  rx += (mx - rx) * 0.15;
  ry += (my - ry) * 0.15;
  curR.style.transform = `translate3d(${rx}px,${ry}px,0) translate(-50%,-50%)`;
  requestAnimationFrame(animateCursor);
})();

document.querySelectorAll('a,.pc,.ts-c,.int-btn,.mc-btn,.nav-links li').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cur.style.width  = '18px';
    cur.style.height = '18px';
    curR.style.width  = '54px';
    curR.style.height = '54px';
    curR.style.borderColor = 'rgba(200,149,74,.65)';
  });
  el.addEventListener('mouseleave', () => {
    cur.style.width  = '10px';
    cur.style.height = '10px';
    curR.style.width  = '36px';
    curR.style.height = '36px';
    curR.style.borderColor = 'rgba(200,149,74,.4)';
  });
});

/* ── Principle Card Glow ────────────────────────────────── */
function pcGlow(el, e) {
  const r = el.getBoundingClientRect();
  el.style.setProperty('--mx', ((e.clientX - r.left) / r.width  * 100) + '%');
  el.style.setProperty('--my', ((e.clientY - r.top)  / r.height * 100) + '%');
}
// Expose globally (called via onmousemove in HTML)
window.pcGlow = pcGlow;

/* ── Chart Data ─────────────────────────────────────────── */
const CD = [
  { w: 1,  v: .88, s: 'Deep Distress',     n: 'First session — she asked if it could hear her. It said yes.' },
  { w: 2,  v: .80, s: 'Acute Grief',       n: 'Three sessions this week. Longest: 2h 14m. All after midnight.' },
  { w: 3,  v: .74, s: 'Acute Grief',       n: 'Started ending sessions by asking what he would have said.' },
  { w: 4,  v: .68, s: 'Heavy Sorrow',      n: 'Cadence slowing. First daytime session — 2:40pm on a Tuesday.' },
  { w: 5,  v: .61, s: 'Processing',        n: 'She described a memory unprompted. Not a question. A memory.' },
  { w: 6,  v: .54, s: 'Processing',        n: 'Reflection depth up. She corrected the AI once. Good sign.' },
  { w: 7,  v: .49, s: 'Equilibrium',       n: 'Midpoint. Sessions now 3× / week. Consistent hour, consistent length.' },
  { w: 8,  v: .46, s: 'Equilibrium',       n: 'Coping language entering sessions: "I think I understand now."' },
  { w: 9,  v: .43, s: 'Gentle Acceptance', n: 'Sessions shorter. She ends them. Counselor notes the shift.' },
  { w: 10, v: .39, s: 'Gentle Acceptance', n: '"I don\'t need to ask him anything today." First time she said that.' },
  { w: 11, v: .36, s: 'Integration',       n: 'Memory becoming context — something she refers to, not dwells in.' },
  { w: 12, v: .33, s: 'Tapering Begins',   n: 'Counselor introduced the idea. Mara said she\'d been thinking it too.' },
  { w: 13, v: .30, s: 'Moving Forward',    n: 'Chose 1× / week herself. "I want to remember it as a choice."' },
  { w: 14, v: .27, s: 'Renewed Capacity',  n: 'Session 34: she laughed. 38 minutes. She ended it.' },
];

let cxs = [], cys = [], cw2 = 0, ch2 = 0, pinned = null, prog = 0, animId = null;

/* ── Chart Drawing ──────────────────────────────────────── */
function drawChart(pct = 1) {
  const c    = document.getElementById('ec');
  const ctx  = c.getContext('2d');
  const wrap = document.getElementById('cw');
  cw2 = wrap.clientWidth;
  ch2 = wrap.clientHeight;
  c.width  = cw2;
  c.height = ch2;

  const PL = 20, PR = 20, PT = 28, PB = 30;
  const W  = cw2 - PL - PR;
  const H  = ch2 - PT - PB;

  cxs = CD.map((_, i) => PL + (i / (CD.length - 1)) * W);
  cys = CD.map(d => PT + d.v * H);
  ctx.clearRect(0, 0, cw2, ch2);

  // Grid lines
  [.2, .4, .6, .8].forEach(g => {
    const gy = PT + g * H;
    ctx.beginPath();
    ctx.moveTo(PL, gy);
    ctx.lineTo(cw2 - PR, gy);
    ctx.strokeStyle = 'rgba(255,255,255,.03)';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // Taper zone
  const tx = cxs[11];
  const tg = ctx.createLinearGradient(tx, 0, cw2 - PR, 0);
  tg.addColorStop(0, 'rgba(96,136,120,.06)');
  tg.addColorStop(1, 'rgba(96,136,120,0)');
  ctx.fillStyle = tg;
  ctx.fillRect(tx, PT, cw2 - PR - tx, H);

  ctx.setLineDash([3, 6]);
  ctx.beginPath();
  ctx.moveTo(tx, PT);
  ctx.lineTo(tx, PT + H);
  ctx.strokeStyle = 'rgba(168,196,160,.22)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = '600 8px "Space Mono",monospace';
  ctx.fillStyle = 'rgba(168,196,160,.45)';
  ctx.textAlign = 'left';
  ctx.fillText('TAPERING', tx + 7, PT + 10);

  ctx.font = '7.5px "Space Mono",monospace';
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(192,112,64,.45)';
  ctx.fillText('DISTRESS', cw2 - PR, PT + 8);
  ctx.fillStyle = 'rgba(96,136,120,.45)';
  ctx.fillText('CALM', cw2 - PR, PT + H - 4);

  const upTo = Math.floor(pct * (CD.length - 1));
  const frac = pct * (CD.length - 1) - upTo;
  if (upTo < 1) return;

  // Area fill
  const ag = ctx.createLinearGradient(PL, 0, cw2 - PR, 0);
  ag.addColorStop(0,   'rgba(192,112,64,.2)');
  ag.addColorStop(.65, 'rgba(200,149,74,.09)');
  ag.addColorStop(1,   'rgba(96,136,120,.05)');
  ctx.beginPath();
  ctx.moveTo(cxs[0], cys[0]);
  for (let i = 0; i < upTo; i++) {
    const cx2 = (cxs[i] + cxs[i + 1]) / 2;
    const ny  = (i + 1 === upTo && frac > 0) ? cys[i] + (cys[i + 1] - cys[i]) * frac : cys[i + 1];
    const nx2 = (i + 1 === upTo && frac > 0) ? cxs[i] + (cxs[i + 1] - cxs[i]) * frac : cxs[i + 1];
    ctx.bezierCurveTo(cx2, cys[i], cx2, ny, nx2, ny);
  }
  const lx = upTo < CD.length - 1 ? cxs[upTo] + (cxs[upTo + 1] - cxs[upTo]) * frac : cxs[upTo];
  ctx.lineTo(lx, PT + H);
  ctx.lineTo(PL, PT + H);
  ctx.closePath();
  ctx.fillStyle = ag;
  ctx.fill();

  // Line stroke
  const lg = ctx.createLinearGradient(PL, 0, cw2 - PR, 0);
  lg.addColorStop(0,   '#c07040');
  lg.addColorStop(.55, '#c8954a');
  lg.addColorStop(1,   '#608878');
  ctx.beginPath();
  ctx.moveTo(cxs[0], cys[0]);
  for (let i = 0; i < upTo; i++) {
    const cx2 = (cxs[i] + cxs[i + 1]) / 2;
    const ny  = (i + 1 === upTo && frac > 0) ? cys[i] + (cys[i + 1] - cys[i]) * frac : cys[i + 1];
    const nx2 = (i + 1 === upTo && frac > 0) ? cxs[i] + (cxs[i + 1] - cxs[i]) * frac : cxs[i + 1];
    ctx.bezierCurveTo(cx2, cys[i], cx2, ny, nx2, ny);
  }
  ctx.strokeStyle = lg;
  ctx.lineWidth   = 2.8;
  ctx.lineJoin    = 'round';
  ctx.lineCap     = 'round';
  ctx.stroke();

  // Data points
  for (let i = 0; i <= upTo && i < CD.length; i++) {
    const ip = (pinned === i);
    const r2 = ip ? 8 : 5;
    ctx.beginPath();
    ctx.arc(cxs[i], cys[i], r2, 0, Math.PI * 2);
    ctx.fillStyle   = i <= 11 ? (ip ? '#e08050' : '#c07040') : (ip ? '#80b898' : '#608878');
    ctx.fill();
    ctx.strokeStyle = ip ? 'rgba(250,247,242,.65)' : 'rgba(250,247,242,.2)';
    ctx.lineWidth   = ip ? 2 : 1.5;
    ctx.stroke();
    if (ip) {
      ctx.beginPath();
      ctx.arc(cxs[i], cys[i], r2 + 6, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(200,149,74,.22)';
      ctx.lineWidth   = 1.5;
      ctx.stroke();
    }
  }
}

function animChart() {
  if (animId) cancelAnimationFrame(animId);
  prog = 0;
  const dur = 2000;
  const st  = performance.now();
  (function step(now) {
    const p = Math.min((now - st) / dur, 1);
    prog = 1 - Math.pow(1 - p, 3);
    drawChart(prog);
    if (p < 1) animId = requestAnimationFrame(step);
  })(st);
}

function closest2(mx2) {
  if (!cxs.length) return -1;
  let b = 0, bd = 1e9;
  cxs.forEach((x, i) => {
    const d = Math.abs(x - mx2);
    if (d < bd) { bd = d; b = i; }
  });
  return bd < 44 ? b : -1;
}

function showTT(idx) {
  const d  = CD[idx];
  const tt = document.getElementById('tt');
  const s  = document.getElementById('scr');
  document.getElementById('tw').textContent = `Week ${d.w}`;
  document.getElementById('ts').textContent = d.s;
  document.getElementById('tn').textContent = d.n;
  let lx = cxs[idx] + 15;
  let ly = cys[idx] - 25;
  if (cxs[idx] > cw2 / 2) lx = cxs[idx] - tt.offsetWidth - 15;
  if (ly < 0)              ly = 10;
  if (ly + tt.offsetHeight > ch2) ly = ch2 - tt.offsetHeight - 10;
  tt.style.left    = lx + 'px';
  tt.style.top     = ly + 'px';
  tt.style.opacity = '1';
  s.style.left     = cxs[idx] + 'px';
  s.style.opacity  = '1';
}

function hideTT() {
  if (pinned !== null) return;
  document.getElementById('tt').style.opacity  = '0';
  document.getElementById('scr').style.opacity = '0';
}

function initChart() {
  const wrap = document.getElementById('cw');
  wrap.addEventListener('mousemove', e => {
    const rr  = wrap.getBoundingClientRect();
    const idx = closest2(e.clientX - rr.left);
    if (idx >= 0) {
      showTT(idx);
      drawChart(prog);
    } else if (pinned === null) {
      document.getElementById('tt').style.opacity  = '0';
      document.getElementById('scr').style.opacity = '0';
    }
  });
  wrap.addEventListener('mouseleave', () => { if (pinned === null) hideTT(); });
  wrap.addEventListener('click', e => {
    const rr  = wrap.getBoundingClientRect();
    const idx = closest2(e.clientX - rr.left);
    if (idx >= 0) {
      pinned = (pinned === idx) ? null : idx;
      if (pinned === null) hideTT();
      else showTT(pinned);
      drawChart(prog);
    }
  });
}

/* ── Session Frequency Dots ─────────────────────────────── */
function buildDots() {
  const el = document.getElementById('fdots');
  'sss_ss_ss_sss_ss_sss_ss_ss_tt_t_tt_t'.split('').forEach(p => {
    const d = document.createElement('div');
    d.className = 'dot' + (p === 's' ? ' s' : p === 't' ? ' t' : '');
    el.appendChild(d);
  });
}

/* ── Weekly Visit Bars ──────────────────────────────────── */
function buildBars() {
  const el = document.getElementById('fbars');
  [3, 4, 3, 4, 4, 3, 3, 4, 3, 2, 2, 2, 1, 1].forEach((v, i) => {
    const b  = document.createElement('div');
    const tp = i >= 11;
    b.className    = 'bar';
    b.style.cssText = `flex:1;height:${(v / 4) * 100}%;background:${tp ? '#608878' : '#c8954a'};opacity:${tp ? .5 : .4};border-radius:2px 2px 0 0`;
    b.addEventListener('mouseenter', () => { b.style.opacity = '1'; });
    b.addEventListener('mouseleave', () => { b.style.opacity = tp ? '.5' : '.4'; });
    el.appendChild(b);
  });
}

/* ── Tapering Steps ─────────────────────────────────────── */
function buildTaper() {
  const steps = [
    { l: 'Now',      d: '2× / week',   e: '⟳' },
    { l: 'Month 2',  d: '1× / week',   e: '◑' },
    { l: 'Month 3',  d: '2× / month',  e: '◔' },
    { l: 'Month 4',  d: '1× / month',  e: '○' },
    { l: 'Month 5+', d: 'When she wants', e: '✦' },
  ];
  const el = document.getElementById('tsteps');
  steps.forEach((s, i) => {
    const div = document.createElement('div');
    div.className = 'ts';
    div.innerHTML = `
      <div class="ts-c ${i === 0 ? 'a' : ''}" onclick="selTaper(this)">${s.e}</div>
      <p class="ts-l">${s.l}</p>
      <p class="ts-d">${s.d}</p>
    `;
    el.appendChild(div);
  });
}

function selTaper(el) {
  document.querySelectorAll('.ts-c').forEach(c => c.classList.remove('a'));
  el.classList.add('a');
}
window.selTaper = selTaper;

/* ── Animated Counter ───────────────────────────────────── */
function counter(id, target, dur) {
  const el = document.getElementById(id);
  const st = performance.now();
  (function step(now) {
    const p = Math.min((now - st) / dur, 1);
    el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target);
    if (p < 1) requestAnimationFrame(step);
  })(st);
}

/* ── Intersection Observer — Scroll Reveal & Metrics ────── */
let mAnimated = false, chartDone = false;

const obs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');

    // Metrics counters + bars
    if (!mAnimated && e.target.querySelector && e.target.querySelector('#m1')) {
      mAnimated = true;
      setTimeout(() => {
        counter('m1', 75, 1300);
        counter('m2', 60, 1300);
        counter('m3', 35, 1300);
        document.getElementById('b1').style.width = '75%';
        document.getElementById('b2').style.width = '60%';
        document.getElementById('b3').style.width = '35%';
      }, 400);
    }

    // Chart entrance animation
    if (!chartDone && e.target.classList.contains('chart-panel')) {
      chartDone = true;
      setTimeout(animChart, 250);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

document.querySelectorAll('.rv').forEach(el => obs.observe(el));

/* ── Modal System ───────────────────────────────────────── */
const MD = {
  w: {
    t: 'Protect Wellbeing',
    b: `<p>The console doesn't track frequency because frequency is bad. It tracks it because a grief counselor — one human, watching over sometimes hundreds of clients — cannot always notice the 3am pattern alone.</p><br>
        <p>We deliberately <strong>refused to build a risk-score system.</strong> Scores imply that some grief is more legitimate than others. Seasons don't. So the console surfaces seasons.</p>`,
  },
  p: {
    t: 'Illuminate Patterns',
    b: `<p>Mara's sessions were shifting to later and later at night. The console noticed. It didn't alert Mara — it surfaced a note for her counselor, who opened the conversation as a question, not a concern.</p><br>
        <p>That is the difference between <em>surveillance and care.</em> One watches. The other notices, and then asks.</p>`,
  },
  b: {
    t: 'Honor the Bond',
    b: `<p>We spent three months arguing about whether to include a "This is not a real person" disclaimer at the start of each session. We removed it.</p><br>
        <p>Everyone knows. <strong>Saying it again is cruelty wearing the clothes of caution.</strong> The bond between Mara and what she visits is not a delusion — it is a space she has chosen, consensually, to process something unprocessable.</p>`,
  },
  g: {
    t: 'Guide, Never Police',
    b: `<p>Early versions of this console sent a push notification to the user when the system detected "elevated dependency." We removed it in month 3 after our ethics review.</p><br>
        <p>The problem: <em>who decides what elevated means?</em> Not the algorithm. The notification went. The counselor remained. <strong>That's the console's only job: give the counselor more to work with.</strong></p>`,
  },
  tap: {
    t: 'Opening the Tapering Dialogue',
    b: `<p>The tapering plan is never presented to Mara. It is offered to the counselor as a possible shape for a conversation.</p><br>
        <p>The conversation might begin: <em>"I've noticed the visits feel lighter lately. Is that true for you?"</em></p><br>
        <p>If Mara says yes, the conversation continues. If she says no, nothing changes. The console updates. The counselor listens. <strong>The timeline is hers.</strong></p>`,
  },
};

function openM(k) {
  const d = MD[k];
  if (!d) return;
  document.getElementById('mt').textContent    = d.t;
  document.getElementById('mbody').innerHTML   = d.b;
  document.getElementById('mo').classList.add('open');
  document.body.classList.add('no-scroll');
}
function closeM() {
  document.getElementById('mo').classList.remove('open');
  document.body.classList.remove('no-scroll');
}
function tryCloseM(e) {
  if (e.target === document.getElementById('mo')) closeM();
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeM(); });

// Expose modal functions globally (called from HTML)
window.openM     = openM;
window.closeM    = closeM;
window.tryCloseM = tryCloseM;

/* ── Init on Load ───────────────────────────────────────── */
window.addEventListener('load', () => {
  animChart();
  initChart();
  buildDots();
  buildBars();
  buildTaper();
});

window.addEventListener('resize', () => drawChart(prog));
