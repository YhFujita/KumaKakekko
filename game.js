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
let itemSpawned = false; // そのステージで回復アイテムを出したか
let isStageUpgradePending = false; // ステージ移行待機フラグ

const restartContainer = null; // 削除
const restartButton = null; // 削除

// マウス操作の無効化
canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});
canvas.addEventListener('mousedown', (e) => {
  e.preventDefault();
});
// テキスト選択無効化 (CSSでも行うがJSでも補強)
canvas.style.userSelect = 'none';

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
  itemSpawned = false; // アイテム済みフラグ解除
  isStageUpgradePending = false; // 待機フラグ解除
  bear.y = canvas.height - spriteHeight - 70;
  bear.jumpVelocity = 0;
  bear.isJumping = false;

  bear.isJumping = false;

  bear.isJumping = false;

  // gameLoopは常時回っているのでここでは呼ばない
}

const jumpSound = new Audio("jump07.mp3"); // ジャンプ音声の設定

// キーボードイベント
// キーボードイベント
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    if (isGameOver) {
      resetGame();
    } else if (!bear.isJumping) {
      bear.isJumping = true;
      bear.jumpVelocity = -10; // ジャンプの初速
      jumpSound.play(); // ジャンプ時に音声を再生
    }
  }
});

// 障害物を生成
function createObstacle() {
  if (stage >= 3 && !itemSpawned && Math.random() < 0.3) {
    // ステージ3以降、確率で回復アイテム生成（1ステージ1回）
    createHealItem();
    itemSpawned = true;
    return;
  }

  let typeData;
  let moveType = 'normal';
  let category = 'obstacle';
  let vx = 0; // 追加の速度成分

  // ステージごとの生成ロジック
  if (stage === 1) {
    typeData = obstacleTypes.find(t => t.id === 1) || { color: "red", width: 40, height: 40, yOffset: 0 };
  } else if (stage === 2) {
    typeData = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
  } else if (stage === 3) {
    // ステージ3: 左右に動く障害物を混ぜる
    typeData = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
    if (Math.random() < 0.5) {
      moveType = 'wiggle';
    }
  } else if (stage === 4) {
    // ステージ4: リス（弾を撃つ）を混ぜる
    if (Math.random() < 0.5) {
      // リス（茶色い小さめの四角で代用、あるいはID定義）
      typeData = { color: "brown", width: 40, height: 40, yOffset: 0, id: 99 };
      category = 'shooter';
    } else {
      typeData = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
    }
  } else if (stage >= 5) {
    // ステージ5: 全部入り
    const r = Math.random();
    if (r < 0.4) {
      typeData = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
      moveType = 'wiggle';
    } else if (r < 0.7) {
      typeData = { color: "brown", width: 40, height: 40, yOffset: 0, id: 99 };
      category = 'shooter';
    } else {
      typeData = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
    }
  }

  obstacles.push({
    x: canvas.width,
    y: canvas.height - typeData.height - groundHeight - typeData.yOffset,
    width: typeData.width,
    height: typeData.height,
    color: typeData.color,
    type: typeData.type,
    moveType: moveType,
    category: category,
    baseY: canvas.height - typeData.height - groundHeight - typeData.yOffset, // 基準位置
    wiggleOffset: 0, // 揺れ計算用
    shootTimer: 60, // 発射間隔
    vx: vx
  });
}

function createHealItem() {
  obstacles.push({
    x: canvas.width,
    y: canvas.height - 150, // 空中に出現
    width: 30,
    height: 30,
    color: "yellow",
    type: -1, // アイテム
    moveType: 'bounce',
    category: 'item',
    vy: 0,
    groundY: canvas.height - 30 - groundHeight
  });
}

// ドングリ生成
function createAcorn(x, y) {
  obstacles.push({
    x: x,
    y: y,
    width: 20,
    height: 20,
    color: "#8B4513", // こげ茶
    type: -2,
    moveType: 'projectile',
    category: 'projectile',
    vx: 8 // 高速
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
// 障害物・敵・アイテムの更新と描画
function updateAndDrawObstacles() {
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obj = obstacles[i];

    // 移動ロジック
    let speed = obstacleSpeed;
    if (obj.category === 'projectile') speed = obj.vx; // 弾は独自の速度

    obj.x -= speed;

    // 特殊移動
    if (obj.moveType === 'wiggle') {
      // 左右に揺れる動きを強調、後ろにも動くように
      // speedが2のとき、振幅が5なら +3 (後ろへ) ~ -7 (前へ) となる
      obj.x += Math.cos(frameCount * 0.05) * 5;
      // 元の直線移動(x -= speed) は上の行で行われている
    } else if (obj.moveType === 'bounce') {
      // アイテムのバウンド
      obj.y += obj.vy;
      obj.vy += 0.5; // 重力
      if (obj.y > obj.groundY) {
        obj.y = obj.groundY;
        obj.vy = -10; // 跳ねる
      }
    }

    // 敵のアクション
    if (obj.category === 'shooter') {
      obj.shootTimer--;
      if (obj.shootTimer <= 0) {
        createAcorn(obj.x, obj.y + 10);
        obj.shootTimer = 120; // 次の発射まで
      }
    }

    // 描画
    if (obj.category === 'item') {
      drawStar(obj.x + 15, obj.y + 15, 5, 15, 7); // ☆を描画
    } else if (obj.category === 'projectile') {
      ctx.fillStyle = obj.color;
      ctx.beginPath();
      ctx.arc(obj.x + 10, obj.y + 10, 10, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = obj.color || "red";
      ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
    }

    // 衝突判定（無敵時間中は判定しない、アイテムは別）
    // 当たり判定の調整
    const hitBoxMarginLeft = 30;
    const hitBoxMarginRight = 10;

    let isHit = false;
    if (
      bear.x + hitBoxMarginLeft < obj.x + obj.width &&
      bear.x + bear.width - hitBoxMarginRight > obj.x &&
      bear.y + bear.height + 60 > obj.y
    ) {
      isHit = true;
    }

    if (isHit) {
      if (obj.category === 'item') {
        // アイテムゲット
        if (lives < 3) lives++; // ライフ回復
        obstacles.splice(i, 1);
        continue; // 処理終了
      } else {
        // 敵・障害物
        if (!isInvincible && !isGameOver) {
          lives--;
          if (lives <= 0) {
            isGameOver = true;
            // restartContainer.style.display = "block"; // 削除
          } else {
            isInvincible = true;
            invincibleTimer = 60;
          }
        }
      }
    }

    // 画面外削除
    if (obj.x + obj.width < 0) {
      obstacles.splice(i, 1);
      if (obj.category !== 'projectile' && obj.category !== 'item') {
        score++; // 弾やアイテム以外はスコア加算
      }
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
  // すでに待機中なら何もしない
  if (isStageUpgradePending) return;

  // ステージクリア条件
  // Stage 1: 10点
  // Stage 2: 30点
  // Stage 3: 60点
  // Stage 4: 100点
  // Stage 5: 150点

  // Stage 5: 150点

  let nextStageThreshold = Infinity; // デフォルトは無限大（バグ回避）
  if (stage === 1) nextStageThreshold = 10;
  else if (stage === 2) nextStageThreshold = 30;
  else if (stage === 3) nextStageThreshold = 60;
  else if (stage === 4) nextStageThreshold = 100;
  else if (stage === 5) nextStageThreshold = 150;

  // デバッグ用ログ (バグ調査)
  if (Math.random() < 0.01) console.log(`Stage check: Stage ${stage}, Score ${score}, Threshold ${nextStageThreshold}`);

  if (score >= nextStageThreshold) {
    if (stage === 5) {
      // ゲームクリアは即時実行
      isGameOver = true;
      return;
    }

    // 次のステージへ進む条件を満たしたが、
    // 即座に変えずに「障害物がなくなるまで待つ」状態にする
    isStageUpgradePending = true;
  }
}

// 実際にステージを上げる処理 (障害物がなくなった後に実行)
function executeStageUpgrade() {
  stage++;
  stageMessageTimer = 180;
  itemSpawned = false; // 次のステージ用にリセット
  isStageUpgradePending = false; // 待機解除
  obstacleTimer = 60; // 新ステージ開始直後のインターバル

  // 難易度(スピード)調整
  // ステージ3・4のスピード低下は撤回し、徐々に速くするシンプルなロジックへ
  obstacleSpeed += 1;
  if (obstacleSpeed > 10) obstacleSpeed = 10;
}

// ゲームループ
function gameLoop() {

  // キャンバスをクリア
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!isGameOver) {
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
  }

  // 地面を描画
  drawGround();

  // クマを描画
  // ゲームオーバー時も描画する
  if (!isGameOver) {
    // 通常時：無敵時間中は点滅
    if (!isInvincible || Math.floor(Date.now() / 100) % 2 === 0) {
      drawBear();
    }
  } else {
    // ゲームオーバー時：点滅なしで描画
    drawBear();
  }

  if (!isGameOver) {
    // 障害物を生成・管理
    obstacleTimer--;
    // ステージ移行待機中は新たな障害物を出さない (画面がクリアになるのを待つ)
    if (obstacleTimer <= 0 && !isStageUpgradePending) {
      createObstacle();
      // 次の生成までの時間を設定
      if (stage === 1) {
        obstacleTimer = 120; // 固定（約2秒）
      } else {
        // ステージ2: ランダムかつ狭すぎない間隔
        obstacleTimer = Math.floor(Math.random() * 90) + 60;
      }
    }

    // 障害物を描画＆更新
    updateAndDrawObstacles();

    // 安全なステージ移行処理
    // 待機フラグが立っており、かつ画面上に障害物（アイテム含む全て）がない場合に移行実行
    if (isStageUpgradePending && obstacles.length === 0) {
      executeStageUpgrade();
    }

    // ジャンプして障害物を避けた場合のスコア加算
    if (bear.isJumping) {
      for (const obstacle of obstacles) {
        // すでにスコア加算済みの障害物は無視
        if (obstacle.isScored) continue;

        // 障害物とX軸で重なっているか
        if (bear.x + bear.width > obstacle.x && bear.x < obstacle.x + obstacle.width) {
          score++; // スコア加算
          obstacle.isScored = true; // フラグを立てて二重加算を防ぐ
        }
      }
    }

    // ステージアップ処理
    checkStageUp();
  } else {
    // ゲームオーバー時は更新せず、既存の障害物を描画だけする
    for (const obj of obstacles) {
      if (obj.category === 'item') {
        drawStar(obj.x + 15, obj.y + 15, 5, 15, 7);
      } else if (obj.category === 'projectile') {
        ctx.fillStyle = obj.color;
        ctx.beginPath();
        ctx.arc(obj.x + 10, obj.y + 10, 10, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = obj.color || "red";
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
      }
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
    const msg = stage === 5 ? "FINAL STAGE START!" : "STAGE " + stage + " START!";
    ctx.fillText(msg, canvas.width / 2, canvas.height / 2);
    ctx.textAlign = "start"; // 戻す
  }

  // ゲームクリア/オーバー表示
  if (isGameOver) {
    ctx.textAlign = "center";

    // ゲームクリア判定 (ステージ5でライフが残っている場合)
    if (stage === 5 && lives > 0) {
      ctx.fillStyle = "gold";
      ctx.font = "bold 50px Arial";
      ctx.fillText("おめでとう！げーむくりあ！", canvas.width / 2, canvas.height / 2);
    } else {
      // それ以外はゲームオーバー
      ctx.fillStyle = "red";
      ctx.font = "bold 50px Arial";
      ctx.fillText("ゲームオーバー", canvas.width / 2, canvas.height / 2);
    }

    ctx.fillStyle = "black";
    ctx.font = "30px Arial";
    ctx.fillText("スペースキーで さいしょから", canvas.width / 2, canvas.height / 2 + 50);
    ctx.textAlign = "start";
  }

  // ステージアップ処理
  // checkStageUp(); // 上に移動済み

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