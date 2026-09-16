/* Phosphor — Originkit. Shader supplied by the site owner.
 * Adapted from the supplied React component to dependency-free WebGL.
 * Source: https://www.originkit.dev/components/phosphor
 */
(() => {
const VERT_SRC = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`
const FRAG_SRC = `
precision highp float;

uniform vec2  uRes;
uniform float uTime;


uniform vec3  uBase;
uniform float uSpread;
uniform float uRadius;
uniform float uDist;
uniform float uTurb;
uniform float uGain;

vec3 tanh3(vec3 x) {
    vec3 e = exp(-2.0 * abs(x));
    return sign(x) * (1.0 - e) / (1.0 + e);
}

void main() {
    vec3 dir = normalize(vec3(2.0 * gl_FragCoord.xy - uRes, 1.0 - uRes.y));

    vec3 acc = vec3(0.0);
    float z = 0.0;
    float d = 0.0;
    float s = 0.0;

    for (int i = 0; i < 80; i++) {
        vec3 p = z * dir;

        vec3 a = normalize(cos(vec3(1.0, 2.0, 0.0) + uTime - d * 8.0));

        p.z += uDist;

        a = a * dot(a, p) - cross(a, p);

        for (float k = 2.0; k < 10.0; k += 1.0) {
            a += uTurb * sin(a * k + uTime).yzx / k;
        }

        s = a.y;

        d = max(1e-6, 0.1 * abs(length(p) - uRadius) + 0.04 * abs(s));
        z += d;

        acc += (cos(s + vec3(0.0, 1.0, 2.0) * uSpread) + 1.0) / d * z;
    }

    vec3 glow = tanh3(acc * uBase * uGain);

    float cover = max(max(glow.r, glow.g), glow.b);
    // Fade to actual zero alpha before the canvas edges, including on Safari.
    vec2 uv = (gl_FragCoord.xy / uRes) * 2.0 - 1.0;
    float edge = 1.0 - smoothstep(0.55, 0.96, length(uv));
    float alpha = cover * edge;
    gl_FragColor = vec4(glow * edge, alpha);
}
`;
  const root = document.querySelector('[data-phosphor]');
  if (!root) return;
  const canvas = root.querySelector('canvas');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = motion.matches;
  let visible = true;
  let lost = false;
  let frame = 0;
  let clock = 0;
  let last = 0;
  let sizeDirty = true;
  const gl = canvas.getContext('webgl', {alpha:true, premultipliedAlpha:true, antialias:false, depth:false});
  if (!gl) return;
  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }
  const vertex = compile(gl.VERTEX_SHADER, VERT_SRC);
  const fragment = compile(gl.FRAGMENT_SHADER, FRAG_SRC);
  if (!vertex || !fragment) {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    return;
  }
  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);gl.deleteShader(vertex);gl.deleteShader(fragment);
    return;
  }
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
  const pos = gl.getAttribLocation(program, 'aPos');
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
  const loc = name => gl.getUniformLocation(program, name);
  const res = loc('uRes');
  const time = loc('uTime');
  gl.uniform3f(loc('uBase'),1,1,1);
  gl.uniform1f(loc('uSpread'),1);
  gl.uniform1f(loc('uRadius'),6);
  gl.uniform1f(loc('uDist'),12);
  gl.uniform1f(loc('uTurb'),.49);
  gl.uniform1f(loc('uGain'),1.76/30000);
  function draw(now) {
    frame = 0;
    if (lost || !visible || document.hidden) return;
    // Limit this raymarching effect to 30fps and a 420px drawing buffer.
    if (last && now-last < 1000/30 && !sizeDirty) {
      if (!paused) frame=requestAnimationFrame(draw);
      return;
    }
    if (!paused && last) clock += Math.min((now-last)/1000,.05)*2;
    last=now;
    if (sizeDirty) {
      const scale=Math.min(1,420/Math.max(root.clientWidth,root.clientHeight));
      canvas.width=Math.max(1,Math.round(root.clientWidth*scale));
      canvas.height=Math.max(1,Math.round(root.clientHeight*scale));
      gl.viewport(0,0,canvas.width,canvas.height);
      sizeDirty=false;
    }
    gl.uniform2f(res,canvas.width,canvas.height);
    gl.uniform1f(time,clock);
    gl.drawArrays(gl.TRIANGLES,0,3);
    root.classList.add('is-rendered');
    if (!paused) frame=requestAnimationFrame(draw);
  }
  function sync() {
    cancelAnimationFrame(frame);
    last=0;
    if (visible && !document.hidden && !lost) {
      sizeDirty=true;
      frame=requestAnimationFrame(draw);
    }
  }
  motion.addEventListener('change',()=>{paused=motion.matches;sync();});
  const resize = new ResizeObserver(()=>{sizeDirty=true;sync();});
  resize.observe(root);
  const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();});
  intersection.observe(root);
  document.addEventListener('visibilitychange',sync);
  canvas.addEventListener('webglcontextlost',event=>{
    event.preventDefault();lost=true;cancelAnimationFrame(frame);
    root.classList.remove('is-rendered');
  });
  // A stable visual fallback remains available when GPU rendering is unavailable.
  window.addEventListener('pagehide',()=>cancelAnimationFrame(frame));
  window.addEventListener('pageshow',sync);
  sync();
})();
