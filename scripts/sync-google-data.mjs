import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function parseCsv(text) {
  const rows=[];let row=[],cell='',quoted=false;
  for(let i=0;i<text.length;i++){
    const char=text[i],next=text[i+1];
    if(char==='"'&&quoted&&next==='"'){cell+='"';i++;continue}
    if(char==='"'){quoted=!quoted;continue}
    if(char===','&&!quoted){row.push(cell);cell='';continue}
    if((char==='\n'||char==='\r')&&!quoted){if(char==='\r'&&next==='\n')i++;row.push(cell);if(row.some(v=>v!==''))rows.push(row);row=[];cell='';continue}
    cell+=char;
  }
  row.push(cell);if(row.some(v=>v!==''))rows.push(row);
  if(rows.length<1)return[];
  const headers=rows.shift().map(h=>h.trim());
  return rows.map(values=>Object.fromEntries(headers.map((h,i)=>[h,(values[i]??'').trim()])));
}

const published=row=>String(row.published).toUpperCase()==='TRUE';
const numberValue=value=>Number.isFinite(Number(value))?Number(value):9999;

export async function loadSource(source,baseDir){
  if(!source)return[];
  const text=/^https?:\/\//i.test(source)
    ? await fetch(source).then(response=>{if(!response.ok)throw new Error(`HTTP ${response.status}: ${source}`);return response.text()})
    : await fs.readFile(path.resolve(baseDir,source),'utf8');
  return parseCsv(text.replace(/^\uFEFF/,''));
}

export async function buildData(configPath,outputPath){
  const config=JSON.parse(await fs.readFile(configPath,'utf8'));
  const baseDir=path.dirname(configPath);
  const entries=await Promise.all(Object.entries(config).map(async([key,source])=>[key,await loadSource(source,baseDir)]));
  const sheets=Object.fromEntries(entries);
  const settings=Object.fromEntries((sheets.settings||[]).map(row=>[row.key,row.value]));
  const officers=(sheets.officers||[]).filter(published).sort((a,b)=>numberValue(a.sort_order)-numberValue(b.sort_order));
  const terms=(sheets.terms||[]).filter(published).map(term=>({term:term.term,year:term.year,status:term.status,summary:term.summary,officers:officers.filter(person=>person.term===term.term).map(person=>({department:person.department,role:person.role,name:person.name,duties:person.duties}))}));
  const clean=(rows,fields)=>rows.filter(published).map(row=>Object.fromEntries(fields.map(field=>[field,row[field]||''])));
  const result={
    meta:{siteName:settings.siteName||'彰化縣立和美高中學生會',currentTerm:settings.currentTerm||'',lastUpdated:new Date().toISOString().slice(0,10),schoolUrl:settings.schoolUrl||'',feedbackFormUrl:settings.feedbackFormUrl||''},
    announcements:clean(sheets.announcements||[],['id','date','category','title','summary','url','image_url','attachment_url','attachment_label']).sort((a,b)=>b.date.localeCompare(a.date)),
    activities:clean(sheets.activities||[],['id','date','end_date','title','location','summary','registration_url','result_url','image_url','attachment_url','attachment_label']).sort((a,b)=>b.date.localeCompare(a.date)),
    rights:[
      {title:'會員身分',items:['本校高中部全體學生均為學生會當然會員','繳交會費者為完全會員','完全會員除享有會員權利外，並依規定享有學生會提供之優惠']},
      {title:'會員權利',items:['享有選舉、被選舉及罷免之權利','得擔任學生會相關職務並參與學生會活動','非行政、立法部門成員得依章程申請列席班代大會']},
      {title:'會員義務',items:['遵守學生會組織章程及各項決議','協助學生會所分配之任務','共同維護學生自治組織的正常運作']},
      {title:'班級代表與監督',items:['每班選出兩位班級代表組成班代大會','班代得行使提案、監督及人事同意權','班代應反映班級意見，並傳達、監督學生會政策']}
    ],
    terms,
    documents:clean(sheets.documents||[],['id','category','title','term','date','url','file_type']).sort((a,b)=>b.date.localeCompare(a.date))
  };
  if(!result.terms.length)throw new Error('沒有任何 published=TRUE 的屆次資料，已停止更新以保護現有網站。');
  await fs.writeFile(outputPath,JSON.stringify(result,null,2)+'\n','utf8');
  return result;
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
  const configPath=path.resolve(process.argv[2]||'config/google-sheets.json');
  const outputPath=path.resolve(process.argv[3]||'data/site.json');
  buildData(configPath,outputPath).then(result=>console.log(`同步完成：${result.announcements.length} 則公告、${result.activities.length} 個活動、${result.terms.length} 屆資料。`)).catch(error=>{console.error(error.message);process.exitCode=1});
}
