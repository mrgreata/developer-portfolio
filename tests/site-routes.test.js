const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const pages=['index.html','en/index.html','partner/index.html','ueber-uns/index.html','en/about/index.html','oeffentlicher-bereich/index.html','gemeinden/index.html'];
test('public pages have existing local assets, routes and fragment targets',()=>{
  for(const page of pages){
    const source=fs.readFileSync(path.join(root,page),'utf8');
    for(const [,url] of source.matchAll(/(?:href|src)="([^"]+)"/g)){
      if(/^(?:[a-z]+:|\/\/)/i.test(url))continue;
      const parsed=new URL(url,'http://local/'+page);
      let target=path.join(root,decodeURIComponent(parsed.pathname));
      assert.ok(fs.existsSync(target),page+' -> '+url);
      if(fs.statSync(target).isDirectory())target=path.join(target,'index.html');
      if(parsed.hash)assert.ok(fs.readFileSync(target,'utf8').includes('id="'+parsed.hash.slice(1)+'"'),page+' -> '+url);
    }
  }
});
test('partner page includes four collaboration models and an actionable contact path',()=>{
  const page=fs.readFileSync(path.join(root,'partner/index.html'),'utf8');
  assert.ok(page.includes('Gemeinsam Projekte umsetzen'));
  assert.ok(page.includes('partner-process'));
  assert.ok(page.includes('?anfrage=partner#kontakt'));
  assert.ok(page.includes('mailto:marlongreta1@gmail.com'));
});

test('SEO landing pages are discoverable and have valid metadata and local links',()=>{
  const routes=['leistungen/webentwicklung','leistungen/webapps','leistungen/tracking','projekte/fontwise','projekte/kebappreis'];
  const sitemap=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
  const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
  for(const route of routes){
    const source=fs.readFileSync(path.join(root,route,'index.html'),'utf8');
    assert.equal((source.match(/<h1>/g)||[]).length,1);
    assert.ok(source.includes('rel="canonical" href="https://marlongreta.at/'+route+'/"'));
    assert.ok(sitemap.includes('https://marlongreta.at/'+route+'/'));
    assert.ok(home.includes('href="'+route+'/"'));
    JSON.parse(source.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
    for(const [,url] of source.matchAll(/(?:href|src)="([^"]+)"/g)){
      if(/^(?:[a-z]+:|\/\/)/i.test(url))continue;
      const parsed=new URL(url,'http://local/'+route+'/');
      let target=path.join(root,decodeURIComponent(parsed.pathname));
      assert.ok(fs.existsSync(target),route+' -> '+url);
      if(fs.statSync(target).isDirectory())target=path.join(target,'index.html');
      if(parsed.hash)assert.ok(fs.readFileSync(target,'utf8').includes('id="'+parsed.hash.slice(1)+'"'),route+' -> '+url);
    }
  }
  assert.ok(fs.readFileSync(path.join(root,'robots.txt'),'utf8').includes('Sitemap: https://marlongreta.at/sitemap.xml'));
});
