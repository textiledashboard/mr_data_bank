(() => {
  'use strict';
  const STORAGE_KEY = 'mrd-category-catalogue-v1';
  const MIGRATION_KEY = 'mrd-category-catalogue-step11-v1';
  const TAXONOMY_KEY = 'mrd-category-taxonomy-step13-v1';

  const seedCategories = [
    {id:1,code:'PROD',name:'Production',parentId:null,sector:'Production',description:'Production statistics, capacity, output and manufacturing trends.',icon:'bar-chart-line',status:'active',usageCount:246},
    {id:2,code:'COTTON',name:'Cotton',parentId:20,sector:'Fiber',description:'Cotton production, consumption, stocks and related research.',icon:'folder2',status:'active',usageCount:178},
    {id:3,code:'SILK',name:'Silk',parentId:20,sector:'Fiber',description:'Silk production, sericulture, processing and market information.',icon:'folder2',status:'active',usageCount:92},
    {id:4,code:'MMF',name:'Man-made Fibre (MMF)',parentId:20,sector:'Fiber',description:'MMF and filament yarn production, capacity and industry data.',icon:'folder2',status:'active',usageCount:81},
    {id:5,code:'TRADE',name:'International Trade',parentId:null,sector:'International Trade',description:'Export, import, trade policy and international market intelligence.',icon:'globe2',status:'active',usageCount:325},
    {id:6,code:'TRADE-EXP',name:'Exports',parentId:5,sector:'International Trade',description:'Textile and apparel export values, destinations and product segments.',icon:'globe2',status:'active',usageCount:211},
    {id:7,code:'TRADE-IMP',name:'Imports',parentId:5,sector:'International Trade',description:'Textile and apparel import values, origins and product segments.',icon:'globe2',status:'active',usageCount:114},
    {id:8,code:'HANDLOOM',name:'Handloom & Handicrafts',parentId:null,sector:'Handloom & Handicrafts',description:'Handloom clusters, artisans, products, schemes and market studies.',icon:'grid',status:'active',usageCount:198},
    {id:9,code:'BANDHA',name:'Sambalpuri Bandha',parentId:8,sector:'Handloom & Handicrafts',description:'Research and reference material concerning Sambalpuri Bandha textiles.',icon:'bookmark',status:'active',usageCount:42},
    {id:10,code:'QUALITY',name:'Quality & Certification',parentId:null,sector:'Quality & Certification',description:'Testing, standards, certification, marks and quality assurance.',icon:'shield-check',status:'active',usageCount:148},
    {id:11,code:'GI-MARKS',name:'GI / Textile Marks',parentId:10,sector:'Quality & Certification',description:'Geographical Indication and approved textile mark records.',icon:'shield-check',status:'active',usageCount:57},
    {id:12,code:'RESEARCH',name:'Research & Statistics',parentId:null,sector:'Research & Statistics',description:'Surveys, analytical reports, datasets, briefs and statistical publications.',icon:'file-earmark-text',status:'active',usageCount:302},
    {id:13,code:'MPR',name:'Monthly Purchase Returns',parentId:12,sector:'Research & Statistics',description:'MPR/DPR forms, consolidated returns and related analysis.',icon:'file-earmark-text',status:'active',usageCount:75},
    {id:14,code:'SCHEMES',name:'Schemes & Policy',parentId:null,sector:'Schemes & Policy',description:'Government schemes, policy notes, guidelines and implementation records.',icon:'bookmark',status:'active',usageCount:131},
    {id:15,code:'IHB',name:'India Handloom Brand',parentId:14,sector:'Schemes & Policy',description:'India Handloom Brand applications, evaluations and reference materials.',icon:'bookmark',status:'active',usageCount:64},
    {id:16,code:'LEGACY',name:'Legacy / To Review',parentId:null,sector:'Other',description:'Temporary classification for imported files awaiting review.',icon:'tags',status:'inactive',usageCount:0},
    {id:17,code:'WOOL',name:'Wool',parentId:20,sector:'Fiber',description:'Wool production, processing, fibre use and related market research.',icon:'folder2',status:'active',usageCount:0},
    {id:18,code:'APPAREL',name:'Apparel',parentId:null,sector:'Domestic Market',description:'Apparel industry, domestic market and value-chain research.',icon:'grid',status:'active',usageCount:0},
    {id:19,code:'RESEARCH-REPORTS',name:'Research & Reports',parentId:12,sector:'Research & Statistics',description:'Research reports, technical notes, sector briefs and analytical publications.',icon:'file-earmark-text',status:'active',usageCount:0},
    {id:20,code:'FIBER',name:'Fiber',parentId:null,sector:'Fiber',description:'Research files covering cotton, silk, man-made fibre and wool.',icon:'layers',status:'active',usageCount:0}
  ];

  function safeParse(value) {
    try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : null; }
    catch (_) { return null; }
  }
  function nextAvailableId(categories, preferredId) {
    const used = new Set(categories.map(item => Number(item.id)));
    return used.has(Number(preferredId)) ? Math.max(0,...categories.map(item=>Number(item.id)||0))+1 : Number(preferredId);
  }
  function findByCode(categories, code) {
    return categories.find(item => String(item.code||'').toUpperCase() === code);
  }
  function load() {
    let categories;
    try {
      categories = safeParse(localStorage.getItem(STORAGE_KEY));
      if (!categories) categories = seedCategories.map(item=>({...item}));

      if (localStorage.getItem(MIGRATION_KEY) !== 'done') {
        ['WOOL','APPAREL','RESEARCH-REPORTS'].forEach(code => {
          const seed = findByCode(seedCategories, code);
          if (seed && !findByCode(categories, code)) categories.push({...seed,id:nextAvailableId(categories,seed.id)});
        });
        localStorage.setItem(MIGRATION_KEY,'done');
      }

      if (localStorage.getItem(TAXONOMY_KEY) !== 'done') {
        let fiber = findByCode(categories,'FIBER') || categories.find(item=>String(item.name||'').trim().toLowerCase()==='fiber');
        if (!fiber) {
          const seed = findByCode(seedCategories,'FIBER');
          fiber = {...seed,id:nextAvailableId(categories,seed.id),parentId:null};
          categories.push(fiber);
        } else {
          fiber.parentId = null; fiber.code = 'FIBER'; fiber.name = 'Fiber'; fiber.sector = 'Fiber';
        }
        ['COTTON','SILK','MMF','WOOL'].forEach(code => {
          let item = findByCode(categories,code);
          if (!item) {
            const seed = findByCode(seedCategories,code);
            item = {...seed,id:nextAvailableId(categories,seed.id)};
            categories.push(item);
          }
          item.parentId = fiber.id;
          item.sector = 'Fiber';
        });
        localStorage.setItem(STORAGE_KEY,JSON.stringify(categories));
        localStorage.setItem(TAXONOMY_KEY,'done');
      } else {
        const fiber = findByCode(categories,'FIBER');
        if (fiber) ['COTTON','SILK','MMF','WOOL'].forEach(code => {
          const item = findByCode(categories,code);
          if (item) { item.parentId = fiber.id; item.sector = 'Fiber'; }
        });
      }
      localStorage.setItem(STORAGE_KEY,JSON.stringify(categories));
    } catch (error) {
      categories = seedCategories.map(item=>({...item}));
      console.warn('Category storage unavailable; using default catalogue in memory.',error);
    }
    return categories;
  }
  function save(categories) {
    if (!Array.isArray(categories)) return false;
    try { localStorage.setItem(STORAGE_KEY,JSON.stringify(categories)); refreshSelects(categories); return true; }
    catch (error) { console.warn('Unable to save category catalogue.',error); return false; }
  }
  function rootsOf(categories,activeOnly=true) {
    return categories.filter(item=>!item.parentId&&(!activeOnly||item.status==='active'))
      .sort((a,b)=>(a.code==='FIBER'?-1:b.code==='FIBER'?1:Number(a.id)-Number(b.id)));
  }
  function populateMainCategories(select,categories) {
    if (!select) return;
    const previous=select.value;
    const options=[new Option('Select main category','')];
    rootsOf(categories,true).forEach(item=>options.push(new Option(item.name,item.name)));
    select.replaceChildren(...options);
    if (rootsOf(categories,true).some(item=>item.name===previous)) select.value=previous;
  }
  function populateSubcategories(mainName,select,selectedValue='',categories=load()) {
    if (!select) return [];
    const root=categories.find(item=>!item.parentId&&item.name===mainName);
    const allChildren=root?categories.filter(item=>Number(item.parentId)===Number(root.id)):[];
    const activeChildren=allChildren.filter(item=>item.status==='active').sort((a,b)=>a.name.localeCompare(b.name));
    const selectedPending=allChildren.find(item=>item.status==='pending'&&item.name===selectedValue);
    const first=activeChildren.length?'Select sub-category':(mainName?'No active sub-categories yet':'Select main category first');
    const options=[new Option(first,'')];
    activeChildren.forEach(item=>options.push(new Option(item.name,item.name)));
    if(selectedPending) options.push(new Option(`${selectedPending.name} — Pending approval`,selectedPending.name));
    if(root) options.push(new Option('+ Request new sub-category…','__create_new__'));
    select.replaceChildren(...options);
    select.disabled=!mainName||!root;
    const selectableNames=[...activeChildren.map(item=>item.name),...(selectedPending?[selectedPending.name]:[])];
    if(selectableNames.includes(selectedValue)) select.value=selectedValue;
    return activeChildren;
  }
  function fillGenericSelect(select,categories,mode) {
    if (!select) return;
    const previous=select.value, isUpload=mode==='upload';
    const eligible=categories.filter(item=>isUpload?item.status==='active':true)
      .sort((a,b)=>(Number(a.parentId||a.id)-Number(b.parentId||b.id))||(Number(a.parentId||0)-Number(b.parentId||0))||String(a.name).localeCompare(String(b.name)));
    const options=[new Option(isUpload?'Select active category':'All categories','')];
    eligible.forEach(item=>{
      const parent=item.parentId?categories.find(row=>Number(row.id)===Number(item.parentId)):null;
      const statusSuffix = item.status === 'pending' ? ' (Pending approval)' : item.status === 'rejected' ? ' (Rejected)' : item.status === 'inactive' ? ' (Inactive)' : '';
      const option=new Option(`${parent?`${parent.name} / `:''}${item.name}${!isUpload?statusSuffix:''}`,item.name);
      option.dataset.categoryCode=item.code||''; option.dataset.categoryId=String(item.id); options.push(option);
    });
    select.replaceChildren(...options);
    if(eligible.some(item=>item.name===previous)) select.value=previous;
  }
  function refreshSelects(categories=load()) {
    populateMainCategories(document.getElementById('mainCategory'),categories);
    const mainSelect=document.getElementById('mainCategory'), subSelect=document.getElementById('subCategory');
    if(mainSelect&&subSelect) populateSubcategories(mainSelect.value,subSelect,subSelect.value,categories);
    fillGenericSelect(document.getElementById('category'),categories,'upload');
    fillGenericSelect(document.getElementById('categoryFilter'),categories,'filter');
  }
  window.MRCategoryCatalogue = {
    storageKey:STORAGE_KEY,
    getAll(){return load().map(item=>({...item}));},
    getActive(){return load().filter(item=>item.status==='active').map(item=>({...item}));},
    getRoots(activeOnly=true){return rootsOf(load(),activeOnly).map(item=>({...item}));},
    getChildren(parentId,activeOnly=true){return load().filter(item=>Number(item.parentId)===Number(parentId)&&(!activeOnly||item.status==='active')).map(item=>({...item}));},
    populateSubcategories(mainName,select,selectedValue=''){return populateSubcategories(mainName,select,selectedValue,load());},
    save,refreshSelects
  };
  refreshSelects();
})();
