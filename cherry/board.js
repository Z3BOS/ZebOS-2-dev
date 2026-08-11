// Cherry board (cherries sound good right now)
// Board is board[rank][file], rank 0 = rank "1", file 0 = file "a".
// Pieces are 2-char strings: color 'w'/'b' + type 'P','N','B','R','Q','K'. Empty square = null.

export function inBounds(r, f) {
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

export function cloneBoard(board) {
    return board.map(row => row.slice());
}

export function findKing(board, color) {
    for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
            if (board[r][f] === color + 'K') return { r, f };
        }
    }
    return null;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

export function squareName(r, f) {
    return `${FILES[f]}${r + 1}`;
}

export function parseSquare(name) {
    return { f: FILES.indexOf(name[0]), r: parseInt(name[1], 10) - 1 };
}
