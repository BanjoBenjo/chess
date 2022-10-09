import './style.css'
import * as THREE from 'three'
import { DragControls } from 'three/examples/jsm/controls/DragControls.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

import { containsObject } from './utils'

/**
 * Debug
 */
const gui = new dat.GUI()

/**
 * Variables
 */

// Sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    aspect: window.innerWidth / window.innerHeight,
}

// Board and Pieces
const board = []
let pieces = {
    white: [],
    black: [],
}
const out = {
    white: [],
    black: [],
}

// Move relevant Variables
let whiteToMove = true
let oldSquare = null
let originPosition = null

let kingsPosition = {
    white: { x: 0, z: 4 },
    black: { x: 7, z: 4 },
}

let kingsInCheck = {
    white: false,
    black: false,
}

let enPassent = {
    movedPawn: null,
    possibleSquares: [],
}

let rochade = {
    white: {
        kingMoved: false,
        rookShortMoved: false,
        rookLongMoved: false,
    },
    black: {
        kingMoved: false,
        rookShortMoved: false,
        rookLongMoved: false,
    },
}

// Debug stuff
let resetCamera = true
const mid = new THREE.Vector3(3.5, 0, 3.5)

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Floor
 */
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.MeshStandardMaterial({
        color: '#777777',
        metalness: 0.3,
        roughness: 0.4,
    })
)
floor.receiveShadow = true
floor.rotation.x = -Math.PI * 0.5
floor.position.x = floor.position.x + 4
floor.position.z = floor.position.z + 4
scene.add(floor)

/**
 * Board Creation
 */

// Board
const boardGroup = new THREE.Group()
scene.add(boardGroup)

// Squares of the Board
const squareGeometry = new THREE.BoxGeometry(1, 0.2, 1)

const createSquare = (black, position) => {
    const squareMaterial = new THREE.MeshStandardMaterial({
        metalness: 0.4,
        roughness: 0,
    })
    const square = new THREE.Mesh(squareGeometry, squareMaterial)
    square.material.color = new THREE.Color(black === 1 ? '#fccc74' : '#8a785d')

    square.position.copy(position)
    return square
}

// Initialize empty board
const initEmptyBoard = () => {
    for (let x = 0; x < 8; x++) {
        board[x] = []
        for (let z = 0; z < 8; z++) {
            const black = (z + x) % 2
            const square = createSquare(black, { x: x, y: 0, z: z })
            boardGroup.add(square)
            board[x][z] = { square: square, piece: null }
        }
    }
}

initEmptyBoard()

/**
 * Pieces Creation
 */

// Material for the expanded Bounding Boxes
const boxMaterial = new THREE.MeshStandardMaterial({
    transparent: true,
    opacity: 0,
    // wireframe: true
})

// Container for the real Bounding Box
let box3 = new THREE.Box3()
let size = new THREE.Vector3()

const createPieceByModel = (position, color, name, model) => {
    const material = boxMaterial.clone()
    material.color.set(new THREE.Color(color === 'black' ? 'grey' : 'white'))

    // get bounding box from model
    let boxHelper = new THREE.BoxHelper(model, 0xffffff)
    box3.setFromObject(boxHelper)
    box3.getSize(size)

    // create a box with width and depth of 1 ( so it covers a whole square )
    // and the height of the piece
    // TODO change positioning so that the piece does stay inside of the box
    // this does not work atm, although model and box have same height.
    const boxGeometry = new THREE.BoxGeometry(1, size.y + 0.8, 1)
    const piece_box = new THREE.Mesh(boxGeometry, material)

    // allow model to cast a shadow and not the box
    model.castShadow = true

    // piece attributes
    piece_box.name = name
    piece_box.color = color
    piece_box.castShadow = false
    piece_box.position.copy(position)

    piece_box.add(model)
    scene.add(piece_box)

    // add piece to board and color pieces (to enable/disabkle black or white to move)
    board[position.x][position.z].piece = piece_box
    pieces[color].push(piece_box)
}

/**
 * Piece Loading and Creation
 */
// Todo find a better way to load all models
const gltfLoader = new GLTFLoader()
const scaleFactor = 0.6
let blackQueenModel
let whiteQueenModel

gltfLoader.load('/gltf/black_pawn.gltf', (gltf) => {
    const model = gltf.scene.children[0]
    model.scale.set(
        model.scale.x * scaleFactor,
        model.scale.y * scaleFactor,
        model.scale.z * scaleFactor
    )
    model.rotation.z = Math.PI * 0.5
    model.position.set(0, 0, 0)

    for (let z = 0; z < 8; z++) {
        createPieceByModel(
            new THREE.Vector3(6, 0.5, z),
            'black',
            'pawn',
            model.clone()
        )
    }
})

gltfLoader.load('/gltf/black_rook.gltf', (gltf) => {
    const model = gltf.scene.children[0]
    model.scale.set(
        model.scale.x * scaleFactor,
        model.scale.y * scaleFactor,
        model.scale.z * scaleFactor
    )
    model.rotation.z = Math.PI * 0.5
    model.position.set(0, 0, 0)

    createPieceByModel(
        new THREE.Vector3(7, 0.8, 0),
        'black',
        'rook',
        model.clone()
    )
    createPieceByModel(
        new THREE.Vector3(7, 0.8, 7),
        'black',
        'rook',
        model.clone()
    )
})

gltfLoader.load('/gltf/black_knight.gltf', (gltf) => {
    const model = gltf.scene.children[0]
    model.scale.set(
        model.scale.x * scaleFactor,
        model.scale.y * scaleFactor,
        model.scale.z * scaleFactor
    )
    model.rotation.z = -2 * Math.PI
    model.position.set(0, 0, 0)

    createPieceByModel(
        new THREE.Vector3(7, 0.5, 6),
        'black',
        'knight',
        model.clone()
    )
    createPieceByModel(
        new THREE.Vector3(7, 0.5, 1),
        'black',
        'knight',
        model.clone()
    )
})

gltfLoader.load('/gltf/black_bishop.gltf', (gltf) => {
    const model = gltf.scene.children[0]
    model.scale.set(
        model.scale.x * scaleFactor,
        model.scale.y * scaleFactor,
        model.scale.z * scaleFactor
    )
    model.rotation.z = Math.PI * 0.5
    model.position.set(0, 0, 0)

    createPieceByModel(
        new THREE.Vector3(7, 0.8, 2),
        'black',
        'bishop',
        model.clone()
    )
    createPieceByModel(
        new THREE.Vector3(7, 0.8, 5),
        'black',
        'bishop',
        model.clone()
    )
})

gltfLoader.load('/gltf/black_queen.gltf', (gltf) => {
    blackQueenModel = gltf.scene.children[0]
    blackQueenModel.scale.set(
        blackQueenModel.scale.x * scaleFactor,
        blackQueenModel.scale.y * scaleFactor,
        blackQueenModel.scale.z * scaleFactor
    )
    blackQueenModel.rotation.z = Math.PI * 0.5
    blackQueenModel.position.set(0, 0, 0)

    createPieceByModel(
        new THREE.Vector3(7, 0.9, 3),
        'black',
        'queen',
        blackQueenModel.clone()
    )
})

gltfLoader.load('/gltf/black_king.gltf', (gltf) => {
    const model = gltf.scene.children[0]
    model.scale.set(
        model.scale.x * scaleFactor,
        model.scale.y * scaleFactor,
        model.scale.z * scaleFactor
    )
    model.rotation.z = Math.PI * 0.5
    model.position.set(0, 0, 0)

    createPieceByModel(
        new THREE.Vector3(7, 1.2, 4),
        'black',
        'king',
        model.clone()
    )
})

// White Pieces
gltfLoader.load('/gltf/white_pawn.gltf', (gltf) => {
    const model = gltf.scene.children[0]
    model.scale.set(
        model.scale.x * scaleFactor,
        model.scale.y * scaleFactor,
        model.scale.z * scaleFactor
    )
    model.rotation.z = Math.PI * -0.5
    model.position.set(0, 0, 0)

    for (let z = 0; z < 8; z++) {
        createPieceByModel(
            new THREE.Vector3(1, 0.5, z),
            'white',
            'pawn',
            model.clone()
        )
    }
})

gltfLoader.load('/gltf/white_rook.gltf', (gltf) => {
    const model = gltf.scene.children[0]
    model.scale.set(
        model.scale.x * scaleFactor,
        model.scale.y * scaleFactor,
        model.scale.z * scaleFactor
    )
    model.rotation.z = Math.PI * -0.5
    model.position.set(0, 0, 0)

    createPieceByModel(
        new THREE.Vector3(0, 0.8, 0),
        'white',
        'rook',
        model.clone()
    )
    createPieceByModel(
        new THREE.Vector3(0, 0.8, 7),
        'white',
        'rook',
        model.clone()
    )
})

gltfLoader.load('/gltf/white_knight.gltf', (gltf) => {
    const model = gltf.scene.children[0]
    model.scale.set(
        model.scale.x * scaleFactor,
        model.scale.y * scaleFactor,
        model.scale.z * scaleFactor
    )
    model.rotation.z = -2 * Math.PI
    model.position.set(0, 0, 0)

    createPieceByModel(
        new THREE.Vector3(0, 0.5, 6),
        'white',
        'knight',
        model.clone()
    )
    createPieceByModel(
        new THREE.Vector3(0, 0.5, 1),
        'white',
        'knight',
        model.clone()
    )
})

gltfLoader.load('/gltf/white_bishop.gltf', (gltf) => {
    const model = gltf.scene.children[0]
    model.scale.set(
        model.scale.x * scaleFactor,
        model.scale.y * scaleFactor,
        model.scale.z * scaleFactor
    )
    model.rotation.z = Math.PI * -0.5
    model.position.set(0, 0, 0)

    createPieceByModel(
        new THREE.Vector3(0, 0.8, 2),
        'white',
        'bishop',
        model.clone()
    )
    createPieceByModel(
        new THREE.Vector3(0, 0.8, 5),
        'white',
        'bishop',
        model.clone()
    )
})

gltfLoader.load('/gltf/white_queen.gltf', (gltf) => {
    whiteQueenModel = gltf.scene.children[0]
    whiteQueenModel.scale.set(
        whiteQueenModel.scale.x * scaleFactor,
        whiteQueenModel.scale.y * scaleFactor,
        whiteQueenModel.scale.z * scaleFactor
    )
    whiteQueenModel.rotation.z = Math.PI * -0.5
    whiteQueenModel.position.set(0, 0, 0)

    createPieceByModel(
        new THREE.Vector3(0, 0.9, 3),
        'white',
        'queen',
        whiteQueenModel.clone()
    )
})

gltfLoader.load('/gltf/white_king.gltf', (gltf) => {
    const model = gltf.scene.children[0]
    model.scale.set(
        model.scale.x * scaleFactor,
        model.scale.y * scaleFactor,
        model.scale.z * scaleFactor
    )
    model.rotation.z = Math.PI * -0.5
    model.position.set(0, 0, 0)

    createPieceByModel(
        new THREE.Vector3(0, 1.2, 4),
        'white',
        'king',
        model.clone()
    )
})

/**
 * Moves
 */
// Pawns
const moves = {
    'white-pawn': [{ x: 1, z: 0 }],
    'white-pawn-first': [{ x: 2, z: 0 }],
    'white-pawn-capture-left': [{ x: 1, z: -1 }],
    'white-pawn-capture-right': [{ x: 1, z: 1 }],
    'black-pawn': [{ x: -1, z: 0 }],
    'black-pawn-first': [{ x: -2, z: 0 }],
    'black-pawn-capture-left': [{ x: -1, z: 1 }],
    'black-pawn-capture-right': [{ x: -1, z: -1 }],
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
    moves.rook = rookMoves
}
defineRookMoves()

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
    moves.bishop = bishopMoves
}
defineBishopMoves()

// Knights
const defineKnightMoves = () => {
    moves.knight = [
        { x: -2, z: -1 },
        { x: -2, z: 1 },
        { x: -1, z: -2 },
        { x: -1, z: 2 },
        { x: 1, z: -2 },
        { x: 1, z: 2 },
        { x: 2, z: -1 },
        { x: 2, z: 1 },
    ]
}
defineKnightMoves()

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
    moves.queen = queenMoves
}
defineQueenMoves()

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
    moves.king = kingMoves

    moves['king-short-rochade'] = [{ x: 0, z: 2 }]
    moves['king-long-rochade'] = [{ x: 0, z: -3 }]
}
defineKingMoves()

// Initialize empty atackMap
const getEmptyAttackMap = () => {
    let attackMap = {
        white: [],
        black: [],
    }

    for (let x = 0; x < 8; x++) {
        attackMap.white[x] = []
        attackMap.black[x] = []
        for (let z = 0; z < 8; z++) {
            attackMap.white[x][z] = false
            attackMap.black[x][z] = false
        }
    }

    return attackMap
}

/**
 * Game Controlls
 */

// toggle turn (white or black team)
// and enable controls accordingly
const toggleMove = () => {
    whiteToMove = !whiteToMove
    blackDragControls.enabled = !blackDragControls.enabled
    whiteDragControls.enabled = !whiteDragControls.enabled
}

/**
 * Helper Functions
 */
const getEnemyColor = (color) => {
    if (color === 'white') {
        return 'black'
    }
    return 'white'
}

const getCoordinatesOfPiece = (object) => {
    const x = Math.round(object.position.x)
    const y = object.position.y
    const z = Math.round(object.position.z)

    return { x, y, z }
}

const resetEnPassent = () => {
    enPassent.movedPawn = null
    enPassent.possibleSquares = []
}

/**
 * Functions regarding Moves of the Pieces
 */
const getValidMoves = (piece, originPosition) => {
    let validMoves = []

    if (piece.name === 'pawn') {
        validMoves = getValidPawnMoves(piece, originPosition)
    } else {
        for (let move of moves[piece.name]) {
            const goalPosition = {
                x: originPosition.x + move.x,
                z: originPosition.z + move.z,
            }

            // Check if Goal is on the Board
            if (
                goalPosition.x < 0 ||
                goalPosition.x >= 8 ||
                goalPosition.z < 0 ||
                goalPosition.z >= 8
            ) {
                continue
            }

            // Check if lines clear
            switch (piece.name) {
                case 'rook':
                    if (
                        !checkHorizontallinesClear(originPosition, goalPosition)
                    ) {
                        continue
                    }
                    if (
                        !checkVerticallinesClear(originPosition, goalPosition)
                    ) {
                        continue
                    }
                    break
                case 'bishop':
                    if (
                        !checkDiagonallinesClear(originPosition, goalPosition)
                    ) {
                        continue
                    }
                    break
                case 'queen':
                    if (
                        !checkHorizontallinesClear(originPosition, goalPosition)
                    ) {
                        continue
                    }
                    if (
                        !checkVerticallinesClear(originPosition, goalPosition)
                    ) {
                        continue
                    }
                    if (
                        !checkDiagonallinesClear(originPosition, goalPosition)
                    ) {
                        continue
                    }
                    break
                default:
                    break
            }

            // check if on goal position is another piece
            const pieceOnGoalPosition =
                board[goalPosition.x][goalPosition.z].piece
            if (pieceOnGoalPosition != null) {
                if (pieceOnGoalPosition.color === piece.color) {
                    continue
                }
            }

            validMoves.push(move)
        }
    }

    return validMoves
}

const getValidPawnMoves = (piece, originPosition) => {
    let validPawnMoves = []

    if (piece.color === 'white') {
        // if square in front of pawn is free
        // if pawn is not on queening square
        if (originPosition.x != 7) {
            if (board[originPosition.x + 1][originPosition.z].piece === null) {
                validPawnMoves.push(...moves['white-pawn'])

                // on first move
                if (
                    originPosition.x === 1 &&
                    board[3][originPosition.z].piece === null
                ) {
                    validPawnMoves.push(...moves['white-pawn-first'])
                }
            }

            // pieces that could potentially be captured
            let rightPiece = null
            let leftPiece = null

            // if move does not leave the board on the sides
            if (originPosition.z + 1 != 8) {
                rightPiece =
                    board[originPosition.x + 1][originPosition.z + 1].piece
            }
            if (originPosition.z - 1 != -1) {
                leftPiece =
                    board[originPosition.x + 1][originPosition.z - 1].piece
            }

            // when pawn is able to capture something
            if (rightPiece != null) {
                if (rightPiece.color === 'black') {
                    validPawnMoves.push(...moves['white-pawn-capture-right'])
                }
            }
            if (leftPiece != null) {
                if (leftPiece.color === 'black') {
                    validPawnMoves.push(...moves['white-pawn-capture-left'])
                }
            }

            if (enPassent.movedPawn != null) {
                if (
                    (originPosition.x === enPassent.possibleSquares[0].x &&
                        originPosition.z === enPassent.possibleSquares[0].z) ||
                    (originPosition.x === enPassent.possibleSquares[1].x &&
                        originPosition.z === enPassent.possibleSquares[1].z)
                ) {
                    if (originPosition.z < enPassent.movedPawn.position.z) {
                        validPawnMoves.push(
                            ...moves['white-pawn-capture-right']
                        )
                    } else {
                        validPawnMoves.push(...moves['white-pawn-capture-left'])
                    }
                }
            }
        }
    } else if (piece.color === 'black') {
        // if square in front of pawn is free
        // if pawn is not on queening square
        if (originPosition.x != 0) {
            if (board[originPosition.x - 1][originPosition.z].piece === null) {
                validPawnMoves.push(...moves['black-pawn'])

                // on first move
                if (
                    originPosition.x === 6 &&
                    board[4][originPosition.z].piece === null
                ) {
                    validPawnMoves.push(...moves['black-pawn-first'])
                }
            }

            // when pawn is able to capture something
            let rightPiece = null
            let leftPiece = null

            // if move does not leave the board on the sides
            if (originPosition.z - 1 != -1) {
                rightPiece =
                    board[originPosition.x - 1][originPosition.z - 1].piece
            }
            if (originPosition.z + 1 != 8) {
                leftPiece =
                    board[originPosition.x - 1][originPosition.z + 1].piece
            }

            if (rightPiece != null) {
                if (rightPiece.color === 'white') {
                    validPawnMoves.push(...moves['black-pawn-capture-right'])
                }
            }
            if (leftPiece != null) {
                if (leftPiece.color === 'white') {
                    validPawnMoves.push(...moves['black-pawn-capture-left'])
                }
            }

            if (enPassent.movedPawn != null) {
                if (
                    (originPosition.x === enPassent.possibleSquares[0].x &&
                        originPosition.z === enPassent.possibleSquares[0].z) ||
                    (originPosition.x === enPassent.possibleSquares[1].x &&
                        originPosition.z === enPassent.possibleSquares[1].z)
                ) {
                    if (originPosition.z < enPassent.movedPawn.position.z) {
                        validPawnMoves.push(...moves['black-pawn-capture-left'])
                    } else {
                        validPawnMoves.push(
                            ...moves['black-pawn-capture-right']
                        )
                    }
                }
            }
        }
    }

    return validPawnMoves
}

const getPossibleRochade = (piece, originPosition, goalPosition) => {
    if (piece.name != 'king') {
        return []
    }
    if (rochade[piece.color].kingMoved) {
        return []
    }

    if (piece.color === 'white' && goalPosition.x != 0) {
        return []
    }
    if (piece.color === 'black' && goalPosition.x != 7) {
        return []
    }

    let validKingMoves = []

    const enemyColor = getEnemyColor(piece.color)
    const attackMap = getAttackMap()[enemyColor]

    if (!rochade[piece.color].rookLongMoved) {
        const rookPosition = originPosition.z - 3
        let check = false

        if (
            checkHorizontallinesClear(originPosition, {
                x: originPosition.x,
                z: rookPosition,
            })
        ) {
            for (let i = originPosition.z; i > rookPosition; i--) {
                if (attackMap[originPosition.x][i] === true) {
                    check = true
                }
            }
            if (!check) {
                validKingMoves.push(...moves['king-long-rochade'])
            }
        }
    }
    if (!rochade[piece.color].rookShortMoved) {
        const rookPosition = originPosition.z + 2
        let check = false

        if (
            checkHorizontallinesClear(originPosition, {
                x: originPosition.x,
                z: rookPosition,
            })
        ) {
            for (let i = originPosition.z; i < rookPosition; i++) {
                if (attackMap[originPosition.x][i] === true) {
                    check = true
                }
            }
            if (!check) {
                validKingMoves.push(...moves['king-short-rochade'])
            }
        }
    }

    return validKingMoves
}

// checks all squares between origin and goal position
// returns true when they are free
// returns false when the path is blocked
const checkHorizontallinesClear = (originPosition, goalPosition) => {
    // vertical move
    if (originPosition.z === goalPosition.z) {
        return true
    }
    // diagonal move
    if (
        originPosition.x != goalPosition.x &&
        originPosition.z != goalPosition.z
    ) {
        return true
    }

    // create z coordinates while containing order
    const zDeclines = goalPosition.z < originPosition.z
    const z_positions = [originPosition.z, goalPosition.z].sort(function (
        a,
        b
    ) {
        return a - b
    })

    let z = []
    for (let i = z_positions[0]; i <= z_positions[1]; i++) {
        z.push(i)
    }
    if (zDeclines) {
        z = z.reverse()
    }

    const numberSquaresMoved = z.length - 1

    for (let t = 1; t < numberSquaresMoved; t++) {
        if (board[goalPosition.x][z[t]].piece != null) {
            return false
        }
    }
    return true
}

// checks all squares between origin and goal position
// returns true when they are free
// returns false when the path is blocked
const checkVerticallinesClear = (originPosition, goalPosition) => {
    // horizontal move
    if (originPosition.x === goalPosition.x) {
        return true
    }
    // diagonal move
    if (
        originPosition.x != goalPosition.x &&
        originPosition.z != goalPosition.z
    ) {
        return true
    }

    // create x coordinates while containing order
    const xDeclines = goalPosition.x < originPosition.x
    const x_positions = [originPosition.x, goalPosition.x].sort(function (
        a,
        b
    ) {
        return a - b
    })

    let x = []
    for (let i = x_positions[0]; i <= x_positions[1]; i++) {
        x.push(i)
    }
    if (xDeclines) {
        x = x.reverse()
    }

    const numberSquaresMoved = x.length - 1

    for (let t = 1; t < numberSquaresMoved; t++) {
        if (board[x[t]][goalPosition.z].piece != null) {
            return false
        }
    }
    return true
}

// checks all squares between origin and goal position
// returns true when they are free
// returns false when the path is blocked
const checkDiagonallinesClear = (originPosition, goalPosition) => {
    // no diagonal move done
    if (originPosition.x === goalPosition.x) {
        return true
    }
    if (originPosition.z === goalPosition.z) {
        return true
    }

    // create x coordinates while containing order
    const xDeclines = goalPosition.x < originPosition.x
    const zDeclines = goalPosition.z < originPosition.z
    const xPositions = [originPosition.x, goalPosition.x].sort(function (a, b) {
        return a - b
    })
    var x = []
    for (var i = xPositions[0]; i <= xPositions[1]; i++) {
        x.push(i)
    }
    if (xDeclines) {
        x = x.reverse()
    }
    const zPositions = [originPosition.z, goalPosition.z].sort(function (a, b) {
        return a - b
    })
    var z = []
    for (var i = zPositions[0]; i <= zPositions[1]; i++) {
        z.push(i)
    }
    if (zDeclines) {
        z = z.reverse()
    }
    const numberSquaresMoved = x.length - 1
    for (let t = 1; t < numberSquaresMoved; t++) {
        if (board[x[t]][z[t]].piece != null) {
            return false
        }
    }
    return true
}

// returns an object with 2 2d arrays of the board and every attacked square on it
// ( an attacked square is a square where the enemy king is in check)
const getAttackMap = () => {
    let attackMap = getEmptyAttackMap()

    // loop over board
    for (let x = 0; x < 8; x++) {
        for (let z = 0; z < 8; z++) {
            if (board[x][z].piece != null) {
                const piece = board[x][z].piece
                const possibleMoves = getValidMoves(
                    piece,
                    getCoordinatesOfPiece(piece)
                )

                for (let move of possibleMoves) {
                    const goalPosition = {
                        x: x + move.x,
                        z: z + move.z,
                    }
                    attackMap[piece.color][goalPosition.x][
                        goalPosition.z
                    ] = true
                }
            }
        }
    }
    return attackMap
}

const checkKingChecks = (piece, goalPosition) => {
    // make move on board
    let ownKingPosition = null
    board[originPosition.x][originPosition.z].piece = null
    const buffer = board[goalPosition.x][goalPosition.z].piece
    board[goalPosition.x][goalPosition.z].piece = piece

    // get attackMap
    const attackMap = getAttackMap()

    // undo move on board
    board[originPosition.x][originPosition.z].piece = piece
    board[goalPosition.x][goalPosition.z].piece = buffer

    if (piece.name === 'king') {
        ownKingPosition = goalPosition
    } else {
        ownKingPosition = kingsPosition[piece.color]
    }

    const enemyKingPosition = kingsPosition[getEnemyColor(piece.color)]
    const enemyAttackMap = attackMap[getEnemyColor(piece.color)]
    const ownAttackMap = attackMap[piece.color]

    // check if own king is in check after move
    if (enemyAttackMap[ownKingPosition.x][ownKingPosition.z] === true) {
        // own king is in check > move not valid
        return false
    } else {
        kingsInCheck[piece.color] = false
    }

    if (ownAttackMap[enemyKingPosition.x][enemyKingPosition.z] === true) {
        // enemy King in check
        kingsInCheck[getEnemyColor(piece.color)] = true
    }

    return true
}

const checkLegalMove = (originPosition, piece) => {
    const goalPosition = getCoordinatesOfPiece(piece)
    const move = {
        x: goalPosition.x - originPosition.x,
        z: goalPosition.z - originPosition.z,
    }
    const validMoves = getValidMoves(piece, originPosition)
    validMoves.push(...getPossibleRochade(piece, originPosition, goalPosition))
    if (!containsObject(move, validMoves)) {
        return false
    }
    if (!checkKingChecks(piece, goalPosition)) {
        return false
    }

    return true
}

/**
 * Beat Figures
 */

// return a position at the side of the field for the taken pieces
const getOutPiecePlace = (piece) => {
    const color = piece.color
    if (color === 'white') {
        return { x: 8, y: piece.position.y, z: 9 + out[color].length }
    } else {
        return { x: -3, y: piece.position.y, z: -3 - out[color].length }
    }
}

const movePieceOut = (piece) => {
    out[piece.color].push(piece)
    const outPlace = getOutPiecePlace(piece)
    piece.position.set(outPlace.x, outPlace.y, outPlace.z)
    scene.add(piece)
}

/**
 * Illuminate functions
 */
const lightSquare = (position) => {
    const { x, z } = position
    if (x >= 0 && x < 8 && z >= 0 && z < 8) {
        const square = board[x][z].square
        if ((oldSquare != null) & (square != oldSquare)) {
            oldSquare.material.emissiveIntensity = 0.5
        }

        oldSquare = square
        square.material.emissiveIntensity = 1
    }
}

const lightMoves = (piece) => {
    const position = getCoordinatesOfPiece(piece)
    const validMoves = getValidMoves(piece, position)

    for (let move of validMoves) {
        const x = position.x + move.x
        const z = position.z + move.z

        const square = board[x][z].square
        square.material.emissive.set(0xaaaaaa)
        square.material.emissiveIntensity = 0.5
    }
}

const turnOffAllSquares = () => {
    for (let x = 0; x < 8; x++) {
        for (let z = 0; z < 8; z++) {
            board[x][z].square.material.emissive.set(0x000000)
        }
    }
}

/**
 * Camera
 */
// Camera Parameters
let parameter = {
    camerax: 3.45,
    cameray: 6,
    cameraz: 3.5,

    orthoCamerax: 3.45,
    orthoCameray: 7,
    orthoCameraz: 3.5,

    initialFrustumSize: 8,
    orthoCameraFrustumSize: 8,
    orthoCameraNear: 1,
    orthoCameraFar: 15,
}

parameter.resetCamera = () => {
    resetCamera = true
}
parameter.toggleShadows = () => {
    toggleShadows()
}
// Start with orthoCamera for now
parameter['3D-View'] = false

// Debug stuff
gui.add(parameter, '3D-View')
// gui.add(parameter, 'resetCamera')
// gui.add(parameter, 'toggleShadows')

// Perspective camera
const camera = new THREE.PerspectiveCamera(75, sizes.aspect, 0.1, 100)
camera.position.set(parameter.camerax, parameter.cameray, parameter.cameraz)

scene.add(camera)

const calculateFrustumSize = () => {
    const frustumMinLeft = (4.2 * 2) / sizes.aspect
    const frustumMinTop = 8.4

    // if (frustumLeft > 4 && frustumTop > 4) {
    //     parameter.orthoCameraFrustumSize = parameter.initialFrustumSize
    //     return
    // }
    const frustumMin = Math.max(frustumMinLeft, frustumMinTop)

    console.log(frustumMin)

    parameter.orthoCameraFrustumSize = Math.max(frustumMinLeft, frustumMinTop)
}

calculateFrustumSize()

//Ortho Camera
const orthoCamera = new THREE.OrthographicCamera(
    (parameter.orthoCameraFrustumSize * sizes.aspect) / -2,
    (parameter.orthoCameraFrustumSize * sizes.aspect) / 2,
    parameter.orthoCameraFrustumSize / 2,
    parameter.orthoCameraFrustumSize / -2,
    parameter.orthoCameraNear,
    parameter.orthoCameraFar
)
orthoCamera.position.set(
    parameter.orthoCamerax,
    parameter.orthoCameray,
    parameter.orthoCameraz
)

orthoCamera.lookAt(mid)
scene.add(orthoCamera)

// Camera Helper
// const orthoCameraHelper = new THREE.CameraHelper(orthoCamera)
// scene.add(orthoCameraHelper)

// Debug stuff
// gui.add(parameter, 'orthoCamerax').min(-10).max(10).step(0.5)
// gui.add(parameter, 'orthoCameray').min(-10).max(10).step(0.5)
// gui.add(parameter, 'orthoCameraz').min(-10).max(10).step(0.5)
// gui.add(parameter, 'orthoCameraNear').min(0).max(10).step(1)
// gui.add(parameter, 'orthoCameraFar').min(1).max(10).step(1)

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 1)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.orthoCameraFar = 15
directionalLight.shadow.camera.left = -7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = -7
directionalLight.position.set(5, 5, 5)
scene.add(directionalLight)

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor(0x000000, 1)

/**
 * Controls
 */
// Orbit Controls
const orbitControls = new OrbitControls(camera, canvas)
orbitControls.enableDamping = true

// Drag Controls
const blackDragControls = new DragControls(
    pieces.black,
    orthoCamera,
    renderer.domElement
)

const whiteDragControls = new DragControls(
    pieces.white,
    orthoCamera,
    renderer.domElement
)

const dragStart = (event) => {
    const piece = event.object
    // disable orbit Controls while dragging
    orbitControls.enabled = false

    // Save start position on click on piece
    const position = getCoordinatesOfPiece(event.object)
    originPosition = position

    lightSquare(position)
    lightMoves(piece)
}

const drag = (event) => {
    const position = getCoordinatesOfPiece(event.object)
    lightSquare(position)
    event.object.position.y = originPosition.y // This will prevent moving z axis
}

const dragend = (event) => {
    const piece = event.object
    const goalPosition = getCoordinatesOfPiece(piece)

    if (checkLegalMove(originPosition, piece)) {
        // check if on goal position is another piece
        const pieceOnGoalPosition = board[goalPosition.x][goalPosition.z].piece
        if (pieceOnGoalPosition != null) {
            movePieceOut(pieceOnGoalPosition)
        }

        // move piece on threejs board
        piece.position.x = oldSquare.position.x
        piece.position.z = oldSquare.position.z

        // move piece in board array
        board[originPosition.x][originPosition.z].piece = null
        board[piece.position.x][piece.position.z].piece = piece

        // En Passant and Queening from pawns
        if (piece.name === 'pawn') {
            if (enPassent.movedPawn != null) {
                if (
                    ((originPosition.x === enPassent.possibleSquares[0].x &&
                        originPosition.z === enPassent.possibleSquares[0].z) ||
                        (originPosition.x === enPassent.possibleSquares[1].x &&
                            originPosition.z ===
                                enPassent.possibleSquares[1].z)) &&
                    piece.position.z === enPassent.movedPawn.position.z
                ) {
                    board[enPassent.movedPawn.position.x][
                        enPassent.movedPawn.position.z
                    ].piece = null
                    movePieceOut(enPassent.movedPawn)
                }
            }
            resetEnPassent()

            if (piece.color === 'white') {
                if (piece.position.x - originPosition.x === 2) {
                    enPassent.movedPawn = piece
                    enPassent.possibleSquares.push({
                        x: 3,
                        z: originPosition.z - 1,
                    })
                    enPassent.possibleSquares.push({
                        x: 3,
                        z: originPosition.z + 1,
                    })
                }
                if (piece.position.x === 7) {
                    piece.position.x = -3
                    piece.position.z = -2
                    createPieceByModel(
                        new THREE.Vector3(
                            oldSquare.position.x,
                            0.9,
                            oldSquare.position.z
                        ),
                        'white',
                        'queen',
                        whiteQueenModel.clone()
                    )
                }
            }
            if (piece.color === 'black') {
                if (originPosition.x - piece.position.x === 2) {
                    enPassent.movedPawn = piece
                    enPassent.possibleSquares.push({
                        x: 4,
                        z: originPosition.z - 1,
                    })
                    enPassent.possibleSquares.push({
                        x: 4,
                        z: originPosition.z + 1,
                    })
                }
                if (piece.position.x === 0) {
                    piece.position.x = 8
                    piece.position.z = 8
                    createPieceByModel(
                        new THREE.Vector3(
                            oldSquare.position.x,
                            0.9,
                            oldSquare.position.z
                        ),
                        'black',
                        'queen',
                        blackQueenModel.clone()
                    )
                }
            }
        }

        // keep position of kings up to date to make checking for "checks" more efficient
        if (piece.name === 'king') {
            // Long Rochade moved
            if (kingsPosition[piece.color].z - piece.position.z === 3) {
                // move rook in board array
                const rook = board[piece.position.x][0].piece
                board[piece.position.x][0].piece = null
                board[piece.position.x][3].piece = rook
                rook.position.z = 3

                rochade[piece.color].kingMoved = true
            }
            // short Rochade moved
            if (piece.position.z - kingsPosition[piece.color].z === 2) {
                // move rook in board array
                const rook = board[piece.position.x][7].piece
                board[piece.position.x][7].piece = null
                board[piece.position.x][5].piece = rook
                rook.position.z = 5

                rochade[piece.color].kingMoved = true
            }
            kingsPosition[piece.color].x = piece.position.x
            kingsPosition[piece.color].z = piece.position.z
        }

        // When king or rook moves rochade is no longer possible
        if (piece.name === 'king' || piece.name === 'rook') {
            rochade[piece.color].kingMoved = true
        }

        toggleMove()
    } else {
        // When move not legal uno move
        piece.position.x = originPosition.x
        piece.position.z = originPosition.z
    }

    turnOffAllSquares()
    orbitControls.enabled = true
}

blackDragControls.addEventListener('dragstart', dragStart)
whiteDragControls.addEventListener('dragstart', dragStart)
blackDragControls.addEventListener('drag', drag)
whiteDragControls.addEventListener('drag', drag)
blackDragControls.addEventListener('dragend', dragend)
whiteDragControls.addEventListener('dragend', dragend)

blackDragControls.enabled = false

const enableDragControls = () => {
    if (whiteToMove) {
        whiteDragControls.enabled = true
    } else {
        blackDragControls.enabled = true
    }
}

/**
 * Eventlistener
 */

window.addEventListener('resize', () => {
    console.log('resize')
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    sizes.aspect = sizes.width / sizes.height

    calculateFrustumSize()
    // Update perspective camera
    camera.aspect = sizes.aspect
    camera.updateProjectionMatrix()

    // Update Orthogonal Camera
    orthoCamera.left = (parameter.orthoCameraFrustumSize * sizes.aspect) / -2
    orthoCamera.right = (parameter.orthoCameraFrustumSize * sizes.aspect) / 2
    orthoCamera.top = parameter.orthoCameraFrustumSize / 2
    orthoCamera.bottom = parameter.orthoCameraFrustumSize / -2

    // console.log(orthoCamera.right)

    orthoCamera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

const toggleShadows = () => {
    renderer.shadowMap.enabled = !renderer.shadowMap.enabled
    scene.traverse(function (child) {
        if (child.material) {
            child.material.needsUpdate = true
        }
    })
}

const tick = () => {
    let activeCamera
    // switch active Camera
    if (!parameter['3D-View']) {
        activeCamera = orthoCamera
        orbitControls.enabled = false
        enableDragControls()
    } else {
        blackDragControls.enabled = false
        whiteDragControls.enabled = false
        activeCamera = camera
        orbitControls.enabled = true
    }

    // Update controls
    orbitControls.update()

    // Reset Persdpective Camera to Position in the Middle of the playing Field
    if (resetCamera === true) {
        camera.position.set(
            parameter.camerax,
            parameter.cameray,
            parameter.cameraz
        )

        camera.lookAt(mid)
        orbitControls.target = mid
        resetCamera = false
    }

    // debug ortho camera
    // orthoCamera.position.set(
    //     parameter.orthoCamerax,
    //     parameter.orthoCameray,
    //     parameter.orthoCameraz
    // )

    // orthoCamera.near = parameter.orthoCameraNear
    // orthoCamera.far = parameter.orthoCameraFar

    // orthoCamera.updateProjectionMatrix()
    // orthoCameraHelper.update()

    // Render
    renderer.render(scene, activeCamera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
