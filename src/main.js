// 発動からデバフアイコン表示までの時間。この辺り要計測
const CLINCHER_DELAY = 1.19 * 1000; // 発動から麻痺アイコン表示まで1.19秒ぐらい？
const TWOCROWN_DELAY = 3.08 * 1000; // 発動から延長アイコン表示まで3.08秒ぐらい？

const canvas = document.querySelector('.timer-canvas');
canvas.width = 600;
canvas.height = 600;

const dataStore = new DataStore();

const timerOutput = document.querySelector('.timer-output');

const paralysis60Button = document.querySelector('.paralysis-60-button');
const extendButton = document.querySelector('.extend-button');
const unextendButton = document.querySelector('.unextend-button');

const buttonTimingSelect = document.querySelector('.button-timing-select');

const resetButton = document.querySelector('.reset-button');

(async function main() {
  // タイマーと描画周り
  const timer = new ParalysisTimer();

  const paralysisImg = await loadImageAsync('paralysis.svg');
  const timerCanvas = new TimerCanvas(canvas, { paralysisImg });
  timerCanvas.render(1, 0);
  timerOutput.value = '60.00';

  timer.addEventListener('tick', (event) => {
    timerCanvas.render(event.maxTimeMs, event.elapsedTimeMs);
    timerOutput.value = (event.remainTimeMs / 1000).toFixed(2);
  });

  // タイマーのモード切り替わったらボタンの有効/無効も切り替える
  timer.addEventListener('extend', (event) => {
    extendButton.disabled = true;
    unextendButton.disabled = false;
  });

  timer.addEventListener('unextend', (event) => {
    extendButton.disabled = false;
    unextendButton.disabled = true;
  });

  // ボタン周りの動作
  extendButton.disabled = true;
  unextendButton.disabled = true;

  paralysis60Button.addEventListener('click', (event) => {
    const delayMs = dataStore.buttonTiming === 'immediate' ? 0 : CLINCHER_DELAY;

    extendButton.disabled = false;
    timer.unextend();
    timer.reset();
    timer.start(delayMs);
  });

  extendButton.addEventListener('click', (event) => {
    timer.extend();
  });

  unextendButton.addEventListener('click', (event) => {
    timer.unextend();
  });

  // 設定ボタンの動作
  buttonTimingSelect.value = dataStore.buttonTiming;
  buttonTimingSelect.addEventListener('change', (event) => {
    dataStore.buttonTiming = buttonTimingSelect.value;
  });

  // システムボタンの動作
  resetButton.addEventListener('click', (event) => {
    timer.stop();
    timer.reset();
    timer.unextend();
    timerCanvas.render(1, 0);
    timerOutput.value = '60.00';
    extendButton.disabled = true;
    unextendButton.disabled = true;
  });
})();
