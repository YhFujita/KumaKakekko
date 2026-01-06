const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// スプライトシートの設定
const bearImage = new Image();
bearImage.src = "bear_sprite.png"; // クマのスプライト画像
const spriteWidth = 64; // 各フレームの幅
const spriteHeight = 64; // 各フレームの高さ
const totalFrames = 4; // フレーム数

// クマの設定
const bear = {
  x: 50,
  y: canvas.height - spriteHeight - 70, // 地面(20) + 余白(50)
  width: spriteWidth,
  width: spriteWidth,
  height: spriteHeight,
  jumpHeight: 170, // ジャンプの高さ
  isJumping: false,
  jumpVelocity: 0,
};

// 障害物の設定
const obstacles = [];
const obstacleWidth = 40;
const obstacleHeight = 40;
let obstacleSpeed = 4;

// ゲームの状態
let currentFrame = 0;
let frameCount = 0;
let frameSpeed = 10;
let score = 0;
let stage = 1;
let isGameOver = false;
let lives = 3; // ライフ
let isInvincible = false; // 無敵状態
let invincibleTimer = 0; // 無敵時間のタイマー
let obstacleTimer = 0; // 障害物生成タイマー
let groundHeight = 20; // 地面の高さ（下の余白）
let stageMessageTimer = 0; // ステージクリアなどのメッセージ表示用タイマー

const restartContainer = document.getElementById("restartContainer");
const restartButton = document.getElementById("restartButton");

restartButton.addEventListener("click", () => {
  resetGame();
});

function resetGame() {
  score = 0;
  stage = 1;
  lives = 3;
  isGameOver = false;
  isInvincible = false;
  invincibleTimer = 0;
  obstacleTimer = 120;
  obstacleSpeed = 4;
  frameSpeed = 10;
  obstacles.length = 0; // 障害物全削除
  bear.y = canvas.height - spriteHeight - 70;
  bear.jumpVelocity = 0;
  bear.isJumping = false;

  restartContainer.style.display = "none";
  gameLoop();
}

const jumpSound = new Audio("jump07.mp3"); // ジャンプ音声の設定

// キーボードイベント
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && !bear.isJumping) {
    bear.isJumping = true;
    bear.jumpVelocity = -10; // ジャンプの初速
    jumpSound.play(); // ジャンプ時に音声を再生
  }
});

// 障害物を生成
function createObstacle() {
  // obstacleTypesからランダム、あるいはステージに応じて選択
  // ステージ1は単純な四角(ID:1)のみ、ステージ2はランダムなど
  let typeData;
  if (stage === 1) {
    typeData = obstacleTypes.find(t => t.id === 1) || { color: "red", width: 40, height: 40, yOffset: 0 };
  } else {
    // ランダムに選択
    typeData = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
  }

  obstacles.push({
    x: canvas.width,
    y: canvas.height - typeData.height - groundHeight - typeData.yOffset, // 地面の上に配置
    width: typeData.width,
    height: typeData.height,
    color: typeData.color,
    type: typeData.type
  });
}

// 地面を描画
function drawGround() {
  ctx.fillStyle = "#8B4513"; // 茶色
  ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);
}

// 星（ライフ）を描画
function drawStar(cx, cy, spikes, outerRadius, innerRadius) {
  let rot = Math.PI / 2 * 3;
  let x = cx;
  let y = cy;
  let step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.lineWidth = 5;
  ctx.strokeStyle = 'orange'; // 枠線
  ctx.stroke();
  ctx.fillStyle = 'yellow'; // 中身
  ctx.fill();
}

// 障害物を描画
// 障害物を描画
function drawObstacles() {
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obstacle = obstacles[i];
    obstacle.x -= obstacleSpeed;

    // 障害物を描画
    ctx.fillStyle = obstacle.color || "red";
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

    // 衝突判定（無敵時間中は判定しない）
    if (!isInvincible && !isGameOver) {
      if (
        bear.x < obstacle.x + obstacle.width &&
        bear.x + bear.width > obstacle.x &&
        bear.y + bear.height + 60 > obstacle.y // クマの座標が高いため、当たり判定を下方向に拡張
      ) {
        // 衝突！
        lives--;
        if (lives <= 0) {
          isGameOver = true;
          // alert("ゲームオーバー! スコア: " + score); // アラート形式から変更
          restartContainer.style.display = "block"; // リスタートボタン表示
        } else {
          // ダメージ演出＆無敵開始
          isInvincible = true;
          invincibleTimer = 60; // 60フレーム(約1秒)無敵
          // 衝突した障害物は消す？それともすり抜ける？今回はすり抜ける（多段ヒット防止のため無敵にするので）
        }
      }
    }

    // 障害物が画面外に出たら削除
    if (obstacle.x + obstacle.width < 0) {
      obstacles.splice(i, 1);
      score++; // 障害物を避けたらスコア加算
    }
  }
}

// クマを描画
function drawBear() {
  ctx.drawImage(
    bearImage,
    currentFrame * spriteWidth,
    0,
    spriteWidth,
    spriteHeight,
    bear.x,
    bear.y,
    spriteWidth * 2,
    spriteHeight * 2
  );
}

// ステージアップ処理
function checkStageUp() {
  // ステージ1の場合、特定スコアでステージアップ
  if (stage === 1 && score >= 10) { // テスト用に10点で設定（元は30）
    stage = 2;
    // ステージクリア演出 (アラートだと止まってしまう可能性があるため、メッセージタイマーを設定)
    stageMessageTimer = 180; // 3秒間表示

    // パラメータ変更
    obstacleSpeed += 2;
    // 背景色を変えるなどしてもよい
  }
}

// ゲームループ
function gameLoop() {
  if (isGameOver) {
    console.log("ゲームオーバー状態です。"); // デバッグメッセージ
    return;
  }

  // キャンバスをクリア
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // フレームの更新
  frameCount++;
  if (frameCount >= frameSpeed) {
    frameCount = 0;
    currentFrame = (currentFrame + 1) % totalFrames;
  }

  // クマのジャンプ処理
  if (bear.isJumping) {
    bear.y += bear.jumpVelocity;
    bear.jumpVelocity += 0.45; // 重力
    if (bear.y >= canvas.height - spriteHeight - 70) { // 元のY座標に戻す
      bear.y = canvas.height - spriteHeight - 70; // 元の位置に戻す
      bear.isJumping = false; // ジャンプ終了
    }
  }

  // 無敵時間の処理
  if (isInvincible) {
    invincibleTimer--;
    if (invincibleTimer <= 0) {
      isInvincible = false;
    }
  }

  // 地面を描画
  drawGround();

  // クマを描画
  // 無敵時間中は点滅させる
  if (!isInvincible || Math.floor(Date.now() / 100) % 2 === 0) {
    drawBear();
  }

  // 障害物を生成・管理
  obstacleTimer--;
  if (obstacleTimer <= 0) {
    createObstacle();
    // 次の生成までの時間を設定
    if (stage === 1) {
      obstacleTimer = 120; // 固定（約2秒）
    } else {
      // ステージ2: ランダムかつ狭すぎない間隔
      // 最低60フレーム(1秒)あける、最大150フレーム(2.5秒)など
      obstacleTimer = Math.floor(Math.random() * 90) + 60;
    }
  }

  // 障害物を描画
  drawObstacles();

  // ジャンプして障害物を避けた場合のスコア加算
  if (bear.isJumping && obstacles.length > 0) {
    const obstacle = obstacles[obstacles.length - 1]; // 最後の障害物を取得
    if (bear.x + bear.width > obstacle.x && bear.x < obstacle.x + obstacle.width) {
      score++; // 障害物を避けたらスコア加算
    }
  }

  // スコア表示
  ctx.fillStyle = "black";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 10, 30);
  ctx.fillText("Stage: " + stage, 10, 50);

  // ライフ表示
  for (let i = 0; i < lives; i++) {
    drawStar(100 + i * 30, 80, 5, 10, 5);
  }

  // ステージ遷移等のメッセージ表示
  if (stageMessageTimer > 0) {
    stageMessageTimer--;
    ctx.fillStyle = "blue";
    ctx.font = "bold 40px Arial";
    ctx.textAlign = "center";
    ctx.fillText("STAGE 2 START!", canvas.width / 2, canvas.height / 2);
    ctx.textAlign = "start"; // 戻す
  }

  // ステージアップ処理
  checkStageUp();

  // 次のフレームを要求
  requestAnimationFrame(gameLoop);
}

// 初期タイマー設定
obstacleTimer = 120;

// setIntervalは削除し、gameLoop内で管理する
// 画像がロードされたらゲームを開始
bearImage.onload = () => {
  gameLoop();
};