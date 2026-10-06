import { Component as ReactComponent } from 'react'
import { getEventContext } from '@/lib/lead'

const INTERESTS=['General protection review','Mortgage protection','Final expense','Term life with living benefits','Whole life','Juvenile / child coverage','Retirement income planning','Business protection / key person'];
const DOW=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const INTAKE=[['marital','Marital status',['Single','Married','Separated','Widowed']],['kids','Children',['0','1','2','3+']],['budget','Monthly budget',['Under $50','$50–$100','$100–$200','$200+']],['existing','Have existing coverage?',['Yes','No']],['tobacco','Tobacco use?',['Yes','No']]];
export default class BookingLogic extends ReactComponent{
  state={view:'book',step:1,interest:null,format:'Phone',day:0,slot:null,f:{first:'',last:'',email:'',phone:''},notes:'',booked:null,cancelled:false,intake:{},blocked:{},statuses:{},selKey:null,save:'idle',availability:[],loading:true,error:'',response:null,preview:false};
  componentDidMount() {
    this.active = true;
    this.setState({preview:new URLSearchParams(window.location.search).get('preview')==='phone'});
    void this.loadAvailability();
  }
  componentWillUnmount() { this.active = false; }
  async loadAvailability() {
    this.setState({loading:true,error:''});
    try {
      const response = await fetch('/api/availability', {cache:'no-store'});
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Available times could not be loaded. Please call (570) 900-1977.');
      if(this.active) this.setState({availability:data.days.filter(day=>day.slots.length),loading:false,day:0,slot:null});
    } catch(error) {
      if(this.active) this.setState({loading:false,error:error.message || 'Available times could not be loaded. Please call (570) 900-1977.'});
    }
  }
  async submit() {
    if(this.state.save==='saving') return;
    const s=this.state,i=s.intake,slotStart=s.availability[s.day]?.slots[s.slot];
    if(!slotStart) { this.setState({step:2,slot:null,error:'Please choose an available time.'}); return; }
    this.setState({save:'saving',error:''});
    const productMap={'General protection review':'General','Mortgage protection':'Mortgage_Protection','Final expense':'Final_Expense','Term life with living benefits':'Term_Life','Whole life':'Whole_Life','Juvenile / child coverage':'Child_Whole_Life','Retirement income planning':'Retirement','Business protection / key person':'Business'};
    const context=getEventContext();
    try {
      const response=await fetch('/api/appointments/book',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        ...context,firstName:s.f.first.trim(),lastName:s.f.last.trim(),email:s.f.email.trim(),phone:s.f.phone.trim(),slotStart,
        productInterest:productMap[s.interest],notes:[s.notes,`Requested meeting format: ${s.format}`].filter(Boolean).join('\n'),
        maritalStatus:i.marital||null,childrenCount:i.kids?parseInt(i.kids):null,monthlyBudget:i.budget||null,hasExistingInsurance:i.existing||null,tobaccoUse:i.tobacco||null,
        state:'PA',pageUrl:window.location.pathname+window.location.search,source:context.source||'website',medium:context.medium||'booking',campaign:context.campaign||'booking_design'
      })});
      const data=await response.json();
      if(!response.ok || !data.ok) {
        if(response.status===409) { await this.loadAvailability(); this.setState({step:2}); }
        throw new Error(data.error || 'Your booking could not be saved. Please try again or call (570) 900-1977.');
      }
      if(this.active) this.setState({step:4,save:'ok',response:data,booked:{start:slotStart,format:s.format,interest:s.interest,appointmentId:data.appointmentId}});
    } catch(error) { if(this.active) this.setState({save:'err',error:error.message}); }
  }
  requestChange(kind) {
    const b=this.state.booked;
    if(!b) {this.setState({view:'book',error:'Book a consultation first, or call Jackson about an existing booking.'});return;}
    window.location.href='mailto:jackson1989@latimorelegacy.com?subject='+encodeURIComponent(`${kind} consultation ${b.appointmentId}`)+'&body='+encodeURIComponent(`Please ${kind.toLowerCase()} my consultation on ${this.when(b.start)}.\nName: ${this.state.f.first} ${this.state.f.last}`);
  }
  when(iso) { return new Intl.DateTimeFormat('en-US',{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZone:'America/New_York'}).format(new Date(iso))+' ET'; }
  renderVals(){
    const s=this.state,set=o=>this.setState(o),gold='#C9A25F',navy='#0E1A2B';
    const DAYS=s.availability.map(day=>new Date(day.date+'T12:00:00Z'));
    const SLOTS=(s.availability[s.day]?.slots||[]).map(iso=>new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit',timeZone:'America/New_York'}).format(new Date(iso)));
    const d=DAYS[s.day]||new Date(),dayStr=`${DOW[d.getDay()]}, ${MON[d.getMonth()]} ${d.getDate()}`;
    const canNext=s.step===1?!!s.interest:s.step===2?s.slot!==null:(s.f.first.trim()&&s.f.last.trim()&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.f.email)&&s.f.phone.replace(/\D/g,'').length>=10);
    const b=s.booked;
    const week=[],selObj=null,mark=()=>()=>{};
    const fieldDefs=[['first','First name','text','Jane'],['last','Last name','text','Doe'],['email','Email','email','jane@email.com'],['phone','Mobile phone','tel','(570) 555-0100']];
    return{
      tabs:[['book','Book'],['manage','My booking'],['admin','Admin'],['mobile','Phone preview']].filter(([k])=>!s.preview||k!=='mobile').map(([k,l])=>({label:l,go:()=>{if(k==='admin'){window.location.href='/admin/calendar';return;}set({view:k});},bg:s.view===k?gold:'transparent',fg:s.view===k?navy:'#fff'})),
      isBook:s.view==='book',isManage:s.view==='manage',isAdmin:false,isMobile:s.view==='mobile',
      shares:(()=>{const u=encodeURIComponent('https://www.latimorelifelegacy.com/book'),t=encodeURIComponent('Book a free consultation with Latimore Life & Legacy');return[{label:'Facebook',href:'https://www.facebook.com/sharer/sharer.php?u='+u},{label:'LinkedIn',href:'https://www.linkedin.com/sharing/share-offsite/?url='+u},{label:'X',href:'https://twitter.com/intent/tweet?url='+u+'&text='+t},{label:s.copied?'Link copied':'Copy link',href:'#',click:e=>{e.preventDefault();navigator.clipboard?.writeText('https://www.latimorelifelegacy.com/book').then(()=>set({copied:true})).catch(()=>set({error:'Copy the booking address from your browser to share it.'}));}}];})(),
      follows:[{label:'Instagram',href:'https://www.instagram.com/latimorelifelegacy25'},{label:'LinkedIn',href:'https://www.linkedin.com/in/startwithjacksongfi'},{label:'Facebook',href:'https://www.facebook.com/share/1EVpBCEZuf/'}],hasSel:!!selObj,sel:selObj||{facts:[]},markDone:mark('done'),markNoShow:mark('noshow'),markClear:mark(null),
      intake:INTAKE.map(([k,l,opts])=>({label:l,opts:opts.map(o=>{const on=s.intake[k]===o;return{label:o,pick:()=>this.setState(x=>({intake:{...x.intake,[k]:on?null:o}})),bg:on?navy:'#fff',fg:on?'#fff':navy,bd:on?navy:'#D9D2C4'};})})),
      reminders:[{when:'24 hours before',text:`Reminder: your consultation with Jackson is tomorrow at ${s.slot!==null?SLOTS[s.slot]:''} ET. Reply C to confirm or R to reschedule.`},{when:'1 hour before',text:s.format==='Phone'?`Jackson will call you in 1 hour at ${s.f.phone||'your number'}.`:`Starting in 1 hour. Join on ${s.format} using the link in your invite.`},{when:'If missed',text:`Sorry we missed you today, ${s.f.first||'there'}. Reply R and we'll find a new time that works.`}],
      saveMsg:{idle:'',saving:'Saving to calendar…',ok:'Saved to Latimore calendar',err:s.error}[s.save],saveBg:s.save==='ok'?'#E6F2E9':s.save==='err'?'#FBF3E4':'#F3F1EC',saveFg:s.save==='ok'?'#2F6B3F':s.save==='err'?'#8A6420':'#4A5466',
      s1:s.step===1,s2:s.step===2,s3:s.step===3,s4:s.step===4,notDone:s.step<4,
      steps:['Topic','Time','Details'].map((l,i)=>({label:l,bar:i<s.step?gold:'#EAE4D8',fg:i<s.step?navy:'#9CA3AF'})),
      summary:[{k:'Length',v:'30 minutes'},{k:'Topic',v:s.interest||'—'},{k:'Format',v:s.format},{k:'When',v:s.slot!==null?`${dayStr}, ${SLOTS[s.slot]}`:'—'}],
      interests:INTERESTS.map(l=>({label:l,pick:()=>set({interest:l}),bg:s.interest===l?'#FBF6EC':'#fff',bd:s.interest===l?gold:'#E6DECF'})),
      formats:['Phone','Zoom','Google Meet'].map(l=>({label:l,pick:()=>set({format:l}),bg:s.format===l?navy:'#fff',fg:s.format===l?'#fff':navy})),
      days:DAYS.map((dd,i)=>({dow:DOW[dd.getDay()],num:dd.getDate(),mon:MON[dd.getMonth()],pick:()=>set({day:i,slot:null}),bg:s.day===i?navy:'#fff',fg:s.day===i?'#fff':navy,bd:s.day===i?navy:'#E6DECF'})),
      slots:SLOTS.map((t,i)=>{const tk=false,on=s.slot===i;return{label:t,taken:tk,pick:()=>set({slot:i}),bg:on?gold:tk?'#F3F1EC':'#fff',fg:tk?'#A8ADB5':navy,bd:on?gold:tk?'#F3F1EC':'#E6DECF',td:tk?'line-through':'none'};}),
      fields:fieldDefs.map(([k,l,t,p])=>({label:l,type:t,ph:p,value:s.f[k],set:e=>{const v=e.target.value;this.setState(st=>({f:{...st.f,[k]:v}}));}})),
      notes:s.notes,setNotes:e=>set({notes:e.target.value}),
      backVis:s.step>1?'visible':'hidden',back:()=>set({step:s.step-1}),
      notice:s.error||(s.loading?'Loading available times…':s.step===2&&!s.availability.length?'No consultation times are currently available. Call (570) 900-1977.':''),
      nextDisabled:!canNext||s.save==='saving',nextBg:canNext?gold:'#EDE6D8',nextLabel:s.save==='saving'?'Saving to calendar…':s.step===3?'Confirm booking':'Continue',
      next:()=>{if(!canNext||s.save==='saving')return;if(s.step===3){void this.submit();}else set({step:s.step+1,error:''});},
      firstName:s.f.first||'there',topicShown:s.interest||'—',joinLine:s.format==='Phone'?`Jackson will call you at ${s.f.phone||'your number'}.`:`Your ${s.format} link is in the attached calendar invite.`,emailShown:s.f.email||'your inbox',
      confirmLine:s.slot!==null?`${dayStr} at ${SLOTS[s.slot]} ET ${s.format==='Phone'?'by phone':'on '+s.format}.`:'',
      toManage:()=>set({view:'manage'}),restart:()=>{set({step:1,interest:null,slot:null,save:'idle'});void this.loadAvailability();},
      mWhen:b?this.when(b.start):'No booking in this session',
      mWhat:b?`30-min consultation · ${b.format} · ${b.interest}`:'Call Jackson if you booked previously.',
      mStatus:b?'Confirmed':'',mStatusColor:s.cancelled?'#9B2C2C':'#2F6B3F',
      cancelLabel:'Request cancellation',cancel:()=>this.requestChange('Cancel'),
      reschedule:()=>this.requestChange('Reschedule'),
      week,adminCount:week.reduce((a,w)=>a+w.count,0)
    };
  }
}
