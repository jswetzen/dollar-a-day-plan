import { useState, useMemo, useEffect, useRef } from "react";
import pb from './pb.js'
import { LIDL_ITEMS } from './lidlData.js'

const FAMILY_SIZE = 5;
const DAYS = ["Mån","Tis","Ons","Tor","Fre","Lör","Sön"];
const MEALS = ["Frukost","Lunch","Middag"];
const CATS = ["Torrvaror","Kött & Fisk","Mejeri","Grönsaker","Konserver","Bröd","Övrigt"];

const MICRO_FIELDS = [
  ["fi",  "fiber",       "Fiber",        "g"],
  ["su",  "sugar",       "Socker",       "g"],
  ["sf",  "sat_fat",     "Mättat fett",  "g"],
  ["uf",  "unsat_fat",   "Omättat fett", "g"],
  ["na",  "sodium",      "Natrium",      "mg"],
  ["va",  "vit_a",       "Vit. A",       "µg"],
  ["vb6", "vit_b6",      "Vit. B6",      "mg"],
  ["vb12","vit_b12",     "Vit. B12",     "µg"],
  ["vc",  "vit_c",       "Vit. C",       "mg"],
  ["vd",  "vit_d",       "Vit. D",       "µg"],
  ["ve",  "vit_e",       "Vit. E",       "mg"],
  ["vk",  "vit_k",       "Vit. K",       "µg"],
  ["fo",  "folate",      "Folat",        "µg"],
  ["fe",  "iron",        "Järn",         "mg"],
  ["ca",  "calcium",     "Kalcium",      "mg"],
  ["mg",  "magnesium",   "Magnesium",    "mg"],
  ["k",   "potassium",   "Kalium",       "mg"],
  ["zn",  "zinc",        "Zink",         "mg"],
  ["ph",  "phosphorus",  "Fosfor",       "mg"],
  ["se",  "selenium",    "Selen",        "µg"],
  ["io",  "iodine",      "Jod",          "µg"],
  ["o3",  "omega3",      "Omega-3",      "g"],
  ["o6",  "omega6",      "Omega-6",      "g"],
  ["ch",  "cholesterol", "Kolesterol",   "mg"],
];

const f2 = n => Number(n).toFixed(2);
const ppg = f => f.price_kr / f.weight_g;
const ppk = f => f.protein ? (f.protein * f.weight_g / 100) / f.price_kr : 0;
const ppkc = f => f.kcal ? f.price_kr / (f.kcal * f.weight_g / 100) * 100 : 0;
const rcost = (r,foods) => r.ings.reduce((s,i)=>{ const f=foods.find(x=>x.id===i.fid); return f?s+ppg(f)*i.g:s; },0);
const rnut = (r,foods) => {
  const t={kc:0,pr:0,cb:0,fa:0};
  MICRO_FIELDS.forEach(([,db])=>{ t[db]=0; });
  r.ings.forEach(i=>{ const f=foods.find(x=>x.id===i.fid); if(!f) return; const ratio=i.g/100;
    t.kc+=(f.kcal||0)*ratio; t.pr+=(f.protein||0)*ratio; t.cb+=(f.carbs||0)*ratio; t.fa+=(f.fat||0)*ratio;
    MICRO_FIELDS.forEach(([,db])=>{ t[db]+=(f[db]||0)*ratio; });
  });
  const out={kc:Math.round(t.kc/r.srv),pr:Math.round(t.pr/r.srv),cb:Math.round(t.cb/r.srv),fa:Math.round(t.fa/r.srv)};
  MICRO_FIELDS.forEach(([,db])=>{ out[db]=Math.round(t[db]/r.srv*10)/10; });
  return out;
};

const INP = {width:"100%",border:"1.5px solid #d4ead4",borderRadius:8,padding:"8px 12px",fontSize:14,fontFamily:"inherit",color:"#1a3a1a",background:"#f7fcf7"};
const FL = {fontSize:11,fontWeight:800,color:"#6b9a6b",letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:4,display:"block"};

function Modal({title,onClose,children}){
  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.22)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#fff",borderRadius:18,padding:28,width:"100%",maxWidth:500,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 64px rgba(0,80,0,0.14)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{fontFamily:"'Lora',serif",fontSize:19,fontWeight:700,color:"#166534"}}>{title}</div>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:24,cursor:"pointer",color:"#9ab89a",lineHeight:1}}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FoodModal({existing, onSave, onClose}){
  const microInit = Object.fromEntries(MICRO_FIELDS.map(([k,db])=>[k, existing?String(existing[db]||""):""]));
  const init = existing
    ? {name:existing.name, store:existing.store||"", wg:existing.weight_g!=null?String(existing.weight_g):"", kr:String(existing.price_kr), cat:existing.category||"Torrvaror",
       kc:String(existing.kcal||""), pr:String(existing.protein||""), cb:String(existing.carbs||""), fa:String(existing.fat||""), ...microInit}
    : {name:"",store:"",wg:"",kr:"",cat:"Torrvaror",kc:"",pr:"",cb:"",fa:"", ...microInit};
  const [v,setV]=useState(init);
  const [showMicro,setShowMicro]=useState(false);
  const set=k=>e=>setV(p=>({...p,[k]:e.target.value}));
  const ok=v.name.trim()&&v.wg&&v.kr;
  const isEdit = existing?.id;
  const title = isEdit ? "Redigera vara" : "Lägg till vara";

  function handleSave() {
    if (!ok) return;
    const microPayload = Object.fromEntries(MICRO_FIELDS.map(([k,db])=>[db, parseFloat(v[k])||null]));
    onSave({...v, ...microPayload});
    onClose();
  }

  return (
    <Modal title={title} onClose={onClose}>
      <div style={{marginBottom:10}}><label style={FL}>Namn</label><input style={INP} placeholder="t.ex. Havregryn" value={v.name} onChange={set("name")} /></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>
        <div style={{marginBottom:10}}><label style={FL}>Butik</label><input style={INP} placeholder="ICA" value={v.store} onChange={set("store")} /></div>
        <div style={{marginBottom:10}}><label style={FL}>Kategori</label><select style={INP} value={v.cat} onChange={set("cat")}>{CATS.map(c=><option key={c}>{c}</option>)}</select></div>
        <div style={{marginBottom:10}}><label style={FL}>Vikt (g)</label><input style={INP} type="number" min="1" placeholder="500" value={v.wg} onChange={set("wg")} /></div>
        <div style={{marginBottom:16}}><label style={FL}>Pris (kr)</label><input style={INP} type="number" min="0" step="0.1" placeholder="19.90" value={v.kr} onChange={set("kr")} /></div>
      </div>
      <div style={{background:"#f0f9f0",borderRadius:12,padding:14,marginBottom:12}}>
        <div style={{fontSize:11,fontWeight:800,color:"#4a8a4a",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:10}}>Näringsvärde / 100 g (valfritt)</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>
          {[["kc","Kcal"],["pr","Protein"],["cb","Kolhyd."],["fa","Fett"]].map(([k,l])=>(
            <div key={k}><label style={FL}>{l}</label><input style={{...INP,background:"#fff"}} type="number" min="0" placeholder="0" value={v[k]} onChange={set(k)} /></div>
          ))}
        </div>
      </div>
      <div style={{marginBottom:16}}>
        <button onClick={()=>setShowMicro(p=>!p)}
          style={{width:"100%",border:"1.5px dashed #4a8a4a",borderRadius:8,padding:"7px 12px",background:"none",color:"#4a8a4a",fontFamily:"inherit",fontSize:12,fontWeight:700,cursor:"pointer",textAlign:"left"}}>
          {showMicro?"▲":"▼"} Mikronäringsämnen
        </button>
        {showMicro&&(
          <div style={{background:"#f0f9f0",borderRadius:"0 0 10px 10px",padding:12,borderTop:"none",border:"1.5px dashed #4a8a4a",borderTopWidth:0}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {MICRO_FIELDS.map(([k,,label,unit])=>(
                <div key={k}>
                  <label style={FL}>{label} ({unit})</label>
                  <input style={{...INP,background:"#fff"}} type="number" min="0" step="0.01" placeholder="0" value={v[k]} onChange={set(k)} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <button disabled={!ok} onClick={handleSave}
        style={{width:"100%",padding:12,borderRadius:10,border:"none",background:ok?"#22c55e":"#c8e8c8",color:ok?"#fff":"#9ab89a",fontFamily:"inherit",fontSize:15,fontWeight:800,cursor:ok?"pointer":"default",transition:"background 0.2s"}}>
        {isEdit ? "Spara ändringar" : "Spara vara"}
      </button>
    </Modal>
  );
}

function LidlSearchModal({onSelect,onClose}){
  const [q,setQ]=useState("");
  const inputRef=useRef(null);
  useEffect(()=>{inputRef.current?.focus();},[]);
  const results=useMemo(()=>{
    if(!q.trim()) return [];
    const lq=q.toLowerCase();
    return LIDL_ITEMS.filter(i=>i.name.toLowerCase().includes(lq)).slice(0,80);
  },[q]);
  return (
    <Modal title="Sök i Lidl-import" onClose={onClose}>
      <input ref={inputRef} value={q} onChange={e=>setQ(e.target.value)} placeholder="Sök produkt… (t.ex. banan, havre)"
        style={{...INP,marginBottom:12}} />
      {q.trim()&&results.length===0&&<div style={{textAlign:"center",padding:"24px 0",color:"#9ab89a",fontSize:13}}>Inga träffar</div>}
      {results.length>0&&(
        <div style={{maxHeight:380,overflowY:"auto",borderRadius:10,border:"1.5px solid #d4ead4"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead>
              <tr style={{background:"#f0f9f0",position:"sticky",top:0}}>
                {["Produkt","Pris","Vikt","Datum"].map(h=>(
                  <th key={h} style={{padding:"8px 10px",textAlign:"left",fontSize:10,fontWeight:800,color:"#6b9a6b",textTransform:"uppercase",letterSpacing:"0.06em",whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((item,i)=>(
                <tr key={item.name} onClick={()=>{onSelect(item);onClose();}}
                  style={{borderTop:"1px solid #f0f4f0",background:i%2===0?"#fff":"#fafdf8",cursor:"pointer"}}
                  onMouseEnter={e=>e.currentTarget.style.background="#e8f5e8"}
                  onMouseLeave={e=>e.currentTarget.style.background=i%2===0?"#fff":"#fafdf8"}>
                  <td style={{padding:"9px 10px",fontWeight:700,maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</td>
                  <td style={{padding:"9px 10px",whiteSpace:"nowrap"}}>{item.price_kr.toFixed(2)} kr</td>
                  <td style={{padding:"9px 10px",color:"#7aaa7a",whiteSpace:"nowrap"}}>{item.weight_g!=null?`${item.weight_g}g`:"—"}</td>
                  <td style={{padding:"9px 10px",color:"#9ab89a",whiteSpace:"nowrap",fontSize:11}}>{item.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!q.trim()&&<div style={{textAlign:"center",padding:"24px 0",color:"#9ab89a",fontSize:13}}>Börja skriva för att söka bland {LIDL_ITEMS.length} Lidl-produkter</div>}
    </Modal>
  );
}

function RecipeModal({foods,existing,onSave,onClose}){
  const [name,setName]=useState(existing?existing.name:"");
  const [srv,setSrv]=useState(existing?String(existing.srv):"4");
  const [ings,setIngs]=useState(existing?existing.ings.map(i=>({fid:i.fid,g:String(i.g)})):[{fid:"",g:""}]);
  const addRow=()=>setIngs(p=>[...p,{fid:"",g:""}]);
  const upd=(i,k,val)=>setIngs(p=>{const a=[...p];a[i]={...a[i],[k]:val};return a;});
  const del=i=>setIngs(p=>p.filter((_,j)=>j!==i));
  const ok=name.trim()&&srv&&ings.some(r=>r.fid&&r.g);
  return (
    <Modal title={existing?"Redigera recept":"Lägg till recept"} onClose={onClose}>
      <div style={{marginBottom:10}}><label style={FL}>Receptnamn</label><input style={INP} placeholder="t.ex. Köttbullar" value={name} onChange={e=>setName(e.target.value)} /></div>
      <div style={{marginBottom:16}}><label style={FL}>Portioner</label><input style={INP} type="number" min="1" placeholder="4" value={srv} onChange={e=>setSrv(e.target.value)} /></div>
      <label style={FL}>Ingredienser</label>
      {ings.map((row,i)=>(
        <div key={i} style={{display:"flex",gap:8,marginBottom:8,alignItems:"center"}}>
          <select style={{...INP,flex:2}} value={row.fid} onChange={e=>upd(i,"fid",e.target.value)}>
            <option value="">Välj vara…</option>
            {foods.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <input style={{...INP,flex:1}} type="number" min="1" placeholder="gram" value={row.g} onChange={e=>upd(i,"g",e.target.value)} />
          <button onClick={()=>del(i)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#fca5a5",padding:"0 2px",lineHeight:1}}>×</button>
        </div>
      ))}
      <button onClick={addRow} style={{width:"100%",border:"1.5px dashed #b0d4b0",borderRadius:8,padding:8,background:"none",color:"#4a8a4a",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",marginTop:2,marginBottom:18}}>
        + Lägg till ingrediens
      </button>
      <button disabled={!ok} onClick={()=>{if(ok){onSave({name,srv:parseInt(srv),ings:ings.filter(r=>r.fid&&r.g).map(r=>({fid:r.fid,g:parseFloat(r.g)}))});onClose();}}}
        style={{width:"100%",padding:12,borderRadius:10,border:"none",background:ok?"#22c55e":"#c8e8c8",color:ok?"#fff":"#9ab89a",fontFamily:"inherit",fontSize:15,fontWeight:800,cursor:ok?"pointer":"default"}}>
        {existing?"Spara ändringar":"Spara recept"}
      </button>
    </Modal>
  );
}

function normaliseRecipes(rs) {
  return rs.map(r => ({
    ...r,
    srv: r.servings,
    ings: (r.expand?.recipe_ingredients_via_recipe ?? []).map(ri => ({
      fid: ri.food,
      g: ri.grams,
      foodRecord: ri.expand?.food,
    }))
  }))
}

export default function App(){
  const [tab,setTab]=useState("dash");
  const [foods,setFoods]=useState([]);
  const [recipes,setRecipes]=useState([]);
  const [loading,setLoading]=useState(true);
  const [plan,setPlan]=useState({});
  const [q,setQ]=useState("");
  const [sortKey,setSortKey]=useState('ppg');
  const [sortDir,setSortDir]=useState(1);
  const [showF,setShowF]=useState(false);
  const [editFood,setEditFood]=useState(null);
  const [showR,setShowR]=useState(false);
  const [editRecipe,setEditRecipe]=useState(null);
  const [showLidl,setShowLidl]=useState(false);
  const [lidlPrefill,setLidlPrefill]=useState(null);
  const [showNutDetail,setShowNutDetail]=useState(false);
  const [showPlanNut,setShowPlanNut]=useState(false);
  const planRecordsRef = useRef({});

  useEffect(() => {
    async function load() {
      try {
        const [fs, rs, planRecords] = await Promise.all([
          pb.collection('foods').getFullList({ sort: 'name' }),
          pb.collection('recipes').getFullList({
            expand: 'recipe_ingredients_via_recipe.food'
          }),
          pb.collection('meal_plan').getFullList()
        ])
        setFoods(fs)
        setRecipes(normaliseRecipes(rs))
        const planMap = {};
        const planRecs = {};
        for (const r of planRecords) {
          const key = `${r.day}-${r.meal_slot}`;
          planMap[key] = r.recipe;
          planRecs[key] = r;
        }
        setPlan(planMap);
        planRecordsRef.current = planRecs;
      } catch (err) {
        console.error('Failed to load data:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function saveFood(v) {
    const microPayload = Object.fromEntries(MICRO_FIELDS.map(([,db])=>[db, v[db]]));
    const payload = {
      name: v.name.trim(), store: v.store.trim(), category: v.cat,
      weight_g: parseFloat(v.wg), price_kr: parseFloat(v.kr),
      kcal: parseFloat(v.kc) || 0, protein: parseFloat(v.pr) || 0,
      carbs: parseFloat(v.cb) || 0, fat: parseFloat(v.fa) || 0,
      ...microPayload,
    }
    try {
      if (editFood) {
        const updated = await pb.collection('foods').update(editFood.id, payload)
        setFoods(p => p.map(x => x.id === updated.id ? updated : x))
        setEditFood(null)
      } else {
        const created = await pb.collection('foods').create(payload)
        setFoods(p => [...p, created])
      }
    } catch (err) {
      console.error('Failed to save food:', err)
    }
  }

  async function saveRecipe(r) {
    try {
      const recipeRecord = await pb.collection('recipes').create({
        name: r.name,
        servings: r.srv,
      })
      for (const ing of r.ings) {
        await pb.collection('recipe_ingredients').create({
          recipe: recipeRecord.id,
          food: ing.fid,
          grams: ing.g,
        })
      }
      const fresh = await pb.collection('recipes').getFullList({
        expand: 'recipe_ingredients_via_recipe.food'
      })
      setRecipes(normaliseRecipes(fresh))
    } catch (err) {
      console.error('Failed to save recipe:', err)
    }
  }

  async function updateRecipe(id, r) {
    try {
      await pb.collection('recipes').update(id, { name: r.name, servings: r.srv })
      const existing = await pb.collection('recipe_ingredients').getFullList({ filter: `recipe="${id}"` })
      for (const ri of existing) {
        await pb.collection('recipe_ingredients').delete(ri.id)
      }
      for (const ing of r.ings) {
        await pb.collection('recipe_ingredients').create({ recipe: id, food: ing.fid, grams: ing.g })
      }
      const fresh = await pb.collection('recipes').getFullList({ expand: 'recipe_ingredients_via_recipe.food' })
      setRecipes(normaliseRecipes(fresh))
    } catch (err) {
      console.error('Failed to update recipe:', err)
    }
  }

  async function deleteFood(id) {
    try {
      await pb.collection('foods').delete(id)
      setFoods(p => p.filter(x => x.id !== id))
    } catch (err) {
      console.error('Failed to delete food:', err)
      alert('Kunde inte ta bort varan. Den används troligen i ett recept.')
    }
  }

  async function setPlanSlot(key, recipeId) {
    const [day, ...rest] = key.split('-');
    const meal_slot = rest.join('-');
    const existing = planRecordsRef.current[key];
    if (recipeId) {
      if (existing) {
        const updated = await pb.collection('meal_plan').update(existing.id, { recipe: recipeId });
        planRecordsRef.current[key] = updated;
      } else {
        const created = await pb.collection('meal_plan').create({ week_start: "current", day, meal_slot, recipe: recipeId });
        planRecordsRef.current[key] = created;
      }
      setPlan(p => ({ ...p, [key]: recipeId }));
    } else {
      if (existing) {
        await pb.collection('meal_plan').delete(existing.id);
        delete planRecordsRef.current[key];
      }
      setPlan(p => { const n = { ...p }; delete n[key]; return n; });
    }
  }

  async function deleteRecipe(id) {
    try {
      await pb.collection('recipes').delete(id)
      setRecipes(p => p.filter(x => x.id !== id))
    } catch (err) {
      console.error('Failed to delete recipe:', err)
    }
  }

  const SORT = {
    name:  (a,b) => a.name.localeCompare(b.name),
    store: (a,b) => (a.store||"").localeCompare(b.store||""),
    cat:   (a,b) => (a.category||"").localeCompare(b.category||""),
    wg:    (a,b) => a.weight_g - b.weight_g,
    kr:    (a,b) => a.price_kr - b.price_kr,
    ppg:   (a,b) => ppg(a) - ppg(b),
    ppkc:  (a,b) => ppkc(a) - ppkc(b),
    ppk:   (a,b) => ppk(b) - ppk(a),
  };
  function handleSort(key) {
    setSortKey(prev => {
      if (prev === key) { setSortDir(d => -d); return key; }
      setSortDir(key === 'ppk' ? -1 : 1);
      return key;
    });
  }
  const flist=useMemo(()=>foods
    .filter(f=>f.name.toLowerCase().includes(q.toLowerCase())||(f.store||"").toLowerCase().includes(q.toLowerCase()))
    .sort((a,b)=>sortDir*(SORT[sortKey]?.(a,b)??0))
  ,[foods,q,sortKey,sortDir]);

  const planned=useMemo(()=>Object.entries(plan).flatMap(([key,rid])=>{
    const r=recipes.find(x=>x.id===rid); if(!r) return [];
    const c=rcost(r,foods); return [{key,r,c,cpp:c/r.srv}];
  }),[plan,recipes,foods]);

  const wkSpent=planned.reduce((s,m)=>s+m.c,0);
  const wkBudget=DAYS.length*MEALS.length*FAMILY_SIZE*1;
  const budPct=Math.min(wkSpent/wkBudget*100,100);

  const dayNuts=useMemo(()=>{
    const result={};
    for(const day of DAYS){
      const tot={kc:0,pr:0,cb:0,fa:0};
      let hasMeals=false;
      for(const meal of MEALS){
        const rid=plan[`${day}-${meal}`];
        const r=rid?recipes.find(x=>x.id===rid):null;
        if(!r) continue;
        hasMeals=true;
        const n=rnut(r,foods);
        tot.kc+=n.kc; tot.pr+=n.pr; tot.cb+=n.cb; tot.fa+=n.fa;
      }
      result[day]=hasMeals?{kc:Math.round(tot.kc/FAMILY_SIZE),pr:Math.round(tot.pr/FAMILY_SIZE),cb:Math.round(tot.cb/FAMILY_SIZE),fa:Math.round(tot.fa/FAMILY_SIZE)}:null;
    }
    return result;
  },[plan,recipes,foods]);

  const weeklyAvgNut=useMemo(()=>{
    const days=Object.values(dayNuts).filter(Boolean);
    if(!days.length) return null;
    return {
      kc:Math.round(days.reduce((s,d)=>s+d.kc,0)/days.length),
      pr:Math.round(days.reduce((s,d)=>s+d.pr,0)/days.length),
      cb:Math.round(days.reduce((s,d)=>s+d.cb,0)/days.length),
      fa:Math.round(days.reduce((s,d)=>s+d.fa,0)/days.length),
    };
  },[dayNuts]);

  const TABS=[{id:"dash",em:"🏠",lb:"Översikt"},{id:"foods",em:"🛒",lb:"Varor"},{id:"recs",em:"📖",lb:"Recept"},{id:"plan",em:"📅",lb:"Planering"}];

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', color:'#86b886', fontSize:16, fontWeight:700 }}>
      Laddar… 🥦
    </div>
  )

  return (
    <div style={{fontFamily:"'Nunito','Segoe UI',sans-serif",background:"#f2faf2",minHeight:"100vh",color:"#1a3a1a"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Lora:wght@600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        input,select{font-family:inherit;}
        input:focus,select:focus{outline:none;border-color:#22c55e!important;box-shadow:0 0 0 3px rgba(34,197,94,0.15);}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-thumb{background:#b0d4b0;border-radius:4px;}
      `}</style>

      {/* ── Header ── */}
      <div style={{background:"#fff",borderBottom:"2px solid #dceedc",position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:960,margin:"0 auto",padding:"12px 16px 0"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <span style={{fontSize:26}}>🥦</span>
            <div>
              <div style={{fontFamily:"'Lora',serif",fontSize:19,fontWeight:700,color:"#166534",lineHeight:1.1}}>Matsedel</div>
              <div style={{fontSize:11,color:"#86b886",fontWeight:700}}>{FAMILY_SIZE} i familjen · 1 kr/pers/mål</div>
            </div>
          </div>
          <div style={{display:"flex",overflowX:"auto",gap:0,WebkitOverflowScrolling:"touch",scrollbarWidth:"none"}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{
                flexShrink:0,border:"none",background:"none",
                borderBottom:tab===t.id?"3px solid #22c55e":"3px solid transparent",
                padding:"6px 14px 10px",fontFamily:"inherit",fontWeight:800,fontSize:13,
                color:tab===t.id?"#16a34a":"#6b9a6b",cursor:"pointer",whiteSpace:"nowrap",transition:"color 0.15s"
              }}><span style={{marginRight:5}}>{t.em}</span>{t.lb}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{maxWidth:960,margin:"0 auto",padding:"20px 16px 60px"}}>

        {/* ── OVERVIEW ── */}
        {tab==="dash" && (
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(175px,1fr))",gap:12,marginBottom:16}}>
              <div style={{background:"#fff",borderRadius:14,padding:18,boxShadow:"0 2px 10px rgba(0,80,0,0.07)",gridColumn:"span 2"}}>
                <div style={{fontSize:11,fontWeight:800,color:"#86b886",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:4}}>Veckans budget</div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:8}}>
                  <span style={{fontFamily:"'Lora',serif",fontSize:28,fontWeight:700,color:"#166534"}}>{f2(wkSpent)} kr</span>
                  <span style={{fontSize:13,color:"#9ab89a"}}>av {f2(wkBudget)} kr</span>
                </div>
                <div style={{background:"#e8f5e8",borderRadius:99,height:8,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${budPct}%`,background:budPct>90?"#f87171":budPct>70?"#fb923c":"#4ade80",borderRadius:99,transition:"width 0.5s"}} />
                </div>
                <div style={{fontSize:12,color:"#9ab89a",marginTop:6}}>{planned.length} mål planerade · {wkBudget-wkSpent>0?`${f2(wkBudget-wkSpent)} kr kvar`:"Över budget!"}</div>
              </div>
              <div style={{background:"#fff",borderRadius:14,padding:18,boxShadow:"0 2px 10px rgba(0,80,0,0.07)"}}>
                <div style={{fontSize:11,fontWeight:800,color:"#86b886",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:4}}>Kr/pers snitt</div>
                <div style={{fontFamily:"'Lora',serif",fontSize:28,fontWeight:700,color:"#166534"}}>{planned.length>0?f2(planned.reduce((s,m)=>s+m.cpp,0)/planned.length):"—"}</div>
                <div style={{fontSize:12,color:"#9ab89a",marginTop:4}}>per mål</div>
              </div>
              <div style={{background:"#fff",borderRadius:14,padding:18,boxShadow:"0 2px 10px rgba(0,80,0,0.07)"}}>
                <div style={{fontSize:11,fontWeight:800,color:"#86b886",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:4}}>Databas</div>
                <div style={{fontFamily:"'Lora',serif",fontSize:28,fontWeight:700,color:"#166534"}}>{foods.length}</div>
                <div style={{fontSize:12,color:"#9ab89a",marginTop:4}}>varor · {recipes.length} recept</div>
              </div>
            </div>
            {planned.length>0?(
              <div style={{background:"#fff",borderRadius:14,padding:18,boxShadow:"0 2px 10px rgba(0,80,0,0.07)"}}>
                <div style={{fontSize:14,fontWeight:800,color:"#166534",marginBottom:12}}>Planerade mål</div>
                {planned.map(({key,r,c,cpp})=>(
                  <div key={key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 12px",background:"#f2faf2",borderRadius:10,marginBottom:6,flexWrap:"wrap",gap:6}}>
                    <div><span style={{fontSize:12,color:"#9ab89a",marginRight:8}}>{key.replace("-"," · ")}</span><span style={{fontWeight:700,fontSize:14}}>{r.name}</span></div>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}>
                      <span style={{background:cpp<=1?"#dcfce7":cpp<=1.5?"#fef9c3":"#fee2e2",borderRadius:99,padding:"2px 10px",fontSize:11,fontWeight:800}}>{f2(cpp)} kr/pers</span>
                      <span style={{fontSize:12,color:"#9ab89a"}}>{f2(c)} kr</span>
                    </div>
                  </div>
                ))}
              </div>
            ):(
              <div style={{textAlign:"center",padding:"48px 20px",color:"#9ab89a"}}>
                <div style={{fontSize:44,marginBottom:10}}>📅</div>
                <div style={{fontWeight:800,fontSize:16,color:"#4a7a4a"}}>Inga mål planerade än</div>
                <div style={{fontSize:13,marginTop:6}}>Gå till Planering och välj recept för varje dag!</div>
              </div>
            )}
          </div>
        )}

        {/* ── FOODS ── */}
        {tab==="foods" && (
          <div>
            <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
              <input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔍  Sök vara eller butik…"
                style={{...INP,flex:"1 1 180px",borderRadius:10,border:"1.5px solid #d4ead4"}} />
              <button onClick={()=>setShowLidl(true)}
                style={{background:"#fff",border:"1.5px solid #22c55e",borderRadius:10,padding:"0 16px",height:42,color:"#16a34a",fontFamily:"inherit",fontWeight:800,fontSize:14,cursor:"pointer",whiteSpace:"nowrap"}}>
                Sök Lidl-import
              </button>
              <button onClick={()=>{setEditFood(null);setLidlPrefill(null);setShowF(true);}}
                style={{background:"#22c55e",border:"none",borderRadius:10,padding:"0 20px",height:42,color:"#fff",fontFamily:"inherit",fontWeight:800,fontSize:14,cursor:"pointer",whiteSpace:"nowrap"}}>
                + Ny vara
              </button>
            </div>
            <div style={{background:"#fff",borderRadius:14,overflow:"hidden",boxShadow:"0 2px 10px rgba(0,80,0,0.07)"}}>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:480}}>
                  <thead>
                    <tr style={{background:"#f0f9f0"}}>
                      {[["Vara","name"],["Butik","store"],["Kategori","cat"],["Vikt","wg"],["Pris","kr"],["kr/100g","ppg"],["kr/100kc","ppkc"],["g prot/kr","ppk"]].map(([h,k])=>(
                        <th key={h} onClick={()=>handleSort(k)} style={{padding:"10px 12px",textAlign:"left",fontSize:10,fontWeight:800,color:sortKey===k?"#16a34a":"#6b9a6b",textTransform:"uppercase",letterSpacing:"0.06em",whiteSpace:"nowrap",cursor:"pointer",userSelect:"none"}}>
                          {h}{sortKey===k?(sortDir===1?" ▲":" ▼"):""}
                        </th>
                      ))}
                      <th style={{padding:"10px 12px"}}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {flist.length===0&&<tr><td colSpan={9} style={{padding:28,textAlign:"center",color:"#9ab89a"}}>Inga varor hittades</td></tr>}
                    {flist.map((food,i)=>{
                      const rate=ppg(food)*100;
                      const prot=ppk(food);
                      const kcrate=ppkc(food);
                      return (
                        <tr key={food.id} style={{borderTop:"1px solid #f0f4f0",background:i%2===0?"#fff":"#fafdf8"}}>
                          <td style={{padding:"10px 12px",fontWeight:700}}>{food.name}</td>
                          <td style={{padding:"10px 12px",color:"#7aaa7a",fontSize:12}}>{food.store}</td>
                          <td style={{padding:"10px 12px"}}><span style={{background:"#e8f4e8",borderRadius:99,padding:"2px 8px",fontSize:11,fontWeight:700}}>{food.category}</span></td>
                          <td style={{padding:"10px 12px",color:"#7aaa7a"}}>{food.weight_g}g</td>
                          <td style={{padding:"10px 12px"}}>{f2(food.price_kr)} kr</td>
                          <td style={{padding:"10px 12px",fontWeight:800,color:rate<5?"#16a34a":rate<20?"#ca8a04":"#dc2626"}}>{f2(rate)}</td>
                          <td style={{padding:"10px 12px",fontWeight:800,color:kcrate>0?(kcrate<5?"#16a34a":kcrate<15?"#ca8a04":"#dc2626"):"#e5e7eb"}}>
                            {kcrate>0?f2(kcrate):"—"}
                          </td>
                          <td style={{padding:"10px 12px",fontWeight:800,color:prot>0?(prot>=2?"#16a34a":prot>=1?"#ca8a04":"#9ab89a"):"#e5e7eb"}}>
                            {prot>0?f2(prot):"—"}
                          </td>
                          <td style={{padding:"10px 8px"}}>
                            <div style={{display:"flex",gap:4}}>
                              <button onClick={()=>{setEditFood(food);setShowF(true);}} style={{background:"none",border:"none",color:"#86b886",cursor:"pointer",fontSize:15,lineHeight:1,padding:"0 3px"}} title="Redigera">✏️</button>
                              <button onClick={()=>{ if(window.confirm(`Ta bort "${food.name}"?`)) deleteFood(food.id); }} style={{background:"none",border:"none",color:"#fca5a5",cursor:"pointer",fontSize:17,lineHeight:1,padding:"0 2px"}} title="Ta bort">×</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            {showF&&<FoodModal existing={editFood||lidlPrefill} onSave={saveFood} onClose={()=>{setShowF(false);setEditFood(null);setLidlPrefill(null);}} />}
            {showLidl&&<LidlSearchModal onSelect={item=>{setLidlPrefill({name:item.name,store:"Lidl",weight_g:item.weight_g,price_kr:item.price_kr});setShowF(true);}} onClose={()=>setShowLidl(false)} />}
          </div>
        )}

        {/* ── RECIPES ── */}
        {tab==="recs" && (
          <div>
            <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14,gap:10,alignItems:"center"}}>
              <button onClick={()=>setShowNutDetail(p=>!p)}
                style={{background:"#fff",border:"1.5px solid #d4ead4",borderRadius:10,padding:"0 14px",height:36,color:"#4a8a4a",fontFamily:"inherit",fontWeight:700,fontSize:13,cursor:"pointer"}}>
                {showNutDetail?"▲":"▼"} Mikronäringsämnen
              </button>
              <button onClick={()=>setShowR(true)}
                style={{background:"#22c55e",border:"none",borderRadius:10,padding:"0 20px",height:42,color:"#fff",fontFamily:"inherit",fontWeight:800,fontSize:14,cursor:"pointer"}}>
                + Nytt recept
              </button>
            </div>
            {recipes.length===0&&(
              <div style={{textAlign:"center",padding:48,color:"#9ab89a"}}>
                <div style={{fontSize:40,marginBottom:10}}>📖</div>
                <div style={{fontWeight:800,fontSize:16,color:"#4a7a4a"}}>Inga recept än</div>
              </div>
            )}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(265px,1fr))",gap:14}}>
              {recipes.map(recipe=>{
                const cost=rcost(recipe,foods); const cpp=cost/recipe.srv;
                const nut=rnut(recipe,foods);
                const hasMicro=MICRO_FIELDS.some(([,db])=>(nut[db]||0)>0);
                return (
                  <div key={recipe.id} style={{background:"#fff",borderRadius:14,padding:18,boxShadow:"0 2px 10px rgba(0,80,0,0.07)"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                      <div>
                        <div style={{fontFamily:"'Lora',serif",fontSize:17,fontWeight:700,color:"#166534"}}>{recipe.name}</div>
                        <div style={{fontSize:12,color:"#9ab89a",marginTop:2}}>{recipe.srv} portioner</div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontFamily:"'Lora',serif",fontSize:18,fontWeight:700,color:cpp<=1?"#16a34a":cpp<=1.5?"#ca8a04":"#dc2626"}}>{f2(cpp)} kr</div>
                        <div style={{fontSize:11,color:"#9ab89a"}}>per person</div>
                      </div>
                    </div>
                    {nut.kc>0&&(
                      <div style={{marginBottom:6}}>
                        <div style={{display:"flex",gap:5,marginBottom:4}}>
                          {[["🔥",`${nut.kc} kcal`],["💪",`${nut.pr}g prot`],["🌾",`${nut.cb}g kolh`],["🥑",`${nut.fa}g fett`]].map(([em,val])=>(
                            <div key={val} style={{flex:1,background:"#f0f9f0",borderRadius:8,padding:"5px 3px",textAlign:"center"}}>
                              <div style={{fontSize:12}}>{em}</div><div style={{fontSize:10,fontWeight:800,color:"#4a7a4a"}}>{val}</div>
                            </div>
                          ))}
                        </div>
                        {hasMicro&&showNutDetail&&(
                          <div style={{background:"#f7fdf7",borderRadius:8,padding:"8px 10px",marginTop:4}}>
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"3px 10px"}}>
                              {MICRO_FIELDS.filter(([,db])=>(nut[db]||0)>0).map(([,db,label,unit])=>(
                                <div key={db} style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#4a7a4a"}}>
                                  <span>{label}</span>
                                  <span style={{fontWeight:700}}>{nut[db]} {unit}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <div style={{borderTop:"1px solid #e8f4e8",paddingTop:8}}>
                      {recipe.ings.map(ing=>{
                        const food=foods.find(x=>x.id===ing.fid); if(!food) return null;
                        return (
                          <div key={ing.fid} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"3px 0",color:"#4a7a4a"}}>
                            <span>{food.name} <span style={{color:"#9ab89a"}}>{ing.g}g</span></span>
                            <span style={{color:"#9ab89a"}}>{f2(ppg(food)*ing.g)} kr</span>
                          </div>
                        );
                      })}
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:13,paddingTop:8,marginTop:4,borderTop:"1px solid #e8f4e8",fontWeight:800,color:"#166534"}}>
                        <span>Totalt</span><span>{f2(cost)} kr</span>
                      </div>
                    </div>
                    <button onClick={()=>{ setEditRecipe(recipe); setShowR(true); }}
                      style={{background:"none",border:"1px solid #b0d4b0",borderRadius:8,padding:"5px 10px",color:"#4a8a4a",fontFamily:"inherit",fontSize:12,cursor:"pointer",marginTop:12,marginRight:6}}>
                      Redigera
                    </button>
                    <button onClick={()=>{ if(window.confirm(`Ta bort "${recipe.name}"?`)) deleteRecipe(recipe.id); }}
                      style={{background:"none",border:"1px solid #fca5a5",borderRadius:8,padding:"5px 10px",color:"#f87171",fontFamily:"inherit",fontSize:12,cursor:"pointer",marginTop:12}}>
                      Ta bort
                    </button>
                  </div>
                );
              })}
            </div>
            {showR&&<RecipeModal foods={foods} existing={editRecipe} onSave={r=>editRecipe?updateRecipe(editRecipe.id,r):saveRecipe(r)} onClose={()=>{setShowR(false);setEditRecipe(null);}} />}
          </div>
        )}

        {/* ── PLANNER ── */}
        {tab==="plan" && (
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
              <div style={{fontSize:13,color:"#9ab89a"}}>Välj recept för varje mål — kostnad visas per person (budget: 1 kr).</div>
              <button onClick={()=>setShowPlanNut(p=>!p)}
                style={{background:showPlanNut?"#e8f5e8":"#fff",border:"1.5px solid #d4ead4",borderRadius:10,padding:"6px 14px",color:"#4a8a4a",fontFamily:"inherit",fontWeight:700,fontSize:13,cursor:"pointer",whiteSpace:"nowrap"}}>
                🔥 {showPlanNut?"Dölj näring":"Visa näring"}
              </button>
            </div>
            <div style={{overflowX:"auto",borderRadius:14,boxShadow:"0 2px 10px rgba(0,80,0,0.07)"}}>
              <table style={{width:"100%",borderCollapse:"collapse",background:"#fff",fontSize:13,minWidth:600}}>
                <thead>
                  <tr style={{background:"#f0f9f0"}}>
                    <th style={{padding:"11px 14px",textAlign:"left",fontSize:10,fontWeight:800,color:"#6b9a6b",textTransform:"uppercase",letterSpacing:"0.06em",width:80}}></th>
                    {DAYS.map(d=>(
                      <th key={d} style={{padding:"11px 8px",textAlign:"left",fontSize:10,fontWeight:800,color:"#6b9a6b",textTransform:"uppercase",letterSpacing:"0.06em",minWidth:110}}>{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MEALS.map(meal=>(
                    <tr key={meal} style={{borderTop:"1px solid #f0f4f0"}}>
                      <td style={{padding:"9px 14px",fontSize:11,fontWeight:800,color:"#7aaa7a",textTransform:"uppercase",letterSpacing:"0.06em",background:"#fafdf8",whiteSpace:"nowrap"}}>{meal}</td>
                      {DAYS.map(day=>{
                        const key=`${day}-${meal}`;
                        const rid=plan[key];
                        const recipe=rid?recipes.find(r=>r.id===rid):null;
                        const cpp=recipe?rcost(recipe,foods)/recipe.srv:null;
                        const n=recipe?rnut(recipe,foods):null;
                        return (
                          <td key={day} style={{padding:"7px 6px",verticalAlign:"top"}}>
                            <select value={rid||""} onChange={e => setPlanSlot(key, e.target.value)}
                              style={{width:"100%",border:"1.5px solid #d4ead4",borderRadius:8,padding:"6px 6px",background:"#f4fbf4",fontSize:12,color:"#1a3a1a",fontFamily:"inherit"}}>
                              <option value="">—</option>
                              {recipes.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                            {cpp!==null&&<div style={{fontSize:11,fontWeight:700,marginTop:3,color:cpp<=1?"#16a34a":cpp<=1.5?"#ca8a04":"#dc2626"}}>{f2(cpp)} kr/pers</div>}
                            {showPlanNut&&n&&n.kc>0&&(
                              <div style={{fontSize:10,color:"#4a7a4a",marginTop:3,lineHeight:1.5}}>
                                <div>🔥 {n.kc} kcal</div>
                                <div>💪 {n.pr}g · 🌾 {n.cb}g · 🥑 {n.fa}g</div>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr style={{borderTop:"2px solid #d8efd8",background:"#f4fbf4"}}>
                    <td style={{padding:"10px 14px",fontSize:10,fontWeight:800,color:"#7aaa7a",textTransform:"uppercase"}}>Totalt</td>
                    {DAYS.map(day=>{
                      const tot=MEALS.reduce((s,meal)=>{
                        const rid=plan[`${day}-${meal}`]; const r=rid?recipes.find(x=>x.id===rid):null;
                        return s+(r?rcost(r,foods):0);
                      },0);
                      const bud=MEALS.length*FAMILY_SIZE*1;
                      return <td key={day} style={{padding:"10px 6px",fontWeight:800,fontSize:13,color:tot===0?"#c8dfc8":tot<=bud?"#16a34a":"#dc2626"}}>{tot>0?`${f2(tot)} kr`:"—"}</td>;
                    })}
                  </tr>
                  {showPlanNut&&(
                    <tr style={{borderTop:"1px solid #e8f4e8",background:"#f9fdf9"}}>
                      <td style={{padding:"8px 14px",fontSize:10,fontWeight:800,color:"#7aaa7a",textTransform:"uppercase",whiteSpace:"nowrap"}}>Näring/pers</td>
                      {DAYS.map(day=>{
                        const n=dayNuts[day];
                        return (
                          <td key={day} style={{padding:"8px 6px",fontSize:10,color:"#4a7a4a",lineHeight:1.5}}>
                            {n?(
                              <>
                                <div style={{fontWeight:800}}>🔥 {n.kc} kcal</div>
                                <div>💪 {n.pr}g · 🌾 {n.cb}g</div>
                                <div>🥑 {n.fa}g</div>
                              </>
                            ):"—"}
                          </td>
                        );
                      })}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {showPlanNut&&weeklyAvgNut&&(
              <div style={{background:"#fff",borderRadius:14,padding:16,marginTop:14,boxShadow:"0 2px 10px rgba(0,80,0,0.07)"}}>
                <div style={{fontSize:11,fontWeight:800,color:"#6b9a6b",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:10}}>Snitt per dag / person</div>
                <div style={{display:"flex",gap:8}}>
                  {[["🔥",`${weeklyAvgNut.kc} kcal`],["💪",`${weeklyAvgNut.pr}g prot`],["🌾",`${weeklyAvgNut.cb}g kolh`],["🥑",`${weeklyAvgNut.fa}g fett`]].map(([em,val])=>(
                    <div key={val} style={{flex:1,background:"#f0f9f0",borderRadius:10,padding:"10px 6px",textAlign:"center"}}>
                      <div style={{fontSize:16,marginBottom:3}}>{em}</div>
                      <div style={{fontSize:11,fontWeight:800,color:"#4a7a4a"}}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
