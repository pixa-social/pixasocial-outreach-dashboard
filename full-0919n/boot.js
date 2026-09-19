
async function loadGzB64(){
  const parts=await Promise.all([...Array(18).keys()].map(i=>fetch('p'+i+'.txt',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('p'+i+' '+r.status);return r.text()})));
  return parts.join('').replace(/\s+/g,'');
}
async function loadTracker(){
  const parts=await Promise.all([...Array(5).keys()].map(i=>fetch('tb'+i+'.txt',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('tb'+i+' '+r.status);return r.text()})));
  const b64=parts.join('').replace(/\s+/g,'');
  const bin=atob(b64);
  const bytes=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
  const blob=new Blob([bytes],{type:'text/javascript'});
  const s=document.createElement('script');
  s.src=URL.createObjectURL(blob);
  document.body.appendChild(s);
}
(async()=>{
  try{
    window.__EMBEDDED_GZ_B64__=await loadGzB64();
  }catch(e){console.error(e);document.getElementById('err').style.display='block';document.getElementById('err').textContent='Failed to load data shards: '+e;return;}
  try{ await loadTracker(); }
  catch(e){console.error(e);document.getElementById('err').style.display='block';document.getElementById('err').textContent='Failed to load tracker: '+e;}
})();
