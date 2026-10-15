(() => {
'use strict';
const body=document.body, offcanvasEl=document.getElementById('mobileSidebar');
const toggle=document.getElementById('sidebarToggle');
if(sessionStorage.getItem('mrd-sidebar-collapsed')==='true'&&window.innerWidth>=992)body.classList.add('sidebar-collapsed');
toggle?.addEventListener('click',()=>{body.classList.toggle('sidebar-collapsed');sessionStorage.setItem('mrd-sidebar-collapsed',body.classList.contains('sidebar-collapsed')?'true':'false')});
const desktopNav=document.getElementById('desktopSidebarContent'),mobileNav=document.getElementById('mobileSidebarContent');
if(desktopNav&&mobileNav){mobileNav.innerHTML=desktopNav.innerHTML;mobileNav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>bootstrap.Offcanvas.getInstance(offcanvasEl)?.hide()))}
const currentPage=body.dataset.page||'dashboard';
document.querySelectorAll('.sidebar-link[data-page]').forEach(a=>{a.classList.toggle('active',a.dataset.page===currentPage);if(a.dataset.page===currentPage)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
const search=document.getElementById('globalSearch'),empty=document.getElementById('emptySearch');
search?.addEventListener('input',()=>{const q=search.value.trim().toLowerCase(),items=[...document.querySelectorAll('[data-searchable]')];let visible=0;items.forEach(item=>{const match=!q||(item.dataset.searchable+' '+item.textContent).toLowerCase().includes(q);item.classList.toggle('d-none',!match);if(match)visible++});if(empty)empty.style.display=q&&items.length&&visible===0?'block':'none'});
document.querySelectorAll('[data-demo-action]').forEach(button=>button.addEventListener('click',event=>{if(button.tagName==='A')event.preventDefault();const msg=button.dataset.demoAction||'This action is a frontend demonstration.';const text=document.getElementById('demoToastBody'),toast=document.getElementById('demoToast');if(text)text.textContent=msg;if(toast&&window.bootstrap?.Toast)bootstrap.Toast.getOrCreateInstance(toast,{delay:2800}).show()}));
const year=document.getElementById('currentYear');if(year)year.textContent=new Date().getFullYear();
})();
