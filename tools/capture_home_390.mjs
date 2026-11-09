import { chromium } from 'playwright';
const browser = await chromium.launch({headless:true});
const context = await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
for (const [url,path] of [['http://127.0.0.1:8000/','homepage-before-390.png'],['http://127.0.0.1:8001/','homepage-after-390.png']]) {
  const page=await context.newPage();
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForTimeout(7000);
  await page.screenshot({path,fullPage:true,animations:'disabled'});
  console.log(path+' '+JSON.stringify(await page.evaluate(()=>({title:document.title,width:innerWidth,categories:document.querySelectorAll('.journey-card').length,offerCards:document.querySelectorAll('.home-offer-card').length,hero:document.querySelector('header.hero')?.getBoundingClientRect().height}))));
  await page.close();
}
await browser.close();
