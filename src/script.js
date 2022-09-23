import './style.css'
import * as THREE from 'three'
import { DragControls } from 'three/examples/jsm/controls/DragControls.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'

/**
 * Moves
 */
const moves = {
    "white-pawn": [{x: 1, z: 0}],
    "white-pawn-first": [{x: 1, z: 0}, {x: 2, z: 0}],
    "white-pawn-capture": [{x: 1, z: -1}, {x: 1, z: 1}],
    "black-pawn": [{x: -1, z: 0}],
    "black-pawn-first": [{x: -1, z: 0}, {x: -2, z: 0}],
    "black-pawn-capture": [{x: -1, z: -1}, {x: -1, z: 1}],
    
}


/**
 * Debug
 */
const gui = new dat.GUI()

/**
 * Globals
 */

let resetCamera = true
let oldSquare = null
let originPosition = null

const pieces = []

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()
const cubeTextureLoader = new THREE.CubeTextureLoader()

const environmentMapTexture = cubeTextureLoader.load([
    '/textures/environmentMaps/0/px.png',
    '/textures/environmentMaps/0/nx.png',
    '/textures/environmentMaps/0/py.png',
    '/textures/environmentMaps/0/ny.png',
    '/textures/environmentMaps/0/pz.png',
    '/textures/environmentMaps/0/nz.png'
])

/**
 * Objects
 */

// Board
const boardGroup = new THREE.Group()
const board = []
scene.add(boardGroup)

const squareGeometry = new THREE.BoxGeometry(1, 0.2, 1)

const createSquare = (black, position) => {
    const squareMaterial = new THREE.MeshStandardMaterial({
        metalness: 0.3,
        roughness: 0.4,
    })
    const square = new THREE.Mesh(squareGeometry, squareMaterial)
    square.material.color = new THREE.Color((black ===1) ? 'white' : 'black')

    square.position.copy(position)
    return square
}

for(let x=0; x<8; x++)
{
    board [x] = []
    for(let z=0; z<8; z++)
    {
        const black = (z+x)%2
        const square = createSquare(black, {x: x, y: 0, z: z})
        boardGroup.add(square)
        board[x][z] = {square: square, piece: null}
    }
}

// Pieces
const boxGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5)
const boxMaterial = new THREE.MeshStandardMaterial({
            metalness: 0.3,
            roughness: 0.4,
            envMap: environmentMapTexture,
            envMapIntensity: 0.5
        })

const createPiece = (position, color, name) => 
{
    const material = boxMaterial.clone()
    material.color.set(new THREE.Color((color === "black"? 'grey' : 'white')))
    const mesh = new THREE.Mesh(boxGeometry, material)
    mesh.name = name
    mesh.color = color
    mesh.castShadow = true
    mesh.position.copy(position)
    scene.add(mesh)
    board[position.x][position.z].piece = mesh
    pieces.push(mesh)
}

/**
 * Pawns
 */
for(let z=0; z<8; z++)
{
    createPiece(new THREE.Vector3(1, 0.3, z), "white", "pawn")
}
for(let z=0; z<8; z++)
{
    createPiece(new THREE.Vector3(6, 0.3, z), "black", "pawn")
}

/**
 * Rooks
 */
 const defineRookMoves = () => {
    let rookMoves = []
    for(let t=-7; t<8; t++){
        if(t===0){continue}
        rookMoves.push({x: t, z: 0})
        rookMoves.push({x: 0, z: t})
    }
    moves.rook = rookMoves
}
defineRookMoves()

createPiece(new THREE.Vector3(0, 0.3, 0), "white", "rook")
createPiece(new THREE.Vector3(0, 0.3, 7), "white", "rook")
createPiece(new THREE.Vector3(7, 0.3, 0), "black", "rook")
createPiece(new THREE.Vector3(7, 0.3, 7), "black", "rook")

/**
 * Bishops
 */
 const defineBishopMoves = () => {
    let bishopMoves = []
    for(let t=-7; t<8; t++){
        if(t===0){continue}
        bishopMoves.push({x: t, z: t})
        bishopMoves.push({x: -t, z: t})
        bishopMoves.push({x: t, z: -t})
        bishopMoves.push({x: -t, z: -t})
    }
    moves.bishop = bishopMoves
}
defineBishopMoves()

createPiece(new THREE.Vector3(0, 0.3, 2), "white", "bishop")
createPiece(new THREE.Vector3(0, 0.3, 5), "white", "bishop")
createPiece(new THREE.Vector3(7, 0.3, 2), "black", "bishop")
createPiece(new THREE.Vector3(7, 0.3, 5), "black", "bishop")

/**
 * Floor
 */
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({
        color: '#777777',
        metalness: 0.3,
        roughness: 0.4,
        envMap: environmentMapTexture,
        envMapIntensity: 0.5
    })
)
floor.receiveShadow = true
floor.rotation.x = - Math.PI * 0.5
floor.position.x = floor.position.x + 4.5
floor.position.z = floor.position.z + 4.5 
scene.add(floor)

/**
 * Helpers
 */
const axesHelpers = new THREE.AxesHelper()
scene.add(axesHelpers)

function containsObject(obj, list) {
    // Find if the array contains an object by comparing the property value
    if(list.some(move => move.x === obj.x && move.z === obj.z)){
        return true;
    } else{
        return false;
    }
}

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.left = - 7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = - 7
directionalLight.position.set(5, 5, 5)
scene.add(directionalLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */

const parameter = {
    camerax: 3.55,
    cameray: 6,
    cameraz: 3.5,
    cameraRotationX: 0,
    cameraRotationY: Math.PI * 1.5,
    cameraRotationZ: 0
}
parameter.resetCamera = () => { resetCamera = true}


gui.add(parameter, 'camerax').min(-10).max(10)
gui.add(parameter, 'cameray').min(-10).max(10)
gui.add(parameter, 'cameraz').min(-10).max(10)
gui.add(parameter, 'cameraRotationX').min(0).max(2*Math.PI)
gui.add(parameter, 'cameraRotationY').min(0).max(2*Math.PI)
gui.add(parameter, 'cameraRotationZ').min(0).max(2*Math.PI)
gui.add(parameter, 'resetCamera')

// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(
    parameter.camerax, 
    parameter.cameray, 
    parameter.cameraz)
camera.rotation.set(
    parameter.cameraRotationX, 
    parameter.cameraRotationY, 
    parameter.cameraRotationZ)
scene.add(camera)


/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Controls
 */
const dragControls = new DragControls( pieces, camera, renderer.domElement );
const orbitControls = new OrbitControls(camera, canvas)
orbitControls.enableDamping = true

// add event listener to highlight dragged objects
dragControls.addEventListener( 'dragstart', function ( event ) {event.object
    const piece = event.object
    orbitControls.enabled = false
	// piece.material.emissive.set( 0xaaaaaa );

    const position = getCoordinatesOfPiece(event.object)
    originPosition = position
    lightSquare(position)

    switch (piece.name) {
        case "pawn":
            lightPawnMoves(piece)
            break;            
        default:
            break;
    }
} );

dragControls.addEventListener ( 'drag', function( event ){
    const position = getCoordinatesOfPiece(event.object)
    lightSquare(position)

    event.object.position.y = 0.5; // This will prevent moving z axis, but will be on 0 line. change this to your object position of z axis.
   })

dragControls.addEventListener( 'dragend', function ( event ) {
    const piece = event.object
    orbitControls.enabled = true
    
    if(checkLegalMove(originPosition, piece))
    {
        // move piece on threejs board
        piece.position.x = oldSquare.position.x
        piece.position.y = 0.3
        piece.position.z = oldSquare.position.z

        // move piece in board array
        board[originPosition.x][originPosition.z].piece = null 
        board[piece.position.x][piece.position.z].piece = piece 
    }
    else
    {
        piece.position.x = originPosition.x
        piece.position.y = 0.3
        piece.position.z = originPosition.z
    }

    // piece.material.emissive.set( 0x000000 );
    turnOffAllSquares()
} );


/**
 * Helper Functions
 */
const getCoordinatesOfPiece = (object) => {
    const x = Math.round(object.position.x)
    const z = Math.round(object.position.z)

    return {x, z}
}

const getValidMoves = (piece, position) => {
    let validMoves = null

    if(piece.name === "pawn")
    {
        if (piece.color === "white")
            {
                if(position.x === 1){ validMoves = moves['white-pawn-first'] }
                else { validMoves = moves['white-pawn'] }
            }
            else if (piece.color === "black")
            {
                if(position.x === 6) { validMoves = moves['black-pawn-first']}
                else { validMoves = moves['black-pawn']}
            }
    }
    else
    {
        validMoves = moves[piece.name]
    }
    return validMoves
}

const checkLegalMove = (originPosition, piece) => {
    const goalPosition = getCoordinatesOfPiece(piece)
    const move = {
        x: goalPosition.x - originPosition.x, 
        z: goalPosition.z - originPosition.z
    }
    const validMoves = getValidMoves(piece, originPosition)
    if( !containsObject(move, validMoves)) { return false }
    
    // Check if Goal is on the Board
    if(goalPosition.x < 0 || goalPosition.x >= 8 || goalPosition.z < 0 || goalPosition.z >= 8){ return false }
    if(piece.name == 'pawn')
    {
        if (!checkHorizontallinesClear(originPosition, goalPosition)){ return false }
    }
    if(piece.name == 'rook')
    {
        if (!checkHorizontallinesClear(originPosition, goalPosition)){ return false }
        if (!checkVerticallinesClear(originPosition, goalPosition)){ return false }
    }
    if(piece.name === 'bishop')
    {
        if (!checkDiagonallinesClear(originPosition, goalPosition)){ return false }
    }
        
    return true
}

const checkHorizontallinesClear = (originPosition, goalPosition) => 
{
    if (originPosition.z === goalPosition.z) {return true}

    // create z coordinates while containing order
    const zDeclines = goalPosition.z < originPosition.z   
    const z_positions = [originPosition.z, goalPosition.z].sort(function (a, b) {  return a - b;  });
    
    let z = []
    for(let i=z_positions[0]; i <= z_positions[1]; i++ )
    {
        z.push(i)
    }
    if(zDeclines){ z = z.reverse() }

    const numberSquaresMoved = z.length -1
    
    for(let t=1; t <= numberSquaresMoved; t++ )
    {
        if(board[goalPosition.x][z[t]].piece != null){ return false }
    }    
    return true
}

const checkVerticallinesClear = (originPosition, goalPosition) => 
{
    if (originPosition.x === goalPosition.x) {return true}

    // create x coordinates while containing order
    const xDeclines = goalPosition.x < originPosition.x   
    const x_positions = [originPosition.x, goalPosition.x].sort(function (a, b) {  return a - b;  });
    
    let x = []
    for(let i=x_positions[0]; i <= x_positions[1]; i++ )
    {
        x.push(i)
    }
    if(xDeclines){ x = x.reverse() }

    const numberSquaresMoved = x.length -1
    
    for(let t=1; t <= numberSquaresMoved; t++ )
    {
        if(board[x[t]][goalPosition.z].piece != null){ return false }
    }    
    return true
}

const checkDiagonallinesClear = (originPosition, goalPosition) => 
{
    // no diagonal move done
    if (originPosition.x === goalPosition.x) {return true}
    if (originPosition.z === goalPosition.z) {return true}

    // create x coordinates while containing order
    const xDeclines = goalPosition.x < originPosition.x
    const zDeclines = goalPosition.z < originPosition.z

    const xPositions = [originPosition.x, goalPosition.x].sort(function (a, b) {  return a - b;  });
    var x = [];
    for (var i=xPositions[0]; i<=xPositions[1];i++) { x.push(i); }
    if(xDeclines){ x = x.reverse() }
    
    const zPositions = [originPosition.z, goalPosition.z].sort(function (a, b) {  return a - b;  });
    var z = [];
    for (var i=zPositions[0]; i<=zPositions[1];i++) { z.push(i); }
    if(zDeclines){ z = z.reverse() }

    const numberSquaresMoved = x.length -1
    
    for(let t=1; t <= numberSquaresMoved; t++ )
    {
        if(board[x[t]][z[t]].piece != null){ return false }
    }
    return true
}


/**
* Illuminate functions
*/

const lightSquare = (position) =>
{
    const {x, z} = position
    if(x >= 0 && x < 8 && z >= 0 && z < 8)
    {
        const square = board[x][z].square
        if(oldSquare != null & square != oldSquare)
        {
            oldSquare.material.emissiveIntensity = 0.5
        }
    
        oldSquare = square
        square.material.emissiveIntensity = 1
    }
}

const lightPawnMoves = (piece) => 
{
    const position = getCoordinatesOfPiece(piece)
    const validMoves = getValidMoves(piece, position)

    for(let move of validMoves)
    {
        const x = position.x + move.x
        const z = position.z + move.z
        
        if(x >= 0 && x < 8 && z >= 0 && z < 8)
        {
            const square = board[x][z].square
            square.material.emissive.set( 0xaaaaaa )
            square.material.emissiveIntensity = 0.5
        }
    }
}

const turnOffAllSquares = () => {
    for(let x = 0; x < 8; x++)
    {
        for(let z = 0; z < 8; z++)
        {
            board[x][z].square.material.emissive.set( 0x000000 )
        }
    }
}

/**
 * Animate
 */
const clock = new THREE.Clock()

const mid = new THREE.Vector3(3.5, 0, 3.5)
let oldElapsedTime = 0

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - oldElapsedTime
    oldElapsedTime = elapsedTime

    // Update controls
    orbitControls.update() 

    // Update Camera Position
    if(resetCamera === true)
    {
        camera.position.set(
            parameter.camerax, 
            parameter.cameray, 
            parameter.cameraz)
            
        camera.rotation.set(
            parameter.cameraRotationX, 
            parameter.cameraRotationY, 
            parameter.cameraRotationZ)

        camera.lookAt(mid)
        orbitControls.target = mid
        resetCamera = false
    }

    
    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()