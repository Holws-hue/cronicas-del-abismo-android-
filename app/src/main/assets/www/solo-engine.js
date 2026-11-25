/* Crónicas del Abismo v0.2 - motor offline original, sin dependencias. */
(function(root,factory){const lib=factory(); if(typeof module==='object'&&module.exports)module.exports=lib;else root.AbismoSolo=lib;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
'use strict';
const S=27, rint=(r,a,b)=>a+Math.floor(r()*(b-a+1)),hyp=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function random(seed){let x=seed>>>0;return ()=>{x=(x+0x6D2B79F5)>>>0;let t=x;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
const BIOMES=[
{name:'Cripta de los ecos',wall:'#77736c',floor:'#302f34',light:'#d6ad75'},
{name:'Biblioteca sumergida',wall:'#537375',floor:'#243b3d',light:'#6bd6ce'},
{name:'Galerías de brasas',wall:'#9b5343',floor:'#412b2b',light:'#fc8c53'},
{name:'Ruinas de escarcha',wall:'#8da8bd',floor:'#354d62',light:'#b6eafe'},
{name:'Raíces eternas',wall:'#607c58',floor:'#2b4035',light:'#96d481'},
{name:'Santuario nocturno',wall:'#7b6c95',floor:'#342b48',light:'#bb9aff'}];
const STORIES=[
{title:'La lámpara que esperaba',body:'Cuando el farero perdió el mar, decidió encender su lámpara debajo de la montaña. Una noche la llama se volvió azul y alguien, al otro lado del muro, tocó tres veces.'},
{title:'Las tres puertas',body:'La primera puerta pedía una moneda. La segunda, una memoria. La tercera no pedía nada. El explorador sonrió y la abrió. Ese fue su último error.'},
{title:'Diario de nieve',body:'Día 27. El frío congeló el río, pero no las sombras. Encontramos huellas humanas que descendían por la pared de un pozo. No volveremos por el mismo camino.'},
{title:'El heraldo sin rostro',body:'El viejo rey escribió su nombre sobre el hielo para no olvidarlo. Al amanecer, todas las letras eran ojos. Desde entonces los guardianes lo llaman el Sin Rostro.'},
{title:'Carta desde la mina',body:'Mi hermana dice que las vetas brillan porque esconden estrellas. Yo pienso que son los ojos de los que cavaron demasiado profundo. Esta noche traeré un martillo.'},
{title:'La promesa del décimo piso',body:'Cada décima puerta guarda un juramento. Los centinelas no protegen lo que entra: mantienen encerrado lo que desea salir. Que la luz acompañe al próximo viajero.'}
];
const CLASSES={Guerrero:{hp:130,mp:30,atk:14,def:4,weapon:'Espada del recluta'},Mago:{hp:88,mp:105,atk:9,def:1,weapon:'Bastón de centellas'},Pícaro:{hp:103,mp:60,atk:12,def:2,weapon:'Daga de viajero'}};
const ITEMS=[
{name:'Poción vital',icon:'♥',kind:'potion',heal:42,rarity:0},
{name:'Gran poción',icon:'❤',kind:'potion',heal:95,rarity:1},
{name:'Espada de hierro',icon:'⚔',kind:'weapon',atk:8,rarity:1},
{name:'Mandoble del vigilante',icon:'⚔',kind:'weapon',atk:15,rarity:2},
{name:'Daga oscura',icon:'🗡',kind:'weapon',atk:10,rarity:1},
{name:'Bastón de hielo',icon:'✦',kind:'weapon',atk:11,rarity:2},
{name:'Yelmo de bronce',icon:'⛑',kind:'head',def:3,rarity:1},
{name:'Casco legendario',icon:'♜',kind:'head',def:8,rarity:3},
{name:'Cota de malla',icon:'▣',kind:'armor',def:7,rarity:1},
{name:'Coraza de guardián',icon:'🛡',kind:'armor',def:14,rarity:3},
{name:'Botas de explorador',icon:'▤',kind:'feet',def:3,rarity:1},
{name:'Escudo antiguo',icon:'◈',kind:'offhand',def:5,rarity:2},
{name:'Anillo de ceniza',icon:'◉',kind:'ring',atk:3,rarity:2},
{name:'Medallón grabado',icon:'✺',kind:'treasure',rarity:2},
{name:'Mineral de hierro negro',icon:'◇',kind:'material',rarity:1},
{name:'Cristal de maná',icon:'✧',kind:'material',rarity:2},
{name:'Trucha de caverna',icon:'🐟',kind:'food',heal:18,rarity:1},
{name:'Hierba lunar',icon:'☘',kind:'material',rarity:1}
];
function copyItem(item){return item?{...item}:null;}
function item(idx,level=1){if(idx===ITEMS.length){const story=STORIES[Math.floor(Math.random()*STORIES.length)];return {name:story.title,body:story.body,icon:'▤',kind:'book',rarity:1,id:Math.floor(Math.random()*1e9).toString(36)};}const base=ITEMS[idx%ITEMS.length],power=Math.max(0,Math.floor((level-1)/5));return {...base,id:Math.floor(Math.random()*1e9).toString(36),atk:base.atk?base.atk+power*2:undefined,def:base.def?base.def+power:undefined};}
function createMap(seed,floor){
 const r=random((seed+floor*7919)>>>0),grid=Array.from({length:S},()=>Array(S).fill(1)),stack=[[1,1]],centers=[];
 grid[1][1]=0;
 while(stack.length){const [x,y]=stack[stack.length-1],next=[];for(const [dx,dy] of [[2,0],[-2,0],[0,2],[0,-2]]){const xx=x+dx,yy=y+dy;if(xx>0&&xx<S-1&&yy>0&&yy<S-1&&grid[yy][xx])next.push([xx,yy,dx,dy]);}if(!next.length){stack.pop();continue;}const [xx,yy,dx,dy]=next[Math.floor(r()*next.length)];grid[y+dy/2][x+dx/2]=0;grid[yy][xx]=0;stack.push([xx,yy]);}
 for(let n=0;n<10;n++){let x=2*rint(r,1,11)-1,y=2*rint(r,1,11)-1;for(let dy=0;dy<3;dy++)for(let dx=0;dx<3;dx++)grid[y+dy][x+dx]=0;}
 for(let n=0;n<20;n++){const x=rint(r,2,S-3),y=rint(r,2,S-3);if((grid[y-1][x]===0&&grid[y+1][x]===0)||(grid[y][x-1]===0&&grid[y][x+1]===0))grid[y][x]=0;}
 const q=[[1,1,0]],seen=new Set(['1,1']);for(let n=0;n<q.length;n++){const [x,y,d]=q[n];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy,k=xx+','+yy;if(yy>0&&yy<S-1&&xx>0&&xx<S-1&&!grid[yy][xx]&&!seen.has(k)){seen.add(k);q.push([xx,yy,d+1]);}}}
 const far=q.reduce((a,b)=>a[2]>b[2]?a:b,q[0]),occupied=new Set(['1,1',far[0]+','+far[1]]);
 function spot(min=6){for(let i=0;i<250;i++){const v=q[rint(r,0,q.length-1)],key=v[0]+','+v[1];if(v[2]>=min&&!occupied.has(key)){occupied.add(key);return{x:v[0]+.5,y:v[1]+.5};}}const v=q[rint(r,0,q.length-1)];return {x:v[0]+.5,y:v[1]+.5};}
 const boss=floor%10===0;
 const enemies=[];for(let n=0;n<(boss?9:Math.min(20,5+Math.floor(floor*.55)));n++){
 const p=spot(8),types=[['Esqueleto','skeleton',27,7],['Duende oscuro','goblin',25,9],['Espectro','ghost',37,11],['Gólem de roca','golem',61,13]],type=types[rint(r,0,Math.min(3,1+Math.floor(floor/6)))];
 enemies.push({...p,id:n,name:type[0],kind:type[1],hp:type[2]+floor*5,maxHp:type[2]+floor*5,atk:type[3]+floor*.7,hit:0});
 }
 const exit={x:far[0]+.5,y:far[1]+.5};if(boss)enemies.push({...exit,id:99,name:floor===10?'MORGRATH, EL CENTINELA':floor===20?'VELKARA, LA DEVORADORA':'EL REY SIN ROSTRO',kind:'boss',hp:340+floor*26,maxHp:340+floor*26,atk:19+floor*1.1,hit:0});
 const chests=Array.from({length:boss?5:4},(_,i)=>({...spot(7),id:i,opened:false}));
 const nodes=Array.from({length:9},(_,i)=>({...spot(5),id:i,kind:['ore','fish','herb'][i%3],used:false}));
 return {grid,exit,enemies,chests,nodes,drops:[],start:{x:1.5,y:1.5},theme:BIOMES[Math.floor((floor-1)/5)%BIOMES.length],boss};
}
function walkable(map,x,y,rad=.20){return [[-rad,-rad],[rad,-rad],[-rad,rad],[rad,rad]].every(([dx,dy])=>{const xx=Math.floor(x+dx),yy=Math.floor(y+dy);return xx>=0&&yy>=0&&yy<S&&xx<S&&!map.grid[yy][xx];});}
class Game {
 constructor(storage=null){this.storage=storage||({getItem(){return null},setItem(){}});this.profile=null;this.active=false;this.world=null;this.camera={x:1.5,y:1.5,a:0};this.status='menu';this.notes=[];this.lastAttack=0;this.seed=177722;}
 log(txt){this.notes.push({text:txt,time:Date.now()});this.notes=this.notes.slice(-7);}
 newHero(name,klass,colors={}){const c=CLASSES[klass]||CLASSES.Guerrero;const hero={name:String(name||'Errante').slice(0,20),klass:CLASSES[klass]?klass:'Guerrero',colors,level:1,xp:0,points:0,stats:{fuerza:5,destreza:5,inteligencia:5,vitalidad:5},maxHp:c.hp,hp:c.hp,maxMp:c.mp,mp:c.mp,atk:c.atk,def:c.def,kills:0,coins:0,checkpoint:1,inventory:Array(30).fill(null),equipment:{weapon:{name:c.weapon,icon:'⚔',kind:'weapon',atk:3,id:'starter'},armor:null,head:null,feet:null,offhand:null,ring:null},stash:Array(48).fill(null),prof:{pesca:{level:1,xp:0},mineria:{level:1,xp:0},herboristeria:{level:1,xp:0}}};hero.inventory[0]=item(0);hero.inventory[1]=item(0);hero.inventory[2]=item(16);return hero;}
 create(name,klass,colors={}){this.profile=this.newHero(name,klass,colors);this.seed=Math.floor(Math.random()*0xFFFFFFFF);this.status='lobby';this.save();return this.profile;}
 load(){try{const saved=JSON.parse(this.storage.getItem('abismo_offline_v2'));if(saved?.profile?.inventory?.length===30&&saved?.profile?.stash?.length===48){this.profile=saved.profile;this.seed=saved.seed>>>0;this.status='lobby';if(saved.inDungeon){this.profile.inventory=Array(30).fill(null);for(const k of Object.keys(this.profile.equipment))this.profile.equipment[k]=null;this.profile.coins=0;}this.profile.hp=this.profile.maxHp;this.profile.mp=this.profile.maxMp;if(saved.inDungeon)this.save();return true;}}catch{}return false;}
 saveUnsafeCheckpoint(){try{this.storage.setItem('abismo_offline_v2',JSON.stringify({profile:this.profile,seed:this.seed,version:2,inDungeon:true}));return true;}catch{return false;}}
 save(){if(!this.profile||this.status!=='lobby')return false;try{this.storage.setItem('abismo_offline_v2',JSON.stringify({profile:this.profile,seed:this.seed,version:2,inDungeon:false}));return true;}catch{return false;}}
 enter(){if(!this.profile||this.status!=='lobby')return false;this.world=createMap(this.seed,this.profile.checkpoint);this.camera={x:1.5,y:1.5,a:0};this.profile.hp=this.profile.maxHp;this.profile.mp=this.profile.maxMp;this.active=true;this.status='dungeon';this.saveUnsafeCheckpoint();this.log('Piso '+this.profile.checkpoint+' · '+this.world.theme.name);return true;}
 move(forward,strafe,turn,dt){if(this.status!=='dungeon')return;const c=this.camera,s=Math.min(dt,.05)*(2.6+this.profile.stats.destreza*.035),length=Math.max(1,Math.hypot(forward,strafe));c.a=(c.a+turn*dt+Math.PI*2)%(Math.PI*2);const dx=(Math.cos(c.a)*forward-Math.sin(c.a)*strafe)*s/length,dy=(Math.sin(c.a)*forward+Math.cos(c.a)*strafe)*s/length;if(walkable(this.world,c.x+dx,c.y))c.x+=dx;if(walkable(this.world,c.x,c.y+dy))c.y+=dy;}
 stats(){let atk=this.profile.atk,def=this.profile.def;for(const v of Object.values(this.profile.equipment)){if(v){atk+=v.atk||0;def+=v.def||0;}}return {atk,def};}
 attack(magic=false){if(this.status!=='dungeon')return false;const now=Date.now();if(now-this.lastAttack<(magic?760:420))return false;if(magic&&this.profile.mp<9){this.log('Falta maná');return false;}this.lastAttack=now;if(magic)this.profile.mp-=9;const c=this.camera,range=magic?6.5:2.4,arc=magic?.38:.83;
 const target=this.world.enemies.filter(e=>e.hp>0).map(e=>({e,d:hyp(e,c),angle:Math.atan2(e.y-c.y,e.x-c.x)})).filter(t=>t.d<range&&Math.abs(Math.atan2(Math.sin(t.angle-c.a),Math.cos(t.angle-c.a)))<arc).sort((a,b)=>a.d-b.d)[0];
 if(!target){this.log('Ataque al vacío');return false;}
 const dmg=Math.max(1,Math.floor(this.stats().atk+(magic?12+this.profile.stats.inteligencia*1.6:0)+Math.random()*7));
 target.e.hp-=dmg;this.log('Golpe a '+target.e.name+' -'+dmg);
 if(target.e.hp<=0){target.e.hp=0;this.profile.kills++;let gain=(target.e.kind==='boss'?175:21)+this.profile.checkpoint*5;this.profile.xp+=gain;this.profile.coins+=target.e.kind==='boss'?175+this.profile.checkpoint*17:9+this.profile.checkpoint*2;
 this.log('Enemigo derrotado · +'+gain+' EXP');
 while(this.profile.xp>=this.profile.level*75){this.profile.xp-=this.profile.level*75;this.profile.level++;this.profile.points+=3;this.profile.maxHp+=10;this.profile.maxMp+=6;this.profile.hp=this.profile.maxHp;this.profile.mp=this.profile.maxMp;this.log('¡NIVEL '+this.profile.level+'! 3 puntos disponibles');}
 if(Math.random()>.37||target.e.kind==='boss'){this.world.drops.push({x:target.e.x,y:target.e.y,loot:item(rint(Math.random,0,ITEMS.length),this.profile.checkpoint)});}
 }return true;}
 inventoryAdd(v){const i=this.profile.inventory.indexOf(null);if(i<0){this.log('Mochila llena');return false;}this.profile.inventory[i]=v;return true;}
 interact(){if(this.status!=='dungeon')return false;const c=this.camera,w=this.world,p=this.profile;
 if(hyp(c,w.exit)<1.8){if(w.enemies.some(e=>e.kind==='boss'&&e.hp>0)){this.log('La puerta está sellada: derrotá al jefe');return false;}this.status='door';return 'door';}
 const drop=w.drops.find(d=>hyp(c,d)<1.5);if(drop){if(this.inventoryAdd(drop.loot)){w.drops=w.drops.filter(x=>x!==drop);this.log('Recogiste '+drop.loot.name);}return true;}
 const chest=w.chests.find(d=>!d.opened&&hyp(c,d)<1.6);if(chest){chest.opened=true;let count=1+rint(Math.random,0,2);for(let i=0;i<count;i++)this.inventoryAdd(item(rint(Math.random,0,ITEMS.length),p.checkpoint));p.coins+=15+p.checkpoint*3;this.log('Cofre abierto · objetos y monedas');return true;}
 const node=w.nodes.find(n=>!n.used&&hyp(c,n)<1.6);if(node){node.used=true;const professions={fish:['pesca',16,'Pescaste una trucha cavernaria'],ore:['mineria',14,'Extrajiste mineral oscuro'],herb:['herboristeria',17,'Recolectaste hierba lunar']},[prof,idx,msg]=professions[node.kind];this.inventoryAdd(item(idx,p.checkpoint));const skill=p.prof[prof];skill.xp+=18+p.checkpoint;while(skill.xp>=skill.level*70){skill.xp-=skill.level*70;skill.level++;this.log('Profesión '+prof+' nivel '+skill.level);}this.log(msg);return true;}
 const start=hyp(c,w.start);if(start<1.7){this.extract(false);return 'lobby';}this.log('No hay nada cerca');return false;}
 extract(fromDoor=true){if(this.status!=='door'&&this.status!=='dungeon')return false;if(fromDoor&&this.status==='door')this.profile.checkpoint=Math.min(100,this.profile.checkpoint+1);this.status='lobby';this.active=false;this.world=null;this.save();this.log('¡Botín a salvo! Usá el baúl en el refugio.');return true;}
 descend(){if(this.status!=='door')return false;this.profile.checkpoint=Math.min(100,this.profile.checkpoint+1);this.world=createMap(this.seed,this.profile.checkpoint);this.camera={x:1.5,y:1.5,a:0};this.profile.hp=Math.min(this.profile.maxHp,this.profile.hp+Math.floor(this.profile.maxHp*.22));this.profile.mp=Math.min(this.profile.maxMp,this.profile.mp+12);this.status='dungeon';this.saveUnsafeCheckpoint();this.log('Descendiste al piso '+this.profile.checkpoint);return true;}
 tick(dt){if(this.status!=='dungeon')return;if(!Number.isFinite(dt))return;dt=Math.min(dt,.05);const c=this.camera,now=Date.now(),h=this.profile;
 for(const e of this.world.enemies){if(e.hp<=0)continue;let d=hyp(c,e);if(d>9)continue;if(d>1.2){const speed=e.kind==='boss'?.72:e.kind==='goblin'?.95:.61;let dx=(c.x-e.x)/Math.max(d,.01)*speed*dt,dy=(c.y-e.y)/Math.max(d,.01)*speed*dt;if(walkable(this.world,e.x+dx,e.y))e.x+=dx;if(walkable(this.world,e.x,e.y+dy))e.y+=dy;}else if(now-e.hit>1050){e.hit=now;const dmg=Math.max(1,Math.floor(e.atk-this.stats().def*.62));h.hp-=dmg;this.log(e.name+' te hirió -'+dmg);if(h.hp<=0){this.die();return;}}}
 }
 die(){const h=this.profile;if(!h)return;h.inventory=Array(30).fill(null);for(const k of Object.keys(h.equipment))h.equipment[k]=null;h.coins=0;h.hp=h.maxHp;h.mp=h.maxMp;this.world=null;this.active=false;this.status='dead';this.log('La expedición terminó. Perdiste el equipo transportado. El baúl está a salvo.');}
 respawn(){if(this.status!=='dead')return false;this.status='lobby';this.save();return true;}
 use(index){const inv=this.profile.inventory,v=inv[index];if(!v||this.status==='menu')return false;if(v.kind==='potion'||v.kind==='food'){this.profile.hp=Math.min(this.profile.maxHp,this.profile.hp+(v.heal||15));inv[index]=null;this.log('Usaste '+v.name);return true;}if(['weapon','armor','head','feet','offhand','ring'].includes(v.kind)){const old=this.profile.equipment[v.kind]||null;this.profile.equipment[v.kind]=v;inv[index]=old;this.log('Equipaste '+v.name);return true;}if(v.kind==='book'){this.log('Libro: '+v.name);return true;}return false;}
 unequip(slot){if(!this.profile.equipment[slot])return false;const ix=this.profile.inventory.indexOf(null);if(ix<0)return false;this.profile.inventory[ix]=this.profile.equipment[slot];this.profile.equipment[slot]=null;return true;}
 stash(from,index){if(this.status!=='lobby')return false;const h=this.profile,a=from==='bag'?h.inventory:h.stash,b=from==='bag'?h.stash:h.inventory;if(!a[index])return false;const i=b.indexOf(null);if(i<0)return false;b[i]=a[index];a[index]=null;this.save();return true;}
 stat(k){const h=this.profile;if(this.status!=='lobby'||h.points<1||!Object.hasOwn(h.stats,k))return false;h.points--;h.stats[k]++;if(k==='fuerza')h.atk++;if(k==='vitalidad'){h.maxHp+=8;h.hp+=8;}if(k==='inteligencia'){h.maxMp+=7;h.mp+=7;}this.save();return true;}
}
return {Game,createMap,BIOMES,STORIES,CLASSES,ITEMS,walkable};
});
