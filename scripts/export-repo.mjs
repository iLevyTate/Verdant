import {existsSync,mkdirSync,cpSync,readFileSync,writeFileSync} from 'node:fs';
import path from 'node:path';
const project=process.cwd(),destination=path.resolve(process.argv[2]||path.join(project,'.standalone/verdant-terrarium'));
const source=existsSync(path.join(project,'dist/index.html'))?path.join(project,'dist'):project;
if(destination===project||destination===source)throw Error('Choose a separate export directory.');
mkdirSync(destination,{recursive:true});
for(const name of['index.html','style.css','enhancements.css','mobile.css','desktop.css','workspace.css','core.js','saves.js','workspace.js','graphics.js','dynamics.js','botany.js','creatures.js','world.js','game.js','pwa.js','sw.js','manifest.webmanifest','assets','vendor'])cpSync(path.join(source,name),path.join(destination,name),{recursive:true});
for(const name of['scripts','tests','.github','package-lock.json','README.md','BRANDING.md','QUALITY_AUDIT.md','MOBILE_QA.md','BENCHMARK_BASELINE.md','DESKTOP_QA.md','docs','LICENSE']){if(existsSync(path.join(project,name)))cpSync(path.join(project,name),path.join(destination,name),{recursive:true});}
const pkg=JSON.parse(readFileSync(path.join(project,'package.json'),'utf8'));pkg.scripts.check=pkg.scripts.check.replaceAll('dist/','');writeFileSync(path.join(destination,'package.json'),JSON.stringify(pkg,null,2)+'\n');
writeFileSync(path.join(destination,'.nojekyll'),'');writeFileSync(path.join(destination,'.gitignore'),'node_modules/\n_site/\n.standalone/\n*.zip\n.DS_Store\n');
console.log(destination);
