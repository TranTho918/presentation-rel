"""Copy report figures verbatim and attach traceable repository references."""
import base64
import hashlib
import json
import re
import shutil
from pathlib import Path

root = Path(__file__).resolve().parent
repo = root.parent
assets = root / 'assets/results'
assets.mkdir(parents=True, exist_ok=True)
html = (repo / 'runs/standard-v1/report.html').read_text(encoding='utf-8')
names = ['encoder-summary', 'normal', 'burst', 'traffic', 'algorithms-normal', 'algorithms-burst', 'algorithms-traffic']
images = re.findall(r'<img[^>]+src="data:image/png;base64,([^"]+)"', html)
assert len(images) == len(names), 'Review changed report image ordering before importing'
manifest = []
for name, encoded in zip(names, images):
    data = base64.b64decode(encoded)
    (assets / f'{name}.png').write_bytes(data)
    manifest.append(dict(file=f'assets/results/{name}.png', source='runs/standard-v1/report.html', sha256=hashlib.sha256(data).hexdigest()))
for name in ['held_out_costs', 'service_tradeoffs', 'validation_curves']:
    source = repo / f'reports/figures/{name}.png'
    shutil.copyfile(source, assets / f'{name}.png')
    manifest.append(dict(file=f'assets/results/{name}.png', source=str(source.relative_to(repo)).replace('\\','/'), sha256=hashlib.sha256(source.read_bytes()).hexdigest()))
(root / 'content/repo-figures.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
print(f'Imported {len(manifest)} original repository figures')
