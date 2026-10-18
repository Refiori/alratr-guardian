import random

class GameState:
    def __init__(self):
        self.day = 1
        self.max_days = 30
        self.mana = 100
        self.supplies = 50
        self.fragments = 0
        self.wall_health = 100
        self.guard_strength = 10
        self.is_game_over = False
        self.victory = False

    def display_status(self):
        print(f"\n--- День {self.day} ---")
        print(f"Ресурсы: Мана: {self.mana} | Провизия: {self.supplies} | Материя: {self.fragments}")
        print(f"Оборона: Стены: {self.wall_health}% | Стражники: {self.guard_strength}")
        print("-" * 20)

class Game:
    def __init__(self):
        self.state = GameState()

    def play(self):
        print("Добро пожаловать в Хранителя Алтаря!")
        while not self.state.is_game_over and not self.state.victory:
            self.state.display_status()
            if self.state.day > self.state.max_days:
                print("Вы выстояли все 30 дней! Вы победили!")
                self.state.victory = True
                break
            
            self.day_phase()
            self.night_phase()
            self.state.day += 1
        
        if self.state.is_game_over:
            print("Ваш алтарь был разрушен. Игра окончена.")

    def day_phase(self):
        print("\nФаза Дня: Чем вы хотите заняться? (Введите номер)")
        print("1. Сбор провизии (+20 Supplies)")
        print("2. Укрепление стен (+20 Wall Health)")
        print("3. Обучение стражников (+10 Guard Strength)")
        print("4. Отдых (Восстановление маны)")
        
        choice = input("> ")
        
        if choice == '1':
            self.state.supplies += 20
            print("Вы собрали дополнительные припасы.")
        elif choice == '2':
            self.state.wall_health = min(100, self.state.wall_health + 20)
            print("Вы укрепили стены.")
        elif choice == '3':
            self.state.guard_strength += 10
            print("Стражники стали опытнее.")
        elif choice == '4':
            self.state.mana = min(100, self.state.mana + 30)
            print("Вы отдохнули и восстановили ману.")
        else:
            print("Вы потратили время впустую.")

    def night_phase(self):
        print("\n--- Наступает ночь ---")
        # Простая логика набега
        enemy_power = 15 + (self.state.day * 2)  # Враги становятся сильнее каждый день
        defense = self.state.wall_health + self.state.guard_strength
        
        print(f"Прибыла волна из Пустоты (Сила: {enemy_power})")
        print(f"Ваша оборона: {defense}")
        
        if defense >= enemy_power:
            print("Вы успешно отразили атаку!")
            self.state.fragments += 5
            print("Вы нашли 5 фрагментов среди обломков.")
        else:
            damage = enemy_power - defense
            self.state.wall_health -= damage
            print(f"Стены повреждены! Получено урона: {damage}")
            if self.state.wall_health <= 0:
                self.state.is_game_over = True
                self.state.wall_health = 0

if __name__ == "__main__":
    game = Game()
    game.play()
