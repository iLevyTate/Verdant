import http from 'node:http';
import {createReadStream,existsSync,statSync} from 'node:fs';
import path from 'node:path';
const project=process.cwd(),root=existsSync(path.join(project,'dist/index.html'))?path.join(project,'dist'):project;
const port=Number(process.env.PORT)||8080;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.env':'application/octet-stream','.md':'text/plain; charset=utf-8'};
http.createServer((req,res)=>{let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end('Bad request');return;}const file=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));if(!file.startsWith(root+path.sep)||!existsSync(file)||!statSync(file).isFile()){res.writeHead(404).end('Not found');return;}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});createReadStream(file).pipe(res);}).listen(port,()=>process.stdout.write('Verdant is ready at http://localhost:'+port+'\n'));
