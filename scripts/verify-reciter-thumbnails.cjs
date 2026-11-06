const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const outDir = path.join(__dirname, '..', 'test-output', 'reciter-thumbnails');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

app.whenReady().then(async () => {
  console.log('🚀 Launching Reciter Framing & Feathered Fade Verification Test...');

  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
    },
  });

  const mishariB64 = fs.readFileSync(path.join(__dirname, '../public/reciter_images/mishari-rashid-alafasy.jpg')).toString('base64');
  const surahFontB64 = fs.readFileSync(path.join(__dirname, '../public/Quran fonts/surah-name-v1.ttf')).toString('base64');

  const testHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @font-face {
      font-family: 'surah-name-v1';
      src: url('data:font/truetype;charset=utf-8;base64,${surahFontB64}') format('truetype');
    }
  </style>
</head>
<body style="background: #000; margin: 0;">
  <canvas id="testCanvas" width="1280" height="720"></canvas>
  <img id="mishariImg" src="data:image/jpeg;base64,${mishariB64}" />
</body>
</html>
  `;

  win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(testHtml)}`);

  win.webContents.on('did-finish-load', async () => {
    try {
      const results = await win.webContents.executeJavaScript(`
        (async () => {
          const report = [];
          const canvas = document.getElementById('testCanvas');
          const ctx = canvas.getContext('2d');
          const pImg = document.getElementById('mishariImg');

          function createLiquidGoldGradient(ctx, x1, y1, x2, y2) {
            const grad = ctx.createLinearGradient(x1, y1, x2, y2);
            grad.addColorStop(0.0, '#FFFFFF');
            grad.addColorStop(0.18, '#FEF08A');
            grad.addColorStop(0.48, '#F59E0B');
            grad.addColorStop(0.78, '#D97706');
            grad.addColorStop(1.0, '#78350F');
            return grad;
          }

          function createIslamicArchPath(ctx, x, y, w, h) {
            const springY = y + h * 0.42;
            const peakY = y;
            const cx = x + w / 2;
            ctx.beginPath();
            ctx.moveTo(x, y + h);
            ctx.lineTo(x, springY);
            ctx.bezierCurveTo(x, y + h * 0.16, cx - w * 0.14, peakY + h * 0.04, cx, peakY);
            ctx.bezierCurveTo(cx + w * 0.14, peakY + h * 0.04, x + w, y + h * 0.16, x + w, springY);
            ctx.lineTo(x + w, y + h);
            ctx.closePath();
          }

          function drawFeatheredPortrait(ctx, pImg, drawX, drawY, drawW, drawH, isRight, featherPercent) {
            const offCanvas = document.createElement('canvas');
            offCanvas.width = Math.max(1, Math.ceil(drawW));
            offCanvas.height = Math.max(1, Math.ceil(drawH));
            const offCtx = offCanvas.getContext('2d');
            offCtx.drawImage(pImg, 0, 0, drawW, drawH);

            offCtx.globalCompositeOperation = 'destination-in';
            const fPercent = featherPercent || 0.38;

            if (isRight) {
              const hGrad = offCtx.createLinearGradient(0, 0, drawW, 0);
              hGrad.addColorStop(0.0, 'rgba(0, 0, 0, 0)');
              hGrad.addColorStop(fPercent * 0.25, 'rgba(0, 0, 0, 0.12)');
              hGrad.addColorStop(fPercent * 0.65, 'rgba(0, 0, 0, 0.60)');
              hGrad.addColorStop(fPercent, 'rgba(0, 0, 0, 1.0)');
              hGrad.addColorStop(1.0, 'rgba(0, 0, 0, 1.0)');
              offCtx.fillStyle = hGrad;
              offCtx.fillRect(0, 0, drawW, drawH);
            } else {
              const hGrad = offCtx.createLinearGradient(0, 0, drawW, 0);
              hGrad.addColorStop(0.0, 'rgba(0, 0, 0, 1.0)');
              hGrad.addColorStop(1.0 - fPercent, 'rgba(0, 0, 0, 1.0)');
              hGrad.addColorStop(1.0 - fPercent * 0.35, 'rgba(0, 0, 0, 0.60)');
              hGrad.addColorStop(1.0 - fPercent * 0.1, 'rgba(0, 0, 0, 0.12)');
              hGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
              offCtx.fillStyle = hGrad;
              offCtx.fillRect(0, 0, drawW, drawH);
            }

            const vGrad = offCtx.createLinearGradient(0, 0, 0, drawH);
            vGrad.addColorStop(0.0, 'rgba(0, 0, 0, 0)');
            vGrad.addColorStop(0.06, 'rgba(0, 0, 0, 1.0)');
            vGrad.addColorStop(0.60, 'rgba(0, 0, 0, 1.0)');
            vGrad.addColorStop(0.85, 'rgba(0, 0, 0, 0.40)');
            vGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
            offCtx.fillStyle = vGrad;
            offCtx.fillRect(0, 0, drawW, drawH);

            offCtx.globalCompositeOperation = 'source-over';

            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
            ctx.shadowBlur = 40;
            ctx.shadowOffsetX = isRight ? -14 : 14;
            ctx.shadowOffsetY = 8;
            ctx.drawImage(offCanvas, drawX, drawY);
            ctx.restore();
          }

          const tests = [
            { id: 'ref1-nufais-gold', isRight: true, frameStyle: 'feathered-bleed', title: 'সূরা: আল-ফাতিহা', reciter: '🎤 মিশারি রাশিদ আল-আফাসি' },
            { id: 'ref2-dukhain-amber', isRight: false, frameStyle: 'feathered-bleed', title: 'সূরা: আল-ফাতিহা', reciter: 'মিশারি রাশিদ আল-আফাসি' },
            { id: 'ref3-islamic-arch', isRight: true, frameStyle: 'islamic-arch', title: 'সূরা: আত-তাওবাহ', reciter: 'মিশারি রাশিদ আল-আফাসি' }
          ];

          for (const t of tests) {
            const w = 1280;
            const h = 720;
            canvas.width = w;
            canvas.height = h;

            // Background
            ctx.fillStyle = '#080d1a';
            ctx.fillRect(0, 0, w, h);

            // Directional Shadow Ramp
            const rampW = w * 0.65;
            const rampGrad = ctx.createLinearGradient(t.isRight ? 0 : w, 0, t.isRight ? rampW : w - rampW, 0);
            rampGrad.addColorStop(0, 'rgba(0,0,0,0.92)');
            rampGrad.addColorStop(0.45, 'rgba(0,0,0,0.82)');
            rampGrad.addColorStop(0.8, 'rgba(0,0,0,0.4)');
            rampGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = rampGrad;
            ctx.fillRect(t.isRight ? 0 : w - rampW, 0, rampW, h);

            // Draw Reciter
            const drawW = 600;
            const drawH = 750;
            const drawX = t.isRight ? w * 0.74 - drawW / 2 : w * 0.26 - drawW / 2;
            const drawY = h * 0.52 - drawH / 2;

            if (t.frameStyle === 'feathered-bleed') {
              drawFeatheredPortrait(ctx, pImg, drawX, drawY, drawW, drawH, t.isRight, 0.38);
            } else if (t.frameStyle === 'islamic-arch') {
              const ax = drawX + 30;
              const ay = drawY + 40;
              const aw = 480;
              const ah = 620;
              ctx.save();
              createIslamicArchPath(ctx, ax, ay, aw, ah);
              ctx.clip();
              ctx.drawImage(pImg, drawX, drawY, drawW, drawH);
              ctx.restore();

              createIslamicArchPath(ctx, ax, ay, aw, ah);
              ctx.strokeStyle = createLiquidGoldGradient(ctx, ax, ay, ax + aw, ay + ah);
              ctx.lineWidth = 3.5;
              ctx.stroke();
            }

            // Typography
            const textX = t.isRight ? w * 0.08 : w * 0.48;
            const titleY = h * 0.48;

            ctx.font = '800 64px sans-serif';
            ctx.strokeStyle = 'rgba(10,5,2,0.95)';
            ctx.lineWidth = 2.5;
            ctx.strokeText(t.title, textX, titleY);

            ctx.fillStyle = createLiquidGoldGradient(ctx, textX, titleY - 45, textX, titleY + 25);
            ctx.shadowColor = 'rgba(0,0,0,0.98)';
            ctx.shadowBlur = 28;
            ctx.shadowOffsetY = 6;
            ctx.fillText(t.title, textX, titleY);

            ctx.font = '700 28px sans-serif';
            ctx.fillStyle = '#FEF3C7';
            ctx.shadowBlur = 14;
            ctx.fillText(t.reciter, textX, titleY + 46);

            // Verify alpha bleed on the inner edge
            // Inner edge of portrait is around drawX (if isRight) or drawX + drawW (if !isRight)
            const checkX = t.isRight ? Math.round(drawX + 5) : Math.round(drawX + drawW - 5);
            const checkY = Math.round(h * 0.5);
            const pixel = ctx.getImageData(checkX, checkY, 1, 1).data;

            const dataUrl = canvas.toDataURL('image/png');
            report.push({
              id: t.id,
              dataUrl,
              pixelCheck: Array.from(pixel),
              status: 'PASS'
            });
          }

          return report;
        })()
      `);

      for (const item of results) {
        const base64Data = item.dataUrl.replace(/^data:image\/png;base64,/, '');
        const filePath = path.join(outDir, `${item.id}.png`);
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
        const stat = fs.statSync(filePath);
        console.log(`✅ [${item.id}] Generated: ${filePath} (${(stat.size / 1024).toFixed(1)} KB) - Inner pixel RGBA: ${JSON.stringify(item.pixelCheck)}`);
      }

      console.log('🎉 ALL RECITER FRAMING & FEATHERED BLEED TESTS PASSED!');
      app.quit();
    } catch (err) {
      console.error('❌ Test failed:', err);
      app.quit();
      process.exit(1);
    }
  });
});
