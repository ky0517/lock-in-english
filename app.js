'use strict';
const STORAGE_KEY='lock-in-english-basic-v1';
const $=id=>document.getElementById(id);
let words=[],progress={},queue=[],current=null,revealed=false;
const dateKey=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
function addDays(n){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+n);return dateKey(d)}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(progress))}
function state(w){return progress[w.en]||{stage:0,due:null}}
function due(w){const s=state(w);return !s.mastered&&(s.stage===0||!!s.due&&s.due<=dateKey())}
function status(w){const s=state(w);return s.mastered?'★ 完全に覚えた':s.stage===0?'未習得':due(w)?'復習日到来':`復習待ち（${s.due}）`}
function updateStats(){
 const mastered=words.filter(w=>state(w).mastered).length;
 const learning=words.filter(w=>!state(w).mastered&&state(w).stage>0).length;
 const learned=mastered+learning;
 $('knownCount').textContent=learned;
 $('masteredCount').textContent=mastered;
 $('dueCount').textContent=words.filter(due).length;
 $('totalCount').textContent=words.length;
 $('progressFill').style.width=`${words.length?learned/words.length*100:0}%`;
 $('progressText').textContent=`覚えた単語 ${learned} / ${words.length} 語（完全習得 ${mastered} 語・復習中 ${learning} 語）`;
}
function setMastery(w,mastered){
 progress[w.en]=mastered?{stage:4,due:null,mastered:true}:{stage:0,due:null,mastered:false};
 save();updateStats();buildQueue();renderList();
}
function buildQueue(){queue=words.filter(due).map(w=>w.en);showNext()}
function showNext(){revealed=false;current=queue.length?words.find(w=>w.en===queue[0]):null;const active=!!current;$('card').hidden=!active;$('known').disabled=!active;$('again').disabled=!active;if(!active){$('studyMessage').textContent='今日の学習は完了！ 次の復習日を楽しみに。';return}$('studyMessage').textContent='意味を思い出してから答えを表示しよう';$('cardIndex').textContent=`WORD ${words.indexOf(current)+1} / ${words.length}`;$('word').textContent=current.en;$('ipa').textContent=current.ipa||'';$('meaning').textContent=current.ja;$('example').textContent=current.example||'';$('translation').textContent=current.exampleJa||'';$('example').hidden=!current.example;$('speakExample').hidden=!current.example;$('translation').hidden=!current.exampleJa;$('answer').hidden=true;$('reveal').hidden=false;$('known').disabled=true;$('again').disabled=true}
function reveal(){if(!current)return;revealed=true;$('answer').hidden=false;$('reveal').hidden=true;$('known').disabled=false;$('again').disabled=false}
function grade(success){if(!current||!revealed)return;const key=current.en;const s=state(current);if(success){const stage=Math.min((s.stage||0)+1,4);const days=[0,3,7,14,30][stage];progress[key]={stage,due:addDays(days)}}else{progress[key]={stage:0,due:null}}save();queue.shift();if(!success){queue.push(key)}updateStats();showNext();renderList()}
function speak(text){if(!('speechSynthesis'in window)){alert('このブラウザは音声再生に対応していません');return}speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=.85;const voices=speechSynthesis.getVoices();const v=voices.find(v=>v.lang==='en-US')||voices.find(v=>v.lang.startsWith('en'));if(v)u.voice=v;speechSynthesis.speak(u)}
function renderList(){const term=$('search').value.toLowerCase().trim(),filter=$('filter').value;const selected=words.filter(w=>(w.en.toLowerCase().includes(term)||w.ja.includes(term))&&(filter==='all'||filter==='new'&&!state(w).mastered&&state(w).stage===0||filter==='review'&&!state(w).mastered&&state(w).stage>0&&!due(w)||filter==='due'&&!state(w).mastered&&state(w).stage>0&&due(w)||filter==='mastered'&&!!state(w).mastered));const root=$('wordList');root.replaceChildren();for(const w of selected){const r=document.createElement('div');r.className='list-row';const info=document.createElement('div');info.className='info';const name=document.createElement('strong');name.textContent=w.en;const sub=document.createElement('small');sub.textContent=`${w.ipa||''} · ${w.ja}`;const badge=document.createElement('div');badge.className='status';badge.textContent=status(w);info.append(name,sub,badge);const audio=document.createElement('button');audio.textContent='🔊';audio.title='発音を聞く';audio.onclick=()=>speak(w.en);const exampleAudio=document.createElement('button');exampleAudio.textContent='▶ 例文';exampleAudio.className='list-example-audio';exampleAudio.title='例文を聞く';exampleAudio.disabled=!w.example;exampleAudio.onclick=()=>w.example&&speak(w.example);const mastered=!!state(w).mastered;
 const toggle=document.createElement('button');
 toggle.textContent=mastered?'↻ 再学習':'★ 完全に覚えた';
 toggle.className=mastered?'relearn-btn':'master-btn';
 toggle.title=mastered?'未習得に戻して再び出題する':'永久に通常・復習出題から除外する';
 toggle.onclick=()=>setMastery(w,!mastered);
 r.classList.toggle('mastered-row',mastered);
 r.append(info,audio,exampleAudio,toggle);root.append(r)}if(!selected.length){const p=document.createElement('p');p.className='muted';p.textContent='該当する単語がありません';root.append(p)}}
function updateTopButton(){const onList=!$('list').hidden;$('backToTop').hidden=!onList||window.scrollY<260}
function download(name,data){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function bind(){$('reveal').onclick=reveal;$('known').onclick=()=>grade(true);$('again').onclick=()=>grade(false);$('speak').onclick=()=>current&&speak(current.en);$('speakExample').onclick=()=>current&&current.example&&speak(current.example);$('backToTop').onclick=()=>window.scrollTo({top:0,behavior:'smooth'});window.addEventListener('scroll',updateTopButton,{passive:true});$('search').oninput=renderList;$('filter').onchange=renderList;document.querySelectorAll('.tab').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b===btn));document.querySelectorAll('.panel').forEach(p=>p.hidden=p.id!==btn.dataset.tab);if(btn.dataset.tab==='list')renderList();updateTopButton()});$('export').onclick=()=>download('lock-in-english-progress.json',{version:2,progress});$('import').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const obj=JSON.parse(await file.text());if(![1,2].includes(obj.version)||!obj.progress||typeof obj.progress!=='object'||Array.isArray(obj.progress))throw Error('ファイル形式が違います');const safe={};for(const w of words){const s=obj.progress[w.en];if(s&&Number.isInteger(s.stage)&&s.stage>=0&&s.stage<=4&&(s.due===null||/^\d{4}-\d{2}-\d{2}$/.test(s.due))){safe[w.en]={stage:s.stage,due:s.due,mastered:s.mastered===true}}}if(!confirm('現在の学習記録を読み込んだ記録で置き換えますか？'))return;progress=safe;save();updateStats();buildQueue();renderList();alert('読み込みました')}catch(err){alert('読み込み失敗: '+err.message)}finally{e.target.value=''}};$('reset').onclick=()=>{if(confirm('学習記録をすべて削除しますか？ この操作は元に戻せません。')){progress={};save();updateStats();buildQueue();renderList()}}}
async function init(){bind();try{const response=await fetch('data/words.json?v=500-fixed-20261014',{cache:'no-store'});if(!response.ok)throw Error('単語データを取得できません');words=await response.json();if(!Array.isArray(words)||words.length!==500)throw Error(`単語データが${Array.isArray(words)?words.length:'不正'}語です。500語版が反映されていません。GitHubのdata/words.jsonを確認してください。`);try{progress=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{}}catch{progress={}}updateStats();buildQueue();renderList()}catch(err){$('card').hidden=true;$('studyMessage').textContent=`読み込みエラー: ${err.message}。GitHub PagesなどのWebサーバーで開いてください。`}}
init();
