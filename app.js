(()=>{
"use strict";
const KEY="lockin_vocab_v1",DAYKEY="lockin_day_v1";
const starter=[
{en:"discipline",jp:"規律・自制心",example:"Discipline beats motivation."},
{en:"consistency",jp:"継続性・一貫性",example:"Consistency is the key."},
{en:"overcome",jp:"克服する・乗り越える",example:"Overcome your fears."},
{en:"procrastination",jp:"先延ばし",example:"Stop procrastinating."},
{en:"commitment",jp:"決意・責任を持って取り組むこと",example:"Make a commitment."}
];
const $=id=>document.getElementById(id);
function safeLoad(key,fallback){try{const x=JSON.parse(localStorage.getItem(key));return x??fallback}catch{return fallback}}
function makeWord(w){return {en:w.en.trim(),jp:w.jp.trim(),example:typeof w.example==="string"?w.example.trim():"",known:0,unknown:0,due:0,last:""}}
let words=safeLoad(KEY,null);
if(!Array.isArray(words)){words=starter.map(makeWord);save()}
let day=safeLoad(DAYKEY,{date:"",answers:0});
const localDate=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-")};
if(day.date!==localDate())day={date:localDate(),answers:0};
let queue=[],pos=0,revealed=false,mode="all";
function save(){localStorage.setItem(KEY,JSON.stringify(words))}
function saveDay(){localStorage.setItem(DAYKEY,JSON.stringify(day))}
function getId(w){return w.en.toLocaleLowerCase().replace(/\s+/g," ").trim()}
function start(type="all"){mode=type;queue=words.map((_,i)=>i).filter(i=>type!=="review"||words[i].unknown>0);for(let i=queue.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[queue[i],queue[j]]=[queue[j],queue[i]]}pos=0;revealed=false;render()}
function render(){
 $("total").textContent=words.length+" words";
 $("today").textContent="本日 "+day.answers+" 回";
 const done=pos>=queue.length;
 $("progress").textContent=queue.length?`${Math.min(pos+1,queue.length)} / ${queue.length} 枚`:"0 枚";
 $("bar").style.width=queue.length?Math.round(pos/queue.length*100)+"%":"0%";
 $("cardHint").textContent=done?"SESSION COMPLETE":"ENGLISH WORD";
 $("word").textContent=done?(words.length?"学習完了！":"単語を追加しよう"):(words[queue[pos]]?.en||"単語がありません");
 $("meaning").textContent=done?"":words[queue[pos]].jp;
 $("example").textContent=done?"":words[queue[pos]].example;
 $("reveal").classList.toggle("visible",!done&&revealed);
 $("tapHint").textContent=done?(words.length?"もう一度学習する場合は下のボタンから":"「単語を追加」から取り込めます"):(revealed?"自分の理解度を選ぼう":"タップして日本語訳を確認");
 $("tapHint").style.display=revealed?"none":"block";
 $("actions").style.display=done||!revealed?"none":"grid";
 $("studyHelp").style.display=done?"none":"block";
 $("card").setAttribute("aria-label",done?"学習終了":revealed?"日本語訳を表示中":"タップして日本語訳を表示");
 $("review").textContent="苦手単語だけ ("+words.filter(w=>w.unknown>0).length+")";
}
function flip(){if(pos>=queue.length)return;revealed=true;render()}
function answer(known){
 if(!revealed||pos>=queue.length)return;
 const i=queue[pos],w=words[i];if(!w)return;
 if(known){w.known++;w.last=localDate()}else{w.unknown++;w.last=localDate();const offset=Math.min(5,Math.max(1,queue.length-pos-1));queue.splice(pos+1+offset,0,i)}
 day.answers++;save();saveDay();pos++;revealed=false;render()
}
$("card").addEventListener("click",flip);
$("card").addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();flip()}});
$("known").onclick=()=>answer(true);$("unknown").onclick=()=>answer(false);
$("restart").onclick=()=>start("all");$("review").onclick=()=>start("review");
document.querySelectorAll(".tab").forEach(btn=>btn.onclick=()=>{
 document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b===btn));
 document.querySelectorAll(".panel").forEach(p=>p.classList.toggle("hidden",p.id!==btn.dataset.tab));
 if(btn.dataset.tab==="library")renderLibrary()
});
function normalizeImported(data){
 if(!Array.isArray(data))throw Error("JSONの一番外側は [ ] の配列にしてください。");
 if(data.length>3000)throw Error("一度に取り込めるのは3000語までです。");
 return data.map((w,i)=>{
  if(!w||typeof w.en!=="string"||typeof w.jp!=="string"||!w.en.trim()||!w.jp.trim())throw Error(`${i+1}件目にenまたはjpがありません。`);
  if(w.en.length>180||w.jp.length>500||(w.example&&String(w.example).length>1000))throw Error(`${i+1}件目の文字数が多すぎます。`);
  return makeWord(w)
 })
}
$("add").onclick=()=>{
 try{
  let raw=$("jsonInput").value.trim().replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,"");
  const incoming=normalizeImported(JSON.parse(raw)),seen=new Set(words.map(getId));let added=0;
  for(const w of incoming){if(!seen.has(getId(w))){words.push(w);seen.add(getId(w));added++}}
  save();start("all");$("importMsg").textContent=`${added}語追加しました（重複 ${incoming.length-added}語）。`;if(added)$("jsonInput").value="";
 }catch(e){$("importMsg").textContent="取り込み失敗: "+e.message}
};
$("copyPrompt").onclick=async()=>{try{await navigator.clipboard.writeText($("prompt").textContent);$("importMsg").textContent="プロンプトをコピーしました。"}catch{$("importMsg").textContent="コピーできませんでした。テキストを手動で選択してください。"}};
function renderLibrary(){
 $("count").textContent=words.length+"語";
 const q=$("search").value.toLowerCase().trim(),items=$("items");items.replaceChildren();
 words.forEach((w,i)=>{if(![w.en,w.jp].some(s=>s.toLowerCase().includes(q)))return;
  const row=document.createElement("div");row.className="item";
  const detail=document.createElement("div"),name=document.createElement("strong"),sub=document.createElement("small"),del=document.createElement("button");
  name.textContent=w.en;sub.textContent=`${w.jp} · わかった ${w.known} / わからなかった ${w.unknown}`;
  detail.append(name,sub);del.textContent="削除";del.setAttribute("aria-label",w.en+"を削除");
  del.onclick=()=>{if(confirm(`「${w.en}」を削除しますか？`)){words.splice(i,1);save();start();renderLibrary()}};
  row.append(detail,del);items.append(row)
 });
};
$("search").oninput=renderLibrary;
$("clearAll").onclick=()=>{if(confirm("登録単語と学習履歴をすべて削除します。元に戻せません。続けますか？")){words=[];save();start();renderLibrary()}};
$("export").onclick=()=>{
 const blob=new Blob([JSON.stringify({version:1,words,exportedAt:new Date().toISOString()},null,2)],{type:"application/json"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="lock-in-english-backup.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
};
$("restore").onchange=async e=>{
 const file=e.target.files?.[0];if(!file)return;
 try{
  const data=JSON.parse(await file.text());
  if(!data||!Array.isArray(data.words))throw Error("バックアップ形式ではありません。");
  const checked=normalizeImported(data.words);
  const seen=new Set(words.map(getId));let added=0;
  for(let i=0;i<checked.length;i++){const w=checked[i];if(!seen.has(getId(w))){const original=data.words[i];w.known=Math.max(0,Number(original.known)||0);w.unknown=Math.max(0,Number(original.unknown)||0);words.push(w);seen.add(getId(w));added++}}
  save();start();$("importMsg").textContent=`バックアップから${added}語を追加しました。既存単語は保持しました。`;
 }catch(err){$("importMsg").textContent="復元失敗: "+err.message}
 e.target.value="";
};
saveDay();start();
if("serviceWorker" in navigator&&location.protocol.startsWith("http"))window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
})();