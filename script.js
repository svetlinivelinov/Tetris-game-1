const COLS = 10;
const ROWS = 20;
const CELL_SIZE = 30;

// Tetromino shapes
const TETROMINOES = {
    I: { shape: [[1, 1, 1, 1]], color: 'I' },
    O: { shape: [[1, 1], [1, 1]], color: 'O' },
    T: { shape: [[0, 1, 0], [1, 1, 1]], color: 'T' },
    S: { shape: [[0, 1, 1], [1, 1, 0]], color: 'S' },
    Z: { shape: [[1, 1, 0], [0, 1, 1]], color: 'Z' },
    L: { shape: [[1, 0], [1, 0], [1, 1]], color: 'L' },
    J: { shape: [[0, 1], [0, 1], [1, 1]], color: 'J' }
};

class Tetris {
    constructor() {
        this.board = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
        this.gameBoard = document.getElementById('gameBoard');
        this.nextPreview = document.getElementById('nextPreview');
        this.scoreDisplay = document.getElementById('score');
        this.levelDisplay = document.getElementById('level');
        this.linesDisplay = document.getElementById('lines');
        this.gameOverModal = document.getElementById('gameOverModal');
        this.finalScore = document.getElementById('finalScore');
        this.finalLevel = document.getElementById('finalLevel');

        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameRunning = false;
        this.gamePaused = false;
        this.currentPiece = null;
        this.nextPiece = null;
        this.dropSpeed = 1000;

        this.initializeBoard();
        this.attachEventListeners();
        this.generateNextPiece();
    }

    initializeBoard() {
        this.gameBoard.innerHTML = '';
        for (let i = 0; i < ROWS * COLS; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.id = `cell-${i}`;
            this.gameBoard.appendChild(cell);
        }
    }

    attachEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('resetBtn').addEventListener('click', () => location.reload());

        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning || this.gamePaused) return;

            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.movePiece(1, 0);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.movePiece(0, 1);
                    break;
                case ' ':
                    e.preventDefault();
                    this.rotatePiece();
                    break;
                case 'p':
                case 'P':
                    this.togglePause();
                    break;
            }
        });
    }

    start() {
        if (this.gameRunning) return;

        this.gameRunning = true;
        this.gamePaused = false;
        document.getElementById('startBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;

        this.spawnPiece();
        this.gameLoop();
    }

    togglePause() {
        if (!this.gameRunning) return;

        this.gamePaused = !this.gamePaused;
        const pauseBtn = document.getElementById('pauseBtn');
        pauseBtn.textContent = this.gamePaused ? 'Resume' : 'Pause';
    }

    generateNextPiece() {
        const types = Object.keys(TETROMINOES);
        const randomType = types[Math.floor(Math.random() * types.length)];
        this.nextPiece = {
            type: randomType,
            shape: TETROMINOES[randomType].shape,
            color: TETROMINOES[randomType].color,
            x: 3,
            y: 0
        };
        this.updateNextPreview();
    }

    spawnPiece() {
        this.currentPiece = this.nextPiece;
        this.generateNextPiece();

        if (!this.isValidMove(this.currentPiece.x, this.currentPiece.y, this.currentPiece.shape)) {
            this.endGame();
            return;
        }
    }

    isValidMove(x, y, shape) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const newX = x + col;
                    const newY = y + row;

                    if (newX < 0 || newX >= COLS || newY >= ROWS) {
                        return false;
                    }

                    if (newY >= 0 && this.board[newY][newX] !== null) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    movePiece(dx, dy) {
        if (this.isValidMove(this.currentPiece.x + dx, this.currentPiece.y + dy, this.currentPiece.shape)) {
            this.currentPiece.x += dx;
            this.currentPiece.y += dy;
        } else if (dy > 0) {
            this.lockPiece();
        }
    }

    rotatePiece() {
        const shape = this.currentPiece.shape;
        const rotated = this.rotateMatrix(shape);

        if (this.isValidMove(this.currentPiece.x, this.currentPiece.y, rotated)) {
            this.currentPiece.shape = rotated;
        }
    }

    rotateMatrix(matrix) {
        const n = matrix.length;
        const m = matrix[0].length;
        const rotated = Array(m).fill(null).map(() => Array(n).fill(0));

        for (let row = 0; row < n; row++) {
            for (let col = 0; col < m; col++) {
                rotated[col][n - 1 - row] = matrix[row][col];
            }
        }

        return rotated;
    }

    lockPiece() {
        const shape = this.currentPiece.shape;
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const x = this.currentPiece.x + col;
                    const y = this.currentPiece.y + row;

                    if (y >= 0) {
                        this.board[y][x] = this.currentPiece.color;
                    }
                }
            }
        }

        this.clearLines();
        this.spawnPiece();
    }

    clearLines() {
        let linesCleared = 0;

        for (let row = ROWS - 1; row >= 0; row--) {
            if (this.board[row].every(cell => cell !== null)) {
                this.board.splice(row, 1);
                this.board.unshift(Array(COLS).fill(null));
                linesCleared++;
                row++;
            }
        }

        if (linesCleared > 0) {
            this.updateScore(linesCleared);
        }
    }

    updateScore(linesCleared) {
        const points = [0, 100, 300, 500, 800];
        this.score += points[linesCleared] * this.level;
        this.lines += linesCleared;

        const newLevel = Math.floor(this.lines / 10) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.dropSpeed = Math.max(100, 1000 - (this.level - 1) * 100);
        }

        this.updateDisplay();
    }

    updateDisplay() {
        this.scoreDisplay.textContent = this.score;
        this.levelDisplay.textContent = this.level;
        this.linesDisplay.textContent = this.lines;
    }

    updateNextPreview() {
        this.nextPreview.innerHTML = '';
        const shape = this.nextPiece.shape;
        const cells = Array(16).fill(null);

        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    cells[row * 4 + col] = this.nextPiece.color;
                }
            }
        }

        cells.forEach(color => {
            const cell = document.createElement('div');
            cell.className = 'cell';
            if (color) {
                cell.classList.add('filled', color);
            }
            this.nextPreview.appendChild(cell);
        });
    }

    render() {
        // Clear board display
        for (let i = 0; i < ROWS * COLS; i++) {
            const cell = document.getElementById(`cell-${i}`);
            cell.className = 'cell';
        }

        // Draw locked pieces
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                if (this.board[row][col] !== null) {
                    const index = row * COLS + col;
                    const cell = document.getElementById(`cell-${index}`);
                    cell.classList.add('filled', this.board[row][col]);
                }
            }
        }

        // Draw current piece
        if (this.currentPiece) {
            const shape = this.currentPiece.shape;
            for (let row = 0; row < shape.length; row++) {
                for (let col = 0; col < shape[row].length; col++) {
                    if (shape[row][col]) {
                        const x = this.currentPiece.x + col;
                        const y = this.currentPiece.y + row;

                        if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
                            const index = y * COLS + x;
                            const cell = document.getElementById(`cell-${index}`);
                            cell.classList.add('filled', this.currentPiece.color);
                        }
                    }
                }
            }
        }
    }

    gameLoop() {
        const interval = setInterval(() => {
            if (!this.gameRunning) {
                clearInterval(interval);
                return;
            }

            if (!this.gamePaused) {
                this.movePiece(0, 1);
                this.render();
            }
        }, this.dropSpeed);
    }

    endGame() {
        this.gameRunning = false;
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('pauseBtn').textContent = 'Pause';

        this.finalScore.textContent = this.score;
        this.finalLevel.textContent = this.level;
        this.gameOverModal.classList.add('show');
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new Tetris();
});
