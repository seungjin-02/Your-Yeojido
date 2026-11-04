// The Australian atlas ships a frozen, attributed LGA snapshot.
// Preparing it means verifying all bundled relationships; do not download Korea data.
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const read=async path=>JSON.parse(await readFile(new URL(path,root),'utf8'));
const [regions,geo,guides]=await Promise.all([read('public/data/regions.json'),read('public/data/regions.geojson'),read('src/data/travel-guides.json')]);
const ids=new Set(regions.map(r=>r.id));
if(ids.size!==565||geo.features.length!==ids.size)throw Error('The 2011 LGA snapshot must contain 565 unique areas.');
const featureIds=new Set();
for(const f of geo.features){if(!ids.has(f.id)||featureIds.has(f.id)||!f.geometry)throw Error(`Invalid boundary: ${f.id}`);featureIds.add(f.id)}
const places=Object.values(guides).flatMap(g=>g.places);
if(new Set(places.map(p=>p.id)).size!==50)throw Error('Expected 50 unique starter places.');
for(const p of places)if(!ids.has(p.regionId))throw Error(`Unlinked place: ${p.id}`);
console.log(`Verified ${ids.size} LGA boundaries, ${Object.keys(guides).length} state/territory guides and ${places.length} places. No network download or file rewrite needed.`);
