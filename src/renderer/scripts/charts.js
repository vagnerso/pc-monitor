// Desenho manual de sparkline em Canvas puro (sem dependencia externa).
class Sparkline {
  constructor(canvas, historyLength) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.historyLength = historyLength;
    this.values = [];
    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  _resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.max(1, rect.width * dpr);
    this.canvas.height = Math.max(1, rect.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
    const { ctx, canvas } = this;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    ctx.clearRect(0, 0, width, height);

    if (this.values.length < 2) return;

    const max = 100;
    const stepX = width / (this.historyLength - 1);
    const startIndex = this.historyLength - this.values.length;

    ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--accent-color').trim();
    ctx.lineWidth = 2;
    ctx.beginPath();

    this.values.forEach((value, i) => {
      const x = (startIndex + i) * stepX;
      const y = height - (value / max) * height;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
  }
}
