// Small progressive enhancement: highlight the current section in the sticky paper navigation.
const links=[...document.querySelectorAll('.toc a')];
const sections=links.map(a=>document.querySelector(a.getAttribute('href'))).filter(Boolean);
const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){links.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+entry.target.id));}})},{rootMargin:'-25% 0px -65% 0px'});
sections.forEach(s=>observer.observe(s));
