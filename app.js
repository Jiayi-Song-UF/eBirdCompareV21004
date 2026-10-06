'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const state = {current:null, layers:[], maps:[], chunks:new Map(), generation:0, bits:null, loading:false};
  const bit = (bytes, i) => (bytes[i >>> 3] >>> (i & 7)) & 1;
  const decimals = (n, places=3) => n == null ? '—' : Number(n).toFixed(places);
  const thresholdText = n => Number(n).toPrecision(7).replace(/0+$/, '').replace(/\.$/, '');
  async function request(path, json=false) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Unable to load ${path} (${response.status}).`);
    return json ? response.json() : response.arrayBuffer();
  }
  async function gunzip(buffer) {
    if (!window.DecompressionStream) throw new Error('Please use a current Chrome, Edge, Firefox or Safari browser.');
    return new Uint8Array(await new Response(new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
  }
  function message(text, error=false) { $('status').textContent=text; $('status').classList.toggle('error',error); }
  function options(query='') {
    const selected=state.current?.key || state.requestedKey;
    const q=query.trim().toLocaleLowerCase();
    const list=state.species.filter(s => `${s.common} ${s.scientific} ${s.ebird_scientific} ${s.key}`.toLocaleLowerCase().includes(q));
    $('species').replaceChildren(...list.map(s => new Option(`${s.common} · ${s.scientific}`,s.key)));
    $('species').disabled=!list.length;
    if (list.some(s => s.key===selected)) $('species').value=selected;
    else if (list.length) $('species').selectedIndex=-1;
    if (!list.length) $('species').add(new Option('No matching species',''));
  }
  function saveHash() {
    if (!state.current || !state.view) return;
    const [lon,lat]=ol.proj.toLonLat(state.view.getCenter());
    const hash=new URLSearchParams({species:state.current.key,lon:lon.toFixed(5),lat:lat.toFixed(5),z:state.view.getZoom().toFixed(3)});
    history.replaceState(null,'',`#${hash}`);
  }
  function home() {
    const extent=ol.proj.transformExtent(state.meta.extent,state.meta.crs,'EPSG:3857',20);
    state.view.fit(extent,{size:state.maps[0].getSize(),padding:[16,12,16,12],duration:0});
  }
  function curve(species) {
    const points=species.curve, lo=species.score_min, hi=species.score_max;
    const x=t=>45+(t-lo)/Math.max(hi-lo,1e-12)*445, y=f=>175-f*145;
    const path=points.map((p,i)=>`${i?'L':'M'}${x(p[0]).toFixed(2)},${y(p[1]).toFixed(2)}`).join(' ');
    const tx=x(species.optimal_threshold), fy=y(species.f1);
    $('curve').innerHTML=`<title>F1 across ${species.n_thresholds} candidate thresholds; maximum F1 ${decimals(species.f1)}</title>
      <path d="M45 30 V175 H490" fill="none" stroke="#9aaba4"/>
      <path d="M45 102.5 H490 M45 30 H490" fill="none" stroke="#e6eeea"/>
      <path d="${path}" fill="none" stroke="#238358" stroke-width="2.5"/>
      <path d="M${tx} 30 V175" stroke="#bd6325" stroke-dasharray="4 4"/>
      <circle cx="${tx}" cy="${fy}" r="4.5" fill="#bd6325"/>
      <g fill="#60716e" font-size="11" font-family="system-ui,sans-serif">
      <text x="18" y="34">1.0</text><text x="18" y="107">0.5</text><text x="18" y="178">0.0</text>
      <text x="45" y="193">${decimals(lo)}</text><text x="490" y="193" text-anchor="end">${decimals(hi)}</text>
      <text x="265" y="204" text-anchor="middle">Threshold</text><text x="18" y="18">F1</text>
      <text x="490" y="18" text-anchor="end" fill="#9c4b18">Selected: ${thresholdText(species.optimal_threshold)}</text></g>`;
  }
  function describe(s) {
    $('common-name').textContent=s.common;
    $('scientific-name').textContent=s.scientific;
    $('species-key').textContent=`key ${s.key}`;
    $('f1').textContent=decimals(s.f1); $('f1').title=String(s.f1);
    $('threshold').textContent=thresholdText(s.optimal_threshold); $('threshold').title=String(s.optimal_threshold);
    $('precision').textContent=decimals(s.precision); $('recall').textContent=decimals(s.recall);
    $('left-caption').textContent=`Presence: mean score > ${thresholdText(s.optimal_threshold)}`;
    $('search-summary').textContent=`${s.n_thresholds} candidates · step 0.01 · maximum F1`;
    $('threshold-rule').textContent=`Selected threshold = ${s.optimal_threshold}. CSSDM mean score strictly greater than this value is presence; otherwise absence.`;
    $('threshold-range').textContent=`Search: minimum ${s.score_min} → maximum ${s.score_max}, step 0.01, including the exact maximum (${s.n_thresholds} candidates).`;
    $('threshold-ties').textContent=`${s.n_tied_best_thresholds} candidate(s) share the best F1. Ties select the highest threshold. Fitted F1 = ${decimals(s.f1,6)} on ${s.n_evaluated.toLocaleString()} CSSDM cells.`;
    $('threshold-baseline').textContent=`For context: F1 at threshold 0.5 = ${decimals(s.f1_at_threshold_0_5)}; all-presence baseline F1 = ${decimals(s.all_presence_baseline_f1)}. CSSDM predicts presence in ${(100*s.predicted_positive_fraction).toFixed(1)}% of its valid cells.`;
    $('period-note').textContent=`Selected eBird product: ${s.ebird_code}; species ${s.ebird_scientific}; raster band / period: ${s.period}.`;
    $('species-warning').hidden=s.threshold_status==='both_classes';
    $('species-warning').textContent=s.threshold_status==='no_reference_presence'
      ? 'Caution: eBird presence exists in Florida, but none falls within the 66-county CSSDM calibration coverage. All candidate F1 scores are zero; the tie rule selects the maximum score and produces an all-absence CSSDM map. This is not an informative fitted threshold.'
      : 'Caution: only one reference class is present in the calibration area. Interpret this threshold and its metrics with care.';
    curve(s);
  }
  async function loadBits(s) {
    if (!state.chunks.has(s.chunk)) {
      const promise=request(`data/${s.chunk}`).catch(error=>{state.chunks.delete(s.chunk);throw error;});
      state.chunks.set(s.chunk,promise);
    }
    const chunk=await state.chunks.get(s.chunk);
    const member=chunk.slice(s.offset,s.offset+s.length);
    if (member.byteLength!==s.length) throw new Error('Incomplete species data. Please reload.');
    if (window.crypto?.subtle) {
      const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',member)),v=>v.toString(16).padStart(2,'0')).join('');
      if (hash!==s.sha256) throw new Error('Species data checksum failed. Please reload.');
    }
    const bytes=await gunzip(member), n=state.meta.bytes_per_layer;
    if (bytes.length!==3*n) throw new Error('Incorrect species data length.');
    return [bytes.subarray(0,n),bytes.subarray(n,2*n),bytes.subarray(2*n,3*n)];
  }
  function raster(presence,valid) {
    const canvas=document.createElement('canvas'); canvas.width=state.meta.width; canvas.height=state.meta.height;
    const context=canvas.getContext('2d'), pixels=context.createImageData(canvas.width,canvas.height), rgba=pixels.data;
    for (let i=0;i<state.indices.length;i++) {
      const j=state.indices[i]*4;
      const color=!bit(valid,i)?[182,189,197,255]:bit(presence,i)?[35,131,88,235]:[255,255,255,0];
      rgba[j]=color[0];rgba[j+1]=color[1];rgba[j+2]=color[2];rgba[j+3]=color[3];
    }
    context.putImageData(pixels,0,0);
    return new ol.source.ImageStatic({url:canvas.toDataURL('image/png'),projection:state.meta.crs,imageExtent:state.meta.extent,interpolate:false});
  }
  async function selectSpecies(key) {
    const s=state.species.find(s=>s.key===String(key)); if(!s) return;
    const generation=++state.generation;
    state.loading=true; state.bits=null; state.current=s;
    // Hide while loading, but keep the previous source alive: OpenLayers may
    // still have an asynchronous reprojection render using that source.
    state.layers.forEach(layer=>layer.setVisible(false));
    $('species').value=s.key; describe(s); saveHash();
    $('inspection').textContent='Click either map to inspect the same pixel in both models.';
    message(`Loading ${s.common}…`);
    try {
      const bits=await loadBits(s);
      if(generation!==state.generation) return;
      const sources=[raster(bits[0],state.cssdmValid),raster(bits[1],bits[2])];
      state.bits=bits;state.loading=false;
      sources.forEach((source,i)=>{state.layers[i].setSource(source);state.layers[i].setVisible(true);});
      message('');
    } catch(error) {if(generation===state.generation){state.loading=false;message(error.message,true);}}
  }
  function inspect(coordinate) {
    if(!state.bits) return;
    const [x,y]=ol.proj.transform(coordinate,'EPSG:3857',state.meta.crs), m=state.meta;
    const col=Math.floor((x-m.extent[0])/m.cell_size_m), row=Math.floor((m.extent[3]-y)/m.cell_size_m);
    const flat=row*m.width+col;
    const i=col>=0&&col<m.width&&row>=0&&row<m.height?state.lookup[flat]:-1;
    if(i<0) {$('inspection').textContent='Outside the Florida display mask.';delete $('inspection').dataset.index;return;}
    const left=!bit(state.cssdmValid,i)?'No data':bit(state.bits[0],i)?'Presence (1)':'Absence (0)';
    const right=!bit(state.bits[2],i)?'No data':bit(state.bits[1],i)?'Presence (1)':'Absence (0)';
    const county=state.meta.counties.find(c=>c.id===state.countyIds[i])?.name || 'Florida boundary';
    const [lon,lat]=ol.proj.toLonLat(coordinate);
    $('inspection').textContent=`${county} · ${lat.toFixed(4)}, ${lon.toFixed(4)} · CSSDM: ${left} · eBird: ${right}`;
    $('inspection').dataset.index=String(i);$('inspection').dataset.cssdm=left;$('inspection').dataset.ebird=right;
  }
  async function init() {
    if(location.protocol==='file:') throw new Error('Please open this site through GitHub Pages or a local HTTP server, not by double-clicking index.html. See README.md.');
    const params=new URLSearchParams(location.hash.slice(1));
    [state.meta,state.species]=await Promise.all([request('data/metadata.json',true),request('data/species.json',true)]);
    state.species.sort((a,b)=>a.common.localeCompare(b.common));
    state.requestedKey=params.get('species') || '5229158';
    if(!state.species.some(s=>s.key===state.requestedKey))state.requestedKey=state.species[0].key;
    const [grid,valid,counties,geojson]=await Promise.all([request('data/grid.u32.gz').then(gunzip),request('data/cssdm-valid.bits.gz').then(gunzip),request('data/county.u8.gz').then(gunzip),request('data/counties.geojson',true)]);
    const dv=new DataView(grid.buffer,grid.byteOffset,grid.byteLength);
    if(grid.byteLength!==4*state.meta.n_cells||valid.length!==state.meta.bytes_per_layer||counties.length!==state.meta.n_cells)throw new Error('Grid metadata and data lengths differ.');
    state.indices=Uint32Array.from({length:state.meta.n_cells},(_,i)=>dv.getUint32(i*4,true));
    state.cssdmValid=valid;state.countyIds=counties;
    state.lookup=new Int32Array(state.meta.width*state.meta.height).fill(-1);
    state.indices.forEach((flat,i)=>state.lookup[flat]=i);
    proj4.defs('EPSG:32617','+proj=utm +zone=17 +datum=WGS84 +units=m +no_defs');
    ol.proj.proj4.register(proj4);
    const features=new ol.format.GeoJSON().readFeatures(geojson,{featureProjection:'EPSG:3857'});
    state.features=features;
    const countySource=new ol.source.Vector({features});
    state.view=new ol.View({center:ol.proj.fromLonLat([-82,28]),zoom:6,enableRotation:false,minZoom:4,maxZoom:14});
    state.basemaps=[];state.boundaries=[];
    for(const id of ['left-map','right-map']) {
      const base=new ol.layer.Tile({source:new ol.source.OSM(),visible:false});
      const land=new ol.layer.Vector({source:countySource,style:new ol.style.Style({fill:new ol.style.Fill({color:'rgba(255,255,255,0.86)'})})});
      const rasterLayer=new ol.layer.Image({source:null,visible:false});
      const borders=new ol.layer.Vector({source:countySource,style:new ol.style.Style({stroke:new ol.style.Stroke({color:'rgba(58,84,75,0.65)',width:0.7})})});
      const map=new ol.Map({target:id,view:state.view,layers:[base,land,rasterLayer,borders],controls:ol.control.defaults.defaults().extend([new ol.control.ScaleLine()])});
      map.on('singleclick',e=>inspect(e.coordinate));map.on('moveend',saveHash);
      state.maps.push(map);state.layers.push(rasterLayer);state.basemaps.push(base);state.boundaries.push(borders);
    }
    home();
    const lon=Number(params.get('lon')),lat=Number(params.get('lat')),z=Number(params.get('z'));
    if(params.has('lon')&&params.has('lat')&&params.has('z')&&Number.isFinite(lon)&&Number.isFinite(lat)&&Number.isFinite(z)&&lon>=-180&&lon<=180&&lat>=-85&&lat<=85) {
      state.view.setCenter(ol.proj.fromLonLat([lon,lat]));state.view.setZoom(Math.max(4,Math.min(14,z)));
    }
    options();$('species-count').textContent=`${state.species.length} species · ${state.meta.excluded_count} excluded`;
    $('search').addEventListener('input',()=>options($('search').value));
    $('search').addEventListener('keydown',e=>{if(e.key==='Enter'){const first=$('species').options[0];if(first?.value)selectSpecies(first.value);}});
    $('species').addEventListener('change',()=>selectSpecies($('species').value));
    $('home').addEventListener('click',()=>{home();saveHash();});
    $('basemap').addEventListener('change',()=>state.basemaps.forEach(layer=>layer.setVisible($('basemap').checked)));
    $('boundaries').addEventListener('change',()=>state.boundaries.forEach(layer=>layer.setVisible($('boundaries').checked)));
    $('share').addEventListener('click',async()=>{
      saveHash();
      try {await navigator.clipboard.writeText(location.href);$('share').textContent='Copied';setTimeout(()=>$('share').textContent='Copy link',1600);}
      catch {message('Copy the current URL from your address bar to share this view.');}
    });
    window.CSSDM_COMPARISON={state,selectSpecies,inspect,home,bit};
    await selectSpecies(state.requestedKey);
  }
  init().catch(error=>{console.error(error);message(error.message,true);});
})();
