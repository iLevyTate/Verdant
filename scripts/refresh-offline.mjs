import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
const root=existsSync('dist/index.html')?'dist':'.',file=path.join(root,'sw.js'),source=readFileSync(file,'utf8');
const list=source.match(/const FILES=(\[[^;]+\]);/);if(!list)throw Error('Missing offline asset manifest');
const files=[...list[1].matchAll(/'([^']+)'/g)].map(m=>m[1]),hash=createHash('sha256');
for(const asset of files){hash.update(asset+'\0');hash.update(readFileSync(path.join(root,asset.split('?')[0])));hash.update('\0');}
const version='release-'+hash.digest('hex').slice(0,16),next=source.replace(/const CACHE=PREFIX\+'[^']+';/,"const CACHE=PREFIX+'"+version+"';");
if(next===source){console.log('Offline release matches all game assets: '+version);}
else if(process.argv.includes('--check')){console.error('Offline release is stale. Run npm run release:cache before committing.');process.exitCode=1;}
else{writeFileSync(file,next);console.log('Prepared offline release: '+version);}
