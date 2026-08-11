// cherry/engine.js - Cherry Chess Engine: search (iterative deepening negamax,
// alpha-beta pruning, quiescence search, transposition table, MVV-LVA ordering)
import { getAllLegalMoves, getAllLegalCaptures, applyMove, isKingInCheck, isCapture } from './rules.js';
import { evaluate, PIECE_VALUES } from './evaluate.js';

const MATE_SCORE = 100000;
const EXACT = 0, LOWER_BOUND = 1, UPPER_BOUND = 2;
const ABORT = Symbol('search-aborted');
const MAX_QUIESCENCE_PLY = 8;

function hashState(state) {
    let key = state.turn;
    for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) key += state.board[r][f] || '.';
    }
    const c = state.castling;
    key += (c.wK ? '1' : '0') + (c.wQ ? '1' : '0') + (c.bK ? '1' : '0') + (c.bQ ? '1' : '0');
    key += state.epTarget ? `${state.epTarget.r}${state.epTarget.f}` : '-';
    return key;
}

function moveKey(move) {
    return `${move.from.r}${move.from.f}${move.to.r}${move.to.f}${move.promotion || ''}${move.isCastle || ''}`;
}

function scoreMove(state, move, hintKey) {
    if (hintKey && moveKey(move) === hintKey) return 1000000;
    if (isCapture(state, move)) {
        const victim = state.board[move.to.r][move.to.f];
        const victimValue = victim ? PIECE_VALUES[victim[1]] : PIECE_VALUES.P;
        const attackerValue = PIECE_VALUES[move.piece[1]];
        return 100000 + victimValue * 10 - attackerValue;
    }
    return 0;
}

function orderMoves(state, moves, hintMove) {
    const hintKey = hintMove ? moveKey(hintMove) : null;
    return moves.slice().sort((a, b) => scoreMove(state, b, hintKey) - scoreMove(state, a, hintKey));
}

function checkTime(deadline) {
    if (Date.now() > deadline) throw ABORT;
}

function quiescence(state, alpha, beta, deadline, qPly = 0) {
    checkTime(deadline);

    const standPat = (state.turn === 'w' ? 1 : -1) * evaluate(state);
    if (standPat >= beta) return beta;
    if (standPat > alpha) alpha = standPat;
    if (qPly >= MAX_QUIESCENCE_PLY) return alpha;

    const captures = orderMoves(state, getAllLegalCaptures(state, state.turn), null);
    for (const move of captures) {
        const score = -quiescence(applyMove(state, move), -beta, -alpha, deadline, qPly + 1);
        if (score >= beta) return beta;
        if (score > alpha) alpha = score;
    }
    return alpha;
}

function negamax(state, depth, alpha, beta, deadline, ply, tt) {
    checkTime(deadline);

    const key = hashState(state);
    const origAlpha = alpha;
    const entry = tt.get(key);
    let hintMove = null;
    if (entry) {
        hintMove = entry.move;
        if (entry.depth >= depth) {
            if (entry.flag === EXACT) return entry.score;
            if (entry.flag === LOWER_BOUND) alpha = Math.max(alpha, entry.score);
            else if (entry.flag === UPPER_BOUND) beta = Math.min(beta, entry.score);
            if (alpha >= beta) return entry.score;
        }
    }

    const moves = getAllLegalMoves(state, state.turn);
    if (moves.length === 0) {
        return isKingInCheck(state, state.turn) ? -(MATE_SCORE - ply) : 0;
    }
    if (depth === 0) return quiescence(state, alpha, beta, deadline);

    const ordered = orderMoves(state, moves, hintMove);
    let best = -Infinity;
    let bestMove = ordered[0];

    for (const move of ordered) {
        const score = -negamax(applyMove(state, move), depth - 1, -beta, -alpha, deadline, ply + 1, tt);
        if (score > best) { best = score; bestMove = move; }
        if (best > alpha) alpha = best;
        if (alpha >= beta) break;
    }

    let flag = EXACT;
    if (best <= origAlpha) flag = UPPER_BOUND;
    else if (best >= beta) flag = LOWER_BOUND;
    tt.set(key, { depth, score: best, flag, move: bestMove });

    return best;
}

/**
 * Iterative-deepening search bounded by a wall-clock time budget. Returns the
 * best move found from the deepest fully-completed iteration.
 */
export function getBestMove(state, options = {}) {
    const maxDepth = options.maxDepth ?? 6;
    const timeLimitMs = options.timeLimitMs ?? 800;
    const deadline = Date.now() + timeLimitMs;

    const rootMoves = getAllLegalMoves(state, state.turn);
    if (rootMoves.length === 0) return null;
    if (rootMoves.length === 1) return rootMoves[0];

    const tt = new Map();
    let bestMove = rootMoves[0];
    let hintMove = null;

    for (let depth = 1; depth <= maxDepth; depth++) {
        try {
            const ordered = orderMoves(state, rootMoves, hintMove);
            let alpha = -Infinity;
            const beta = Infinity;
            let currentBest = ordered[0];
            let currentBestScore = -Infinity;

            for (const move of ordered) {
                const score = -negamax(applyMove(state, move), depth - 1, -beta, -alpha, deadline, 1, tt);
                if (score > currentBestScore) { currentBestScore = score; currentBest = move; }
                if (currentBestScore > alpha) alpha = currentBestScore;
            }

            bestMove = currentBest;
            hintMove = currentBest;
        } catch (err) {
            if (err === ABORT) break;
            throw err;
        }
        if (Date.now() >= deadline) break;
    }

    return bestMove;
}
