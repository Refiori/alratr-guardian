const gameData = {
    day: 1,
    maxDays: 30,
    mana: 100,
    supplies: 50,
    fragments: 0,
    wallHealth: 100,
    guardStrength: 10,
    isGameOver: false,
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

    const guardCount = Math.min(guardSlots.length, 3 + Math.floor(gameData.guardStrength / 10));
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
    document.getElementById('day-count').innerText = gameData.day;
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

const game = {
    handleAction(type) {
        if (gameData.isGameOver) return;

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

    nightPhase() {
        if (gameData.isGameOver || gameData.victory) return;

        logMessage("--- Ночь наступила ---");

        const enemyPower = 15 + (gameData.day * 2);
        const defense = gameData.wallHealth + gameData.guardStrength;

        logMessage(`Прибыла волна из Пустоты (Сила: ${enemyPower}). Ваша оборона: ${defense}`);

        if (defense >= enemyPower) {
            logMessage("Вы успешно отразили атаку!");
            gameData.fragments += 5;
            logMessage("Вы нашли 5 фрагментов среди обломков.");
        } else {
            const damage = enemyPower - defense;
            gameData.wallHealth -= damage;
            logMessage(`Стены повреждены! Получено урона: ${damage}`);

            if (gameData.wallHealth <= 0) {
                gameData.wallHealth = 0;
                gameData.isGameOver = true;
                logMessage("Ваш алтарь был разрушен. Игра окончена.");
            }
        }

        updateUI();

        if (!gameData.isGameOver && !gameData.victory) {
            gameData.day += 1;
            if (gameData.day > gameData.maxDays) {
                gameData.victory = true;
                logMessage("Вы выстояли все 30 дней! Вы победили!");
            } else {
                logMessage(`--- День ${gameData.day} --- Наступил новый день.`);
            }
        }
    }
};

// Инициализация
logMessage("Добро пожаловать в Хранителя Алтаря...");
updateUI();
