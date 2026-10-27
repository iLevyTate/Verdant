import {existsSync,mkdirSync,cpSync,writeFileSync} from 'node:fs';
import path from 'node:path';
const project=process.cwd(),source=existsSync(path.join(project,'dist/index.html'))?path.join(project,'dist'):project;
const output=path.join(project,'_site');mkdirSync(output,{recursive:true});
for(const name of['index.html','style.css','enhancements.css','mobile.css','core.js','graphics.js','creatures.js','world.js','game.js','pwa.js','sw.js','manifest.webmanifest','assets','vendor'])cpSync(path.join(source,name),path.join(output,name),{recursive:true});
writeFileSync(path.join(output,'.nojekyll'),'');
console.log('Static Pages artifact prepared in _site/. No Jekyll or compilation.');
