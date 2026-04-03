/**
 * Abbas Chess Engine - Logic Script
 * محرك شطرنج متطور يعتمد على Stockfish 10+
 */

let board = null;
let game = new Chess();
const engine = new Worker('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js');

// إعدادات المحرك UCI
engine.postMessage('uci');
engine.postMessage('setoption name MultiPV value 2'); // تحليل أفضل مسارين
engine.postMessage('setoption name Threads value 4'); // استغلال معالج الآيباد

// معالجة الرسائل القادمة من المحرك
engine.onmessage = function(event) {
    const msg = event.data;

    // استخراج النقلات
    if (msg.includes(' pv ')) {
        const parts = msg.split(' ');
        const move = parts[parts.indexOf('pv') + 1];
        const multi = parts[parts.indexOf('multipv') + 1];
        
        document.getElementById(`move-${multi}`).innerText = move.toUpperCase();
    }

    // استخراج التقييم (Score)
    if (msg.includes('score cp')) {
        const cp = parseInt(msg.split('score cp ')[1]);
        updateEvalUI(cp);
    }
};

function updateEvalUI(cp) {
    const score = (cp / 100).toFixed(2);
    document.getElementById('eval-num').innerText = score;
    
    // تحويل التقييم إلى نسبة مئوية للشريط
    let percentage = 50 - (cp / 20);
    percentage = Math.max(10, Math.min(90, percentage));
    document.getElementById('progress-bar').style.width = percentage + '%';
}

function analyze() {
    document.getElementById('engine-status').innerText = "يتم التحليل...";
    engine.postMessage('position fen ' + game.fen());
    engine.postMessage('go depth 16'); // عمق متوازن للسرعة
    startHumanTimer();
}

// وظيفة جلب الوضعية من النص (FEN)
function loadFenFromInput() {
    const fen = document.getElementById('fen-input').value;
    if (game.load(fen)) {
        board.position(fen);
        analyze();
    } else {
        alert("كود FEN غير صالح، يرجى التأكد من النسخ!");
    }
}

// مؤقت يوهم الخصم بالتفكير البشري
function startHumanTimer() {
    let timeLeft = Math.floor(Math.random() * 3) + 2; 
    const timerEl = document.getElementById('wait-timer');
    const interval = setInterval(() => {
        timerEl.innerText = timeLeft + "s";
        if (timeLeft <= 0) {
            clearInterval(interval);
            timerEl.innerText = "الآن!";
            document.getElementById('engine-status').innerText = "جاهز";
        }
        timeLeft--;
    }, 1000);
}

function onDrop(source, target) {
    const move = game.move({ from: source, to: target, promotion: 'q' });
    if (move === null) return 'snapback';
    analyze();
}

function resetGame() {
    game.reset();
    board.start();
    document.getElementById('move-1').innerText = "بانتظار الحركة...";
    document.getElementById('move-2').innerText = "---";
    analyze();
}

// إعداد اللوحة
const config = {
    draggable: true,
    position: 'start',
    onDrop: onDrop,
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
};

board = Chessboard('myBoard', config);
analyze();
