// 得点・アシストの分布(ヒストグラム)を描画する。
// 依存ライブラリなし、インラインSVGのみ。

const SVG_W = 640;
const SVG_H = 220;
const PAD_LEFT = 28;
const PAD_RIGHT = 10;
const PAD_TOP = 28; // 期待値ラベル用の余白
const PAD_BOTTOM = 26;
const BAR_MAX_WIDTH = 24;
const BAR_GAP = 2; // S/Rの2本の間
const GROUP_GAP = 8; // バケット(得点数)同士の間

// value(整数)の配列から 0..max の出現回数配列を作る。
function histogramCounts(values, max) {
  const counts = new Array(max + 1).fill(0);
  values.forEach((v) => {
    if (v >= 0 && v <= max) counts[v] += 1;
  });
  return counts;
}

function mean(values) {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// 見やすい目盛り間隔(1, 2, 5, 10, ...)を選ぶ。
function niceStep(maxValue) {
  if (maxValue <= 5) return 1;
  const rough = maxValue / 5;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / pow;
  let step;
  if (norm <= 1) step = 1;
  else if (norm <= 2) step = 2;
  else if (norm <= 5) step = 5;
  else step = 10;
  return step * pow;
}

function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;');
}

export function buildDistributionChart({ id, title, unitLabel, sValues, rValues, sColor, rColor }) {
  const maxBucket = Math.max(0, ...sValues, ...rValues);
  const sCounts = histogramCounts(sValues, maxBucket);
  const rCounts = histogramCounts(rValues, maxBucket);
  const maxCount = Math.max(1, ...sCounts, ...rCounts);
  const sMean = mean(sValues);
  const rMean = mean(rValues);

  const innerW = SVG_W - PAD_LEFT - PAD_RIGHT;
  const innerH = SVG_H - PAD_TOP - PAD_BOTTOM;
  const bucketCount = maxBucket + 1;
  const bucketW = innerW / bucketCount;
  const barW = Math.min(BAR_MAX_WIDTH, (bucketW - GROUP_GAP - BAR_GAP) / 2);

  const yScale = (count) => (count / maxCount) * innerH;
  // バケットk(値=k)の中心のx座標。平均値のような小数もそのまま渡せば補間される。
  const xCenter = (k) => PAD_LEFT + (k + 0.5) * bucketW;

  const step = niceStep(maxCount);
  const gridLines = [];
  for (let g = 0; g <= maxCount; g += step) {
    const y = PAD_TOP + innerH - yScale(g);
    gridLines.push(`<line x1="${PAD_LEFT}" y1="${y}" x2="${SVG_W - PAD_RIGHT}" y2="${y}" class="grid-line" />`);
    gridLines.push(`<text x="${PAD_LEFT - 6}" y="${y + 3}" class="axis-label" text-anchor="end">${g}</text>`);
  }

  const bars = [];
  for (let k = 0; k <= maxBucket; k++) {
    const groupLeft = PAD_LEFT + k * bucketW + (bucketW - (barW * 2 + BAR_GAP)) / 2;
    const sH = yScale(sCounts[k]);
    const rH = yScale(rCounts[k]);
    const baseline = PAD_TOP + innerH;
    bars.push(`
      <rect class="hist-bar" data-bucket="${k}" data-series="S" data-count="${sCounts[k]}" data-unit="${escapeAttr(unitLabel)}"
        x="${groupLeft}" y="${baseline - sH}" width="${barW}" height="${Math.max(sH, sH > 0 ? 2 : 0)}"
        rx="4" fill="${sColor}" />
      <rect class="hist-bar" data-bucket="${k}" data-series="R" data-count="${rCounts[k]}" data-unit="${escapeAttr(unitLabel)}"
        x="${groupLeft + barW + BAR_GAP}" y="${baseline - rH}" width="${barW}" height="${Math.max(rH, rH > 0 ? 2 : 0)}"
        rx="4" fill="${rColor}" />
      <text x="${xCenter(k)}" y="${baseline + 16}" class="axis-label" text-anchor="middle">${k}</text>
    `);
  }

  // 期待値(平均)の破線。ラベルが重なる場合は上下に分けて逃がす。
  const sMeanX = xCenter(sMean);
  const rMeanX = xCenter(rMean);
  const labelsCollide = Math.abs(sMeanX - rMeanX) < 46;
  const meanLines = `
    <g class="mean-marker">
      <line x1="${sMeanX}" y1="${PAD_TOP - 4}" x2="${sMeanX}" y2="${PAD_TOP + innerH}" class="mean-line" stroke="${sColor}" />
      <text x="${sMeanX}" y="${labelsCollide ? PAD_TOP - 14 : PAD_TOP - 6}" class="mean-label" text-anchor="middle">S ${sMean.toFixed(2)}</text>
    </g>
    <g class="mean-marker">
      <line x1="${rMeanX}" y1="${PAD_TOP - 4}" x2="${rMeanX}" y2="${PAD_TOP + innerH}" class="mean-line" stroke="${rColor}" />
      <text x="${rMeanX}" y="${labelsCollide ? PAD_TOP - 2 : PAD_TOP - 6}" class="mean-label" text-anchor="middle">R ${rMean.toFixed(2)}</text>
    </g>
  `;

  return `
    <div class="chart-card" id="${id}">
      <h4>${title}</h4>
      <svg viewBox="0 0 ${SVG_W} ${SVG_H}" class="dist-svg" role="img" aria-label="${escapeAttr(title)}の分布">
        ${gridLines.join('')}
        <line x1="${PAD_LEFT}" y1="${PAD_TOP + innerH}" x2="${SVG_W - PAD_RIGHT}" y2="${PAD_TOP + innerH}" class="axis-baseline" />
        ${bars.join('')}
        ${meanLines}
      </svg>
      <p class="chart-caption">横軸: 1日あたりの${unitLabel}数 / 縦軸: 試合数(点線 = 平均 = 次戦の期待値)</p>
    </div>
  `;
}

// 共有ツールチップをチャート内の棒にひもづける。root配下の .hist-bar を全部拾う。
export function attachChartTooltips(root) {
  let tooltip = document.getElementById('chartTooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'chartTooltip';
    tooltip.className = 'chart-tooltip';
    tooltip.hidden = true;
    document.body.appendChild(tooltip);
  }

  const bars = root.querySelectorAll('.hist-bar');
  bars.forEach((bar) => {
    const show = (evt) => {
      const bucket = bar.dataset.bucket;
      const unit = bar.dataset.unit;
      const series = bar.dataset.series === 'S' ? '樋口(S)' : '本郷(R)';
      const count = bar.dataset.count;
      tooltip.textContent = `${unit}${bucket}: ${series} ${count}試合`;
      tooltip.hidden = false;
      const x = (evt.touches ? evt.touches[0].clientX : evt.clientX) + 12;
      const y = (evt.touches ? evt.touches[0].clientY : evt.clientY) + 12;
      tooltip.style.left = `${x}px`;
      tooltip.style.top = `${y}px`;
    };
    const hide = () => {
      tooltip.hidden = true;
    };
    bar.addEventListener('pointerenter', show);
    bar.addEventListener('pointermove', show);
    bar.addEventListener('pointerleave', hide);
  });
}
