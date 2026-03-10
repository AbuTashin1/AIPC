// ═══════════════════════════════════════════════════════
//  Side Panels — Drops of Change
//  Left: live score/best/lives (big numbers)
//  Right: session stats + rotating quotes
// ═══════════════════════════════════════════════════════

(function () {
    if (window.innerWidth <= 600) return;

    // Left panel refs
    const spScore  = document.getElementById('spScore');
    const spBest   = document.getElementById('spBest');
    const spHearts = document.getElementById('spHearts');
    const spLevel  = document.getElementById('spLevel');

    // Right panel refs
    const spGames  = document.getElementById('spGames');
    const spDrops  = document.getElementById('spDrops');
    const spCombo  = document.getElementById('spCombo');
    const spHighLvl = document.getElementById('spHighLvl');
    const spQuote  = document.getElementById('spQuote');
    const spCite   = document.getElementById('spCite');

    const session = { games: 0, drops: 0, bestCombo: 0, highLevel: 1 };

    function updateSession() {
        if (spGames) spGames.textContent = session.games;
        if (spDrops) spDrops.textContent = session.drops;
        if (spCombo) spCombo.textContent = session.bestCombo;
        if (spHighLvl) spHighLvl.textContent = session.highLevel;
    }

    function popNum(el) {
        if (!el) return;
        el.classList.add('pop');
        setTimeout(() => el.classList.remove('pop'), 150);
    }

    window.sidePanel = {
        updateLive: function (score, best, lives, level) {
            if (spScore) { spScore.textContent = score; popNum(spScore); }
            if (spBest) spBest.textContent = best;
            if (spLevel) spLevel.textContent = 'LEVEL ' + level;

            // Update hearts
            if (spHearts) {
                const hearts = spHearts.querySelectorAll('.sp-heart');
                hearts.forEach((h, i) => h.classList.toggle('lost', i >= lives));
            }
        },
        onCatch: function (totalDrops, combo, level) {
            session.drops = totalDrops;
            if (combo > session.bestCombo) session.bestCombo = combo;
            if (level > session.highLevel) session.highLevel = level;
            updateSession();
        },
        onGameEnd: function (score, drops, combo, level) {
            session.games++;
            session.drops += drops;
            if (combo > session.bestCombo) session.bestCombo = combo;
            if (level > session.highLevel) session.highLevel = level;
            updateSession();
        },
        onLevelUp: function (level) {
            if (spLevel) {
                spLevel.textContent = 'LEVEL ' + level;
                spLevel.classList.add('level-up');
                setTimeout(() => spLevel.classList.remove('level-up'), 700);
            }
        }
    };

    // Rotating quotes
    const quotes = [
        { text: '"No one is afraid of water drops. But everyone is afraid of the ocean."', cite: '— President of AIPC' },
        { text: '"The ocean is nothing but water drops united."', cite: '— AIPC' },
        { text: '"When hearts change, systems change."', cite: '— AIPC Mission' },
        { text: '"Strength is not domination — it is collaboration."', cite: '— AIPC' },
        { text: '"The strongest investment we can make is in the human mind."', cite: '— AIPC' },
    ];
    let qi = 0;
    setInterval(() => {
        qi = (qi + 1) % quotes.length;
        if (spQuote) {
            spQuote.style.opacity = '0';
            setTimeout(() => {
                spQuote.textContent = quotes[qi].text;
                if (spCite) spCite.textContent = quotes[qi].cite;
                spQuote.style.opacity = '1';
            }, 400);
        }
    }, 10000);

    updateSession();
})();