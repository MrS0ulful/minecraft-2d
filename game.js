let canvas, ctx;
let player = {
    x: 400,
    y: 300,
    width: 40,
    height: 60,
    velocityX: 0,
    velocityY: 0,
    speed: 5,
    jumpForce: 15,
    isJumping: false,
    health: 100,
    food: 100,
    level: 1
};

let blocks = [];
let selectedBlock = 0;
let hotbar = ['dirt', 'wood', 'stone', 'stick', null, null, null, null, null];
let inventory = {};

// Блоки игры
const blockTypes = {
    'dirt': { color: '#8B4513', emoji: '🟫' },
    'wood': { color: '#8B4513', emoji: '🪵' },
    'stone': { color: '#808080', emoji: '🪨' },
    'grass': { color: '#7CFC00', emoji: '🌿' },
    'water': { color: '#1E90FF', emoji: '💧' }
};

function initGame(userData) {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    
    // Загружаем данные игрока
    player.health = userData.health || 100;
    player.food = userData.food || 100;
    player.level = userData.level || 1;
    inventory = userData.inventory || {};
    
    // Создаем горячую панель
    initHotbar();
    
    // Генерируем мир
    generateWorld();
    
    // Запускаем игровой цикл
    requestAnimationFrame(gameLoop);
    
    // Обработчики событий
    setupEventListeners();
    
    // Обновляем UI
    updateUI();
}

function initHotbar() {
    const hotbarElement = document.getElementById('hotbar');
    hotbarElement.innerHTML = '';
    
    hotbar.forEach((block, index) => {
        const slot = document.createElement('div');
        slot.className = 'hotbar-slot';
        slot.textContent = block ? blockTypes[block]?.emoji || '❓' : '';
        slot.onclick = () => selectHotbarSlot(index);
        
        if (index === selectedBlock) {
            slot.classList.add('active');
        }
        
        hotbarElement.appendChild(slot);
    });
}

function selectHotbarSlot(index) {
    selectedBlock = index;
    document.querySelectorAll('.hotbar-slot').forEach((slot, i) => {
        slot.classList.toggle('active', i === index);
    });
}

function generateWorld() {
    blocks = [];
    
    // Генерируем землю
    for (let x = 0; x < 20; x++) {
        for (let y = 10; y < 15; y++) {
            blocks.push({
                x: x * 50,
                y: y * 50,
                width: 50,
                height: 50,
                type: y === 10 ? 'grass' : 'dirt',
                health: 3
            });
        }
    }
    
    // Добавляем деревья
    for (let i = 0; i < 5; i++) {
        const treeX = Math.floor(Math.random() * 15) * 50;
        for (let y = 6; y < 10; y++) {
            blocks.push({
                x: treeX,
                y: y * 50,
                width: 50,
                height: 50,
                type: 'wood',
                health: 2
            });
        }
    }
    
    // Добавляем камни
    for (let i = 0; i < 10; i++) {
        blocks.push({
            x: Math.floor(Math.random() * 18) * 50,
            y: 11 * 50,
            width: 50,
            height: 50,
            type: 'stone',
            health: 4
        });
    }
}

function setupEventListeners() {
    // Управление клавиатурой
    document.addEventListener('keydown', (e) => {
        switch(e.key.toLowerCase()) {
            case 'w':
                if (!player.isJumping) {
                    player.velocityY = -player.jumpForce;
                    player.isJumping = true;
                }
                break;
            case 'a':
                player.velocityX = -player.speed;
                break;
            case 'd':
                player.velocityX = player.speed;
                break;
            case ' ':
                if (!player.isJumping) {
                    player.velocityY = -player.jumpForce;
                    player.isJumping = true;
                }
                break;
            case '1': case '2': case '3': case '4': case '5':
            case '6': case '7': case '8': case '9':
                selectHotbarSlot(parseInt(e.key) - 1);
                break;
        }
    });
    
    document.addEventListener('keyup', (e) => {
        if (e.key.toLowerCase() === 'a' && player.velocityX < 0) {
            player.velocityX = 0;
        }
        if (e.key.toLowerCase() === 'd' && player.velocityX > 0) {
            player.velocityX = 0;
        }
    });
    
    // Управление мышью
    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        if (e.button === 0) { // ЛКМ - разрушение
            breakBlock(mouseX, mouseY);
        } else if (e.button === 2) { // ПКМ - установка
            placeBlock(mouseX, mouseY);
        }
    });
    
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}

function breakBlock(x, y) {
    const selectedBlockType = hotbar[selectedBlock];
    if (!selectedBlockType) return;
    
    for (let i = blocks.length - 1; i >= 0; i--) {
        const block = blocks[i];
        if (x >= block.x && x <= block.x + block.width &&
            y >= block.y && y <= block.y + block.height) {
            
            block.health--;
            
            if (block.health <= 0) {
                // Добавляем блок в инвентарь
                inventory[block.type] = (inventory[block.type] || 0) + 1;
                blocks.splice(i, 1);
                updateUI();
                saveGame();
            }
            break;
        }
    }
}

function placeBlock(x, y) {
    const selectedBlockType = hotbar[selectedBlock];
    if (!selectedBlockType || !inventory[selectedBlockType] || inventory[selectedBlockType] <= 0) {
        return;
    }
    
    const blockX = Math.floor(x / 50) * 50;
    const blockY = Math.floor(y / 50) * 50;
    
    // Проверяем, нет ли блока на этой позиции
    const existingBlock = blocks.find(b => b.x === blockX && b.y === blockY);
    if (existingBlock) return;
    
    // Проверяем, чтобы блок не ставился на игрока
    if (blockX === Math.floor(player.x / 50) * 50 && 
        blockY === Math.floor(player.y / 50) * 50) {
        return;
    }
    
    // Добавляем блок
    blocks.push({
        x: blockX,
        y: blockY,
        width: 50,
        height: 50,
        type: selectedBlockType,
        health: 3
    });
    
    // Убираем блок из инвентаря
    inventory[selectedBlockType]--;
    updateUI();
    saveGame();
}

function craft(item) {
    switch(item) {
        case 'wood_sword':
            if (inventory.wood >= 4) {
                inventory.wood -= 4;
                hotbar[4] = 'wood_sword';
                initHotbar();
                updateUI();
                saveGame();
            }
            break;
        case 'stone_pickaxe':
            if (inventory.stone >= 3 && inventory.stick >= 2) {
                inventory.stone -= 3;
                inventory.stick -= 2;
                hotbar[5] = 'stone_pickaxe';
                initHotbar();
                updateUI();
                saveGame();
            }
            break;
    }
}

function updateUI() {
    document.getElementById('health').textContent = player.health;
    document.getElementById('food').textContent = player.food;
    document.getElementById('level').textContent = player.level;
}

async function saveGame() {
    if (currentUser) {
        await database.ref('users/' + currentUser.uid).update({
            health: player.health,
            food: player.food,
            level: player.level,
            inventory: inventory,
            position: { x: player.x, y: player.y }
        });
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function update() {
    // Физика игрока
    player.x += player.velocityX;
    player.y += player.velocityY;
    
    // Гравитация
    player.velocityY += 0.8;
    
    // Проверка коллизий с блоками
    blocks.forEach(block => {
        if (player.x < block.x + block.width &&
            player.x + player.width > block.x &&
            player.y < block.y + block.height &&
            player.y + player.height > block.y) {
            
            // Определяем сторону столкновения
            const overlapX = Math.min(
                player.x + player.width - block.x,
                block.x + block.width - player.x
            );
            const overlapY = Math.min(
                player.y + player.height - block.y,
                block.y + block.height - player.y
            );
            
            if (overlapX < overlapY) {
                // Горизонтальное столкновение
                if (player.x < block.x) {
                    player.x = block.x - player.width;
                } else {
                    player.x = block.x + block.width;
                }
                player.velocityX = 0;
            } else {
                // Вертикальное столкновение
                if (player.y < block.y) {
                    player.y = block.y - player.height;
                    player.isJumping = false;
                    player.velocityY = 0;
                } else {
                    player.y = block.y + block.height;
                    player.velocityY = 0;
                }
            }
        }
    });
    
    // Границы мира
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    if (player.y + player.height > canvas.height) {
        player.y = canvas.height - player.height;
        player.isJumping = false;
        player.velocityY = 0;
    }
    
    // Голод и здоровье
    if (player.food > 0) {
        player.food -= 0.01;
    } else {
        player.health -= 0.05;
    }
    
    if (player.health <= 0) {
        player.health = 100;
        player.food = 100;
        player.x = 400;
        player.y = 300;
    }
    
    // Сохранение каждые 5 секунд
    if (Math.floor(Date.now() / 1000) % 5 === 0) {
        saveGame();
    }
}

function draw() {
    // Очистка
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Фон
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Рисуем блоки
    blocks.forEach(block => {
        ctx.fillStyle = blockTypes[block.type]?.color || '#000';
        ctx.fillRect(block.x, block.y, block.width, block.height);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(block.x, block.y, block.width, block.height);
        
        // Здоровье блока
        if (block.health < 3) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.fillRect(block.x, block.y, block.width, block.height);
        }
    });
    
    // Рисуем игрока
    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.fillStyle = '#000';
    ctx.fillRect(player.x + 10, player.y + 10, 8, 8); // Глаза
    ctx.fillRect(player.x + 22, player.y + 10, 8, 8);
    
    // Рисуем выделение выбранного блока
    if (hotbar[selectedBlock]) {
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        const mousePos = getMousePos();
        const gridX = Math.floor(mousePos.x / 50) * 50;
        const gridY = Math.floor(mousePos.y / 50) * 50;
        ctx.strokeRect(gridX, gridY, 50, 50);
    }
}

function getMousePos() {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (event?.clientX || 0) - rect.left,
        y: (event?.clientY || 0) - rect.top
    };
}

// Экспорт для HTML
window.showRegister = showRegister;
window.showLogin = showLogin;
window.register = register;
window.login = login;
window.logout = logout;
window.craft = craft;
window.sendMessage = sendMessage;
window.chatKeyPress = chatKeyPress;