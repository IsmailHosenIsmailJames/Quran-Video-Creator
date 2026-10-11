const { bundle } = require('@remotion/bundler');
const path = require('path');
const fs = require('fs');

async function buildRemotionBundle() {
  const entryPoint = path.resolve(__dirname, '../src/remotion/index.ts');
  const outDir = path.resolve(__dirname, '../dist/remotion-bundle');
  const publicDir = path.resolve(__dirname, '../public');

  console.log('📦 Pre-bundling Remotion composition for production...');
  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
  const location = await bundle({
    entryPoint,
    outDir,
    publicDir,
  });
  console.log('✅ Remotion composition pre-bundled to:', location);

  console.log('🌐 Ensuring Remotion headless browser is available for packaging...');
  const remotionDir = path.resolve(__dirname, '../node_modules/.remotion');
  if (!fs.existsSync(remotionDir)) {
    fs.mkdirSync(remotionDir, { recursive: true });
  }
  try {
    const { ensureBrowser } = require('@remotion/renderer');
    const browserInfo = await ensureBrowser();
    console.log('✅ Remotion headless browser ready at:', browserInfo?.path);
  } catch (browserErr) {
    console.warn('⚠️ Notice: Could not pre-download browser during bundling:', browserErr.message);
  }
}

buildRemotionBundle().catch((err) => {
  console.error('❌ Failed to pre-bundle Remotion:', err);
  process.exit(1);
});
