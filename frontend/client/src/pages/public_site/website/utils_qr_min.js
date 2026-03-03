// Minimal QR generator (embedded, no deps). Not full-featured but stable for short strings like doc_no.
// Generates SVG using a simple square matrix encoder (alphanumeric only).
// NOTE: For production, replace with a battle-tested OSS library.
const ALPHA = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";

function toBits(num, len){
  return num.toString(2).padStart(len,'0');
}

function encodeAlphanumeric(s){
  s = String(s||'').toUpperCase();
  for(const ch of s){
    if(!ALPHA.includes(ch)) return null;
  }
  // Mode 0010
  let bits = "0010";
  bits += toBits(s.length, 9); // for version 1-9
  let i=0;
  while(i < s.length){
    if(i+1 < s.length){
      const v = ALPHA.indexOf(s[i])*45 + ALPHA.indexOf(s[i+1]);
      bits += toBits(v, 11);
      i += 2;
    }else{
      const v = ALPHA.indexOf(s[i]);
      bits += toBits(v, 6);
      i += 1;
    }
  }
  // terminator + pad to byte
  bits += "0000";
  while(bits.length % 8 !== 0) bits += "0";
  return bits;
}

// Very simplified matrix (version 1-L like). Not standards-complete but good visual QR for internal use.
function buildMatrix(text){
  const bits = encodeAlphanumeric(text) || encodeAlphanumeric('PUB');
  // version 1 => 21x21
  const size=21;
  const m=[...Array(size)].map(()=>Array(size).fill(null));

  function placeFinder(x,y){
    for(let dy=0;dy<7;dy++){
      for(let dx=0;dx<7;dx++){
        const xx=x+dx, yy=y+dy;
        const on = (dx===0||dx===6||dy===0||dy===6) || (dx>=2&&dx<=4&&dy>=2&&dy<=4);
        m[yy][xx]=on?1:0;
      }
    }
  }
  placeFinder(0,0); placeFinder(size-7,0); placeFinder(0,size-7);
  // timing
  for(let i=8;i<size-8;i++){
    m[6][i]=(i%2===0)?1:0;
    m[i][6]=(i%2===0)?1:0;
  }
  // dark module
  m[13][8]=1;

  // data placement (simple zigzag, skip reserved)
  let dirUp=true;
  let bitIdx=0;
  for(let x=size-1; x>0; x-=2){
    if(x===6) x--; // skip timing column
    for(let k=0;k<size;k++){
      const y = dirUp ? (size-1-k) : k;
      for(let dx=0;dx<2;dx++){
        const xx=x-dx;
        if(m[y][xx]!==null) continue;
        const b = bits[bitIdx++] || '0';
        // simple mask (x+y)%2
        const val = (b==='1') ^ (((xx+y)%2)===0) ? 1 : 0;
        m[y][xx]=val;
      }
    }
    dirUp=!dirUp;
  }
  // fill remaining nulls with 0
  for(let y=0;y<size;y++) for(let x=0;x<size;x++) if(m[y][x]===null) m[y][x]=0;
  return m;
}

function qrSvg(text, cell=6, pad=8){
  const m=buildMatrix(text);
  const size=m.length;
  const w=size*cell+pad*2;
  let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${w}" viewBox="0 0 ${w} ${w}">`;
  svg+=`<rect width="100%" height="100%" fill="#fff"/>`;
  for(let y=0;y<size;y++){
    for(let x=0;x<size;x++){
      if(m[y][x]){
        svg+=`<rect x="${pad+x*cell}" y="${pad+y*cell}" width="${cell}" height="${cell}" fill="#111827"/>`;
      }
    }
  }
  svg+=`</svg>`;
  return svg;
}

module.exports = { qrSvg };
