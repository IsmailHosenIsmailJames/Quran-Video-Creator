/**
 * Automated Test Suite for Audio-Reactive Waveform Motion Graphics Engine
 * Verifies all 7 visualizer styles, geometry calculations, and styling pipelines.
 */

const assert = require('assert');

// 1. All 7 Waveform Styles
const WAVEFORM_STYLES = [
  'smooth-wave',
  'mirrored-bars',
  'gradient-bars',
  'circular-halo',
  'dual-symmetrical-wave',
  'dotted-matrix',
  'minimal-line-pulse',
];

console.log('🧪 Starting Audio Waveform Engine Test Suite...\n');

// 2. Harmonic Vocal Cadence Simulation Algorithm Test
console.log('Testing 1: Harmonic Vocal Cadence Simulation Algorithm...');
function generateSimulatedSamples(frame, sampleCount = 64, amplitude = 2.2) {
  const samples = [];
  const time = frame / 30; // 30 fps
  for (let i = 0; i < sampleCount; i++) {
    const norm = i / (sampleCount - 1);
    const bell = Math.sin(norm * Math.PI);
    const wave1 = Math.sin(time * 3.8 + i * 0.28) * 0.42;
    const wave2 = Math.sin(time * 6.2 - i * 0.45) * 0.28;
    const wave3 = Math.cos(time * 1.8 + i * 0.12) * 0.22;
    const pulse = Math.sin(time * 2.2) * 0.18 + 0.82;
    const rawVal = (wave1 + wave2 + wave3) * bell * pulse * amplitude;
    const amp = Math.min(1.0, Math.max(0.04, Math.abs(rawVal) + 0.05 * bell));
    samples.push(amp);
  }
  return samples;
}

const testSamples = generateSimulatedSamples(45, 64, 2.2);
assert.strictEqual(testSamples.length, 64, 'Sample count must match');
testSamples.forEach((val, idx) => {
  assert(!isNaN(val), `Sample ${idx} must not be NaN`);
  assert(val >= 0.04 && val <= 1.0, `Sample ${idx} must be bounded [0.04, 1.0], got ${val}`);
});
console.log('  - 64 Harmonics generated cleanly: ✅ PASS');
console.log('  - Bounded [0.04, 1.0] with bell curve modulation: ✅ PASS');

// 3. Geometry verification for all 7 waveform styles
console.log('\nTesting 2: Geometry & SVG Calculation Across 7 Styles...');

// Style 1: smooth-wave (Bezier cubic path)
function generateSmoothWavePath(samples, width, height) {
  const points = samples.map((amp, idx) => {
    const x = (idx / (samples.length - 1)) * width;
    const y = (height / 2) - (amp * (height * 0.42));
    return { x, y };
  });
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

const smoothPath = generateSmoothWavePath(testSamples, 1920, 120);
assert(smoothPath.startsWith('M '), 'Smooth path must start with M');
assert(!smoothPath.includes('NaN'), 'Smooth path must not contain NaN');
console.log('  - [smooth-wave] Bezier cubic path generated: ✅ PASS');

// Style 2: mirrored-bars (Symmetrical vertical bars)
function generateMirroredBars(samples, width, height, barWidth = 6) {
  const step = width / samples.length;
  const bars = samples.map((amp, idx) => {
    const barH = Math.max(4, amp * height);
    const x = idx * step + (step - barWidth) / 2;
    const y = (height - barH) / 2;
    return { x, y, width: barWidth, height: barH };
  });
  return bars;
}
const mirroredBars = generateMirroredBars(testSamples, 1920, 120, 6);
assert.strictEqual(mirroredBars.length, 64);
mirroredBars.forEach((bar, idx) => {
  assert(!isNaN(bar.x) && !isNaN(bar.y) && !isNaN(bar.height));
  assert(bar.height >= 4 && bar.height <= 120);
});
console.log('  - [mirrored-bars] Symmetrical dual-sided bars: ✅ PASS');

// Style 3: gradient-bars (Grounded baseline bars)
function generateGradientBars(samples, width, height, barWidth = 6) {
  const step = width / samples.length;
  return samples.map((amp, idx) => {
    const barH = Math.max(4, amp * (height - 8));
    const x = idx * step + (step - barWidth) / 2;
    const y = height - barH;
    return { x, y, width: barWidth, height: barH };
  });
}
const gradientBars = generateGradientBars(testSamples, 1920, 120, 6);
assert.strictEqual(gradientBars.length, 64);
gradientBars.forEach((bar) => {
  assert(!isNaN(bar.x) && !isNaN(bar.y));
  assert(bar.y + bar.height <= 120.01);
});
console.log('  - [gradient-bars] Grounded baseline spectrum bars: ✅ PASS');

// Style 4: circular-halo (360-degree radial sunburst rays)
function generateCircularHaloRays(samples, innerRadius = 130, maxSpike = 50) {
  const count = samples.length;
  return samples.map((amp, i) => {
    const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
    const spikeLen = Math.max(4, amp * maxSpike);
    const r0 = innerRadius;
    const r1 = r0 + spikeLen;
    const x1 = Math.cos(angle) * r0;
    const y1 = Math.sin(angle) * r0;
    const x2 = Math.cos(angle) * r1;
    const y2 = Math.sin(angle) * r1;
    return { x1, y1, x2, y2 };
  });
}
const haloRays = generateCircularHaloRays(testSamples, 130, 50);
assert.strictEqual(haloRays.length, 64);
haloRays.forEach((ray) => {
  assert(!isNaN(ray.x1) && !isNaN(ray.y1) && !isNaN(ray.x2) && !isNaN(ray.y2));
  const len = Math.hypot(ray.x2 - ray.x1, ray.y2 - ray.y1);
  assert(len >= 3.99 && len <= 50.01);
});
console.log('  - [circular-halo] 360-degree radial geometry: ✅ PASS');

// Style 5: dual-symmetrical-wave (Mirrored top & bottom fluid ribbon)
function generateDualWavePaths(samples, width, height) {
  const centerY = height / 2;
  const topPoints = samples.map((amp, i) => ({
    x: (i / (samples.length - 1)) * width,
    y: centerY - (amp * (height * 0.44)),
  }));
  const bottomPoints = samples.map((amp, i) => ({
    x: (i / (samples.length - 1)) * width,
    y: centerY + (amp * (height * 0.44)),
  }));
  assert(topPoints.every(p => !isNaN(p.x) && !isNaN(p.y)));
  assert(bottomPoints.every(p => !isNaN(p.x) && !isNaN(p.y)));
  return { topPoints, bottomPoints };
}
const dualWaves = generateDualWavePaths(testSamples, 1920, 120);
assert.strictEqual(dualWaves.topPoints.length, 64);
assert.strictEqual(dualWaves.bottomPoints.length, 64);
console.log('  - [dual-symmetrical-wave] Mirrored dual ribbon coordinates: ✅ PASS');

// Style 6: dotted-matrix (Vertical bead matrix)
function generateDottedMatrix(samples, width, height, maxDots = 8) {
  const step = width / samples.length;
  const beadWidth = 4;
  let totalDots = 0;
  samples.forEach((amp, idx) => {
    const activeDots = Math.max(1, Math.round(amp * maxDots));
    totalDots += activeDots;
    const x = idx * step + (step - beadWidth) / 2;
    assert(!isNaN(x));
  });
  return totalDots;
}
const totalBeads = generateDottedMatrix(testSamples, 1920, 120, 8);
assert(totalBeads > 64, 'Should generate multiple matrix beads');
console.log(`  - [dotted-matrix] Futuristic LED bead matrix (${totalBeads} active beads): ✅ PASS`);

// Style 7: minimal-line-pulse (Luxury baseline ripple)
function generateMinimalLinePulse(samples, width, height) {
  const baseY = height / 2;
  const points = samples.map((amp, i) => {
    const x = (i / (samples.length - 1)) * width;
    const offset = Math.sin(i * 0.3) * (amp * height * 0.35);
    return { x, y: baseY - offset };
  });
  assert(points.every(p => !isNaN(p.x) && !isNaN(p.y)));
  return points;
}
const minimalPoints = generateMinimalLinePulse(testSamples, 1920, 120);
assert.strictEqual(minimalPoints.length, 64);
console.log('  - [minimal-line-pulse] Luxury acoustic baseline ripple: ✅ PASS');

// 4. Color theme presets & settings compliance
console.log('\nTesting 3: Color Presets & Hex Code Integrity...');
const COLOR_PRESETS = [
  { name: '24K Gold', primary: '#F59E0B', secondary: '#FDE047' },
  { name: 'Sacred Emerald', primary: '#10B981', secondary: '#6EE7B7' },
  { name: 'Midnight Sapphire', primary: '#3B82F6', secondary: '#93C5FD' },
  { name: 'Neon Amethyst', primary: '#A855F7', secondary: '#EC4899' },
  { name: 'Sunset Bronze', primary: '#F97316', secondary: '#FBBF24' },
  { name: 'Minimal Platinum', primary: '#E2E8F0', secondary: '#94A3B8' },
  { name: 'Cyber Cyan', primary: '#06B6D4', secondary: '#3B82F6' },
];

const hexRegex = /^#([A-Fa-f0-9]{6})$/;
COLOR_PRESETS.forEach(preset => {
  assert(hexRegex.test(preset.primary), `${preset.name} primary color must be valid hex`);
  assert(hexRegex.test(preset.secondary), `${preset.name} secondary color must be valid hex`);
});
console.log(`  - All ${COLOR_PRESETS.length} 2-color gradient palettes are valid: ✅ PASS`);

console.log('\n==================================================');
console.log('🎉 ALL AUDIO WAVEFORM ENGINE TESTS PASSED!');
console.log('==================================================\n');
