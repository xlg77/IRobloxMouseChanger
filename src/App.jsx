import React, { useEffect, useRef, useState } from 'react';
import * as Babel from '@babel/standalone';
import { createPortal } from 'react-dom';
import { Check, MousePointer2, Gamepad2, SlidersHorizontal, Code2, Play, Square, Eye, Sparkles, Settings2, Monitor, ChevronRight, Palette, RotateCcw, Info, X } from 'lucide-react';
import GlowCursor from './cursors/GlowCursor.jsx';
import SwarmCursor from './cursors/SwarmCursor.jsx';
import GhostCursor from './cursors/GhostCursor.jsx';
import TargetCursor from './cursors/TargetCursor.jsx';
import FluidGlass from './cursors/FluidGlass.jsx';
import TextCursor from './cursors/TextCursor.jsx';
import SplashCursor from './cursors/SplashCursor.jsx';
import BlobCursor from './cursors/BlobCursor.jsx';

const CURSORS = [
  { id:'glow', name:'Glow Cursor', desc:'부드러운 빛 번짐 효과', tag:'GLOW', icon:'✦', color:'#78a8ff' },
  { id:'swarm', name:'Swarm Cursor', desc:'작은 입자들이 따라오는 효과', tag:'PARTICLE', icon:'✣', color:'#9c8cff' },
  { id:'ghost', name:'Ghost Cursor', desc:'안개처럼 흐르는 잔상', tag:'TRAIL', icon:'◌', color:'#72e6d0' },
  { id:'target', name:'Target Cursor', desc:'네 모서리 조준선 스타일', tag:'TARGET', icon:'⌗', color:'#ffb36b' },
  { id:'fluid', name:'Fluid Glass', desc:'유리 구슬 같은 포인터', tag:'GLASS', icon:'◉', color:'#a4c8ff' },
  { id:'text', name:'Text Cursor', desc:'움직임을 따라 글자가 남는 효과', tag:'TEXT', icon:'Aa', color:'#ff8eb5' },
  { id:'splash', name:'Splash Cursor', desc:'물감이 퍼지는 듯한 효과', tag:'SPLASH', icon:'✺', color:'#ffa3e0' },
  { id:'blob', name:'Blob Cursor', desc:'말랑한 젤리 형태의 포인터', tag:'BLOB', icon:'●', color:'#8ed7ff' }
];
const DEFAULT_CODE = `function Cursor({ x, y, color, size }) {\n  return (\n    <div style={{\n      position: 'absolute', left: x, top: y,\n      width: size, height: size, borderRadius: '50%',\n      background: color, transform: 'translate(-15%, -15%)',\n      boxShadow: '0 0 18px ' + color,\n      pointerEvents: 'none'\n    }} />\n  );\n}`;

function CursorGraphic({ type, x=220, y=180, color='#78a8ff', size=30, trail=65, speed=1, opacity=100, preview=false }) {
  const [history,setHistory] = useState([]);
  useEffect(() => {
    if (preview) return;
    setHistory(h => [...h.slice(-18), {x,y,id:Date.now()+Math.random()}]);
  }, [x,y,preview]);
  const style = { '--cursor-color': color, '--cursor-size': `${size}px`, '--trail': `${trail/100}`, '--speed': speed, opacity: opacity/100 };
  const tail = history.slice(-Math.max(2,Math.round(trail/7)));
  return <div className={`cursor-art cursor-${type}`} style={style}>
    {!preview && tail.map((p,i)=><i key={p.id} className="trail-dot" style={{left:p.x,top:p.y,opacity:(i+1)/tail.length*.34,transform:`translate(-50%,-50%) scale(${(i+1)/tail.length})`}}/>)}
    {type==='glow' && <><i className="glow-halo"/><i className="glow-core"/></>}
    {type==='swarm' && Array.from({length:12},(_,i)=><i key={i} className="swarm-dot" style={{'--i':i, background:color}}/>)}
    {type==='ghost' && <><i className="ghost-ring ghost-a"/><i className="ghost-ring ghost-b"/><i className="ghost-core"/></>}
    {type==='target' && <><i className="target-corner tl"/><i className="target-corner tr"/><i className="target-corner bl"/><i className="target-corner br"/><i className="target-dot"/></>}
    {type==='fluid' && <i className="fluid-ball"/>}
    {type==='text' && <><b className="text-stamp">Aa</b><i className="text-caret"/></>}
    {type==='splash' && <><i className="splash-core"/>{Array.from({length:8},(_,i)=><i key={i} className="splash-drop" style={{'--i':i}}/>)}</>}
    {type==='blob' && <i className="blob-shape"/>}
  </div>;
}

function Overlay({settings, onClose, customComponent}) {
  const [liveSettings,setLiveSettings]=useState(settings || {cursor:'glow',color:'#78a8ff',size:30,trail:65,speed:1,opacity:100});
  const [uiActive,setUiActive]=useState(false);
  const pointerRef=useRef(null);
  const uiScoreRef=useRef(0);
  useEffect(()=>{
    let alive=true;
    window.mouseChanger?.getOverlaySettings?.().then(value=>{if(alive&&value)setLiveSettings(value);}).catch(()=>{});
    const off=window.mouseChanger?.onOverlaySettings?.(value=>{if(value)setLiveSettings(value);});
    const offCursor=window.mouseChanger?.onCursorPosition?.(point=>{pointerRef.current=point;});
    const offFrame=window.mouseChanger?.onScreenFrame?.(frame=>{
      const point=pointerRef.current;
      if(!point || !frame?.dataUrl || !frame.bounds) return;
      const image=new Image();
      image.onload=()=>{
        if(!alive) return;
        const px=Math.round((point.x-frame.bounds.x)/frame.bounds.width*image.width);
        const py=Math.round((point.y-frame.bounds.y)/frame.bounds.height*image.height);
        const radiusX=Math.max(12,Math.round(image.width*90/frame.bounds.width));
        const radiusY=Math.max(10,Math.round(image.height*58/frame.bounds.height));
        const left=Math.max(1,px-radiusX), right=Math.min(image.width-1,px+radiusX);
        const top=Math.max(1,py-radiusY), bottom=Math.min(image.height-1,py+radiusY);
        if(right-left<8 || bottom-top<8) return;
        const canvas=document.createElement('canvas');
        canvas.width=image.width; canvas.height=image.height;
        const context=canvas.getContext('2d',{willReadFrequently:true});
        if(!context) return;
        context.drawImage(image,0,0,image.width,image.height);
        const pixels=context.getImageData(left,top,right-left,bottom-top).data;
        const patchWidth=right-left, patchHeight=bottom-top;
        const lumaAt=(x,y)=>{const i=(y*patchWidth+x)*4;return pixels[i]*0.2126+pixels[i+1]*0.7152+pixels[i+2]*0.0722;};
        let edgeCount=0,samples=0,sum=0,sumSq=0;
        for(let y=1;y<patchHeight-1;y+=2) for(let x=1;x<patchWidth-1;x+=2){
          const value=lumaAt(x,y);
          if(Math.abs(value-lumaAt(x-1,y))>34 || Math.abs(value-lumaAt(x,y-1))>34) edgeCount++;
          sum+=value; sumSq+=value*value; samples++;
        }
        const variance=samples?sumSq/samples-(sum/samples)**2:0;
        const edgeRatio=samples?edgeCount/samples:0;
        const looksLikeUi=edgeRatio>0.075 && variance>190;
        uiScoreRef.current=looksLikeUi?Math.min(3,uiScoreRef.current+1):Math.max(0,uiScoreRef.current-1);
        setUiActive(uiScoreRef.current>=2);
      };
      image.src=frame.dataUrl;
    });
    return ()=>{alive=false;off?.();offCursor?.();offFrame?.();};
  },[]);
  useEffect(()=>{const key=e=>{if(e.key==='Escape') onClose();};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[onClose]);
  const color=liveSettings.color || '#78a8ff';
  const size=Number(liveSettings.size)||30;
  const style={width:'100%',height:'100%',opacity:(Number(liveSettings.opacity)||100)/100};
  const id=liveSettings.cursor || 'glow';
  let effect;
  if(id==='swarm') effect=<SwarmCursor color={color} accentColor={color} size={Math.max(1.2,size/12)} speed={liveSettings.speed||1} hideCursor={false} style={style}/>;
  else if(id==='ghost') effect=<GhostCursor color={color} size={Math.max(24,size*2.6)} trailLength={Math.max(1,liveSettings.trail||50)} hideCursor={false} style={style}/>;
  else if(id==='target') effect=<TargetCursor cursorColor={color} size={Math.max(18,size*1.2)} hideDefaultCursor={false}/>;
  else if(id==='fluid') effect=<FluidGlass color={color} size={Math.max(100,size*4)} interaction="follow" style={style}/>;
  else if(id==='text') effect=<TextCursor text="Aa" color={color} fontSize={Math.max(14,size)} hideCursor={false} style={style}/>;
  else if(id==='splash') effect=<SplashCursor colors={[color]} rainbow={false} size={Math.max(.35,size/30)} theme="dark" style={style}/>;
  else if(id==='blob') effect=<BlobCursor color={color} size={Math.max(48,size*4)} hideCursor={false} style={style}/>;
  else effect=<GlowCursor color={color} trailWidth={Math.max(.5,size/10)} glow={uiActive?2:1.2} quality="high" enabled style={style}/>;
  return <div className="overlay-root" aria-hidden="true"><div className={`overlay-effect-stage${uiActive?' ui-active':''}`}>{effect}</div></div>;
}
export default function App(){
  const isOverlay = window.location.hash.includes('/overlay') && !window.location.hash.includes('/overlay-controls');
  const isOverlayControls = window.location.hash.includes('/overlay-controls');
  const [page,setPage]=useState('home');
  const [systemMessage,setSystemMessage]=useState('');
  const [systemBusy,setSystemBusy]=useState(false);
  const [active,setActive]=useState(false);
  const [settings,setSettings]=useState({cursor:'glow',color:'#78a8ff',size:30,trail:65,speed:1,opacity:100});
  const [customCode,setCustomCode]=useState(DEFAULT_CODE);
  const [customComponent,setCustomComponent]=useState(null);
  const [customError,setCustomError]=useState('');
  const [previewPos,setPreviewPos]=useState({x:220,y:150});
  const selected=CURSORS.find(c=>c.id===settings.cursor)||CURSORS[0];
  const update=(key,value)=>setSettings(s=>({...s,[key]:value}));
  const start=async()=>{if(window.mouseChanger){await window.mouseChanger.startOverlay(settings);setActive(true);}};
  const stop=async()=>{if(window.mouseChanger){await window.mouseChanger.stopOverlay();setActive(false);}};
  const applyCode=()=>{
    try {
      // JSX source is compiled as a local React component; Node integration is disabled.
      const js=Babel.transform(customCode,{presets:['react'],filename:'CustomCursor.jsx'}).code;
      const factory=new Function('React',`${js}; return typeof Cursor !== 'undefined' ? Cursor : (typeof App !== 'undefined' ? App : null);`);
      const Component=factory(React);
      if(typeof Component!=='function') throw new Error('Cursor 또는 App 컴포넌트를 정의해 주세요.');
      setCustomComponent(()=>Component); update('cursor','custom'); setCustomError('');
    } catch(e){setCustomError(e.message||'코드를 확인해 주세요.');}
  };
  if(isOverlayControls) return <div style={{width:'100%',height:'100%',boxSizing:'border-box',padding:12,fontFamily:'Segoe UI, sans-serif',color:'#fff',background:'rgba(17,25,45,.96)',border:'1px solid rgba(130,160,230,.45)',borderRadius:14,boxShadow:'0 10px 35px rgba(0,0,0,.35)'}}><div style={{fontSize:12,fontWeight:800,letterSpacing:'.08em',marginBottom:9,color:'#b9ccff'}}>IROBLOXMOUSECHANGER · OVERLAY</div><button onClick={()=>window.mouseChanger?.restoreAndStopOverlay()} style={{width:'100%',border:0,borderRadius:9,padding:'10px 8px',background:'#6e91ff',color:'#fff',fontWeight:800,cursor:'pointer'}}>↩ 원래 커서 복원 및 오버레이 종료</button><button onClick={()=>window.mouseChanger?.closeOverlayOnly()} style={{width:'100%',marginTop:6,border:'1px solid #56627d',borderRadius:9,padding:'7px',background:'transparent',color:'#dce5ff',cursor:'pointer'}}>오버레이만 종료</button></div>;
  if(isOverlay) return <Overlay settings={settings} onClose={stop} customComponent={customComponent}/>;
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><MousePointer2 size={22}/></div><div><strong>IRobloxMouseChanger</strong><small>CURSOR STUDIO</small></div></div>
      <div className="side-label">WORKSPACE</div>
      <button className={page==='home'?'nav-item active':'nav-item'} onClick={()=>setPage('home')}><Monitor size={18}/> 대시보드</button>
      <button className={page==='cursors'?'nav-item active':'nav-item'} onClick={()=>setPage('cursors')}><MousePointer2 size={18}/> 커서 라이브러리 <span>8</span></button>
      <button className={page==='customize'?'nav-item active':'nav-item'} onClick={()=>setPage('customize')}><SlidersHorizontal size={18}/> 커스터마이징</button>
      <button className={page==='system'?'nav-item active':'nav-item'} onClick={()=>{setPage('system');setSystemMessage('');}}><Monitor size={18}/> Windows 시스템 커서</button>
      <button className={page==='code'?'nav-item active':'nav-item'} onClick={()=>setPage('code')}><Code2 size={18}/> React 코드</button>
      <div className="sidebar-bottom"><div className="status-card"><span className="status-dot"/><div><b>Windows 오버레이</b><small>투명 배경 · 클릭 통과</small></div></div><small className="version">VERSION 1.0.2 · XLG77</small></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div><span className="breadcrumb">CURSOR STUDIO</span><ChevronRight size={14}/><b>{({home:'대시보드',cursors:'커서 라이브러리',customize:'커스터마이징',system:'Windows 시스템 커서',code:'React 코드'})[page]}</b></div><div className="top-actions"><span className="windows-chip"><Monitor size={14}/> WINDOWS</span><button className="icon-btn" title="정보"><Info size={17}/></button></div></header>
      <div className="content">
      {page==='home' && <>
        <section className="welcome"><div><div className="eyebrow"><Sparkles size={14}/> YOUR POINTER, YOUR STYLE</div><h1>Roblox 커서를<br/><em>새롭게 바꿔보세요.</em></h1><p>원하는 커서를 고르고, 미리 체험하고, 투명 오버레이로 Roblox에서 사용해 보세요.</p><div className="welcome-actions"><button className="primary-btn" onClick={()=>setPage('cursors')}><MousePointer2 size={17}/> 커서 선택하기</button><button className="secondary-btn" onClick={()=>setPage('customize')}><SlidersHorizontal size={16}/> 설정 조정</button></div></div><div className="hero-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="hero-cursor"><CursorGraphic type={settings.cursor==='custom'?'glow':settings.cursor} color={settings.color} size={42} preview/></div><span className="hero-tag">LIVE PREVIEW</span></div></section>
        <div className="section-heading"><div><h2>빠른 시작</h2><p>원하는 방식으로 시작하세요.</p></div></div>
        <div className="quick-grid"><button className="quick-card" onClick={()=>setPage('cursors')}><div className="quick-icon blue"><MousePointer2/></div><b>커서 둘러보기</b><span>기본 제공 커서 8종</span><ChevronRight/></button><button className="quick-card" onClick={()=>setPage('customize')}><div className="quick-icon purple"><Palette/></div><b>모양 커스터마이징</b><span>색상, 크기, 잔상, 속도</span><ChevronRight/></button><button className="quick-card" onClick={()=>setPage('code')}><div className="quick-icon pink"><Code2/></div><b>React 커서 만들기</b><span>내 컴포넌트 직접 적용</span><ChevronRight/></button></div>
        <section className="selected-strip"><div className="selected-info"><div className="selected-icon" style={{color:selected.color}}>{selected.icon}</div><div><small>현재 선택된 커서</small><b>{selected.name}</b></div></div><div className="selected-preview"><CursorGraphic type={settings.cursor==='custom'?'glow':settings.cursor} color={settings.color} size={settings.size} preview/></div><button className="text-btn" onClick={()=>setPage('customize')}>설정 보기 <ChevronRight size={15}/></button></section><div className="note" style={{marginTop:14}}><Info size={16}/><span>중요: 현재 버전은 투명 오버레이를 표시하지만 Windows 기본 마우스 포인터를 시스템 전체에서 숨기지는 않습니다. 따라서 Roblox에서 기본 포인터와 커스텀 포인터가 함께 보일 수 있습니다. 안정적인 단독 교체에는 별도의 Windows 네이티브 커서 도우미가 필요합니다. Roblox는 창 모드 또는 테두리 없는 창 모드에서 먼저 테스트하세요.</span></div>
      </>}
      {page==='cursors' && <><div className="page-title"><div className="eyebrow"><MousePointer2 size={14}/> CURSOR LIBRARY</div><h1>커서 라이브러리</h1><p>8가지 React Bits 스타일을 기반으로 한 커서를 선택하고 바로 체험하세요.</p></div><div className="cursor-grid">{CURSORS.map(c=><button key={c.id} className={`cursor-card ${settings.cursor===c.id?'chosen':''}`} onClick={()=>update('cursor',c.id)}><div className="cursor-card-top"><span className="cursor-tag">{c.tag}</span>{settings.cursor===c.id&&<span className="chosen-check">✓</span>}</div><div className="cursor-preview-area"><CursorGraphic type={c.id} color={settings.color} size={settings.size} preview/></div><div className="cursor-card-bottom"><div><b>{c.name}</b><small>{c.desc}</small></div><span className="cursor-arrow"><ChevronRight size={16}/></span></div></button>)}</div><div className="bottom-action"><span>선택한 커서: <b>{settings.cursor==='custom'?'Custom React Cursor':selected.name}</b></span><button className="primary-btn" onClick={()=>setPage('customize')}>이 커서 설정하기 <ChevronRight size={16}/></button></div></>}
      {page==='customize' && <><div className="page-title"><div className="eyebrow"><Settings2 size={14}/> PERSONALIZE</div><h1>커서 커스터마이징</h1><p>설정을 변경하면 오른쪽 미리보기에 즉시 반영됩니다.</p></div><div className="custom-layout"><section className="settings-panel"><div className="panel-heading"><div><h3>모양 설정</h3><p>커서의 기본 스타일을 조정합니다.</p></div><button className="reset-btn" onClick={()=>setSettings({cursor:'glow',color:'#78a8ff',size:30,trail:65,speed:1,opacity:100})}><RotateCcw size={14}/> 초기화</button></div><label className="setting-row"><span><b>커서 색상</b><small>빛과 효과에 적용할 색상</small></span><div className="color-picker"><input type="color" value={settings.color} onChange={e=>update('color',e.target.value)}/><code>{settings.color.toUpperCase()}</code></div></label><label className="setting-row"><span><b>크기</b><small>커서 전체 크기</small></span><div className="range-wrap"><input type="range" min="12" max="80" value={settings.size} onChange={e=>update('size',+e.target.value)}/><b>{settings.size}px</b></div></label><label className="setting-row"><span><b>잔상 길이</b><small>마우스를 움직일 때 남는 흔적</small></span><div className="range-wrap"><input type="range" min="0" max="100" value={settings.trail} onChange={e=>update('trail',+e.target.value)}/><b>{settings.trail}%</b></div></label><label className="setting-row"><span><b>움직임 속도</b><small>효과 애니메이션 배율</small></span><div className="range-wrap"><input type="range" min="0.2" max="2.5" step="0.1" value={settings.speed} onChange={e=>update('speed',+e.target.value)}/><b>{settings.speed.toFixed(1)}x</b></div></label><label className="setting-row"><span><b>불투명도</b><small>커서 효과의 투명도</small></span><div className="range-wrap"><input type="range" min="20" max="100" value={settings.opacity} onChange={e=>update('opacity',+e.target.value)}/><b>{settings.opacity}%</b></div></label><div className="note"><Info size={16}/><span>오버레이의 <b>배경은 항상 100% 투명</b>하며, 커서 효과만 표시됩니다.</span></div></section><section className="live-panel"><div className="live-head"><span><span className="live-dot"/> LIVE PREVIEW</span><small>{selected.name}</small></div><div className="live-stage" onMouseMove={e=>{const r=e.currentTarget.getBoundingClientRect();setPreviewPos({x:e.clientX-r.left,y:e.clientY-r.top});}}><div className="stage-grid"/><div className="preview-cursor" style={{left:previewPos.x,top:previewPos.y}}><CursorGraphic type={settings.cursor==='custom'?'glow':settings.cursor} color={settings.color} size={settings.size} trail={settings.trail} preview/></div><span className="move-hint">이 영역에서 마우스를 움직여 보세요</span></div><button className="primary-btn full" onClick={start}><Play size={16} fill="currentColor"/> Roblox 오버레이 시작</button><p className="live-foot">실제 Roblox 적용은 Windows 오버레이 모드에서 확인하세요.</p></section></div></>}
      {page==='system' && <><div className="page-title"><div className="eyebrow"><Monitor size={14}/> WINDOWS NATIVE CURSOR</div><h1>Windows 기본 커서 교체</h1><p>선택한 스타일을 Windows의 일반 포인터에 실제로 적용합니다. 앱을 닫아도 Windows 설정에 유지됩니다.</p></div><section className="settings-panel" style={{maxWidth:760}}><div className="panel-heading"><div><h3>시스템 커서 스타일</h3><p>현재 선택된 스타일: <b>{selected.name}</b></p></div></div><div className="cursor-grid">{CURSORS.map(c=><button key={c.id} className={`cursor-card ${settings.cursor===c.id?'chosen':''}`} onClick={()=>{update('cursor',c.id);setSystemMessage('');}}><div className="cursor-card-top"><span className="cursor-tag">{c.tag}</span>{settings.cursor===c.id&&<span className="chosen-check">✓</span>}</div><div className="cursor-preview-area"><CursorGraphic type={c.id} color={settings.color} size={settings.size} preview/></div><div className="cursor-card-bottom"><div><b>{c.name}</b><small>{c.desc}</small></div></div></button>)}</div><div className="bottom-action" style={{marginTop:22}}><button className="primary-btn" disabled={systemBusy} onClick={async()=>{setSystemBusy(true);setSystemMessage('Windows 시스템 커서를 적용하는 중...');try{await window.mouseChanger.applySystemCursor(CURSORS.some(c=>c.id===settings.cursor)?settings.cursor:'glow');setSystemMessage('적용 완료! Windows 기본 포인터가 선택한 스타일로 변경되었습니다.');}catch(e){setSystemMessage('적용 실패: '+(e.message||'오류가 발생했습니다.'));}finally{setSystemBusy(false);}}}> <Check size={16}/> {systemBusy?'적용 중...':'Windows 시스템 커서 적용'}</button><button className="secondary-btn" disabled={systemBusy} onClick={async()=>{setSystemBusy(true);try{await window.mouseChanger.restoreSystemCursor();setSystemMessage('원래 Windows 커서 설정으로 복원했습니다.');}catch(e){setSystemMessage('복원 실패: '+(e.message||'오류가 발생했습니다.'));}finally{setSystemBusy(false);}}}><RotateCcw size={16}/> 원래 커서 복원</button></div>{systemMessage&&<div className="note" role="status" style={{marginTop:16}}><Info size={16}/><span>{systemMessage}</span></div>}<div className="warning" style={{marginTop:14}}><Info size={16}/><span>이 기능은 Windows 사용자 계정의 커서 설정(Arrow, Hand, Help, AppStarting)을 변경합니다. 관리자 권한은 필요하지 않습니다. 이 앱에서 만든 정적 .cur 파일을 적용하므로 잔상·입자 애니메이션은 시스템 포인터에 포함되지 않습니다. 애니메이션은 기존 오버레이에서 사용할 수 있습니다. 원래 커서 복원 버튼으로 되돌릴 수 있습니다.</span></div></section></>}
      {page==='code' && <><div className="page-title"><div className="eyebrow"><Code2 size={14}/> DEVELOPER MODE</div><h1>React 커서 코드</h1><p>직접 작성한 React 컴포넌트를 커스텀 커서로 적용할 수 있습니다.</p></div><div className="code-layout"><section className="code-panel"><div className="code-head"><span><span className="code-dot"/> CustomCursor.jsx</span><button className="reset-btn" onClick={()=>setCustomCode(DEFAULT_CODE)}>예제 복원</button></div><textarea spellCheck="false" value={customCode} onChange={e=>setCustomCode(e.target.value)}/><div className="code-foot"><span>React JSX · 컴포넌트 이름은 Cursor 또는 App</span><button className="primary-btn" onClick={applyCode}><Play size={15} fill="currentColor"/> 코드 적용</button></div>{customError&&<div className="error-msg">{customError}</div>}</section><aside className="code-help"><div className="help-icon"><Code2/></div><h3>사용 방법</h3><ol><li><b>컴포넌트 작성</b><span>Cursor라는 이름의 React 함수 컴포넌트를 만드세요.</span></li><li><b>속성 사용</b><span>x, y, color, size 속성을 사용할 수 있습니다.</span></li><li><b>코드 적용</b><span>적용한 뒤 커스터마이징 메뉴에서 확인하세요.</span></li></ol><div className="warning"><Info size={16}/><span>직접 입력한 코드는 앱 내부에서 실행됩니다. 신뢰할 수 있는 코드만 붙여 넣으세요. import/export 문은 지원하지 않습니다.</span></div></aside></div></>}
      </div>
    </main>
    <footer className="app-footer"><span>IRobloxMouseChanger <i>·</i> Made for Roblox</span><span>Github <b>xlg77 / IRobloxMouseChanger</b></span></footer>
  </div>;
}
