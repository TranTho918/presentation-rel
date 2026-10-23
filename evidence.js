const evidenceFigure = (name, caption) => `<figure class="repo-figure"><button class="figure-open" data-figure="assets/results/${name}.${name==='ablation-deltas'?'svg':'png'}" data-caption="${caption}" aria-label="Enlarge ${caption}"><img src="assets/results/${name}.${name==='ablation-deltas'?'svg':'png'}" alt="${caption}"></button><figcaption>${caption} · click to enlarge</figcaption></figure>`;
function renderEvidenceSlide(s, content=s.content) {
 const ablation=s.repoFigure==='ablation-deltas';
 return `<section class="slide evidence-slide ${ablation?'ablation-slide':''}"><h1>${s.title}</h1><div class="evidence-body"><div class="slide-copy">${markdown(content)}${ablation?'<p>Fairness changes the reward; it does not remove an available action.</p>':''}</div><div class="evidence-media">${evidenceFigure(s.repoFigure,ablation?'Total Cost: zoomed bar tops · absolute mean costs; truncated axes':'Repository result · mean operational cost and mean daily P95 wait')}${ablation?'<button class="secondary-figure" data-figure="assets/results/service_tradeoffs.png" data-caption="Ablations: cost and P95 service trade-offs">View service trade-offs ↗</button>':''}</div></div></section>`;
}
function repositoryReferences(s) {
 const files = s.references || [];
 return `<div class="source-links">Source: ${files.slice(0,2).map(f=>`<a href="../${f}" target="_blank" rel="noreferrer">${f}</a>`).join(' · ')}</div>`;
}
function showSources(){
 const s=SLIDES[current];
 document.querySelector('#sources-content').innerHTML=`<h2>Sources for slide ${s.id}</h2><p>${s.title}</p><ul>${(s.references||[]).map(f=>`<li><a href="../${f}" target="_blank" rel="noreferrer">${f} ↗</a></li>`).join('')}</ul><p>Original encoder snapshot and the retrained algorithm/mask extension use distinct validation protocols.</p>${evidenceFigure('validation_curves','Frozen core ablation study · validation curves')}${evidenceFigure('encoder-summary','Original three-encoder study · summary')}`;
 document.querySelector('#sources-dialog').showModal();
}
document.addEventListener('click', e=>{
 const button=e.target.closest('[data-figure]');if(!button)return;
 const dialog=document.querySelector('#figure-dialog');
 document.querySelector('#figure-image').src=button.dataset.figure;
 document.querySelector('#figure-image').alt=button.dataset.caption;
 document.querySelector('#figure-caption').textContent=button.dataset.caption;
 dialog.showModal();
});
