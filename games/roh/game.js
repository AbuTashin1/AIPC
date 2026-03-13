// ═══════════════════════════════════════════════════════
//  RISE OF HOPE — AIPC Arcade Game (v3)
//  NO LEVELS. Continuous difficulty ramp based on score.
//  Space starts game. Gets brutal fast.
// ═══════════════════════════════════════════════════════

const canvas  = document.getElementById('gameCanvas');
const ctx     = canvas.getContext('2d');
const wrap    = document.getElementById('canvasContainer');

const scoreDisplay = document.getElementById('scoreDisplay');
const bestDisplay  = document.getElementById('bestDisplay');
const timeDisplay  = document.getElementById('timeDisplay');
const startScreen  = document.getElementById('startScreen');
const gameOverScr  = document.getElementById('gameOverScreen');
const pauseScreen  = document.getElementById('pauseScreen');
const comboFlash   = document.getElementById('comboFlash');
const startBtn     = document.getElementById('startBtn');
const retryBtn     = document.getElementById('retryBtn');
const resumeBtn    = document.getElementById('resumeBtn');
const startBest    = document.getElementById('startBest');

const spScore     = document.getElementById('spScore');
const spBest      = document.getElementById('spBest');
const spTime      = document.getElementById('spTime');
const spGames     = document.getElementById('spGames');
const spBestRun   = document.getElementById('spBestRun');
const spBestTime  = document.getElementById('spBestTime');
const spQuote     = document.getElementById('spQuote');
const spCite      = document.getElementById('spCite');

const SAVE_BEST   = 'aipc_roh_best';
const SAVE_GAMES  = 'aipc_roh_games';
const SAVE_BTIME  = 'aipc_roh_besttime';

// ══════════════════════════════════════════════
//  TUNING — no levels, pure score-based ramp
// ══════════════════════════════════════════════
const BALL_R         = 12;
const PIPE_W         = 50;
const GAP_PCT_START  = 0.34;
const GAP_PCT_MIN    = 0.15;
const GAP_SHRINK     = 0.007;   // per point
const GAP_DRIFT_MAX  = 0.26;
const SPEED_START    = 2.4;
const SPEED_MAX      = 8.0;
const SPEED_PER_PT   = 0.16;    // aggressive
const GRAV_START     = 0.32;
const GRAV_PER_PT    = 0.005;
const GRAV_MAX       = 0.58;
const JUMP_VEL       = -7.0;
const ARROW_PUSH     = 0.75;
const VEL_MAX        = 13;
const SPAWN_START    = 90;
const SPAWN_MIN      = 28;
const SPAWN_DEC      = 2.2;     // per point

// ══════════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════════
let gameState = 'start';
let score = 0, best = 0, bestTime = 0, totalGames = 0;
let timerSec = 0, timerLastTs = 0;
let ball = { x: 0, y: 0, vy: 0 };
let pipes = [], particles = [], bgClouds = [];
let pipeTimer = 0, shakeFrames = 0, animId = null, lastTime = 0;
let lastGapCenter = 0;
let dpr = 1;
const keys = { up: false, down: false };

// ══════════════════════════════════════════════
//  CANVAS RESIZE
// ══════════════════════════════════════════════
function resize() {
    const r = wrap.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    canvas.width = r.width * dpr;
    canvas.height = r.height * dpr;
    canvas.style.width = r.width + 'px';
    canvas.style.height = r.height + 'px';
    ctx.setTransform(1,0,0,1,0,0);
    ctx.scale(dpr, dpr);
    buildClouds(r.width, r.height);
    if (ball.x === 0) { ball.x = r.width * 0.18; ball.y = r.height * 0.5; }
}
window.addEventListener('resize', resize);
resize();
function W() { return canvas.width / dpr; }
function H() { return canvas.height / dpr; }

function buildClouds(w, h) {
    bgClouds = Array.from({ length: 7 }, () => ({
        x: Math.random()*w, y: 30+Math.random()*(h*0.7),
        rx: 55+Math.random()*80, ry: 18+Math.random()*28,
        speed: 0.08+Math.random()*0.14, alpha: 0.06+Math.random()*0.10
    }));
}

// ══════════════════════════════════════════════
//  HELPERS — all score-based, no levels
// ══════════════════════════════════════════════
function fmtTime(s) { const m=Math.floor(s/60),sc=s%60; return m+':'+(sc<10?'0':'')+sc; }
function hideAll() { startScreen.classList.add('hidden'); gameOverScr.classList.add('hidden'); pauseScreen.classList.add('hidden'); }
function curGap()   { return Math.round(H() * Math.max(GAP_PCT_MIN, GAP_PCT_START - score * GAP_SHRINK)); }
function curSpeed() { return Math.min(SPEED_MAX, SPEED_START + score * SPEED_PER_PT); }
function curGrav()  { return Math.min(GRAV_MAX, GRAV_START + score * GRAV_PER_PT); }
function curSpawn() { return Math.max(SPAWN_MIN, SPAWN_START - score * SPAWN_DEC); }

// ══════════════════════════════════════════════
//  HUD
// ══════════════════════════════════════════════
function updateHUD() {
    const b = Math.max(score, best);
    if (scoreDisplay) scoreDisplay.textContent = score;
    if (bestDisplay) bestDisplay.textContent = b;
    if (timeDisplay) timeDisplay.textContent = fmtTime(timerSec);
    if (spScore) spScore.textContent = score;
    if (spBest) spBest.textContent = b;
    if (spTime) spTime.textContent = fmtTime(timerSec);
    if (spGames) spGames.textContent = totalGames;
    if (spBestRun) spBestRun.textContent = b;
    if (spBestTime) spBestTime.textContent = fmtTime(bestTime);
}
function popEl(el) { if (!el) return; el.classList.add('pop'); setTimeout(()=>el.classList.remove('pop'),120); }

// ══════════════════════════════════════════════
//  FX
// ══════════════════════════════════════════════
let comboTO;
function showFlash(t,c='#0059ff') {
    comboFlash.textContent=t; comboFlash.style.color=c;
    comboFlash.classList.remove('hidden'); comboFlash.style.animation='none';
    void comboFlash.offsetWidth; comboFlash.style.animation='comboAnim 0.75s ease forwards';
    clearTimeout(comboTO); comboTO=setTimeout(()=>comboFlash.classList.add('hidden'),760);
}
function flashScreen(type) {
    wrap.classList.remove('flash-red','flash-blue'); void wrap.offsetWidth;
    wrap.classList.add(type==='hit'?'flash-red':'flash-blue');
    setTimeout(()=>wrap.classList.remove('flash-red','flash-blue'),280);
}
function burst(x,y,color,n=8) {
    for(let i=0;i<n;i++){const a=(Math.PI*2/n)*i+(Math.random()-0.5)*0.6,s=2.5+Math.random()*4;
    particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-1.2,size:2.5+Math.random()*3.5,color,alpha:1});}
}

// ══════════════════════════════════════════════
//  INPUT — Space starts/restarts
// ══════════════════════════════════════════════
function thrust() { if (gameState === 'playing') ball.vy = JUMP_VEL; }

document.addEventListener('keydown', e => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'start' || gameState === 'over') { startGame(); return; }
        if (gameState === 'paused') { resumeGame(); return; }
        thrust();
    }
    if (e.code === 'ArrowUp')   { e.preventDefault(); keys.up = true; }
    if (e.code === 'ArrowDown') { e.preventDefault(); keys.down = true; }
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (gameState === 'playing') pauseGame();
        else if (gameState === 'paused') resumeGame();
    }
    if (e.code === 'Enter') {
        if (gameState === 'start' || gameState === 'over') startGame();
    }
});
document.addEventListener('keyup', e => {
    if (e.code === 'ArrowUp') keys.up = false;
    if (e.code === 'ArrowDown') keys.down = false;
});

canvas.addEventListener('pointerdown', e => { e.preventDefault(); thrust(); });
canvas.addEventListener('touchstart', e => { e.preventDefault(); thrust(); }, { passive: false });
startBtn.addEventListener('click', startGame);
retryBtn.addEventListener('click', startGame);
resumeBtn.addEventListener('click', resumeGame);

// ══════════════════════════════════════════════
//  GAME FLOW
// ══════════════════════════════════════════════
function startGame() {
    score = 0; timerSec = 0; timerLastTs = 0;
    pipes = []; particles = []; pipeTimer = 0; shakeFrames = 0; lastGapCenter = 0;
    ball.x = W() * 0.18; ball.y = H() * 0.5; ball.vy = 0;
    hideAll(); gameState = 'playing'; updateHUD();
    if (animId) cancelAnimationFrame(animId);
    lastTime = 0; animId = requestAnimationFrame(loop);
}
function pauseGame() { gameState = 'paused'; pauseScreen.classList.remove('hidden'); cancelAnimationFrame(animId); }
function resumeGame() { gameState = 'playing'; pauseScreen.classList.add('hidden'); lastTime = 0; timerLastTs = 0; animId = requestAnimationFrame(loop); }

function endGame() {
    gameState = 'over'; cancelAnimationFrame(animId);
    totalGames++; localStorage.setItem(SAVE_GAMES, totalGames);
    const nb = score > best;
    if (nb) { best = score; localStorage.setItem(SAVE_BEST, best); }
    if (timerSec > bestTime) { bestTime = timerSec; localStorage.setItem(SAVE_BTIME, bestTime); }
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalBest').textContent = Math.max(score, best);
    document.getElementById('finalTime').textContent = fmtTime(timerSec);
    document.getElementById('newBestBanner').classList.toggle('hidden', !nb);
    gameOverScr.classList.remove('hidden');
    updateHUD();
}

// ══════════════════════════════════════════════
//  PIPE SPAWN
// ══════════════════════════════════════════════
function spawnPipe() {
    const h = H(), gap = curGap(), margin = 50 + BALL_R;
    const minC = margin + gap/2, maxC = h - margin - gap/2;
    if (lastGapCenter === 0) lastGapCenter = h * 0.5;
    const drift = h * GAP_DRIFT_MAX;
    const lo = Math.max(minC, lastGapCenter - drift);
    const hi = Math.min(maxC, lastGapCenter + drift);
    const center = lo + Math.random() * (hi - lo);
    lastGapCenter = center;
    pipes.push({ x: W(), topH: center - gap/2, botY: center + gap/2, passed: false });
}

// ══════════════════════════════════════════════
//  MAIN LOOP
// ══════════════════════════════════════════════
function loop(ts) {
    if (gameState !== 'playing') return;
    const dt = lastTime ? Math.min((ts - lastTime) / 16.667, 3) : 1;
    lastTime = ts;
    if (timerLastTs === 0) timerLastTs = ts;
    const elapsed = Math.floor((ts - timerLastTs) / 1000);
    if (elapsed > timerSec) { timerSec = elapsed; updateHUD(); }
    pipeTimer += dt;
    if (pipeTimer >= curSpawn()) { pipeTimer = 0; spawnPipe(); }
    tick(dt);
    if (shakeFrames > 0) shakeFrames -= dt;
    render(ts);
    animId = requestAnimationFrame(loop);
}

// ══════════════════════════════════════════════
//  TICK
// ══════════════════════════════════════════════
function tick(dt) {
    const w = W(), h = H();
    if (keys.up) ball.vy -= ARROW_PUSH * dt;
    if (keys.down) ball.vy += ARROW_PUSH * dt;
    ball.vy += curGrav() * dt;
    ball.vy = Math.max(-VEL_MAX, Math.min(VEL_MAX, ball.vy));
    ball.y += ball.vy * dt;

    if (ball.y - BALL_R <= 0) { ball.y = BALL_R; flashScreen('hit'); shakeFrames = 6; burst(ball.x, 0, '#ef4444', 8); endGame(); return; }
    if (ball.y + BALL_R >= h) { ball.y = h - BALL_R; flashScreen('hit'); shakeFrames = 6; burst(ball.x, h, '#ef4444', 8); endGame(); return; }

    const spd = curSpeed();
    for (let i = pipes.length - 1; i >= 0; i--) {
        const p = pipes[i];
        p.x -= spd * dt;
        if (!p.passed && p.x + PIPE_W < ball.x) {
            p.passed = true; score++;
            popEl(spScore); popEl(scoreDisplay);
            flashScreen('pass'); burst(ball.x, ball.y, '#0059ff', 6);
            // Milestone flashes
            if (score === 10) showFlash('🔥 10!', '#f97316');
            else if (score === 20) showFlash('⚡ 20!', '#0059ff');
            else if (score === 30) showFlash('🌊 30!', '#06b6d4');
            else if (score % 10 === 0) showFlash('💧 ' + score + '!', '#0059ff');
            updateHUD();
        }
        const bx = ball.x, by = ball.y, br = BALL_R;
        if (bx + br > p.x && bx - br < p.x + PIPE_W) {
            if (by - br < p.topH || by + br > p.botY) {
                shakeFrames = 10; flashScreen('hit'); burst(ball.x, ball.y, '#ef4444', 14); endGame(); return;
            }
        }
        if (p.x + PIPE_W < 0) pipes.splice(i, 1);
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]; p.x += p.vx*dt; p.y += p.vy*dt; p.vy += 0.15*dt; p.alpha -= 0.045*dt;
        if (p.alpha <= 0) particles.splice(i, 1);
    }
    bgClouds.forEach(c => { c.x -= c.speed*dt; if (c.x+c.rx < 0) c.x = W()+c.rx; });
}

// ══════════════════════════════════════════════
//  RENDER — clean, NO level text
// ══════════════════════════════════════════════
function render(ts) {
    const w = W(), h = H(), t = ts / 1000;
    ctx.save();
    if (shakeFrames > 0) { const s = Math.min(shakeFrames,4)*1.3; ctx.translate((Math.random()-0.5)*s,(Math.random()-0.5)*s); }

    const sky = ctx.createLinearGradient(0,0,0,h);
    sky.addColorStop(0,'#ddeeff'); sky.addColorStop(0.45,'#eaf3ff'); sky.addColorStop(1,'#f5f9ff');
    ctx.fillStyle = sky; ctx.fillRect(0,0,w,h);

    bgClouds.forEach(c => { ctx.save(); ctx.globalAlpha=c.alpha; ctx.fillStyle='#fff'; ctx.beginPath(); ctx.ellipse(c.x,c.y,c.rx,c.ry,0,0,Math.PI*2); ctx.fill(); ctx.restore(); });

    const gnd = ctx.createLinearGradient(0,h-30,0,h);
    gnd.addColorStop(0,'rgba(0,89,255,0.06)'); gnd.addColorStop(1,'rgba(0,89,255,0.14)');
    ctx.fillStyle=gnd; ctx.fillRect(0,h-30,w,30);

    drawPipes(h);

    particles.forEach(p => { ctx.save(); ctx.globalAlpha=Math.max(0,p.alpha); ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fillStyle=p.color; ctx.shadowColor=p.color; ctx.shadowBlur=8; ctx.fill(); ctx.restore(); });

    drawBall(t);
    ctx.restore();
}

function drawPipes(h) {
    pipes.forEach(p => {
        const px=p.x, pw=PIPE_W;
        const gt=ctx.createLinearGradient(px,0,px+pw,0);
        gt.addColorStop(0,'#1d4ed8'); gt.addColorStop(0.35,'#2563eb'); gt.addColorStop(0.7,'#3b82f6'); gt.addColorStop(1,'#1e40af');
        ctx.fillStyle=gt; rr(px,0,pw,p.topH,[0,0,6,6]); ctx.fill();
        ctx.fillStyle='#60a5fa'; rr(px-5,p.topH-20,pw+10,20,[0,0,6,6]); ctx.fill();
        ctx.fillStyle='rgba(255,255,255,0.13)'; ctx.fillRect(px+7,0,10,p.topH-20);

        const gb=ctx.createLinearGradient(px,0,px+pw,0);
        gb.addColorStop(0,'#1d4ed8'); gb.addColorStop(0.35,'#2563eb'); gb.addColorStop(0.7,'#3b82f6'); gb.addColorStop(1,'#1e40af');
        ctx.fillStyle=gb; rr(px,p.botY,pw,h-p.botY,[6,6,0,0]); ctx.fill();
        ctx.fillStyle='#60a5fa'; rr(px-5,p.botY,pw+10,20,[6,6,0,0]); ctx.fill();
        ctx.fillStyle='rgba(255,255,255,0.13)'; ctx.fillRect(px+7,p.botY+20,10,h-p.botY-20);
    });
}

function drawBall(t) {
    const x=ball.x, y=ball.y, r=BALL_R;
    ctx.save();
    ctx.shadowColor='rgba(0,89,255,0.35)'; ctx.shadowBlur=14+Math.sin(t*3)*4;
    const g=ctx.createRadialGradient(x-r*0.3,y-r*0.3,1,x,y,r);
    g.addColorStop(0,'#93c5fd'); g.addColorStop(0.5,'#3b82f6'); g.addColorStop(1,'#1d4ed8');
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
    ctx.shadowBlur=0;
    ctx.beginPath(); ctx.arc(x-r*0.3,y-r*0.32,r*0.32,0,Math.PI*2); ctx.fillStyle='rgba(255,255,255,0.42)'; ctx.fill();
    const ta=Math.min(0.25,Math.abs(ball.vy)*0.02);
    if(ta>0.03){ctx.beginPath();ctx.arc(x,y+(ball.vy>0?-r:r),r*0.7,0,Math.PI*2);ctx.fillStyle=`rgba(59,130,246,${ta})`;ctx.fill();}
    ctx.restore();
}

function rr(x,y,w,h,radii) {
    const [tl=0,tr=0,br=0,bl=0]=Array.isArray(radii)?radii:[radii,radii,radii,radii];
    ctx.beginPath(); ctx.moveTo(x+tl,y); ctx.lineTo(x+w-tr,y);
    ctx.quadraticCurveTo(x+w,y,x+w,y+tr); ctx.lineTo(x+w,y+h-br);
    ctx.quadraticCurveTo(x+w,y+h,x+w-br,y+h); ctx.lineTo(x+bl,y+h);
    ctx.quadraticCurveTo(x,y+h,x,y+h-bl); ctx.lineTo(x,y+tl);
    ctx.quadraticCurveTo(x,y,x+tl,y); ctx.closePath();
}

// ══════════════════════════════════════════════
//  IDLE DRAW
// ══════════════════════════════════════════════
(function idleDraw() {
    if (gameState !== 'start') return;
    const w=W(),h=H();
    const sky=ctx.createLinearGradient(0,0,0,h);
    sky.addColorStop(0,'#ddeeff'); sky.addColorStop(1,'#f5f9ff');
    ctx.fillStyle=sky; ctx.fillRect(0,0,w,h);
    bgClouds.forEach(c=>{c.x-=c.speed*0.4;if(c.x+c.rx<0)c.x=w+c.rx;ctx.save();ctx.globalAlpha=c.alpha;ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(c.x,c.y,c.rx,c.ry,0,0,Math.PI*2);ctx.fill();ctx.restore();});
    requestAnimationFrame(idleDraw);
})();

// ══════════════════════════════════════════════
//  QUOTES
// ══════════════════════════════════════════════
const quotes = [
    { text: '"No one is afraid of water drops. But everyone is afraid of the ocean."', cite: '— President of AIPC' },
    { text: '"The ocean is nothing but water drops united."', cite: '— AIPC' },
    { text: '"When hearts change, systems change."', cite: '— AIPC Mission' },
    { text: '"Strength is not domination — it is collaboration."', cite: '— AIPC' },
    { text: '"Hope is the belief that progress is possible even when obstacles appear."', cite: '— AIPC' },
];
let qi = 0;
if (spQuote) setInterval(() => {
    qi = (qi+1)%quotes.length; spQuote.style.opacity='0';
    setTimeout(()=>{if(spQuote){spQuote.textContent=quotes[qi].text;spQuote.style.opacity='1';}if(spCite)spCite.textContent=quotes[qi].cite;},400);
}, 10000);

// ══════════════════════════════════════════════
//  INIT — load persisted stats
// ══════════════════════════════════════════════
best = parseInt(localStorage.getItem(SAVE_BEST) || '0');
totalGames = parseInt(localStorage.getItem(SAVE_GAMES) || '0');
bestTime = parseInt(localStorage.getItem(SAVE_BTIME) || '0');
if (bestDisplay) bestDisplay.textContent = best;
if (spBest) spBest.textContent = best;
if (best > 0 && startBest) startBest.textContent = '🏆 Best: ' + best;
updateHUD();