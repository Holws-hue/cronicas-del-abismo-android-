/* Crónicas del Abismo 0.2 — interfaz y renderizador 2.5D autónomos. */
(()=>{'use strict';
const Engine=window.AbismoSolo;
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const g=new Engine.Game(localStorage);
let hasSave=g.load(),modal='',selectedItem=null,selectedBag=-1,notesSeen=0;
let opts={audio:true,quality:'medio',sensitivity:1};try{Object.assign(opts,JSON.parse(localStorage.getItem('abismo_options_v2')||'{}'));}catch{}
const keys=new Set(),padOld={};let stick={pointer:null,x:0,y:0},look={pointer:null,x:0},mouseActive=false,preview=0,sceneBiome=-1,menuTime=0;
let audio=null,lastAmbient=0,lastAction=0,toastExpiry=0,lastT=performance.now(),frameNo=0;
const menu=$('main-menu'),gameScreen=$('game-screen'),panel=$('panel'),panelBody=$('panel-body'),modalBox=$('modal'),modalContent=$('modal-content'),canvas=$('view'),ctx=canvas.getContext('2d'),mapCanvas=$('minimap');
const COLORS=['#ddebf6','#a6ded7','#f8b46e'];
function playSound(f=330,d=.1,volume=.026,type='triangle'){
 if(!opts.audio)return;
 try{if(!audio)audio=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();
 const o=audio.createOscillator(),v=audio.createGain(),t=audio.currentTime;
 o.type=type;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(Math.max(35,f*.68),t+d);
 v.gain.setValueAtTime(.0001,t);v.gain.exponentialRampToValueAtTime(volume,t+.012);v.gain.exponentialRampToValueAtTime(.0001,t+d);
 o.connect(v).connect(audio.destination);o.start(t);o.stop(t+d+.04);}catch{}
}
function ambience(now){if(!opts.audio||now-lastAmbient<4600)return;lastAmbient=now;playSound([110,130.81,146.83,164.81][Math.floor(now/14000)%4],3.3,.007,'sine');}
function notify(message){const s=$('snackbar');s.textContent=message;s.classList.remove('hidden');toastExpiry=Date.now()+2400;}
window.abismoNotify=notify;
function hidePanel(){panel.classList.add('hidden');panelBody.innerHTML='';}
function hideModal(){modalBox.classList.add('hidden');modal='';modalContent.innerHTML='';}
function showPanel(content){panelBody.innerHTML=content;panel.classList.remove('hidden');playSound(480,.10,.02);}
function showModal(name,content){modal=name;modalContent.innerHTML=content;modalBox.classList.remove('hidden');playSound(450,.10,.019);}
function saveOptions(){localStorage.setItem('abismo_options_v2',JSON.stringify(opts));}
function closeModal(){
 if(modal==='dead')return;
 if(modal==='door'){g.status='dungeon';hideModal();return;}
 if(modal==='lobby'){hideModal();returnMenu();return;}
 hideModal();
}
$('close-panel').onclick=hidePanel;
$('modal-close').onclick=closeModal;
function menuScene(time){
 const c=$('menu-canvas'),box=c.getBoundingClientRect(),dpr=Math.min(1.5,devicePixelRatio||1);if(box.width<2)return;
 const w=Math.round(box.width*dpr),h=Math.round(box.height*dpr);if(c.width!==w||c.height!==h){c.width=w;c.height=h;}
 const x=c.getContext('2d'),biome=Math.floor(time/12000)%3,colors=[
 {name:'❄ PÁRAMOS DE ESCARCHA',sky:'#233b60',horizon:'#b0c9d6',hill:'#6a8799',dark:'#23384b',accent:'#f1faff',trees:'#20374a'},
 {name:'🔥 VALLE DE LAS BRASAS',sky:'#3c2535',horizon:'#e1815a',hill:'#a24d44',dark:'#372830',accent:'#ffb169',trees:'#35232a'},
 {name:'✦ BOSQUE DE LOS ERRANTES',sky:'#1c3448',horizon:'#98af8b',hill:'#527766',dark:'#1a403b',accent:'#e9d5a4',trees:'#193529'}][biome];
 if(sceneBiome!==biome){sceneBiome=biome;$('menu-biome').textContent=colors.name;}
 let sky=x.createLinearGradient(0,0,0,h);sky.addColorStop(0,colors.sky);sky.addColorStop(.55,colors.horizon);sky.addColorStop(1,colors.dark);x.fillStyle=sky;x.fillRect(0,0,w,h);
 const moonX=w*.78,moonY=h*.24;
 const halo=x.createRadialGradient(moonX,moonY,0,moonX,moonY,h*.44);halo.addColorStop(0,colors.accent+'88');halo.addColorStop(.16,colors.accent+'29');halo.addColorStop(1,'transparent');x.fillStyle=halo;x.fillRect(moonX-h*.5,moonY-h*.5,h,h);
 x.fillStyle=colors.accent;x.globalAlpha=.82;x.beginPath();x.arc(moonX,moonY,h*.048,0,7);x.fill();x.globalAlpha=1;
 const nr=n=>Math.sin(n*52.123)*43758.5%1;
 for(let layer=0;layer<4;layer++){const yy=h*(.40+layer*.135),amp=h*(.045+layer*.027);x.beginPath();x.moveTo(-1,h);for(let i=0;i<=27;i++){const px=i*w/27,y=yy-Math.abs(nr(i+layer*51))*amp+Math.sin(i*.72+layer)*amp*.35;x.lineTo(px,y);}x.lineTo(w,h);x.closePath();x.fillStyle=[colors.hill,colors.dark,'#20313a','#0a151e'][layer];x.globalAlpha=[.8,.95,.97,1][layer];x.fill();}
 x.globalAlpha=1;
 for(let i=0;i<41;i++){const px=w*(i/41+.02),sc=.28+Math.abs(nr(i*72+biome*9))*.75,y=h*(.6+Math.abs(nr(i*44+41))*.46),ht=h*.16*sc;
 x.fillStyle=colors.trees;if(biome===1){x.fillRect(px-2,y-ht*.7,5,ht*.85);x.beginPath();x.moveTo(px-9*sc,y-ht*.65);x.lineTo(px,y-ht*1.5);x.lineTo(px+9*sc,y-ht*.65);x.fill();}else{x.fillRect(px-3*sc,y-ht*.22,6*sc,ht*.5);for(let j=0;j<3;j++){x.beginPath();x.moveTo(px-(17-j*4)*sc,y-(.12+j*.25)*ht);x.lineTo(px,y-(.83+j*.25)*ht);x.lineTo(px+(17-j*4)*sc,y-(.12+j*.25)*ht);x.fill();}}}
 // Bastión iluminado en un promontorio: monumento del menú, no captura externa.
 x.save();x.translate(w*.76,h*.75);const sz=Math.min(w*.23,h*.52);x.fillStyle='#0a151f';x.fillRect(-sz*.42,-sz*.20,sz*.84,sz*.48);
 for(let i=-2;i<=2;i++){x.fillRect(i*sz*.16-sz*.095,-sz*.43-(i%2===0?sz*.08:0),sz*.19,sz*.44);x.beginPath();x.moveTo(i*sz*.16-sz*.13,-sz*.43);x.lineTo(i*sz*.16,-sz*.65);x.lineTo(i*sz*.16+sz*.13,-sz*.43);x.fill();}
 x.fillStyle='#997b5766';x.fillRect(-sz*.13,-sz*.02,sz*.26,sz*.33);x.fillStyle=colors.accent;x.shadowColor=colors.accent;x.shadowBlur=sz*.12;x.beginPath();x.ellipse(0,sz*.09,sz*.10,sz*.23,0,0,7);x.fill();x.shadowBlur=0;x.restore();
 for(let i=0;i<90;i++){let p=(time*.000022*(.2+Math.abs(nr(i*7))*.7)+Math.abs(nr(i*13+2)))%1,px=Math.abs(nr(i*61+1))*w+Math.sin(time*.0008+i)*9,py=h*(1-p);x.fillStyle=biome===0?'#e9fbff':biome===1?'#ffb16b':'#e5d496';x.globalAlpha=.16+.45*Math.abs(nr(i*13));x.fillRect(px,py,Math.max(1,dpr),Math.max(1,dpr));}
 x.globalAlpha=1;
}
function viewMenu(){hideModal();hidePanel();menu.classList.remove('hidden');gameScreen.classList.add('hidden');keys.clear();}
function returnMenu(){if(g.status==='dungeon'||g.status==='door'){if(!confirm('El botín que no extrajiste se perderá al abandonar la expedición. ¿Salir?'))return;g.status='menu';g.world=null;g.load();}viewMenu();}
window.abismoBack=()=>{if(!panel.classList.contains('hidden')){hidePanel();return;}if(!modalBox.classList.contains('hidden')){closeModal();return;}if(!gameScreen.classList.contains('hidden')){pause();return;}};
function showCreator(){
 const p=g.profile;showPanel('<h2>Preparar aventurero</h2><p>Elegí tu clase y apariencia. El refugio guarda el equipo que extraigas de las mazmorras.</p>'+
 (hasSave?'<div class="tip">Partida guardada: <b>'+esc(p.name)+'</b> · '+esc(p.klass)+' · Nivel '+p.level+' · Piso '+p.checkpoint+'</div>':'')+
 '<div class="character-demo"><div class="portrait" id="portrait"><div class="body"></div><div class="head"></div><div class="hair"></div><div class="eye"></div><div class="eye right"></div></div>'+
 '<div class="fields" style="flex:1"><label>Nombre<input id="name" maxlength="20" placeholder="Aventurero" value="'+esc(p?.name||'Valdrin')+'"></label><label>Clase<select id="klass"><option>Guerrero</option><option>Mago</option><option>Pícaro</option></select></label>'+
 '<label>Color de ropa<input id="cloth" type="color" value="'+esc(p?.colors?.cloth||'#9a493c')+'"></label><label>Color de cabello<input id="hair" type="color" value="'+esc(p?.colors?.hair||'#7a5c40')+'"></label></div></div>'+
 '<div class="btn-row">'+(hasSave?'<button id="continue" class="btn">CONTINUAR PARTIDA</button>':'')+
 '<button id="new-game" class="'+(hasSave?'btn-sub':'btn')+'">'+(hasSave?'CREAR OTRO HÉROE':'CREAR PERSONAJE')+'</button></div>'+
 '<p class="tiny">Guerrero: defensa y combate. Mago: hechizos y maná. Pícaro: agilidad y golpes rápidos.</p>');
 const klass=$('klass');if(p)klass.value=p.klass;
 function portrait(){const t=$('portrait');if(t){t.style.setProperty('--cloth',$('cloth').value);t.style.setProperty('--hair',$('hair').value);}}
 $('cloth').oninput=portrait;$('hair').oninput=portrait;portrait();
 if(hasSave)$('continue').onclick=()=>{g.load();hidePanel();showGame();openLobby();};
 $('new-game').onclick=()=>{
 if(hasSave&&!confirm('¿Reemplazar el héroe guardado? El baúl anterior se perderá.'))return;
 g.create($('name').value.trim()||'Valdrin',klass.value,{cloth:$('cloth').value,hair:$('hair').value});
 hasSave=true;hidePanel();showGame();openLobby();
 };
}
$('btn-solo').onclick=()=>{playSound(480,.12);showCreator();};
$('btn-multi').onclick=()=>{showPanel('<h2>Multijugador LAN</h2><p>Creá la partida en tu PC con <b>INICIAR_SERVIDOR.bat</b>. Desde Android entrá usando la IP local de esa computadora.</p>'+
 '<label>IP de la PC anfitriona<input id="lan-ip" class="form-input" type="text" inputmode="decimal" placeholder="192.168.1.10:8080" autocomplete="off"></label>'+
 '<div class="btn-row"><button id="connect-lan" class="btn">CONECTAR Y JUGAR</button></div>'+
 '<p class="tiny">Ejemplo: 192.168.1.100:8080 · Ambos dispositivos deben estar en el mismo Wi-Fi. En PC se mantiene el cooperativo de pantalla dividida.</p>');$('lan-ip').value=localStorage.getItem('abismo_lan_ip')||'';
 $('connect-lan').onclick=()=>{const ip=$('lan-ip').value.trim();if(!ip){notify('Ingresá la IP de la computadora');return;}localStorage.setItem('abismo_lan_ip',ip);if(window.AndroidBridge?.connectLan){window.AndroidBridge.connectLan(ip);}
 else{if(!/^([0-9]{1,3}\.){3}[0-9]{1,3}(:\d{1,5})?$/.test(ip)){notify('Ingresá una IP privada válida');return;}location.href='http://'+ip.replace(/\/$/,'')+'/';}};
 };
$('btn-options').onclick=()=>{showPanel('<h2>Opciones</h2><div class="option-row">Música y sonidos <select id="opt-sound"><option value="yes">Activados</option><option value="no">Desactivados</option></select></div>'+
 '<div class="option-row">Calidad gráfica <select id="opt-quality"><option value="bajo">Baja</option><option value="medio">Media</option><option value="alto">Alta</option></select></div>'+
 '<div class="option-row">Sensibilidad de cámara <input id="opt-sense" type="range" min=".5" max="2.5" step=".1"></div>'+
 '<p class="tiny">Controles: joystick izquierdo para caminar, arrastrá la pantalla para mirar. ⚔ atacar, ✧ hechizo, ✦ interactuar y ♥ curar. Teclado WASD, mouse y mando también disponibles.</p>'+
 '<div class="btn-row"><button id="opt-save" class="btn">GUARDAR OPCIONES</button></div>');
 $('opt-sound').value=opts.audio?'yes':'no';$('opt-quality').value=opts.quality;$('opt-sense').value=opts.sensitivity;
 $('opt-save').onclick=()=>{opts.audio=$('opt-sound').value==='yes';opts.quality=$('opt-quality').value;opts.sensitivity=Number($('opt-sense').value);saveOptions();hidePanel();notify('Opciones guardadas');};};
function showGame(){menu.classList.add('hidden');gameScreen.classList.remove('hidden');if(window.AndroidBridge)notify('Modo sin internet: guardado local en este teléfono');}
function pStats(){const p=g.profile;if(!p)return '';return '<h3>'+esc(p.name)+' <small>· '+esc(p.klass)+' · Nivel '+p.level+'</small></h3>'+
 '<p>Salud '+p.hp+'/'+p.maxHp+' · Maná '+p.mp+'/'+p.maxMp+' · Oro '+p.coins+' · EXP '+p.xp+'/'+(p.level*75)+'</p>'+
 '<p>Prof.: ⛏ minería '+p.prof.mineria.level+' · 🎣 pesca '+p.prof.pesca.level+' · ☘ herboristería '+p.prof.herboristeria.level+'</p>';}
function slots(list,where){return '<div class="itemgrid">'+list.map((v,i)=>'<button class="item-slot '+(v?'r'+(v.rarity||0):'')+'" data-slot="'+i+'" data-where="'+where+'" title="'+esc(v?.name||'Casillero vacío')+'"><small>'+(i+1)+'</small>'+esc(v?.icon||'·')+'<span class="rarity"></span></button>').join('')+'</div>';}
function setupSlots(){modalContent.querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.slot),where=b.dataset.where;
 if(modal==='lobby'){if(g.stash(where==='bag'?'bag':'stash',i)){openLobby();playSound(650,.1);}else notify('No hay objeto o no queda espacio');}
 else if(modal==='inventory'){selectedBag=i;const v=g.profile.inventory[i];if(v){modalContent.querySelector('#selected-description').textContent=v.name+(v.atk?' · Ataque +'+v.atk:'')+(v.def?' · Defensa +'+v.def:'')+(v.heal?' · Cura '+v.heal:'');}
 else modalContent.querySelector('#selected-description').textContent='Casillero vacío';
 modalContent.querySelectorAll('.item-slot').forEach(e=>e.style.borderColor=e===b?'#f6d39a':'#6e6252');}
 });}
function openLobby(){if(!g.profile)return;g.status='lobby';g.save();
 const h=g.profile;showModal('lobby','<h2>Refugio de los errantes</h2><p class="tip">Estás a salvo. Tocá un objeto de la mochila para guardarlo en el baúl o uno del baúl para recuperarlo. El baúl <b>nunca se pierde al morir</b>.</p>'+pStats()+
 '<div class="inventory-columns"><div><h3>🎒 MOCHILA (30)</h3>'+slots(h.inventory,'bag')+'</div><div><h3>⚑ BAÚL SEGURO (48)</h3>'+slots(h.stash,'stash')+'</div></div>'+
 '<div class="btn-row"><button id="enter-dungeon" class="btn">ENTRAR AL PISO '+h.checkpoint+'</button><button id="open-stats" class="btn-sub">ESTADÍSTICAS</button><button id="leave-lobby" class="btn-sub">MENÚ PRINCIPAL</button></div>');
 setupSlots();$('enter-dungeon').onclick=()=>{g.enter();hideModal();playSound(140,.40,.07,'sawtooth');};
 $('open-stats').onclick=()=>openInventory(true);$('leave-lobby').onclick=()=>{hideModal();viewMenu();};}
function openInventory(showFromLobby=false){if(!g.profile)return;let p=g.profile;
 showModal('inventory','<h2>Inventario y personaje</h2>'+pStats()+'<h3>Equipo</h3>'+
 '<div class="equipment">'+Object.entries(p.equipment).map(([k,v])=>'<button data-gear="'+k+'">'+esc(v?.icon||'◈')+' '+esc(k.toUpperCase())+'<small>'+esc(v?.name||'Vacío')+'</small></button>').join('')+'</div>'+
 '<h3>Mochila (30 ranuras)</h3>'+slots(p.inventory,'bag')+'<div id="selected-description" class="item-name">Seleccioná un objeto para usarlo o equiparlo.</div>'+
 '<div class="btn-row"><button id="use-selected" class="btn">USAR / EQUIPAR</button><button id="go-stats" class="btn-sub">MEJORAR STATS</button>'+
 '<button id="back-to-lobby" class="btn-sub">'+(g.status==='lobby'?'VOLVER AL BAÚL':'CERRAR')+'</button></div>');
 selectedBag=-1;setupSlots();
 modalContent.querySelectorAll('[data-gear]').forEach(b=>b.onclick=()=>{if(g.unequip(b.dataset.gear)){if(g.status==='lobby')g.save();openInventory();}else notify('Necesitás un espacio libre en la mochila');});
 $('use-selected').onclick=()=>{if(selectedBag<0){notify('Seleccioná un objeto');return;}const v=p.inventory[selectedBag];if(v?.kind==='book'){showBook(v);return;}if(g.use(selectedBag)){if(g.status==='lobby')g.save();playSound(530,.13);openInventory();}else notify('No podés usar ese objeto');};
 $('go-stats').onclick=()=>openStats();
 $('back-to-lobby').onclick=()=>{if(g.status==='lobby')openLobby();else hideModal();};
}
function openStats(){const p=g.profile;showModal('stats','<h2>Atributos del héroe</h2>'+pStats()+'<p>Puntos disponibles: <b>'+p.points+'</b> · Solamente se asignan en el refugio.</p><div class="stats-box">'+Object.entries(p.stats).map(([k,v])=>'<div class="stat">'+esc(k)+'<br><b>'+v+'</b> <button data-stat="'+k+'">+</button></div>').join('')+'</div><div class="btn-row"><button id="stats-back" class="btn-sub">VOLVER</button></div>');
 modalContent.querySelectorAll('[data-stat]').forEach(b=>b.onclick=()=>{if(g.stat(b.dataset.stat)){playSound(675,.14);openStats();}else notify('Necesitás puntos y estar en el refugio');});
 $('stats-back').onclick=()=>g.status==='lobby'?openLobby():openInventory();}
function showBook(v){showModal('book','<h2>Libro encontrado</h2><article class="book-page"><h3>'+esc(v.name)+'</h3><p>'+esc(v.body)+'</p></article><div class="btn-row"><button id="book-back" class="btn">VOLVER</button></div>');$('book-back').onclick=()=>openInventory();}
function pause(){if(g.status==='dead'){showDeath();return;}if(g.status==='lobby'){openLobby();return;}
 showModal('pause','<h2>Pausa</h2><p>Crónicas del Abismo · Piso '+g.profile.checkpoint+'</p>'+
 '<div class="btn-row"><button id="resume" class="btn">CONTINUAR</button><button id="pause-inventory" class="btn-sub">INVENTARIO</button><button id="abandon" class="btn-sub">SALIR AL MENÚ</button></div>'+
 '<p class="tiny">Si abandonás el piso sin extraer, perdés el botín conseguido durante esta expedición.</p>');
 $('resume').onclick=hideModal;$('pause-inventory').onclick=()=>openInventory();$('abandon').onclick=returnMenu;}
function showDoor(){showModal('door','<h2>La puerta del siguiente piso</h2><p>Elegí qué hacer con el botín que conseguiste. Si volvés al refugio, se guarda tu progreso y podrás entrar al siguiente piso en otra expedición.</p>'+
 '<div class="btn-row"><button id="extract" class="btn">EXTRAER BOTÍN Y VOLVER</button><button id="descend" class="btn-sub">DESCENDER AL PISO '+(g.profile.checkpoint+1)+'</button><button id="stay" class="btn-sub">QUEDARME AQUÍ</button></div>'+
 '<p class="caps-note">MORIR: PERDÉS MOCHILA, EQUIPO Y ORO. EL BAÚL QUEDA A SALVO.</p>');
 $('extract').onclick=()=>{g.extract(true);hideModal();playSound(700,.24);openLobby();};
 $('descend').onclick=()=>{g.descend();hideModal();playSound(200,.4,.045);};
 $('stay').onclick=()=>{g.status='dungeon';hideModal();};}
function showDeath(){if(modal==='dead')return;showModal('dead','<h2>HAS CAÍDO EN EL ABISMO</h2><p>Tu mochila, equipo y oro de la expedición se han perdido. Todo lo que ya habías guardado en el baúl sigue protegido.</p>'+
 '<div class="btn-row"><button id="revive" class="btn">VOLVER AL REFUGIO</button></div>');
 $('revive').onclick=()=>{g.respawn();hideModal();openLobby();};playSound(85,.58,.055,'sawtooth');}
function showMap(){if(g.status!=='dungeon')return;showModal('map','<h2>Mapa del piso '+g.profile.checkpoint+'</h2><div class="map-modal" style="text-align:center"><canvas id="map-large" width="320" height="320"></canvas></div><p class="tiny">Dorado: tu posición · Turquesa: salida · Rojo: enemigos cercanos.</p>');drawMinimap($('map-large'),true);}
$('btn-bag').onclick=()=>openInventory();$('btn-map').onclick=showMap;$('btn-pause').onclick=pause;
function action(kind){if(g.status!=='dungeon'||modal)return;let r;
 if(kind==='attack'){r=g.attack();if(r)playSound(175,.11,.039,'sawtooth');}
 if(kind==='magic'){r=g.attack(true);if(r)playSound(420,.18,.040,'sine');}
 if(kind==='use'){r=g.interact();if(r==='door')showDoor();else if(r==='lobby')openLobby();if(r)playSound(610,.12);}
 if(kind==='heal'){const ix=g.profile.inventory.findIndex(v=>v&&(v.kind==='potion'||v.kind==='food'));if(ix<0)notify('No tenés pociones');else{g.use(ix);playSound(540,.18);}}
 updateHud();}
for(const [id,a] of [['hit','attack'],['spell','magic'],['use','use'],['heal','heal']])$(id).addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();action(a);});
const stickElement=$('stick'),knob=$('knob');
function setStick(e){const rect=stickElement.getBoundingClientRect(),dx=e.clientX-rect.left-rect.width/2,dy=e.clientY-rect.top-rect.height/2,mag=Math.max(1,Math.hypot(dx,dy)),max=rect.width*.35,dist=Math.min(max,mag);stick.x=dx/mag*dist/max;stick.y=dy/mag*dist/max;knob.style.transform='translate('+(stick.x*max)+'px,'+(stick.y*max)+'px)';}
stickElement.addEventListener('pointerdown',e=>{e.preventDefault();stick.pointer=e.pointerId;stickElement.setPointerCapture(e.pointerId);setStick(e);});
stickElement.addEventListener('pointermove',e=>{if(stick.pointer===e.pointerId)setStick(e);});
const releaseStick=e=>{if(e.pointerId!==stick.pointer)return;stick.pointer=null;stick.x=stick.y=0;knob.style.transform='translate(0,0)';};
stickElement.addEventListener('pointerup',releaseStick);stickElement.addEventListener('pointercancel',releaseStick);
canvas.addEventListener('pointerdown',e=>{if(g.status!=='dungeon'||modal)return;if(e.pointerType==='mouse'){canvas.requestPointerLock?.().catch?.(()=>{});return;}look.pointer=e.pointerId;look.x=e.clientX;canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(look.pointer!==e.pointerId||g.status!=='dungeon')return;g.camera.a+=(e.clientX-look.x)*.007*(opts.sensitivity||1);look.x=e.clientX;});
canvas.addEventListener('pointerup',e=>{if(e.pointerId===look.pointer)look.pointer=null;});
canvas.addEventListener('pointercancel',e=>{if(e.pointerId===look.pointer)look.pointer=null;});
document.addEventListener('pointerlockchange',()=>mouseActive=!!document.pointerLockElement);
document.addEventListener('mousemove',e=>{if(mouseActive&&g.status==='dungeon'&&!modal)g.camera.a+=e.movementX*.0026*(opts.sensitivity||1);});
canvas.addEventListener('mousedown',e=>{if(mouseActive&&e.button===0)action('attack');});
window.addEventListener('keydown',e=>{if(e.target.closest('input,select,textarea'))return;keys.add(e.code);if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(e.code))e.preventDefault();if(e.repeat)return;
 if(e.code==='Escape'){window.abismoBack();return;}if(g.status!=='dungeon'||modal)return;
 if(e.code==='KeyE')action('use');if(e.code==='Space')action('attack');if(e.code==='KeyF')action('magic');if(e.code==='KeyQ')action('heal');
 if(e.code==='KeyI'||e.code==='Tab')openInventory();if(e.code==='KeyM')showMap();});
window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();stick.x=stick.y=0;});
function padButton(p,k,actionFn){const on=p.buttons[k]?.pressed,old=padOld[k];padOld[k]=on;if(on&&!old)actionFn();}
function controller(dt){const pad=Array.from(navigator.getGamepads?.()||[]).find(Boolean);let f=0,s=0,t=0;if(pad){const axis=(i)=>Math.abs(pad.axes[i]||0)>.16?pad.axes[i]:0;f-=axis(1);s+=axis(0);t+=axis(2)*2.2;padButton(pad,0,()=>action('use'));padButton(pad,1,()=>action('heal'));padButton(pad,2,()=>action('magic'));padButton(pad,3,()=>{if(g.status==='dungeon')openInventory();});padButton(pad,9,pause);if(pad.buttons[7]?.pressed&&Date.now()-lastAction>420){lastAction=Date.now();action('attack');}}
 f+=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-stick.y;
 s+=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+stick.x;
 t+=(keys.has('KeyL')?1:0)-(keys.has('KeyJ')?1:0);
 g.move(f,s,t*2*(opts.sensitivity||1),dt);}
const spriteCache={};
function sprite(kind){if(spriteCache[kind])return spriteCache[kind];const c=document.createElement('canvas');c.width=96;c.height=112;const x=c.getContext('2d');x.translate(48,55);const shape=(pts,col)=>{x.beginPath();x.moveTo(pts[0][0],pts[0][1]);for(const p of pts.slice(1))x.lineTo(p[0],p[1]);x.closePath();x.fillStyle=col;x.fill();};
x.fillStyle='#0006';x.beginPath();x.ellipse(0,46,28,7,0,0,7);x.fill();
if(kind==='skeleton'){shape([[-18,-24],[17,-24],[21,31],[-18,31]],'#656f77');x.fillStyle='#ded6bd';x.fillRect(-12,-45,24,26);x.fillRect(-11,-15,22,33);for(let i=0;i<4;i++)x.fillRect(-16,-9+i*7,32,3);x.fillStyle='#1d222b';x.fillRect(-9,-35,7,8);x.fillRect(3,-35,7,8);}
else if(kind==='goblin'){shape([[-23,-23],[0,-52],[23,-23],[19,34],[-20,34]],'#4e4d40');shape([[-20,-33],[-35,-47],[-20,-14]],'#70a258');shape([[20,-33],[35,-47],[20,-14]],'#70a258');x.fillStyle='#88b661';x.fillRect(-18,-42,36,29);x.fillStyle='#f0d878';x.fillRect(-12,-29,7,5);x.fillRect(5,-29,7,5);}
else if(kind==='ghost'){shape([[-19,-47],[3,-57],[25,-39],[26,37],[15,27],[0,44],[-15,27],[-26,43]],'#9bdfecb3');x.fillStyle='#1e3548';x.fillRect(-11,-29,7,10);x.fillRect(5,-29,7,10);}
else if(kind==='golem'){shape([[-27,-29],[-21,-49],[19,-49],[28,-29],[24,34],[-24,34]],'#687786');shape([[-22,-58],[18,-58],[25,-34],[-25,-34]],'#9da6ac');x.fillStyle='#ffc78e';x.fillRect(-14,-47,8,6);x.fillRect(5,-47,8,6);}
else if(kind==='boss'){const glow=x.createRadialGradient(0,0,1,0,0,45);glow.addColorStop(0,'#fc784d8a');glow.addColorStop(1,'transparent');x.fillStyle=glow;x.fillRect(-48,-54,96,108);shape([[-33,-27],[-45,-75],[-16,-61],[0,-51],[17,-61],[45,-75],[34,-27]],'#bd6042');shape([[-31,-30],[0,-60],[30,-30],[24,35],[-24,35]],'#6a3841');x.fillStyle='#ccae67';x.fillRect(-17,-49,34,20);x.fillStyle='#ff943d';x.fillRect(-11,-42,7,7);x.fillRect(5,-42,7,7);}
else if(kind==='chest'){shape([[-31,0],[31,0],[27,31],[-27,31]],'#70492c');shape([[-32,-4],[-24,-29],[21,-29],[33,-4]],'#a37440');x.fillStyle='#e8b46d';x.fillRect(-30,-3,60,7);x.fillRect(-5,4,10,11);}
else if(kind==='exit'){const glow=x.createRadialGradient(0,0,2,0,0,48);glow.addColorStop(0,'#82fdf1');glow.addColorStop(.65,'#2e7ac0');glow.addColorStop(1,'transparent');x.fillStyle=glow;x.fillRect(-46,-52,92,105);x.strokeStyle='#d6ae64';x.lineWidth=8;x.beginPath();x.ellipse(0,0,28,49,0,0,7);x.stroke();}
else if(kind==='ore'){shape([[-26,32],[-19,-13],[2,-37],[23,-8],[31,31]],'#52748b');shape([[-10,0],[8,-31],[25,-9],[9,23]],'#8ddff4');}
else if(kind==='fish'){x.fillStyle='#4bb2d2';x.beginPath();x.ellipse(0,25,35,14,0,0,7);x.fill();x.strokeStyle='#b8f1fb';x.lineWidth=3;x.beginPath();x.ellipse(0,25,27,8,0,0,7);x.stroke();}
else if(kind==='herb'){x.strokeStyle='#8ed17d';x.lineWidth=5;x.beginPath();x.moveTo(0,40);x.lineTo(0,-32);x.stroke();for(let n=0;n<6;n++)shape([[0,20-n*8],[(n%2?1:-1)*23,10-n*10],[(n%2?1:-1)*7,22-n*8]],'#74ac6c');}
else if(kind==='drop'){shape([[0,-27],[21,0],[0,29],[-21,0]],'#c7a662');shape([[0,-18],[11,0],[0,18],[-11,0]],'#ffe8b1');}
spriteCache[kind]=c;return c;}
function renderWorld(now){
 const rect=canvas.getBoundingClientRect();if(rect.width<2||!g.world)return;
 const quality=opts.quality==='alto'?.74:opts.quality==='bajo'?.37:.53,w=Math.round(clamp(rect.width*quality,260,740)),h=Math.round(w*rect.height/rect.width);
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
 const x=ctx,c=g.camera,map=g.world.grid,theme=g.world.theme;
 let sky=x.createLinearGradient(0,0,0,h/2);sky.addColorStop(0,'#111b29');sky.addColorStop(1,theme.floor);x.fillStyle=sky;x.fillRect(0,0,w,h/2);
 sky=x.createLinearGradient(0,h/2,0,h);sky.addColorStop(0,theme.floor);sky.addColorStop(1,'#090d15');x.fillStyle=sky;x.fillRect(0,h/2,w,h/2);
 for(let i=1;i<8;i++){let sy=h/2+(h/2)*(1-1/(i*.6+1));x.fillStyle='#dfd1a60a';x.fillRect(0,sy,w,1);}
 const fov=Math.PI*.36,rays=Math.ceil(w/2),cw=w/rays,z=new Float32Array(rays);
 for(let i=0;i<rays;i++){
 const angle=c.a+Math.atan((i/rays-.5)*2*Math.tan(fov/2)),vx=Math.cos(angle),vy=Math.sin(angle);
 let mx=Math.floor(c.x),my=Math.floor(c.y),stepX=vx<0?-1:1,stepY=vy<0?-1:1,dx=Math.abs(1/(vx||.00001)),dy=Math.abs(1/(vy||.00001));
 let sideX=(vx<0?c.x-mx:mx+1-c.x)*dx,sideY=(vy<0?c.y-my:my+1-c.y)*dy,side=0,steps=0;
 while(steps++<48){if(sideX<sideY){sideX+=dx;mx+=stepX;side=0;}else{sideY+=dy;my+=stepY;side=1;}if(mx<0||my<0||my>=map.length||mx>=map[0].length||map[my][mx])break;}
 const dist=Math.max(.06,((side===0?(mx-c.x+(1-stepX)/2)/(vx||.00001):(my-c.y+(1-stepY)/2)/(vy||.00001)))*Math.cos(angle-c.a));
 z[i]=dist;const wallH=Math.min(h*2,h/(dist*.72)),top=(h-wallH)/2;
 const n=(Math.sin(mx*22+my*37)*32589.7)%1,base=theme.wall;
 x.fillStyle=base;x.fillRect(i*cw,top,cw+1,wallH);
 const shade=Math.min(.86,dist/18+(side?.13:0));
 x.fillStyle='rgba(6,10,18,'+shade+')';x.fillRect(i*cw,top,cw+1,wallH);
 if(Math.floor((i*cw)/Math.max(1,wallH*.5))%5===0){x.fillStyle='#1118236b';x.fillRect(i*cw,top,cw+1,wallH);}
 const grout=wallH/4;for(let b=1;b<4;b++){x.fillStyle='#15192244';x.fillRect(i*cw,top+grout*b,cw+1,Math.max(1,wallH*.009));}
 if(dist<5){x.fillStyle=theme.light;x.globalAlpha=(5-dist)/5*.055;x.fillRect(i*cw,top,cw+1,wallH);x.globalAlpha=1;}
 }
 const objs=[...g.world.enemies.filter(v=>v.hp>0).map(e=>({...e,t:e.kind})),...g.world.chests.filter(v=>!v.opened).map(e=>({...e,t:'chest'})),...g.world.nodes.filter(v=>!v.used).map(e=>({...e,t:e.kind})),...g.world.drops.map(e=>({...e,t:'drop'})),{...g.world.exit,t:'exit'}];
 objs.sort((a,b)=>Math.hypot(b.x-c.x,b.y-c.y)-Math.hypot(a.x-c.x,a.y-c.y));
 for(const o of objs){const dx=o.x-c.x,dy=o.y-c.y,d=Math.hypot(dx,dy);if(d<.15||d>23)continue;const diff=Math.atan2(Math.sin(Math.atan2(dy,dx)-c.a),Math.cos(Math.atan2(dy,dx)-c.a));if(Math.abs(diff)>fov*.9)continue;
 const xx=(.5+Math.tan(diff)/(2*Math.tan(fov/2)))*w,ray=Math.floor(xx/cw);if(ray<0||ray>=rays||d>z[ray]+.45)continue;
 const size=(o.t==='boss'?1.8:o.t==='exit'?1.55:o.t==='drop'?.49:.90),hh=Math.min(h*1.6,h/(d*.8)*size),ww=hh*.83;
 x.globalAlpha=clamp(1-d/29,.28,1);x.drawImage(sprite(o.t),xx-ww/2,h/2-hh*.61,ww,hh);x.globalAlpha=1;
 if(o.hp&&d<8&&o.hp<o.maxHp){x.fillStyle='#141018';x.fillRect(xx-25,h/2-hh*.64,50,5);x.fillStyle='#c94d44';x.fillRect(xx-25,h/2-hh*.64,50*o.hp/o.maxHp,5);}
 }
 // Mano y arma: elemento en primer plano, no modelo externo.
 const weapon=g.profile.equipment.weapon?.name||'Puños';const atk=(Date.now()-g.lastAttack)<280?Math.sin(((Date.now()-g.lastAttack)/280)*Math.PI)*34:0;
 x.save();x.translate(w*.72+atk,h+8-atk*.5);x.rotate(-.23-atk*.018);
 x.fillStyle='#624733';x.fillRect(-8,-53,24,99);x.fillStyle='#c6a16c';x.fillRect(-22,-65,49,10);
 if(/bastón|Bastón/.test(weapon)){x.fillStyle='#9b715a';x.fillRect(0,-h*.53,10,h*.58);x.fillStyle='#94dbfa';x.shadowColor='#7ceaff';x.shadowBlur=16;x.beginPath();x.arc(5,-h*.52,14,0,7);x.fill();}
 else{x.fillStyle='#c8c7bb';x.beginPath();x.moveTo(-4,-62);x.lineTo(-4,-h*.38);x.lineTo(4,-h*.52);x.lineTo(12,-h*.38);x.lineTo(12,-62);x.fill();x.fillStyle='#f8f4d7';x.fillRect(-2,-h*.36,3,h*.13);}
 x.restore();
 const fog=x.createRadialGradient(w/2,h/2,h*.15,w/2,h/2,w*.58);fog.addColorStop(0,'transparent');fog.addColorStop(1,'#040610b9');x.fillStyle=fog;x.fillRect(0,0,w,h);
}
function drawCamp(now){const rect=canvas.getBoundingClientRect(),w=canvas.width=Math.round(clamp(rect.width*.56,250,680)),h=canvas.height=Math.round(w*rect.height/Math.max(rect.width,1));const x=ctx,grad=x.createLinearGradient(0,0,0,h);grad.addColorStop(0,'#17283b');grad.addColorStop(.6,'#435a51');grad.addColorStop(1,'#121821');x.fillStyle=grad;x.fillRect(0,0,w,h);
 for(let i=0;i<9;i++){x.fillStyle='#273a3b';const xx=i*w/8;x.fillRect(xx,h*.42,8,h*.6);x.beginPath();x.moveTo(xx-28,h*.54);x.lineTo(xx,h*.18-(i%3)*h*.06);x.lineTo(xx+28,h*.54);x.fill();}
 x.fillStyle='#2d201e';x.fillRect(w*.40,h*.56,w*.2,h*.2);x.fillStyle='#6f4b31';x.fillRect(w*.40,h*.58,w*.2,h*.04);x.fillStyle='#c9a05f';x.fillRect(w*.47,h*.57,w*.06,h*.05);
 x.textAlign='center';x.fillStyle='#fae0ac';x.font=Math.max(15,w*.042)+'px Georgia';x.fillText('REFUGIO DE LOS ERRANTES',w/2,h*.38);x.font='12px system-ui';x.fillStyle='#d9c8ae';x.fillText('Aquí tu baúl está a salvo',w/2,h*.44);
}
function drawMinimap(el,large=false){if(!g.world||!el)return;const size=large?320:128;if(el.width!==size)el.width=size;if(el.height!==size)el.height=size;const x=el.getContext('2d'),map=g.world.grid,n=map.length,t=size/n,c=g.camera;
 x.clearRect(0,0,size,size);x.fillStyle='#101925';x.fillRect(0,0,size,size);
 if(!large){x.save();x.beginPath();x.arc(size/2,size/2,size/2-2,0,7);x.clip();}
 for(let y=0;y<n;y++)for(let xx=0;xx<n;xx++){const d=Math.hypot(c.x-xx-.5,c.y-y-.5);if(!large&&d>7)continue;x.fillStyle=map[y][xx]?'#2e343c':'#796e5d';x.fillRect(xx*t,y*t,t+.3,t+.3);}
 const mark=(p,color,r=3)=>{if(!p)return;x.fillStyle=color;x.beginPath();x.arc(p.x*t,p.y*t,r,0,7);x.fill();};
 mark(g.world.exit,'#70e5e2',large?5:3);
 for(const e of g.world.enemies)if(e.hp>0&&Math.hypot(e.x-c.x,e.y-c.y)<6)mark(e,'#df675a',large?4:2);
 mark(c,'#f5d18b',large?6:4);x.strokeStyle='#ffedb4';x.lineWidth=large?2:1;x.beginPath();x.moveTo(c.x*t,c.y*t);x.lineTo((c.x+Math.cos(c.a))*t,(c.y+Math.sin(c.a))*t);x.stroke();if(!large)x.restore();}
function updateHud(){if(!g.profile)return;const p=g.profile;$('floor-label').textContent='PISO '+p.checkpoint+(g.world?.boss?' · JEFE':'');
 $('hero-label').textContent=p.name.toUpperCase();$('hero-level').textContent='NIV. '+p.level;
 for(const [a,n,d] of [['hp',p.hp,p.maxHp],['mp',p.mp,p.maxMp],['xp',p.xp,p.level*75]]){$(a+'-fill').style.width=clamp(n/d*100,0,100)+'%';$(a+'-label').textContent=a.toUpperCase()+' '+Math.max(0,Math.floor(n))+'/'+d;}
 $('coin-label').textContent='◈ '+p.coins+' ORO';$('weapon-label').textContent=p.equipment.weapon?.name||'Puños';
 $('action-log').innerHTML=g.notes.slice(-3).map(n=>'<div>'+esc(n.text)+'</div>').join('');
 if(g.world){const c=g.camera,w=g.world,near=[{...w.exit,txt:'✦ PUERTA FINAL'},...w.chests.filter(v=>!v.opened).map(v=>({...v,txt:'✦ ABRIR COFRE'})),...w.nodes.filter(v=>!v.used).map(v=>({...v,txt:'✦ '+(v.kind==='fish'?'PESCAR':v.kind==='ore'?'MINAR':'RECOLECTAR')})),...w.drops.map(v=>({...v,txt:'✦ RECOGER '+v.loot.name}))].filter(p=>Math.hypot(p.x-c.x,p.y-c.y)<1.65).sort((a,b)=>Math.hypot(a.x-c.x,a.y-c.y)-Math.hypot(b.x-c.x,b.y-c.y))[0];$('hint').textContent=near?.txt||'';}}
function frame(now){requestAnimationFrame(frame);const dt=clamp((now-lastT)/1000,0,.05);lastT=now;ambience(now);
 if(!menu.classList.contains('hidden')){if(now-menuTime>35){menuTime=now;menuScene(now);}return;}
 if(gameScreen.classList.contains('hidden'))return;
 if(toastExpiry&&Date.now()>toastExpiry){$('snackbar').classList.add('hidden');toastExpiry=0;}
 if(g.status==='dungeon'&&!modal){controller(dt);g.tick(dt);if(g.status==='dead')showDeath();}
 if(g.status==='dungeon'||g.status==='door'){renderWorld(now);if(++frameNo%6===0){drawMinimap(mapCanvas);updateHud();}}
 else{if(frameNo++%3===0)drawCamp(now);}
}
requestAnimationFrame(frame);
})();
