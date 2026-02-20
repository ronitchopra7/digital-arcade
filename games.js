// ==================== GLOBAL GAME STATE ====================
let gamePaused = false;

function stopAllGames() {
    // Cancel all animation frame loops
    if (snakeGame) {
        cancelAnimationFrame(snakeGame);
        snakeGame = null;
    }
    if (pacmanGame) {
        cancelAnimationFrame(pacmanGame);
        pacmanGame = null;
    }
    if (pacmanResetTimeout) {
        clearTimeout(pacmanResetTimeout);
        pacmanResetTimeout = null;
    }
    if (tetrisGame) {
        cancelAnimationFrame(tetrisGame);
        tetrisGame = null;
    }
    if (platformerGame) {
        cancelAnimationFrame(platformerGame);
        platformerGame = null;
    }
    if (minesweeperTimerInterval) {
        clearInterval(minesweeperTimerInterval);
        minesweeperTimerInterval = null;
    }
    
    // Remove all game key listeners
    if (snakeKeyHandler) {
        document.removeEventListener('keydown', snakeKeyHandler);
        snakeKeyHandler = null;
    }
    if (pacmanKeyHandler) {
        document.removeEventListener('keydown', pacmanKeyHandler);
        pacmanKeyHandler = null;
    }
    if (tetrisKeyHandler) {
        document.removeEventListener('keydown', tetrisKeyHandler);
        tetrisKeyHandler = null;
    }
    if (platformerKeyHandler) {
        document.removeEventListener('keydown', platformerKeyHandler);
        platformerKeyHandler = null;
    }
    if (platformerKeyUpHandler) {
        document.removeEventListener('keyup', platformerKeyUpHandler);
        platformerKeyUpHandler = null;
    }
    
    // Reset pause state and hide modal
    gamePaused = false;
    const modal = document.getElementById('game-over-modal');
    if (modal) modal.classList.add('hidden');
}

// ==================== HIGH SCORE SYSTEM ====================
function getHighScore(gameName) {
    const highScore = localStorage.getItem(`highScore_${gameName}`);
    return highScore ? parseInt(highScore) : 0;
}

function setHighScore(gameName, score) {
    const currentHigh = getHighScore(gameName);
    if (score > currentHigh) {
        localStorage.setItem(`highScore_${gameName}`, score.toString());
        return true; // New high score!
    }
    return false;
}

function showGameOver(gameName, score) {
    const modal = document.getElementById('game-over-modal');
    const modalScore = document.getElementById('modal-score');
    const modalHighScore = document.getElementById('modal-high-score');
    const modalTitle = document.getElementById('modal-title');
    
    // Check if modal elements exist
    if (!modal || !modalScore || !modalHighScore || !modalTitle) {
        console.error('Game over modal elements not found');
        return;
    }
    
    const isNewHigh = setHighScore(gameName, score);
    const highScore = getHighScore(gameName); // Get updated high score
    
    modalScore.textContent = score;
    
    if (isNewHigh) {
        modalTitle.textContent = '🎉 New High Score! 🎉';
        modalHighScore.textContent = score; // Show new high score
    } else {
        modalTitle.textContent = 'Game Over!';
        modalHighScore.textContent = highScore; // Show current high score
    }
    
    gamePaused = true; // Pause game while modal is shown
    modal.classList.remove('hidden');
}

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    const modalCloseBtn = document.getElementById('modal-close-btn');
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', () => {
            document.getElementById('game-over-modal').classList.add('hidden');
            gamePaused = false; // Resume game when modal is closed
        });
    }
});// Game Navigation
document.querySelectorAll('.game-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Stop any currently running games first
        stopAllGames();
        
        const gameName = btn.dataset.game;
        document.querySelectorAll('.game-container').forEach(container => {
            container.classList.add('hidden');
        });
        const gameContainer = document.getElementById(`${gameName}-game`);
        gameContainer.classList.remove('hidden');
        
        // Show start screen, hide game elements
        const startScreen = document.getElementById(`${gameName}-start-screen`);
        const canvas = gameContainer.querySelector('canvas');
        const msWrapper = document.getElementById('minesweeper-wrapper');
        const controls = gameContainer.querySelector('.controls');
        
        if (startScreen) startScreen.classList.remove('hidden');
        if (canvas) canvas.classList.add('hidden');
        if (msWrapper) msWrapper.classList.add('hidden');
        if (controls) controls.classList.add('hidden');
    });
});

// Start Game Buttons - Initialize when DOM is ready
function initializeStartButtons() {
    const snakeStartBtn = document.getElementById('snake-start-btn');
    if (snakeStartBtn) {
        snakeStartBtn.addEventListener('click', () => {
            stopAllGames(); // Clean up any running game first
            document.getElementById('snake-start-screen').classList.add('hidden');
            document.getElementById('snake-canvas').classList.remove('hidden');
            document.getElementById('snake-controls').classList.remove('hidden');
            initSnake();
        });
    }

    const pacmanStartBtn = document.getElementById('pacman-start-btn');
    if (pacmanStartBtn) {
        pacmanStartBtn.addEventListener('click', () => {
            stopAllGames();
            document.getElementById('pacman-start-screen').classList.add('hidden');
            document.getElementById('pacman-canvas').classList.remove('hidden');
            document.getElementById('pacman-controls').classList.remove('hidden');
            initPacman();
        });
    }

    const minesweeperStartBtn = document.getElementById('minesweeper-start-btn');
    if (minesweeperStartBtn) {
        minesweeperStartBtn.addEventListener('click', () => {
            stopAllGames();
            document.getElementById('minesweeper-start-screen').classList.add('hidden');
            document.getElementById('minesweeper-wrapper').classList.remove('hidden');
            document.getElementById('minesweeper-controls').classList.remove('hidden');
            initMinesweeper();
        });
    }

    const tetrisStartBtn = document.getElementById('tetris-start-btn');
    if (tetrisStartBtn) {
        tetrisStartBtn.addEventListener('click', () => {
            stopAllGames();
            document.getElementById('tetris-start-screen').classList.add('hidden');
            document.getElementById('tetris-canvas').classList.remove('hidden');
            document.getElementById('tetris-controls').classList.remove('hidden');
            initTetris();
        });
    }

    const platformerStartBtn = document.getElementById('platformer-start-btn');
    if (platformerStartBtn) {
        platformerStartBtn.addEventListener('click', () => {
            stopAllGames();
            document.getElementById('platformer-start-screen').classList.add('hidden');
            document.getElementById('platformer-canvas').classList.remove('hidden');
            document.getElementById('platformer-controls').classList.remove('hidden');
            initPlatformer();
        });
    }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeStartButtons();
    });
} else {
    initializeStartButtons();
}

document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        stopAllGames();
        
        document.querySelectorAll('.game-container').forEach(container => {
            container.classList.add('hidden');
        });
    });
});

// ==================== SNAKE GAME (Google Doodle Style) ====================
let snakeGame = null;
let snakeKeyHandler = null;

function initSnake() {
    const canvas = document.getElementById('snake-canvas');
    const ctx = canvas.getContext('2d');
    const gridSize = 20;
    const tileCount = canvas.width / gridSize;
    
    let snake = [{x: 10, y: 10}];
    let food = {x: 15, y: 15};
    let dx = 0;
    let dy = 0;
    let prevDx = 0;  // Previous direction for interpolation
    let prevDy = 0;
    let directionChanged = false;  // Track if direction changed this cycle
    let score = 0;
    let lastMoveTime = 0;
    const moveInterval = 100; // milliseconds between moves (smooth like Google)
    
    // Food types with colors (like Google Doodle)
    const foodTypes = [
        {color: '#FF6B6B', name: 'apple'},      // Red
        {color: '#4ECDC4', name: 'berry'},  // Cyan
        {color: '#FFE66D', name: 'banana'}, // Yellow
        {color: '#95E1D3', name: 'lime'},   // Green
        {color: '#F38181', name: 'cherry'}  // Pink
    ];
    let currentFoodType = foodTypes[0];
    
    // For smooth animation interpolation
    let snakeRender = snake.map(s => ({x: s.x, y: s.y}));
    let foodRender = {x: food.x, y: food.y};
    let animationProgress = 0;
    
    function drawGame(currentTime) {
        if (!snakeGame) return;
        
        // Smooth interpolation between moves
        if (currentTime - lastMoveTime < moveInterval) {
            animationProgress = (currentTime - lastMoveTime) / moveInterval;
        } else {
            animationProgress = 1;
        }
        
        // Move snake at intervals
        if (currentTime - lastMoveTime >= moveInterval) {
            moveSnake();
            lastMoveTime = currentTime;
            animationProgress = 0;
            prevDx = dx;  // Update previous direction after move
            prevDy = dy;
            directionChanged = false;  // Reset direction change flag
        }
        
        // Interpolate snake position for smooth movement
        if (snake.length > 0 && (dx !== 0 || dy !== 0)) {
            snakeRender = snake.map((segment, index) => {
                if (index === 0) {
                    // Use previous direction for interpolation if direction just changed
                    const interpDx = directionChanged ? prevDx : dx;
                    const interpDy = directionChanged ? prevDy : dy;
                    return {
                        x: segment.x - interpDx * (1 - animationProgress),
                        y: segment.y - interpDy * (1 - animationProgress)
                    };
                }
                return {x: segment.x, y: segment.y};
            });
        } else {
            snakeRender = snake.map(s => ({x: s.x, y: s.y}));
        }
        
        clearCanvas(ctx, canvas);
        drawFood(ctx, foodRender, gridSize, currentFoodType);
        drawSnake(ctx, snakeRender, gridSize);
    }
    
    function moveSnake() {
        if (dx === 0 && dy === 0) return; // Don't move until first key press
        
        const head = {x: snake[0].x + dx, y: snake[0].y + dy};
        
        // Wall collision - game over
        if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
            resetSnake();
            return;
        }
        
        // Self collision
        if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            resetSnake();
            return;
        }
        
        snake.unshift(head);
        snakeRender.unshift({x: head.x, y: head.y});
        
        // Food collision
        if (head.x === food.x && head.y === food.y) {
            score++;
            const scoreElement = document.getElementById('snake-score');
            if (scoreElement) scoreElement.textContent = score;
            generateFood();
        } else {
            snake.pop();
            snakeRender.pop();
        }
    }
    
    function generateFood(maxAttempts = 100) {
        // Random food type
        currentFoodType = foodTypes[Math.floor(Math.random() * foodTypes.length)];
        
        let attempts = 0;
        do {
            food = {
                x: Math.floor(Math.random() * tileCount),
                y: Math.floor(Math.random() * tileCount)
            };
            attempts++;
        } while (snake.some(segment => segment.x === food.x && segment.y === food.y) && attempts < maxAttempts);
        
        // If we couldn't find a spot (snake is too long), just place it anyway
        foodRender = {x: food.x, y: food.y};
    }
    
    function resetSnake() {
        const finalScore = score;
        snake = [{x: 10, y: 10}];
        snakeRender = [{x: 10, y: 10}];
        dx = 0;
        dy = 0;
        prevDx = 0;
        prevDy = 0;
        directionChanged = false;
        score = 0;
        const scoreElement = document.getElementById('snake-score');
        if (scoreElement) scoreElement.textContent = score;
        generateFood();
        if (finalScore > 0) {
            showGameOver('snake', finalScore);
        }
    }
    
    function drawRoundedRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
    
    function drawSnake(ctx, snake, gridSize) {
        snake.forEach((segment, index) => {
            const x = segment.x * gridSize;
            const y = segment.y * gridSize;
            const size = gridSize - 2;
            const padding = 1;
            
            ctx.save();
            
            // Simple green color like Google Doodle
            if (index === 0) {
                // Head - slightly brighter
                ctx.fillStyle = '#4CAF50';
            } else {
                // Body - standard green
                ctx.fillStyle = '#66BB6A';
            }
            
            // Draw simple rounded square
            drawRoundedRect(ctx, x + padding, y + padding, size, size, 3);
            ctx.fill();
            
            // Eyes on head
            if (index === 0) {
                ctx.fillStyle = '#000';
                const eyeSize = 2;
                const eyeOffset = size * 0.25;
                
                // Determine eye position based on direction
                let eyeX1, eyeY1, eyeX2, eyeY2;
                if (dx === 1) { // Right
                    eyeX1 = x + padding + size * 0.6;
                    eyeY1 = y + padding + size * 0.3;
                    eyeX2 = x + padding + size * 0.6;
                    eyeY2 = y + padding + size * 0.7;
                } else if (dx === -1) { // Left
                    eyeX1 = x + padding + size * 0.4;
                    eyeY1 = y + padding + size * 0.3;
                    eyeX2 = x + padding + size * 0.4;
                    eyeY2 = y + padding + size * 0.7;
                } else if (dy === 1) { // Down
                    eyeX1 = x + padding + size * 0.3;
                    eyeY1 = y + padding + size * 0.6;
                    eyeX2 = x + padding + size * 0.7;
                    eyeY2 = y + padding + size * 0.6;
                } else if (dy === -1) { // Up
                    eyeX1 = x + padding + size * 0.3;
                    eyeY1 = y + padding + size * 0.4;
                    eyeX2 = x + padding + size * 0.7;
                    eyeY2 = y + padding + size * 0.4;
                } else {
                    // Default (not moving)
                    eyeX1 = x + padding + size * 0.4;
                    eyeY1 = y + padding + size * 0.3;
                    eyeX2 = x + padding + size * 0.6;
                    eyeY2 = y + padding + size * 0.3;
                }
                
                ctx.beginPath();
                ctx.arc(eyeX1, eyeY1, eyeSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(eyeX2, eyeY2, eyeSize, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        });
    }
    
    function drawFood(ctx, food, gridSize, foodType) {
        const x = food.x * gridSize + gridSize / 2;
        const y = food.y * gridSize + gridSize / 2;
        const size = gridSize * 0.5;
        
        ctx.save();
        
        // Simple colorful circle like Google Doodle
        ctx.fillStyle = foodType.color;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Small highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(x - size * 0.3, y - size * 0.3, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    function clearCanvas(ctx, canvas) {
        // Grassy background with gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#7CB342');  // Light green
        gradient.addColorStop(0.5, '#689F38'); // Medium green
        gradient.addColorStop(1, '#558B2F');   // Darker green
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Subtle grid lines in darker green
        ctx.strokeStyle = 'rgba(56, 142, 60, 0.15)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= tileCount; i++) {
            ctx.beginPath();
            ctx.moveTo(i * gridSize, 0);
            ctx.lineTo(i * gridSize, canvas.height);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * gridSize);
            ctx.lineTo(canvas.width, i * gridSize);
            ctx.stroke();
        }
    }
    
    function handleKeyPress(e) {
        const gameKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 'a', 'A', 's', 'S', 'd', 'D'];
        if (gameKeys.includes(e.key)) e.preventDefault();
        
        // Only allow one direction change per move cycle
        if (directionChanged) {
            return; // Ignore rapid key presses
        }
        
        let newDx = dx;
        let newDy = dy;
        
        // Determine desired direction
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
            newDx = 0;
            newDy = -1;
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
            newDx = 0;
            newDy = 1;
        } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            newDx = -1;
            newDy = 0;
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            newDx = 1;
            newDy = 0;
        } else {
            return; // Not a valid key
        }
        
        // Prevent opposite direction (can't go back into yourself)
        if (newDx === -dx && newDy === -dy && (dx !== 0 || dy !== 0)) {
            return; // Ignore opposite direction
        }
        
        // If snake hasn't moved yet, allow any direction
        if (dx === 0 && dy === 0) {
            dx = newDx;
            dy = newDy;
            prevDx = dx;
            prevDy = dy;
            return;
        }
        
        // Don't allow same direction
        if (newDx === dx && newDy === dy) {
            return;
        }
        
        // Check if the turn would cause immediate collision with body
        const testX = snake[0].x + newDx;
        const testY = snake[0].y + newDy;
        const wouldCollide = snake.some(seg => seg.x === testX && seg.y === testY);
        
        if (!wouldCollide) {
            // Apply direction change and mark it
            prevDx = dx;
            prevDy = dy;
            dx = newDx;
            dy = newDy;
            directionChanged = true;
        }
    }
    
    document.removeEventListener('keydown', snakeKeyHandler);
    snakeKeyHandler = handleKeyPress;
    document.addEventListener('keydown', snakeKeyHandler);
    
    if (snakeGame) cancelAnimationFrame(snakeGame);
    resetSnake();
    generateFood();
    lastMoveTime = performance.now();
    
    function gameLoop(currentTime) {
        if (!snakeGame) return;
        if (gamePaused) {
            lastMoveTime = currentTime; // Keep time in sync so snake doesn't jump on unpause
            snakeGame = requestAnimationFrame(gameLoop);
            return;
        }
        drawGame(currentTime);
        snakeGame = requestAnimationFrame(gameLoop);
    }
    
    snakeGame = requestAnimationFrame(gameLoop);
}

// ==================== PAC-MAN GAME ====================
let pacmanGame = null;
let pacmanKeyHandler = null;
let pacmanResetTimeout = null;

function initPacman() {
    const canvas = document.getElementById('pacman-canvas');
    const ctx = canvas.getContext('2d');
    const gridSize = 20;
    const tileCount = canvas.width / gridSize;
    
    // Classic Pac-Man maze layout (1 = wall, 0 = path)
    const maze = [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,0,1,0,1,1,1,1,1,1,0,1,0,1,1,0,1],
        [1,0,0,0,0,1,0,0,0,1,1,0,0,0,1,0,0,0,0,1],
        [1,1,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,1,1],
        [0,0,0,1,0,1,0,0,0,0,0,0,0,0,1,0,1,0,0,0],
        [1,1,1,1,0,1,0,1,1,0,0,1,1,0,1,0,1,1,1,1],
        [0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0],
        [1,1,1,1,0,1,0,1,1,1,1,1,1,0,1,0,1,1,1,1],
        [0,0,0,1,0,1,0,0,0,0,0,0,0,0,1,0,1,0,0,0],
        [1,1,1,1,0,1,0,1,1,1,1,1,1,0,1,0,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,0,1],
        [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1],
        [1,1,0,1,0,1,0,1,1,1,1,1,1,0,1,0,1,0,1,1],
        [1,0,0,0,0,1,0,0,0,1,1,0,0,0,1,0,0,0,0,1],
        [1,0,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ];
    
    let pacman = {x: 10, y: 15, direction: 0, nextDirection: 0, mouthAngle: 0, animFrame: 0};
    let dots = [];
    let ghosts = [
        {x: 9, y: 9, dx: 1, dy: 0, color: '#FF0000'},
        {x: 10, y: 9, dx: -1, dy: 0, color: '#FFB8FF'},
        {x: 11, y: 9, dx: 1, dy: 0, color: '#00FFFF'},
        {x: 9, y: 10, dx: -1, dy: 0, color: '#FFB851'}
    ];
    let score = 0;
    let gameRunning = true;
    let lastMoveTime = 0;
    const moveInterval = 150;
    
    function canMove(x, y) {
        // Wrap around at sides (tunnel)
        if (y === 9 || y === 10) {
            if (x < 0) return {x: tileCount - 1, y: y, wrapped: true};
            if (x >= tileCount) return {x: 0, y: y, wrapped: true};
        }
        if (x < 0 || x >= tileCount || y < 0 || y >= tileCount) return false;
        if (!maze[y] || maze[y][x] === 1) return false;
        return {x: x, y: y, wrapped: false};
    }
    
    function resetPacman() {
        const finalScore = score;
        pacman = {x: 10, y: 15, direction: 0, nextDirection: 0, mouthAngle: 0, animFrame: 0};
        ghosts = [
            {x: 9, y: 9, dx: 1, dy: 0, color: '#FF0000'},
            {x: 10, y: 9, dx: -1, dy: 0, color: '#FFB8FF'},
            {x: 11, y: 9, dx: 1, dy: 0, color: '#00FFFF'},
            {x: 9, y: 10, dx: -1, dy: 0, color: '#FFB851'}
        ];
        score = 0;
        gameRunning = true;
        const pacmanScoreElement = document.getElementById('pacman-score');
        if (pacmanScoreElement) pacmanScoreElement.textContent = score;
        generateDots();
        if (finalScore > 0) {
            showGameOver('pacman', finalScore);
        }
    }
    
    function generateDots() {
        dots = [];
        for (let y = 0; y < tileCount; y++) {
            for (let x = 0; x < tileCount; x++) {
                if (maze[y] && maze[y][x] === 0) {
                    // Don't place dots where pacman or ghosts start
                    if (!(x === 10 && y === 15) && 
                        !(x === 9 && y === 9) && !(x === 10 && y === 9) && 
                        !(x === 11 && y === 9) && !(x === 9 && y === 10)) {
                        dots.push({x, y});
                    }
                }
            }
        }
    }
    
    function drawGame(currentTime) {
        if (!pacmanGame) return; // Stop if game was cancelled
        if (gamePaused) {
            lastMoveTime = currentTime; // Keep time in sync
            pacmanGame = requestAnimationFrame(drawGame);
            return;
        }
        
        clearCanvas(ctx, canvas);
        drawMaze(ctx, maze, gridSize);
        drawDots(ctx, dots, gridSize);
        drawGhosts(ctx, ghosts, gridSize);
        drawPacman(ctx, pacman, gridSize);
        
        if (currentTime - lastMoveTime >= moveInterval) {
            movePacman();
            moveGhosts();
            lastMoveTime = currentTime;
        }
        
        pacmanGame = requestAnimationFrame(drawGame);
    }
    
    function movePacman() {
        if (!gameRunning) return;
        
        pacman.animFrame++;
        pacman.mouthAngle = Math.abs(Math.sin(pacman.animFrame * 0.3)) * Math.PI / 3;
        
        // Try to change direction if queued
        const dirs = [[1,0], [0,1], [-1,0], [0,-1]]; // right, down, left, up
        if (pacman.nextDirection !== pacman.direction) {
            const nextDir = dirs[pacman.nextDirection];
            const nextPos = canMove(pacman.x + nextDir[0], pacman.y + nextDir[1]);
            if (nextPos && nextPos !== false) {
                pacman.direction = pacman.nextDirection;
            }
        }
        
        const dir = dirs[pacman.direction];
        const nextPos = canMove(pacman.x + dir[0], pacman.y + dir[1]);
        
        if (nextPos && nextPos !== false) {
            if (nextPos.wrapped) {
                pacman.x = nextPos.x;
                pacman.y = nextPos.y;
            } else {
                pacman.x += dir[0];
                pacman.y += dir[1];
            }
            
            // Collect dots
            const dotIndex = dots.findIndex(d => d.x === pacman.x && d.y === pacman.y);
            if (dotIndex !== -1) {
                dots.splice(dotIndex, 1);
                score += 10;
                const pacmanScoreElement = document.getElementById('pacman-score');
                if (pacmanScoreElement) pacmanScoreElement.textContent = score;
                
                if (dots.length === 0) {
                    gameRunning = false;
                    if (pacmanResetTimeout) clearTimeout(pacmanResetTimeout);
                    pacmanResetTimeout = setTimeout(() => {
                        pacmanResetTimeout = null;
                        resetPacman();
                    }, 2000);
                }
            }
        }
    }
    
    function moveGhosts() {
        if (!gameRunning) return; // Don't move ghosts when game is over
        
        ghosts.forEach(ghost => {
            if (Math.random() < 0.15) {
                const dirs = [[1,0], [0,1], [-1,0], [0,-1]];
                const validDirs = dirs.filter(dir => {
                    const check = canMove(ghost.x + dir[0], ghost.y + dir[1]);
                    return check && check !== false && !check.wrapped;
                });
                if (validDirs.length > 0) {
                    const dir = validDirs[Math.floor(Math.random() * validDirs.length)];
                    ghost.dx = dir[0];
                    ghost.dy = dir[1];
                }
            }
            
            const nextPos = canMove(ghost.x + ghost.dx, ghost.y + ghost.dy);
            if (nextPos && nextPos !== false && !nextPos.wrapped) {
                ghost.x += ghost.dx;
                ghost.y += ghost.dy;
            } else {
                // Try to find a new direction
                const dirs = [[1,0], [0,1], [-1,0], [0,-1]];
                const validDirs = dirs.filter(dir => {
                    const check = canMove(ghost.x + dir[0], ghost.y + dir[1]);
                    return check && check !== false && !check.wrapped;
                });
                if (validDirs.length > 0) {
                    const dir = validDirs[Math.floor(Math.random() * validDirs.length)];
                    ghost.dx = dir[0];
                    ghost.dy = dir[1];
                }
            }
            
            // Collision with pacman
            if (Math.abs(ghost.x - pacman.x) < 0.5 && Math.abs(ghost.y - pacman.y) < 0.5) {
                if (gameRunning) { // Only trigger once
                    gameRunning = false;
                    if (pacmanResetTimeout) clearTimeout(pacmanResetTimeout);
                    pacmanResetTimeout = setTimeout(() => {
                        pacmanResetTimeout = null;
                        resetPacman();
                    }, 1000);
                }
            }
        });
    }
    
    function drawMaze(ctx, maze, gridSize) {
        ctx.fillStyle = '#2121DE';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#000';
        for (let y = 0; y < maze.length; y++) {
            for (let x = 0; x < maze[y].length; x++) {
                if (maze[y][x] === 1) {
                    ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
                }
            }
        }
    }
    
    function drawPacman(ctx, pacman, gridSize) {
        ctx.save();
        const centerX = (pacman.x + 0.5) * gridSize;
        const centerY = (pacman.y + 0.5) * gridSize;
        const radius = gridSize * 0.4;
        
        ctx.translate(centerX, centerY);
        
        const rotations = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
        ctx.rotate(rotations[pacman.direction]);
        
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, 0, radius, pacman.mouthAngle, Math.PI * 2 - pacman.mouthAngle);
        ctx.lineTo(0, 0);
        ctx.fill();
        
        // Eye
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(radius * 0.3, -radius * 0.3, radius * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    function drawGhost(ctx, ghost, gridSize) {
        const x = ghost.x * gridSize;
        const y = ghost.y * gridSize;
        const size = gridSize * 0.9;
        const centerX = x + gridSize / 2;
        const centerY = y + gridSize / 2;
        
        ctx.save();
        
        // Ghost body (rounded rectangle with wavy bottom)
        ctx.fillStyle = ghost.color;
        ctx.beginPath();
        ctx.arc(centerX, centerY - size * 0.2, size * 0.4, Math.PI, 0, false);
        ctx.rect(x + gridSize * 0.1, centerY - size * 0.2, size * 0.8, size * 0.6);
        
        // Wavy bottom
        const waveSize = size * 0.15;
        for (let i = 0; i < 3; i++) {
            const waveX = x + gridSize * 0.1 + (i * size * 0.25);
            ctx.lineTo(waveX, centerY + size * 0.4);
            ctx.lineTo(waveX + waveSize, centerY + size * 0.4 - waveSize);
        }
        ctx.lineTo(x + gridSize * 0.9, centerY - size * 0.2);
        ctx.closePath();
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(centerX - size * 0.15, centerY - size * 0.1, size * 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX + size * 0.15, centerY - size * 0.1, size * 0.12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(centerX - size * 0.15, centerY - size * 0.1, size * 0.06, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX + size * 0.15, centerY - size * 0.1, size * 0.06, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    function drawGhosts(ctx, ghosts, gridSize) {
        ghosts.forEach(ghost => drawGhost(ctx, ghost, gridSize));
    }
    
    function drawDots(ctx, dots, gridSize) {
        ctx.fillStyle = '#FFD700';
        dots.forEach(dot => {
            ctx.beginPath();
            ctx.arc((dot.x + 0.5) * gridSize, (dot.y + 0.5) * gridSize, 3, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    function clearCanvas(ctx, canvas) {
        // Background is drawn in drawMaze
    }
    
    function handleKeyPress(e) {
        const gameKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
        if (gameKeys.includes(e.key)) e.preventDefault();
        
        if (e.key === 'ArrowUp') pacman.nextDirection = 3;
        else if (e.key === 'ArrowDown') pacman.nextDirection = 1;
        else if (e.key === 'ArrowLeft') pacman.nextDirection = 2;
        else if (e.key === 'ArrowRight') pacman.nextDirection = 0;
    }
    
    document.removeEventListener('keydown', pacmanKeyHandler);
    pacmanKeyHandler = handleKeyPress;
    document.addEventListener('keydown', pacmanKeyHandler);
    
    if (pacmanGame) cancelAnimationFrame(pacmanGame);
    resetPacman();
    generateDots();
    lastMoveTime = performance.now();
    pacmanGame = requestAnimationFrame(drawGame);
}

// ==================== MINESWEEPER GAME ====================
let minesweeperTimerInterval = null;

function initMinesweeper() {
    const board = document.getElementById('minesweeper-board');
    const faceBtn = document.getElementById('minesweeper-face');
    const timerEl = document.getElementById('minesweeper-timer');
    const mineCountEl = document.getElementById('mines-count');
    const size = 16;
    const mineCount = 40;
    let grid = [];
    let revealed = [];
    let flagged = [];
    let gameOver = false;
    let gameWon = false;
    let firstClick = true;
    let timerSeconds = 0;
    
    function startTimer() {
        if (minesweeperTimerInterval) clearInterval(minesweeperTimerInterval);
        timerSeconds = 0;
        if (timerEl) timerEl.textContent = '000';
        minesweeperTimerInterval = setInterval(() => {
            timerSeconds++;
            if (timerEl) timerEl.textContent = String(timerSeconds).padStart(3, '0');
            if (timerSeconds >= 999) clearInterval(minesweeperTimerInterval);
        }, 1000);
    }
    
    function stopTimer() {
        if (minesweeperTimerInterval) {
            clearInterval(minesweeperTimerInterval);
            minesweeperTimerInterval = null;
        }
    }
    
    function setFace(emoji) {
        if (faceBtn) faceBtn.textContent = emoji;
    }
    
    function createBoard() {
        board.innerHTML = '';
        board.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
        grid = [];
        revealed = [];
        flagged = [];
        gameOver = false;
        gameWon = false;
        firstClick = true;
        stopTimer();
        timerSeconds = 0;
        if (timerEl) timerEl.textContent = '000';
        setFace('😊');
        
        for (let y = 0; y < size; y++) {
            grid[y] = [];
            revealed[y] = [];
            flagged[y] = [];
            for (let x = 0; x < size; x++) {
                grid[y][x] = 0;
                revealed[y][x] = false;
                flagged[y][x] = false;
            }
        }
        
        // Create cells (mines placed on first click)
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const cell = document.createElement('div');
                cell.className = 'minesweeper-cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                
                cell.addEventListener('click', () => handleClick(x, y));
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    flagCell(x, y);
                });
                // Chord click on middle button or double-click on numbers
                cell.addEventListener('dblclick', () => chordReveal(x, y));
                cell.addEventListener('mousedown', (e) => {
                    if (!gameOver && !gameWon) setFace('😮');
                });
                cell.addEventListener('mouseup', () => {
                    if (!gameOver && !gameWon) setFace('😊');
                });
                
                board.appendChild(cell);
            }
        }
        
        updateMineCount();
    }
    
    function placeMines(safeX, safeY) {
        // Place mines, avoiding safe zone (3x3 around first click)
        let minesPlaced = 0;
        while (minesPlaced < mineCount) {
            const x = Math.floor(Math.random() * size);
            const y = Math.floor(Math.random() * size);
            if (grid[y][x] !== -1 && (Math.abs(x - safeX) > 1 || Math.abs(y - safeY) > 1)) {
                grid[y][x] = -1;
                minesPlaced++;
            }
        }
        
        // Calculate numbers
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                if (grid[y][x] === -1) continue;
                let count = 0;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const ny = y + dy;
                        const nx = x + dx;
                        if (ny >= 0 && ny < size && nx >= 0 && nx < size && grid[ny][nx] === -1) {
                            count++;
                        }
                    }
                }
                grid[y][x] = count;
            }
        }
    }
    
    function handleClick(x, y) {
        if (gameOver || gameWon) return;
        
        if (firstClick) {
            firstClick = false;
            placeMines(x, y);
            startTimer();
        }
        
        revealCell(x, y);
    }
    
    function revealCell(x, y) {
        if (gameOver || gameWon || revealed[y][x] || flagged[y][x]) return;
        
        revealed[y][x] = true;
        const cell = board.children[y * size + x];
        cell.classList.add('revealed');
        
        if (grid[y][x] === -1) {
            // Hit a mine
            cell.classList.add('mine');
            cell.textContent = '💣';
            gameOver = true;
            setFace('😵');
            stopTimer();
            
            // Reveal all mines
            revealAllMines(x, y);
            
            const revealedSafe = revealed.flat().filter(r => r).length - 1; // minus the mine
            setTimeout(() => {
                showGameOver('minesweeper', revealedSafe);
            }, 800);
            return;
        }
        
        if (grid[y][x] > 0) {
            cell.textContent = grid[y][x];
            cell.classList.add(`number-${grid[y][x]}`);
        } else {
            // Flood fill for empty cells
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const ny = y + dy;
                    const nx = x + dx;
                    if (ny >= 0 && ny < size && nx >= 0 && nx < size && !revealed[ny][nx]) {
                        revealCell(nx, ny);
                    }
                }
            }
        }
        
        checkWin();
    }
    
    function chordReveal(x, y) {
        if (gameOver || gameWon || !revealed[y][x] || grid[y][x] <= 0) return;
        
        // Count adjacent flags
        let adjacentFlags = 0;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const ny = y + dy;
                const nx = x + dx;
                if (ny >= 0 && ny < size && nx >= 0 && nx < size && flagged[ny][nx]) {
                    adjacentFlags++;
                }
            }
        }
        
        // If flags match the number, reveal all unflagged adjacent cells
        if (adjacentFlags === grid[y][x]) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const ny = y + dy;
                    const nx = x + dx;
                    if (ny >= 0 && ny < size && nx >= 0 && nx < size && !flagged[ny][nx] && !revealed[ny][nx]) {
                        revealCell(nx, ny);
                    }
                }
            }
        }
    }
    
    function revealAllMines(clickedX, clickedY) {
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const cell = board.children[y * size + x];
                if (grid[y][x] === -1 && !flagged[y][x]) {
                    if (x !== clickedX || y !== clickedY) {
                        cell.classList.add('mine-revealed');
                        cell.textContent = '💣';
                    }
                } else if (grid[y][x] !== -1 && flagged[y][x]) {
                    // Wrong flag
                    cell.classList.add('wrong-flag');
                    cell.textContent = '❌';
                }
            }
        }
    }
    
    function flagCell(x, y) {
        if (gameOver || gameWon || revealed[y][x]) return;
        
        if (firstClick) return; // Can't flag before first click
        
        flagged[y][x] = !flagged[y][x];
        const cell = board.children[y * size + x];
        
        if (flagged[y][x]) {
            cell.classList.add('flagged');
            cell.textContent = '🚩';
        } else {
            cell.classList.remove('flagged');
            cell.textContent = '';
        }
        
        updateMineCount();
    }
    
    function updateMineCount() {
        let flaggedCount = flagged.flat().filter(f => f).length;
        const remaining = mineCount - flaggedCount;
        if (mineCountEl) mineCountEl.textContent = String(Math.max(0, remaining)).padStart(3, '0');
    }
    
    function checkWin() {
        let revealedCount = revealed.flat().filter(r => r).length;
        if (revealedCount === size * size - mineCount) {
            gameWon = true;
            stopTimer();
            setFace('😎');
            
            // Auto-flag remaining mines
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    if (grid[y][x] === -1 && !flagged[y][x]) {
                        flagged[y][x] = true;
                        const cell = board.children[y * size + x];
                        cell.classList.add('flagged');
                        cell.textContent = '🚩';
                    }
                }
            }
            updateMineCount();
            
            // Score based on time (lower is better, so invert for high score)
            const timeScore = Math.max(1, 999 - timerSeconds);
            setTimeout(() => {
                showGameOver('minesweeper', timeScore);
            }, 500);
        }
    }
    
    // Face button resets game
    if (faceBtn) {
        faceBtn.onclick = () => createBoard();
    }
    
    createBoard();
}

// ==================== TETRIS GAME ====================
let tetrisGame = null;
let tetrisKeyHandler = null;

// Tetris piece shapes and their classic colors
const tetrisPieces = [
    {shape: [[1,1,1,1]], color: '#00F0F0'},           // I - Cyan
    {shape: [[1,1],[1,1]], color: '#F0F000'},           // O - Yellow
    {shape: [[0,1,0],[1,1,1]], color: '#A000F0'},       // T - Purple
    {shape: [[0,1,1],[1,1,0]], color: '#00F000'},       // S - Green
    {shape: [[1,1,0],[0,1,1]], color: '#F00000'},       // Z - Red
    {shape: [[1,0,0],[1,1,1]], color: '#0000F0'},       // J - Blue
    {shape: [[0,0,1],[1,1,1]], color: '#F0A000'}        // L - Orange
];

function initTetris() {
    const canvas = document.getElementById('tetris-canvas');
    const ctx = canvas.getContext('2d');
    const blockSize = 30;
    const cols = canvas.width / blockSize;
    const rows = canvas.height / blockSize;
    
    // Board stores color strings instead of just 0/1
    let board = Array(rows).fill().map(() => Array(cols).fill(0));
    let currentPiece = null;
    let currentColor = '#2196F3';
    let pieceX = 0;
    let pieceY = 0;
    let score = 0;
    let lines = 0;
    let level = 1;
    let dropCounter = 0;
    let dropInterval = 1000;
    let lastTime = 0;
    let nextPieceType = Math.floor(Math.random() * tetrisPieces.length);
    let lineClearFlash = 0; // For line-clear animation
    let flashingRows = [];
    
    function getDropInterval() {
        return Math.max(100, 1000 - (level - 1) * 80);
    }
    
    function spawnPiece() {
        const type = nextPieceType;
        nextPieceType = Math.floor(Math.random() * tetrisPieces.length);
        currentPiece = tetrisPieces[type].shape.map(row => [...row]);
        currentColor = tetrisPieces[type].color;
        pieceX = Math.floor(cols / 2) - Math.floor(currentPiece[0].length / 2);
        pieceY = 0;
        
        if (collision()) {
            const finalScore = score;
            board = Array(rows).fill().map(() => Array(cols).fill(0));
            score = 0;
            lines = 0;
            level = 1;
            dropInterval = getDropInterval();
            const tetrisScoreElement = document.getElementById('tetris-score');
            const tetrisLinesElement = document.getElementById('tetris-lines');
            if (tetrisScoreElement) tetrisScoreElement.textContent = score;
            if (tetrisLinesElement) tetrisLinesElement.textContent = lines;
            if (finalScore > 0) {
                showGameOver('tetris', finalScore);
            }
        }
    }
    
    function collision(testPiece, testX, testY) {
        const piece = testPiece || currentPiece;
        const px = testX !== undefined ? testX : pieceX;
        const py = testY !== undefined ? testY : pieceY;
        if (!piece) return false;
        for (let y = 0; y < piece.length; y++) {
            for (let x = 0; x < piece[y].length; x++) {
                if (piece[y][x]) {
                    const newX = px + x;
                    const newY = py + y;
                    if (newX < 0 || newX >= cols || newY >= rows || 
                        (newY >= 0 && board[newY][newX])) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    function getGhostY() {
        if (!currentPiece) return pieceY;
        let ghostY = pieceY;
        while (!collision(currentPiece, pieceX, ghostY + 1)) {
            ghostY++;
        }
        return ghostY;
    }
    
    function mergePiece() {
        for (let y = 0; y < currentPiece.length; y++) {
            for (let x = 0; x < currentPiece[y].length; x++) {
                if (currentPiece[y][x]) {
                    board[pieceY + y][pieceX + x] = currentColor;
                }
            }
        }
    }
    
    function clearLines() {
        let linesCleared = 0;
        flashingRows = [];
        for (let y = rows - 1; y >= 0; y--) {
            if (board[y].every(cell => cell !== 0)) {
                flashingRows.push(y);
                board.splice(y, 1);
                board.unshift(Array(cols).fill(0));
                linesCleared++;
                y++;
            }
        }
        if (linesCleared > 0) {
            lines += linesCleared;
            // Classic scoring: 1=100, 2=300, 3=500, 4=800
            const scoreMultipliers = [0, 100, 300, 500, 800];
            score += (scoreMultipliers[linesCleared] || linesCleared * 200) * level;
            level = Math.floor(lines / 10) + 1;
            dropInterval = getDropInterval();
            lineClearFlash = 10; // Flash frames
            const tetrisScoreElement = document.getElementById('tetris-score');
            const tetrisLinesElement = document.getElementById('tetris-lines');
            if (tetrisScoreElement) tetrisScoreElement.textContent = score;
            if (tetrisLinesElement) tetrisLinesElement.textContent = `${lines} (Lv.${level})`;
        }
    }
    
    function rotatePiece() {
        const rotated = currentPiece[0].map((_, i) => 
            currentPiece.map(row => row[i]).reverse()
        );
        const oldPiece = currentPiece;
        currentPiece = rotated;
        // Wall kick - try shifting left/right if rotation fails
        if (collision()) {
            pieceX--;
            if (collision()) {
                pieceX += 2;
                if (collision()) {
                    pieceX--;
                    currentPiece = oldPiece;
                }
            }
        }
    }
    
    function drawBlock(x, y, color, alpha) {
        const bx = x * blockSize;
        const by = y * blockSize;
        const size = blockSize - 1;
        const a = alpha || 1;
        
        ctx.save();
        ctx.globalAlpha = a;
        
        // Main fill
        ctx.fillStyle = color;
        ctx.fillRect(bx, by, size, size);
        
        // Lighter top & left edge (3D highlight)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(bx, by, size, 3);
        ctx.fillRect(bx, by, 3, size);
        
        // Darker bottom & right edge (3D shadow)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(bx, by + size - 3, size, 3);
        ctx.fillRect(bx + size - 3, by, 3, size);
        
        // Inner shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(bx + 4, by + 4, size - 8, size - 8);
        
        ctx.restore();
    }
    
    function draw() {
        // Dark background with subtle gradient
        const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bgGradient.addColorStop(0, '#0a0a1a');
        bgGradient.addColorStop(1, '#1a1a2e');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= cols; x++) {
            ctx.beginPath();
            ctx.moveTo(x * blockSize, 0);
            ctx.lineTo(x * blockSize, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y <= rows; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * blockSize);
            ctx.lineTo(canvas.width, y * blockSize);
            ctx.stroke();
        }
        
        // Line clear flash effect
        if (lineClearFlash > 0) {
            lineClearFlash--;
            ctx.fillStyle = `rgba(255, 255, 255, ${lineClearFlash * 0.03})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // Draw board blocks
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                if (board[y][x]) {
                    drawBlock(x, y, board[y][x]);
                }
            }
        }
        
        // Draw ghost piece (landing preview)
        if (currentPiece) {
            const ghostY = getGhostY();
            if (ghostY !== pieceY) {
                for (let y = 0; y < currentPiece.length; y++) {
                    for (let x = 0; x < currentPiece[y].length; x++) {
                        if (currentPiece[y][x]) {
                            const gx = (pieceX + x) * blockSize;
                            const gy = (ghostY + y) * blockSize;
                            ctx.strokeStyle = currentColor;
                            ctx.globalAlpha = 0.3;
                            ctx.lineWidth = 2;
                            ctx.strokeRect(gx + 1, gy + 1, blockSize - 3, blockSize - 3);
                            ctx.globalAlpha = 1;
                        }
                    }
                }
            }
        }
        
        // Draw current piece
        if (currentPiece) {
            for (let y = 0; y < currentPiece.length; y++) {
                for (let x = 0; x < currentPiece[y].length; x++) {
                    if (currentPiece[y][x]) {
                        drawBlock(pieceX + x, pieceY + y, currentColor);
                    }
                }
            }
        }
        
        // Draw next piece preview
        drawNextPiece();
    }
    
    function drawNextPiece() {
        const nextPiece = tetrisPieces[nextPieceType];
        const previewX = canvas.width - 5;
        const previewY = 10;
        const previewBlockSize = 14;
        
        // Preview background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(previewX - 70, previewY - 5, 68, 60);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(previewX - 70, previewY - 5, 68, 60);
        
        // "NEXT" label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('NEXT', previewX - 36, previewY + 7);
        
        // Draw the piece
        const shape = nextPiece.shape;
        const offsetX = previewX - 36 - (shape[0].length * previewBlockSize) / 2;
        const offsetY = previewY + 18 + (2 - shape.length) * previewBlockSize / 2;
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const bx = offsetX + x * previewBlockSize;
                    const by = offsetY + y * previewBlockSize;
                    const size = previewBlockSize - 1;
                    
                    ctx.fillStyle = nextPiece.color;
                    ctx.fillRect(bx, by, size, size);
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
                    ctx.fillRect(bx, by, size, 2);
                    ctx.fillRect(bx, by, 2, size);
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
                    ctx.fillRect(bx, by + size - 2, size, 2);
                    ctx.fillRect(bx + size - 2, by, 2, size);
                }
            }
        }
    }
    
    function update(time = 0) {
        if (!tetrisGame) return;
        if (gamePaused) {
            lastTime = time;
            tetrisGame = requestAnimationFrame(update);
            return;
        }
        
        const deltaTime = time - lastTime;
        lastTime = time;
        dropCounter += deltaTime;
        
        if (dropCounter > dropInterval) {
            if (currentPiece) {
                pieceY++;
                if (collision()) {
                    pieceY--;
                    mergePiece();
                    clearLines();
                    spawnPiece();
                }
            } else {
                spawnPiece();
            }
            dropCounter = 0;
        }
        
        draw();
        tetrisGame = requestAnimationFrame(update);
    }
    
    function handleKeyPress(e) {
        const gameKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'W', 'a', 'A', 's', 'S', 'd', 'D'];
        if (gameKeys.includes(e.key)) e.preventDefault();
        
        if (!currentPiece) return;
        
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            pieceX--;
            if (collision()) pieceX++;
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            pieceX++;
            if (collision()) pieceX--;
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
            pieceY++;
            if (collision()) {
                pieceY--;
                mergePiece();
                clearLines();
                spawnPiece();
            }
            score += 1; // Soft drop bonus
            const tetrisScoreElement = document.getElementById('tetris-score');
            if (tetrisScoreElement) tetrisScoreElement.textContent = score;
        } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
            rotatePiece();
        } else if (e.key === ' ') {
            let dropDist = 0;
            while (!collision()) {
                pieceY++;
                dropDist++;
            }
            pieceY--;
            dropDist--;
            score += dropDist * 2; // Hard drop bonus
            const tetrisScoreElement = document.getElementById('tetris-score');
            if (tetrisScoreElement) tetrisScoreElement.textContent = score;
            mergePiece();
            clearLines();
            spawnPiece();
        }
    }
    
    document.removeEventListener('keydown', tetrisKeyHandler);
    tetrisKeyHandler = handleKeyPress;
    document.addEventListener('keydown', tetrisKeyHandler);
    
    if (tetrisGame) cancelAnimationFrame(tetrisGame);
    lastTime = performance.now();
    draw();
    tetrisGame = requestAnimationFrame(update);
}

// ==================== PLATFORMER GAME (Side-Scroller) ====================
let platformerGame = null;
let platformerKeyHandler = null;
let platformerKeyUpHandler = null;

function initPlatformer() {
    const canvas = document.getElementById('platformer-canvas');
    const ctx = canvas.getContext('2d');
    
    // World constants
    const WORLD_WIDTH = 6000;
    const GROUND_Y = 370;
    const TILE = 30;
    
    const player = {
        x: 80, y: GROUND_Y - 32,
        width: 28, height: 32,
        vx: 0, vy: 0,
        speed: 4.5, jumpPower: 13.5,
        onGround: false, facingRight: true,
        animFrame: 0, dead: false
    };
    
    let camera = {x: 0};
    let score = 0;
    let gameTime = 0;
    let deathTimeout = null;
    let keys = {};
    
    // ---- Level Generation ----
    // Ground segments (gaps create pits)
    const groundSegments = [
        {x: 0, w: 900},
        {x: 980, w: 600},
        {x: 1680, w: 500},
        {x: 2300, w: 400},
        {x: 2800, w: 700},
        {x: 3600, w: 500},
        {x: 4200, w: 600},
        {x: 4900, w: 1100}
    ];
    
    const platforms = [
        // Section 1: intro
        {x: 300, y: 310, w: 100},
        {x: 500, y: 260, w: 80},
        {x: 700, y: 220, w: 100},
        // Bridge over first pit
        {x: 920, y: 300, w: 60},
        // Section 2
        {x: 1100, y: 310, w: 120},
        {x: 1300, y: 260, w: 80},
        {x: 1480, y: 210, w: 100},
        // Bridge over second pit
        {x: 1600, y: 320, w: 80},
        // Section 3: staircase
        {x: 1800, y: 320, w: 80},
        {x: 1900, y: 270, w: 80},
        {x: 2000, y: 220, w: 80},
        {x: 2100, y: 170, w: 80},
        // Section 4: floating
        {x: 2400, y: 280, w: 100},
        {x: 2600, y: 240, w: 80},
        // Bridge over pit
        {x: 2720, y: 310, w: 80},
        // Section 5
        {x: 3000, y: 300, w: 120},
        {x: 3200, y: 250, w: 100},
        {x: 3400, y: 200, w: 80},
        // Bridge
        {x: 3520, y: 320, w: 80},
        // Section 6
        {x: 3700, y: 290, w: 100},
        {x: 3900, y: 240, w: 80},
        // Bridge
        {x: 4120, y: 310, w: 80},
        // Section 7: final approach
        {x: 4400, y: 300, w: 100},
        {x: 4600, y: 250, w: 80},
        {x: 4800, y: 200, w: 100},
        // High platforms for final coins
        {x: 5000, y: 280, w: 100},
        {x: 5200, y: 240, w: 120},
        {x: 5400, y: 200, w: 100}
    ];
    
    // Moving platforms
    const movingPlatformsInit = [
        {x: 940, y: 250, w: 70, dx: 0, dy: 1, minY: 240, maxY: 330},
        {x: 2200, y: 280, w: 80, dx: 1, dy: 0, minX: 2200, maxX: 2350},
        {x: 3550, y: 270, w: 70, dx: 0, dy: 1, minY: 250, maxY: 340},
        {x: 4150, y: 260, w: 80, dx: 1, dy: 0, minX: 4100, maxX: 4250},
        {x: 5550, y: 300, w: 80, dx: 0, dy: -1, minY: 200, maxY: 340}
    ];
    let movingPlatforms = [];
    
    // Enemies
    const enemiesInit = [
        {x: 400, y: GROUND_Y - 25, w: 25, h: 25, dx: 1, minX: 300, maxX: 600, type: 'walker'},
        {x: 1200, y: GROUND_Y - 25, w: 25, h: 25, dx: -1, minX: 1050, maxX: 1400, type: 'walker'},
        {x: 1850, y: 295, w: 25, h: 25, dx: 1, minX: 1800, maxX: 2050, type: 'walker'},
        {x: 2900, y: GROUND_Y - 25, w: 25, h: 25, dx: 1, minX: 2850, maxX: 3200, type: 'walker'},
        {x: 3200, y: 225, w: 25, h: 25, dx: -1, minX: 3150, maxX: 3350, type: 'walker'},
        {x: 3700, y: GROUND_Y - 25, w: 25, h: 25, dx: 1, minX: 3650, maxX: 3900, type: 'walker'},
        {x: 4400, y: GROUND_Y - 25, w: 25, h: 25, dx: -1, minX: 4300, maxX: 4700, type: 'walker'},
        {x: 5100, y: GROUND_Y - 25, w: 25, h: 25, dx: 1, minX: 4950, maxX: 5300, type: 'walker'},
        // Spike pits (static hazards)
        {x: 950, y: GROUND_Y + 5, w: 30, h: 15, dx: 0, minX: 950, maxX: 950, type: 'spike'},
        {x: 1650, y: GROUND_Y + 5, w: 30, h: 15, dx: 0, minX: 1650, maxX: 1650, type: 'spike'},
        {x: 2750, y: GROUND_Y + 5, w: 30, h: 15, dx: 0, minX: 2750, maxX: 2750, type: 'spike'},
        {x: 4850, y: GROUND_Y + 5, w: 30, h: 15, dx: 0, minX: 4850, maxX: 4850, type: 'spike'}
    ];
    let enemies = [];
    
    // Coins placed along the level
    const coinsInit = [];
    // Ground coins in each section
    [150, 250, 350, 550, 650, 1050, 1150, 1400, 1500, 1750, 1850,
     2350, 2500, 2950, 3050, 3150, 3650, 3800, 4300, 4500, 4700,
     4950, 5050, 5150, 5300, 5500].forEach(cx => {
        coinsInit.push({x: cx, y: GROUND_Y - 40, collected: false, animFrame: Math.random() * 60 | 0});
    });
    // Platform coins (floating above platforms)
    platforms.forEach((p, i) => {
        if (i % 2 === 0) {
            coinsInit.push({x: p.x + p.w / 2 - 10, y: p.y - 35, collected: false, animFrame: Math.random() * 60 | 0});
        }
    });
    // Bonus arc coins over pits
    [930, 945, 960, 1640, 1655, 1670, 2760, 2775, 2790].forEach((cx, i) => {
        coinsInit.push({x: cx, y: 280 - Math.sin((i % 3) / 2 * Math.PI) * 30, collected: false, animFrame: Math.random() * 60 | 0});
    });
    let coins = [];
    
    // Goal flag at end of level
    const goal = {x: WORLD_WIDTH - 150, y: GROUND_Y - 60, w: 30, h: 60, reached: false};
    
    // Background elements
    const clouds = [];
    for (let i = 0; i < 20; i++) {
        clouds.push({x: Math.random() * WORLD_WIDTH, y: 30 + Math.random() * 100, size: 25 + Math.random() * 35});
    }
    const bgMountains = [];
    for (let i = 0; i < 15; i++) {
        bgMountains.push({x: i * 450, w: 300 + Math.random() * 200, h: 80 + Math.random() * 100});
    }
    const bgTrees = [];
    for (let i = 0; i < 40; i++) {
        bgTrees.push({x: 100 + Math.random() * (WORLD_WIDTH - 200), h: 40 + Math.random() * 40});
    }
    
    function resetLevel() {
        player.x = 80;
        player.y = GROUND_Y - 32;
        player.vx = 0;
        player.vy = 0;
        player.onGround = false;
        player.dead = false;
        camera.x = 0;
        
        movingPlatforms = movingPlatformsInit.map(p => ({...p}));
        enemies = enemiesInit.map(e => ({...e, startX: e.x}));
        coins = coinsInit.map(c => ({...c, collected: false}));
        goal.reached = false;
    }
    
    function die() {
        if (player.dead) return;
        player.dead = true;
        const finalScore = score;
        
        deathTimeout = setTimeout(() => {
            deathTimeout = null;
            score = 0;
            const el = document.getElementById('platformer-score');
            if (el) el.textContent = score;
            resetLevel();
            if (finalScore > 0) {
                showGameOver('platformer', finalScore);
            }
        }, 600);
    }
    
    function isOnGround(px, py, pw) {
        for (const seg of groundSegments) {
            if (px + pw > seg.x && px < seg.x + seg.w) {
                if (py + player.height >= GROUND_Y && py + player.height <= GROUND_Y + 10) {
                    return GROUND_Y;
                }
            }
        }
        return null;
    }
    
    function update() {
        if (!platformerGame) return;
        if (gamePaused) {
            platformerGame = requestAnimationFrame(update);
            return;
        }
        
        gameTime++;
        
        if (!player.dead) {
            // Input
            if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
                player.vx = -player.speed;
                player.facingRight = false;
            } else if (keys['ArrowRight'] || keys['d'] || keys['D']) {
                player.vx = player.speed;
                player.facingRight = true;
            } else {
                player.vx *= 0.75;
                if (Math.abs(player.vx) < 0.3) player.vx = 0;
            }
            
            // Gravity
            player.vy += 0.65;
            if (player.vy > 18) player.vy = 18;
            
            // Move X
            player.x += player.vx;
            if (player.x < 0) player.x = 0;
            if (player.x > WORLD_WIDTH - player.width) player.x = WORLD_WIDTH - player.width;
            
            // Move Y
            player.y += player.vy;
            
            // Ground collision
            player.onGround = false;
            const groundHit = isOnGround(player.x, player.y, player.width);
            if (groundHit !== null && player.vy >= 0) {
                player.y = groundHit - player.height;
                player.vy = 0;
                player.onGround = true;
            }
            
            // Static platform collision
            for (const p of platforms) {
                if (player.x + player.width > p.x && player.x < p.x + p.w &&
                    player.y + player.height > p.y && player.y + player.height < p.y + 20 && player.vy >= 0) {
                    player.y = p.y - player.height;
                    player.vy = 0;
                    player.onGround = true;
                }
            }
            
            // Moving platform update & collision
            movingPlatforms.forEach(mp => {
                const oldX = mp.x;
                const oldY = mp.y;
                if (mp.dx !== 0) {
                    mp.x += mp.dx;
                    if (mp.x <= mp.minX || mp.x >= mp.maxX) mp.dx *= -1;
                }
                if (mp.dy !== 0) {
                    mp.y += mp.dy;
                    if (mp.y <= mp.minY || mp.y >= mp.maxY) mp.dy *= -1;
                }
                
                if (player.x + player.width > mp.x && player.x < mp.x + mp.w &&
                    player.y + player.height > mp.y && player.y + player.height < mp.y + 18 && player.vy >= 0) {
                    player.y = mp.y - player.height;
                    player.vy = 0;
                    player.onGround = true;
                    player.x += (mp.x - oldX);
                    player.y += (mp.y - oldY);
                }
            });
            
            // Enemy update & collision
            enemies.forEach(e => {
                if (e.dx !== 0) {
                    e.x += e.dx;
                    if (e.x <= e.minX || e.x >= e.maxX) e.dx *= -1;
                }
                
                if (player.x + player.width > e.x + 3 && player.x + 3 < e.x + e.w &&
                    player.y + player.height > e.y + 3 && player.y + 3 < e.y + e.h) {
                    // Stomp enemy if landing on top (only walkers)
                    if (e.type === 'walker' && player.vy > 0 && player.y + player.height < e.y + e.h / 2) {
                        e.h = 0; // Squish
                        e.dx = 0;
                        player.vy = -8; // Bounce
                        score += 5;
                        const el = document.getElementById('platformer-score');
                        if (el) el.textContent = score;
                    } else if (e.h > 0) {
                        die();
                    }
                }
            });
            
            // Coin collection
            coins.forEach(coin => {
                if (!coin.collected) {
                    coin.animFrame++;
                    if (player.x + player.width > coin.x && player.x < coin.x + 20 &&
                        player.y + player.height > coin.y && player.y < coin.y + 20) {
                        coin.collected = true;
                        score++;
                        const el = document.getElementById('platformer-score');
                        if (el) el.textContent = score;
                    }
                }
            });
            
            // Goal
            if (!goal.reached && player.x + player.width > goal.x && player.x < goal.x + goal.w &&
                player.y + player.height > goal.y && player.y < goal.y + goal.h) {
                goal.reached = true;
                const finalScore = score;
                deathTimeout = setTimeout(() => {
                    deathTimeout = null;
                    showGameOver('platformer', finalScore);
                    score = 0;
                    const el = document.getElementById('platformer-score');
                    if (el) el.textContent = score;
                    resetLevel();
                }, 1000);
            }
            
            // Fall off world
            if (player.y > canvas.height + 100) {
                die();
            }
            
            // Animation frame
            if (Math.abs(player.vx) > 0.5 && player.onGround) {
                player.animFrame += 0.2;
            }
        }
        
        // Camera follows player smoothly
        const targetCamX = player.x - canvas.width * 0.35;
        camera.x += (targetCamX - camera.x) * 0.08;
        if (camera.x < 0) camera.x = 0;
        if (camera.x > WORLD_WIDTH - canvas.width) camera.x = WORLD_WIDTH - canvas.width;
        
        draw();
        platformerGame = requestAnimationFrame(update);
    }
    
    function draw() {
        const cx = camera.x;
        
        // Sky gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        skyGrad.addColorStop(0, '#4A90D9');
        skyGrad.addColorStop(0.5, '#87CEEB');
        skyGrad.addColorStop(1, '#B8E6B8');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Background mountains (parallax)
        ctx.fillStyle = '#8BB8A8';
        bgMountains.forEach(m => {
            const mx = m.x - cx * 0.2;
            ctx.beginPath();
            ctx.moveTo(mx, GROUND_Y);
            ctx.lineTo(mx + m.w / 2, GROUND_Y - m.h);
            ctx.lineTo(mx + m.w, GROUND_Y);
            ctx.fill();
        });
        ctx.fillStyle = '#9FC8B8';
        bgMountains.forEach(m => {
            const mx = m.x + 100 - cx * 0.3;
            ctx.beginPath();
            ctx.moveTo(mx, GROUND_Y);
            ctx.lineTo(mx + m.w * 0.6 / 2, GROUND_Y - m.h * 0.6);
            ctx.lineTo(mx + m.w * 0.6, GROUND_Y);
            ctx.fill();
        });
        
        // Background trees (parallax)
        bgTrees.forEach(t => {
            const tx = t.x - cx * 0.5;
            if (tx > -50 && tx < canvas.width + 50) {
                // Trunk
                ctx.fillStyle = '#5D4037';
                ctx.fillRect(tx - 3, GROUND_Y - t.h, 6, t.h);
                // Leaves
                ctx.fillStyle = '#4CAF50';
                ctx.beginPath();
                ctx.arc(tx, GROUND_Y - t.h - 8, 14, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#388E3C';
                ctx.beginPath();
                ctx.arc(tx + 5, GROUND_Y - t.h - 3, 10, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        // Clouds (parallax)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        clouds.forEach(cloud => {
            const cloudX = cloud.x - cx * 0.1 + gameTime * 0.05;
            const wrappedX = ((cloudX % (WORLD_WIDTH + 200)) + WORLD_WIDTH + 200) % (WORLD_WIDTH + 200) - 100;
            const sx = wrappedX - cx * 0.1;
            if (sx > -100 && sx < canvas.width + 100) {
                ctx.beginPath();
                ctx.arc(sx, cloud.y, cloud.size, 0, Math.PI * 2);
                ctx.arc(sx + cloud.size * 0.7, cloud.y - cloud.size * 0.1, cloud.size * 0.8, 0, Math.PI * 2);
                ctx.arc(sx + cloud.size * 1.3, cloud.y, cloud.size * 0.65, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        // Ground segments
        groundSegments.forEach(seg => {
            const sx = seg.x - cx;
            if (sx + seg.w > 0 && sx < canvas.width) {
                // Dirt
                ctx.fillStyle = '#8B6914';
                ctx.fillRect(sx, GROUND_Y, seg.w, canvas.height - GROUND_Y);
                // Grass layer
                const grassGrad = ctx.createLinearGradient(0, GROUND_Y, 0, GROUND_Y + 8);
                grassGrad.addColorStop(0, '#6ABF4B');
                grassGrad.addColorStop(1, '#4CAF50');
                ctx.fillStyle = grassGrad;
                ctx.fillRect(sx, GROUND_Y, seg.w, 8);
                // Dirt texture lines
                ctx.strokeStyle = 'rgba(100, 60, 10, 0.2)';
                ctx.lineWidth = 1;
                for (let i = 0; i < seg.w; i += 30) {
                    ctx.beginPath();
                    ctx.moveTo(sx + i, GROUND_Y + 15);
                    ctx.lineTo(sx + i + 15, GROUND_Y + 25);
                    ctx.stroke();
                }
            }
        });
        
        // Static platforms
        platforms.forEach(p => {
            const px = p.x - cx;
            if (px + p.w > -10 && px < canvas.width + 10) {
                // Shadow
                ctx.fillStyle = 'rgba(0,0,0,0.15)';
                ctx.fillRect(px + 3, p.y + 3, p.w, 15);
                // Platform body
                const pGrad = ctx.createLinearGradient(0, p.y, 0, p.y + 15);
                pGrad.addColorStop(0, '#A0522D');
                pGrad.addColorStop(1, '#6B3410');
                ctx.fillStyle = pGrad;
                ctx.fillRect(px, p.y, p.w, 15);
                // Highlight
                ctx.fillStyle = 'rgba(255,255,255,0.2)';
                ctx.fillRect(px, p.y, p.w, 3);
                // Brick lines
                ctx.strokeStyle = 'rgba(0,0,0,0.15)';
                ctx.lineWidth = 1;
                for (let i = 0; i < p.w; i += 20) {
                    ctx.beginPath();
                    ctx.moveTo(px + i, p.y);
                    ctx.lineTo(px + i, p.y + 15);
                    ctx.stroke();
                }
            }
        });
        
        // Moving platforms
        movingPlatforms.forEach(mp => {
            const px = mp.x - cx;
            if (px + mp.w > -10 && px < canvas.width + 10) {
                ctx.fillStyle = 'rgba(0,0,0,0.15)';
                ctx.fillRect(px + 2, mp.y + 2, mp.w, 12);
                const mpGrad = ctx.createLinearGradient(0, mp.y, 0, mp.y + 12);
                mpGrad.addColorStop(0, '#FF9800');
                mpGrad.addColorStop(1, '#E65100');
                ctx.fillStyle = mpGrad;
                ctx.fillRect(px, mp.y, mp.w, 12);
                // Arrows
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(mp.dy !== 0 ? '↕' : '↔', px + mp.w / 2, mp.y + 10);
            }
        });
        
        // Enemies
        enemies.forEach(e => {
            if (e.h <= 0) return; // Squished
            const ex = e.x - cx;
            if (ex + e.w > -10 && ex < canvas.width + 10) {
                if (e.type === 'spike') {
                    // Spike hazard
                    ctx.fillStyle = '#777';
                    for (let i = 0; i < 3; i++) {
                        ctx.beginPath();
                        ctx.moveTo(ex + i * 10, e.y + e.h);
                        ctx.lineTo(ex + i * 10 + 5, e.y);
                        ctx.lineTo(ex + i * 10 + 10, e.y + e.h);
                        ctx.fill();
                    }
                } else {
                    // Walker enemy (goomba-like)
                    ctx.fillStyle = '#C62828';
                    ctx.beginPath();
                    ctx.arc(ex + e.w / 2, e.y + e.h / 2, e.w / 2, 0, Math.PI * 2);
                    ctx.fill();
                    // Feet
                    ctx.fillStyle = '#8B0000';
                    ctx.fillRect(ex + 2, e.y + e.h - 6, 8, 6);
                    ctx.fillRect(ex + e.w - 10, e.y + e.h - 6, 8, 6);
                    // Eyes
                    ctx.fillStyle = '#FFF';
                    ctx.beginPath();
                    ctx.arc(ex + e.w * 0.35, e.y + e.h * 0.35, 4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(ex + e.w * 0.65, e.y + e.h * 0.35, 4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#000';
                    const eyeOff = e.dx > 0 ? 1 : -1;
                    ctx.beginPath();
                    ctx.arc(ex + e.w * 0.35 + eyeOff, e.y + e.h * 0.37, 2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(ex + e.w * 0.65 + eyeOff, e.y + e.h * 0.37, 2, 0, Math.PI * 2);
                    ctx.fill();
                    // Angry brows
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(ex + e.w * 0.2, e.y + e.h * 0.25);
                    ctx.lineTo(ex + e.w * 0.45, e.y + e.h * 0.2);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(ex + e.w * 0.8, e.y + e.h * 0.25);
                    ctx.lineTo(ex + e.w * 0.55, e.y + e.h * 0.2);
                    ctx.stroke();
                }
            }
        });
        
        // Coins
        coins.forEach(coin => {
            if (coin.collected) return;
            const coinX = coin.x - cx;
            if (coinX > -20 && coinX < canvas.width + 20) {
                const bounce = Math.sin(coin.animFrame * 0.08) * 3;
                const squash = 0.6 + Math.abs(Math.cos(coin.animFrame * 0.06)) * 0.4;
                ctx.save();
                ctx.translate(coinX + 10, coin.y + 10 + bounce);
                ctx.scale(squash, 1);
                // Outer
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(0, 0, 10, 0, Math.PI * 2);
                ctx.fill();
                // Inner
                ctx.fillStyle = '#FFC107';
                ctx.beginPath();
                ctx.arc(0, 0, 7, 0, Math.PI * 2);
                ctx.fill();
                // Shine
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.beginPath();
                ctx.arc(-2, -3, 3, 0, Math.PI * 2);
                ctx.fill();
                // $ symbol
                ctx.fillStyle = '#B8860B';
                ctx.font = 'bold 10px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('$', 0, 1);
                ctx.restore();
            }
        });
        
        // Goal flag
        if (!goal.reached) {
            const gx = goal.x - cx;
            if (gx > -40 && gx < canvas.width + 40) {
                // Pole
                ctx.fillStyle = '#555';
                ctx.fillRect(gx + 12, goal.y - 20, 5, goal.h + 20);
                // Ball on top
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(gx + 14, goal.y - 22, 5, 0, Math.PI * 2);
                ctx.fill();
                // Flag
                const wave = Math.sin(gameTime * 0.05) * 3;
                ctx.fillStyle = '#E53935';
                ctx.beginPath();
                ctx.moveTo(gx + 17, goal.y - 18);
                ctx.lineTo(gx + 40 + wave, goal.y - 12);
                ctx.lineTo(gx + 38 + wave, goal.y - 5);
                ctx.lineTo(gx + 17, goal.y);
                ctx.fill();
                // Star on flag
                ctx.fillStyle = '#FFD700';
                ctx.font = '12px Arial';
                ctx.fillText('★', gx + 24 + wave * 0.5, goal.y - 6);
                // "GOAL" text
                ctx.fillStyle = 'rgba(255,255,255,0.8)';
                ctx.font = 'bold 11px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('GOAL', gx + 14, goal.y - 30);
            }
        }
        
        // Player
        if (!player.dead || gameTime % 6 < 3) { // Blink when dead
            const px = player.x - cx;
            const py = player.y;
            
            // Shadow
            if (player.onGround) {
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.beginPath();
                ctx.ellipse(px + player.width / 2, py + player.height + 2, 12, 4, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Body
            ctx.fillStyle = '#E53935';
            ctx.fillRect(px + 4, py + 12, player.width - 8, player.height - 12);
            
            // Head
            ctx.fillStyle = '#FFCC80';
            ctx.beginPath();
            ctx.arc(px + player.width / 2, py + 10, 10, 0, Math.PI * 2);
            ctx.fill();
            
            // Hat
            ctx.fillStyle = '#1565C0';
            ctx.beginPath();
            ctx.arc(px + player.width / 2, py + 6, 11, Math.PI, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(px + 1, py + 5, player.width - 2, 4);
            
            // Eyes
            ctx.fillStyle = '#FFF';
            const eyeBaseX = player.facingRight ? 3 : -3;
            ctx.beginPath();
            ctx.arc(px + player.width / 2 - 4 + eyeBaseX * 0.3, py + 10, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(px + player.width / 2 + 4 + eyeBaseX * 0.3, py + 10, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            const pupilOff = player.facingRight ? 1 : -1;
            ctx.beginPath();
            ctx.arc(px + player.width / 2 - 4 + eyeBaseX * 0.3 + pupilOff, py + 10, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(px + player.width / 2 + 4 + eyeBaseX * 0.3 + pupilOff, py + 10, 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Legs (animated)
            ctx.fillStyle = '#1565C0';
            const legAnim = player.onGround ? Math.sin(player.animFrame) * 3 : 0;
            ctx.fillRect(px + 6, py + player.height - 4, 6, 6 + legAnim);
            ctx.fillRect(px + player.width - 12, py + player.height - 4, 6, 6 - legAnim);
        }
        
        // HUD: progress bar
        const progress = player.x / WORLD_WIDTH;
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(10, 10, 150, 8);
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(10, 10, 150 * progress, 8);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(10, 10, 150, 8);
        // Player dot on progress bar
        ctx.fillStyle = '#FF5722';
        ctx.beginPath();
        ctx.arc(10 + 150 * progress, 14, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    function handleKeyDown(e) {
        const gameKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'w', 'W', 'a', 'A', 's', 'S', 'd', 'D'];
        if (gameKeys.includes(e.key)) e.preventDefault();
        
        keys[e.key] = true;
        if ((e.key === ' ' || e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') && player.onGround && !player.dead) {
            player.vy = -player.jumpPower;
            player.onGround = false;
        }
    }
    
    function handleKeyUp(e) {
        keys[e.key] = false;
    }
    
    // Cleanup & init
    document.removeEventListener('keydown', platformerKeyHandler);
    document.removeEventListener('keyup', platformerKeyUpHandler);
    platformerKeyHandler = handleKeyDown;
    platformerKeyUpHandler = handleKeyUp;
    document.addEventListener('keydown', platformerKeyHandler);
    document.addEventListener('keyup', platformerKeyUpHandler);
    
    if (deathTimeout) { clearTimeout(deathTimeout); deathTimeout = null; }
    if (platformerGame) cancelAnimationFrame(platformerGame);
    
    score = 0;
    const el = document.getElementById('platformer-score');
    if (el) el.textContent = score;
    resetLevel();
    draw();
    platformerGame = requestAnimationFrame(update);
}

