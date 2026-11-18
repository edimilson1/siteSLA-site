/* 11-shaders.js — código GLSL do fundo (mármore + cenas dos idiomas) e das partículas */
'use strict';
const bgVS = `attribute vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }`;

const bgFS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes, uM; uniform float uT, uCh, uVel; uniform sampler2D uA, uB;
float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x), mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x), f.y); }
float fbm(vec2 p){ float a=.5,s=0.; for(int i=0;i<5;i++){ s+=a*noise(p); p=p*2.03+vec2(7.1,3.7); a*=.5; } return s; }
void pal(float k, out vec3 b, out vec3 m, out vec3 h){
if(k<.5){ b=vec3(.027,.04,.09); m=vec3(.11,.17,.42); h=vec3(.80,.88,1.); }
else if(k<1.5){ b=vec3(.08,.04,.03); m=vec3(.48,.18,.10); h=vec3(.93,.75,.45); }
else if(k<2.5){ b=vec3(.03,.04,.10); m=vec3(.12,.16,.42); h=vec3(1.,.80,.30); }
else if(k<3.5){ b=vec3(.05,.03,.08); m=vec3(.30,.18,.40); h=vec3(1.,.78,.75); }
else if(k<4.5){ b=vec3(.09,.03,.04); m=vec3(.50,.10,.14); h=vec3(1.,.72,.40); }
else if(k<5.5){ b=vec3(.09,.04,.04); m=vec3(.55,.22,.12); h=vec3(1.,.82,.50); }
else { b=vec3(.02,.05,.14); m=vec3(.10,.22,.55); h=vec3(.86,.7,.3); }
}
float wt(float k){ return smoothstep(1.,0.,abs(uCh-k)); }
float bb(float k){ return (abs(k-5.)<.5 || abs(k-1.)<.5 || abs(k-6.)<.5) ? 1.75 : 1.; }
vec3 cover(sampler2D s, vec2 uv, vec2 warp){
float ia = 16./9., sa = uRes.x/uRes.y;
vec2 k = sa>ia ? vec2(1., ia/sa) : vec2(sa/ia, 1.);
float z = .8 - .012*sin(uT*.08) + .05*smoothstep(0.,1.,fract(uCh))*0.;
vec2 c = (uv-.5)*k*z + .5;
c += vec2(sin(uT*.05)*.014, cos(uT*.04)*.01) - (uM-.5)*.06 + warp;
c = 1. - abs(1. - mod(c, 2.));
return texture2D(s, clamp(c, .002, .998)).rgb;
}
void main(){
vec2 uv = gl_FragCoord.xy/uRes;
float asp = uRes.x/uRes.y;
vec2 p = (gl_FragCoord.xy-.5*uRes)/uRes.y;
vec2 m = (uM*uRes-.5*uRes)/uRes.y;
float t = uT*.06;
vec2 d = p-m; float md = length(d);

float ch = clamp(uCh,0.,6.);
float i0 = floor(ch); float f0 = smoothstep(.3,.7,fract(ch));
vec3 b0,m0,h0,b1,m1,h1; pal(i0+.1,b0,m0,h0); pal(min(i0+1.,6.)+.1,b1,m1,h1);
vec3 b=mix(b0,b1,f0), mm=mix(m0,m1,f0), h=mix(h0,h1,f0);

vec2 q = vec2(fbm(p*1.6+vec2(t,0.)), fbm(p*1.6+vec2(5.2,1.3)-t));
float f = fbm(p*1.4+2.5*q+t*.5);
float vein = pow(1.-abs(2.*fbm(p*2.2+3.*q+t)-1.),7.);
vec3 col = mix(b,mm,smoothstep(.2,.85,f));
col += h*vein*.07;

// imagem do capítulo (dissolve para a próxima conforme a rolagem)
vec2 warp = vec2(0.);
vec3 ia = cover(uA, uv, vec2((ch-i0-.5)*.03, (ch-i0-.5)*.12)), ib = cover(uB, uv, vec2((ch-i0-1.5)*.03, (ch-i0-1.5)*.12));
float tm = clamp((f0*1.5-.25)+(f-.5)*.45, 0., 1.);
ia *= bb(i0); ib *= bb(min(i0+1.,6.));
vec3 im = mix(ia, ib, smoothstep(.0,1.,tm));
float lightness = clamp(mix(bb(i0)-1., bb(min(i0+1.,6.))-1., smoothstep(.0,1.,tm))/.75, 0., 1.);
float lum = dot(im,vec3(.3,.59,.11));
im += im*smoothstep(.5,.95,lum)*.3 + vec3(.05,.025,.0)*smoothstep(.55,1.,lum);
im = mix(vec3(dot(im,vec3(.3,.59,.11))), im, 1.08);
im *= mix((.58 - .1*smoothstep(.55,.0,uv.y)) * (.78 + .22*smoothstep(1.,.2,abs(uv.x-.5)*2.)), .58, lightness);
col = col*.18 + im;

// 0 · óculo com raios de luz
vec2 oc = vec2(.17*asp+.06, .2);
float od = length(p-oc);
float ang = atan(p.y-oc.y,p.x-oc.x);
float rays = pow(max(0.,sin(ang*11.+t*3.+fbm(p*3.)*3.)),4.)*exp(-od*2.2);
col += wt(0.)*h*(exp(-od*3.2)*.06+rays*.1);

// 2 · linhas de manuscrito
float ln = sin((p.y+fbm(p*2.+t)*.25)*60.+sin(p.x*2.+uT*.2)*2.);
col += wt(2.)*h*smoothstep(.95,1.,ln)*.07*smoothstep(0.,.6,fbm(p*3.));

// 3 · ondas de voz a partir do ponteiro
float r = length(p-m*.7);
col += wt(3.)*h*smoothstep(.93,1.,sin(r*36.-uT*1.6))*exp(-r*3.)*.12;

// 4 · sóis suaves (metaballs)
float s=0.;
for(int i=0;i<5;i++){ float fi=float(i); vec2 c=vec2(sin(uT*.15+fi*1.7)*.5*asp*.8, cos(uT*.12+fi*2.3)*.3); s+=.012/dot(p-c,p-c); }
col += wt(4.)*mix(mm,h,smoothstep(.8,2.,s))*smoothstep(.7,1.,s)*.1;

// 5 · horizonte, sol e mar
float hy=-.12; vec2 sc=vec2(.12*asp,hy+.12); float sd=length(p-sc);
float above=smoothstep(hy-.01,hy+.01,p.y);
col += wt(5.)*h*exp(-sd*2.6)*.0*above;
float wv = sin(p.y*70.+sin(p.x*6.+uT*.5)*1.5+uT*.8);


col *= mix(smoothstep(1.35,.2,length(uv-.5)*1.5)*.5+.5, 1., lightness*.85);
col += (hash(gl_FragCoord.xy+uT)-.5)*.03;
gl_FragColor = vec4(col*.92,1.);
}`;

const ptVS = `
attribute vec4 aSeed; attribute float aG;
uniform float uT, uScroll, uPx; uniform vec2 uRes, uM;
varying float vA, vG, vR;
void main(){
float depth = aSeed.w;
float x = fract(aSeed.x + sin(uT*.05*aSeed.z + aSeed.y*6.)*.03);
float y = fract(aSeed.y + uT*.004*(.4+aSeed.z) + uScroll*(.15+depth*.6));
vec2 pos = vec2(x,y)*2.-1.;
vec2 asp = vec2(uRes.x/uRes.y,1.);
vec2 dm = (pos-uM)*asp; float md = length(dm);
pos += normalize(dm+1e-4)/asp*.18*exp(-md*3.)*(.5+depth);
gl_Position = vec4(pos,0.,1.);
gl_PointSize = (9.+depth*18.)*uPx;
vA = (.08+.3*depth)*smoothstep(0.,.08,y)*smoothstep(1.,.92,y);
vG = aG; vR = aSeed.z*6.283 + uT*.1*(aSeed.z-.5);
}`;

const ptFS = `
precision mediump float;
uniform sampler2D uAtlas; uniform vec3 uTint;
varying float vA, vG, vR;
void main(){
vec2 c = gl_PointCoord-.5; float s=sin(vR), co=cos(vR);
c = mat2(co,-s,s,co)*c+.5;
if(c.x<0.||c.x>1.||c.y<0.||c.y>1.) discard;
vec2 cell = vec2(mod(vG,8.), floor(vG/8.));
float a = texture2D(uAtlas,(cell+c)/8.).r;
gl_FragColor = vec4(uTint*a*vA, a*vA);
}`;
