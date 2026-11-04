const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const pages=['index.html','en/index.html','partner/index.html','ueber-uns/index.html','en/about/index.html','oeffentlicher-bereich/index.html','gemeinden/index.html','leistungen/webentwicklung/index.html','leistungen/webapps/index.html','leistungen/tracking/index.html','projekte/fontwise/index.html','projekte/kebappreis/index.html','404.html'];
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
test('every HTML image has a source',()=>{
  for(const page of pages){
    const source=fs.readFileSync(path.join(root,page),'utf8');
    for(const [tag] of source.matchAll(/<img\b[^>]*>/g)){
      assert.match(tag,/\ssrc="[^"]+"/,page+' malformed image: '+tag);
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

test('indexable pages have one canonical, complete social metadata and valid JSON-LD',()=>{
  const sitemap=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
  const urls=[...sitemap.matchAll(/<loc>(https:\/\/marlongreta\.at\/[^<]*)<\/loc>/g)].map(match=>match[1]);
  assert.equal(new Set(urls).size,urls.length,'duplicate sitemap URLs');
  for(const url of urls){
    const route=new URL(url).pathname;
    const file=route==='/'?'index.html':path.join(route.slice(1),'index.html');
    const source=fs.readFileSync(path.join(root,file),'utf8');
    assert.ok(!/<meta[^>]+name="robots"[^>]+content="[^"]*noindex/i.test(source),file+' must be indexable');
    assert.equal((source.match(/rel="canonical"/g)||[]).length,1,file+' canonical count');
    assert.ok(source.includes(`rel="canonical" href="${url}"`),file+' self canonical');
    assert.ok(/^https:\/\/marlongreta\.at\/.+|^https:\/\/marlongreta\.at\/$/.test(url),file+' canonical origin');
    assert.ok(!/[?#]/.test(url),file+' canonical must not contain query or fragment');
    assert.equal((source.match(/<h1(?:\s|>)/g)||[]).length,1,file+' H1 count');
    for(const key of ['og:type','og:site_name','og:locale','og:title','og:description','og:url','og:image','og:image:alt']){
      assert.ok(source.includes(`property="${key}"`),file+' '+key);
    }
    for(const key of ['twitter:card','twitter:title','twitter:description','twitter:image']){
      assert.ok(source.includes(`name="${key}"`),file+' '+key);
    }
    const blocks=[...source.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    assert.ok(blocks.length>0,file+' JSON-LD');
    for(const block of blocks)JSON.parse(block[1]);
  }
});

test('sitemap contains every indexable HTML route and no excluded page',()=>{
  const sitemap=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
  const sitemapPaths=new Set([...sitemap.matchAll(/<loc>https:\/\/marlongreta\.at(\/[^<]*)<\/loc>/g)].map(match=>match[1]));
  const excluded=new Set(['404.html','gemeinden/index.html','docs/text-size-check.html','docs/typography.html']);
  const htmlFiles=[];
  const visit=(directory)=>{
    for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
      if(entry.name==='.git'||entry.name==='node_modules')continue;
      const absolute=path.join(directory,entry.name);
      if(entry.isDirectory())visit(absolute);
      else if(entry.name==='index.html')htmlFiles.push(path.relative(root,absolute));
    }
  };
  visit(root);
  const expected=new Set(htmlFiles.filter(file=>!excluded.has(file)&&!file.startsWith('docs/')).map(file=>file==='index.html'?'/':'/'+file.replace(/index\.html$/,'')));
  assert.deepEqual([...sitemapPaths].sort(),[...expected].sort());
});

test('language alternates are reciprocal and match the sitemap',()=>{
  const pairs=[
    ['index.html','en/index.html','https://marlongreta.at/','https://marlongreta.at/en/'],
    ['ueber-uns/index.html','en/about/index.html','https://marlongreta.at/ueber-uns/','https://marlongreta.at/en/about/']
  ];
  const sitemap=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
  for(const [deFile,enFile,deUrl,enUrl] of pairs){
    for(const file of [deFile,enFile]){
      const source=fs.readFileSync(path.join(root,file),'utf8');
      assert.ok(source.includes(`hreflang="de-AT" href="${deUrl}"`),file+' de alternate');
      assert.ok(source.includes(`hreflang="en" href="${enUrl}"`),file+' en alternate');
      assert.ok(source.includes('hreflang="x-default"'),file+' x-default alternate');
    }
    assert.ok(sitemap.includes(`hreflang="de-AT" href="${deUrl}"`));
    assert.ok(sitemap.includes(`hreflang="en" href="${enUrl}"`));
  }
});

test('legacy and error pages cannot be indexed',()=>{
  assert.ok(fs.readFileSync(path.join(root,'gemeinden/index.html'),'utf8').includes('noindex,follow'));
  assert.ok(fs.readFileSync(path.join(root,'404.html'),'utf8').includes('noindex,follow'));
  const robots=fs.readFileSync(path.join(root,'robots.txt'),'utf8');
  for(const route of ['/docs/','/tests/','/cloudflare/'])assert.ok(robots.includes(`Disallow: ${route}`));
  assert.ok(!robots.includes('Disallow: /gemeinden/'),'legacy page must remain crawlable so noindex and canonical can be read');
});

test('all 25 WebP assets are validly referenced and none is orphaned',()=>{
  const webpFiles=fs.readdirSync(path.join(root,'images')).filter(file=>file.endsWith('.webp')).sort();
  assert.equal(webpFiles.length,25);
  const html=pages.map(page=>fs.readFileSync(path.join(root,page),'utf8')).join('\n');
  const references=new Set([...html.matchAll(/images\/([^'" ,]+\.webp)/g)].map(match=>match[1]));
  for(const file of webpFiles)assert.ok(references.has(file),'orphaned WebP: '+file);
  for(const file of references)assert.ok(webpFiles.includes(file),'missing WebP: '+file);
});
