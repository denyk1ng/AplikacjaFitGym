import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "../lib/utils.js";

// Żywe tło pod ekranem cytatu przed sesją: powolne smugi światła w kolorze
// akcentu, przesuwające się po czerni. Liczone na GPU w shaderze.
//
// Celowo bez Three.js — biblioteka dołożyłaby do PWA ok. 150 kB spakowane,
// a tu potrzebny jest jeden prostokąt na całym ekranie i jeden fragment
// shader. Surowe WebGL to kilkadziesiąt linii i zero zależności.
//
// Zabezpieczenia, bo to ekran startu treningu, a nie wygaszacz:
//  · brak WebGL (stare przeglądarki, wyłączone GPU) => komponent nic nie
//    rysuje i zostaje czarne tło spod spodu,
//  · "ogranicz ruch" w systemie => jedna klatka, bez pętli,
//  · karta w tle => pętla się zatrzymuje (bateria w kieszeni na siłowni),
//  · rozdzielczość cięta do 1.5x DPR — na telefonie z DPR 3 pełna pikseloza
//    kosztuje kilkakrotnie więcej niż widać różnicy.

const VERT = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }
`;

// FBM z prostego szumu wartościowego — trzy oktawy wystarczą na miękkie
// smugi, a każda kolejna kosztuje na słabszym telefonie.
const FRAG = `
precision mediump float;
uniform vec2 res;
uniform float t;

float hash(vec2 v) { return fract(sin(dot(v, vec2(127.1, 311.7))) * 43758.5453123); }

float noise(vec2 v) {
  vec2 i = floor(v), f = fract(v);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 v) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) { s += a * noise(v); v *= 2.02; a *= 0.5; }
  return s;
}

void main() {
  vec2 uv = gl_FragCoord.xy / res;
  vec2 q = vec2(uv.x * (res.x / res.y), uv.y);

  // dwie warstwy sunące w przeciwne strony — bez tego ruch czyta się
  // jako przesuwana tekstura, a nie jako światło
  float n = fbm(q * 2.4 + vec2(t * 0.045, t * 0.02));
  n += 0.5 * fbm(q * 4.1 - vec2(t * 0.03, t * 0.05));

  // Światło zbiera się przy górnej i dolnej krawędzi, a przygasa w pasie
  // na wysokości cytatu — tekst ma zostać czytelny. W gl_FragCoord oś Y
  // rośnie ku GÓRZE ekranu, więc uv.y = 1.0 to góra kadru.
  float band = smoothstep(0.42, 1.0, uv.y) + 0.55 * smoothstep(0.38, 0.0, uv.y);
  float glow = pow(max(n - 0.48, 0.0), 1.55) * band * 1.6;

  vec3 bg = vec3(0.043, 0.043, 0.039);          // czerń tła aplikacji
  vec3 lime = vec3(0.698, 0.933, 0.216);        // #B2EE37
  vec3 col = bg + lime * glow * 0.85;

  // winieta spinająca kadr, ta sama logika co .filmic na zdjęciach
  float d = distance(uv, vec2(0.5, 0.46));
  col *= smoothstep(0.95, 0.28, d) * 0.75 + 0.35;

  // ziarno — rozbija banding na tak ciemnym gradiencie
  col += (hash(gl_FragCoord.xy + t) - 0.5) * 0.016;

  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export function ShaderBackdrop() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) return; // brak WebGL — zostaje czarne tło spod spodu

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "res");
    const uT = gl.getUniformLocation(prog, "t");

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.floor(canvas.clientWidth * dpr);
      const h = Math.floor(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };

    const draw = (time) => {
      resize();
      gl.uniform1f(uT, time);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    // ograniczony ruch: jedna klatka i koniec, żadnej pętli
    if (prefersReducedMotion()) {
      draw(0);
      return () => gl.getExtension("WEBGL_lose_context")?.loseContext();
    }

    let raf = 0;
    const t0 = performance.now();
    const loop = () => {
      draw((performance.now() - t0) / 1000);
      raf = requestAnimationFrame(loop);
    };
    loop();

    // karta schowana w tle nie ma po co liczyć klatek
    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) loop();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return <canvas ref={ref} aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />;
}
