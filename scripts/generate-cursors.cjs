const fs=require('fs');const path=require('path');const zlib=require('zlib');
const out=path.join(__dirname,'..','resources','cursors');fs.mkdirSync(out,{recursive:true});
const colors={glow:[120,168,255],swarm:[156,140,255],ghost:[114,230,208],target:[255,179,107],fluid:[164,200,255],text:[255,142,181],splash:[255,163,224],blob:[142,215,255]};
function crc32(buf){let c=~0;for(const b of buf){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (~c)>>>0;}
function chunk(type,data){const t=Buffer.from(type),len=Buffer.alloc(4);len.writeUInt32BE(data.length);const crc=Buffer.alloc(4);crc.writeUInt32BE(crc32(Buffer.concat([t,data])));return Buffer.concat([len,t,data,crc]);}
function png(pixels){const w=32,h=32,rows=[];for(let y=0;y<h;y++){const row=Buffer.alloc(1+w*4);for(let x=0;x<w;x++)pixels[y][x].forEach((v,i)=>row[1+x*4+i]=v);rows.push(row);}const ih=Buffer.alloc(13);ih.writeUInt32BE(w,0);ih.writeUInt32BE(h,4);ih[8]=8;ih[9]=6;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ih),chunk('IDAT',zlib.deflateSync(Buffer.concat(rows))),chunk('IEND',Buffer.alloc(0))]);}
function make(id,rgb){const p=Array.from({length:32},()=>Array.from({length:32},()=>[0,0,0,0]));const set=(x,y,c)=>{if(x>=0&&x<32&&y>=0&&y<32)p[y][x]=[...c,255];};const line=(x0,y0,x1,y1,c,t=1)=>{const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0),1);for(let i=0;i<=n;i++)for(let a=-t;a<=t;a++)for(let b=-t;b<=t;b++)if(a*a+b*b<=t*t+.5)set(Math.round(x0+(x1-x0)*i/n)+a,Math.round(y0+(y1-y0)*i/n)+b,c);};const circle=(cx,cy,r,c,fill=false)=>{for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++){const d=x*x+y*y;if(fill?d<=r*r:d<=r*r&&d>=(r-1.5)*(r-1.5))set(cx+x,cy+y,c);}};const poly=(pts,c)=>{for(let y=0;y<32;y++)for(let x=0;x<32;x++){let inside=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const a=pts[i],b=pts[j];if(((a[1]>y)!==(b[1]>y))&&(x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]))inside=!inside;}if(inside)set(x,y,c);}};
const dark=[20,24,40];const arrow=[[3,2],[3,26],[9,20],[14,29],[19,26],[14,17],[23,17]];poly(arrow,dark);poly([[5,5],[5,22],[9,17],[14,26],[16,25],[11,15],[19,15]],rgb);
if(id==='glow'){circle(23,8,5,rgb);circle(23,8,2,[255,255,255],true);}
if(id==='swarm'){for(let a=0;a<8;a++){const x=22+Math.round(Math.cos(a*Math.PI/4)*7),y=10+Math.round(Math.sin(a*Math.PI/4)*7);circle(x,y,1,rgb,true);}}
if(id==='ghost'){circle(23,9,5,rgb);circle(23,9,3,[20,24,40],true);}
if(id==='target'){line(21,4,28,4,rgb);line(21,4,21,11,rgb);line(28,4,28,11,rgb);line(21,11,28,11,rgb);}
if(id==='fluid'){circle(23,9,5,[255,255,255]);circle(23,9,3,rgb,true);}
if(id==='text'){line(22,4,22,14,rgb,1);line(27,4,27,14,rgb,1);line(22,9,27,9,rgb,1);}
if(id==='splash'){for(let a=0;a<8;a++){const x=23+Math.round(Math.cos(a*Math.PI/4)*6),y=9+Math.round(Math.sin(a*Math.PI/4)*6);circle(x,y,1,rgb,true);}}
if(id==='blob'){circle(23,9,5,rgb,true);circle(21,7,1,[255,255,255],true);}
const image=png(p);const header=Buffer.alloc(22);header.writeUInt16LE(0,0);header.writeUInt16LE(2,2);header.writeUInt16LE(1,4);header[6]=32;header[7]=32;header[8]=0;header[9]=0;header.writeUInt16LE(3,10);header.writeUInt16LE(3,12);header.writeUInt32LE(image.length,14);header.writeUInt32LE(22,18);fs.writeFileSync(path.join(out,id+'.cur'),Buffer.concat([header,image]));}
for(const [id,color] of Object.entries(colors))make(id,color);
console.log('Generated 8 Windows cursor files.');
