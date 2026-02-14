function renderLineChart(canvasId, dataPoints) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const max = Math.max(...dataPoints);
  const min = Math.min(...dataPoints);
  const range = max - min || 1;

  ctx.beginPath();
  ctx.strokeStyle = "#000";

  dataPoints.forEach((value, index) => {
    const x = (index / (dataPoints.length - 1)) * canvas.width;
    const y = canvas.height - ((value - min) / range) * canvas.height;

    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();
}
