import { Browser, sleep } from 'file:///C:/Users/MTho/.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const out=resolve('.taste-skill/formula-fixes');mkdirSync(out,{recursive:true});
const browser=await Browser.launch();const results=[];
try {
 for(const width of [1440,1280,768,390]) {
  const page=await browser.newPage({width,height:width>=1000?900:width===768?1024:844});
  await page.goto(pathToFileURL(resolve('presentation_site/index.html')).href,{settleMs:500});
  for(const slide of [12,14]) {
   await page.eval(`go(${slide-1})`);await sleep(400);
   const result=await page.eval(()=>({
    mathErrors:document.querySelectorAll('#stage .katex-error').length,
    scrollingEquations:[...document.querySelectorAll('#stage .katex-display')].filter(e=>e.scrollWidth>e.clientWidth+1).length,
    overflowingNodes:[...document.querySelectorAll('.interaction-loop li')].filter(e=>{const range=document.createRange();range.selectNodeContents(e);const text=range.getBoundingClientRect(),box=e.getBoundingClientRect();return text.left<box.left||text.right>box.right;}).length,
    stageOverflow:document.querySelector('#stage').scrollWidth>document.querySelector('#stage').clientWidth+1,
    stageScroll:document.querySelector('#stage').scrollHeight>document.querySelector('#stage').clientHeight+1
   }));results.push({width,slide,...result});
   await page.screenshot({path:resolve(out,`${width}-${slide}.jpg`)});
  }
  await page.send('Runtime.evaluate',{expression:"document.querySelector('#fullscreen').click()",userGesture:true});await sleep(500);
  const presenting=await page.eval(()=>({fullscreen:!!document.fullscreenElement,presentHidden:getComputedStyle(document.querySelector('#fullscreen')).display==='none',controlsHidden:getComputedStyle(document.querySelector('.controls')).display==='none'}));
  if(!presenting.fullscreen||!presenting.presentHidden||!presenting.controlsHidden)throw Error('Presentation chrome did not hide: '+JSON.stringify(presenting));
  await page.send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight'});
  if(!await page.eval("document.querySelector('#counter').textContent==='Slide 15 of 42'"))throw Error('Keyboard navigation in presentation failed');
  await sleep(400);
  await page.screenshot({path:resolve(out,`${width}-present.jpg`)});
  await page.eval('document.exitFullscreen()');await sleep(100);
  if(!await page.eval("!document.body.classList.contains('presenting') && getComputedStyle(document.querySelector('#fullscreen')).display!=='none' && getComputedStyle(document.querySelector('.controls')).display!=='none'"))throw Error('Presentation chrome did not restore');
  if(page.consoleErrors.length)throw Error(page.consoleErrors.join('\n'));
  await page.close();
 }
}finally{writeFileSync(resolve(out,'verification.json'),JSON.stringify(results,null,2));await browser.close();}
console.log(JSON.stringify(results));
if(results.some(r=>r.mathErrors||r.scrollingEquations||r.overflowingNodes||r.stageOverflow||(r.width>=1000&&r.stageScroll)))process.exitCode=1;

