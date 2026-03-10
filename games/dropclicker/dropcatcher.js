// ═══════════════════════════════════════════════════════
//  DROPS OF CHANGE — AIPC Arcade Game
//  Catch blue drops, dodge red bombs, grab golden drops
// ═══════════════════════════════════════════════════════

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
const wrap   = document.getElementById('arenaWrap');

const scoreEl    = document.getElementById('scoreDisplay');
const bestEl     = document.getElementById('bestDisplay');
const levelEl    = document.getElementById('levelBadge');
const heartsEl   = document.getElementById('heartsDisplay');
const startScr   = document.getElementById('startScreen');
const overScr    = document.getElementById('gameOverScreen');
const pauseScr   = document.getElementById('pauseScreen');
const comboFlash = document.getElementById('comboFlash');
const startBtn   = document.getElementById('startBtn');
const retryBtn   = document.getElementById('retryBtn');
const resumeBtn  = document.getElementById('resumeBtn');
const startBest  = document.getElementById('startBest');

const SAVE_KEY = 'aipc_dropsofchange_best';
const MAX_LIVES = 3, CATCHER_H = 16, BASE_SPEED = 2.4, SPEED_INC = 0.3;
const SPAWN_BASE = 1300, SPAWN_MIN = 350, GOLD_CHANCE = 0.07, COMBO_THRESH = 5;
const LEVEL_REQS = [0, 0, 150, 350, 600, 900, 1300, 1800, 2500, 3400, 4600];

let gameState = 'start', score = 0, best = parseInt(localStorage.getItem(SAVE_KEY)||'0');
let lives = MAX_LIVES, level = 1, dropsCaught = 0, combo = 0, maxCombo = 0;
let drops = [], particles = [], catcherX = 0, catcherW = 100;
let spawnTimer = 0, lastTime = 0, animId = null, shakeFrames = 0;
let bgStars = [], dpr = window.devicePixelRatio || 1;

function resize() {
    const r = wrap.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    canvas.width = r.width * dpr; canvas.height = r.height * dpr;
    canvas.style.width = r.width + 'px'; canvas.style.height = r.height + 'px';
    ctx.setTransform(1,0,0,1,0,0); ctx.scale(dpr, dpr);
    catcherW = Math.min(Math.max(r.width * 0.24, 72), 120);
    if (catcherX === 0) catcherX = r.width / 2;
    buildStars(r.width, r.height);
}
window.addEventListener('resize', resize); resize();
function W() { return canvas.width / dpr; }
function H() { return canvas.height / dpr; }

function buildStars(w, h) {
    bgStars = Array.from({ length: 55 }, () => ({
        x: Math.random()*w, y: Math.random()*h, r: Math.random()*1.1+0.3,
        a: Math.random()*0.35+0.08, phase: Math.random()*Math.PI*2, speed: Math.random()*0.018+0.006
    }));
}

function getArenaX(cx) { return cx - wrap.getBoundingClientRect().left; }
wrap.addEventListener('mousemove', e => { if (gameState==='playing') catcherX = getArenaX(e.clientX); });
wrap.addEventListener('touchmove', e => { if (gameState==='playing') { e.preventDefault(); catcherX = getArenaX(e.touches[0].clientX); } }, { passive: false });
wrap.addEventListener('touchstart', e => { if (gameState==='playing') { e.preventDefault(); catcherX = getArenaX(e.touches[0].clientX); } }, { passive: false });
document.addEventListener('keydown', e => {
    if (e.key==='Escape'||e.key==='p'||e.key==='P') {
        if (gameState==='playing') pauseGame(); else if (gameState==='paused') resumeGame();
    }
});

startBtn.addEventListener('click', startGame);
retryBtn.addEventListener('click', startGame);
resumeBtn.addEventListener('click', resumeGame);

function startGame() {
    score=0; lives=MAX_LIVES; level=1; dropsCaught=0; combo=0; maxCombo=0;
    drops=[]; particles=[]; spawnTimer=0; lastTime=0;
    catcherX=W()/2; shakeFrames=0;
    hideAll(); gameState='playing'; updateHUD();
    if (animId) cancelAnimationFrame(animId);
    animId = requestAnimationFrame(loop);
}
function pauseGame() { gameState='paused'; pauseScr.classList.remove('hidden'); }
function resumeGame() { gameState='playing'; pauseScr.classList.add('hidden'); lastTime=0; animId=requestAnimationFrame(loop); }

function endGame() {
    gameState='over'; cancelAnimationFrame(animId);
    const nb = score > best; if (nb) { best=score; localStorage.setItem(SAVE_KEY, best); }
    document.getElementById('finalScore').textContent=score;
    document.getElementById('finalBest').textContent=best;
    document.getElementById('finalLevel').textContent=level;
    document.getElementById('finalDrops').textContent=dropsCaught;
    document.getElementById('newBestBanner').classList.toggle('hidden', !nb);
    overScr.classList.remove('hidden'); updateHUD();
    if (window.sidePanel && window.sidePanel.onGameEnd) window.sidePanel.onGameEnd(score, dropsCaught, maxCombo, level);
}
function hideAll() { startScr.classList.add('hidden'); overScr.classList.add('hidden'); pauseScr.classList.add('hidden'); }

function spawnInterval() { return Math.max(SPAWN_MIN, SPAWN_BASE-(level-1)*100); }
function spawnDrop() {
    const w=W(), m=28, x=m+Math.random()*(w-m*2);
    const spd=(BASE_SPEED+(level-1)*SPEED_INC)*(0.82+Math.random()*0.36);
    const r=Math.random(), bc=Math.min(0.5,0.18+(level-1)*0.034);
    const type=r<GOLD_CHANCE?'gold':r<GOLD_CHANCE+bc?'bomb':'drop';
    const sz=type==='bomb'?14+Math.random()*7:type==='gold'?12+Math.random()*6:11+Math.random()*9;
    drops.push({x,y:-sz*2,vy:spd,size:sz,type,wobble:Math.random()*Math.PI*2,wobbleAmp:0.5+Math.random()*0.9,rot:0,rotSpd:(Math.random()-0.5)*0.1});
}
function checkLevel() {
    for (let i=LEVEL_REQS.length-1;i>=2;i--) {
        if (score>=LEVEL_REQS[i]&&level<i) {
            level=i; levelEl.textContent='LEVEL '+level;
            levelEl.classList.add('level-up'); setTimeout(()=>levelEl.classList.remove('level-up'),700);
            if(window.sidePanel&&window.sidePanel.onLevelUp)window.sidePanel.onLevelUp(level);
            showCombo('LEVEL '+level+' ⚡','#60a5fa'); return;
        }
    }
}
function burst(x,y,type) {
    const c=type==='gold'?'#fbbf24':type==='bomb'?'#ef4444':'#60a5fa', n=type==='bomb'?16:8;
    for(let i=0;i<n;i++){const a=(Math.PI*2/n)*i+Math.random()*0.5,s=2.5+Math.random()*4;
    particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-1.5,size:3+Math.random()*4,color:c,alpha:1,life:1});}
}
let comboTO;
function showCombo(t,c='#fbbf24'){comboFlash.textContent=t;comboFlash.style.color=c;comboFlash.classList.remove('hidden');comboFlash.style.animation='none';void comboFlash.offsetWidth;comboFlash.style.animation='comboAnim 0.75s ease forwards';clearTimeout(comboTO);comboTO=setTimeout(()=>comboFlash.classList.add('hidden'),750);}
function flashScreen(t){wrap.classList.remove('flash-red','flash-blue');void wrap.offsetWidth;wrap.classList.add(t==='bomb'?'flash-red':'flash-blue');setTimeout(()=>wrap.classList.remove('flash-red','flash-blue'),300);}
function updateHUD(){scoreEl.textContent=score;bestEl.textContent=Math.max(score,best);levelEl.textContent='LEVEL '+level;heartsEl.querySelectorAll('.heart').forEach((h,i)=>h.classList.toggle('lost',i>=lives));if(window.sidePanel&&window.sidePanel.updateLive)window.sidePanel.updateLive(score,Math.max(score,best),lives,level);}
function popScore(){scoreEl.classList.add('pop');setTimeout(()=>scoreEl.classList.remove('pop'),110);}

function loop(ts){
    if(gameState!=='playing')return;
    const dt=lastTime?Math.min((ts-lastTime)/16.67,3):1; lastTime=ts;
    spawnTimer+=dt*16.67;
    if(spawnTimer>=spawnInterval()){spawnTimer=0;spawnDrop();if(level>=5&&Math.random()<0.28)spawnDrop();if(level>=8&&Math.random()<0.22)spawnDrop();}
    tick(dt);checkLevel();if(shakeFrames>0)shakeFrames-=dt;render();animId=requestAnimationFrame(loop);
}

function tick(dt){
    const cy=H()-38-CATCHER_H/2,hw=catcherW/2,cx=Math.max(hw,Math.min(W()-hw,catcherX));
    for(let i=drops.length-1;i>=0;i--){
        const d=drops[i]; d.y+=d.vy*dt; d.wobble+=0.045*dt; if(d.type==='bomb')d.rot+=d.rotSpd*dt;
        const hx=d.x>=cx-hw-d.size*0.5&&d.x<=cx+hw+d.size*0.5;
        const hy=d.y+d.size>=cy-CATCHER_H/2&&d.y-d.size<=cy+CATCHER_H/2;
        if(hx&&hy){
            burst(d.x,d.y,d.type);drops.splice(i,1);
            if(d.type==='bomb'){lives--;combo=0;shakeFrames=9;flashScreen('bomb');updateHUD();if(lives<=0){endGame();return;}}
            else{combo++;if(combo>maxCombo)maxCombo=combo;const pts=d.type==='gold'?25:10;const mult=combo>=COMBO_THRESH?Math.floor(combo/COMBO_THRESH)+1:1;
            score+=pts*mult;dropsCaught++;popScore();flashScreen('drop');
            if(d.type==='gold')showCombo('✨ ×'+mult+' GOLDEN!','#fbbf24');
            else if(combo>=COMBO_THRESH&&combo%COMBO_THRESH===0)showCombo('🔥 ×'+mult+' COMBO!','#f97316');
            updateHUD();if(window.sidePanel&&window.sidePanel.onCatch)window.sidePanel.onCatch(dropsCaught,maxCombo,level);}
            continue;
        }
        if(d.y-d.size>H()){if(d.type==='drop'){lives--;combo=0;shakeFrames=5;flashScreen('bomb');updateHUD();if(lives<=0){endGame();return;}}drops.splice(i,1);}
    }
    for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=0.2*dt;p.alpha-=0.045*dt;if(p.alpha<=0)particles.splice(i,1);}
}

function render(){
    const w=W(),h=H(),t=performance.now()/1000;ctx.save();
    if(shakeFrames>0){const s=Math.min(shakeFrames,4)*1.2;ctx.translate((Math.random()-0.5)*s,(Math.random()-0.5)*s);}
    const bg=ctx.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#060c1a');bg.addColorStop(0.65,'#091525');bg.addColorStop(1,'#0d1f3c');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    bgStars.forEach(s=>{const a=s.a+Math.sin(t*s.speed*60+s.phase)*0.12;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fillStyle=`rgba(255,255,255,${Math.max(0,a)})`;ctx.fill();});
    const fg=ctx.createLinearGradient(0,h-70,0,h);fg.addColorStop(0,'rgba(29,78,216,0)');fg.addColorStop(1,'rgba(29,78,216,0.2)');ctx.fillStyle=fg;ctx.fillRect(0,h-70,w,70);
    drops.forEach(d=>renderDrop(d,t));
    particles.forEach(p=>{ctx.save();ctx.globalAlpha=Math.max(0,p.alpha);ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fillStyle=p.color;ctx.shadowColor=p.color;ctx.shadowBlur=8;ctx.fill();ctx.restore();});
    renderCatcher(w,h);ctx.restore();
}

function renderDrop(d,t){
    ctx.save();ctx.translate(d.x+Math.sin(d.wobble)*d.wobbleAmp,d.y);
    if(d.type==='bomb'){ctx.rotate(d.rot);ctx.shadowColor='#ef4444';ctx.shadowBlur=14+Math.sin(t*6+d.wobble)*6;ctx.beginPath();ctx.arc(0,0,d.size,0,Math.PI*2);const bg=ctx.createRadialGradient(-d.size*0.3,-d.size*0.3,1,0,0,d.size);bg.addColorStop(0,'#ff7070');bg.addColorStop(0.5,'#ef4444');bg.addColorStop(1,'#7f1d1d');ctx.fillStyle=bg;ctx.fill();ctx.shadowBlur=0;ctx.font=`${d.size*1.05}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='white';ctx.fillText('💣',0,1);}
    else if(d.type==='gold'){ctx.shadowColor='#fbbf24';ctx.shadowBlur=18+Math.sin(t*4+d.wobble)*7;teardrop(d.size,'#fff9c4','#fbbf24','#78350f');ctx.shadowBlur=0;ctx.font=`${d.size*1.1}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('✨',0,2);}
    else{ctx.shadowColor='#3b82f6';ctx.shadowBlur=10+Math.sin(t*3+d.wobble)*4;teardrop(d.size,'#bfdbfe','#3b82f6','#1e3a8a');ctx.shadowBlur=0;ctx.beginPath();ctx.ellipse(-d.size*0.22,-d.size*0.28,d.size*0.18,d.size*0.28,-0.4,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,0.32)';ctx.fill();}
    ctx.restore();
}
function teardrop(sz,top,mid,bot){ctx.beginPath();ctx.moveTo(0,-sz);ctx.bezierCurveTo(sz*0.88,-sz*0.18,sz,sz*0.5,0,sz);ctx.bezierCurveTo(-sz,sz*0.5,-sz*0.88,-sz*0.18,0,-sz);ctx.closePath();const g=ctx.createLinearGradient(0,-sz,0,sz);g.addColorStop(0,top);g.addColorStop(0.5,mid);g.addColorStop(1,bot);ctx.fillStyle=g;ctx.fill();}

function renderCatcher(w,h){
    const cy=h-38,hw=catcherW/2,cx=Math.max(hw+2,Math.min(w-hw-2,catcherX));
    const pool=ctx.createRadialGradient(cx,cy+12,4,cx,cy+12,catcherW*0.75);pool.addColorStop(0,'rgba(59,130,246,0.28)');pool.addColorStop(1,'rgba(59,130,246,0)');ctx.fillStyle=pool;ctx.fillRect(cx-catcherW,cy-8,catcherW*2,55);
    ctx.beginPath();ctx.moveTo(cx-hw,cy-CATCHER_H/2);ctx.lineTo(cx+hw,cy-CATCHER_H/2);ctx.lineTo(cx+hw*0.82,cy+CATCHER_H/2);ctx.lineTo(cx-hw*0.82,cy+CATCHER_H/2);ctx.closePath();
    const cg=ctx.createLinearGradient(cx,cy-CATCHER_H,cx,cy+CATCHER_H);cg.addColorStop(0,'#60a5fa');cg.addColorStop(1,'#1d4ed8');ctx.fillStyle=cg;ctx.shadowColor='#3b82f6';ctx.shadowBlur=18;ctx.fill();
    ctx.beginPath();ctx.moveTo(cx-hw,cy-CATCHER_H/2);ctx.lineTo(cx+hw,cy-CATCHER_H/2);ctx.strokeStyle='#bfdbfe';ctx.lineWidth=2;ctx.shadowColor='#bfdbfe';ctx.shadowBlur=8;ctx.stroke();
    ctx.shadowBlur=0;ctx.beginPath();ctx.moveTo(cx-hw*0.72,cy+1);ctx.bezierCurveTo(cx-hw*0.35,cy-4,cx+hw*0.35,cy-4,cx+hw*0.72,cy+1);ctx.lineTo(cx+hw*0.82,cy+CATCHER_H/2);ctx.lineTo(cx-hw*0.82,cy+CATCHER_H/2);ctx.closePath();ctx.fillStyle='rgba(147,197,253,0.3)';ctx.fill();
}

best=parseInt(localStorage.getItem(SAVE_KEY)||'0');bestEl.textContent=best;
if(best>0)startBest.textContent='🏆 Best: '+best;
updateHUD();

(function idleDraw(){
    if(gameState!=='start')return;
    const w=W(),h=H(),t=performance.now()/1000;
    const bg=ctx.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#060c1a');bg.addColorStop(1,'#0d1f3c');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    bgStars.forEach(s=>{const a=s.a+Math.sin(t*s.speed*60+s.phase)*0.1;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fillStyle=`rgba(255,255,255,${Math.max(0,a)})`;ctx.fill();});
    requestAnimationFrame(idleDraw);
})();