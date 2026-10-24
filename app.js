const $ = s => document.querySelector(s);
const chapters = ['Environment & problem formulation','MaskablePPO & policy training','Experiments, results & evaluation','References'];
let current = Math.max(0, Math.min(SLIDES.length-1, (parseInt(location.hash.slice(1)) || 1) - 1));
let maskOn = true;
const esc = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
function markdown(source) {
  const math=[];
  source=source.replace(/\$\$([\s\S]*?)\$\$|\$([^$\n]+)\$/g,(_,block,inline)=>{
    const n=math.length; math.push({tex:block??inline,display:!!block}); return `MATHPLACEHOLDER${n}END`;
  }).replace(/\\>/g,'').replace(/\\\r?\n/g,'\n').replace(/\\\[/g,'[').replace(/\\\]/g,']');
  source=source.replace(/ - /g,'\n\n- ');
  let html=marked.parse(source);
  return html.replace(/MATHPLACEHOLDER(\d+)END/g,(_,i)=>katex.renderToString(math[i].tex,{displayMode:math[i].display,throwOnError:false,strict:false}));
}
const flow = (items, cls='') => `<div class="flow ${cls}">${items.map((t,i)=>`<div class="flow-node">${t}</div>${i<items.length-1?'<span class="flow-arrow">→</span>':''}`).join('')}</div>`;
function network(interactive=false) {
 return `<div class="network">${['A','B','C'].map((r,i)=>`<div class="route route-${r}"><b>${r}</b><div class="tracks"><div class="rail">${[0,1,2,3,4,5].map(n=>`<span class="stop"><i></i><small>S${n}</small></span>`).join('')}</div><div class="return-rail" aria-label="Separate return direction">${Array.from({length:6},()=>'<i></i>').join('')}</div><div class="direction">→ outbound <span>inbound ←</span></div>${interactive&&i===1?'<span class="bus moving-bus">→ BUS</span>':''}</div>${interactive?`<strong class="queue">${[12,65,20][i]}<small>waiting</small></strong>`:''}</div>`).join('')}<div class="depot">${Array.from({length:interactive?2:3},()=>'<span class="bus">BUS</span>').join('')}<strong>Reserve depot</strong></div></div>${interactive?'<button id="dispatch" class="primary">Dispatch reserve → Route B</button><p id="dispatch-status" class="caption">Illustrative state · minute 60</p>':''}`;
}
function bars(rows,max,unit='') {return `<div class="bar-chart">${rows.map(([label,val,detail],i)=>`<div class="bar-row"><div class="bar-label">${label}<strong>${val.toLocaleString('en-US')}${unit}</strong></div><div class="bar-track"><div class="bar-fill ${i===0?'best':''}" style="--width:${val/max*100}%"></div></div>${detail?`<small>${detail}</small>`:''}</div>`).join('')}</div>`;}
function mask(){return `<div class="mask-visual"><div class="mask-summary"><strong>221</strong><span>encoded actions</span><span class="mask-arrow">→</span><strong>${maskOn?'Feasible':'All'}</strong></div><div class="action-grid ${maskOn?'masked':''}">${Array.from({length:221},(_,i)=>`<i class="${i===0||i%7===0?'valid':'invalid'}"></i>`).join('')}</div><div class="mask-legend"><span>■ Valid</span><span>■ Invalid</span></div><button id="mask-control" class="primary">${maskOn?'Show before masking':'Apply action mask'}</button><p class="caption">Illustrative feasibility pattern · changes with the state</p></div>`;}
function networkImage(){return `<figure class="network-image"><button class="figure-open" data-figure="assets/network-user.png" data-caption="Bus network illustration" aria-label="Enlarge bus network illustration"><img src="assets/network-user.png" alt="Bus network illustration showing routes 33, 50 and 08, stops and reserve buses"></button></figure>`;}
function visual(n){
 const diagrams={
  2:()=>networkDemo(),3:()=>networkDemo(),
  4:()=>`<div class="timeline"><div><strong>0</strong><strong>180</strong><strong>240 min</strong></div><div class="time-bar"><span>Passenger arrivals + operation</span><span>Clear demand</span></div><div class="ticks">${flow(['30 s','30 s','30 s','30 s'])}<strong>One decision / 120 s</strong></div></div>`,
  5:()=>flow(['Arrive','Queue','Board','Onboard','Alight','Completed'])+'<p class="branch">Queue ↘ Abandoned</p>',
  6:()=>'<dl class="lifecycle-key">'+[['DEPOT_IDLE','Waiting at depot'],['DEADHEAD','Traveling empty to an assignment'],['TERMINAL_IDLE','Waiting at a route terminal'],['SERVICE_MOVING','Driving along the service route'],['SERVICE_DWELL','Stopping for boarding and alighting'],['LAYOVER','Resting between trips']].map(([term,meaning])=>'<div><dt>'+term+'</dt><dd>'+meaning+'</dd></div>').join('')+'</dl>',
  7:()=>flow(['Time','Passengers','Vehicles','Dispatcher','Demand & traffic'])+'<div class="convergence">↓<br>Simulator state Sₜ</div>',
  8:()=>flow(['Full state','Observation filter','Agent observation']),
  9:()=>`<div class="action-types action-explained">${[['NOOP','Keep the current plan'],['DISPATCH(b,r)','Send depot bus to route'],['SET_HEADWAY(r,h)','Set departure spacing'],['REASSIGN(b,r)','Move bus to another route'],['RECALL(b)','Return bus to depot'],['SHORT_TURN(b,r)','Turn back before route end']].map(([name,meaning],i)=>`<div><span class="action-symbol" aria-hidden="true">${['&#8545;','&#8599;','&#8596;','&#8644;','&#8601;','&#8630;'][i]}</span><div><code>${name}</code><p>${meaning}</p></div></div>`).join('')}</div>`,
  10:()=>`<div class="bands">${[['NOOP',1],['DISPATCH',64],['REASSIGN',64],['SHORT_TURN',64],['RECALL',16],['HEADWAY',12]].map(([x,v])=>`<div style="flex:${Math.max(v,12)}"><strong>${v}</strong><span>${x}</span></div>`).join('')}</div>`,
  12:()=>'<dl class="cost-key">'+[['W_k','Passenger waiting time'],['V_k','Time spent onboard'],['O_k','Crowding above 30 passengers'],['C_k','Active bus time'],['C_{D,k}','Empty repositioning time'],['X_k','Long-wait penalty (at least 15 min)'],['U_k','Passengers first denied boarding'],['E_k','Passengers who abandon'],['M_k','Mission changes'],[String.raw`\text{Terminal penalty}`,'Weighted unfinished-passenger count']].map(([term,meaning])=>'<div><dt>'+katex.renderToString(term,{throwOnError:false})+'</dt><dd>'+meaning+'</dd></div>').join('')+'</dl>',11:mask,13:()=>network(true),14:()=>`<ol class="interaction-loop">${['Environment','Observation<br>+ action mask','RL agent','Action','Simulation<br>120 s','Reward + next<br>observation ↺'].map(t=>`<li>${t}</li>`).join('')}</ol>`,
  15:()=>flow(['Observation','Policy πθ','Action','Reward ↺']),
  16:()=>architecture(),17:()=>flow(['δₜ','γλ δₜ₊₁','(γλ)² δₜ₊₂','…']),
  18:()=>`<svg class="plot" viewBox="0 0 600 240" role="img" aria-label="Positive advantage PPO surrogate: the unclipped objective keeps rising; clipped objective flattens above ratio 1.2"><path d="M45 205H570M65 220V15" stroke="currentColor" fill="none" stroke-width="3"/><path d="M80 195L530 25" stroke="#b8bdb7" stroke-width="4"/><path d="M80 195L360 90H540" stroke="#e56521" stroke-width="7" fill="none"/><text x="330" y="230">1.2</text><text x="410" y="65">Clipped objective</text><text x="80" y="35">Âₜ &gt; 0</text></svg>`,
  19:()=>flow(['Policy improvement','Value estimation','Exploration']),20:mask,
  21:()=>flow(['Observation + action','Old log-prob + mask mₜ','PPO update · same mₜ']),22:architecture,
  23:()=>`<div class="encoder-paths">${[['MLP10','10 min','Flatten + MLP'],['GRU10','10 min','Raw + GRU'],['Belief20-fade','20 min','Fading demand belief']].map(r=>`<div><strong>${r[0]}</strong><span>${r[1]}</span><p>${r[2]}</p></div>`).join('')}</div><div class="convergence">↓<br>128 shared features → Actor / Critic</div>`,
  24:()=>`<div class="big-stats">${[['500','training days'],['100','validation days'],['9','independent runs']].map(([v,l])=>`<div><strong>${v}</strong><span>${l}</span></div>`).join('')}</div>`,
  25:()=>flow(['Collect 1,024','Compute GAE','Shuffle','4 batches × 4 epochs','Update policy']),
  26:()=>flow(['Training checkpoints','Deterministic validation','Lowest cost','Best checkpoint → test']),
  27:()=>flow(['Config','Initialize','Rollout','GAE','PPO update','Validate ↺','Best checkpoint','Test']),
  28:()=>`<div class="comparison-groups"><div><strong>Learned controllers</strong><p>MLP10 · GRU10 · Belief20-fade</p></div><div><strong>Rule-based controllers</strong><p>Fixed · Proportional · Threshold</p></div></div>${flow(['Normal','Demand burst','Traffic disruption'])}`,
  29:()=>`<div class="objective"><strong>Total Cost ↓</strong><p>Mean Wait ↓ · P95 Wait ↓</p><p>Completion ↑ · Abandonment ↓ · Unfinished ↓</p></div>`,
  30:()=>bars([['RL-MLP10',13065.7],['RL-GRU10',13132.3],['RL-Belief20-fade',13081.6]],15000)+'<div class="result-callout"><strong>−17.6%</strong><span>Total Cost vs RULE-Fixed</span></div>',
  31:()=>`<div class="tradeoff"><div><span>Best overall objective</span><strong>25,178.5</strong><p>RL-Belief20-fade · Total Cost</p><p>P95 wait <b>30.87 min</b></p><p>Completion <b>98.21%</b></p></div><div><span>Better tail service</span><strong>26.64 min</strong><p>RULE-Threshold · P95 Wait</p><p>Completion <b>98.59%</b></p><p>Abandonment <b>0.90%</b></p></div></div>`,
  32:()=>bars([['RL-MLP10',13412.4],['RL-GRU10',13460],['RL-Belief20-fade',13419.3]],15000)+'<div class="result-callout"><strong>100%</strong><span>Completion · RL-MLP10</span></div>',
  33:()=>`<table><caption>Total Cost ± Seed SD</caption><thead><tr><th>Condition</th><th>MLP10</th><th>GRU10</th><th>Belief20-fade</th></tr></thead><tbody><tr><th>Normal</th><td class="winner">13,065.7 ± 52.4</td><td>13,132.3 ± 102.1</td><td>13,081.6 ± 50.8</td></tr><tr><th>Burst</th><td>25,197.2 ± 67.2</td><td>25,218.0 ± 51.1</td><td class="winner">25,178.5 ± 20.8</td></tr><tr><th>Traffic</th><td class="winner">13,412.4 ± 65.3</td><td>13,460.0 ± 89.2</td><td>13,419.3 ± 61.5</td></tr></tbody></table>`,
  34:()=>`<table><caption>Δ Cost vs Core · positive = worse</caption><thead><tr><th>Removed</th><th>Normal</th><th>Burst</th><th>Traffic</th></tr></thead><tbody>${[['REASSIGN','+0.47%','+0.92%','+0.33%'],['SHORT_TURN','+1.65%','+0.77%','+1.51%'],['Fairness','+2.12%','+0.93%*','+1.88%']].map(r=>`<tr>${r.map((c,i)=>`<${i?'td':'th'}>${c}</${i?'td':'th'}>`).join('')}</tr>`).join('')}</tbody></table><p class="caption">* Burst fairness: 95% CI crosses 0 → inconclusive</p>`,
  35:()=>flow(['Lower Total Cost','Cost–service trade-off','Control components matter']),
  36:()=>flow(['Synthetic simulator','Realistic scenarios','Real-world data']),
  37:()=>`<div class="closing-statement">We train an AI dispatcher,<br>not an AI bus driver.</div>${flow(['Problem','Environment','MaskablePPO','Evaluation'])}`
 };
 return diagrams[n]?.()??'';
}
function architecture(){return `<div class="architecture">${flow(['Observation dict','Encoder · 128 features'])}<div class="split-path"><div>Actor · 128 → 221 logits → <b>Mask</b> → Action</div><div>Critic · 128 → Value</div></div></div>`;}
function render(){
 stopNetworkDemo();
 const s=SLIDES[current];
 const n=s.visualId;
 document.body.dataset.slide=s.id;
 document.body.dataset.chapter=s.chapter;
 document.querySelectorAll('[data-chapter]').forEach(b=>{b.classList.toggle('active',+b.dataset.chapter===s.chapter);b.setAttribute('aria-current',+b.dataset.chapter===s.chapter?'step':'false');});
 let content=s.content;
 if(n===1) content='';
 if([9,22,23,24,28,29,30,31,32,33,34,35,37].includes(n)) {
   const overrides={9:'**Variables:** $b$: bus; $r$: route; $h$: departure spacing\n\n**Headway options:** 6 · 10 · 15 min\n\nIllustrative short-turn: $S_0\\rightarrow S_3\\rightarrow S_0$',22:'**Trainer:** `MaskablePPO("MultiInputPolicy", ...)`',23:'**Shared output:** 128 features',24:'**245,760** transitions / config / seed · **4** parallel environments\n\nSeeds **11 · 22 · 33**\n\n**PPO:** minibatch 256 · 4 epochs · clip 0.2',28:'Seeds **11 · 22 · 33** · Validation **100 days** · Test **200 days / condition**\n\nSame scenarios → Same evaluation → Fair comparison',29:'Lower Total Cost ≠ best on every service metric.',30:'**Mean Wait:** 7.42 → **5.57 min**\n\n**P95 Wait:** 14.88 → **11.28 min**\n\n**Completion:** 100%',31:'**Best Total Cost ≠ Best Every Service Metric**',32:'**Mean Wait:** 5.70 min · **P95 Wait:** 11.79 min\n\n**Cost reduction:** 17.8% vs Fixed · 19.0% vs Proportional · 20.8% vs Threshold',33:'MLP10 wins Normal + Traffic; Belief wins Burst.',34:'Removing components generally increases cost.',35:'RL beats rule-based baselines on Total Cost across Normal, Burst and Traffic.\n\nBurst exposes the trade-off between overall objective and service quality.\n\nREASSIGN, SHORT_TURN and Fairness contribute differently.',37:'**Problem:** fluctuating demand + limited fleet\n\n**Method:** MaskablePPO + state-dependent action mask\n\n**Result:** lower Total Cost across all tested conditions\n\n**Caution:** extreme demand exposes a cost–service trade-off'};
   content=s.repoFigure==='ablation-deltas'?s.content:overrides[n];
 }
 const opening=`<div class="opening-layout"><div class="opening-copy"><h1>When Bus Demand Exceeds Capacity</h1><div class="peak"><strong>06:00–07:30</strong><span>peak period</span></div><div class="opening-numbers"><strong>13 × 80</strong><span>seat buses reallocated<br>Routes 8 · 53 · 99 · 170</span></div><p class="question">Can existing buses be proactively reallocated as demand changes?</p><button class="primary" id="begin">Explore the study →</button></div><figure><img src="assets/bus-crowd-user.png" alt="Students waiting beside green buses at VNU-HCM"></figure></div>`;
 if(n===3)content='**3 routes** A · B · C &nbsp; / &nbsp; **6 stops** per route &nbsp; / &nbsp; **2 directions**\n\n**12 buses** · 3 reserve · Capacity **40** · Comfort threshold **30**\n\n$S_0 \\rightarrow S_1 \\rightarrow S_2 \\rightarrow S_3 \\rightarrow S_4 \\rightarrow S_5$';
 if(n===12)content=String.raw`$$\begin{aligned}c_k={}&w_1W_k+w_2V_k+w_3O_k\\&+w_4C_k+w_5C_{D,k}+w_6X_k\\&+w_7U_k+w_8E_k+w_9M_k\end{aligned}$$

$$r_k=-\frac{c_k+\text{terminal penalty}}{N_{\mathrm{ref}}}$$

**Weights:** $w_1,\ldots,w_9$ balance the cost terms.

$N_{\mathrm{ref}}$: reward normalization.

**Takeaway:** Higher reward = lower system cost.`;
 if(n===34)content='**Δ cost vs core (%)**\n\nNormal / Burst / Traffic\n\n**No REASSIGN:** +0.47 / +0.92 / +0.33\n\n**No SHORT_TURN:** +1.65 / +0.77 / +1.51\n\n**No Fairness:** +2.12 / +0.93* / +1.88\n\n*Burst fairness: 95% CI crosses 0 → inconclusive.';
 if(n===14)content=String.raw`$$\begin{aligned}
&\text{Environment}\\
&\quad\rightarrow(\text{Observation},\text{Action Mask})\\
&\quad\rightarrow\text{RL Agent}\rightarrow\text{Action}\\
&\quad\rightarrow\text{Simulation }(120s)\\
&\quad\rightarrow(\text{Reward},\text{Next Observation})
\end{aligned}$$

Environment defines what can happen. Next: how does the policy learn what to do?`;
 $('#stage').innerHTML=s.repoFigure?renderEvidenceSlide(s,content):s.chapter===1?renderTrainingSlide(s):n===1?opening:`<section class="slide ${[3,9,10,22,23,24,27,28,33,34,35,36,37].includes(n)?'wide':''}"><h1>${s.title}</h1><div class="slide-body"><div class="slide-copy">${markdown(content)}</div><div class="slide-visual">${visual(n)}</div></div></section>`;
 if(s.kind==='paper-references')$('#stage').innerHTML=`<section class="slide references-slide"><h1>${s.title}</h1><div class="paper-references">${s.papers.map(p=>`<figure><a class="paper-preview" href="https://arxiv.org/abs/${p.id}" target="_blank" rel="noopener noreferrer"><img src="assets/papers/${p.id}.jpg" alt="First PDF page: ${esc(p.title)}"></a><figcaption><a href="https://arxiv.org/abs/${p.id}" target="_blank" rel="noopener noreferrer">${esc(p.title)}</a><p>${esc(p.authors)} &middot; ${p.year}</p></figcaption></figure>`).join('')}</div></section>`;
 if(s.kind==='conclusion')$('#stage').innerHTML=`<section class="slide conclusion-slide"><h1>${s.title}</h1><ol class="findings-list">${s.findings.map(([title,text])=>`<li><strong>${title}</strong><p>${text}</p></li>`).join('')}</ol><p class="conclusion-limit">These findings apply to the tested synthetic simulator.</p></section>`;
 if(s.repoFigure)$('#stage').firstElementChild.insertAdjacentHTML('beforeend',repositoryReferences(s));
 $('#counter').textContent=`Slide ${s.id} of ${SLIDES.length}`;
 $('#chapter-name').textContent=chapters[s.chapter];$('#progress-fill').style.width=`${s.id/SLIDES.length*100}%`;
 $('#prev').disabled=current===0;$('#next').disabled=current===SLIDES.length-1;
 $('#notes-body').innerHTML=markdown(s.notes);
 $('#begin')?.addEventListener('click',()=>go(current+1));
 $('#mask-control')?.addEventListener('click',()=>{maskOn=!maskOn;render();});
 $('#dispatch')?.addEventListener('click',()=>{const b=$('.moving-bus');b.classList.remove('dispatched');void b.offsetWidth;b.classList.add('dispatched');$('#dispatch-status').textContent='DISPATCH → DEADHEAD → Route B · next decision at minute 62';});
 startNetworkDemo();
 $('#stage').scrollTop=0;
}
function go(n){current=Math.max(0,Math.min(SLIDES.length-1,n));history.replaceState(null,'',`#${current+1}`);render();}
$('#prev').onclick=()=>go(current-1);$('#next').onclick=()=>go(current+1);
document.querySelectorAll('[data-chapter]').forEach(b=>b.onclick=()=>go(SLIDES.findIndex(s=>s.chapter===+b.dataset.chapter)));
function toggleNotes(){ $('#notes').hidden=!$('#notes').hidden;$('#notes-toggle').setAttribute('aria-expanded',!$('#notes').hidden); }
$('#notes-toggle').onclick=toggleNotes;$('#notes-close').onclick=toggleNotes;
async function fullscreen(){
 if(document.fullscreenElement){await document.exitFullscreen();return;}
 if(document.body.classList.contains('presenting')){document.body.classList.remove('presenting');return;}
 if(document.documentElement.requestFullscreen){
  try {await document.documentElement.requestFullscreen();}catch {document.body.classList.add('presenting');}
 } else document.body.classList.add('presenting');
}
document.addEventListener('fullscreenchange',()=>{
 document.body.classList.toggle('presenting',!!document.fullscreenElement);
});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&!document.fullscreenElement)document.body.classList.remove('presenting');
});
$('#fullscreen').onclick=fullscreen;
const sourceButton=document.createElement('button');sourceButton.id='sources-toggle';sourceButton.textContent='Sources';sourceButton.onclick=showSources;$('.actions').prepend(sourceButton);
$('#slide-list').innerHTML=SLIDES.map(s=>`<button data-slide="${s.id-1}"><span>${s.id}</span>${s.title}</button>`).join('');
$('#overview').onclick=()=>$('#overview-dialog').showModal();$('#overview-close').onclick=()=>$('#overview-dialog').close();
$('#slide-list').onclick=e=>{let b=e.target.closest('[data-slide]');if(b){go(+b.dataset.slide);$('#overview-dialog').close();}};
document.addEventListener('keydown',e=>{if(e.target.closest('button,input,textarea')&&e.key===' ')return;if(document.querySelector('dialog[open]'))return;const k=e.key.toLowerCase();if(['arrowright','pagedown',' '].includes(k)){e.preventDefault();go(current+1);}if(['arrowleft','pageup'].includes(k)){e.preventDefault();go(current-1);}if(k==='home')go(0);if(k==='end')go(SLIDES.length-1);if(k==='n')toggleNotes();if(k==='g')$('#overview-dialog').showModal();if(k==='f')fullscreen();if(k==='escape')$('#notes').hidden=true;});
let touchX;$('#stage').addEventListener('touchstart',e=>touchX=e.changedTouches[0].clientX,{passive:true});$('#stage').addEventListener('touchend',e=>{let dx=e.changedTouches[0].clientX-touchX;if(Math.abs(dx)>75)go(current+(dx<0?1:-1));},{passive:true});
window.addEventListener('hashchange',()=>go((parseInt(location.hash.slice(1))||1)-1));
render();

