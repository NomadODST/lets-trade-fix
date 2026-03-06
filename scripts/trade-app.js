class TradeApp extends Application{

constructor(a,b,id){

super();

this.id=id;
this.a=a;
this.b=b;

this.offerA=[];
this.offerB=[];

this.goldA=0;
this.goldB=0;

this.acceptA=false;
this.acceptB=false;

}

static get defaultOptions(){

return mergeObject(super.defaultOptions,{
id:"trade-window",
template:"modules/simple-token-trade/templates/trade-window.html",
width:900,
height:"auto",
resizable:true
});

}

getData(){

return{
a:this.a,
b:this.b,
itemsA:this.a.items.contents,
itemsB:this.b.items.contents,
offerA:this.offerA,
offerB:this.offerB,
goldA:this.goldA,
goldB:this.goldB,
acceptA:this.acceptA,
acceptB:this.acceptB
};

}

activateListeners(html){

html.find(".item").click(ev=>{

const id=ev.currentTarget.dataset.id;
const side=ev.currentTarget.dataset.side;

if(side==="A") this.offerA.push(id);
if(side==="B") this.offerB.push(id);

this.sync();

});

html.find(".gold-a").change(ev=>{
this.goldA=Number(ev.target.value);
this.sync();
});

html.find(".gold-b").change(ev=>{
this.goldB=Number(ev.target.value);
this.sync();
});

html.find(".accept-a").click(()=>{
this.acceptA=true;
this.sync();
this.checkTrade();
});

html.find(".accept-b").click(()=>{
this.acceptB=true;
this.sync();
this.checkTrade();
});

html.find(".cancel").click(()=>{
this.close();
});

html.find(".search").keyup(ev=>{
const term=ev.target.value.toLowerCase();
html.find(".item").each((i,e)=>{
const name=e.innerText.toLowerCase();
$(e).toggle(name.includes(term));
});
});

}

sync(){

game.simpleTrade.send({
id:this.id,
type:"update",
state:this.serialize()
});

this.render();

}

serialize(){

return{
offerA:this.offerA,
offerB:this.offerB,
goldA:this.goldA,
goldB:this.goldB,
acceptA:this.acceptA,
acceptB:this.acceptB
};

}

receiveSocket(data){

if(data.type!=="update") return;

Object.assign(this,data.state);

this.render();

}

async checkTrade(){

if(!(this.acceptA && this.acceptB)) return;

for(const id of this.offerA){

const item=this.a.items.get(id);
const data=item.toObject();

await this.b.createEmbeddedDocuments("Item",[data]);
await item.delete();

}

for(const id of this.offerB){

const item=this.b.items.get(id);
const data=item.toObject();

await this.a.createEmbeddedDocuments("Item",[data]);
await item.delete();

}

const gpA=this.a.system.currency.gp||0;
const gpB=this.b.system.currency.gp||0;

await this.a.update({"system.currency.gp":gpA-this.goldA+this.goldB});
await this.b.update({"system.currency.gp":gpB-this.goldB+this.goldA});

ui.notifications.info("Trade completed.");

this.close();

}

}

if(!game.simpleTrade) game.simpleTrade={};
game.simpleTrade.TradeApp=TradeApp;
