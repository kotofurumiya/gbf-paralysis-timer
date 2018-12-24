const canvas = document.querySelector('.timer-canvas');
canvas.width = 600;
canvas.height = 600;

const timerOutput = document.querySelector('.timer-output');

const paralysis60Button = document.querySelector('.paralysis-60-button');
const extendButton = document.querySelector('.extend-button');
const unextendButton = document.querySelector('.unextend-button');

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
    extendButton.disabled = false;
    timer.unextend();
    timer.reset();
    timer.start();
  });

  extendButton.addEventListener('click', (event) => {
    timer.extend();
  });

  unextendButton.addEventListener('click', (event) => {
    timer.unextend();
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
