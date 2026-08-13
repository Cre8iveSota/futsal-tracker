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

// value(整数、またはfloorで整数バケットに丸めた値)の配列から
// 0..max の出現回数配列を作る。
function histogramCounts(values, max, continuous) {
  const counts = new Array(max + 1).fill(0);
  values.forEach((v) => {
    const bucket = continuous ? Math.floor(v) : v;
    if (bucket >= 0 && bucket <= max) counts[bucket] += 1;
  });
  return counts;
}

function mean(values) {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function stdDev(values) {
  if (values.length === 0) return 0;
  const m = mean(values);
  const variance = values.reduce((a, b) => a + (b - m) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

// 変動係数(CV) = 標準偏差 / 平均。単位の異なる指標同士でも「バラつきの大きさ」を比較できる。
export function coefficientOfVariation(values) {
  const m = mean(values);
  if (m === 0) return 0;
  return stdDev(values) / m;
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

export function buildDistributionChart({ id, title, unitLabel, sValues, rValues, sColor, rColor, continuous = false, axisCaption }) {
  const maxBucket = continuous
    ? Math.max(0, ...sValues.map(Math.floor), ...rValues.map(Math.floor))
    : Math.max(0, ...sValues, ...rValues);
  const sCounts = histogramCounts(sValues, maxBucket, continuous);
  const rCounts = histogramCounts(rValues, maxBucket, continuous);
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
    const bucketLabel = continuous ? `${k}-${k + 1}` : `${k}`;
    bars.push(`
      <rect class="hist-bar" data-bucket="${escapeAttr(bucketLabel)}" data-series="S" data-count="${sCounts[k]}" data-unit="${escapeAttr(unitLabel)}"
        x="${groupLeft}" y="${baseline - sH}" width="${barW}" height="${Math.max(sH, sH > 0 ? 2 : 0)}"
        rx="4" fill="${sColor}" />
      <rect class="hist-bar" data-bucket="${escapeAttr(bucketLabel)}" data-series="R" data-count="${rCounts[k]}" data-unit="${escapeAttr(unitLabel)}"
        x="${groupLeft + barW + BAR_GAP}" y="${baseline - rH}" width="${barW}" height="${Math.max(rH, rH > 0 ? 2 : 0)}"
        rx="4" fill="${rColor}" />
      <text x="${xCenter(k)}" y="${baseline + 16}" class="axis-label" text-anchor="middle">${k}${continuous ? '+' : ''}</text>
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
      <p class="chart-caption">${axisCaption || `横軸: 1日あたりの${unitLabel}数`} / 縦軸: 試合数(点線 = 平均 = 次戦の期待値)</p>
    </div>
  `;
}

// シーズンをまたいだ推移(折れ線)を描画する。例: シーズンごとの安定性(CV)の推移。
export function buildTrendLineChart({ id, title, categories, sValues, rValues, sColor, rColor, unitLabel, valueFormat }) {
  const format = valueFormat || ((v) => v.toFixed(2));
  const maxY = Math.max(0.01, ...sValues, ...rValues);

  const innerW = SVG_W - PAD_LEFT - PAD_RIGHT;
  const innerH = SVG_H - PAD_TOP - PAD_BOTTOM;
  const colW = innerW / categories.length;
  const baseline = PAD_TOP + innerH;

  const yScale = (v) => (v / maxY) * innerH;
  const xCenter = (i) => PAD_LEFT + (i + 0.5) * colW;

  const step = niceStep(maxY);
  const gridLines = [];
  for (let g = 0; g <= maxY; g += step) {
    const y = baseline - yScale(g);
    gridLines.push(`<line x1="${PAD_LEFT}" y1="${y}" x2="${SVG_W - PAD_RIGHT}" y2="${y}" class="grid-line" />`);
    gridLines.push(`<text x="${PAD_LEFT - 6}" y="${y + 3}" class="axis-label" text-anchor="end">${format(g)}</text>`);
  }

  const linePath = (values) =>
    values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xCenter(i).toFixed(1)} ${(baseline - yScale(v)).toFixed(1)}`).join(' ');

  const dots = (values, color, series) =>
    values
      .map(
        (v, i) => `
      <circle cx="${xCenter(i)}" cy="${baseline - yScale(v)}" r="4" fill="${color}" stroke="var(--panel)" stroke-width="2" />
    `,
      )
      .join('');

  const xLabels = categories
    .map((c, i) => `<text x="${xCenter(i)}" y="${baseline + 16}" class="axis-label" text-anchor="middle">${c}</text>`)
    .join('');

  const hitAreas = categories
    .map(
      (c, i) => `
      <rect class="trend-hit" data-label="${escapeAttr(c)}" data-s="${format(sValues[i])}" data-r="${format(rValues[i])}"
        data-unit="${escapeAttr(unitLabel)}" x="${PAD_LEFT + i * colW}" y="${PAD_TOP}" width="${colW}" height="${innerH}"
        fill="transparent" />
    `,
    )
    .join('');

  return `
    <div class="chart-card" id="${id}">
      <h4>${title}</h4>
      <svg viewBox="0 0 ${SVG_W} ${SVG_H}" class="dist-svg" role="img" aria-label="${escapeAttr(title)}">
        ${gridLines.join('')}
        <line x1="${PAD_LEFT}" y1="${baseline}" x2="${SVG_W - PAD_RIGHT}" y2="${baseline}" class="axis-baseline" />
        <path d="${linePath(sValues)}" class="trend-line" stroke="${sColor}" fill="none" />
        <path d="${linePath(rValues)}" class="trend-line" stroke="${rColor}" fill="none" />
        ${dots(sValues, sColor, 'S')}
        ${dots(rValues, rColor, 'R')}
        ${xLabels}
        ${hitAreas}
      </svg>
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

  // 折れ線チャート: 1本のホバー領域でS/R両方の値を一度に表示する。
  const hitAreas = root.querySelectorAll('.trend-hit');
  hitAreas.forEach((area) => {
    const show = (evt) => {
      const label = area.dataset.label;
      const unit = area.dataset.unit;
      tooltip.textContent = `${label}: 樋口(S) ${area.dataset.s}${unit} / 本郷(R) ${area.dataset.r}${unit}`;
      tooltip.hidden = false;
      const x = (evt.touches ? evt.touches[0].clientX : evt.clientX) + 12;
      const y = (evt.touches ? evt.touches[0].clientY : evt.clientY) + 12;
      tooltip.style.left = `${x}px`;
      tooltip.style.top = `${y}px`;
    };
    const hide = () => {
      tooltip.hidden = true;
    };
    area.addEventListener('pointerenter', show);
    area.addEventListener('pointermove', show);
    area.addEventListener('pointerleave', hide);
  });
}
