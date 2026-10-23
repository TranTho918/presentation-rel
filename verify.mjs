import { Browser, sleep } from 'file:///C:/Users/MTho/.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { mkdirSync,writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const out=resolve('.taste-skill/academic-slides');mkdirSync(out,{recursive:true});
const browser=await Browser.launch();
const report=[];
try {
 for(const width of [1440,768,390]) {
  const page=await browser.newPage({width,height:width===1440?900:width===768?1024:844});
  await page.goto(pathToFileURL(resolve('presentation_site/index.html')).href,{settleMs:600});
  const total=await page.eval('SLIDES.length');
  if(!await page.eval('SLIDES.length===37 && SLIDES.filter(s=>s.chapter===1).length===15 && SLIDES[28].chapter===2'))throw Error('Chapter structure failed');
  for(let n=0;n<total;n++) {
   await page.eval(`go(${n})`);await sleep(600);
   const check=await page.eval(()=>({title:document.querySelector('h1')?.textContent,mathErrors:[...document.querySelectorAll('#stage .katex-error')].map(x=>x.textContent),horizontal:document.querySelector('#stage').scrollWidth>document.querySelector('#stage').clientWidth+2,scroll:document.querySelector('#stage').scrollHeight>document.querySelector('#stage').clientHeight+2,notesVisible:!document.querySelector('#notes').hidden,rawMath:/MATHPLACEHOLDER|\$\$/.test(document.querySelector('#stage').textContent)}));
   report.push({width,slide:n+1,...check});
   await page.screenshot({path:resolve(out,`${width}-${n+1}.jpg`),quality:65});
  }
  await page.eval('go(10)');await page.eval("document.querySelector('#mask-control').click()");
  if(!await page.eval("!document.querySelector('.action-grid').classList.contains('masked')")) throw Error('Mask toggle failed');
  await page.eval("document.querySelector('#notes-toggle').click()");
  if(!await page.eval("!document.querySelector('#notes').hidden")) throw Error('Notes toggle failed');
  await page.eval("document.querySelector('#notes-close').click();document.querySelector('#overview').click();document.querySelectorAll('#slide-list [data-slide]')[32].click()");
  if(!await page.eval("document.querySelector('#counter').textContent==='Slide 33 of 37' && !document.querySelector('#overview-dialog').open")) throw Error('Overview navigation failed');
  await page.send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight'});
  if(!await page.eval("document.querySelector('#counter').textContent==='Slide 34 of 37'")) throw Error('Keyboard failed');
  await page.eval("document.querySelector('[data-chapter=\"1\"]').click()");
  if(!await page.eval("document.querySelector('#counter').textContent==='Slide 14 of 37'")) throw Error('Chapter navigation failed');
  await page.eval("document.querySelector('[data-chapter=\"2\"]').click()");
  if(!await page.eval("document.querySelector('#counter').textContent==='Slide 29 of 37'"))throw Error('Results chapter navigation failed');
  await page.send('Input.dispatchKeyEvent',{type:'keyDown',key:'End',code:'End'});
  if(!await page.eval("document.querySelector('#next').disabled && document.querySelector('#counter').textContent==='Slide 37 of 37'"))throw Error('Last-slide boundary failed');

  console.log(JSON.stringify({width,errors:page.consoleErrors}));await page.close();
 }
} finally {writeFileSync(resolve(out,'verification.json'),JSON.stringify(report,null,2));await browser.close();}
const issues=report.filter(r=>r.mathErrors.length||r.horizontal||r.rawMath||r.notesVisible);
console.log(JSON.stringify({slidesChecked:report.length,issues,desktopScroll:report.filter(r=>r.width===1440&&r.scroll).map(r=>r.slide)}));
if(issues.length)process.exitCode=1;


