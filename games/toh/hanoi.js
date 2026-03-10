// ═══════════════════════════════════════════════════════
//  Tower of Unity — AIPC Tower of Hanoi
//  Beautiful hero + big board + timer + 2-8 discs
// ═══════════════════════════════════════════════════════

(function () {
    let numDiscs = 3;
    let numPegs = 3;
    let pegs = [];
    let moves = 0;
    let selectedPeg = null;
    let gameWon = false;

    // Timer
    let timerInterval = null;
    let startTime = null;
    let elapsed = 0;

    const MAX_DISCS = 8;
    const MIN_DISCS = 2;

    // DOM
    const board       = document.getElementById('board');
    const moveCountEl = document.getElementById('moveCount');
    const minMovesEl  = document.getElementById('minMoves');
    const timerEl     = document.getElementById('timerDisplay');
    const discCountEl = document.getElementById('discCount');
    const pegCountEl  = document.getElementById('pegCount');
    const winOverlay  = document.getElementById('winOverlay');
    const winMessage  = document.getElementById('winMessage');
    const winStarsEl  = document.getElementById('winStars');
    const hintBar     = document.getElementById('hintBar');

    // Buttons
    document.getElementById('discMinus').addEventListener('click', () => changeDiscs(-1));
    document.getElementById('discPlus').addEventListener('click',  () => changeDiscs(1));
    document.getElementById('pegMinus').addEventListener('click',  () => changePegs(-1));
    document.getElementById('pegPlus').addEventListener('click',   () => changePegs(1));
    document.getElementById('resetBtn').addEventListener('click',  resetGame);
    document.getElementById('playAgainBtn').addEventListener('click', () => {
        winOverlay.classList.remove('show');
        resetGame();
    });

    // Timer helpers
    function fmtTime(s) {
        const m = Math.floor(s / 60);
        const sc = s % 60;
        return m + ':' + (sc < 10 ? '0' : '') + sc;
    }
    function startTimer() {
        stopTimer();
        startTime = Date.now();
        elapsed = 0;
        timerEl.textContent = '0:00';
        timerInterval = setInterval(() => {
            elapsed = Math.floor((Date.now() - startTime) / 1000);
            timerEl.textContent = fmtTime(elapsed);
        }, 500);
    }
    function stopTimer() {
        if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    }

    // Responsive
    function getMaxPegs() { return window.innerWidth <= 600 ? 3 : 5; }

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const mx = getMaxPegs();
            if (numPegs > mx) { numPegs = mx; pegCountEl.textContent = numPegs; resetGame(); return; }
            renderBoard();
        }, 200);
    });

    function changeDiscs(d) {
        const n = numDiscs + d;
        if (n < MIN_DISCS || n > MAX_DISCS) return;
        numDiscs = n; discCountEl.textContent = numDiscs; resetGame();
    }
    function changePegs(d) {
        const n = numPegs + d;
        if (n < 3 || n > getMaxPegs()) return;
        numPegs = n; pegCountEl.textContent = numPegs; resetGame();
    }

    // Min-moves (memoized)
    const memo = {};
    function calcMin(n, p) {
        if (p < 3 || n <= 0) return 0;
        if (n === 1) return 1;
        if (p === 3) return Math.pow(2, n) - 1;
        const k = n + ',' + p;
        if (memo[k] !== undefined) return memo[k];
        let best = Infinity;
        for (let t = 1; t < n; t++) {
            const v = 2 * calcMin(t, p) + calcMin(n - t, p - 1);
            if (v < best) best = v;
        }
        return memo[k] = best;
    }

    function pegLabel(i, total) {
        if (i === 0) return 'Start';
        if (i === total - 1) return 'Goal';
        return 'Aux';
    }

    // Reset
    function resetGame() {
        pegs = [];
        for (let i = 0; i < numPegs; i++) pegs.push([]);
        for (let d = numDiscs; d >= 1; d--) pegs[0].push(d);

        moves = 0; selectedPeg = null; gameWon = false;
        moveCountEl.textContent = '0';
        minMovesEl.textContent = calcMin(numDiscs, numPegs);
        stopTimer(); timerEl.textContent = '0:00';
        hintBar.classList.remove('hidden');
        renderBoard();
    }

    // Render
    function renderBoard() {
        board.innerHTML = '';

        // Calculate disc height to fill available space nicely
        // Board min-height is set via CSS; we use it to calc
        const boardH = board.clientHeight || 400;
        const labelSpace = 40; // base + label below
        const usable = boardH - labelSpace;
        const maxH = Math.min(44, Math.max(24, Math.floor(usable / (numDiscs + 0.5))));
        const gap = Math.max(2, Math.min(4, Math.round(maxH * 0.09)));
        const rodH = numDiscs * (maxH + gap) + 14;

        for (let i = 0; i < numPegs; i++) {
            const zone = document.createElement('div');
            zone.className = 'peg-zone' + (selectedPeg === i ? ' selected' : '');

            // Rod
            const rod = document.createElement('div');
            rod.className = 'peg-rod';
            rod.style.height = rodH + 'px';
            zone.appendChild(rod);

            // Disc stack
            const stack = document.createElement('div');
            stack.className = 'disc-stack';
            stack.style.minHeight = rodH + 'px';
            stack.style.gap = gap + 'px';

            pegs[i].forEach((size, si) => {
                const disc = document.createElement('div');
                disc.className = 'disc';
                disc.dataset.size = size;
                disc.style.height = maxH + 'px';
                disc.style.fontSize = Math.max(10, maxH * 0.38) + 'px';
                disc.style.borderRadius = Math.max(5, maxH * 0.22) + 'px';

                const pct = 28 + (size / numDiscs) * 66;
                disc.style.width = pct + '%';
                disc.textContent = size;

                if (selectedPeg === i && si === pegs[i].length - 1) {
                    disc.classList.add('lifting');
                }
                stack.appendChild(disc);
            });

            zone.appendChild(stack);

            // Base
            const base = document.createElement('div');
            base.className = 'peg-base';
            zone.appendChild(base);

            // Label — BELOW base, black text
            const lbl = document.createElement('div');
            lbl.className = 'peg-label';
            lbl.textContent = pegLabel(i, numPegs);
            zone.appendChild(lbl);

            zone.addEventListener('click', () => handleClick(i));
            board.appendChild(zone);
        }
    }

    // Click
    function handleClick(idx) {
        if (gameWon) return;

        if (selectedPeg === null) {
            if (pegs[idx].length === 0) return;
            selectedPeg = idx;
            renderBoard();
            return;
        }
        if (selectedPeg === idx) {
            selectedPeg = null;
            renderBoard();
            return;
        }

        const from = pegs[selectedPeg];
        const to = pegs[idx];
        const disc = from[from.length - 1];

        if (to.length > 0 && to[to.length - 1] < disc) {
            selectedPeg = null;
            renderBoard();
            const tz = board.children[idx];
            if (tz) {
                const td = tz.querySelector('.disc:last-child');
                if (td) {
                    td.classList.add('invalid-shake');
                    setTimeout(() => td.classList.remove('invalid-shake'), 350);
                }
            }
            return;
        }

        to.push(from.pop());
        moves++;
        moveCountEl.textContent = moves;
        selectedPeg = null;

        if (moves === 1) { startTimer(); hintBar.classList.add('hidden'); }

        renderBoard();
        checkWin();
    }

    // Win
    function checkWin() {
        if (pegs[numPegs - 1].length !== numDiscs) return;
        gameWon = true;
        stopTimer();

        const minM = calcMin(numDiscs, numPegs);
        const ratio = moves / minM;

        let stars;
        if (ratio <= 1)       stars = '★★★';
        else if (ratio <= 1.3) stars = '★★☆';
        else if (ratio <= 1.8) stars = '★☆☆';
        else                   stars = '☆☆☆';

        winStarsEl.textContent = stars;
        winMessage.textContent = moves + ' moves · Target ' + minM + ' · ' + fmtTime(elapsed);
        setTimeout(() => winOverlay.classList.add('show'), 400);
    }

    // Init
    if (window.innerWidth <= 600) numPegs = 3;
    pegCountEl.textContent = numPegs;
    discCountEl.textContent = numDiscs;
    resetGame();
})();