// Desenho manual de sparkline em Canvas puro (sem dependencia externa).
class Sparkline {
  constructor(canvas, historyLength) {
    this.canvas = canvas;
    this.canvasContext = canvas.getContext('2d');
    this.historyLength = historyLength;
    this.values = [];
    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  _resize() {
    const devicePixelRatio = window.devicePixelRatio || 1;
    const boundingRect = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.max(1, boundingRect.width * devicePixelRatio);
    this.canvas.height = Math.max(1, boundingRect.height * devicePixelRatio);
    this.canvasContext.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    this._draw();
  }

  push(value) {
    this.values.push(value);
    if (this.values.length > this.historyLength) {
      this.values.shift();
    }
    this._draw();
  }

  _draw() {
    const { canvasContext, canvas } = this;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvasContext.clearRect(0, 0, width, height);

    if (this.values.length < 2) return;

    const maxValue = 100;
    const pixelsPerStep = width / (this.historyLength - 1);
    const startIndex = this.historyLength - this.values.length;

    canvasContext.strokeStyle = getComputedStyle(document.body).getPropertyValue('--accent-color').trim();
    canvasContext.lineWidth = 2;
    canvasContext.beginPath();

    this.values.forEach((value, valueIndex) => {
      const pointX = (startIndex + valueIndex) * pixelsPerStep;
      const pointY = height - (value / maxValue) * height;
      if (valueIndex === 0) {
        canvasContext.moveTo(pointX, pointY);
      } else {
        canvasContext.lineTo(pointX, pointY);
      }
    });

    canvasContext.stroke();
  }
}

// Desenha um grafico de pizza (usado x livre) para uma unidade de disco, em Canvas puro.
function drawDiskUsagePie(canvas, usagePercent, severityLevel) {
  const canvasContext = canvas.getContext('2d');
  const devicePixelRatio = window.devicePixelRatio || 1;
  const canvasSize = canvas.clientWidth || canvas.width;

  canvas.width = Math.max(1, canvasSize * devicePixelRatio);
  canvas.height = Math.max(1, canvasSize * devicePixelRatio);
  canvasContext.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  canvasContext.clearRect(0, 0, canvasSize, canvasSize);

  const bodyStyle = getComputedStyle(document.body);
  const severityColors = {
    good: bodyStyle.getPropertyValue('--good-color').trim(),
    warning: bodyStyle.getPropertyValue('--warning-color').trim(),
    critical: bodyStyle.getPropertyValue('--critical-color').trim()
  };
  const freeColor = bodyStyle.getPropertyValue('--border-color').trim();
  const usedColor = severityColors[severityLevel] || severityColors.good;

  const centerX = canvasSize / 2;
  const centerY = canvasSize / 2;
  const radius = canvasSize / 2 - 1;
  const startAngle = -Math.PI / 2;
  const usedAngle = startAngle + (Math.min(100, Math.max(0, usagePercent)) / 100) * Math.PI * 2;

  canvasContext.beginPath();
  canvasContext.moveTo(centerX, centerY);
  canvasContext.arc(centerX, centerY, radius, startAngle, usedAngle);
  canvasContext.closePath();
  canvasContext.fillStyle = usedColor;
  canvasContext.fill();

  canvasContext.beginPath();
  canvasContext.moveTo(centerX, centerY);
  canvasContext.arc(centerX, centerY, radius, usedAngle, startAngle + Math.PI * 2);
  canvasContext.closePath();
  canvasContext.fillStyle = freeColor;
  canvasContext.fill();
}
