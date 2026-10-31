const W=11,VH=15,cv=document.getElementById('c'),cx=cv.getContext('2d'),stage=document.getElementById('stage'),toast=document.getElementById('toast');
const coinsEl=document.getElementById('coins'),scoreEl=document.getElementById('score'),lvlEl=document.getElementById('lvl'),bar=document.getElementById('bar');
const D=[[1,0],[-1,0],[0,1],[0,-1]],key=(x,y)=>x+','+y;
const layer=document.createElement('canvas'),lx=layer.getContext('2d');
let T=30,dpr=1,level=1,score=0,coins=0,scoreStart=0,coinsStart=0,g,p,anim=null,locked=false,flash=0,cam=0,lava=0,running=false,shake=0,parts=[],tm=0;
const stars=Array.from({length:70},()=>({x:Math.random(),y:Math.random(),z:.1+Math.random()*.5}));
function rng(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function slide(m,x,y,d){const c=[];while(m[y+d[1]][x+d[0]]!=='#'){x+=d[0];y+=d[1];c.push([x,y])}return c}
function gen(lv){
  const h=26+Math.min(lv,12)*3,r=rng(lv*7919+13);let b=null;
  for(let n=0;n<400;n++){
    const m=[];
    for(let y=0;y<h;y++){m.push([]);for(let x=0;x<W;x++)m[y].push(x==0||y==0||x==W-1||y==h-1||r()<.19+Math.min(lv,10)*.012?'#':'.')}
    const fl=[];for(let y=h-5;y<h-1;y++)for(let x=1;x<W-1;x++)if(m[y][x]=='.')fl.push([x,y]);
    if(!fl.length)continue;
    const s=fl[r()*fl.length|0],k0=key(...s),par={[k0]:null},dist={[k0]:0},q=[s],seen=new Set([k0]);
    while(q.length){
      const [x,y]=q.shift();
      for(const d of D){
        const c=slide(m,x,y,d);if(!c.length)continue;
        c.forEach(a=>seen.add(key(...a)));
        const e=c[c.length-1],k=key(...e);
        if(!(k in par)){par[k]=[x,y,c];dist[k]=dist[key(x,y)]+1;q.push(e)}
      }
    }
    let e=s;for(const k in dist){const [x,y]=k.split(',').map(Number);if(y<e[1]||(y==e[1]&&dist[k]>dist[key(...e)]))e=[x,y]}
    const sc=(h-e[1])*10+dist[key(...e)];
    if(!b||sc>b.sc)b={m,s,e,par,seen,h,sc,mv:dist[key(...e)]};
    if(e[1]<=2&&b.mv>=3+Math.min(lv,6))break;
  }
  const {m,s,e,par,seen}=b,ke=key(...e),k0=key(...s),path=new Set([k0]);let k=ke,cells=0;
  while(par[k]){const [px,py,c]=par[k];c.forEach(a=>path.add(key(...a)));cells+=c.length;k=key(px,py)}
  const sh=a=>{for(let i=a.length-1;i>0;i--){const j=r()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
  const sp=new Set(sh([...seen].filter(k=>!path.has(k)&&k!==k0&&k!==ke)).slice(0,Math.min(lv*2,24)));
  const it={};
  seen.forEach(k=>{if(!sp.has(k)&&k!==k0&&k!==ke)it[k]='.'});
  sh([...seen].filter(k=>it[k]==='.')).slice(0,Math.min(4+lv,12)).forEach(k=>it[k]='o');
  sh([...path].filter(k=>k!==k0&&k!==ke)).slice(0,2).forEach(k=>it[k]='*');
  const lav0=s[1]+7,budget=(cells/18+b.mv*.7)*Math.max(1.5,3.6-.22*lv);
  return{m,h,s,e,sp,it,lav0,speed:(lav0-e[1])/budget}
}
function say(t,ms){toast.textContent=t;toast.classList.add('on');setTimeout(()=>toast.classList.remove('on'),ms)}
function load(){g=gen(level);p={x:g.s[0],y:g.s[1]};anim=null;locked=false;running=false;lava=g.lav0;parts=[];cam=1e9;hud();build();say('FASE '+level,900)}
function hud(){coinsEl.textContent=coins;scoreEl.textContent=score;lvlEl.textContent=level}
function pos(){let x=p.x,y=p.y;if(anim){const n=anim.c[anim.i];x+=(n[0]-p.x)*anim.t;y+=(n[1]-p.y)*anim.t}return[x,y]}
function burst(x,y,c,n,sp,up){for(let i=0;i<n;i++){const a=Math.random()*6.283,v=sp*(.3+Math.random());parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-(up||0),l:1,c,s:1+Math.random()*3})}}
function move(d){
  if(anim||locked)return;
  const c=slide(g.m,p.x,p.y,d),cells=[];
  for(const a of c){cells.push(a);const k=key(...a);if(g.sp.has(k)||(a[0]==g.e[0]&&a[1]==g.e[1]))break}
  if(cells.length){anim={c:cells,i:0,t:0,d};running=true}
}
function die(why){
  anim=null;locked=true;flash=1;shake=1;const [x,y]=pos();
  burst((x+.5)*T,(y+.5)*T,'#ff0',40,T*9);burst((x+.5)*T,(y+.5)*T,'#f33',30,T*7);
  say(why,900);setTimeout(()=>{score=scoreStart;coins=coinsStart;flash=0;load()},950)
}
function enter(c){
  const k=key(...c);
  if(g.sp.has(k)){die('FALHA');return}
  const t=g.it[k];
  if(t){score+=t=='.'?10:t=='o'?50:100;if(t=='o')coins++;delete g.it[k];hud();
    burst((c[0]+.5)*T,(c[1]+.5)*T,t=='.'?'#fa4':t=='o'?'#ff0':'#f98',t=='.'?4:16,T*5)}
  if(c[0]==g.e[0]&&c[1]==g.e[1]){
    anim=null;locked=true;score+=200+Math.round(Math.max(0,lava-c[1])*10);hud();
    burst((c[0]+.5)*T,(c[1]+.5)*T,'#f87',60,T*10);burst((c[0]+.5)*T,(c[1]+.5)*T,'#0ff',40,T*8);
    say('FASE COMPLETA',850);setTimeout(()=>{level++;scoreStart=score;coinsStart=coins;load()},900)}
}
function upd(dt){
  tm+=dt;shake=Math.max(0,shake-dt*2.5);
  if(anim){
    anim.t+=dt*18;
    while(anim&&anim.t>=1){
      const c=anim.c[anim.i];p.x=c[0];p.y=c[1];anim.t-=1;anim.i++;
      const done=anim.i>=anim.c.length;enter(c);
      if(!anim)break;
      if(done){anim=null;break}
    }
    if(anim){const [x,y]=pos();burst((x+.5)*T,(y+.5)*T,'#ff0',1,T*1.2)}
  }
  const [px,py]=pos();
  if(running&&!locked){
    lava-=g.speed*dt;
    if(Math.random()<dt*30)parts.push({x:Math.random()*W*T,y:lava*T,vx:0,vy:-T*(2+Math.random()*3),l:1,c:'#fa4',s:2});
    if(lava<py+.5)die('QUEIMADO!');
  }
  bar.style.width=Math.max(0,Math.min(100,(g.s[1]-py)/(g.s[1]-g.e[1])*100))+'%';
  for(const a of parts){a.x+=a.vx*dt;a.y+=a.vy*dt;a.vy+=T*6*dt;a.l-=dt*1.6}
  parts=parts.filter(a=>a.l>0);
  const tg=Math.max(0,Math.min((g.h-VH)*T,(py+.5)*T-VH*T*.62));
  cam=cam>1e8?tg:cam+(tg-cam)*Math.min(1,dt*8);
}
function isW(x,y){return x<0||y<0||x>=W||y>=g.h||g.m[y][x]==='#'}
function build(){
  if(!g)return;
  layer.width=cv.width;layer.height=Math.round(T*g.h*dpr);
  lx.setTransform(dpr,0,0,dpr,0,0);lx.clearRect(0,0,layer.width,layer.height);
  for(let y=0;y<g.h;y++)for(let x=0;x<W;x++){
    const px=x*T,py=y*T;
    if(g.m[y][x]==='#'){
      const gr=lx.createLinearGradient(px,py,px,py+T);gr.addColorStop(0,(x+y)%2?'#1c1040':'#170d36');gr.addColorStop(1,'#0c0620');
      lx.fillStyle=gr;lx.fillRect(px,py,T,T);
      lx.strokeStyle='rgba(120,60,255,.25)';lx.lineWidth=1;lx.strokeRect(px+.5,py+.5,T-1,T-1);
      if((x*7+y*13)%3==0){lx.fillStyle='rgba(255,0,255,.28)';lx.fillRect(px+T*.35,py+T*.35,T*.3,T*.3)}
      else if((x*5+y*11)%4==0){lx.strokeStyle='rgba(0,255,255,.3)';lx.strokeRect(px+T*.3,py+T*.3,T*.4,T*.4)}
    }else{lx.strokeStyle='rgba(0,255,255,.08)';lx.strokeRect(px+.5,py+.5,T-1,T-1)}
  }
  lx.shadowColor='#f0f';lx.shadowBlur=T*.4;lx.strokeStyle='#f6f';lx.lineWidth=Math.max(2,T*.09);lx.lineCap='round';
  const e=T*.04;
  for(let y=0;y<g.h;y++)for(let x=0;x<W;x++){
    if(g.m[y][x]!=='#')continue;
    const px=x*T,py=y*T;lx.beginPath();
    if(!isW(x+1,y)){lx.moveTo(px+T-e,py);lx.lineTo(px+T-e,py+T)}
    if(!isW(x-1,y)){lx.moveTo(px+e,py);lx.lineTo(px+e,py+T)}
    if(!isW(x,y+1)){lx.moveTo(px,py+T-e);lx.lineTo(px+T,py+T-e)}
    if(!isW(x,y-1)){lx.moveTo(px,py+e);lx.lineTo(px+T,py+e)}
    lx.stroke();
  }
  lx.shadowBlur=0;
}
function glow(c,b){cx.shadowColor=c;cx.shadowBlur=b}
function draw(now){
  const vw=T*W,vh=T*VH;
  cx.setTransform(1,0,0,1,0,0);cx.clearRect(0,0,cv.width,cv.height);
  cx.setTransform(dpr,0,0,dpr,0,0);
  const bg=cx.createLinearGradient(0,0,0,vh);bg.addColorStop(0,'#150a35');bg.addColorStop(1,'#05060f');cx.fillStyle=bg;cx.fillRect(0,0,vw,vh);
  cx.fillStyle='#fff';
  for(const s of stars){cx.globalAlpha=.25+.5*Math.abs(Math.sin(now/700+s.x*9));cx.fillRect(s.x*vw,((s.y*vh-cam*s.z)%vh+vh)%vh,1.5,1.5)}
  cx.globalAlpha=1;
  const sk=shake*T*.25;
  cx.save();cx.translate((Math.random()-.5)*sk,-cam+(Math.random()-.5)*sk);
  cx.setTransform(1,0,0,1,0,0);cx.drawImage(layer,(Math.random()-.5)*sk*dpr,(-cam+(Math.random()-.5)*sk)*dpr);
  cx.setTransform(dpr,0,0,dpr,(Math.random()-.5)*sk*dpr,(-cam+(Math.random()-.5)*sk)*dpr);
  const pu=.6+.4*Math.sin(now/220),y0=cam/T-1,y1=y0+VH+2;
  for(const k of g.sp){
    const [x,y]=k.split(',').map(Number);if(y<y0||y>y1)continue;
    glow('#0ff',T*.4);cx.fillStyle=pu>.7?'#0ff':'#5ff';
    for(let i=0;i<4;i++){const bx=x*T+i*T/4;cx.beginPath();cx.moveTo(bx+T*.02,y*T+T*.9);cx.lineTo(bx+T/8,y*T+T*.12);cx.lineTo(bx+T/4-T*.02,y*T+T*.9);cx.fill()}
  }
  const ex=g.e[0]*T,ey=g.e[1]*T;
  glow('#f87',T*.5*pu);cx.strokeStyle='#f87';cx.lineWidth=Math.max(2,T*.07);
  for(let i=0;i<3;i++){const o=T*(.12+i*.14);cx.strokeRect(ex+o,ey+o,T-2*o,T-2*o)}
  for(const k in g.it){
    const [x,y]=k.split(',').map(Number),t=g.it[k],cX=x*T+T/2,cY=y*T+T/2;if(y<y0||y>y1)continue;
    if(t=='.'){glow('#fa4',T*.2);cx.fillStyle='#fb6';cx.fillRect(cX-T*.06,cY-T*.06,T*.12,T*.12)}
    else if(t=='o'){glow('#ff0',T*.4);cx.strokeStyle='#ff0';cx.lineWidth=T*.09;cx.beginPath();cx.ellipse(cX,cY,T*.14*(.6+.4*Math.abs(Math.sin(now/300))),T*.22,0,0,7);cx.stroke()}
    else{glow('#f87',T*.5);cx.fillStyle='#f98';cx.font='bold '+T*.9+'px sans-serif';cx.textAlign='center';cx.textBaseline='middle';cx.fillText('★',cX,cY+T*.05)}
  }
  let [fx,fy]=pos();
  if(anim){for(let i=3;i>=1;i--){cx.globalAlpha=.12*(4-i);glow('#ff0',0);cx.fillStyle='#ff0';
    cx.fillRect((fx-anim.d[0]*i*.35+.12)*T,(fy-anim.d[1]*i*.35+.12)*T,T*.76,T*.76)}cx.globalAlpha=1}
  const px=fx*T,py=fy*T;
  if(!locked||!flash){
    glow('#ff0',T*.5);cx.fillStyle='#ff0';cx.fillRect(px+T*.12,py+T*.12,T*.76,T*.76);
    cx.shadowBlur=0;cx.fillStyle='#000';
    cx.fillRect(px+T*.27,py+T*.3,T*.16,T*.16);cx.fillRect(px+T*.57,py+T*.3,T*.16,T*.16);cx.fillRect(px+T*.3,py+T*.62,T*.4,T*.1);
  }
  const ly=lava*T,top=Math.max(ly,cam-T),bot=cam+vh+T;
  if(ly<bot){
    const lg=cx.createLinearGradient(0,ly,0,ly+T*6);lg.addColorStop(0,'#ffd23a');lg.addColorStop(.12,'#ff6a1a');lg.addColorStop(1,'#a0123a');
    glow('#f60',T*.9);cx.fillStyle=lg;cx.beginPath();cx.moveTo(0,bot);
    for(let x=0;x<=vw;x+=T/3)cx.lineTo(x,ly+Math.sin(x/T*1.8+now/260)*T*.12+Math.sin(x/T*.7-now/400)*T*.08);
    cx.lineTo(vw,bot);cx.fill();cx.shadowBlur=0;
  }
  for(const a of parts){cx.globalAlpha=Math.max(0,a.l);glow(a.c,6);cx.fillStyle=a.c;cx.fillRect(a.x,a.y,a.s,a.s)}
  cx.globalAlpha=1;cx.shadowBlur=0;cx.restore();
  cx.setTransform(dpr,0,0,dpr,0,0);
  const gap=lava-(fy+.5);
  if(running&&gap<5){const a=(5-Math.max(gap,0))/5*(.18+.1*Math.sin(now/90));
    const vg=cx.createRadialGradient(vw/2,vh/2,vh*.3,vw/2,vh/2,vh*.75);vg.addColorStop(0,'rgba(255,40,0,0)');vg.addColorStop(1,'rgba(255,40,0,'+(a*3)+')');cx.fillStyle=vg;cx.fillRect(0,0,vw,vh)}
  if(flash){cx.fillStyle='rgba(255,0,0,.25)';cx.fillRect(0,0,vw,vh)}
}
function resize(){
  const w=stage.clientWidth,h=stage.clientHeight;
  T=Math.max(10,Math.floor(Math.min(w/W,h/VH,90)));
  dpr=Math.min(window.devicePixelRatio||1,2);
  cv.style.width=T*W+'px';cv.style.height=T*VH+'px';
  cv.width=Math.round(T*W*dpr);cv.height=Math.round(T*VH*dpr);
  build();
}
new ResizeObserver(resize).observe(stage);
addEventListener('resize',resize);
addEventListener('keydown',e=>{
  const m={ArrowRight:0,d:0,ArrowLeft:1,a:1,ArrowDown:2,s:2,ArrowUp:3,w:3}[e.key];
  if(m!==undefined){e.preventDefault();move(D[m])}
});
let sx,sy,down=false;
addEventListener('pointerdown',e=>{sx=e.clientX;sy=e.clientY;down=true});
addEventListener('pointermove',e=>{
  if(!down)return;
  const dx=e.clientX-sx,dy=e.clientY-sy;
  if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;
  down=false;move(Math.abs(dx)>Math.abs(dy)?D[dx>0?0:1]:D[dy>0?2:3]);
});
addEventListener('pointerup',()=>down=false);
addEventListener('pointercancel',()=>down=false);
let lt=performance.now();
function loop(n){const dt=Math.min((n-lt)/1000,.05);lt=n;upd(dt);draw(n);requestAnimationFrame(loop)}
load();resize();requestAnimationFrame(loop);
