// Autonomous teaching loop. Times follow the base fixture, at 60x playback.
let stopNetworkDemo = () => {};
function networkDemo(){
 const routes=[['A','#3978a8','M155 140 H325 Q370 140 400 170 H775'],['B','#bd7c39','M155 265 H385 Q425 265 450 235 H775'],['C','#528663','M155 390 H510 Q550 390 580 360 H775']];
 return `<div class="network-demo auto-demo" data-ui><svg viewBox="0 0 960 540" role="img" aria-label="Automatic 16 by 9 demonstration: 12 buses, three routes, six stops per route, three reserves initially"><rect width="960" height="540" fill="#f0f5f3"/><g font-family="Arial, sans-serif" fill="#263f49"><text x="28" y="38" font-size="23" font-weight="700">12 buses / 3 routes / 6 stops per route</text><text x="28" y="68" font-size="17">2 directions / 40 seats per bus / 60x playback</text><text id="demo-time" x="930" y="38" text-anchor="end" font-size="22">00:00</text><text id="demo-count" x="930" y="68" text-anchor="end" font-size="17">9 on routes / 3 reserve</text>${[[270,190,70,35],[485,285,90,38],[655,95,80,32]].map(([x,y,w,h])=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="#dfe8df"/>`).join('')}${routes.map(([n,c,d])=>`<text x="32" y="${n==='A'?147:n==='B'?272:397}" font-size="25" fill="${c}" font-weight="700">Route ${n}</text><path d="${d}" fill="none" stroke="white" stroke-width="22"/><path id="demo-route-${n}" d="${d}" fill="none" stroke="${c}" stroke-width="6" opacity=".55"/><g id="demo-stops-${n}"></g>${[0,1,2].map(i=>`<g data-demo-bus="${n}${i}"><rect x="-16" y="-10" width="32" height="20" rx="5" fill="${c}" stroke="white" stroke-width="2"/><text text-anchor="middle" y="5" fill="white" font-size="12" font-weight="700">${n}${i+1}</text></g>`).join('')}`).join('')}<rect x="815" y="135" width="122" height="217" rx="6" fill="#263f49"/><text x="829" y="165" fill="white" font-size="19">Depot</text>${[0,1,2].map(i=>`<g id="demo-parked-${i}"><rect x="838" y="${189+i*46}" width="66" height="28" rx="5" fill="#dbe7e6"/><text x="871" y="${208+i*46}" text-anchor="middle" fill="#263f49" font-size="17">R${i+1}</text></g>`).join('')}<path id="demo-transfer" d="M838 203 Q795 203 795 438 H155 Q120 438 120 290 Q120 265 155 265" fill="none" stroke="#bd7c39" stroke-width="2" stroke-dasharray="6 6" opacity=".4"/><g id="demo-reserve" visibility="hidden"><rect x="-18" y="-11" width="36" height="22" rx="5" fill="#263f49" stroke="white" stroke-width="2"/><text y="5" text-anchor="middle" fill="white" font-size="13" font-weight="700">R1</text></g><text id="demo-status" x="28" y="485" font-size="21" font-weight="700">9 buses on routes; 3 reserves at the depot.</text><text x="28" y="516" font-size="16" fill="#526b70">Illustrative sequence / 3 min between stops / 30 s dwell / 6 min depot travel</text></g></svg></div>`;
}
function startNetworkDemo(){
 stopNetworkDemo();const root=document.querySelector('.auto-demo');if(!root)return;
 const q=s=>root.querySelector(s),routes=['A','B','C'].map(n=>({n,path:q('#demo-route-'+n)}));
 routes.forEach(({n,path})=>{const length=path.getTotalLength();q('#demo-stops-'+n).innerHTML=Array.from({length:6},(_,i)=>{const p=path.getPointAtLength(length*i/5);return `<circle cx="${p.x}" cy="${p.y}" r="6" fill="white" stroke="#728a82" stroke-width="2"/><text x="${p.x}" y="${p.y+30}" text-anchor="middle" font-size="13">S${i}</text>`;}).join('');});
 // One-way service: five 180s edges and four 30s intermediate dwells.
 // Mandatory 120s terminal layover, then reverse direction.
 function fraction(age,reverse=false){
  if(age<0)return reverse?1:0;
  const leg=Math.floor(age/1140),t=age%1140;let f=1;
  if(t<1020){const segment=Math.min(4,Math.floor(t/210));f=(segment+Math.min((t-segment*210)/180,1))/5;}
  return ((leg%2===1)!==reverse)?1-f:f;
 }
 function place(bus,path,f,lane=0){const p=path.getPointAtLength(path.getTotalLength()*f);bus.setAttribute('transform',`translate(${p.x},${p.y+lane})`);}
 function draw(t){
  routes.forEach(({n,path})=>[0,1,2].forEach(i=>place(q(`[data-demo-bus="${n}${i}"]`),path,fraction(t-(i===1?600:0),i===2),i===1?11:-9)));
  const dispatched=t>=120,arrived=t>=480;
  q('#demo-parked-0').setAttribute('visibility',dispatched?'hidden':'visible');q('#demo-reserve').setAttribute('visibility',dispatched?'visible':'hidden');
  if(dispatched)place(q('#demo-reserve'),arrived?routes[1].path:q('#demo-transfer'),arrived?fraction(t-480):(t-120)/360,arrived?11:0);
  q('#demo-count').textContent=arrived?'10 on routes / 2 reserve':dispatched?'9 on routes / 1 deadhead / 2 reserve':'9 on routes / 3 reserve';
  q('#demo-time').textContent=String(Math.floor(t/60)).padStart(2,'0')+':'+String(Math.floor(t%60)).padStart(2,'0');
  q('#demo-status').textContent=arrived?'Reserve R1 now serves route B. Fleet stays at 12 buses.':dispatched?'Dispatch R1 to route B: 6 minutes of physical travel.':'9 buses on routes; 3 reserves at the depot.';
 }
 draw(0);if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 let frame=0,start=null;function tick(now){if(start===null)start=now;draw(((now-start)*.06)%2400);frame=requestAnimationFrame(tick);}frame=requestAnimationFrame(tick);stopNetworkDemo=()=>cancelAnimationFrame(frame);
}
