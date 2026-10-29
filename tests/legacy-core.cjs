// Archive compatibility and dormant movement stay testable without enabling UI wildlife.
const fs=require('node:fs'),copy={exports:{}};
Function('module',fs.readFileSync(require.resolve('../core.js'),'utf8').replace('const WILDLIFE_ENABLED=false','const WILDLIFE_ENABLED=true'))(copy);
module.exports=copy.exports;
