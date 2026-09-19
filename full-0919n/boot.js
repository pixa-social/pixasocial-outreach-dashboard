
async function loadGzB64(){
  const parts=await Promise.all([...Array(18).keys()].map(i=>fetch('p'+i+'.txt',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('p'+i+' '+r.status);return r.text()})));
  return parts.join('').replace(/\s+/g,'');
}
(async()=>{
  try{
    window.__EMBEDDED_GZ_B64__=await loadGzB64();
  }catch(e){console.error(e);document.getElementById('err').style.display='block';document.getElementById('err').textContent='Failed to load data shards: '+e;return;}
  const s=document.createElement('script');
  s.src='tracker.js';
  document.body.appendChild(s);
})();
