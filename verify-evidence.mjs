import { Browser, sleep } from 'file:///C:/Users/MTho/.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
const dir=resolve('.taste-skill/repo-evidence');mkdirSync(dir,{recursive:true});
const figures=JSON.parse(readFileSync('presentation_site/content/repo-figures.json','utf8'));
for(const f of figures){const data=readFileSync(resolve('presentation_site',f.file));if(createHash('sha256').update(data).digest('hex')!==f.sha256)throw Error('Figure checksum mismatch');}
const browser=await Browser.launch();
try{
 for(const width of [1440,390]){
  const page=await browser.newPage({width,height:900});
  await page.goto(pathToFileURL(resolve('presentation_site/index.html')).href,{settleMs:500});
  const sources=await page.eval('SLIDES.flatMap(s=>s.references||[])');
  for(const file of sources)if(!existsSync(file))throw Error('Missing source: '+file);
  for(const slide of [32,33,34,36,37]){
   await page.eval(`go(${slide-1})`);await sleep(500);
   if(!await page.eval("[...document.querySelectorAll('#stage img')].every(i=>i.complete&&i.naturalWidth>0)"))throw Error('Missing result image');
   await page.screenshot({path:resolve(dir,`${width}-${slide}.jpg`)});
  }
  await page.eval("go(36);document.querySelector('.figure-open').click()");await sleep(200);
  if(!await page.eval("document.querySelector('#figure-dialog').open&&document.querySelector('#figure-image').naturalWidth>0"))throw Error('Figure viewer failed');
  await page.screenshot({path:resolve(dir,`${width}-enlarged.jpg`)});
  await page.eval("document.querySelector('#figure-dialog').close();go(16);document.querySelector('#sources-toggle').click()");await sleep(200);
  if(!await page.eval("document.querySelector('#sources-dialog').open&&document.querySelector('#sources-content').textContent.includes('algorithms.py')"))throw Error('Algorithm sources failed');
  await page.send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight'});
  if(!await page.eval('current===16'))throw Error('Modal allowed background navigation');
  await page.screenshot({path:resolve(dir,`${width}-sources.jpg`)});
  if(page.consoleErrors.length)throw Error(page.consoleErrors.join('\n'));
  await page.close();
 }
 console.log('10 figure hashes, all reference paths, 14 result renders, enlargement and source dialogs passed.');
}finally{await browser.close();}
