/* ===== 상단 한국시간 (24h) ===== */
const timeEl = document.getElementById('timeKR');
function renderKRTime(){
  try{
    const s = new Intl.DateTimeFormat('ko-KR', {
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Seoul'
    }).format(new Date());
    timeEl.textContent = s;
  }catch{
    const d=new Date(), h=String(d.getHours()).padStart(2,'0'), m=String(d.getMinutes()).padStart(2,'0');
    timeEl.textContent = `${h}:${m}`;
  }
}
renderKRTime();
setInterval(renderKRTime, 60*1000);

/* ===== 중앙 스택: 클릭 시 SVG 레이어 쌓기 ===== */
(() => {
  const stack = document.getElementById('stack');
  const spacingVH = 3.556;                       // 레이어 간 간격 (vh)
  const spacingPx = () => window.innerHeight*(spacingVH/100);
  let offset = 0;
  const maxLayers = 17;

  function canAddMore(){ return stack.childElementCount < maxLayers; }

  document.querySelectorAll('.ingredient').forEach(item=>{
    item.addEventListener('click', () => {
      if(!canAddMore()) return;
      const file = item.getAttribute('data-svg');
      if(!file) return;

      const img = new Image();
      img.src = `svg/${file}`;
      img.style.bottom = `${offset}px`;

      // 빵은 조금 더 크게
      let w = 20.3;
      if(/bread\.svg$/i.test(file)) w = 22.8;
      img.style.width = w + 'vw';
      img.style.left = '50%';
      img.style.transform = 'translateX(-50%)';

      stack.appendChild(img);
      offset += spacingPx();
    });
  });

  // 단축키: Delete/Backspace = 마지막 제거, Cmd/Ctrl+K = 전체 초기화
  document.addEventListener('keydown', e=>{
    const isMac = navigator.platform.toUpperCase().includes('MAC');
    if(e.key==='Backspace' || e.key==='Delete'){
      const last = stack.lastElementChild;
      if(last){
        stack.removeChild(last);
        offset = Math.max(0, offset - spacingPx());
      }
    }
    if((isMac && e.metaKey && e.key.toLowerCase()==='k') || (!isMac && e.ctrlKey && e.key.toLowerCase()==='k')){
      stack.innerHTML = '';
      offset = 0;
    }
  });
})();

/* ===== 파란 메모: 토글 + 드래그 ===== */
(() => {
  const note = document.getElementById('floatNote');
  if(!note) return;

  let dragging = false, moved = false;
  let grabOffX = 0, grabOffY = 0;

  // 클릭 시 접기/펼치기 (직전 드래그 클릭은 무시)
  note.addEventListener('click', () => {
    if(moved){ moved = false; return; }
    note.classList.toggle('is-collapsed');
    const expanded = !note.classList.contains('is-collapsed');
    note.setAttribute('aria-expanded', String(expanded));
  });

  // 마우스 드래그
  note.addEventListener('mousedown', (e) => {
    if(e.button !== 0) return;
    dragging = true; moved = false;

    const rect = note.getBoundingClientRect();
    grabOffX = e.clientX - rect.left;
    grabOffY = e.clientY - rect.top;

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.body.style.userSelect = 'none';
  });

  function onMove(e){
    if(!dragging) return;
    moved = true;
    const vw=window.innerWidth, vh=window.innerHeight;
    const rect=note.getBoundingClientRect();

    let targetLeft = e.clientX - grabOffX;
    let targetTop  = e.clientY - grabOffY;

    targetLeft = Math.max(0, Math.min(targetLeft, vw - rect.width));
    targetTop  = Math.max(0, Math.min(targetTop,  vh - rect.height));

    note.style.left = targetLeft + 'px';
    note.style.top  = targetTop  + 'px';
  }

  function onUp(){
    dragging = false;
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    document.body.style.userSelect = '';
  }
})();

/* ===== 이미지 드래그 & 저장 억제 ===== */
(function hardenImages(){
  const apply = (img)=>{
    img.setAttribute('draggable','false');
    img.addEventListener('dragstart', e=>e.preventDefault());
    img.style.webkitUserDrag = 'none'; // Safari
  };
  document.querySelectorAll('img').forEach(apply);

  const mo = new MutationObserver(muts=>{
    muts.forEach(m=>{
      m.addedNodes.forEach(node=>{
        if(node.nodeType!==1) return;
        if(node.tagName==='IMG') apply(node);
        else node.querySelectorAll && node.querySelectorAll('img').forEach(apply);
      });
    });
  });
  mo.observe(document.documentElement,{childList:true,subtree:true});

  // 이미지 계열에서만 우클릭 방지
  document.addEventListener('contextmenu', (e)=>{
    if(e.target.closest('img, picture, canvas, svg')) e.preventDefault();
  });

  // 모바일 길게누르기 저장 억제
  let t;
  document.addEventListener('touchstart', (e)=>{
    if(e.target.closest('img, picture, canvas, svg')){
      t = setTimeout(()=>{ e.preventDefault(); }, 350);
    }
  }, {passive:false});
  document.addEventListener('touchend', ()=> clearTimeout(t), {passive:true});
})();

/* ===== 티커 무한 루프: 콘텐츠를 복제하여 200% 길이로 ===== */
(function () {
  const track = document.querySelector('.ticker .content');
  if (!track) return;

  if (!track.dataset.duplicated) {
    track.innerHTML += track.innerHTML;  // 한 번 더 붙여서 200% 길이
    track.dataset.duplicated = 'true';
  }

  // 리사이즈 시에도 부드럽게 유지 (선택적 재시작)
  let ticking = false;
  window.addEventListener('resize', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      track.style.animation = 'none';
      void track.offsetWidth; // 강제 리플로우
      track.style.animation = '';
      ticking = false;
    });
  });
})();
