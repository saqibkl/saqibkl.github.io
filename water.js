// Water box: two works, the water level follows the cursor (5% to 95%). Used by index.html (hero) and water.html.
(()=>{const box=document.getElementById("box")||document.getElementById("collage"),w=document.getElementById("water");
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
let target=.4,level=.4,t=0;  // starts at 40% until the cursor moves
// Cursor above the box = full water, below = empty, in between follows the cursor.
const track=y=>{const r=box.getBoundingClientRect();target=Math.min(.95,Math.max(.25,(r.bottom-y)/r.height))};  // never fully empty or full: both scenes always show
addEventListener("pointermove",e=>{track(e.clientY);if(reduce)draw()});
function draw(){
  level+=(target-level)*(reduce?1:.07); t+=.035;
  const top=(1-level)*100, amp=3.2, p=[];
  for(let i=0;i<=24;i++){const x=i*100/24;p.push(`${x}% ${top+amp*(Math.sin(x/9+t)+.5*Math.sin(x/4.5-t*1.4))}%`)}
  w.style.clipPath=`polygon(${p.join(",")},100% 100%,0 100%)`;
  if(!reduce)requestAnimationFrame(draw)
}
draw();
// Content inside the box: these six branding thumbnails only (picked by Saqib), in this order.
const SLUGS=["ultra-natif-skincare-brand-identity","winder-stilhaus-brand-identity","stayvn-brand-identity","noara-labs-brand-identity","spice-web-media-brand-identity","universal-hr-brand-identity"];
const pool=SLUGS.map(s=>(window.PROJECTS||[]).find(p=>p.slug===s)).filter(Boolean).map(p=>[p.thumb.src,p.title.split(/[:—]/)[0].trim()]);
const dry=document.getElementById("dry"),A=document.getElementById("a"),B=document.getElementById("b");
// Shuffled order: each round deals two different works at random and never repeats the one just shown.
let cur=[-1,-1];
function setWorks(){
  const pick=skip=>{let i;do i=Math.floor(Math.random()*pool.length);while(skip.includes(i));return i};
  const wi=pick(cur),di=pick([wi,...cur]);cur=[wi,di];
  const [ws,wn]=pool[wi],[ds,dn]=pool[di];
  [[w,ws],[dry,ds]].forEach(([el,src])=>{const i=new Image();i.onload=()=>{el.style.opacity=0;setTimeout(()=>{el.src=src;el.style.opacity=1},300)};i.src=src});
  if(A)A.textContent=wn;if(B)B.textContent=dn;
}
setWorks();
if(!reduce)setInterval(setWorks,4500);
})();
