// programs/mines.js - ZebOS 2 Retro Minesweeper Application
import { getIcon } from '../icons.js';

export class MinesweeperGame {
    constructor(onCloseRequest) {
        this.onCloseRequest = onCloseRequest;

        this.bodyElement = null;
        this.rows = 9;
        this.cols = 9;
        this.totalMines = 10;

        this.grid = [];
        this.mineLocations = new Set();
        this.revealedCount = 0;
        this.flagsLeft = this.totalMines;
        this.gameStarted = false;
        this.gameOver = false;
        this.timerSeconds = 0;
        this.timerInterval = null;

        this.faceEl = null;
        this.mineCounterEl = null;
        this.timerCounterEl = null;

        this.boundKeyDown = (e) => this.handleKeyDown(e);
    }

    open(windowBodyElement) {
        this.bodyElement = windowBodyElement;
        this.bodyElement.style.height = "100%";

        this.bodyElement.innerHTML = `
            <div style="display:flex; flex-direction:column; height:100%; background:#c0c0c0; border:2px solid #ffffff; border-right-color:#808080; border-bottom-color:#808080; padding:10px; box-sizing:border-box; user-select:none; font-family:sans-serif; align-items:center;">
                
                <!-- Win95 Inset Counter & Reset Header Panel -->
                <div style="width:100%; max-width:240px; background:#c0c0c0; border:2px solid #808080; border-right-color:#ffffff; border-bottom-color:#ffffff; padding:6px 10px; box-sizing:border-box; display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">
                    <!-- Mine Counter Digital Box -->
                    <div class="mines-lcd mines-counter" style="background:#000000; color:#ff0000; font-family:'Courier New', monospace; font-size:22px; font-weight:bold; width:52px; text-align:center; border:1px solid #808080; padding:2px;">010</div>
                    
                    <!-- Reset Smiley Face Button -->
                    <button class="mines-face-btn" style="width:34px; height:34px; background:#c0c0c0; border:2px solid #ffffff; border-right-color:#000000; border-bottom-color:#000000; cursor:pointer; display:flex; align-items:center; justify-content:center; padding:2px;">
                        ${getIcon('smileyNormal')}
                    </button>
                    
                    <!-- Timer Counter Digital Box -->
                    <div class="mines-lcd mines-timer" style="background:#000000; color:#ff0000; font-family:'Courier New', monospace; font-size:22px; font-weight:bold; width:52px; text-align:center; border:1px solid #808080; padding:2px;">000</div>
                </div>

                <!-- Minesweeper Cell Grid -->
                <div class="mines-grid" style="display:grid; grid-template-columns:repeat(9, 24px); grid-template-rows:repeat(9, 24px); gap:0; border:3px solid #808080; border-right-color:#ffffff; border-bottom-color:#ffffff; background:#c0c0c0;"></div>
            </div>
        `;

        this.faceEl = this.bodyElement.querySelector('.mines-face-btn');
        this.mineCounterEl = this.bodyElement.querySelector('.mines-counter');
        this.timerCounterEl = this.bodyElement.querySelector('.mines-timer');

        this.faceEl.addEventListener('click', () => this.resetGame());
        window.addEventListener('keydown', this.boundKeyDown);

        this.resetGame();
    }

    resetGame() {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        this.timerSeconds = 0;
        this.gameStarted = false;
        this.gameOver = false;
        this.revealedCount = 0;
        this.flagsLeft = this.totalMines;

        this.timerCounterEl.textContent = "000";
        this.mineCounterEl.textContent = this.totalMines.toString().padStart(3, '0');
        this.faceEl.innerHTML = getIcon('smileyNormal');

        const gridContainer = this.bodyElement.querySelector('.mines-grid');
        gridContainer.innerHTML = '';

        this.grid = [];
        this.mineLocations.clear();

        // Generate cells
        for (let r = 0; r < this.rows; r++) {
            const rowArr = [];
            for (let c = 0; c < this.cols; c++) {
                const cellBtn = document.createElement('div');
                cellBtn.className = 'mines-cell unrevealed';
                cellBtn.style.cssText = `
                    width:24px; height:24px; box-sizing:border-box;
                    background:#c0c0c0; border:2px solid #ffffff;
                    border-right-color:#707070; border-bottom-color:#707070;
                    display:flex; align-items:center; justify-content:center;
                    font-weight:bold; font-size:13px; cursor:pointer;
                `;

                cellBtn.addEventListener('mousedown', (e) => {
                    if (this.gameOver) return;
                    if (e.button === 0 && !cellBtn.classList.contains('flagged')) {
                        this.faceEl.innerHTML = getIcon('smileyPressed');
                    }
                });

                cellBtn.addEventListener('mouseup', (e) => {
                    if (this.gameOver) return;
                    this.faceEl.innerHTML = getIcon('smileyNormal');
                });

                cellBtn.addEventListener('click', () => this.handleCellClick(r, c));
                cellBtn.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.handleCellRightClick(r, c);
                });

                gridContainer.appendChild(cellBtn);
                rowArr.push({
                    r, c,
                    element: cellBtn,
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    neighborMines: 0
                });
            }
            this.grid.push(rowArr);
        }
    }

    startFirstMove(firstR, firstC) {
        this.gameStarted = true;
        // Place 10 mines ensuring first clicked cell is safe
        while (this.mineLocations.size < this.totalMines) {
            const r = Math.floor(Math.random() * this.rows);
            const c = Math.floor(Math.random() * this.cols);
            if (r === firstR && c === firstC) continue;
            const key = `${r},${c}`;
            if (!this.mineLocations.has(key)) {
                this.mineLocations.add(key);
                this.grid[r][c].isMine = true;
            }
        }

        // Calculate neighbor numbers
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.grid[r][c].isMine) continue;
                let count = 0;
                this.forEachNeighbor(r, c, (nr, nc) => {
                    if (this.grid[nr][nc].isMine) count++;
                });
                this.grid[r][c].neighborMines = count;
            }
        }

        // Start timer
        this.timerInterval = setInterval(() => {
            if (this.timerSeconds < 999) {
                this.timerSeconds++;
                this.timerCounterEl.textContent = this.timerSeconds.toString().padStart(3, '0');
            }
        }, 1000);
    }

    forEachNeighbor(r, c, callback) {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                    callback(nr, nc);
                }
            }
        }
    }

    handleCellClick(r, c) {
        if (this.gameOver) return;
        const cell = this.grid[r][c];
        if (cell.isRevealed || cell.isFlagged) return;

        if (!this.gameStarted) {
            this.startFirstMove(r, c);
        }

        if (cell.isMine) {
            this.triggerLoss(cell);
            return;
        }

        this.revealCell(r, c);

        // Check win condition
        if (this.revealedCount === (this.rows * this.cols - this.totalMines)) {
            this.triggerWin();
        }
    }

    revealCell(r, c) {
        const cell = this.grid[r][c];
        if (cell.isRevealed || cell.isFlagged) return;

        cell.isRevealed = true;
        this.revealedCount++;
        cell.element.style.border = "1px solid #707070";
        cell.element.style.background = "#e0e0e0";

        if (cell.neighborMines > 0) {
            const colors = ['', '#0000ff', '#008100', '#ff0000', '#000080', '#800000', '#008080', '#000000', '#808080'];
            cell.element.style.color = colors[cell.neighborMines];
            cell.element.textContent = cell.neighborMines;
        } else {
            // Auto reveal neighbors
            this.forEachNeighbor(r, c, (nr, nc) => {
                if (!this.grid[nr][nc].isRevealed) {
                    this.revealCell(nr, nc);
                }
            });
        }
    }

    handleCellRightClick(r, c) {
        if (this.gameOver) return;
        const cell = this.grid[r][c];
        if (cell.isRevealed) return;

        if (!cell.isFlagged) {
            if (this.flagsLeft > 0) {
                cell.isFlagged = true;
                cell.element.innerHTML = getIcon('flag');
                this.flagsLeft--;
            }
        } else {
            cell.isFlagged = false;
            cell.element.innerHTML = '';
            this.flagsLeft++;
        }
        this.mineCounterEl.textContent = Math.max(0, this.flagsLeft).toString().padStart(3, '0');
    }

    triggerLoss(hitCell) {
        this.gameOver = true;
        clearInterval(this.timerInterval);
        this.faceEl.innerHTML = getIcon('smileyDead');

        hitCell.element.style.background = "#ff5555";
        hitCell.element.innerHTML = getIcon('mines');

        // Reveal all remaining mines
        this.mineLocations.forEach(key => {
            const [r, c] = key.split(',').map(Number);
            const cell = this.grid[r][c];
            if (!cell.isFlagged) {
                cell.element.style.background = "#d0d0d0";
                cell.element.innerHTML = getIcon('mines');
            }
        });
    }

    triggerWin() {
        this.gameOver = true;
        clearInterval(this.timerInterval);
        this.faceEl.innerHTML = getIcon('smileyCool');
        this.mineCounterEl.textContent = "000";

        // Auto flag all mines
        this.mineLocations.forEach(key => {
            const [r, c] = key.split(',').map(Number);
            const cell = this.grid[r][c];
            if (!cell.isFlagged) {
                cell.isFlagged = true;
                cell.element.innerHTML = getIcon('flag');
            }
        });
    }

    handleKeyDown(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            this.onCloseRequest();
        }
    }

    cleanup() {
        clearInterval(this.timerInterval);
        window.removeEventListener('keydown', this.boundKeyDown);
    }
}
