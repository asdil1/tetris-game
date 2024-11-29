// Настройки игры
const canvas = document.getElementById("game-canvas");
const context = canvas.getContext("2d");

const nextCanvas = document.getElementById("next-figure");
const nextCtx = nextCanvas.getContext("2d");

document.getElementById("username-display").innerHTML = localStorage.getItem("tetris.username");

const grid = 30;  // Размер одной клетки (30x30 пикселей)
const rows = 20;  // Высота поля в клетках
const cols = 14;  // Ширина поля в клетках

// Цвета для фигур
const colors = [
    null,
    '#00f0f0',
    '#f0f000',
    '#a000f0',
    '#00f000',
    '#f00000',
    '#742b2b',
    '#00fdb5',
];

// Определение фигур (тетримино)
const tetrominos = [
    [
        [1, 0, 0, 0],
        [1, 0, 0, 0],
        [1, 0, 0, 0],
        [1, 0, 0, 0]
    ],
    [
        [2, 2],
        [2, 2]
    ],
    [
        [3, 0, 0],
        [3, 0, 0],
        [3, 3, 0],
    ],
    [
        [0, 4, 4],
        [4, 4, 0],
        [0, 0, 0]
    ],
    [
        [5, 5, 5],
        [0, 5, 0],
        [0, 0, 0],
    ],
    [
        [0, 0, 6],
        [0, 0, 6],
        [0, 6, 6],
    ],
    [
        [7, 7, 0],
        [0, 7, 7],
        [0, 0, 0],
    ]
];

// Инициализация поля
let board;

// Игрок
const player = {
    pos: null,
    tetromino: null,  // Текущая фигура
    colorIndex: null,    // Индекс цвета
    score: null,
    score_for_update : null,
    level: null,
    dropInterval: null,
    lose : null
};


// Функция для создания пустого поля
function createBoard(rows, cols) {
    const board = [];
    for (let r = 0; r < rows; r++) {
        board[r] = [];
        for (let c = 0; c < cols; c++) {
            board[r][c] = 0;
        }
    }
    return board;
}

// генерируем индекс начальной фигуры
let nextTetrominoIndex = Math.floor(Math.random() * tetrominos.length);

// показываем следующую фигуру
function nextFigure(){
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);

    const offset = { x: 4, y: 3}; // Смещение для отрисовки

    // Отрисовываем следующую фигуру
    drawMatrix(tetrominos[nextTetrominoIndex], offset, nextCtx);
}

// Сбрасываем игрока с новой фигурой
function playerReset(){
    player.tetromino = tetrominos[nextTetrominoIndex]; // фигура
    player.colorIndex = nextTetrominoIndex + 1; // цвет фигуры
    player.pos.y = 0; // начальная позиция
    player.pos.x = Math.floor(cols / 2) - Math.floor(player.tetromino.length / 2);

    if (player.score >= player.score_for_update){
        player.level += 1;
        player.dropInterval -= 100;
        updateLevel();
        player.score_for_update *= 2;
    }

    if (!collide(board, player)){
        nextTetrominoIndex = Math.floor(Math.random() * tetrominos.length);
        nextFigure();
    }

    // проверка конца игры
    if (collide(board, player)){
        alert("Game Over!");
        storeScore();
        displayRecords();
        player.lose = true;
    }
}

function storeScore(){
    let playerName = localStorage.getItem("tetris.username");
    let records = JSON.parse(localStorage.getItem("tetris.records")) || [];

    const existingRecordIndex = records.findIndex(record => record.username === playerName);

    if (existingRecordIndex !== -1) {
       if(player.score > records[existingRecordIndex].score){
           records[existingRecordIndex].score = player.score;
       }
    }else{
        // Добавляем новый рекорд
        records.push({ username: playerName, score: player.score });
    }

    // Сортируем массив по очкам в порядке убывания
    records.sort((a, b) => b.score - a.score);

    // Ограничиваем массив 10 лучшими записями
    records = records.slice(0, 10);

    // Сохраняем обновлённый массив в LocalStorage
    localStorage.setItem("tetris.records", JSON.stringify(records));
}

function displayRecords(){
    let records = JSON.parse(localStorage.getItem("tetris.records")) || [];
    // Очищаем таблицу перед добавлением новых данных
    const tbody = document.getElementById("leaderboard-body");
    tbody.innerHTML = '';

    // Проходим по массиву рекордов и добавляем строки в таблицу
    records.forEach(record => {
        const row = document.createElement('tr');
        const nameCell = document.createElement('td');
        const scoreCell = document.createElement('td');

        nameCell.innerHTML = record.username;
        scoreCell.innerHTML = record.score;

        row.appendChild(nameCell);
        row.appendChild(scoreCell);
        tbody.appendChild(row);
    });
    document.getElementById("leaderboard").hidden = false;
}

// проверка на столкновение
function collide(board, player) {
    const [m, p] = [player.tetromino, player.pos];
    for (let y = 0; y < m.length; y++) {
        for (let x = 0; x < m[y].length; x++) {
            // Проверка, является ли текущая клетка тетромино занятой
            if (m[y][x] !== 0) {
                // Проверка выхода за пределы поля
                if (p.y + y < 0 || p.x + x < 0 || p.x + x >= cols || p.y + y >= rows || board[y + p.y][x + p.x] !== 0) {
                    return true;
                }
            }
        }
    }
    return false;
}

// добавляем фигуру на игровое поле
function merge(board, player) {
    for (let y = 0; y < player.tetromino.length; y++){
        for (let x = 0; x < player.tetromino[y].length; x++){
            if (player.tetromino[y][x] !== 0) {
                board[y + player.pos.y][x + player.pos.x] = player.colorIndex;
            }
        }
    }
}

// Отображение поля и текущей фигуры
function draw(){
    // Очищаем игровое поле
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Рисуем игровое поле
    drawMatrix(board, {x: 0, y: 0}, context);

    // Рисуем текущую фигуру
    drawMatrix(player.tetromino, player.pos, context);
}

// рисуем фигуру или поле
function drawMatrix(matrix, offset, ctx) {
    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < matrix[y].length; x++) {
            if (matrix[y][x] !== 0) {
                ctx.fillStyle = colors[matrix[y][x]];
                ctx.fillRect(grid * (x + offset.x), grid * (y + offset.y), grid, grid);
            }
        }
    }
}

// Проверка и удаление заполненных строк
function sweepBoard(){
    outer : for (let y = rows - 1; y >= 0 ; y--) {
        for (let x = cols - 1; x >= 0; x--) {
            if(board[y][x] === 0) {
                continue outer; // выходим из внутренего цикла строка не полная
            }
        }
        const row = board.splice(y, 1)[0].fill(0); // удаляем строку возвращаем и заполням нулями
        board.unshift(row); // добавляем строку сверху
        y++;
        player.score += 10;
    }
    updateScore();
}

function rotateMatrix(matrix) {
    const N = matrix.length;
    const result = [];

    for (let i = 0; i < N; i++) {
        result.push([]);
        for (let j = 0; j < N; j++) {
            result[i].push(matrix[N - j - 1][i]);
        }
    }
    return result;
}


function playerRotate(){
    const prevTetromino = player.tetromino;
    player.tetromino = rotateMatrix(player.tetromino);

    if(collide(board, player)){
        player.tetromino = prevTetromino;
    }
}

function playerMove(dir){
    player.pos.x += dir;
    if (collide(board, player)){
        player.pos.x -= dir;
    }
}

function updateScore(){
    document.getElementById("score").innerHTML = player.score;
}

function updateLevel(){
    document.getElementById("level").innerHTML = player.level;
}

function playerDrop(){
    player.pos.y++;
    if(collide(board, player)){
        player.pos.y--;
        merge(board, player);
        sweepBoard();
        playerReset();
    }
    dropCounter = 0;
}

let dropCounter = 0;
let lastTime = 0;

function update(time = 0){
    if (!player.lose){
        const deltaTime = time - lastTime;
        lastTime = time;
        dropCounter += deltaTime;
        if (dropCounter > player.dropInterval){
            playerDrop();
        }
        draw();
        requestAnimationFrame(update);
    }
}

document.addEventListener('keydown', event => {
    if (event.key === 'A' || event.key === 'a') {
        playerMove(-1);
    }
    else if (event.key === 'D' || event.key === 'd') {
        playerMove(1);
    }
    else if (event.key === 'W' || event.key === 'w') {
        playerRotate();
    }
    else if (event.key === 'S' || event.key === 's') {
        playerDrop();
    }
});

function changeName(){
    window.location.href = "index.html";
}

function playerNewGame(){
    player.pos = {x: 0, y: 0};
    player.tetromino = null;
    player.score = 0;
    player.score_for_update = 10;
    player.level = 1;
    player.dropInterval = 1000;
    player.lose = false;
    document.getElementById("leaderboard").hidden = true;
    updateScore();
    updateLevel();
    board = createBoard(rows, cols);
}


function main() {
    playerNewGame();
    playerReset();
    update();
}