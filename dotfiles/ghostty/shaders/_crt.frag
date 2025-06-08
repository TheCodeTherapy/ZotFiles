#define CURVE 13.0, 9.0
#define COLOR_FRINGING_SPREAD 1.11
#define GHOSTING_SPREAD 0.75
#define GHOSTING_STRENGTH 0.0
#define DARKEN_MIX 0.4
#define VIGNETTE_SPREAD 0.21
#define VIGNETTE_BRIGHTNESS 7.0
#define TINT 0.995, 1.0, 1.0
#define SCAN_LINES_STRENGTH 0.15
#define SCAN_LINES_VARIANCE 0.35
#define SCAN_LINES_PERIOD 4.0
#define APERTURE_GRILLE_STRENGTH 0.0125
#define APERTURE_GRILLE_PERIOD 2.0
#define FLICKER_STRENGTH 0.0
#define FLICKER_FREQUENCY 15.0
#define NOISE_CONTENT_STRENGTH 0.15
#define NOISE_UNIFORM_STRENGTH 0.03
#define BLOOM_STRENGTH 0.12
#define BLOOM_SPREAD 1.5
#define BRIGHTNESS 0.1
#define CONTRAST 1.25
#define SATURATION 2.1
#define FADE_FACTOR 0.21

#define WHITE_BORDER_PIXELS 2.0

#ifndef COLOR_FRINGING_SPREAD
#define COLOR_FRINGING_SPREAD 0.0
#endif

#if !defined(GHOSTING_SPREAD) || !defined(GHOSTING_STRENGTH)
#undef GHOSTING_SPREAD
#undef GHOSTING_STRENGTH
#define GHOSTING_SPREAD 0.0
#define GHOSTING_STRENGTH 0.0
#endif

#ifndef DARKEN_MIX
#define DARKEN_MIX 0.0
#endif

#if !defined(VIGNETTE_SPREAD) || !defined(VIGNETTE_BRIGHTNESS)
#undef VIGNETTE_SPREAD
#undef VIGNETTE_BRIGHTNESS
#define VIGNETTE_SPREAD 0.0
#define VIGNETTE_BRIGHTNESS 1.0
#endif

#ifndef TINT
#define TINT 1.00, 1.00, 1.00
#endif

#if !defined(SCAN_LINES_STRENGTH) || !defined(SCAN_LINES_VARIANCE) || !defined(SCAN_LINES_PERIOD)
#undef SCAN_LINES_STRENGTH
#undef SCAN_LINES_VARIANCE
#undef SCAN_LINES_PERIOD
#define SCAN_LINES_STRENGTH 0.0
#define SCAN_LINES_VARIANCE 1.0
#define SCAN_LINES_PERIOD 1.0
#endif

#if !defined(APERTURE_GRILLE_STRENGTH) || !defined(APERTURE_GRILLE_PERIOD)
#undef APERTURE_GRILLE_STRENGTH
#undef APERTURE_GRILLE_PERIOD
#define APERTURE_GRILLE_STRENGTH 0.0
#define APERTURE_GRILLE_PERIOD 1.0
#endif

#if !defined(FLICKER_STRENGTH) || !defined(FLICKER_FREQUENCY)
#undef FLICKER_STRENGTH
#undef FLICKER_FREQUENCY
#define FLICKER_STRENGTH 0.0
#define FLICKER_FREQUENCY 1.0
#endif

#if !defined(NOISE_CONTENT_STRENGTH) || !defined(NOISE_UNIFORM_STRENGTH)
#undef NOISE_CONTENT_STRENGTH
#undef NOISE_UNIFORM_STRENGTH
#define NOISE_CONTENT_STRENGTH 0.0
#define NOISE_UNIFORM_STRENGTH 0.0
#endif

#if !defined(BLOOM_SPREAD) || !defined(BLOOM_STRENGTH)
#undef BLOOM_SPREAD
#undef BLOOM_STRENGTH
#define BLOOM_SPREAD 0.0
#define BLOOM_STRENGTH 0.0
#endif

#ifndef FADE_FACTOR
#define FADE_FACTOR 1.00
#endif

const float PI = acos(-1.0);
const float TAU = PI * 2.0;
const float SQRTAU = sqrt(TAU);
const vec3 BG = vec3(18.0 / 255.0, 18.0 / 255.0, 23.0 / 255.0);
const float THIRD = 1.0 / 3.0;
const float TWOTHIRDS = 2.0 / 3.0;

// pre-computed
#ifdef BLOOM_SPREAD
const vec3[24] bloom_samples = {
        vec3(+0.16937617250386360, +0.98555147617358950, +1.00000000000000000),
        vec3(-1.33307083096294300, +0.47214633286277730, +0.70710678118654750),
        vec3(-0.84643949098064970, -1.51113870578065000, +0.57735026918962580),
        vec3(+1.55415568072846300, -1.25880900857097760, +0.50000000000000000),
        vec3(+1.68136437758946100, +1.47411459180526560, +0.44721359549995790),
        vec3(-1.27951576921998170, +2.08874110322878400, +0.40824829046386310),
        vec3(-2.45758475306311870, -0.97993733550247560, +0.37796447300922720),
        vec3(+0.58746414402008470, -2.76674644293450770, +0.35355339059327373),
        vec3(+2.99771570336972600, +0.11704939884745152, +0.33333333333333334),
        vec3(+0.41360842451688395, +3.13511213055748030, +0.31622776601683794),
        vec3(-3.16714993376924300, +0.98445990117702560, +0.30151134457776363),
        vec3(-1.57367138465215350, -3.08602630791232450, +0.28867513459481290),
        vec3(+2.88820264834042200, -2.15830615578962130, +0.27735009811261460),
        vec3(+2.71507789833003250, +2.57455860411057150, +0.26726124191242440),
        vec3(-2.15040699723774640, +3.22114106276501650, +0.25819888974716110),
        vec3(-3.65488587949074930, -1.62536433081913430, +0.25000000000000000),
        vec3(+1.01307759860526710, -3.99670786763358340, +0.24253562503633297),
        vec3(+4.22972367360725700, +0.33081361055181563, +0.23570226039551587),
        vec3(+0.40107790291173834, +4.34040741357259300, +0.22941573387056174),
        vec3(-4.31912457023602800, +1.15981159969343800, +0.22360679774997896),
        vec3(-1.92090448028273550, -4.16054395213290700, +0.21821789023599240),
        vec3(+3.86391222866357080, -2.65898143829251230, +0.21320071635561041),
        vec3(+3.34862284049462340, +3.43318002326090000, +0.20851441405707477),
        vec3(-2.87697336435743440, +3.96522688641871570, +0.20412414523193154)
    };
#endif

#define SPRITE_DEC(x, i) mod(floor(i / pow(4.0, mod(x, 8.0))), 4.0)
#define RGB(r, g, b) vec3(float(r) / 255.0, float(g) / 255.0, float(b) / 255.0)

void SpriteMario(inout vec3 color, float x, float y, float frame) {
  float idx = 0.0;
  if (frame == 0.0) {
    idx = y == 14.0 ? (x <= 7.0 ? 40960.0 : 42.0) : idx;
    idx = y == 13.0 ? (x <= 7.0 ? 43008.0 : 2730.0) : idx;
    idx = y == 12.0 ? (x <= 7.0 ? 21504.0 : 223.0) : idx;
    idx = y == 11.0 ? (x <= 7.0 ? 56576.0 : 4063.0) : idx;
    idx = y == 10.0 ? (x <= 7.0 ? 23808.0 : 16255.0) : idx;
    idx = y == 09.0 ? (x <= 7.0 ? 62720.0 : 1375.0) : idx;
    idx = y == 08.0 ? (x <= 7.0 ? 61440.0 : 1023.0) : idx;
    idx = y == 07.0 ? (x <= 7.0 ? 21504.0 : 793.0) : idx;
    idx = y == 06.0 ? (x <= 7.0 ? 22272.0 : 4053.0) : idx;
    idx = y == 05.0 ? (x <= 7.0 ? 23488.0 : 981.0) : idx;
    idx = y == 04.0 ? (x <= 7.0 ? 43328.0 : 170.0) : idx;
    idx = y == 03.0 ? (x <= 7.0 ? 43584.0 : 170.0) : idx;
    idx = y == 02.0 ? (x <= 7.0 ? 10832.0 : 42.0) : idx;
    idx = y == 01.0 ? (x <= 7.0 ? 16400.0 : 5.0) : idx;
    idx = y == 00.0 ? (x <= 7.0 ? 16384.0 : 21.0) : idx;
  } else if (frame == 1.0) {
    idx = y == 15.0 ? (x <= 7.0 ? 43008.0 : 10.0) : idx;
    idx = y == 14.0 ? (x <= 7.0 ? 43520.0 : 682.0) : idx;
    idx = y == 13.0 ? (x <= 7.0 ? 54528.0 : 55.0) : idx;
    idx = y == 12.0 ? (x <= 7.0 ? 63296.0 : 1015.0) : idx;
    idx = y == 11.0 ? (x <= 7.0 ? 55104.0 : 4063.0) : idx;
    idx = y == 10.0 ? (x <= 7.0 ? 64832.0 : 343.0) : idx;
    idx = y == 09.0 ? (x <= 7.0 ? 64512.0 : 255.0) : idx;
    idx = y == 08.0 ? (x <= 7.0 ? 25856.0 : 5.0) : idx;
    idx = y == 07.0 ? (x <= 7.0 ? 38208.0 : 22.0) : idx;
    idx = y == 06.0 ? (x <= 7.0 ? 42304.0 : 235.0) : idx;
    idx = y == 05.0 ? (x <= 7.0 ? 38208.0 : 170.0) : idx;
    idx = y == 04.0 ? (x <= 7.0 ? 62848.0 : 171.0) : idx;
    idx = y == 03.0 ? (x <= 7.0 ? 62976.0 : 42.0) : idx;
    idx = y == 02.0 ? (x <= 7.0 ? 43008.0 : 21.0) : idx;
    idx = y == 01.0 ? (x <= 7.0 ? 21504.0 : 85.0) : idx;
    idx = y == 00.0 ? (x <= 7.0 ? 21504.0 : 1.0) : idx;
  } else if (frame == 2.0) {
    idx = y == 15.0 ? (x <= 7.0 ? 43008.0 : 10.0) : idx;
    idx = y == 14.0 ? (x <= 7.0 ? 43520.0 : 682.0) : idx;
    idx = y == 13.0 ? (x <= 7.0 ? 54528.0 : 55.0) : idx;
    idx = y == 12.0 ? (x <= 7.0 ? 63296.0 : 1015.0) : idx;
    idx = y == 11.0 ? (x <= 7.0 ? 55104.0 : 4063.0) : idx;
    idx = y == 10.0 ? (x <= 7.0 ? 64832.0 : 343.0) : idx;
    idx = y == 09.0 ? (x <= 7.0 ? 64512.0 : 255.0) : idx;
    idx = y == 08.0 ? (x <= 7.0 ? 42320.0 : 5.0) : idx;
    idx = y == 07.0 ? (x <= 7.0 ? 42335.0 : 16214.0) : idx;
    idx = y == 06.0 ? (x <= 7.0 ? 58687.0 : 15722.0) : idx;
    idx = y == 05.0 ? (x <= 7.0 ? 43535.0 : 1066.0) : idx;
    idx = y == 04.0 ? (x <= 7.0 ? 43648.0 : 1450.0) : idx;
    idx = y == 03.0 ? (x <= 7.0 ? 43680.0 : 1450.0) : idx;
    idx = y == 02.0 ? (x <= 7.0 ? 2708.0 : 1448.0) : idx;
    idx = y == 01.0 ? (x <= 7.0 ? 84.0 : 0.0) : idx;
    idx = y == 00.0 ? (x <= 7.0 ? 336.0 : 0.0) : idx;
  } else if (frame == 3.0) {
    idx = y == 15.0 ? (x <= 7.0 ? 0.0 : 64512.0) : idx;
    idx = y == 14.0 ? (x <= 7.0 ? 40960.0 : 64554.0) : idx;
    idx = y == 13.0 ? (x <= 7.0 ? 43008.0 : 64170.0) : idx;
    idx = y == 12.0 ? (x <= 7.0 ? 21504.0 : 21727.0) : idx;
    idx = y == 11.0 ? (x <= 7.0 ? 56576.0 : 22495.0) : idx;
    idx = y == 10.0 ? (x <= 7.0 ? 23808.0 : 32639.0) : idx;
    idx = y == 09.0 ? (x <= 7.0 ? 62720.0 : 5471.0) : idx;
    idx = y == 08.0 ? (x <= 7.0 ? 61440.0 : 2047.0) : idx;
    idx = y == 07.0 ? (x <= 7.0 ? 38224.0 : 405.0) : idx;
    idx = y == 06.0 ? (x <= 7.0 ? 21844.0 : 16982.0) : idx;
    idx = y == 05.0 ? (x <= 7.0 ? 21855.0 : 17066.0) : idx;
    idx = y == 04.0 ? (x <= 7.0 ? 39487.0 : 23470.0) : idx;
    idx = y == 03.0 ? (x <= 7.0 ? 43596.0 : 23210.0) : idx;
    idx = y == 02.0 ? (x <= 7.0 ? 43344.0 : 23210.0) : idx;
    idx = y == 01.0 ? (x <= 7.0 ? 43604.0 : 42.0) : idx;
    idx = y == 00.0 ? (x <= 7.0 ? 43524.0 : 0.0) : idx;
  } else if (frame == 4.0) {
    idx = y == 29.0 ? (x <= 7.0 ? 32768.0 : 170.0) : idx;
    idx = y == 28.0 ? (x <= 7.0 ? 43008.0 : 234.0) : idx;
    idx = y == 27.0 ? (x <= 7.0 ? 43520.0 : 250.0) : idx;
    idx = y == 26.0 ? (x <= 7.0 ? 43520.0 : 10922.0) : idx;
    idx = y == 25.0 ? (x <= 7.0 ? 54528.0 : 1015.0) : idx;
    idx = y == 24.0 ? (x <= 7.0 ? 57152.0 : 16343.0) : idx;
    idx = y == 23.0 ? (x <= 7.0 ? 24384.0 : 65535.0) : idx;
    idx = y == 22.0 ? (x <= 7.0 ? 24400.0 : 65407.0) : idx;
    idx = y == 21.0 ? (x <= 7.0 ? 65360.0 : 5463.0) : idx;
    idx = y == 20.0 ? (x <= 7.0 ? 64832.0 : 5471.0) : idx;
    idx = y == 19.0 ? (x <= 7.0 ? 62464.0 : 4095.0) : idx;
    idx = y == 18.0 ? (x <= 7.0 ? 43264.0 : 63.0) : idx;
    idx = y == 17.0 ? (x <= 7.0 ? 22080.0 : 6.0) : idx;
    idx = y == 16.0 ? (x <= 7.0 ? 22080.0 : 25.0) : idx;
    idx = y == 15.0 ? (x <= 7.0 ? 22096.0 : 4005.0) : idx;
    idx = y == 14.0 ? (x <= 7.0 ? 22160.0 : 65365.0) : idx;
    idx = y == 13.0 ? (x <= 7.0 ? 23184.0 : 65365.0) : idx;
    idx = y == 12.0 ? (x <= 7.0 ? 23168.0 : 64853.0) : idx;
    idx = y == 11.0 ? (x <= 7.0 ? 27264.0 : 64853.0) : idx;
    idx = y == 10.0 ? (x <= 7.0 ? 43648.0 : 598.0) : idx;
    idx = y == 09.0 ? (x <= 7.0 ? 43648.0 : 682.0) : idx;
    idx = y == 08.0 ? (x <= 7.0 ? 43648.0 : 426.0) : idx;
    idx = y == 07.0 ? (x <= 7.0 ? 43605.0 : 2666.0) : idx;
    idx = y == 06.0 ? (x <= 7.0 ? 43605.0 : 2710.0) : idx;
    idx = y == 05.0 ? (x <= 7.0 ? 43605.0 : 681.0) : idx;
    idx = y == 04.0 ? (x <= 7.0 ? 10837.0 : 680.0) : idx;
    idx = y == 03.0 ? (x <= 7.0 ? 85.0 : 340.0) : idx;
    idx = y == 02.0 ? (x <= 7.0 ? 5.0 : 340.0) : idx;
    idx = y == 01.0 ? (x <= 7.0 ? 1.0 : 5460.0) : idx;
    idx = y == 00.0 ? (x <= 7.0 ? 0.0 : 5460.0) : idx;
  } else if (frame == 5.0) {
    idx = y == 30.0 ? (x <= 7.0 ? 40960.0 : 42.0) : idx;
    idx = y == 29.0 ? (x <= 7.0 ? 43520.0 : 58.0) : idx;
    idx = y == 28.0 ? (x <= 7.0 ? 43648.0 : 62.0) : idx;
    idx = y == 27.0 ? (x <= 7.0 ? 43648.0 : 2730.0) : idx;
    idx = y == 26.0 ? (x <= 7.0 ? 62784.0 : 253.0) : idx;
    idx = y == 25.0 ? (x <= 7.0 ? 63440.0 : 4085.0) : idx;
    idx = y == 24.0 ? (x <= 7.0 ? 55248.0 : 16383.0) : idx;
    idx = y == 23.0 ? (x <= 7.0 ? 55252.0 : 16351.0) : idx;
    idx = y == 22.0 ? (x <= 7.0 ? 65492.0 : 1365.0) : idx;
    idx = y == 21.0 ? (x <= 7.0 ? 65360.0 : 1367.0) : idx;
    idx = y == 20.0 ? (x <= 7.0 ? 64832.0 : 1023.0) : idx;
    idx = y == 19.0 ? (x <= 7.0 ? 43520.0 : 15.0) : idx;
    idx = y == 18.0 ? (x <= 7.0 ? 38464.0 : 22.0) : idx;
    idx = y == 17.0 ? (x <= 7.0 ? 21904.0 : 26.0) : idx;
    idx = y == 16.0 ? (x <= 7.0 ? 21904.0 : 90.0) : idx;
    idx = y == 15.0 ? (x <= 7.0 ? 21904.0 : 106.0) : idx;
    idx = y == 14.0 ? (x <= 7.0 ? 21904.0 : 125.0) : idx;
    idx = y == 13.0 ? (x <= 7.0 ? 21904.0 : 255.0) : idx;
    idx = y == 12.0 ? (x <= 7.0 ? 21920.0 : 767.0) : idx;
    idx = y == 11.0 ? (x <= 7.0 ? 22176.0 : 2815.0) : idx;
    idx = y == 10.0 ? (x <= 7.0 ? 23200.0 : 2751.0) : idx;
    idx = y == 09.0 ? (x <= 7.0 ? 43680.0 : 2725.0) : idx;
    idx = y == 08.0 ? (x <= 7.0 ? 43648.0 : 661.0) : idx;
    idx = y == 07.0 ? (x <= 7.0 ? 27136.0 : 341.0) : idx;
    idx = y == 06.0 ? (x <= 7.0 ? 23040.0 : 85.0) : idx;
    idx = y == 05.0 ? (x <= 7.0 ? 26624.0 : 21.0) : idx;
    idx = y == 04.0 ? (x <= 7.0 ? 41984.0 : 86.0) : idx;
    idx = y == 03.0 ? (x <= 7.0 ? 21504.0 : 81.0) : idx;
    idx = y == 02.0 ? (x <= 7.0 ? 21760.0 : 1.0) : idx;
    idx = y == 01.0 ? (x <= 7.0 ? 21760.0 : 21.0) : idx;
    idx = y == 00.0 ? (x <= 7.0 ? 20480.0 : 21.0) : idx;
  } else if (frame == 6.0) {
    idx = y == 31.0 ? (x <= 7.0 ? 40960.0 : 42.0) : idx;
    idx = y == 30.0 ? (x <= 7.0 ? 43520.0 : 58.0) : idx;
    idx = y == 29.0 ? (x <= 7.0 ? 43648.0 : 62.0) : idx;
    idx = y == 28.0 ? (x <= 7.0 ? 43648.0 : 2730.0) : idx;
    idx = y == 27.0 ? (x <= 7.0 ? 62784.0 : 253.0) : idx;
    idx = y == 26.0 ? (x <= 7.0 ? 63440.0 : 4085.0) : idx;
    idx = y == 25.0 ? (x <= 7.0 ? 55248.0 : 16383.0) : idx;
    idx = y == 24.0 ? (x <= 7.0 ? 55252.0 : 16351.0) : idx;
    idx = y == 23.0 ? (x <= 7.0 ? 65492.0 : 1365.0) : idx;
    idx = y == 22.0 ? (x <= 7.0 ? 65364.0 : 1367.0) : idx;
    idx = y == 21.0 ? (x <= 7.0 ? 64832.0 : 1023.0) : idx;
    idx = y == 20.0 ? (x <= 7.0 ? 21504.0 : 15.0) : idx;
    idx = y == 19.0 ? (x <= 7.0 ? 43520.0 : 12325.0) : idx;
    idx = y == 18.0 ? (x <= 7.0 ? 38208.0 : 64662.0) : idx;
    idx = y == 17.0 ? (x <= 7.0 ? 21840.0 : 64922.0) : idx;
    idx = y == 16.0 ? (x <= 7.0 ? 21844.0 : 65114.0) : idx;
    idx = y == 15.0 ? (x <= 7.0 ? 21844.0 : 30298.0) : idx;
    idx = y == 14.0 ? (x <= 7.0 ? 38228.0 : 5722.0) : idx;
    idx = y == 13.0 ? (x <= 7.0 ? 42325.0 : 1902.0) : idx;
    idx = y == 12.0 ? (x <= 7.0 ? 43605.0 : 682.0) : idx;
    idx = y == 11.0 ? (x <= 7.0 ? 44031.0 : 682.0) : idx;
    idx = y == 10.0 ? (x <= 7.0 ? 44031.0 : 17066.0) : idx;
    idx = y == 09.0 ? (x <= 7.0 ? 43775.0 : 21162.0) : idx;
    idx = y == 08.0 ? (x <= 7.0 ? 43772.0 : 21866.0) : idx;
    idx = y == 07.0 ? (x <= 7.0 ? 43392.0 : 21866.0) : idx;
    idx = y == 06.0 ? (x <= 7.0 ? 42640.0 : 21866.0) : idx;
    idx = y == 05.0 ? (x <= 7.0 ? 23189.0 : 21866.0) : idx;
    idx = y == 04.0 ? (x <= 7.0 ? 43605.0 : 21824.0) : idx;
    idx = y == 03.0 ? (x <= 7.0 ? 2389.0 : 0.0) : idx;
    idx = y == 02.0 ? (x <= 7.0 ? 84.0 : 0.0) : idx;
    idx = y == 01.0 ? (x <= 7.0 ? 84.0 : 0.0) : idx;
    idx = y == 00.0 ? (x <= 7.0 ? 336.0 : 0.0) : idx;
  } else {
    idx = y == 31.0 ? (x <= 7.0 ? 0.0 : 16128.0) : idx;
    idx = y == 30.0 ? (x <= 7.0 ? 0.0 : 63424.0) : idx;
    idx = y == 29.0 ? (x <= 7.0 ? 40960.0 : 55274.0) : idx;
    idx = y == 28.0 ? (x <= 7.0 ? 43520.0 : 65514.0) : idx;
    idx = y == 27.0 ? (x <= 7.0 ? 43648.0 : 21866.0) : idx;
    idx = y == 26.0 ? (x <= 7.0 ? 43648.0 : 23210.0) : idx;
    idx = y == 25.0 ? (x <= 7.0 ? 62784.0 : 22013.0) : idx;
    idx = y == 24.0 ? (x <= 7.0 ? 63440.0 : 24573.0) : idx;
    idx = y == 23.0 ? (x <= 7.0 ? 55248.0 : 32767.0) : idx;
    idx = y == 22.0 ? (x <= 7.0 ? 55248.0 : 32735.0) : idx;
    idx = y == 21.0 ? (x <= 7.0 ? 65492.0 : 5461.0) : idx;
    idx = y == 20.0 ? (x <= 7.0 ? 64852.0 : 7511.0) : idx;
    idx = y == 19.0 ? (x <= 7.0 ? 64832.0 : 6143.0) : idx;
    idx = y == 18.0 ? (x <= 7.0 ? 43520.0 : 5477.0) : idx;
    idx = y == 17.0 ? (x <= 7.0 ? 38228.0 : 1382.0) : idx;
    idx = y == 16.0 ? (x <= 7.0 ? 21845.0 : 1430.0) : idx;
    idx = y == 15.0 ? (x <= 7.0 ? 21845.0 : 410.0) : idx;
    idx = y == 14.0 ? (x <= 7.0 ? 22005.0 : 602.0) : idx;
    idx = y == 13.0 ? (x <= 7.0 ? 38909.0 : 874.0) : idx;
    idx = y == 12.0 ? (x <= 7.0 ? 43007.0 : 686.0) : idx;
    idx = y == 11.0 ? (x <= 7.0 ? 44031.0 : 682.0) : idx;
    idx = y == 10.0 ? (x <= 7.0 ? 43763.0 : 17066.0) : idx;
    idx = y == 09.0 ? (x <= 7.0 ? 43708.0 : 21162.0) : idx;
    idx = y == 08.0 ? (x <= 7.0 ? 43648.0 : 21930.0) : idx;
    idx = y == 07.0 ? (x <= 7.0 ? 43584.0 : 21930.0) : idx;
    idx = y == 06.0 ? (x <= 7.0 ? 42389.0 : 21930.0) : idx;
    idx = y == 05.0 ? (x <= 7.0 ? 23189.0 : 21930.0) : idx;
    idx = y == 04.0 ? (x <= 7.0 ? 43669.0 : 21920.0) : idx;
    idx = y == 03.0 ? (x <= 7.0 ? 43669.0 : 0.0) : idx;
    idx = y == 02.0 ? (x <= 7.0 ? 10901.0 : 0.0) : idx;
    idx = y == 01.0 ? (x <= 7.0 ? 5.0 : 0.0) : idx;
  }
  idx = SPRITE_DEC(x, idx);
  color = idx == 1.0 ? RGB(106, 107, 004) : color;
  color = idx == 2.0 ? RGB(177, 052, 037) : color;
  color = idx == 3.0 ? RGB(227, 157, 037) : color;
}

float gaussian(float z, float u, float o) {
    return (
    (1.0 / (o * SQRTAU)) *
        (exp(-(((z - u) * (z - u)) / (2.0 * (o * o)))))
    );
}

vec3 gaussgrain(float t) {
    vec2 ps = vec2(1.414) / iResolution.xy;
    vec2 uv = gl_FragCoord.xy * ps;
    float seed = dot(uv, vec2(12.9898, 78.233));
    float noise = fract(sin(seed) * 43758.5453123 + t);
    noise = gaussian(noise, 0.0, 0.5);
    return vec3(noise);
}

float ditherPos(vec2 coord) {
    const int indexMatrix4x4[16] = int[16](
            0, 8, 2, 10,
            12, 4, 14, 6,
            3, 11, 1, 9,
            15, 7, 13, 5
        );
    int x = int(mod(coord.x, 4.0));
    int y = int(mod(coord.y, 4.0));
    return float(indexMatrix4x4[x + y * 4]) / 16.0;
}
mat4 brightnessMatrix(float brightness) {
    return mat4(
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        brightness, brightness, brightness, 1
    );
}

mat4 contrastMatrix(float contrast) {
    float t = (1.0 - contrast) / 2.0;
    return mat4(
        contrast, 0, 0, 0,
        0, contrast, 0, 0,
        0, 0, contrast, 0,
        t, t, t, 1
    );
}

mat4 saturationMatrix(float saturation) {
    vec3 luminance = vec3(0.3086, 0.6094, 0.0820);
    float oneMinusSat = 1.0 - saturation;
    vec3 red = vec3(luminance.x * oneMinusSat);
    red += vec3(saturation, 0, 0);
    vec3 green = vec3(luminance.y * oneMinusSat);
    green += vec3(0, saturation, 0);
    vec3 blue = vec3(luminance.z * oneMinusSat);
    blue += vec3(0, 0, saturation);
    return mat4(red, 0, green, 0, blue, 0, 0, 0, 0, 1);
}

float oscillate(float s, float e, float t) {
    return (e - s) * 0.5 + s + sin(t) * (e - s) * 0.5;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord.xy / iResolution.xy;
    vec2 ouv = uv;
    vec2 marioUV = uv;

    #ifdef CURVE
    uv = (uv - 0.5) * 2.0;
    uv.xy *= 1.0 + pow((abs(vec2(uv.y, uv.x)) / vec2(CURVE)), vec2(2.0));
    uv = (uv / 2.0) + 0.5;
    #endif

    vec4 tex = texture(iChannel0, uv);
    vec4 oTex = tex;

    #ifdef BRIGHTNESS
    tex = brightnessMatrix(BRIGHTNESS) * tex;
    #endif
    #ifdef CONTRAST
    tex = contrastMatrix(CONTRAST) * tex;
    #endif
    #ifdef SATURATION
    tex = saturationMatrix(SATURATION) * tex;
    #endif

    vec4 highPass = tex;
    if (length(highPass.rgb) < THIRD) {
        highPass *= 0.0;
    }

    fragColor.r = texture(iChannel0, vec2(uv.x + 0.0003 * COLOR_FRINGING_SPREAD, uv.y + 0.0003 * COLOR_FRINGING_SPREAD)).x;
    fragColor.g = texture(iChannel0, vec2(uv.x + 0.0000 * COLOR_FRINGING_SPREAD, uv.y - 0.0006 * COLOR_FRINGING_SPREAD)).y;
    fragColor.b = texture(iChannel0, vec2(uv.x - 0.0006 * COLOR_FRINGING_SPREAD, uv.y + 0.0000 * COLOR_FRINGING_SPREAD)).z;
    fragColor.a = texture(iChannel0, uv).a;

    fragColor = mix(tex, fragColor, 0.5);

    fragColor.r += 0.04 * GHOSTING_STRENGTH * texture(iChannel0, GHOSTING_SPREAD * vec2(+0.025, -0.027) + uv.xy).x;
    fragColor.g += 0.02 * GHOSTING_STRENGTH * texture(iChannel0, GHOSTING_SPREAD * vec2(-0.022, -0.020) + uv.xy).y;
    fragColor.b += 0.04 * GHOSTING_STRENGTH * texture(iChannel0, GHOSTING_SPREAD * vec2(-0.020, -0.018) + uv.xy).z;

    fragColor.rgb = mix(fragColor.rgb, fragColor.rgb * fragColor.rgb, DARKEN_MIX);
    vec3 vig = fragColor.rgb * VIGNETTE_BRIGHTNESS * pow(uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y), VIGNETTE_SPREAD);
    fragColor.rgb += gaussgrain(iTime * 0.75) * 0.05;
    fragColor.rgb = mix(fragColor.rgb, vig, 0.42);
    fragColor.rgb *= vec3(TINT);

    fragColor.rgb *= mix(
            1.0,
            SCAN_LINES_VARIANCE / 2.0 * (1.0 + sin(2 * PI * uv.y * iResolution.y / SCAN_LINES_PERIOD)),
            SCAN_LINES_STRENGTH
        );
    int aperture_grille_step = int(8 * mod(fragCoord.x, APERTURE_GRILLE_PERIOD) / APERTURE_GRILLE_PERIOD);
    float aperture_grille_mask;

    if (aperture_grille_step < 3)
        aperture_grille_mask = 0.0;
    else if (aperture_grille_step < 4)
        aperture_grille_mask = mod(8 * fragCoord.x, APERTURE_GRILLE_PERIOD) / APERTURE_GRILLE_PERIOD;
    else if (aperture_grille_step < 7)
        aperture_grille_mask = 1.0;
    else if (aperture_grille_step < 8)
        aperture_grille_mask = mod(-8 * fragCoord.x, APERTURE_GRILLE_PERIOD) / APERTURE_GRILLE_PERIOD;

    fragColor.rgb *= 1.0 - APERTURE_GRILLE_STRENGTH * aperture_grille_mask;

    fragColor *= 1.0 - FLICKER_STRENGTH / 2.0 * (1.0 + sin(2 * PI * FLICKER_FREQUENCY * iTime));

    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        fragColor.rgb = BG;
    }

    #ifdef BLOOM_SPREAD
    vec2 step = BLOOM_SPREAD * vec2(TWOTHIRDS) / iResolution.xy;

    for (int i = 0; i < 30; i++) {
        float offset = 1.0 + max(0.0, float(i - 8)) / 128.0;
        vec3 bloom_sample = bloom_samples[i];
        vec4 neighbor = texture(iChannel0, uv + bloom_sample.xy * step * offset);
        float luminance = 0.299 * neighbor.r + 0.587 * neighbor.g + 0.114 * neighbor.b;
        fragColor += luminance * bloom_sample.z * neighbor * BLOOM_STRENGTH;
    }

    fragColor = clamp(fragColor, 0.0, 1.0);
    #endif

    float dither = ditherPos(fragCoord);

    if (dither < 0.5) {
        fragColor = vec4(FADE_FACTOR * fragColor.rgb, FADE_FACTOR);
        fragColor += highPass * (1.0 - FADE_FACTOR);
    } else {
        fragColor = vec4(clamp(FADE_FACTOR * 2.0, 0.0, 1.0) * fragColor.rgb, clamp(FADE_FACTOR * 2.0, 0.0, 1.0));
    }
    fragColor += highPass * 0.12;
    fragColor = mix(oTex, fragColor, 0.8);

    vec4 rainbowBarf = vec4(0.0, 0.0, 0.0, 1.0);
    float borderTime = iTime * -0.12;

    rainbowBarf.r = 0.5 + 0.5 * sin(2.0 * PI * (ouv.x + ouv.y + borderTime) * 3.0);
    rainbowBarf.g = 0.5 + 0.5 * sin(2.0 * PI * (ouv.x + ouv.y + borderTime) * 3.0 + TAU / 3.0);
    rainbowBarf.b = 0.5 + 0.5 * sin(2.0 * PI * (ouv.x + ouv.y + borderTime) * 3.0 + 2.0 * TAU / 3.0);

    if (WHITE_BORDER_PIXELS > 0.0) {
      float pixWidth = 2.0 / iResolution.x;
      float pixHeight = 2.0 / iResolution.y;
      if (ouv.x < pixWidth || ouv.x > 1.0 - pixWidth || ouv.y < pixHeight || ouv.y > 1.0 - pixHeight) {
          fragColor = rainbowBarf;
      }
    }

    // float w = 20.0;
    // float ot = iTime + (1.0 + oscillate(0.0, 1.0, iTime));
    // float height = oscillate(0.1, 0.12, iTime);
    // float speed = oscillate(3.0, 4.0, iTime);
    // float o = clamp(oscillate(-3.0, height, ot), 0.0, 0.2);
    // marioUV.y = marioUV.y - o;
    //
    // marioUV *= w;
    // marioUV.x = mod(marioUV.x - iTime * 2.0001, 1.9 * w);
    // marioUV = floor(marioUV * 20.0);
    // vec3 marioCol = vec3(0.0);
    // if (marioUV.x >= 0.0 && marioUV.x <= 15.0) {
    //     SpriteMario(marioCol, marioUV.x, marioUV.y, mod(floor(iTime * 16.0), 3.0));
    // }
    // if (dither >= 0.5) {
    //   fragColor += vec4(marioCol, 0.01);
    // }


}
