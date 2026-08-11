// The main file for Cherry

const VALUES = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 0 };

function inBounds(r, f) {
    return r >= 0 && r < 8 && f >= 0 && f < 8;
}

export function createInitialState() {
    const board = Array.from({ length: 8 }, () => Array(8).fill(null));
    const backRank = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
    for (let f = 0; f < 8; f++) {
        board[0][f] = 'w' + backRank[f];
        board[1][f] = 'wP';
        board[6][f] = 'bP';
        board[7][f] = 'b' + backRank[f];
    }
    return {
        board,
        turn: 'w',
        castling: { wK: true, wQ: true, bK: true, bQ: true },
        epTarget: null
    };
}

function findKing(board, color) {
    for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
            if (board[r][f] === color + 'K') return { r, f };
        }
    }
    return null;
}

function isSquareAttacked(board, r, f, byColor) {
    // Pawns
    const pawnRank = r + (byColor === 'w' ? -1 : 1);
    for (const df of [-1, 1]) {
        const pf = f + df;
        if (inBounds(pawnRank, pf) && board[pawnRank][pf] === byColor + 'P') return true;
    }
    // Knights
    const knightOffsets = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
    for (const [dr, df] of knightOffsets) {
        const tr = r + dr, tf = f + df;
        if (inBounds(tr, tf) && board[tr][tf] === byColor + 'N') return true;
    }
    // King
    for (let dr = -1; dr <= 1; dr++) {
        for (let df = -1; df <= 1; df++) {
            if (dr === 0 && df === 0) continue;
            const tr = r + dr, tf = f + df;
            if (inBounds(tr, tf) && board[tr][tf] === byColor + 'K') return true;
        }
    }
    // Diagonal sliders (bishop/queen)
    for (const [dr, df] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
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
    // Straight sliders (rook/queen)
    for (const [dr, df] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
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

export function isKingInCheck(state, color) {
    const kingPos = findKing(state.board, color);
    if (!kingPos) return false;
    return isSquareAttacked(state.board, kingPos.r, kingPos.f, color === 'w' ? 'b' : 'w');
}

function pseudoMovesForPiece(state, r, f) {
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
                for (const p of ['Q', 'R', 'B', 'N']) push(r + dir, f, { isPromotion: true, promotion: p });
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
                    for (const p of ['Q', 'R', 'B', 'N']) push(tr, tf, { isPromotion: true, promotion: p });
                } else {
                    push(tr, tf);
                }
            } else if (state.epTarget && state.epTarget.r === tr && state.epTarget.f === tf) {
                push(tr, tf, { isEnPassant: true });
            }
        }
    } else if (type === 'N') {
        const offsets = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
        for (const [dr, df] of offsets) {
            const tr = r + dr, tf = f + df;
            if (!inBounds(tr, tf)) continue;
            if (!board[tr][tf] || board[tr][tf][0] === opp) push(tr, tf);
        }
    } else if (type === 'B' || type === 'R' || type === 'Q') {
        const dirs = [];
        if (type !== 'R') dirs.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
        if (type !== 'B') dirs.push([1, 0], [-1, 0], [0, 1], [0, -1]);
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

function applyMove(state, move) {
    const board = state.board.map(row => row.slice());
    const { from, to } = move;
    const piece = board[from.r][from.f];
    const color = piece[0];

    if (move.isEnPassant) {
        board[from.r][to.f] = null;
    }

    board[to.r][to.f] = move.isPromotion ? (color + move.promotion) : piece;
    board[from.r][from.f] = null;

    if (move.isCastle === 'K') {
        board[from.r][5] = board[from.r][7];
        board[from.r][7] = null;
    } else if (move.isCastle === 'Q') {
        board[from.r][3] = board[from.r][0];
        board[from.r][0] = null;
    }

    const castling = { ...state.castling };
    if (piece === 'wK') { castling.wK = false; castling.wQ = false; }
    if (piece === 'bK') { castling.bK = false; castling.bQ = false; }
    if (from.r === 0 && from.f === 0) castling.wQ = false;
    if (from.r === 0 && from.f === 7) castling.wK = false;
    if (from.r === 7 && from.f === 0) castling.bQ = false;
    if (from.r === 7 && from.f === 7) castling.bK = false;
    if (to.r === 0 && to.f === 0) castling.wQ = false;
    if (to.r === 0 && to.f === 7) castling.wK = false;
    if (to.r === 7 && to.f === 0) castling.bQ = false;
    if (to.r === 7 && to.f === 7) castling.bK = false;

    let epTarget = null;
    if (piece[1] === 'P' && Math.abs(to.r - from.r) === 2) {
        epTarget = { r: (to.r + from.r) / 2, f: from.f };
    }

    return { board, turn: color === 'w' ? 'b' : 'w', castling, epTarget };
}

export function getLegalMovesForSquare(state, r, f) {
    const piece = state.board[r][f];
    if (!piece || piece[0] !== state.turn) return [];
    return pseudoMovesForPiece(state, r, f).filter(move => {
        const next = applyMove(state, move);
        return !isKingInCheck(next, piece[0]);
    });
}

export function getAllLegalMoves(state, color) {
    const moves = [];
    for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
            const piece = state.board[r][f];
            if (piece && piece[0] === color) {
                moves.push(...getLegalMovesForSquare(state, r, f));
            }
        }
    }
    return moves;
}

export function getGameStatus(state) {
    const moves = getAllLegalMoves(state, state.turn);
    const inCheck = isKingInCheck(state, state.turn);
    if (moves.length === 0) return inCheck ? 'checkmate' : 'stalemate';
    return inCheck ? 'check' : 'playing';
}

export function makeMove(state, from, to, promotion = null) {
    const legal = getLegalMovesForSquare(state, from.r, from.f);
    const match = legal.find(m => m.to.r === to.r && m.to.f === to.f && (!m.isPromotion || m.promotion === (promotion || 'Q')));
    if (!match) return null;
    return { state: applyMove(state, match), move: match };
}

function isCapture(state, move) {
    return !!state.board[move.to.r][move.to.f] || move.isEnPassant;
}

function orderMoves(state, moves) {
    return moves.slice().sort((a, b) => (isCapture(state, b) ? 1 : 0) - (isCapture(state, a) ? 1 : 0));
}

const CENTER_BONUS_TYPES = new Set(['P', 'N']);

function evaluate(state) {
    let score = 0;
    for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
            const piece = state.board[r][f];
            if (!piece) continue;
            const sign = piece[0] === 'w' ? 1 : -1;
            score += sign * VALUES[piece[1]];
            if (CENTER_BONUS_TYPES.has(piece[1])) {
                score += sign * (4 - (Math.abs(r - 3.5) + Math.abs(f - 3.5))) * 2;
            }
        }
    }
    return score;
}

function minimax(state, depth, alpha, beta) {
    const moves = getAllLegalMoves(state, state.turn);
    if (moves.length === 0) {
        if (isKingInCheck(state, state.turn)) return state.turn === 'w' ? -100000 : 100000;
        return 0;
    }
    if (depth === 0) return evaluate(state);

    const ordered = orderMoves(state, moves);
    if (state.turn === 'w') {
        let best = -Infinity;
        for (const move of ordered) {
            const score = minimax(applyMove(state, move), depth - 1, alpha, beta);
            best = Math.max(best, score);
            alpha = Math.max(alpha, score);
            if (beta <= alpha) break;
        }
        return best;
    } else {
        let best = Infinity;
        for (const move of ordered) {
            const score = minimax(applyMove(state, move), depth - 1, alpha, beta);
            best = Math.min(best, score);
            beta = Math.min(beta, score);
            if (beta <= alpha) break;
        }
        return best;
    }
}

export function getBestMove(state, depth = 2) {
    const color = state.turn;
    const moves = orderMoves(state, getAllLegalMoves(state, color));
    if (moves.length === 0) return null;

    let bestMove = moves[0];
    let bestScore = color === 'w' ? -Infinity : Infinity;
    let alpha = -Infinity, beta = Infinity;

    for (const move of moves) {
        const score = minimax(applyMove(state, move), depth - 1, alpha, beta);
        if (color === 'w') {
            if (score > bestScore) { bestScore = score; bestMove = move; }
            alpha = Math.max(alpha, score);
        } else {
            if (score < bestScore) { bestScore = score; bestMove = move; }
            beta = Math.min(beta, score);
        }
    }
    return bestMove;
}
