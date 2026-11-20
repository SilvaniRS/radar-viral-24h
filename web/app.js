'use strict';
const CONFIG={
  BR:{name:'Brasil',flag:'🇧🇷',lang:'pt',focus:'Notícias, tecnologia e curiosidades'},
  US:{name:'Estados Unidos',flag:'🇺🇸',lang:'en',focus:'Tech, gaming and world news'},
  MX:{name:'México',flag:'🇲🇽',lang:'es',focus:'Noticias, tecnología y videojuegos'},
  PT:{name:'Portugal',flag:'🇵🇹',lang:'pt',focus:'Atualidade, jogos e curiosidades'},
  ES:{name:'Espanha',flag:'🇪🇸',lang:'es',focus:'Tecnología, videojuegos y actualidad'},
  GB:{name:'Reino Unido',flag:'🇬🇧',lang:'en',focus:'Tech, gaming and world news'}
};
const $=id=>document.getElementById(id);
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeURL=s=>{try{let u=new URL(s);return u.protocol==='https:'?u.href:'#'}catch{return '#'}};
const today=()=>new Date().toLocaleDateString('en-CA');
const k='radarviral24h_history_v3';
let data={items:[],updated_at:null,errors:{},counts:{}};
let history=[];
let selectedTopic=null;
const initial={date:'2026-11-20',followers:9,views:2700,videos:18,spent:0};
function toast(msg){$('toast').textContent=msg;setTimeout(()=>{if($('toast').textContent===msg)$('toast').textContent=''},3500)}
function getHistory(){try{const v=JSON.parse(localStorage.getItem(k));return Array.isArray(v)?v:[]}catch{return []}}
function saveHistory(){localStorage.setItem(k,JSON.stringify(history))}
function initHistory(){history=getHistory();if(!history.length){history=[initial];saveHistory()}$('stat-date').value=today();renderStats()}
function renderStats(){history.sort((a,b)=>a.date.localeCompare(b.date));const first=history[0]||initial,last=history[history.length-1]||initial;const increase=last.followers-first.followers;
 $('current-followers').textContent=last.followers.toLocaleString('pt-BR');$('progress-count').innerHTML=`${Math.max(0,increase).toLocaleString('pt-BR')} <em>/ 2.000</em>`;$('progress-fill').style.width=Math.min(100,Math.max(0,increase)/2000*100)+'%';
 $('stat-followers').value=last.followers;$('stat-views').value=last.views;$('stat-videos').value=last.videos;$('stat-spend').value=last.spent;
 $('history-body').innerHTML=history.slice().reverse().map(r=>`<tr><td>${escapeHTML(r.date)}</td><td>${Number(r.followers).toLocaleString('pt-BR')}</td><td>${Number(r.views).toLocaleString('pt-BR')}</td><td>${r.videos}</td><td>${Number(r.spent).toLocaleString('pt-BR',{minimumFractionDigits:2})}</td></tr>`).join('');
 const graph=$('graph');if(history.length<2){graph.innerHTML='<span>Adicione outra medição, em uma data diferente, para visualizar o crescimento.</span>';return}
 const w=560,h=185,pad=28,values=history.map(r=>r.followers),mn=Math.min(...values),mx=Math.max(...values),spread=Math.max(1,mx-mn),points=values.map((v,i)=>[pad+i*(w-2*pad)/Math.max(1,values.length-1), h-pad-(v-mn)/spread*(h-2*pad)]),poly=points.map(a=>a.join(',')).join(' ');
 graph.innerHTML=`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Evolução de seguidores"><path d="M28 25H532M28 93H532M28 160H532" stroke="#31425b" stroke-width="1" fill="none"/><polyline points="${poly}" fill="none" stroke="#52edbe" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${points.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="4" fill="#52edbe"/>`).join('')}<text x="36" y="20" fill="#9eafc8" font-size="12">${mx.toLocaleString('pt-BR')} seguidores</text><text x="36" y="179" fill="#9eafc8" font-size="12">${mn.toLocaleString('pt-BR')} seguidores</text></svg>`;
}
function addRecord(e){e.preventDefault();const item={date:$('stat-date').value,followers:Number($('stat-followers').value),views:Number($('stat-views').value),videos:Number($('stat-videos').value),spent:Number($('stat-spend').value)};
 if(!/^\d{4}-\d{2}-\d{2}$/.test(item.date)||Object.values(item).slice(1).some(v=>!Number.isFinite(v)||v<0)){toast('Corrija os dados do registro');return}
 history=history.filter(x=>x.date!==item.date);history.push(item);saveHistory();renderStats();toast('Medição salva neste navegador')}
function toCSV(rows){const head='data;seguidores;videos;visualizacoes;investimento_reais';return '\ufeff'+head+'\n'+rows.map(r=>[r.date,r.followers,r.videos,r.views,r.spent].join(';')).join('\n')+'\n'}
function download(dataText,filename,mime){const blob=new Blob([dataText],{type:mime});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
async function importCSV(e){const f=e.target.files?.[0];if(!f)return;const text=await f.text(),lines=text.replace(/^\ufeff/,'').trim().split(/\r?\n/),sep=lines[0]?.includes(';')?';':',';const header=lines[0].toLowerCase().split(sep).map(x=>x.trim()),keys=['data','seguidores','videos','visualizacoes','investimento_reais'];if(!keys.every(x=>header.includes(x))){toast('CSV incompatível. Exporte pela versão 2.');return}
 let count=0;for(const line of lines.slice(1)){const cells=line.split(sep),obj=Object.fromEntries(header.map((x,i)=>[x,cells[i]]));const entry={date:obj.data,followers:Number(obj.seguidores),videos:Number(obj.videos),views:Number(obj.visualizacoes),spent:Number(obj.investimento_reais.replace(',','.'))};if(!/^\d{4}-\d{2}-\d{2}$/.test(entry.date)||Object.values(entry).slice(1).some(v=>!Number.isFinite(v)||v<0))continue;history=history.filter(x=>x.date!==entry.date);history.push(entry);count++}
 saveHistory();renderStats();toast(count+' medição(ões) importada(s)');e.target.value=''}
function nav(key){document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x.dataset.tab===key));document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x.id==='tab-'+key));window.scrollTo({top:0,behavior:'smooth'})}
const dtFormat=s=>{if(!s)return 'Pendente';const t=new Date(s);return isNaN(t.getTime())?'':t.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',timeZone:'America/Bahia'})+' (BA)'};
async function loadTopics(){try{const response=await fetch('data/topics.json?t='+Date.now(),{cache:'no-store'});if(!response.ok)throw Error('HTTP '+response.status);data=await response.json();if(!Array.isArray(data.items))throw Error('Formato inválido');$('topics-total').textContent=data.items.length;$('last-update').textContent='Atualização: '+dtFormat(data.updated_at);$('data-indicator').textContent=data.items.length?'Radar atualizado':(data.updated_at?'Nenhuma pauta recebida; veja erros das fontes':'Buscando primeira atualização');$('data-indicator').classList.toggle('ready',!!data.updated_at);renderNews()}
 catch(e){$('data-indicator').textContent='Fonte temporariamente indisponível';$('news-list').innerHTML='<div class="empty">Não foi possível carregar a coleta. O painel continua funcionando para registrar seguidores e preparar conteúdo.<br>Verifique a publicação no GitHub Actions.</div>';toast('Coleta não disponível: '+e.message)}}
function renderNews(){const region=$('country-filter').value,kind=$('kind-filter').value,query=$('search').value.trim().toLowerCase();const list=data.items.filter(i=>(region==='ALL'||i.country===region)&&(kind==='ALL'||i.kind===kind)&&(!query||i.title.toLowerCase().includes(query)||String(i.source).toLowerCase().includes(query))).slice(0,80);
 $('country-strip').innerHTML=Object.entries(CONFIG).map(([code,c])=>`<button class="chip" data-country="${code}">${c.flag} ${escapeHTML(c.name)} <b>${data.counts?.[code]??0}</b></button>`).join('');document.querySelectorAll('[data-country]').forEach(x=>x.onclick=()=>{$('country-filter').value=x.dataset.country;renderNews()});
 $('news-list').innerHTML=list.length?list.map(item=>`<article class="news-card"><div class="meta"><span>${CONFIG[item.country]?.flag||''} ${escapeHTML(CONFIG[item.country]?.name||item.country)}</span><span class="pill ${item.kind==='pesquisa'?'trend':''}">${item.kind==='pesquisa'?'Busca em alta no Google':'Notícia destacada'}</span></div><h3>${escapeHTML(item.title)}</h3><div class="meta"><span>Fonte: ${escapeHTML(item.source||'não identificada')}</span>${item.traffic?`<span>Buscas aproximadas: ${escapeHTML(item.traffic)}</span>`:''}</div><div class="card-footer"><a href="${escapeHTML(safeURL(item.url))}" target="_blank" rel="noopener noreferrer">Consultar fonte ↗</a><button type="button" class="use-topic" data-index="${data.items.indexOf(item)}">Preparar vídeo ↗</button></div></article>`).join(''):'<div class="empty">Nenhuma pauta nessa seleção. Tente outro país ou aguarde a próxima atualização. <a href="https://ads.tiktok.com/creative/creativeCenter/trends" target="_blank" rel="noopener">Ver tendências oficiais TikTok ↗</a></div>';
 document.querySelectorAll('.use-topic').forEach(b=>b.addEventListener('click',()=>{const i=data.items[Number(b.dataset.index)];if(!i)return;$('video-country').value=i.country;$('video-topic').value=i.title;$('video-source').value=safeURL(i.url);$('v4-facts').value='';$('v4-narration').value='';$('v4-verified').checked=false;nav('campaign');toast('Pauta selecionada; verifique os fatos na fonte.')}));
 const errors=Object.keys(data.errors||{});$('source-status').textContent='Fontes: Google Trends RSS e Google Notícias RSS. Dados de pesquisas e manchetes, não métricas do TikTok. '+(errors.length?'Algumas fontes falharam: '+errors.join(', ')+'.':'')}
function briefing(){const country=$('video-country').value,locale=CONFIG[country].lang,topic=$('video-topic').value.trim(),source=$('video-source').value.trim();if(!topic){toast('Escolha um assunto ou título');return}const locales={
 pt:{head:'GANCHO',body:'Inclua em 1 frase o FATO confirmado na fonte (sem inventar detalhes).',why:'Explique por que esse assunto interessa ao público.',end:'Qual a sua opinião? Siga @radarviral24h para mais notícias.',tags:'#Noticias #Curiosidades #RadarViral24H'},
 en:{head:'HOOK',body:'Add one verified fact from the source. Do not invent specifics.',why:'Explain why the audience should care.',end:'What do you think? Follow @radarviral24h for more.',tags:'#News #Trending #RadarViral24H'},
 es:{head:'GANCHO',body:'Añade un hecho verificado de la fuente. No inventes detalles.',why:'Explica por qué importa a la audiencia.',end:'¿Qué opinas? Sigue @radarviral24h para más.',tags:'#Noticias #Actualidad #RadarViral24H'}};const t=locales[locale];
 const msg=`RADAR VIRAL 24H — BRIEFING PARA ${CONFIG[country].name.toUpperCase()} (${locale})\nTEMA: ${topic}\nFONTE PARA CONFERIR: ${source||'ADICIONE UMA FONTE CONFIÁVEL ANTES DE PUBLICAR'}\n\n0–3s | ${t.head}: ${topic}\n3–12s | FATO: ${t.body}\n12–22s | CONTEXTO: ${t.why}\n22–30s | ENCERRAMENTO: ${t.end}\n\nEDICAO: 9:16; voz natural; 1 imagem por vez; legendas discretas; fonte de imagens autorizada; marcações de IA quando exigidas.\nHASHTAGS: ${t.tags}\n\nATENCAO: roteiro estrutural, NAO e uma noticia verificada. Confira a fonte, as datas e o contexto.`;
 $('brief-result').textContent=msg;toast('Briefing preparado. Verifique os fatos.')}
async function copy(t){try{await navigator.clipboard.writeText(t);toast('Copiado')}
 catch{const el=document.createElement('textarea');el.value=t;document.body.append(el);el.select();document.execCommand('copy');el.remove();toast('Copiado')}}
function renderCountries(){const texts={pt:['Abrir link em português','Tendências oficiais'],en:['Get follow link in English','Official trends'],es:['Abrir enlace en español','Tendencias oficiales']};$('country-cards').innerHTML=Object.entries(CONFIG).map(([code,c])=>`<div class="country-card"><b>${c.flag} ${c.name}</b><p>${escapeHTML(c.focus)}</p><a href="seguir.html?lang=${c.lang}" target="_blank" rel="noopener">${texts[c.lang][0]} ↗</a><p><a target="_blank" rel="noopener" href="https://ads.tiktok.com/creative/creativeCenter/trends?countryCode=${code}">${texts[c.lang][1]} ↗</a></p></div>`).join('');$('landing-link').textContent=new URL('seguir.html?lang=en',document.baseURI).href}
function init(){initHistory();renderCountries();$('stats-form').onsubmit=addRecord;$('refresh').onclick=loadTopics;
 document.querySelectorAll('[data-tab]').forEach(btn=>btn.onclick=()=>nav(btn.dataset.tab));['country-filter','kind-filter','search'].forEach(id=>$(id).addEventListener(id==='search'?'input':'change',renderNews));
 $('generate-brief').onclick=briefing;$('copy-brief').onclick=()=>copy($('brief-result').textContent);$('copy-landing').onclick=()=>copy(new URL('seguir.html?lang=en',document.baseURI).href);
 $('export-csv').onclick=()=>download(toCSV(history),'radarviral_historico.csv','text/csv;charset=utf-8');
 $('export-json').onclick=()=>download(JSON.stringify({exported_at:new Date().toISOString(),history},null,2),'radarviral_backup.json','application/json');
 $('import-csv').onchange=importCSV;initStudioV4();loadTopics()}

function studioText(){return $('v4-narration').value.trim()}
function buildDraftV4(){
 const facts=$('v4-facts').value.split('\n').map(x=>x.trim()).filter(Boolean).slice(0,6);
 if(!facts.length){toast('Primeiro escreva fatos que você conferiu na fonte.');return}
 const lang=CONFIG[$('video-country').value].lang,topic=$('video-topic').value.trim();
 const labels={pt:['Acompanhe essa notícia:','Siga o Radar Viral 24H para acompanhar as novidades.'],en:['Here is the update:','Follow Radar Viral 24H for more verified updates.'],es:['Esta es la noticia:','Sigue Radar Viral 24H para más novedades verificadas.']}[lang];
 $('v4-narration').value=[topic?topic+'.':'',labels[0],...facts.map(x=>x.replace(/^[-•\d.)\s]+/,'')),labels[1]].filter(Boolean).join('\n\n');
 $('v4-verified').checked=false;toast('Rascunho criado a partir dos fatos informados. Revise a entonação e a data.')
}
let browserVoices=[];
function loadV4Voices(){
 const pick=$('v4-voice');if(!pick)return;
 if(!('speechSynthesis' in window)){pick.innerHTML='<option>Seu navegador não oferece prévia de fala</option>';return}
 browserVoices=speechSynthesis.getVoices()||[];
 const target=CONFIG[$('video-country').value].lang;
 const current=pick.value;
 const options=browserVoices.map((v,i)=>({v,i})).filter(x=>x.v.lang.toLowerCase().startsWith(target));
 const subset=options.length?options:browserVoices.map((v,i)=>({v,i}));
 pick.innerHTML='';
 subset.forEach(x=>{const o=document.createElement('option');o.value=String(x.i);o.textContent=x.v.name+' — '+x.v.lang;pick.append(o)});
 if(!subset.length){const o=document.createElement('option');o.textContent='Voz padrão do sistema';o.value='';pick.append(o)}
 else if([...pick.options].some(o=>o.value===current)){pick.value=current}
}
function playV4(){
 if(!('speechSynthesis' in window)){toast('Seu navegador não oferece narração de prévia.');return}
 const text=studioText();if(!text){toast('Preencha a narração antes de ouvir.');return}
 speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);
 const lang=CONFIG[$('video-country').value].lang;u.lang=lang==='pt'?'pt-BR':lang==='es'?'es-MX':'en-US';
 const i=Number($('v4-voice').value);if(browserVoices[i])u.voice=browserVoices[i];
 u.rate=Number($('v4-speed').value);u.pitch=1.0;
 speechSynthesis.speak(u);toast('Prévia iniciada; ouça e ajuste o texto.')
}
function exportV4(){
 const topic=$('video-topic').value.trim(),source=$('video-source').value.trim();
 const narration=studioText(),facts=$('v4-facts').value.split('\n').map(x=>x.trim()).filter(Boolean);
 if(topic.length<6||facts.length===0||narration.length<50){toast('Preencha manchete, fatos confirmados e narração (50+ caracteres).');return}
 if(safeURL(source)==='#'){toast('Informe uma URL HTTPS da fonte.');return}
 if(!$('v4-verified').checked){toast('Confira os fatos e marque a confirmação antes de exportar.');return}
 const language=CONFIG[$('video-country').value].lang;
 const map={pt:'Português (Brasil)',en:'Inglês (EUA)',es:'Espanhol (México)'};
 const pack={format:'radar-v4-brief',version:4,created_at:new Date().toISOString(),country:$('video-country').value,
  language:map[language],topic,source,facts,narration,voice_hint:language,
  editorial_note:'Roteiro revisado pelo usuário; aprovação final de áudio, imagens e direitos antes da publicação.'};
 download(JSON.stringify(pack,null,2),'radar_v4_roteiro.json','application/json;charset=utf-8');toast('Roteiro V4 salvo. Importe no Estúdio Windows para gerar MP4.')
}
function initStudioV4(){
 $('v4-draft').onclick=buildDraftV4;$('v4-play').onclick=playV4;
 $('v4-stop').onclick=()=>{if('speechSynthesis' in window)speechSynthesis.cancel();toast('Narração interrompida')};
 $('v4-download').onclick=exportV4;
 $('v4-speed').oninput=()=>{$('v4-speed-label').textContent=Number($('v4-speed').value).toFixed(2).replace('.',',')+'×'};
 $('video-country').addEventListener('change',loadV4Voices);
 if('speechSynthesis' in window)speechSynthesis.addEventListener?.('voiceschanged',loadV4Voices);
 loadV4Voices();
}

document.addEventListener('DOMContentLoaded',init);
// Quando a coleta do Windows estiver em andamento, a interface recarrega o JSON periodicamente.
// Sites estáticos publicados também se beneficiam enquanto a primeira execução termina.
let refreshTries=0;
setInterval(()=>{if((!Array.isArray(data.items)||data.items.length===0)&&refreshTries<15){refreshTries++;loadTopics()}},20000);

