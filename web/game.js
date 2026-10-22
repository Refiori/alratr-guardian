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

        // После каждого действия запускается фаза ночи
        setTimeout(() => this.nightPhase(), 1000);
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
