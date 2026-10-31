import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
const root=existsSync('dist/index.html')?'dist':'.',file=path.join(root,'sw.js'),source=readFileSync(file,'utf8'),pwaFile=path.join(root,'pwa.js'),pwa=readFileSync(pwaFile,'utf8');
const list=source.match(/const FILES=(\[[^;]+\]);/);if(!list)throw Error('Missing offline asset manifest');
const files=[...list[1].matchAll(/'([^']+)'/g)].map(m=>m[1]),hash=createHash('sha256'),normalize=s=>s.replace(/const APP_RELEASE='[^']+';/,"const APP_RELEASE='release-pending';");
for(const asset of files){hash.update(asset+'\0');const bytes=readFileSync(path.join(root,asset.split('?')[0]));hash.update(asset.startsWith('pwa.js')?normalize(bytes.toString()):bytes);hash.update('\0');}
const version='release-'+hash.digest('hex').slice(0,16),nextPwa=pwa.replace(/const APP_RELEASE='[^']+';/,"const APP_RELEASE='"+version+"';"),hashes={};
for(const asset of files)hashes[asset]=createHash('sha256').update(asset.startsWith('pwa.js')?nextPwa:readFileSync(path.join(root,asset.split('?')[0]))).digest('hex');
const next=source.replace(/const CACHE=PREFIX\+'[^']+';/,"const CACHE=PREFIX+'"+version+"';").replace(/const HASHES=\{[^;]*\};/,'const HASHES='+JSON.stringify(hashes)+';');
if(next===source&&nextPwa===pwa)console.log('Verified offline release: '+version);else if(process.argv.includes('--check')){console.error('Run npm run release:cache before committing.');process.exitCode=1;}else{writeFileSync(file,next);writeFileSync(pwaFile,nextPwa);console.log('Prepared verified offline release: '+version);}
