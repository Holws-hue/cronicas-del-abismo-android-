'use strict';
const assert=require('node:assert/strict');
const {Game,createMap,walkable,BIOMES}=require('../app/src/main/assets/www/solo-engine.js');
const mem=new Map();const store={getItem:k=>mem.get(k)||null,setItem:(k,v)=>mem.set(k,v)};
const g=new Game(store);
assert.equal(g.load(),false);
const h=g.create('Valdrin','Guerrero',{cloth:'#ae4738',hair:'#9c6c49'});
assert.equal(h.name,'Valdrin');assert.equal(h.inventory.length,30);assert.equal(h.stash.length,48);
assert.equal(h.equipment.weapon.kind,'weapon');assert.equal(g.status,'lobby');
for(let floor=1;floor<=25;floor++){
 const w=createMap(123456,floor);
 assert.equal(w.boss,floor%10===0);assert.equal(w.enemies.some(x=>x.kind==='boss'),floor%10===0);
 assert.equal(w.grid.length,27);assert.ok(w.exit.x>0);
 assert.ok(walkable(w,1.5,1.5));assert.ok(walkable(w,w.exit.x,w.exit.y));
 let queue=[[1,1]],seen=new Set(['1,1']);for(let n=0;n<queue.length;n++){let [x,y]=queue[n];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy,k=xx+','+yy;if(xx>0&&yy>0&&xx<26&&yy<26&&!w.grid[yy][xx]&&!seen.has(k)){seen.add(k);queue.push([xx,yy]);}}}
 assert.ok(seen.has(Math.floor(w.exit.x)+','+Math.floor(w.exit.y)),'salida inalcanzable en piso '+floor);
}
assert.ok(g.stash('bag',0));assert.equal(h.stash.filter(Boolean).length,1);assert.equal(h.inventory[0],null);
assert.ok(g.enter());assert.equal(g.status,'dungeon');
g.camera.x=g.world.exit.x;g.camera.y=g.world.exit.y;
assert.equal(g.interact(),'door');assert.ok(g.extract());
assert.equal(g.status,'lobby');assert.equal(h.checkpoint,2);
assert.ok(g.stash('stash',0));assert.equal(h.inventory.filter(Boolean).length,3);
g.save();const next=new Game(store);assert.equal(next.load(),true);assert.equal(next.profile.checkpoint,2);
assert.ok(next.enter());
const i=next.profile.inventory.findIndex(Boolean);assert.ok(i>=0);
next.profile.coins=500;next.die();assert.equal(next.profile.coins,0);assert.equal(next.profile.inventory.filter(Boolean).length,0);
assert.ok(Object.values(next.profile.equipment).every(v=>!v));
assert.ok(next.respawn());assert.equal(next.status,'lobby');
const testSafe=new Game(store);assert.ok(testSafe.load());assert.equal(testSafe.profile.checkpoint,2);
assert.equal(testSafe.profile.inventory.filter(Boolean).length,0);
console.log('OK: 25 mapas, puertas accesibles, jefe cada 10 pisos, mochila y baúl, extracción, muerte y guardado offline.');
