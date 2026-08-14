// This is a simple Klondike Solitaire game for ZebOS
import { BaseApp } from '../UIKit/framework/index.js';
import { Telemetry } from '../telemetry/index.js';

const SUITS = ['S', 'H', 'D', 'C'];
const SUIT_GLYPH = { S: '♠', H: '♥', D: '♦', C: '♣' };
const FAN_OFFSET = 24;

function isRed(suit) { return suit === 'H' || suit === 'D'; }
function isOppositeColor(a, b) { return isRed(a) !== isRed(b); }
function rankLabel(rank) {
    if (rank === 1) return 'A';
    if (rank === 11) return 'J';
    if (rank === 12) return 'Q';
    if (rank === 13) return 'K';
    return String(rank);
}
function cardInnerHtml(card) {
    const glyph = SUIT_GLYPH[card.suit];
    return `<div class="card-rank-top">${rankLabel(card.rank)}${glyph}</div><div class="card-suit-big">${glyph}</div>`;
}

export class SolitaireGame extends BaseApp {
    constructor(onCloseRequest) {
        super(onCloseRequest);
        this.bodyElement = null;

        this.tableau = [];
        this.stock = [];
        this.waste = [];
        this.foundations = { S: [], H: [], D: [], C: [] };
        this.won = false;
        this.dragState = null;

        this.boundKeyDown = (e) => this.handleKeyDown(e);
        this.boundMouseMove = (e) => this.handleDragMove(e);
        this.boundMouseUp = (e) => this.handleDragEnd(e);

        this.dealNewGame();
    }

    mount() {
        Telemetry.mark('solitaire-mount-start');
        this.bodyElement = this.body;
        this.bodyElement.style.height = "100%";
        this.listen(window, 'keydown', this.boundKeyDown);
        this.renderUI();
        Telemetry.measure('solitaire-mount', 'solitaire-mount-start');
    }

    buildShuffledDeck() {
        const deck = [];
        for (const suit of SUITS) {
            for (let rank = 1; rank <= 13; rank++) deck.push({ suit, rank, faceUp: false });
        }
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }

    dealNewGame() {
        Telemetry.mark('solitaire-deal-start');
        if (this.dragState) {
            this.dragState.ghostEls.forEach(el => el.remove());
            document.removeEventListener('mousemove', this.boundMouseMove);
            document.removeEventListener('mouseup', this.boundMouseUp);
            this.dragState = null;
        }
        const deck = this.buildShuffledDeck();
        this.tableau = Array.from({ length: 7 }, () => []);
        for (let col = 0; col < 7; col++) {
            for (let i = 0; i <= col; i++) {
                const card = deck.pop();
                card.faceUp = (i === col);
                this.tableau[col].push(card);
            }
        }
        this.stock = deck;
        this.waste = [];
        this.foundations = { S: [], H: [], D: [], C: [] };
        this.won = false;
        Telemetry.measure('solitaire-deal', 'solitaire-deal-start');
    }

    // Rendering stuff. This took way too long.
    renderUI() {
        if (!this.bodyElement) return;

        this.bodyElement.innerHTML = `
            <div style="display:flex; flex-direction:column; height:100%; background:#c0c0c0; font-family:Arial, sans-serif; box-sizing:border-box;">
                <div style="padding:6px 8px; border-bottom:2px solid #808080; display:flex; align-items:center; gap:10px; flex-shrink:0;">
                    <button class="app-toolbar-btn solitaire-new-game-btn">New Game</button>
                    <div style="flex-grow:1; text-align:right; font-size:12px; color:#333;">Draw 1 &middot; Double-click a card to send it to a foundation</div>
                </div>
                <div class="solitaire-table" style="flex-grow:1; overflow:auto; position:relative;">
                    <div style="display:flex; gap:14px; margin-bottom:20px;">
                        ${this.renderStockAndWaste()}
                        <div style="flex-grow:1;"></div>
                        ${this.renderFoundations()}
                    </div>
                    <div style="display:flex; gap:14px;">
                        ${this.renderTableau()}
                    </div>
                    ${this.won ? this.renderWinBanner() : ''}
                </div>
            </div>
        `;

        this.bindEvents();
    }

    renderStockAndWaste() {
        const stockInner = this.stock.length > 0
            ? `<div class="solitaire-card face-down" style="position:absolute; top:0; left:0;"></div>`
            : (this.waste.length > 0 ? `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:24px; color:rgba(255,255,255,0.7);">&#8635;</div>` : '');

        const wasteTop = this.waste.length > 0 ? this.waste[this.waste.length - 1] : null;
        const wasteInner = wasteTop
            ? `<div class="solitaire-card ${isRed(wasteTop.suit) ? 'red-suit' : 'black-suit'}" data-pile-source="waste" data-drag="true" style="position:absolute; top:0; left:0;">${cardInnerHtml(wasteTop)}</div>`
            : '';

        return `
            <div class="solitaire-pile-slot" data-pile="stock">${stockInner}</div>
            <div class="solitaire-pile-slot" data-pile="waste">${wasteInner}</div>
        `;
    }

    renderFoundations() {
        return SUITS.map(suit => {
            const pile = this.foundations[suit];
            const top = pile.length ? pile[pile.length - 1] : null;
            const inner = top
                ? `<div class="solitaire-card ${isRed(suit) ? 'red-suit' : 'black-suit'}" data-pile-source="foundation-${suit}" data-drag="true" style="position:absolute; top:0; left:0;">${cardInnerHtml(top)}</div>`
                : `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:22px; color:rgba(255,255,255,0.35);">${SUIT_GLYPH[suit]}</div>`;
            return `<div class="solitaire-pile-slot" data-pile="foundation-${suit}">${inner}</div>`;
        }).join('');
    }

    renderTableau() {
        return this.tableau.map((col, colIndex) => {
            const cards = col.map((card, idx) => {
                const faceClass = card.faceUp ? (isRed(card.suit) ? 'red-suit' : 'black-suit') : 'face-down';
                const draggable = card.faceUp ? `data-pile-source="tableau-${colIndex}" data-idx="${idx}" data-drag="true"` : '';
                return `<div class="solitaire-card ${faceClass}" ${draggable} style="position:absolute; top:${idx * FAN_OFFSET}px; left:0;">${card.faceUp ? cardInnerHtml(card) : ''}</div>`;
            }).join('');
            return `<div class="solitaire-pile-slot" data-pile="tableau-${colIndex}" style="min-height:320px; border-style:${col.length ? 'none' : 'dashed'};">${cards}</div>`;
        }).join('');
    }

    renderWinBanner() {
        return `
            <div style="position:absolute; inset:0; background:rgba(0,0,0,0.55); display:flex; align-items:center; justify-content:center; z-index:10;">
                <div style="background:#c0c0c0; border:2px solid #ffffff; border-right-color:#000; border-bottom-color:#000; padding:20px 28px; text-align:center; font-weight:bold; font-size:16px;">
                    You Win!<br>
                    <button class="app-toolbar-btn solitaire-win-newgame-btn" style="margin-top:12px;">Play Again</button>
                </div>
            </div>
        `;
    }

    // events
    bindEvents() {
        this.bodyElement.querySelectorAll('.solitaire-new-game-btn, .solitaire-win-newgame-btn').forEach(btn => {
            btn.addEventListener('click', () => { this.dealNewGame(); this.renderUI(); });
        });

        const stockSlot = this.bodyElement.querySelector('[data-pile="stock"]');
        if (stockSlot) stockSlot.addEventListener('click', () => this.handleStockClick());

        this.bodyElement.querySelectorAll('[data-drag="true"]').forEach(el => {
            el.addEventListener('mousedown', (e) => {
                if (e.button !== 0) return;
                this.beginDrag(e, el);
            });
            el.addEventListener('dblclick', () => this.handleDoubleClick(el));
        });
    }

    handleStockClick() {
        if (this.stock.length > 0) {
            const card = this.stock.pop();
            card.faceUp = true;
            this.waste.push(card);
        } else if (this.waste.length > 0) {
            this.waste.reverse().forEach(c => { c.faceUp = false; });
            this.stock = this.waste;
            this.waste = [];
        } else {
            return;
        }
        this.renderUI();
    }

    handleDoubleClick(el) {
        const sourcePileId = el.dataset.pileSource;
        const card = this.resolveTopCardForSource(sourcePileId);
        if (!card) return;
        if (this.tryMove(sourcePileId, [card], `foundation-${card.suit}`)) {
            this.renderUI();
        }
    }

    resolveTopCardForSource(sourcePileId) {
        if (sourcePileId === 'waste') return this.waste[this.waste.length - 1] || null;
        if (sourcePileId.startsWith('foundation-')) {
            const suit = sourcePileId.split('-')[1];
            const pile = this.foundations[suit];
            return pile[pile.length - 1] || null;
        }
        if (sourcePileId.startsWith('tableau-')) {
            const col = this.tableau[parseInt(sourcePileId.split('-')[1], 10)];
            return col[col.length - 1] || null;
        }
        return null;
    }

    // d&d 
    beginDrag(e, el) {
        e.preventDefault();
        const sourcePileId = el.dataset.pileSource;
        let cardGroup, groupElements;

        if (sourcePileId.startsWith('tableau-')) {
            const colIndex = parseInt(sourcePileId.split('-')[1], 10);
            const startIdx = parseInt(el.dataset.idx, 10);
            cardGroup = this.tableau[colIndex].slice(startIdx);
            const colEl = el.closest('[data-pile]');
            groupElements = Array.from(colEl.querySelectorAll('[data-drag="true"]')).filter(c => parseInt(c.dataset.idx, 10) >= startIdx);
        } else {
            const card = this.resolveTopCardForSource(sourcePileId);
            if (!card) return;
            cardGroup = [card];
            groupElements = [el];
        }

        const rect = el.getBoundingClientRect();
        this.dragState = {
            sourcePileId,
            cardGroup,
            grabDX: e.clientX - rect.left,
            grabDY: e.clientY - rect.top,
            ghostEls: []
        };

        groupElements.forEach(node => { node.style.visibility = 'hidden'; });

        cardGroup.forEach((card, i) => {
            const ghost = document.createElement('div');
            ghost.className = `solitaire-card drag-ghost ${isRed(card.suit) ? 'red-suit' : 'black-suit'}`;
            ghost.style.left = `${rect.left}px`;
            ghost.style.top = `${rect.top + i * FAN_OFFSET}px`;
            ghost.innerHTML = cardInnerHtml(card);
            document.body.appendChild(ghost);
            this.dragState.ghostEls.push(ghost);
        });

        document.addEventListener('mousemove', this.boundMouseMove);
        document.addEventListener('mouseup', this.boundMouseUp);
    }

    handleDragMove(e) {
        if (!this.dragState) return;
        const x = e.clientX - this.dragState.grabDX;
        const y = e.clientY - this.dragState.grabDY;
        this.dragState.ghostEls.forEach((el, i) => {
            el.style.left = `${x}px`;
            el.style.top = `${y + i * FAN_OFFSET}px`;
        });
    }

    handleDragEnd(e) {
        if (!this.dragState) return;
        const { sourcePileId, cardGroup, ghostEls } = this.dragState;
        ghostEls.forEach(el => el.remove());
        document.removeEventListener('mousemove', this.boundMouseMove);
        document.removeEventListener('mouseup', this.boundMouseUp);
        this.dragState = null;

        const dropEl = document.elementFromPoint(e.clientX, e.clientY);
        const pileEl = dropEl ? dropEl.closest('[data-pile]') : null;

        if (pileEl) {
            this.tryMove(sourcePileId, cardGroup, pileEl.dataset.pile);
        }
        this.renderUI();
    }

    // move
    tryMove(sourcePileId, cardGroup, targetPileId) {
        if (sourcePileId === targetPileId) return false;
        const movingCard = cardGroup[0];

        if (targetPileId.startsWith('foundation-')) {
            if (cardGroup.length !== 1) return false;
            const suit = targetPileId.split('-')[1];
            if (movingCard.suit !== suit) return false;
            const pile = this.foundations[suit];
            const topRank = pile.length ? pile[pile.length - 1].rank : 0;
            if (movingCard.rank !== topRank + 1) return false;

            this.removeGroupFromSource(sourcePileId, cardGroup);
            this.foundations[suit].push(movingCard);
            this.flipNewTopCard(sourcePileId);
            if (this.checkWin()) this.won = true;
            return true;
        }

        if (targetPileId.startsWith('tableau-')) {
            const colIndex = parseInt(targetPileId.split('-')[1], 10);
            const col = this.tableau[colIndex];
            const topCard = col.length ? col[col.length - 1] : null;
            if (topCard) {
                if (!isOppositeColor(movingCard.suit, topCard.suit) || movingCard.rank !== topCard.rank - 1) return false;
            } else if (movingCard.rank !== 13) {
                return false;
            }

            this.removeGroupFromSource(sourcePileId, cardGroup);
            col.push(...cardGroup);
            this.flipNewTopCard(sourcePileId);
            return true;
        }

        return false;
    }

    removeGroupFromSource(sourcePileId, cardGroup) {
        if (sourcePileId === 'waste') {
            this.waste.pop();
        } else if (sourcePileId.startsWith('foundation-')) {
            const suit = sourcePileId.split('-')[1];
            this.foundations[suit].pop();
        } else if (sourcePileId.startsWith('tableau-')) {
            const colIndex = parseInt(sourcePileId.split('-')[1], 10);
            const col = this.tableau[colIndex];
            col.splice(col.length - cardGroup.length, cardGroup.length);
        }
    }

    flipNewTopCard(sourcePileId) {
        if (!sourcePileId.startsWith('tableau-')) return;
        const col = this.tableau[parseInt(sourcePileId.split('-')[1], 10)];
        const top = col[col.length - 1];
        if (top && !top.faceUp) top.faceUp = true;
    }

    checkWin() {
        return SUITS.every(suit => this.foundations[suit].length === 13);
    }


    handleKeyDown(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            this.close();
        }
    }

    // Custom teardown: if the window closes mid-drag, the document-level
    // mousemove/mouseup pair added in beginDrag() is still live and needs
    // tearing down by hand — BaseApp's automatic listener cleanup only
    // covers listeners registered through this.listen().
    onCleanup() {
        if (this.dragState) {
            this.dragState.ghostEls.forEach(el => el.remove());
            document.removeEventListener('mousemove', this.boundMouseMove);
            document.removeEventListener('mouseup', this.boundMouseUp);
            this.dragState = null;
        }
    }
}
