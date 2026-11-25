const pets=[
 {id:'AN-088',name:'Mugi',breed:'Shiba',species:'dog',age:'14 weeks',sex:'Female',price:'¥480,000',status:'Available',litter:'Spring litter · SH-24',health:'Vaccinated · Vet checked',image:'/pets/mugi-shiba.jpg'},
 {id:'AN-091',name:'Sora',breed:'Toy poodle',species:'dog',age:'12 weeks',sex:'Male',price:'¥420,000',status:'Available',litter:'Maple litter · TP-18',health:'Vaccinated · Low shed',image:'/pets/sora-toy-poodle.jpg'},
 {id:'AN-076',name:'Hana',breed:'British shorthair',species:'cat',age:'16 weeks',sex:'Female',price:'¥380,000',status:'Available',litter:'Silver litter · BS-09',health:'Vaccinated · Indoor only',image:'/pets/hana-british-shorthair.jpg'},
 {id:'AN-094',name:'Kai',breed:'Beagle',species:'dog',age:'13 weeks',sex:'Male',price:'¥340,000',status:'Available',litter:'River litter · BG-11',health:'Vaccinated · Vet checked',image:'/pets/kai-beagle.jpg'},
 {id:'AN-063',name:'Yuki',breed:'Maltese',species:'dog',age:'11 weeks',sex:'Female',price:'¥460,000',status:'Health hold',litter:'Snow litter · MT-07',health:'Final vet check pending',image:'/pets/yuki-maltese.jpg'},
 {id:'AN-082',name:'Leo',breed:'Ragdoll',species:'cat',age:'15 weeks',sex:'Male',price:'¥410,000',status:'Available',litter:'Cloud litter · RG-05',health:'Vaccinated · Vet checked',image:'/pets/leo-ragdoll.jpg'},
 {id:'AN-097',name:'Rin',breed:'Mini dachshund',species:'dog',age:'12 weeks',sex:'Female',price:'¥450,000',status:'Deposit paid',litter:'Autumn litter · MD-21',health:'Vaccinated · Vet checked',image:'/pets/rin-mini-dachshund.jpg'},
 {id:'AN-073',name:'Maru',breed:'Shiba',species:'dog',age:'17 weeks',sex:'Male',price:'¥440,000',status:'Available',litter:'Spring litter · SH-24',health:'Vaccinated · Vet checked',image:'/pets/maru-shiba.jpg'}
];
const requests=[
 {type:'Purchase interest',pet:'Sora',detail:'Visit requested · LINE preferred',status:'Staff reviewing',updated:'Today · 09:42'},
 {type:'Insurance review',pet:'Mochi',detail:'Renewal options and cover comparison',status:'Appointment offered',updated:'Yesterday · 16:10'}
];
const $=(selector,context=document)=>context.querySelector(selector),$$=(selector,context=document)=>[...context.querySelectorAll(selector)];
let selectedPet=null,toastTimer;
function showToast(message){const toast=$('#owner-toast');toast.textContent=message;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),2800)}
function setOwnerView(name){$$('.owner-view').forEach(view=>view.classList.toggle('active',view.id===`owner-${name}`));$$('[data-owner-view]').forEach(button=>button.classList.toggle('active',button.dataset.ownerView===name));window.scrollTo({top:0,behavior:'smooth'})}
function petCard(pet){const unavailable=pet.status!=='Available';return `<article class="market-card"><div class="market-image"><img src="${pet.image}" alt="${pet.name}, ${pet.age} ${pet.breed}"><span class="${unavailable?'hold':''}">${pet.status}</span></div><div class="market-body"><div><span class="owner-kicker">${pet.litter}</span><h3>${pet.name} · ${pet.breed}</h3><p>${pet.age} · ${pet.sex}</p></div><strong>${pet.price}</strong><div class="market-facts"><span><small>Health</small>${pet.health}</span><span><small>Breeder record</small>Verified in prototype</span></div><button data-interest="${pet.name}" ${unavailable?'disabled':''}>${unavailable?'Currently unavailable':'View & register interest'}</button></div></article>`}
function renderPets(list=pets){$('#market-grid').innerHTML=list.map(petCard).join('');$$('[data-interest]').forEach(button=>button.onclick=()=>openInterest(button.dataset.interest))}
function renderRequests(){$('#request-count').textContent=requests.length;$('#request-list').innerHTML=requests.map((request,index)=>`<article><span class="request-type">${request.type}</span><div><strong>${request.pet}</strong><p>${request.detail}</p></div><em>${request.status}</em><small>${request.updated}</small><button data-request="${index}">View details</button></article>`).join('');$$('[data-request]').forEach(button=>button.onclick=()=>showToast('Request detail opened in this prototype.'))}
function openInterest(name){selectedPet=pets.find(pet=>pet.name===name);$('#interest-title').textContent=`Register interest in ${selectedPet.name}`;$('#interest-summary').textContent=`${selectedPet.breed} · ${selectedPet.age} · ${selectedPet.price} · ${selectedPet.litter}`;$('#interest-modal').hidden=false}
function closeInterest(){$('#interest-modal').hidden=true;selectedPet=null}
$$('[data-owner-view]').forEach(button=>button.addEventListener('click',()=>setOwnerView(button.dataset.ownerView)));
$('#pet-search').addEventListener('input',filterPets);$('#species-filter').addEventListener('change',filterPets);
function filterPets(){const query=$('#pet-search').value.toLowerCase(),species=$('#species-filter').value;renderPets(pets.filter(pet=>(pet.name+pet.breed).toLowerCase().includes(query)&&(species==='all'||pet.species===species)))}
$$('[data-service]').forEach(button=>button.addEventListener('click',()=>{requests.unshift({type:button.dataset.service,pet:button.dataset.pet,detail:'Preferred timing to be confirmed',status:'Submitted',updated:'Just now'});renderRequests();setOwnerView('requests');showToast('Request sent to the Tokyo Pet support team.')}));
$$('[data-action]').forEach(button=>button.addEventListener('click',()=>showToast(button.dataset.action==='documents'?'Document library opened in this prototype.':'Pet registration started in this prototype.')));
$('.modal-close').onclick=closeInterest;$('.modal-cancel').onclick=closeInterest;
$('#interest-form').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const pet = selectedPet;
  if (!pet) return;
  const submit = form.querySelector('[type="submit"]');
  if (submit.disabled) return;
  const data = new FormData(form);
  submit.disabled = true;

  try {
    const { captureEnquiry } = await import('./analytics-data.mjs');
    const { id } = captureEnquiry(window.localStorage, {
      animalId: pet.id,
      campaign: new URLSearchParams(window.location.search).get('utm_source'),
    });
    requests.unshift({
      type: 'Purchase interest',
      pet: pet.name,
      detail: data.get('timing') + ' · ' + data.get('contact') + ' preferred',
      status: 'Submitted',
      updated: 'Just now',
    });
    renderRequests();
    closeInterest();
    form.reset();
    setOwnerView('requests');
    showToast('Demo enquiry ' + id.slice(0, 8) + ' is available in the admin CRM on this browser.');
  } catch {
    showToast('The demo enquiry could not be saved. Check browser storage and try again.');
  } finally {
    submit.disabled = false;
  }
});
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeInterest()});
renderPets();renderRequests();
