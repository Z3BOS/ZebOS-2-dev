// legality, move application, game status
// i want cherries...
import { findKing, cloneBoard } from './board.js';
import { pseudoMovesForPiece, isSquareAttacked } from './moves.js';

export function isKingInCheck(state, color) {
    const kingPos = findKing(state.board, color);
    if (!kingPos) return false;
    return isSquareAttacked(state.board, kingPos.r, kingPos.f, color === 'w' ? 'b' : 'w');
}

export function applyMove(state, move) {
    const board = cloneBoard(state.board);
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

export function isCapture(state, move) {
    return !!state.board[move.to.r][move.to.f] || move.isEnPassant;
}

// Capture-only legal move generation, used by quiescence search. Filtering to
// captures BEFORE the (expensive, clone-and-check) legality test keeps this
// far cheaper per node than getAllLegalMoves()+isCapture() would be.
export function getLegalCapturesForSquare(state, r, f) {
    const piece = state.board[r][f];
    if (!piece || piece[0] !== state.turn) return [];
    return pseudoMovesForPiece(state, r, f)
        .filter(move => isCapture(state, move))
        .filter(move => !isKingInCheck(applyMove(state, move), piece[0]));
}

export function getAllLegalCaptures(state, color) {
    const moves = [];
    for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
            const piece = state.board[r][f];
            if (piece && piece[0] === color) {
                moves.push(...getLegalCapturesForSquare(state, r, f));
            }
        }
    }
    return moves;
}
