const gameData = {
    day: 1,
    maxDays: 30,
    mana: 100,
    supplies: 50,
    fragments: 0,
    wallHealth: 100,
    guardStrength: 40,
    isGameOver: false,
    isBusy: false,
    victory: false
};

const logElement = document.getElementById('game-log');
const sceneElement = document.getElementById('scene');
const guardSlots = document.querySelectorAll('.guard-slot');

// Уровень повреждения стен для картинки: 0 - целые, 3 - почти разрушены
function getWallDamageLevel(health) {
    if (health > 75) return 0;
    if (health > 50) return 1;
    if (health > 25) return 2;
    return 3;
}

// Сцена повторяет состояние игры: трещины по здоровью стен, стражники по силе
function updateScene() {
    sceneElement.dataset.damage = getWallDamageLevel(gameData.wallHealth);

    const guardCount = Math.min(guardSlots.length, 4 + Math.floor(gameData.guardStrength / 10));
    guardSlots.forEach((slot, i) => {
        slot.classList.toggle('hidden', i >= guardCount);
    });
}

// ===== Этап 3: анимации дневных действий =====
const fxTimers = {};

// Включает CSS-эффект на сцене (класс fx-*) и снимает его через time мс.
// Повторное нажатие перезапускает анимацию с начала.
function playSceneEffect(cls, time) {
    clearTimeout(fxTimers[cls]);
    sceneElement.classList.remove(cls);
    void sceneElement.getBoundingClientRect(); // заставляем браузер "забыть" прошлую анимацию
    sceneElement.classList.add(cls);
    fxTimers[cls] = setTimeout(() => sceneElement.classList.remove(cls), time);
}

// Всплывающая надпись над сценой (left/top в процентах)
function showFloatingText(text, kind, left, top) {
    const el = document.createElement('div');
    el.className = `float-fx float-${kind}`;
    el.textContent = text;
    el.style.left = left + '%';
    el.style.top = top + '%';
    el.addEventListener('animationend', () => el.remove());
    sceneElement.appendChild(el);
}

function playDayEffect(type, before) {
    switch (type) {
        case 'supply':
            playSceneEffect('fx-supply', 1700);
            showFloatingText('+20 провизии', 'supply', 24, 72);
            break;
        case 'fortify': {
            const gain = gameData.wallHealth - before.wall;
            playSceneEffect('fx-fortify', 1500);
            showFloatingText(gain > 0 ? `+${gain} стенам` : 'Стены целы', 'fortify', 50, 48);
            break;
        }
        case 'train':
            playSceneEffect('fx-train', 1700);
            showFloatingText('+10 силы стражи', 'train', 50, 66);
            break;
        case 'rest': {
            const gain = gameData.mana - before.mana;
            playSceneEffect('fx-rest', 1700);
            showFloatingText(gain > 0 ? `+${gain} маны` : 'Мана полна', 'rest', 50, 38);
            break;
        }
    }
}

function updateUI() {
    document.getElementById('day-count').innerText = Math.min(gameData.day, gameData.maxDays);
    const daysDone = Math.min(gameData.day, gameData.maxDays + 1) - 1;
    document.getElementById('day-progress-fill').style.width = (daysDone / gameData.maxDays * 100) + '%';
    document.getElementById('mana-count').innerText = gameData.mana;
    document.getElementById('supplies-count').innerText = gameData.supplies;
    document.getElementById('fragments-count').innerText = gameData.fragments;
    document.getElementById('wall-health').innerText = gameData.wallHealth;
    document.getElementById('guard-strength').innerText = gameData.guardStrength;

    if (gameData.wallHealth <= 0) {
        document.getElementById('wall-health').innerText = 0;
    }

    updateScene();
}

function logMessage(message) {
    const p = document.createElement('p');
    p.innerText = `> ${message}`;
    logElement.appendChild(p);
    logElement.scrollTop = logElement.scrollHeight;
}

// ===== Этап 4: анимации ночи =====
const SVG_NS = 'http://www.w3.org/2000/svg';
const enemiesLayer = document.getElementById('enemies');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const rand = (min, max) => min + Math.random() * (max - min);

function svgEl(name, attrs = {}) {
    const el = document.createElementNS(SVG_NS, name);
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
    return el;
}

function setActionsEnabled(enabled) {
    document.querySelectorAll('.action-btn').forEach(btn => { btn.disabled = !enabled; });
}

// Чем сильнее волна, тем больше врагов на сцене (от 2 до 8)
function getEnemyCount(power) {
    return Math.max(2, Math.min(8, Math.round(power / 12)));
}

// Облако дыма
function puff(x, y, color, size = 4) {
    const c = svgEl('circle', { cx: x, cy: y, r: size, fill: color });
    c.style.transformBox = 'fill-box';
    c.style.transformOrigin = 'center';
    enemiesLayer.appendChild(c);
    c.animate(
        [{ transform: 'scale(1)', opacity: .85 }, { transform: 'scale(4)', opacity: 0 }],
        { duration: 500, easing: 'ease-out', fill: 'forwards' }
    ).onfinish = () => c.remove();
}

// Враги выбегают с краёв сцены и занимают места у стен
function sendWave(power) {
    if (reduceMotion) return wait(300).then(() => []);

    const count = getEnemyCount(power);
    const enemies = [];
    for (let i = 0; i < count; i++) {
        const fromLeft = i % 2 === 0;
        const row = i >> 1;
        const x = fromLeft ? 230 + row * 28 : 570 - row * 28;
        const y = 304 + (row % 3) * 10;

        const g = svgEl('g');
        const body = svgEl('g', { class: 'enemy-body' });
        body.appendChild(svgEl('use', { href: '#enemy-shape' }));
        g.appendChild(body);
        enemiesLayer.appendChild(g);

        g.animate([
            { transform: `translate(${fromLeft ? -40 : 840}px, ${y}px)`, opacity: 0 },
            { transform: `translate(${x}px, ${y}px)`, opacity: 1 }
        ], { duration: 1300, delay: i * 90, easing: 'ease-out', fill: 'both' });

        enemies.push({ g, x, y });
    }
    return wait(1300 + (count - 1) * 90 + 150).then(() => enemies);
}

function dissolveEnemies(enemies, color) {
    enemies.forEach(e => {
        e.g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350, fill: 'forwards' });
        puff(e.x, e.y - 12, color, 5);
    });
}

function clearEnemies(enemies) {
    enemies.forEach(e => e.g.remove());
}

// Осколок материи летит к алтарю
function flyShard(fromX, fromY, delay) {
    const s = svgEl('polygon', {
        points: '0,-5 3.5,0 0,5 -3.5,0', fill: '#b88bff', stroke: '#efe3ff', 'stroke-width': .8
    });
    enemiesLayer.appendChild(s);
    s.animate([
        { transform: `translate(${fromX}px, ${fromY}px)`, opacity: 0 },
        { transform: `translate(${fromX}px, ${fromY - 14}px)`, opacity: 1, offset: .25 },
        { transform: 'translate(400px, 214px)', opacity: 0 }
    ], { duration: 900, delay, easing: 'ease-in', fill: 'both' }).onfinish = () => s.remove();
}

// Атака отбита: щит вспыхивает, кристалл бьёт молниями, враги рассыпаются
async function playDefense(enemies, onDone) {
    if (reduceMotion) { onDone(); return wait(300); }

    playSceneEffect('fx-defend', 1300);
    await wait(250);

    enemies.forEach((e, i) => {
        const bolt = svgEl('line', { x1: 400, y1: 200, x2: e.x, y2: e.y - 14, class: 'bolt' });
        bolt.style.animationDelay = `${i * 60}ms`;
        enemiesLayer.appendChild(bolt);
        setTimeout(() => bolt.remove(), 700 + i * 60);
    });
    await wait(300 + enemies.length * 60);

    dissolveEnemies(enemies, '#8a4dff');
    for (let i = 0; i < 5; i++) {
        const e = enemies[i % enemies.length];
        flyShard(e.x, e.y - 8, 350 + i * 80);
    }

    await wait(1250);
    playSceneEffect('fx-gain', 900);
    showFloatingText('+5 материи', 'fragments', 50, 40);
    onDone();
    await wait(900);
    clearEnemies(enemies);
}

// Обломки стены
function debris(x, y, dir) {
    const d = svgEl('rect', { x: -2, y: -2, width: rand(3, 5), height: rand(3, 5), fill: '#7a768a' });
    enemiesLayer.appendChild(d);
    const dx = dir * rand(10, 34);
    d.animate([
        { transform: `translate(${x}px, ${y}px)`, opacity: 1 },
        { transform: `translate(${x + dx}px, ${y - rand(15, 35)}px)`, opacity: 1, offset: .4 },
        { transform: `translate(${x + dx * 1.6}px, ${y + rand(15, 30)}px)`, opacity: 0 }
    ], { duration: 750, easing: 'ease-in', fill: 'forwards' }).onfinish = () => d.remove();
}

// Оборона прорвана: удар по стенам, тряска, красная вспышка, обломки
async function playBreach(enemies, damage, onImpact) {
    if (reduceMotion) { onImpact(); return wait(300); }

    playSceneEffect('fx-hit', 900);
    onImpact();
    showFloatingText(`-${damage} стенам`, 'damage', 50, 52);
    enemies.forEach(e => {
        const dir = e.x < 400 ? -1 : 1;
        for (let i = 0; i < 4; i++) debris(e.x, 288, dir);
    });

    await wait(450);
    dissolveEnemies(enemies, '#ff4d6d');
    await wait(900);
    clearEnemies(enemies);
}

// ===== Этап 5: финал игры =====
const endScreen = document.getElementById('end-screen');

async function showEnding(win) {
    // Сцена: победа - рассвет и лучи, поражение - разрушенный алтарь
    sceneElement.classList.add(win ? 'is-victory' : 'is-defeat');
    showFloatingText(win ? 'Победа!' : 'Алтарь пал', win ? 'day' : 'damage', 50, 30);
    await wait(reduceMotion ? 300 : 2200);

    const daysHeld = win ? gameData.maxDays : Math.max(0, gameData.day - 1);
    document.getElementById('end-title').innerText = win ? 'Победа!' : 'Алтарь пал';
    document.getElementById('end-text').innerText = win
        ? `Вы выстояли все ${gameData.maxDays} дней, и рассвет прогнал тьму Пустоты.`
        : 'Волна из Пустоты прорвала оборону и разрушила алтарь.';
    document.getElementById('end-stats').innerHTML = [
        ['Дней обороны', `${daysHeld} / ${gameData.maxDays}`],
        ['Материя', gameData.fragments],
        ['Сила стражи', gameData.guardStrength]
    ].map(([label, value]) => `<div class="stat"><span>${value}</span>${label}</div>`).join('');

    endScreen.classList.toggle('defeat', !win);
    endScreen.classList.add('visible');
    endScreen.setAttribute('aria-hidden', 'false');
}

const game = {
    handleAction(type) {
        if (gameData.isGameOver || gameData.victory || gameData.isBusy) return;

        // Пока идут день и ночь, новые действия недоступны
        gameData.isBusy = true;
        setActionsEnabled(false);

        let actionMessage = "";
        const before = { wall: gameData.wallHealth, mana: gameData.mana };

        switch(type) {
            case 'supply':
                gameData.supplies += 20;
                actionMessage = "Вы собрали дополнительные припасы (+20 Supplies).";
                break;
            case 'fortify':
                gameData.wallHealth = Math.min(100, gameData.wallHealth + 20);
                actionMessage = "Вы укрепили стены (+20 Wall Health).";
                break;
            case 'train':
                gameData.guardStrength += 10;
                actionMessage = "Стражники стали опытнее (+10 Guard Strength).";
                break;
            case 'rest':
                gameData.mana = Math.min(100, gameData.mana + 30);
                actionMessage = "Вы отдохнули и восстановили ману (+30 Mana).";
                break;
            default:
                actionMessage = "Вы потратили время впустую.";
        }

        logMessage(actionMessage);
        updateUI();
        playDayEffect(type, before);

        // После каждого действия запускается фаза ночи (ждём, пока доиграет анимация дня)
        setTimeout(() => this.nightPhase(), 1800);
    },

    async nightPhase() {
        if (gameData.isGameOver || gameData.victory) return;

        logMessage("--- Ночь наступила ---");
        sceneElement.classList.add('is-night');
        showFloatingText('Ночь', 'night', 50, 30);

        const enemyPower = 15 + (gameData.day * 2);
        
        // Потребление провизии (1 ед. на каждые 10 ед. силы стражи)
        const foodNeeded = Math.ceil(gameData.guardStrength / 10);
        if (gameData.supplies >= foodNeeded) {
            gameData.supplies -= foodNeeded;
            logMessage(`Стражники съели ${foodNeeded} ед. провизии.`);
        } else {
            const eaten = gameData.supplies;
            gameData.supplies = 0;
            const penalty = Math.ceil((foodNeeded - eaten) * 2);
            gameData.guardStrength = Math.max(0, gameData.guardStrength - penalty);
            logMessage(`Провизии не хватило! Стражники голодают. Сила упала на ${penalty}.`);
        }

        // Расход маны на щит (10% от силы волны)
        const manaCost = Math.floor(enemyPower * 0.1);
        if (gameData.mana >= manaCost) {
            gameData.mana -= manaCost;
            logMessage(`Магический щит поглотил часть удара (Затрачено маны: ${manaCost}).`);
        } else {
            const usedMana = gameData.mana;
            gameData.mana = 0;
            logMessage(`Мана почти иссякла! Щит слабеет.`);
        }

        const defense = gameData.wallHealth + gameData.guardStrength;

        logMessage(`Прибыла волна из Пустоты (Сила: ${enemyPower}). Ваша оборона: ${defense}`);

        // Враги подбегают к стенам
        const enemies = await sendWave(enemyPower);

        if (defense >= enemyPower) {
            logMessage("Вы успешно отразили атаку!");
            gameData.fragments += 5;
            logMessage("Вы нашли 5 фрагментов среди обломков.");
            await playDefense(enemies, updateUI);
        } else {
            const damage = enemyPower - defense;
            gameData.wallHealth -= damage;
            logMessage(`Стены повреждены! Получено урона: ${damage}`);

            if (gameData.wallHealth <= 0) {
                gameData.wallHealth = 0;
                gameData.isGameOver = true;
                logMessage("Ваш алтарь был разрушен. Игра окончена.");
            }
            await playBreach(enemies, damage, updateUI);
        }

        updateUI();
        sceneElement.classList.remove('is-night');

        if (!gameData.isGameOver && !gameData.victory) {
            gameData.day += 1;
            if (gameData.day > gameData.maxDays) {
                gameData.victory = true;
                logMessage("Вы выстояли все 30 дней! Вы победили!");
            } else {
                logMessage(`--- День ${gameData.day} --- Наступил новый день.`);
                showFloatingText(`День ${gameData.day}`, 'day', 50, 30);
            }
        }

        // Ночь закончилась: снова можно действовать (если игра не окончена)
        gameData.isBusy = false;
        setActionsEnabled(!gameData.isGameOver && !gameData.victory);

        if (gameData.isGameOver) await showEnding(false);
        else if (gameData.victory) await showEnding(true);
    }
};

// Инициализация
logMessage("Добро пожаловать в Хранителя Алтаря...");
updateUI();
