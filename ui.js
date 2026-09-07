export const state = {
  screen:'deploy-screen',map:'city',bots:6,
  armor:'ライト',helmet:'偵察',primary:'M4A1',secondary:'P320',melee:'タクティカルナイフ',utility:'救急キット',
  muzzle:'なし',stock:'なし',sight:'なし',
  settings:{dashMode:'toggle',crouchMode:'toggle',hands:true,compass:true,sensitivity:1,shake:.35,pixelRatio:1.5,shadows:true,sky:true}
};

export const DATA={
  armor:[['ライト','軽量 / 高機動'],['プレート','標準 / バランス'],['ヘビー','重量 / 安定性']],
  helmet:[['偵察','軽量 / 低姿勢'],['タクティカル','広視野'],['ヘビー','高い防護性']],
  primary:[['M4A1','バランス型 / 30発'],['AKM','高威力 / 30発'],['SMG45','高レート / 32発']],
  secondary:[['P320','標準サブ / 17発'],['G18','高レート / 20発']],
  melee:[['タクティカルナイフ','近接装備'],['バタフライナイフ','近接装備'],['拳','徒手']],
  utility:[['救急キット','HP回復']],
  muzzle:[['標準','標準マズル'],['コンペンセータ','反動補正'],['静音モジュール','低音化']],
  stock:[['標準','標準ストック'],['軽量','軽量化'],['安定','安定型']],
  sight:[['ドットサイト','小型ドット'],['ホロ','オープンホロ'],['標準サイト','標準照準器']]
};
const $=id=>document.getElementById(id);
function renderChoices(type,elId){const el=$(elId);if(!el)return;el.innerHTML='';for(const [name,desc] of DATA[type]){const b=document.createElement('button');b.className='choice';b.innerHTML=`<b>${name}</b><small>${desc}</small>`;if(state[type]===name)b.classList.add('selected');b.onclick=()=>{state[type]=name;renderChoices(type,elId);updatePreview();};el.appendChild(b)}}
export function updatePreview(){const p=$('operator-preview');if(!p)return;p.innerHTML=`<div class="operator-doll"><div class="d-head"></div><div class="d-helmet" style="background:${helmetColor(state.helmet)}"></div><div class="d-body" style="background:${armorColor(state.armor)}"></div><div class="d-arm a1"></div><div class="d-arm a2"></div><div class="d-leg l1"></div><div class="d-leg l2"></div></div>`}
function armorColor(v){return ({'ライト':'#4e6654','プレート':'#59626b','ヘビー':'#353e44'})[v]||'#666'}
function helmetColor(v){return ({'偵察':'#36443d','タクティカル':'#44505c','ヘビー':'#262d32'})[v]||'#444'}
export function go(id){document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));$(id).classList.add('active');state.screen=id}
export function bindUI(onDeploy){
  $('open-loadout').onclick=()=>go('loadout-screen');$('open-settings').onclick=()=>go('settings-screen');$('quick-deploy').onclick=()=>go('staging-screen');$('go-staging').onclick=()=>go('staging-screen');$('deploy-btn').onclick=()=>onDeploy();
  document.querySelectorAll('[data-back]').forEach(b=>b.onclick=()=>go(b.dataset.back));
  ['armor','helmet','primary','secondary','melee','utility','muzzle','stock','sight'].forEach(type=>{const id=type+'-choices';renderChoices(type,id)});updatePreview();
  $('bot-count').oninput=e=>{$('bot-count-value').textContent=e.target.value;$('staging-bots').textContent=e.target.value;state.bots=+e.target.value};
  document.querySelectorAll('.map-option').forEach(b=>b.onclick=()=>{document.querySelectorAll('.map-option').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');state.map=b.dataset.map;$('staging-map-name').textContent=b.querySelector('b').textContent;$('map-hud').textContent=b.querySelector('b').textContent});
  $('dash-mode').onchange=e=>state.settings.dashMode=e.target.value;$('crouch-mode').onchange=e=>state.settings.crouchMode=e.target.value;$('hands-toggle').onchange=e=>state.settings.hands=e.target.checked;$('sensitivity').oninput=e=>state.settings.sensitivity=+e.target.value;$('shake-size').oninput=e=>state.settings.shake=+e.target.value;$('pixel-ratio').onchange=e=>state.settings.pixelRatio=+e.target.value;$('shadows-toggle').onchange=e=>state.settings.shadows=e.target.checked;$('sky-toggle').onchange=e=>state.settings.sky=e.target.checked;
}
