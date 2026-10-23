"""Extract presentation content without exposing implementation notes on slides."""
import json
import re
from pathlib import Path

root = Path(__file__).resolve().parent
source = (root.parent / 'bus_rl_presentation_slide_spec.md').read_text(encoding='utf-8')
slides = []
for match in re.finditer(r'## Slide (\d+) --- (.*?)\n(.*?)(?=\n## Slide |\n# TAB |\n# GLOBAL |\Z)', source, re.S):
    number, label, body = match.groups()
    content = body.split('### ON-SLIDE CONTENT')[1].split('### VISUAL')[0].strip()
    title = re.search(r'\*\*Title:\*\* (.*)', content).group(1)
    content = re.sub(r'\*\*Title:\*\* .*?\n', '', content, count=1).strip()
    notes = body.split('### SPEAKER / IMPLEMENTATION NOTES')[-1].strip().split('------------------------------------------------------------------------')[0].strip()
    slides.append(dict(id=int(number), visualId=int(number), title=title, label=label, content=content, notes=notes, chapter=0 if int(number)<15 else 1 if int(number)<28 else 2))
part2 = json.loads((root / 'content/part2.json').read_text(encoding='utf-8'))
part2_source = (root / 'content/part2_source.md').read_text(encoding='utf-8')
sections = list(re.finditer(r'^## (\d+)\. (.*?)\n(.*?)(?=^## \d+\. |\Z)', part2_source, re.M | re.S))
assert len(part2) == len(sections) == 15, 'Part 2 must match the source’s 15 sections'
for index, slide in enumerate(part2):
    slide.update(chapter=1, sourceSection=index + 1, label=sections[index].group(2), notes=sections[index].group(3).strip())
slides = slides[:14] + part2 + slides[27:]
report = 'runs/standard-v1/report.html'
algorithm_file = 'src/bus_rl/learning/training/algorithms.py'
for slide in slides:
    if slide['chapter'] == 1:
        slide['references'] = [algorithm_file, 'src/bus_rl/learning/policy.py', report]
        if slide['sourceSection'] == 3:
            slide['takeaway'] = 'The original encoder study used PPO. The repository extension also evaluates REINFORCE: Monte Carlo returns, no learned baseline or critic.'
            slide['notes'] = 'REPOSITORY UPDATE: REINFORCE is now an implemented experimental comparator in the algorithm/mask extension; the older source below describes the original encoder snapshot only.\n\n' + slide['notes']
        if slide['sourceSection'] == 6:
            slide['takeaway'] = 'The repository implements REINFORCE, synchronous A2C and PPO, then compares each with mask apply/free using GRU10.'
            slide['notes'] = 'REPOSITORY UPDATE: A2C is now an implemented experimental comparator in the algorithm/mask extension; the older source below describes the original encoder snapshot only.\n\n' + slide['notes']
        if slide['sourceSection'] in [13, 14, 15]:
            slide['notes'] = 'REPOSITORY UPDATE: The original encoder snapshot validates during collection; the algorithm/mask extension validates after updates at rollout boundaries, including final weights. Do not mix these protocols.\n\n' + slide['notes']
            slide['references'].append('src/bus_rl/learning/training/callbacks.py')
    elif slide['chapter'] == 2:
        slide['references'] = [report, 'reports/README.md']
    else:
        slide['references'] = ['docs/spec/spec_v1.0.md', 'configs/base.toml']
    if slide.get('visualId') in [30, 31, 32]:
        slide['repoFigure'] = {30:'normal',31:'burst',32:'traffic'}[slide['visualId']]
    if slide.get('visualId') == 34:
        slide['repoFigure'] = 'held_out_costs'
        slide['references'] = ['reports/figures/held_out_costs.png','reports/figures/service_tradeoffs.png','reports/tables/ablations.csv']

extension=[]
for title, figure, content in [
    ('Algorithm Comparison: Normal Demand','algorithms-normal','**Same GRU10 encoder · mask apply/free · 3 seeds.**\n\nWith masking, PPO cost is **13,172.7**, REINFORCE **13,870.1**, A2C **14,152.6**.\n\nPPO reduces cost by **12.24%** vs its free control. Invalid requests in free mode execute NOOP.'),
    ('Algorithm Comparison: Demand Burst','algorithms-burst','**Same training budget: 245,760 transitions / arm / seed.**\n\nPPO apply cost **25,209.4**, versus **29,983.1** for PPO free.\n\nMasking reduces PPO cost by **15.92% [15.04, 16.84]**. The paired-day CI does not include training-seed uncertainty.'),
    ('Algorithm Comparison: Traffic Disruption','algorithms-traffic','**Separate extension: 3 algorithms × 2 mask modes × 3 seeds = 18 runs.**\n\nPPO apply cost **13,508.8**; free **15,458.9**. Masking reduces cost by **12.62%**.\n\nWith masking, PPO has lower mean cost than REINFORCE and A2C in all three tested conditions.')
]:
    extension.append(dict(title=title,label=title,chapter=2,kind='evidence',repoFigure=figure,content=content,notes='Source: runs/standard-v1/report.md, Algorithm Comparison & Mask A/B. These are retrained GRU10 algorithm/mask arms, not the original three-encoder snapshot. Validation is post-update. The same transitions budget does not imply equal optimizer steps: REINFORCE uses 240 steps/env and one full-rollout update; A2C uses 256 and one update; PPO uses 256 and 16 optimizer steps per rollout.',references=[report,algorithm_file,'runs/standard-v1/evidence/extensions/masking/protocol.json']))
slides = slides[:35] + extension + slides[35:]
# Consolidate mask evidence; keep the normal-condition figure and all-case findings.
mask = slides[35]
mask['title'] = mask['label'] = 'Ablation Study 2: Mask vs No Mask'
mask['content'] = "**Same GRU10 encoder / 3 algorithms / 3 seeds.**\n\nNormal: PPO mask **13,172.7**, REINFORCE **13,870.1**, A2C **14,152.6**.\n\n**Consistent across all tested cases:** PPO masking reduces cost by **12.24% Normal / 15.92% Burst / 12.62% Traffic**.\n\n**Conclusion:** masking improves PPO in every tested case; masked PPO has the lowest mean cost among the three algorithms."
mask['notes'] += '\n\nAll-case evidence consolidated from former slides 37-38. PPO Burst: apply 25,209.4 vs free 29,983.1; reduction 15.92% [15.04,16.84]. PPO Traffic: apply 13,508.8 vs free 15,458.9; reduction 12.62%. Burst paired-day CI excludes training-seed uncertainty. Invalid free-mode requests execute NOOP.'
slides = slides[:36] + slides[38:]
for slide in slides:
    v = slide.get('visualId')
    if v in [30,31,32,33]:
        detail = {30:'Normal',31:'Demand Burst',32:'Traffic',33:'Summary'}[v]
        slide['title'] = slide['label'] = 'Ablation Study 1: Encoder / ' + detail
    if v == 34:
        slide['title'] = slide['label'] = 'Ablation Study 3: Available Action'
        slide['repoFigure'] = 'ablation-deltas'
        slide['content'] = '**Total Cost: lower is better.**\n\nZooming into the bar tops makes small differences visible. Each case has its own cost range.\n\nRemoving REASSIGN or SHORT_TURN raises mean cost in all three cases.'
        slide['references'] = ['reports/tables/held_out_per_seed.csv', 'reports/tables/ablations.csv', 'presentation_site/draw_ablation.py']
slides = slides[:37]
slides.append(dict(title='What Did We Learn?', label='Conclusion', chapter=2, kind='conclusion', content='', findings=[
    ['RL lowers overall cost', 'The best RL model has lower Total Cost than the rule-based baselines in all three tested conditions.'],
    ['No encoder wins every case', 'MLP10 has the lowest mean cost in Normal and Traffic; Belief20-fade is best in Burst.'],
    ['Action masking helps PPO consistently', 'PPO cost falls by 12.24% in Normal, 15.92% in Burst and 12.62% in Traffic compared with no mask.'],
    ['Both control actions contribute', 'Removing REASSIGN or SHORT_TURN raises mean cost in every tested case.'],
    ['Lower cost does not guarantee better service', 'Under extreme demand, the lowest-cost model does not have the best waiting time or completion rate.']
], notes='Evidence is limited to the synthetic simulator. Encoder rankings describe mean cost, not proven statistical superiority. Algorithm/mask results use a separate retrained GRU10 extension. Burst fairness remains inconclusive.', references=[report, 'reports/tables/ablations.csv']))

slides = [slide for slide in slides if slide.get('visualId') != 13]
for index, slide in enumerate(slides):
    slide['id'] = index + 1
(root / 'slides.js').write_text('window.SLIDES = '+json.dumps(slides, ensure_ascii=False)+';\n', encoding='utf-8')
print(f'Extracted {len(slides)} slides')
