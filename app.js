'use strict';

function calculateCeiling(grossPerKg, retailMargin, distributorMargin, vat = 0.07) {
  const net = grossPerKg / (1 + vat);
  return { gross: grossPerKg, net, ceiling: net * (1 - retailMargin) * (1 - distributorMargin), fraction: (1 - retailMargin) * (1 - distributorMargin) };
}
function requiredShelfLife(transit, production = 7, wait = 7, sale = 30, buffer = 21) { return transit + production + wait + sale + buffer; }
function inventoryLot(demand, loss = 0.05) { return Math.ceil(demand / (1 - loss)); }
if (typeof module !== 'undefined' && module.exports) module.exports = { calculateCeiling, requiredShelfLife, inventoryLot };

if (typeof document !== 'undefined') {
(() => {
  const data = window.BENDITA_DATA;
  const $ = (id) => document.getElementById(id);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const escapeHTML = (value) => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = (n) => n.toFixed(2);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let modalTrigger = null;
  const sourceDialog = $('source-dialog');
  function showDialog(title, content) {
    modalTrigger = document.activeElement;
    $('dialog-title').textContent = title;
    $('dialog-content').innerHTML = content;
    sourceDialog.showModal();
  }
  function sourceMarkup(id) {
    const source = data.sources[id];
    if (!source) return '<p>No se encontró esa referencia. Consulta el registro completo del plan.</p>';
    return `<span class="source-id">${escapeHTML(id)}</span><p>${escapeHTML(source.title)}</p><p class="note">Consultada el 9 de octubre de 2026. Revisar el alcance de la fuente antes de extrapolar su información al proyecto.</p>` + source.links.map(([label,url]) => `<p><a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(label === 'Consultar fuente' ? 'Abrir fuente original ↗' : label+' ↗')}</a></p>`).join('');
  }
  document.addEventListener('click', (e) => {
    const sourceButton = e.target.closest('[data-source]');
    if (sourceButton) { showDialog('Fuente y alcance', sourceMarkup(sourceButton.dataset.source)); return; }
    const chapterButton = e.target.closest('[data-chapter]');
    if (chapterButton) {
      const id = chapterButton.dataset.chapter;
      $('plan-search').value = '';
      populateChapters(data.sections, id);
      $('chapter-select').value = id;
      openReader(true);
      $('biblioteca').scrollIntoView({behavior:reducedMotion.matches ? 'auto' : 'smooth'});
    }
  });
  $('dialog-close').addEventListener('click', () => sourceDialog.close());
  sourceDialog.addEventListener('click', (e) => { if (e.target === sourceDialog) { const r = sourceDialog.getBoundingClientRect(); if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom) sourceDialog.close(); } });
  sourceDialog.addEventListener('close', () => { if (modalTrigger) modalTrigger.focus({preventScroll:true}); });
  $('all-sources').addEventListener('click', () => {
    showDialog('Registro de fuentes', '<label for="source-filter" class="small-label">Buscar institución o tema</label><input type="search" id="source-filter" placeholder="Ej. Berlín, WDI, cultura"><div id="source-list" class="source-list"></div>');
    function fill(filter = '') {
      const sources = Object.entries(data.sources).filter(([id,s]) => (id+' '+s.title).toLocaleLowerCase('es').includes(filter.toLocaleLowerCase('es')));
      $('source-list').innerHTML = sources.map(([id,s]) => `<div><span class="source-id">${id}</span><p>${escapeHTML(s.title)}</p><a href="${escapeHTML(s.url)}" target="_blank" rel="noopener noreferrer">Consultar fuente original ↗</a></div>`).join('') || '<p>No hay coincidencias.</p>';
    }
    fill(); $('source-filter').addEventListener('input', e => fill(e.target.value));
  });
  const glossary = [
    ['SKU','Una referencia de producto concreta. Maíz y harina se estudian por separado; un formato distinto puede ser otro SKU.'],
    ['FCA','Incoterm propuesto para entregar al transportista en un punto convenido. En este plan se estudia terminal NLU; el punto y contrato deben confirmarse.'],
    ['NLU / FRA','Códigos de los aeropuertos Felipe Ángeles (México) y Fráncfort (Alemania).'],
    ['CN / TARIC','Nomenclatura y sistema arancelario de la Unión Europea. El código definitivo depende de la receta y del dictamen.'],
    ['EA / Meursing','Componente agrícola y codificación basada en composición. No basta conocer el porcentaje ad valorem para liquidar el derecho.'],
    ['AD F/M','Derecho adicional sobre harina que puede intervenir en el máximo de determinadas líneas arancelarias.'],
    ['B2B / HORECA','Venta a empresas / hoteles, restaurantes y catering. No son ventas acreditadas del proyecto.'],
    ['3PL','Operador externo de logística. Un comerciante de congelados no necesariamente ofrece almacén o distribución para terceros.'],
    ['FEFO','Despachar primero los lotes que vencen primero.'],
    ['Merma','Producto que deja de estar disponible para venta. En el modelo es una hipótesis del 5%, no una pérdida medida.'],
    ['Techo del importador','Costo completo máximo calculado bajo márgenes de canal supuestos. No es un precio mayorista recibido.'],
    ['Observado / calculado / propuesto','Dato publicado / resultado de una fórmula / decisión o hipótesis que requiere confirmación.']
  ];
  $('glossary-open').addEventListener('click', () => showDialog('Las siglas, en palabras simples', glossary.map(([term,desc]) => `<div class="glossary-row"><strong>${escapeHTML(term)}</strong><p>${escapeHTML(desc)}</p></div>`).join('')));

  const menuToggle = $('menu-toggle');
  menuToggle.addEventListener('click', () => { const open = menuToggle.getAttribute('aria-expanded') === 'true'; menuToggle.setAttribute('aria-expanded', String(!open)); $('mobile-menu').hidden = open; });
  $$('#mobile-menu a').forEach(a => a.addEventListener('click', () => { $('mobile-menu').hidden = true; menuToggle.setAttribute('aria-expanded','false'); }));

  const locations = {
    moabit:{title:'Berliner Großmarkt',tag:'CENTRO OPERATIVO PROPUESTO',address:'Beusselstraße 44 N–Q<br>10553 Berlín · Moabit',note:'Recepción y distribución mediante un socio. La capacidad congelada y el servicio 3PL deben confirmarse.',source:'S49'},
    kreuzberg:{title:'Corredor de pruebas comerciales',tag:'INVESTIGACIÓN Y PRIMERAS CUENTAS',address:'Eisenbahnstraße · Skalitzer Straße · Wiener Straße<br>10997–10999 Berlín · Kreuzberg',note:'Entrevistas y degustaciones seguras con restaurantes y canales locales. No se propone como almacén congelado central ni se acreditan pedidos.',source:'S51'}
  };
  $$('[data-location]').forEach(button => button.addEventListener('click', () => {
    const key = button.dataset.location, info = locations[key];
    $$('[data-location]').forEach(b => { const active=b===button; b.classList.toggle('active',active); b.setAttribute('aria-pressed',String(active)); });
    $$('.location-pin').forEach(pin => pin.classList.toggle('active',pin.classList.contains(key+'-pin')));
    $('location-info').innerHTML=`<p class="small-label">${info.tag}</p><h3>${info.title}</h3><p>${info.address}</p><p class="note">${info.note}</p>`;
    $('location-source').dataset.source=info.source;
  }));

  const routes = {
    air:{label:'Hasta 60 kg · muestras de desarrollo',icon:'✈',points:[
      {name:'Baja California',short:'Baja California',x:161,y:207,body:'Fabricación de maíz y harina. Liberar únicamente lotes seguros y acondicionados para la especificación de frío.',condition:'Receta, lote, envase y congelación validados. Municipio y planta todavía por definir.',source:'S27'},
      {name:'NLU · Felipe Ángeles',short:'NLU / AIFA',x:266,y:301,body:'Traslado desde la planta y entrega al punto aeroportuario acordado. NLU es una base de cargueros; no existe reserva para Bendita Tortilla.',condition:'Cotizar transporte doméstico, manejo congelado, embalaje, dimensiones y peso cobrable. Confirmar recepción en terminal.',source:'S56'},
      {name:'Fráncfort · Alemania',short:'Fráncfort',x:704,y:127,body:'Llegada candidata, despacho y enlace con transporte a Berlín. La solución térmica debe cumplir la especificación del producto.',condition:'El rango publicado FRO de −20 a −10 °C no garantiza siempre −18 °C. Exigir solución compatible y reserva confirmada.',source:'S55'},
      {name:'Moabit · Berlín',short:'Berlín / Moabit',x:733,y:109,body:'Recepción mediante socio de frío, control de temperaturas y distribución de muestras a pruebas autorizadas.',condition:'Almacenamiento y receptor contratados. La degustación se realiza solo con seguridad aprobada. Muestra no equivale a venta.',source:'S49'}
    ]},
    sea:{label:'411 kg · referencia condicionada a pedidos y carga compartida',icon:'↝',points:[
      {name:'Baja California',short:'Baja California',x:161,y:207,body:'Producción según pedidos por SKU. El escenario base propone 411 kg netos para una meta de 390 kg vendibles, con merma supuesta del 5%.',condition:'No acumular inventario para llenar un contenedor. El lote se reduce si los pedidos comprometidos son menores.',source:'S27'},
      {name:'Veracruz',short:'Veracruz',x:286,y:310,body:'Salida mexicana candidata para AL4. El traslado desde Baja California añade distancia, tiempo y costo que deben cotizarse.',condition:'Aceptación de carga congelada compartida y reserva real. La rotación publicada no acredita ese servicio para 411 kg.',source:'S54'},
      {name:'Altamira',short:'Altamira',x:280,y:296,body:'Otra escala mexicana publicada en la rotación AL4. Puerto de carga y escalas efectivas dependen de la contratación.',condition:'Identificar el embarque y no sumar ficticiamente dos exportaciones. Confirmar conexión, temperatura y documentación.',source:'S54'},
      {name:'Miami',short:'Miami',x:313,y:237,body:'Escala de la rotación publicada, anterior a Southampton. La conexión no es un viaje sin escalas a Alemania.',condition:'Cotizar espera, alimentación del reefer y responsabilidades durante escala. No se presume desembarco o importación estadounidense.',source:'S54'},
      {name:'Southampton',short:'Southampton',x:659,y:137,body:'Escala británica de la rotación antes de los puertos continentales. El destino comercial permanece en Alemania.',condition:'Confirmar itinerario del contenedor y documentación del tránsito con el operador; no presentar venta en Reino Unido.',source:'S54'},
      {name:'Rotterdam',short:'Rotterdam',x:689,y:117,body:'Puerto de la rotación publicada. Puede estudiarse como entrada alternativa si una oferta completa mejora costo y servicio hacia Berlín.',condition:'Si se despacha allí, asignar importador, régimen neerlandés y traslado a Alemania. No cambia el mercado final.',source:'S33'},
      {name:'Antwerp',short:'Antwerp',x:686,y:132,body:'Escala continental de la rotación publicada antes de los puertos alemanes.',condition:'El contrato determina escalas efectivas y tiempo puerta a puerta. La animación no representa duración ni reserva.',source:'S54'},
      {name:'Puerto alemán',short:'Bremerhaven',x:714,y:102,body:'Bremerhaven y Wilhelmshaven aparecen en AL4. Este esquema representa descarga candidata en Bremerhaven; se elige el puerto al contratar.',condition:'Cotizar aduana, terminal, conservación, espera y transporte hasta Berlín. Confirmar clasificación y componentes agrícolas.',source:'S54'},
      {name:'Moabit · Berlín',short:'Berlín / Moabit',x:733,y:109,body:'Recepción y reparto mediante socio contratado. FEFO y vida residual permiten controlar inventario vendible.',condition:'Servicio congelado, clientes, entregas y costo completo compatibles. No hay almacén ni consolidación confirmados.',source:'S49'}
    ]}
  };
  let routeKey='air', stage=0, playing=false, animationId=null, animationStart=0, lastAnnounced=0, routeDistances=[];
  const path=$('route-path');
  function routePath(points) {
    let d=`M${points[0].x} ${points[0].y}`;
    for(let i=1;i<points.length;i++) {
      const a=points[i-1],b=points[i];
      if(Math.abs(b.x-a.x)>200) d+=` Q${(a.x+b.x)/2} ${Math.max(25,Math.min(a.y,b.y)-145)} ${b.x} ${b.y}`;
      else if(i===1) d+=` Q${(a.x+b.x)/2} ${Math.max(a.y,b.y)+5} ${b.x} ${b.y}`;
      else d+=` L${b.x} ${b.y}`;
    }
    return d;
  }
  function setCargoAt(distance) {
    const point=path.getPointAtLength(distance);
    $('route-cargo').setAttribute('transform',`translate(${point.x},${point.y})`);
    $('route-glow').setAttribute('cx',point.x);$('route-glow').setAttribute('cy',point.y);
  }
  function updateStage(index, moveCargo=true) {
    const route=routes[routeKey];stage=Math.max(0,Math.min(index,route.points.length-1));const p=route.points[stage];
    $('stage-number').textContent=`${String(stage+1).padStart(2,'0')} / ${String(route.points.length).padStart(2,'0')}`;
    $('stage-title').textContent=p.name;$('stage-body').textContent=p.body;$('stage-condition').textContent=p.condition;$('stage-source').dataset.source=p.source;
    $$('[data-stage]').forEach(b=>{const active=Number(b.dataset.stage)===stage;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
    $('route-prev').disabled=stage===0;$('route-next').disabled=stage===route.points.length-1;
    if(moveCargo) { $('route-cargo').setAttribute('transform',`translate(${p.x},${p.y})`);$('route-glow').setAttribute('cx',p.x);$('route-glow').setAttribute('cy',p.y); }
  }
  function stopAnimation() { playing=false;if(animationId!==null)cancelAnimationFrame(animationId);animationId=null;$('route-play').textContent='▶ Reproducir';$('route-play').setAttribute('aria-pressed','false'); }
  function switchRoute(key) {
    stopAnimation();routeKey=key;const route=routes[key];path.setAttribute('d',routePath(route.points));
    routeDistances=route.points.map((point,i)=>{if(i===0)return 0;const segment=document.createElementNS('http://www.w3.org/2000/svg','path');segment.setAttribute('d',routePath(route.points.slice(0,i+1)));segment.style.visibility='hidden';$('route-map').appendChild(segment);const length=segment.getTotalLength();segment.remove();return length;});
    $('route-cargo').querySelector('text').textContent=route.icon;
    $('route-type-label').textContent=route.label;
    // Etiquetas solo en anclas principales; todas las escalas son accesibles mediante botones.
    $('route-nodes').innerHTML=route.points.map((p,i)=>{
      const major=key==='air'||[0,1,7,8].includes(i);
      const dy= key==='air' && i===2 ? 24 : -16;
      const dx= key==='sea' && i===7 ? -55 : 0;
      return `<circle cx="${p.x}" cy="${p.y}" r="${major?5:3}"/>`+(major?`<text x="${p.x+dx}" y="${p.y+dy}" text-anchor="middle">${p.short}</text>`:'');
    }).join('');
    $('route-steps').innerHTML=route.points.map((p,i)=>`<button data-stage="${i}" aria-pressed="${i===0}">${String(i+1).padStart(2,'0')} · ${p.short}</button>`).join('');
    $$('[data-route]').forEach(b=>{const active=b.dataset.route===key;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});updateStage(0);
  }
  $$('[data-route]').forEach(button=>button.addEventListener('click',()=>switchRoute(button.dataset.route)));
  $('route-steps').addEventListener('click',e=>{const b=e.target.closest('[data-stage]');if(b){stopAnimation();updateStage(Number(b.dataset.stage));}});
  $('route-prev').addEventListener('click',()=>{stopAnimation();updateStage(stage-1);});
  $('route-next').addEventListener('click',()=>{stopAnimation();updateStage(stage+1);});
  $('route-reset').addEventListener('click',()=>{stopAnimation();updateStage(0);});
  $('route-play').addEventListener('click',()=>{
    if(playing){stopAnimation();return;}
    if(reducedMotion.matches) {updateStage(stage>=routes[routeKey].points.length-1?0:stage+1);return;}
    playing=true;animationStart=performance.now();lastAnnounced=0;$('route-play').textContent='Ⅱ Pausar';$('route-play').setAttribute('aria-pressed','true');updateStage(0);
    const duration=routeKey==='air'?12000:22000;
    function tick(now){if(!playing)return;const progress=Math.min((now-animationStart)/duration,1);const scaled=progress*(routeDistances.length-1),leg=Math.min(Math.floor(scaled),routeDistances.length-2),part=Math.min(1,scaled-leg);setCargoAt(routeDistances[leg]+(routeDistances[leg+1]-routeDistances[leg])*part);
      if(now-lastAnnounced>500){updateStage(progress===1?routeDistances.length-1:leg,false);lastAnnounced=now;}
      if(progress===1){stopAnimation();updateStage(routes[routeKey].points.length-1);return;}animationId=requestAnimationFrame(tick);
    }
    animationId=requestAnimationFrame(tick);
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAnimation();});
  reducedMotion.addEventListener('change',()=>{stopAnimation();updateStage(stage);});
  switchRoute('air');

  $('transit-slider').addEventListener('input',e=>{const value=Number(e.target.value);$('transit-value').value=value;$('life-result').value=requiredShelfLife(value);$('tl-transit').style.flex=String(value);});
  let sku='corn';
  const productPrices={corn:{gross:4.55/1.32,source:'S22'},wheat:{gross:3/.49,source:'S23'}};
  function updateEconomy(){
    const r=Number($('retail-margin').value)/100,d=Number($('dist-margin').value)/100;
    const result=calculateCeiling(productPrices[sku].gross,r,d);
    $('retail-margin-value').value=Math.round(r*100);$('dist-margin-value').value=Math.round(d*100);
    $('gross-price').textContent=fmt(result.gross);$('net-price').textContent=fmt(result.net);$('price-ceiling').textContent=fmt(result.ceiling);
    $('budget-fill').style.width=result.fraction*100+'%';$('ceiling-explainer').textContent=`Del precio retail neto queda el ${(result.fraction*100).toFixed(1).replace('.0','')}% después de los márgenes de prueba.`;
    $('price-source').dataset.source=productPrices[sku].source;
  }
  $$('[data-sku]').forEach(button=>button.addEventListener('click',()=>{sku=button.dataset.sku;$$('[data-sku]').forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});updateEconomy();}));
  ['retail-margin','dist-margin'].forEach(id=>$(id).addEventListener('input',updateEconomy));updateEconomy();
  const objections={
    price:['Comparemos precio neto, peso y entrega. Después revisemos rendimiento y si la diferencia de sabor justifica una prima.','Oferta comparable y pedido al precio necesario.'],
    local:['Reconozcamos la alternativa. Comparemos a ciegas sabor, rotura y desempeño por SKU, sin desacreditar al proveedor.','Resultado de prueba y compra real; el origen mexicano no basta por sí solo.'],
    life:['Mostremos el estudio propio. Si todavía no existe, expliquemos que la venta depende de esa validación; no copiemos la duración de un competidor.','Informe de vida útil después de descongelar, receta y condiciones de uso aprobadas.'],
    delivery:['Verifiquemos capacidad y precio de reparto del socio de Berlín antes de prometer una entrega semanal.','Calendario, operador de frío y servicio de reparto contratados.']
  };
  $('objection-select').addEventListener('change',e=>{const [response,evidence]=objections[e.target.value];$('objection-response').textContent=response;$('objection-evidence').textContent=evidence;});

  function populateChapters(sections, preferred){const select=$('chapter-select');select.innerHTML=sections.map(s=>`<option value="${s.id}">${escapeHTML(s.title)}</option>`).join('');if(preferred&&sections.some(s=>s.id===preferred))select.value=preferred;}
  function openReader(open){const section=data.sections.find(s=>s.id===$('chapter-select').value);$('reader-title').textContent=section?section.title:'No hay coincidencias';$('reader-toggle').disabled=!section;
    if(open&&section){$('plan-reader').innerHTML=section.html;$('plan-reader').hidden=false;$('reader-toggle').textContent='Cerrar capítulo ↑';$('reader-toggle').setAttribute('aria-expanded','true');}
    else {$('plan-reader').hidden=true;$('reader-toggle').textContent='Abrir capítulo ↓';$('reader-toggle').setAttribute('aria-expanded','false');}
  }
  populateChapters(data.sections);openReader(false);
  $('reader-toggle').addEventListener('click',()=>openReader($('plan-reader').hidden));
  $('chapter-select').addEventListener('change',()=>openReader(true));
  $('plan-search').addEventListener('input',e=>{const q=e.target.value.trim().toLocaleLowerCase('es');const selected=$('chapter-select').value;const matches=data.sections.filter(s=>(s.title+' '+s.text).toLocaleLowerCase('es').includes(q));populateChapters(matches,selected);$('search-feedback').textContent=q?`${matches.length} capítulo${matches.length===1?'':'s'} con coincidencias. Selecciona uno para leerlo.`:'';openReader(false);});

  const chapters=$$('.chapter');let currentChapter=0,presenting=false,scrollTick=false;
  const names={inicio:'El proyecto',proyecto:'Dos productos',berlin:'Berlín y Moabit',ruta:'Ruta logística',calidad:'Calidad y vida útil',economia:'Modelo económico',cultura:'Cultura y negociación',inversion:'Decisión de inversión',biblioteca:'Plan y fuentes'};
  function updatePresenter(){const chapter=chapters[currentChapter];$('present-label').textContent=names[chapter.id];$('present-count').textContent=`${currentChapter+1} / ${chapters.length}`;$('present-note').textContent=chapter.dataset.note;$('present-prev').disabled=currentChapter===0;$('present-next').disabled=currentChapter===chapters.length-1;}
  function setPresentation(on){presenting=on;document.body.classList.toggle('presenting',on);$('presenter-bar').hidden=!on;$('present-toggle').setAttribute('aria-pressed',String(on));$('present-toggle').innerHTML=on?'Salir de exposición ×':'Modo exposición <span aria-hidden="true">↗</span>';$('mobile-menu').hidden=true;menuToggle.setAttribute('aria-expanded','false');updatePresenter();}
  $('present-toggle').addEventListener('click',()=>setPresentation(!presenting));$('mobile-present').addEventListener('click',()=>setPresentation(true));$('present-exit').addEventListener('click',()=>setPresentation(false));
  function movePresentation(offset){currentChapter=Math.max(0,Math.min(currentChapter+offset,chapters.length-1));chapters[currentChapter].scrollIntoView({behavior:reducedMotion.matches?'auto':'smooth'});updatePresenter();}
  $('present-prev').addEventListener('click',()=>movePresentation(-1));$('present-next').addEventListener('click',()=>movePresentation(1));$('present-note-toggle').addEventListener('click',()=>{const open=$('present-note').hidden;$('present-note').hidden=!open;$('present-note-toggle').setAttribute('aria-expanded',String(open));});
  function scrollState(){let found=0;chapters.forEach((chapter,i)=>{if(chapter.getBoundingClientRect().top<=window.innerHeight*.32)found=i;});currentChapter=found;updatePresenter();$$('.desktop-nav a').forEach(a=>a.classList.toggle('active',a.hash==='#'+chapters[currentChapter].id));scrollTick=false;}
  window.addEventListener('scroll',()=>{if(!scrollTick){scrollTick=true;requestAnimationFrame(scrollState);}},{passive:true});scrollState();
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('mobile-menu').hidden=true;menuToggle.setAttribute('aria-expanded','false');if(!sourceDialog.open&&presenting)setPresentation(false);}if(!presenting||sourceDialog.open||e.target.closest('input,select,textarea,button'))return;if(e.key==='ArrowRight'){e.preventDefault();movePresentation(1);}if(e.key==='ArrowLeft'){e.preventDefault();movePresentation(-1);}});
  if('IntersectionObserver' in window){document.documentElement.classList.add('enhanced');const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in-view');observer.unobserve(e.target);}});},{threshold:.07,rootMargin:'20px'});$$('.reveal').forEach(el=>observer.observe(el));}
})();
}
