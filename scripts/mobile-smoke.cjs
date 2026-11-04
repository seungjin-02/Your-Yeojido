const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const path=require('node:path').resolve(process.env.MOBILE_TEST_OUTPUT||'work/mobile-validation')+'/';
require('node:fs').mkdirSync(path,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 const results=[];
 for(const [width,height] of [[320,568],[390,844],[430,932],[667,375],[844,390],[1440,900]].filter(([w])=>!process.env.TEST_WIDTHS||process.env.TEST_WIDTHS.split(',').includes(String(w)))){
  const mobile=width<1024;
  const page=await browser.newPage({viewport:{width,height},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.BASE_URL||'http://127.0.0.1:5173/');await page.locator('.map-canvas[data-rendered=true]').waitFor();await page.waitForTimeout(900);
  assert.equal(await page.locator('.map-error').count(),0,'map initialization');
  async function layout(label){
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false,`${width} ${label}: horizontal overflow`);
   if(mobile){const current=page.viewportSize();const nav=await page.getByRole('navigation',{name:'주 메뉴'}).boundingBox();assert(nav.y+nav.height<=current.height+1);const header=await page.locator('.topbar').boundingBox();assert(header.width<=current.width+1)}
  }
  await layout('home');await page.screenshot({path:`${path}${width}-home.png`});
  if(mobile){
   await page.getByRole('button',{name:'지도 설정',exact:true}).click();
   await page.locator('.travel-group-picker summary').click();
   await page.locator('.travel-group-grid button').filter({hasText:'태즈메이니아'}).click();
   await page.getByRole('button',{name:'명소·활동 자세히 보기'}).click();
   await page.getByRole('dialog').waitFor();await layout('guide');await page.getByRole('button',{name:'대화상자 닫기'}).click();
   await page.getByRole('button',{name:'여행권 닫기'}).click();
  }
  await page.getByRole('combobox',{name:'지역 검색',exact:true}).fill('NSW');await page.getByRole('listbox').getByRole('option').click();await page.waitForTimeout(800);
  if(mobile){assert.equal(await page.evaluate(()=>document.activeElement?.tagName==='INPUT'),false,'keyboard dismissed');await page.getByRole('button',{name:'자세히 보기',exact:true}).click()}
  await layout('selected');await page.screenshot({path:`${path}${width}-selected.png`});
  await page.getByRole('button',{name:'시드니 오페라 하우스 북마크'}).click();
  assert.equal(await page.getByRole('button',{name:'시드니 오페라 하우스 북마크'}).getAttribute('aria-pressed'),'true');
  await page.locator('.panel-action button').click();
  const dialog=page.getByRole('dialog');await dialog.waitFor();
  await page.getByLabel('기억하고 싶은 순간').fill(`모바일 ${width}px 여행 기록`);
  await page.waitForTimeout(150);
  if(mobile){
   const visibleField=await page.getByLabel('기억하고 싶은 순간').evaluate(el=>{const box=el.getBoundingClientRect();const footer=document.querySelector('dialog[open] .modal-actions').getBoundingClientRect();return box.top<footer.top&&box.bottom<=footer.top+1});
   assert(visibleField,`${width}: focused textarea hidden behind save bar`);
  }
  if(width===390){
   // Simulate Safari's smaller visual viewport; Chromium does not open an OS keyboard.
   await page.evaluate(()=>{Object.defineProperty(visualViewport,'height',{configurable:true,value:480});visualViewport.dispatchEvent(new Event('resize'))});
   await page.waitForTimeout(200);
   const bounds=await dialog.boundingBox();assert(bounds.y+bounds.height<=481,'dialog avoids simulated keyboard');
   await page.screenshot({path:`${path}keyboard-simulation.png`});
   await page.evaluate(()=>{delete visualViewport.height;visualViewport.dispatchEvent(new Event('resize'))});await page.waitForTimeout(150);
  }
  await page.screenshot({path:`${path}${width}-form.png`});await layout('form');
  const inputSize=await page.getByLabel('기억하고 싶은 순간').evaluate(el=>getComputedStyle(el).fontSize);if(mobile)assert.equal(inputSize,'16px');
  await page.getByRole('button',{name:'발자국 남기기',exact:true}).click();await dialog.waitFor({state:'detached'});
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('footprint.australia.user.v1')));assert.equal(saved.records.length,1);assert.equal(saved.records[0].note,`모바일 ${width}px 여행 기록`);
  await page.getByRole('button',{name:'여행 통계',exact:true}).click();await page.getByRole('heading',{name:'나의 여행을 한눈에'}).waitFor();await layout('stats');await page.screenshot({path:`${path}${width}-stats.png`});
  await page.getByRole('button',{name:'방문 기록 관리',exact:true}).click();await page.getByRole('heading',{name:/방문 기록 관리/}).waitFor();await layout('records');
  await page.getByRole('button',{name:'뉴사우스웨일스 기록 수정'}).click();await page.getByLabel('기억하고 싶은 순간').fill('수정한 기록');await page.getByRole('button',{name:'발자국 남기기',exact:true}).click();
  await page.getByRole('button',{name:'뉴사우스웨일스 기록 삭제'}).click();await page.getByRole('button',{name:'취소',exact:true}).click();
  await page.getByRole('button',{name:'내 여행지',exact:true}).click();await layout('collections');await page.screenshot({path:`${path}${width}-collections.png`});
  await page.getByRole('button',{name:/^업적/}).click();await layout('achievements');await page.screenshot({path:`${path}${width}-achievements.png`});
  await page.reload();await page.getByRole('button',{name:'여행 통계',exact:true}).click();await page.getByRole('heading',{name:'나의 여행을 한눈에'}).waitFor();
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('footprint.australia.user.v1')).records[0].note),'수정한 기록');
  if(width===390){
   await page.getByRole('button',{name:'나의 지도',exact:true}).click();
   await page.getByRole('combobox',{name:'지역 검색',exact:true}).fill('NSW');await page.getByRole('listbox').getByRole('option').click();
   await page.setViewportSize({width:844,height:390});await page.waitForTimeout(1000);await layout('rotation');assert.equal(await page.locator('.map-error').count(),0);await page.screenshot({path:`${path}rotation.png`});
  }
  assert.deepEqual(errors,[]);results.push({width,height,passed:true});console.log('PASS',width,height);await page.close();
 }
 await browser.close();require('fs').writeFileSync(path+'results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
})().catch(e=>{console.error(e);process.exit(1)});
