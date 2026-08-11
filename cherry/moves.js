// Pseudo-legal move generation & attack detection
import { inBounds } from './board.js';

const KNIGHT_OFFSETS = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
const DIAGONAL_DIRS = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const STRAIGHT_DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const PROMOTION_PIECES = ['Q', 'R', 'B', 'N'];

export function isSquareAttacked(board, r, f, byColor) {
    const pawnRank = r + (byColor === 'w' ? -1 : 1);
    for (const df of [-1, 1]) {
        const pf = f + df;
        if (inBounds(pawnRank, pf) && board[pawnRank][pf] === byColor + 'P') return true;
    }
    for (const [dr, df] of KNIGHT_OFFSETS) {
        const tr = r + dr, tf = f + df;
        if (inBounds(tr, tf) && board[tr][tf] === byColor + 'N') return true;
    }
    for (let dr = -1; dr <= 1; dr++) {
        for (let df = -1; df <= 1; df++) {
            if (dr === 0 && df === 0) continue;
            const tr = r + dr, tf = f + df;
            if (inBounds(tr, tf) && board[tr][tf] === byColor + 'K') return true;
        }
    }
    for (const [dr, df] of DIAGONAL_DIRS) {
        let tr = r + dr, tf = f + df;
        while (inBounds(tr, tf)) {
            const p = board[tr][tf];
            if (p) {
                if (p[0] === byColor && (p[1] === 'B' || p[1] === 'Q')) return true;
                break;
            }
            tr += dr; tf += df;
        }
    }
    for (const [dr, df] of STRAIGHT_DIRS) {
        let tr = r + dr, tf = f + df;
        while (inBounds(tr, tf)) {
            const p = board[tr][tf];
            if (p) {
                if (p[0] === byColor && (p[1] === 'R' || p[1] === 'Q')) return true;
                break;
            }
            tr += dr; tf += df;
        }
    }
    return false;
}

export function pseudoMovesForPiece(state, r, f) {
    const board = state.board;
    const piece = board[r][f];
    if (!piece) return [];
    const color = piece[0], type = piece[1];
    const opp = color === 'w' ? 'b' : 'w';
    const moves = [];

    const push = (tr, tf, opts = {}) => {
        moves.push({
            from: { r, f }, to: { r: tr, f: tf }, piece,
            isCastle: null, isEnPassant: false, isPromotion: false, promotion: null,
            ...opts
        });
    };

    if (type === 'P') {
        const dir = color === 'w' ? 1 : -1;
        const startRank = color === 'w' ? 1 : 6;
        const promoRank = color === 'w' ? 7 : 0;

        if (inBounds(r + dir, f) && !board[r + dir][f]) {
            if (r + dir === promoRank) {
                for (const p of PROMOTION_PIECES) push(r + dir, f, { isPromotion: true, promotion: p });
            } else {
                push(r + dir, f);
                if (r === startRank && !board[r + 2 * dir][f]) push(r + 2 * dir, f);
            }
        }
        for (const df of [-1, 1]) {
            const tr = r + dir, tf = f + df;
            if (!inBounds(tr, tf)) continue;
            if (board[tr][tf] && board[tr][tf][0] === opp) {
                if (tr === promoRank) {
                    for (const p of PROMOTION_PIECES) push(tr, tf, { isPromotion: true, promotion: p });
                } else {
                    push(tr, tf);
                }
            } else if (state.epTarget && state.epTarget.r === tr && state.epTarget.f === tf) {
                push(tr, tf, { isEnPassant: true });
            }
        }
    } else if (type === 'N') {
        for (const [dr, df] of KNIGHT_OFFSETS) {
            const tr = r + dr, tf = f + df;
            if (!inBounds(tr, tf)) continue;
            if (!board[tr][tf] || board[tr][tf][0] === opp) push(tr, tf);
        }
    } else if (type === 'B' || type === 'R' || type === 'Q') {
        const dirs = [];
        if (type !== 'R') dirs.push(...DIAGONAL_DIRS);
        if (type !== 'B') dirs.push(...STRAIGHT_DIRS);
        for (const [dr, df] of dirs) {
            let tr = r + dr, tf = f + df;
            while (inBounds(tr, tf)) {
                if (!board[tr][tf]) {
                    push(tr, tf);
                } else {
                    if (board[tr][tf][0] === opp) push(tr, tf);
                    break;
                }
                tr += dr; tf += df;
            }
        }
    } else if (type === 'K') {
        for (let dr = -1; dr <= 1; dr++) {
            for (let df = -1; df <= 1; df++) {
                if (dr === 0 && df === 0) continue;
                const tr = r + dr, tf = f + df;
                if (!inBounds(tr, tf)) continue;
                if (!board[tr][tf] || board[tr][tf][0] === opp) push(tr, tf);
            }
        }
        const homeRank = color === 'w' ? 0 : 7;
        if (r === homeRank && f === 4) {
            const rights = state.castling;
            const kSide = color === 'w' ? rights.wK : rights.bK;
            const qSide = color === 'w' ? rights.wQ : rights.bQ;
            if (kSide && !board[homeRank][5] && !board[homeRank][6] && board[homeRank][7] === color + 'R') {
                if (!isSquareAttacked(board, homeRank, 4, opp) && !isSquareAttacked(board, homeRank, 5, opp) && !isSquareAttacked(board, homeRank, 6, opp)) {
                    push(homeRank, 6, { isCastle: 'K' });
                }
            }
            if (qSide && !board[homeRank][1] && !board[homeRank][2] && !board[homeRank][3] && board[homeRank][0] === color + 'R') {
                if (!isSquareAttacked(board, homeRank, 4, opp) && !isSquareAttacked(board, homeRank, 3, opp) && !isSquareAttacked(board, homeRank, 2, opp)) {
                    push(homeRank, 2, { isCastle: 'Q' });
                }
            }
        }
    }

    return moves;
}
