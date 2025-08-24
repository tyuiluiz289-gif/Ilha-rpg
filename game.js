const $ = s=>document.querySelector(s);
const state = {
  node:'intro-navio',
  stats:{vigor:70, bride:0, rep:0, capacidade:1},
  flags:{faca:false,facao:false,radioQuebrado:false,sementes:false,bateria:false,alfaVisto:false},
  log:[]
};
const STORAGE_KEY='ilha_save_v1';
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function load(){ try{ Object.assign(state, JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')); }catch{} }
function reset(){ localStorage.removeItem(STORAGE_KEY); location.reload(); }
function upStats(e={}){
  for(const[k,v] of Object.entries(e)){
    if(k in state.stats){ state.stats[k]=Math.max(0,Math.min(100,state.stats[k]+v)); }
    else if(k in state.flags){ state.flags[k]=v; }
    else if(k==='_cap'){ state.stats.capacidade=Math.max(0,state.stats.capacidade+v); }
  }
}
function logPush(t){ state.log.push(t); if(state.log.length>200) state.log.shift(); }
function renderHUD(){
  $('#statVigor').textContent=state.stats.vigor;
  $('#statBride').textContent=state.stats.bride;
  $('#statRep').textContent=state.stats.rep;
  $('#statCap').textContent=state.stats.capacidade;
}
let STORY=null;
async function boot(){
  $('#btnReset').onclick=()=>{ if(confirm('Recomeçar do zero?')) reset(); };
  $('#btnExport').onclick=()=>{
    const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob); const a=document.createElement('a');
    a.href=url; a.download='ilha-save.json'; a.click(); URL.revokeObjectURL(url);
  };
  $('#fileImport').onchange=async ev=>{
    const f=ev.target.files?.[0]; if(!f) return;
    try{ Object.assign(state, JSON.parse(await f.text())); save(); render(); }catch{ alert('Arquivo inválido'); }
  };
  let deferredPrompt=null;
  window.addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); deferredPrompt=e; $('#btnInstall').style.display='inline-block'; });
  $('#btnInstall').onclick=()=>{ if(deferredPrompt) deferredPrompt.prompt(); };
  $('#docLink').onclick=(e)=>{ e.preventDefault(); alert('Abra o README no repositório para instruções.'); };
  STORY = await (await fetch('./story.json')).json();
  load(); render();
}
function getNode(id){ return STORY.nodes.find(n=>n.id===id) || STORY.nodes[0]; }
function eligible(ch){
  if(!ch.require) return true;
  if(ch.require.stat){
    const v = state.stats[ch.require.stat] ?? 0;
    if(ch.require.gte!=null && !(v>=ch.require.gte)) return false;
    if(ch.require.lte!=null && !(v<=ch.require.lte)) return false;
  }
  if(ch.require.flag){
    const f = state.flags[ch.require.flag] ?? false;
    if(ch.require.eq!=null && f!==ch.require.eq) return false;
  }
  return true;
}
function render(){
  const node=getNode(state.node);
  renderHUD();
  $('#sceneMeta').textContent=`${node.title} ${node.time?`🕒 ${node.time}`:''}`.trim();
  $('#sceneText').textContent=node.text;
  const lyro=document.getElementById('lyroBox');
  if(node.lyro){ document.getElementById('lyroText').textContent=node.lyro; lyro.classList.remove('off'); }
  else{ lyro.classList.add('off'); }
  const wrap=document.getElementById('choices'); wrap.innerHTML='';
  (node.choices||[]).forEach(ch=>{
    const btn=document.createElement('button');
    btn.disabled = ch.require && !eligible(ch);
    btn.innerHTML=`<div>${ch.text}</div>${ch.hint?`<small>${ch.hint}</small>`:''}`;
    btn.onclick=()=>{
      if(ch.effects) upStats(ch.effects);
      logPush(`• ${node.title}: ${ch.text}`);
      state.node=ch.next; save(); render();
    };
    wrap.appendChild(btn);
  });
  document.getElementById('log').textContent=state.log.slice(-40).join('\n');
}
window.addEventListener('DOMContentLoaded', boot);
