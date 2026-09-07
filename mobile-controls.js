/* Zero Division mobile / iPad control layer. Kept separate so the existing HUD/game logic stays isolated. */
(() => {
  const state = window.ZERO_DIVISION_STATE;
  const DEFAULTS = {
    'slot-primary':[0.04,0.64],'slot-main2':[0.12,0.64],'slot-sidearm':[0.04,0.80],'slot-melee':[0.12,0.80],
    'utility-slot':[0.20,0.79],'fire-button':[0.86,0.69],'ads-button':[0.76,0.67],'reload-button':[0.75,0.82],
    'firemode-button':[0.66,0.80],'jump-button':[0.87,0.57],'crouch-button':[0.78,0.59],'prone-button':[0.68,0.60],
    'lean-left':[0.12,0.55],'lean-right':[0.18,0.55], 'mobile-joystick':[0.10,0.72]
  };
  const root = document.getElementById('mobile-controls');
  const editor = document.getElementById('mobile-layout-editor');
  if (!root || !editor) return;

  let game = null;
  let lookPointer = null;
  let joystickPointer = null;
  let joystickCenter = null;
  let drag = null;
  let layout = loadLayout();

  function getGame(){ game = window.ZERO_DIVISION_GAME || game; return game; }
  function coarse(){ return matchMedia('(pointer:coarse)').matches || innerWidth <= 1024; }
  function action(action, phase='tap'){
    const g=getGame(); if(!g || !g.running) return;
    if(action==='primary'){g.currentWeaponType='primary';g.finishWeaponSwitch();return;}
    if(action==='main2'){g.currentWeaponType=(g.currentWeaponType==='primary'?'secondary':'primary');g.finishWeaponSwitch();return;}
    if(action==='sidearm'){g.currentWeaponType='secondary';g.finishWeaponSwitch();return;}
    if(action==='melee'){g.currentWeaponType='melee';g.finishWeaponSwitch();return;}
    if(action==='medkit'){g.useMedkit();return;}
    if(action==='reload'){g.startReload();return;}
    if(action==='ads'){g.ads=true;g.updateHUD();return;}
    if(action==='firemode'){g.toggleFireMode();return;}
    if(action==='jump'){g.onKey({code:'Space',repeat:false},true);return;}
    if(action==='crouch'){g.prone=false;g.crouch=!g.crouch;g.dash=false;g.updateHUD();return;}
    if(action==='prone'){g.onKey({code:'KeyP',repeat:false},true);return;}
    if(action==='lean-left'){g.onKey({code:'KeyQ',repeat:false},true);return;}
    if(action==='lean-right'){g.onKey({code:'KeyE',repeat:false},true);return;}
    if(action==='fire'){
      if(phase==='down'){g.firing=true;g._semiQueued=true;g.fire();}
      if(phase==='up'){g.firing=false;g._semiQueued=false;}
    }
  }

  root.addEventListener('pointerdown', e=>{
    const btn=e.target.closest('[data-action]'); if(!btn) return;
    e.preventDefault(); e.stopPropagation(); btn.classList.add('active');
    const a=btn.dataset.action;
    if(a==='fire') action(a,'down');
    else if(a==='ads') { action(a,'down'); btn.setPointerCapture?.(e.pointerId); }
    else if(a==='lean-left' || a==='lean-right'){ action(a,'down'); }
    else action(a,'tap');
  }, {passive:false});
  root.addEventListener('pointerup', e=>{
    const btn=e.target.closest('[data-action]'); if(!btn) return;
    e.preventDefault(); e.stopPropagation(); btn.classList.remove('active');
    const a=btn.dataset.action;
    if(a==='fire') action(a,'up');
    if(a==='ads'){const g=getGame(); if(g){g.ads=false;g.updateWeaponAnimation(0,false);g.updateHUD();}}
    if(a==='lean-left' || a==='lean-right'){const g=getGame(); if(g) g.onKey({code:a==='lean-left'?'KeyQ':'KeyE',repeat:false},false);}
  }, {passive:false});
  root.addEventListener('pointercancel', e=>{const btn=e.target.closest('[data-action]'); if(btn) btn.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:e.pointerId}));},{passive:false});

  // Virtual joystick: W/A/S/D + dash when pushed beyond the outer threshold.
  const stick=document.getElementById('mobile-joystick'), knob=stick?.querySelector('.joystick-knob');
  stick?.addEventListener('pointerdown', e=>{
    e.preventDefault();e.stopPropagation();joystickPointer=e.pointerId;stick.setPointerCapture?.(e.pointerId);joystickCenter=getCenter(stick);updateJoystick(e.clientX,e.clientY);
  }, {passive:false});
  stick?.addEventListener('pointermove', e=>{if(e.pointerId!==joystickPointer)return;e.preventDefault();updateJoystick(e.clientX,e.clientY);},{passive:false});
  const endJoy=e=>{if(e.pointerId!==joystickPointer)return;joystickPointer=null;joystickCenter=null;if(knob)knob.style.transform='translate(0,0)';setKeys({});const g=getGame();if(g)g.dash=false;};
  stick?.addEventListener('pointerup',endJoy);stick?.addEventListener('pointercancel',endJoy);

  function updateJoystick(x,y){
    const g=getGame(); if(!g || !g.running) return;
    const r=(stick.clientWidth*.5)-14; let dx=x-joystickCenter.x,dy=y-joystickCenter.y; const len=Math.hypot(dx,dy); const cl=Math.min(r,len); if(len>0.001){dx=dx/len*cl;dy=dy/len*cl;} if(knob)knob.style.transform=`translate(${dx}px,${dy}px)`;
    const nx=dx/r, ny=dy/r; let k={};
    if(Math.abs(nx)<.18 && Math.abs(ny)<.18) k={}; else { if(ny<-.22)k.KeyW=true;if(ny>.22)k.KeyS=true;if(nx<-.22)k.KeyA=true;if(nx>.22)k.KeyD=true; }
    setKeys(k); if(len>r*.72 && (k.KeyW||k.KeyS)) g.dash=true; else if(g.dash && !g.isMoving()) g.dash=false;
    if(g.isMoving()) g.updateHUD();
  }
  function setKeys(next){ const g=getGame(); if(!g)return; ['KeyW','KeyA','KeyS','KeyD'].forEach(k=>{if(g.keys[k]!==!!next[k])g.keys[k]=!!next[k];}); }

  // Right side touch-look zone for iPad (pointer events, no Pointer Lock required).
  const look=document.getElementById('mobile-look-zone');
  look?.addEventListener('pointerdown',e=>{if(!coarse()||editorVisible())return; if(e.target.closest('#mobile-controls')||e.target.closest('#mobile-layout-editor'))return; const g=getGame(); if(!g||!g.running)return; lookPointer={id:e.pointerId,x:e.clientX,y:e.clientY};look.setPointerCapture?.(e.pointerId);e.preventDefault();},{passive:false});
  look?.addEventListener('pointermove',e=>{if(!lookPointer||e.pointerId!==lookPointer.id)return;const g=getGame();if(!g)return;g.controls.touchLook(e.clientX-lookPointer.x,e.clientY-lookPointer.y);lookPointer.x=e.clientX;lookPointer.y=e.clientY;e.preventDefault();},{passive:false});
  ['pointerup','pointercancel'].forEach(t=>look?.addEventListener(t,e=>{if(lookPointer?.id===e.pointerId)lookPointer=null;}));

  // Keep labels synchronized with the actual loadout.
  function updateLabels(){
    if(!state)return;
    const a=document.getElementById('mobile-primary-label'),b=document.getElementById('mobile-sidearm-label');
    if(a)a.textContent=state.primary||'M4A1'; if(b)b.textContent=state.secondary||'P320';
    const g=getGame(); const f=document.getElementById('mobile-firemode-label');if(f)f.textContent=g?.fireMode==='semi'?'SEMI':'AUTO';
    root.querySelectorAll('[data-action]').forEach(n=>n.classList.remove('active'));
    const key=g?.currentWeaponType==='primary'?'primary':g?.currentWeaponType==='secondary'?'sidearm':'melee';
    root.querySelector(`[data-action="${key}"]`)?.classList.add('active');
  }
  setInterval(updateLabels,500);

  // 9-key opens the editor.
  addEventListener('keydown',e=>{if(e.code==='Digit9'&&!e.repeat){e.preventDefault();toggleEditor();}});
  document.getElementById('layout-close')?.addEventListener('click',()=>toggleEditor(false));
  document.getElementById('layout-save')?.addEventListener('click',()=>{saveLayout();toggleEditor(false);});
  document.getElementById('layout-reset')?.addEventListener('click',()=>{layout=structuredClone(DEFAULTS);applyLayout();saveLayout();});
  const size=document.getElementById('layout-frame-size'), opacity=document.getElementById('layout-frame-opacity');
  size?.addEventListener('input',()=>setFrame(size.value,opacity.value)); opacity?.addEventListener('input',()=>setFrame(size.value,opacity.value));

  function toggleEditor(force){
    const open=force===undefined ? editor.classList.contains('hidden') : !!force;
    editor.classList.toggle('hidden',!open);
    if(open){syncEditorStage(); applyLayoutToEditor();}
  }
  function editorVisible(){return !editor.classList.contains('hidden');}
  function syncEditorStage(){
    const sz=document.getElementById('layout-frame-size')?.value||64,op=document.getElementById('layout-frame-opacity')?.value||20;setFrame(sz,op);copyControlsToStage();
  }
  function copyControlsToStage(){
    const stage=document.getElementById('layout-stage'); if(!stage)return;
    stage.querySelectorAll('[data-action],#mobile-joystick').forEach(n=>n.remove());
    root.querySelectorAll('.mobile-control').forEach(src=>{
      const c=src.cloneNode(true);c.classList.add('layout-preview-control');c.removeAttribute('data-control');
      c.style.pointerEvents='auto'; c.style.left=''; c.style.top=''; c.style.right=''; c.style.bottom='';
      c.dataset.key=Object.keys(DEFAULTS).find(k=>src.id===k || src.classList.contains(k)) || src.id;
      if(src.id==='mobile-joystick')c.id='layout-joystick';
      stage.appendChild(c);
      c.addEventListener('pointerdown',startDrag,{passive:false});
    });
    applyLayoutToEditor();
  }
  function applyLayoutToEditor(){
    const stage=document.getElementById('layout-stage'); if(!stage)return;
    stage.querySelectorAll('.layout-preview-control').forEach(c=>{const key=c.dataset.key;if(!key)return;const p=layout[key]||DEFAULTS[key];c.style.left=(p[0]*100)+'%';c.style.top=(p[1]*100)+'%';c.style.transform='translate(-50%,-50%)';});
  }
  function startDrag(e){
    if(e.target.closest('button')===null && e.currentTarget.id!=='layout-joystick') return;
    e.preventDefault();e.stopPropagation(); const c=e.currentTarget, stage=document.getElementById('layout-stage');drag={id:e.pointerId,key:c.dataset.key,node:c,stage};c.setPointerCapture?.(e.pointerId);
    c.addEventListener('pointermove',dragMove);c.addEventListener('pointerup',endDrag,{once:true});c.addEventListener('pointercancel',endDrag,{once:true});
  }
  function dragMove(e){if(!drag||e.pointerId!==drag.id)return;const r=drag.stage.getBoundingClientRect();layout[drag.key]=[clamp((e.clientX-r.left)/r.width,.03,.97),clamp((e.clientY-r.top)/r.height,.03,.97)];drag.node.style.left=(layout[drag.key][0]*100)+'%';drag.node.style.top=(layout[drag.key][1]*100)+'%';e.preventDefault();}
  function endDrag(){if(!drag)return;drag.node.removeEventListener('pointermove',dragMove);drag=null;}
  function setFrame(sz,op){
    const fr=document.getElementById('layout-safe-frame');if(!fr)return;fr.style.width=sz+'%';fr.style.height=sz+'%';fr.style.borderColor=`rgba(217,255,95,${Number(op)/100})`;fr.style.background=`rgba(217,255,95,${Number(op)/700})`;
    const a=document.getElementById('layout-frame-size-value'),b=document.getElementById('layout-frame-opacity-value');if(a)a.textContent=sz+'%';if(b)b.textContent=op+'%';
    localStorage.setItem('zd-frame',JSON.stringify({size:Number(sz),opacity:Number(op)}));
  }
  function applySavedFrame(){const v=JSON.parse(localStorage.getItem('zd-frame')||'null');const sz=v?.size||64,op=v?.opacity||20;const a=document.getElementById('layout-frame-size'),b=document.getElementById('layout-frame-opacity');if(a)a.value=sz;if(b)b.value=op;setFrame(sz,op);}
  function applyLayout(){root.querySelectorAll('.mobile-control').forEach(n=>{const key=n.classList[1]||n.id;const p=layout[key]||DEFAULTS[key];if(!p)return;n.style.left=(p[0]*100)+'%';n.style.top=(p[1]*100)+'%';n.style.right='auto';n.style.bottom='auto';});}
  function loadLayout(){try{return Object.assign({},DEFAULTS,JSON.parse(localStorage.getItem('zd-mobile-layout')||'{}'));}catch{return structuredClone(DEFAULTS);}}
  function saveLayout(){localStorage.setItem('zd-mobile-layout',JSON.stringify(layout));applyLayout();}
  function getCenter(el){const r=el.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};}
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  applyLayout();applySavedFrame();
  addEventListener('resize',()=>{if(editorVisible())syncEditorStage();});
})();
