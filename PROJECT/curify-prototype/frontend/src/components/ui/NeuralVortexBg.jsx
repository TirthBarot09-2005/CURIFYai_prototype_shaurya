import React, { useEffect, useRef } from 'react';

const NeuralVortexBg = () => {
  const canvasRef = useRef(null);
  const pointer = useRef({ x: 0, y: 0, tX: 0, tY: 0 });
  const animationRef = useRef(null);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const gl = canvasEl.getContext('webgl') || canvasEl.getContext('experimental-webgl');
    if (!gl) return;

    const vsSource = `precision mediump float; attribute vec2 a_position; varying vec2 vUv; void main(){vUv=.5*(a_position+1.);gl_Position=vec4(a_position,0.,1.);}`;
    const fsSource = `precision mediump float;varying vec2 vUv;uniform float u_time;uniform float u_ratio;uniform vec2 u_pointer_position;uniform float u_scroll_progress;
vec2 rotate(vec2 uv,float th){return mat2(cos(th),sin(th),-sin(th),cos(th))*uv;}
float neuro_shape(vec2 uv,float t,float p){vec2 sine_acc=vec2(0.);vec2 res=vec2(0.);float scale=8.;for(int j=0;j<15;j++){uv=rotate(uv,1.);sine_acc=rotate(sine_acc,1.);vec2 layer=uv*scale+float(j)+sine_acc-t;sine_acc+=sin(layer)+2.4*p;res+=(.5+.5*cos(layer))/scale;scale*=1.2;}return res.x+res.y;}
void main(){vec2 uv=.5*vUv;uv.x*=u_ratio;vec2 ptr=vUv-u_pointer_position;ptr.x*=u_ratio;float p=clamp(length(ptr),0.,1.);p=.5*pow(1.-p,2.);float t=.001*u_time;float noise=neuro_shape(uv,t,p);noise=1.2*pow(noise,3.);noise+=pow(noise,10.);noise=max(0.,noise-.5);noise*=(1.-length(vUv-.5));vec3 color=vec3(0.08,0.55,0.45);color=mix(color,vec3(0.02,0.65,0.85),0.32+0.16*sin(2.0*u_scroll_progress+1.2));color+=vec3(0.0,0.15,0.3)*sin(2.0*u_scroll_progress+1.5);color=color*noise;gl_FragColor=vec4(color,noise);}`;

    const compile = (src, type) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const vs = compile(vsSource, gl.VERTEX_SHADER);
    const fs = compile(fsSource, gl.FRAGMENT_SHADER);
    const prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog); gl.useProgram(prog);

    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(prog, 'a_position'); gl.enableVertexAttribArray(pos); gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRatio = gl.getUniformLocation(prog, 'u_ratio');
    const uPtr = gl.getUniformLocation(prog, 'u_pointer_position');
    const uScroll = gl.getUniformLocation(prog, 'u_scroll_progress');

    const resize = () => { const dpr = Math.min(window.devicePixelRatio, 2); canvasEl.width = window.innerWidth * dpr; canvasEl.height = window.innerHeight * dpr; gl.viewport(0, 0, canvasEl.width, canvasEl.height); gl.uniform1f(uRatio, canvasEl.width / canvasEl.height); };
    resize(); window.addEventListener('resize', resize);

    const render = () => {
      pointer.current.x += (pointer.current.tX - pointer.current.x) * 0.2;
      pointer.current.y += (pointer.current.tY - pointer.current.y) * 0.2;
      gl.uniform1f(uTime, performance.now());
      gl.uniform2f(uPtr, pointer.current.x / window.innerWidth, 1 - pointer.current.y / window.innerHeight);
      gl.uniform1f(uScroll, window.pageYOffset / (2 * window.innerHeight));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationRef.current = requestAnimationFrame(render);
    };
    render();

    const onMove = (e) => { pointer.current.tX = e.clientX; pointer.current.tY = e.clientY; };
    window.addEventListener('pointermove', onMove);

    return () => { window.removeEventListener('resize', resize); window.removeEventListener('pointermove', onMove); cancelAnimationFrame(animationRef.current); gl.deleteProgram(prog); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-0" style={{ opacity: 0.9 }} />;
};

export default NeuralVortexBg;
