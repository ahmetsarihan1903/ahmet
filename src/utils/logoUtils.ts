/**
 * Generates an ultra high-definition PNG Data URL of the official Beta Asansör logo
 * using exact SVG vector paths for seamless integration into jsPDF and reports.
 */
export function getBetaLogoDataUrl(): string {
  try {
    if (typeof document === 'undefined') return '';
    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // 1. Top Blue Box (#0088CE)
    ctx.fillStyle = '#0088CE';
    ctx.fillRect(0, 0, 500, 495);

    // 2. Registered Trademark Circle & R
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.arc(442, 62, 23, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    const pathR = new Path2D(
      'M434 50 h8.5 c4.5 0 7.5 2 7.5 5.5 c0 2.8 -2 4.8 -5 5.2 l5.5 7.3 h-4.2 l-5 -6.8 h-3.2 v6.8 h-3.6 V50 z M437.6 53.6 v4.6 h4.5 c2.2 0 3.8 -0.8 3.8 -2.3 c0 -1.5 -1.5 -2.3 -3.8 -2.3 h-4.5 z'
    );
    ctx.fill(pathR);

    // 3. Exact "beta" Vector Paths
    const pathB = new Path2D(
      'M48 142 h28 v82 c9.5 -9.5 22.5 -15 38 -15 c34 0 56 26 56 70 c0 45 -22 71 -56 71 c-15.5 0 -28.5 -5.5 -38 -15 v13 H48 V142 z M76 279 c0 27 12 43 32 43 c20 0 32 -16 32 -43 c0 -27 -12 -43 -32 -43 c-20 0 -32 16 -32 43 z'
    );
    const pathE = new Path2D(
      'M182 279 c0 -43 23 -70 56 -70 c33 0 55 26 55 69 v16 h-83 c1.5 21 13.5 31 32 31 c13 0 23 -5.5 29 -15 l23 11 c-11 18 -29 28 -53 28 c-34 0 -59 -26 -59 -70 z M265 272 c-0.5 -18 -10.5 -29 -27 -29 c-17 0 -27 11 -28 29 h55 z'
    );
    const pathT = new Path2D(
      'M305 142 h28 v69 h27 v23 h-27 v76 c0 11 4 16 14 16 c5 0 9 -1 13 -3 l4 22 c-7 3 -15 4.5 -24 4.5 c-22 0 -35 -12 -35 -35 v-80.5 h-18 v-23 h18 V142 z'
    );
    const pathA = new Path2D(
      'M380 279 c0 -43 21 -70 52 -70 c14 0 26 5.5 34 15 v-13 h27 v137 c0 0 0 0 0 0 h-27 v-13 c-8 9.5 -20 15 -34 15 c-31 0 -52 -27 -52 -71 z M465 279 c0 -27 -11 -43 -29 -43 c-19 0 -30 16 -30 43 c0 27 11 43 30 43 c18 0 29 -16 29 -43 z'
    );

    ctx.fill(pathB);
    ctx.fill(pathE);
    ctx.fill(pathT);
    ctx.fill(pathA);

    // 4. Bottom White Box
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 495, 500, 105);

    // 5. Exact "ASANSÖR" Vector Paths
    ctx.fillStyle = '#1D1D1B';
    const pathAsansor = new Path2D(
      'M22 580 l28 -74 h15 l28 74 h-16 l-5.5 -16 h-27 l-5.5 16 H22 z M48.5 551 h19 l-9.5 -28.5 z ' +
      'M104 564 c4 4.5 9.5 7 16 7 c7 0 11.5 -3 11.5 -7.5 c0 -5 -4.5 -6.5 -13.5 -9 c-14 -3.5 -23.5 -8.5 -23.5 -20 c0 -12 10 -19.5 24.5 -19.5 c10.5 0 19 4 24 10.5 l-9.5 9.5 c-4 -4 -8.5 -6 -14.5 -6 c-6 0 -10 2.5 -10 6.5 c0 4 4.5 5.5 13 8 c15 4 24 9 24 21 c0 13 -10.5 20.5 -26 20.5 c-12 0 -22.5 -4.5 -28 -12 z ' +
      'M168 580 l28 -74 h15 l28 74 h-16 l-5.5 -16 h-27 l-5.5 16 H168 z M194.5 551 h19 l-9.5 -28.5 z ' +
      'M250 506 h15 l29 44 v-44 h14 v74 h-14 l-30 -45 v45 h-14 z ' +
      'M322 564 c4 4.5 9.5 7 16 7 c7 0 11.5 -3 11.5 -7.5 c0 -5 -4.5 -6.5 -13.5 -9 c-14 -3.5 -23.5 -8.5 -23.5 -20 c0 -12 10 -19.5 24.5 -19.5 c10.5 0 19 4 24 10.5 l-9.5 9.5 c-4 -4 -8.5 -6 -14.5 -6 c-6 0 -10 2.5 -10 6.5 c0 4 4.5 5.5 13 8 c15 4 24 9 24 21 c0 13 -10.5 20.5 -26 20.5 c-12 0 -22.5 -4.5 -28 -12 z ' +
      'M380 543 c0 -22 10 -38 27 -38 c17 0 27 16 27 38 c0 22 -10 38 -27 38 c-17 0 -27 -16 -27 -38 z M419 543 c0 -15 -5 -24 -12 -24 c-7 0 -12 9 -12 24 c0 15 5 24 12 24 c7 0 12 -9 12 -24 z ' +
      'M447 506 h26 c12 0 19 6 19 16 c0 8 -4.5 13 -12 15 l13 23 h-17 l-11 -21 h-4 v21 h-14 z M461 520 v12 h11 c4.5 0 7 -2 7 -6 c0 -4 -2.5 -6 -7 -6 z'
    );
    ctx.fill(pathAsansor);

    // Umlaut dots for Ö
    ctx.beginPath();
    ctx.arc(394, 500, 3.5, 0, Math.PI * 2);
    ctx.arc(410, 500, 3.5, 0, Math.PI * 2);
    ctx.fill();

    return canvas.toDataURL('image/png');
  } catch (err) {
    console.error('Logo generation error:', err);
    return '';
  }
}
