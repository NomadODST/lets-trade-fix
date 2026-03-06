class TradeApp extends Application{

constructor(session){

super();

this.session=session;

}

static get defaultOptions(){

return mergeObject(super.defaultOptions,{
id:"trade-window",
template:"modules/simple-token-trade/templates/trade-window.html",
width:900,
height:600,
resizable:true
});

}

getData(){

const s=this.session;

return{
a:s.actorA,
b:s.actorB,
itemsA:s.actorA.items.contents,
itemsB:s.actorB.items.contents,
offerA:s.offerA,
offerB:s.offerB,
goldA:s.goldA,
goldB:s.goldB,
acceptA:s.acceptA,
acceptB:s.acceptB
};

}

activateListeners(html){

const s=this.session;


html.find(".item").each((i,e)=>{

e.draggable=true;

});


html.find(".item").on("dragstart",ev=>{

ev.originalEvent.dataTransfer.setData(
"text/plain",
ev.currentTarget.dataset.id
);

});


html.find(".offer-slot").on("dragover",ev=>ev.preventDefault());


html.find(".offer-slot").on("drop",ev=>{

const id=ev.originalEvent.dataTransfer.getData("text/plain");

this.addItem(id,ev.currentTarget.dataset.side);

});


html.find(".accept-a").click(()=>{

s.acceptA=true;

game.simpleTrade.sync(s);

this.checkTrade();

});


html.find(".accept-b").click(()=>{

s.acceptB=true;

game.simpleTrade.sync(s);

this.checkTrade();

});


html.find(".cancel").click(()=>this.close());


html.find(".search").keyup(ev=>{

const term=ev.target.value.toLowerCase();

html.find(".item").each((i,e)=>{

$(e).toggle(e.innerText.toLowerCase().includes(term));

});

});


html.find(".gold-a").change(ev=>{

s.goldA=Number(ev.target.value);

s.resetAccept();

game.simpleTrade.sync(s);

});


html.find(".gold-b").change(ev=>{

s.goldB=Number(ev.target.value);

s.resetAccept();

game.simpleTrade.sync(s);

});

}

async addItem(itemId,side){

const s=this.session;

let item;

if(side==="A") item=s.actorA.items.get(itemId);
if(side==="B") item=s.actorB.items.get(itemId);

if(!item) return;


const qty=await Dialog.prompt({
title:"Quantity",
content:`<input type="number" value="1" min="1" max="${item.system.quantity||1}">`,
callback:html=>Number(html.find("input").val())
});


if(side==="A")
s.offerA.push({id:itemId,qty});

if(side==="B")
s.offerB.push({id:itemId,qty});

s.resetAccept();

game.simpleTrade.sync(s);

this.render();

}


async checkTrade(){

const s=this.session;

if(!(s.acceptA && s.acceptB)) return;

for(const o of s.offerA){

const item=s.actorA.items.get(o.id);

const data=item.toObject();

data.system.quantity=o.qty;

await s.actorB.createEmbeddedDocuments("Item",[data]);

await item.update({
"system.quantity":item.system.quantity-o.qty
});

}

for(const o of s.offerB){

const item=s.actorB.items.get(o.id);

const data=item.toObject();

data.system.quantity=o.qty;

await s.actorA.createEmbeddedDocuments("Item",[data]);

await item.update({
"system.quantity":item.system.quantity-o.qty
});

}


await s.actorA.update({
"system.currency.gp":
(s.actorA.system.currency.gp||0)-s.goldA+s.goldB
});

await s.actorB.update({
"system.currency.gp":
(s.actorB.system.currency.gp||0)-s.goldB+s.goldA
});

ui.notifications.info("Trade completed.");

this.close();

}

}

if(!game.simpleTrade) game.simpleTrade={};
game.simpleTrade.TradeApp=TradeApp;
