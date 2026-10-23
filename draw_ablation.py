"""Absolute Total Cost with zoomed bar tops, from per-seed CSV."""
import csv
from pathlib import Path
ROOT=Path(__file__).resolve().parent
rows=list(csv.DictReader((ROOT.parent/'reports/tables/held_out_per_seed.csv').open()))
svg=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1140 620"><rect width="1140" height="620" fill="white"/><g font-family="Arial" fill="#172c37"><text x="25" y="40" font-size="29" font-weight="700">Total Cost: zoomed bar tops</text><text x="25" y="77" font-size="21">Lower is better. Each panel has its own zoomed axis; axes do not start at zero.</text>']
arms=[('core','Core','#126d80'),('no_reassign','No reassign','#718392'),('no_short','No short-turn','#718392'),('fairness_zero','No fairness','#c45b24')]
for col,(split,title) in enumerate([('test_id','Normal'),('test_ood_burst','Demand Burst'),('test_ood_traffic','Traffic')]):
 left=col*375+25
 means=[sum(float(r['mean_cost']) for r in rows if r['split']==split and r['arm']==arm)/3 for arm,_,_ in arms]
 low=int(min(means)//100)*100-100
 high=(int(max(means)//100)+2)*100
 y=lambda v:425-(v-low)/(high-low)*245
 svg.append(f'<text x="{left}" y="125" font-size="27" font-weight="700">{title}</text>')
 for value in [low,(low+high)/2,high]:
  yy=y(value)
  svg.append(f'<text x="{left+48}" y="{yy+5:.1f}" text-anchor="end" font-size="15">{value:,.0f}</text><path d="M{left+55} {yy:.1f}H{left+340}" stroke="#dbe2e5"/>')
 for i,((arm,label,color),mean) in enumerate(zip(arms,means)):
  x=left+65+i*72; yy=y(mean)
  svg.append(f'<rect x="{x}" y="{yy:.2f}" width="49" height="{425-yy:.2f}" fill="{color}"/><text x="{x+24}" y="{yy-11:.2f}" text-anchor="middle" font-size="18" font-weight="700">{mean:,.1f}</text><text x="{x+24}" y="450" text-anchor="middle" font-size="14">{label.split()[0]}</text><text x="{x+24}" y="470" text-anchor="middle" font-size="14">{" ".join(label.split()[1:])}</text>')
 svg.append(f'<path d="M{left+53} 433l8 -7m-8 16l8 -7" stroke="#172c37" stroke-width="2"/><text x="{left+55}" y="520" font-size="17">Zoom: {low:,} to {high:,}</text>')
svg+=['<text x="25" y="560" font-size="20">Core = all components enabled. No fairness changes the reward, not the action set.</text><text x="25" y="590" font-size="18">Burst / no Fairness: inconclusive difference (95% CI includes zero). Mean over 3 seeds.</text><text x="25" y="614" font-size="15">Source: reports/tables/held_out_per_seed.csv. Truncated axes highlight the bar tops.</text></g></svg>']
(ROOT/'assets/results/ablation-deltas.svg').write_text('\n'.join(svg),encoding='utf-8')
