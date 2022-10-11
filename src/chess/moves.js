/**
 * Moves
 */
// Pawns

export const getMoves = () => {
    const moves = {}
    moves.pawn = definePawnMoves()
    moves.rook = defineRookMoves()
    moves.knight = defineKnightMoves()
    moves.bishop = defineBishopMoves()
    moves.queen = defineQueenMoves()
    moves.king = defineKingMoves()

    return moves
}

const definePawnMoves = () => {
    return {
        'white-pawn': [{ x: 1, z: 0 }],
        'white-pawn-first': [{ x: 2, z: 0 }],
        'white-pawn-capture-left': [{ x: 1, z: -1 }],
        'white-pawn-capture-right': [{ x: 1, z: 1 }],
        'black-pawn': [{ x: -1, z: 0 }],
        'black-pawn-first': [{ x: -2, z: 0 }],
        'black-pawn-capture-left': [{ x: -1, z: 1 }],
        'black-pawn-capture-right': [{ x: -1, z: -1 }],
    }
}

// Rooks
const defineRookMoves = () => {
    let rookMoves = []
    for (let t = -7; t < 8; t++) {
        if (t === 0) {
            continue
        }
        rookMoves.push({ x: t, z: 0 })
        rookMoves.push({ x: 0, z: t })
    }
    return rookMoves
}

// Bishops
const defineBishopMoves = () => {
    let bishopMoves = []
    for (let t = -7; t < 8; t++) {
        if (t === 0) {
            continue
        }
        bishopMoves.push({ x: t, z: t })
        bishopMoves.push({ x: -t, z: t })
        bishopMoves.push({ x: t, z: -t })
        bishopMoves.push({ x: -t, z: -t })
    }
    return bishopMoves
}

// Knights
const defineKnightMoves = () => {
    const knightMoves = [
        { x: -2, z: -1 },
        { x: -2, z: 1 },
        { x: -1, z: -2 },
        { x: -1, z: 2 },
        { x: 1, z: -2 },
        { x: 1, z: 2 },
        { x: 2, z: -1 },
        { x: 2, z: 1 },
    ]
    return knightMoves
}

// Queen
const defineQueenMoves = () => {
    let queenMoves = []
    for (let t = -7; t < 8; t++) {
        if (t === 0) {
            continue
        }
        queenMoves.push({ x: t, z: t })
        queenMoves.push({ x: -t, z: t })
        queenMoves.push({ x: t, z: -t })
        queenMoves.push({ x: -t, z: -t })
        queenMoves.push({ x: t, z: 0 })
        queenMoves.push({ x: 0, z: t })
    }
    return queenMoves
}

// King
const defineKingMoves = () => {
    let kingMoves = []
    for (let t = -1; t < 2; t++) {
        if (t === 0) {
            continue
        }
        kingMoves.push({ x: t, z: t })
        kingMoves.push({ x: -t, z: t })
        kingMoves.push({ x: t, z: -t })
        kingMoves.push({ x: -t, z: -t })
        kingMoves.push({ x: t, z: 0 })
        kingMoves.push({ x: 0, z: t })
    }

    kingMoves['king-short-rochade'] = [{ x: 0, z: 2 }]
    kingMoves['king-long-rochade'] = [{ x: 0, z: -2 }]

    return kingMoves
}
