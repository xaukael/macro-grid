Hooks.once("setup", async () => {
  game.settings.register("macro-grid", "bottomOffset", {
    name: `Bottom Offset`,
    hint: `Distance in pixels the grid will be from the bottom of the screen`,
    scope: "world",
    config: true,
    type: Number,
    default: 5,
    onChange: value => { 
      renderMacroGrid(game.user.id);
    }
  });
  game.settings.register('macro-grid', 'onStartup', {
    name: `Display on Startup`,
    hint: `Determines whether the macro grid shows when the page is ready`,
    scope: "client",
    config: true,
    type: Boolean,
    default: false,
    onChange: value => { 
    }
  });
});

Hooks.on('ready', ()=>{
  if(game.settings.get("macro-grid", "onStartup")) renderMacroGrid(game.user.id);
})


Hooks.on('renderHotbar', (app, html, options)=>{
  html.on('wheel', function(e){
    if (e.originalEvent.wheelDelta>0)
      html.find('.page-control')[0].click()
    else
      html.find('.page-control')[1].click()
  })
  let userId = $('#macro-manager').find('select.user-select').val();
  if (!userId) userId = game.user.id;
  let activePage = +html.find('#macro-list').data().page;
  html.find('span.page-number').html($(`<a>${activePage}</a>`).click(()=>{renderMacroGrid(userId);}))
  if (!$('#macro-manager').length) return;
  renderMacroGrid(userId);
})

var renderMacroGrid = function(userId) {
  let m = this; 
  let user = game.users.get(userId)
  if (!user) user = game.user;//${window.innerWidth/2-257}px
  let html=`<div id="macro-manager">
  <style>
  #hotbar{display:none;}
  #macro-manager {border: 1px solid var(--color-border-dark);border-radius: 5px; background-image: url(../ui/denim075.png); z-index: 100; 
  width: 514px ; height: 292px; padding: .5em; color: white; position: absolute; bottom: ${game.settings.get("macro-grid", "bottomOffset")}px; left: 50%; transform: translate(-50%, 0%); box-shadow: 0 0 20px var(--color-shadow-dark);}
  #macro-manager * select.user-select { border: 1px solid var(--color-border-dark);color: white;}
  #macro-manager * select.user-select * { background: #111;}
  div.faux-hotbar-macro {border: 1px solid var(--color-border-dark) ;}
  div.faux-hotbar-macro:hover { border: 1px solid #ff6400;}
  img.faux-macro-img { margin: 1px 0px 0px 1px; width: 44px;  height: 44px;  object-fit: cover;  object-position: 50% 50%; opacity: 1.0; border: unset !important; border: 1px solid #fff; }
  div.faux-hotbar-macro {  height: 48px; width: 48px;  border-radius: 5px;  position: relative;  flex: 0 0 50px;  height: 48px;  border: 1px solid #000;  border-radius: 3px;  cursor: pointer; }
  div.faux-hotbar-macro > .tooltip {  display: block;  min-width: 148px;  height: 26px;  padding: 2px 4px;  position: absolute; top: -32px;  left: -50px;  background: rgba(0, 0, 0, 0.9);  border: 1px solid var(--color-border-dark-primary);  border-radius: 3px;  color: var(--color-text-light-highlight); line-height: 22px;  text-align: center;  white-space: nowrap;  word-break: break-all; background-color: #111 !important;}
  div.faux-hotbar-macro > small {position: relative; bottom: 50px; left: 2px; padding: 0px 3px 0px 3px; text-align: right; background-color: #111 !important; ${game.user.id==user.id?'':'display:none;'}}
  center.controls{width: 100%;}
  center.controls > a {border: 1px solid var(--color-border-dark); border-radius: 3px;
      padding: 4px 3px; width: 2em;}
  center.controls > a.directory {float: left; }
  center.controls > a.close {float: right; }
  center.controls > a.page-control {margin: 0 .25em; }
  </style>
  <div class="macro-grid" style="width:100%; display: grid; grid-template-columns: repeat(10, 50px);  row-gap:1px; column-gap:0px; margin: 0 0 .5em 0" id="macro-set-grid">`;
  //transform: translate(-50%, 0%); margin:-5px 0 .5em 0;
  let activePage = +$('#macro-list').data().page;
  for (let b = 50; b > 0; b-=10) 
    for (let i = 1; i <= 10; i++) 
      html += `<div class="faux-hotbar-macro" id="hotbar-macro-${b-10+i}" data-slot="${b-10+i}" draggable="true">
                    <img  class="faux-macro-img" width="46" height="46" src="./ui/denim075.png" style="opacity: 0;">
                    ${activePage==Math.floor(b/10)?`<small style="background-color: #222;">${i>9?0:i}</small>`:''}
                  </div>
                  `;
  html += `</div><center class="controls"><select class="user-select">${game.user.isGM?game.users.contents.reduce((a, u)=> a+=`<option value="${u.id}">${u.name}</option>`, ``):`<option value="${game.user.id}">${game.user.name}</option>`}</select></center></div>`;//

  html = $(html);
      
  html.find(".user-select").before($(`<a class="page-control" data-action="page-up" data-tooltip="MACRO.PageUp" alt="Previous Hotbar Page">
            <i class="fas fa-angle-up"></i></a>`).click(function(){
    $('#hotbar-page-controls > .page-control')[0].click()
  }))
  html.find(".user-select").after($(`<a class="page-control" data-action="page-down" data-tooltip="MACRO.PageDown" alt="Next Hotbar Page" aria-describedby="tooltip" style="padding-left: 0px">
            <i class="fas fa-angle-down" ></i>
        </a>`).click(function(){
    $('#hotbar-page-controls > .page-control')[1].click()
  }))
  html.find('.controls').prepend($(`<a class="directory"><i class="fas fa-folder"></i></a>`).click(function(){game.macros.directory.renderPopout()}));
  html.find('.controls').append($(`<a class="close"><i class="fas fa-times"></i></a>`).click(function(){$('#macro-manager').remove()}));
  html.find('select.user-select').val(user.id);
  html.find('select.user-select').change(function(e){
    renderMacroGrid($(this).val());
  })

  html.find('select.user-select').on('wheel', function(e){
    let change = e.originalEvent.wheelDelta>0?-1:1
    let option = $(this).children()[this.selectedIndex+change];
    if (!option) return;
    option.selected = true;
    $(this).trigger('change');
  })
  for (const [slot, id] of Object.entries(user.hotbar)) {
    let macro = game.macros.get(id);
    if (!macro) continue;
    html.find(`div#hotbar-macro-${slot}`).attr("data-id", macro.id);;
    html.find(`div#hotbar-macro-${slot}`).attr("name", macro.name);
    html.find(`div#hotbar-macro-${slot} > img`)
      .replaceWith(`<img  class="faux-macro-img" width="46" height="46" src="${macro.img}" draggable="true">`)
  }
  html.find(`div.faux-hotbar-macro`).click(async function(e){
    let macro =  game.macros.get($(this).data().id);
    if (macro)  macro.execute();
    else {
      macro = await Macro.create({name: "New Macro", type: "script"})
      macro.sheet.render(true);
      await user.assignHotbarMacro(macro, $(this).data().slot)
      renderMacroGrid(user.id);
    }
  });
  html.find(`div.faux-hotbar-macro`).contextmenu(async function(e){
    let macro =  game.macros.get($(this).data().id);
    if (e.ctrlKey&&e.shiftKey) {
      const update = foundry.utils.deepClone(user.hotbar);
      let doDelete = await Dialog.wait({
        title: "Delete this macro?",
        content: `<center><p>${macro.name}</p><center>`,
        buttons: {
          yes: {label: "Delete", callback:()=>{return true}},
          no: {label: "Keep", callback:()=>{return false}}
        },
        close:()=>{return false}
      });
      if (!doDelete) return;
      await macro.delete();
      delete update[$(this).data().slot];
      await  user.update({hotbar: update}, {diff: false, recursive: false, noHook: true});
      return renderMacroGrid(user.id);
    }
    if (e.ctrlKey) {
      const update = foundry.utils.deepClone(user.hotbar);
      delete update[$(this).data().slot];
      await  user.update({hotbar: update}, {diff: false, recursive: false, noHook: true});
      return renderMacroGrid(user.id);
    }
    if (macro)  macro.sheet.render(true);
  });
  html.find(`div.faux-hotbar-macro > img`).bind("dragstart", function(e) {
    if (!$(this).parent().data()) return;
    e.originalEvent.dataTransfer.setData("text", JSON.stringify({type:"Macro", uuid:"Macro."+ $(this).parent().data().id, originSlot: +$(this).parent().data().slot}));
    e.originalEvent.dataTransfer.effectAllowed = "copy";
    $(this).parent().find('.tooltip').remove();
  });
  html.find(`div.faux-hotbar-macro`).bind("drop", async function(e) {
    e.originalEvent.preventDefault();
    if ($(this).data().id) return ui.notifications.warn('there is already a macro in this slot')
    let dropped = JSON.parse(e.originalEvent.dataTransfer.getData("text"));
    if (dropped.type != 'Macro') return;
    let id = dropped.uuid.split('.')[1];
    if (id=='undefined') return;
    let macro = game.macros.get(id);
    if (!macro.ownership[user.id]) {
      let ownership = foundry.utils.deepClone(macro.ownership);
      ownership[user.id] = 2;
      await macro.update({ownership});
    }
    let slot = +$(this).data().slot;
    let fromSlot = dropped.originSlot?dropped.originSlot:null;
    await user.assignHotbarMacro(macro, slot, {fromSlot})
    renderMacroGrid(user.id);
  });
  html.find(`div.faux-hotbar-macro`).hover( 
  function(e){
      if($(this).attr('name')) $(this).append(`<span class="tooltip">${$(this).attr('name')}</span>`);
  }, 
  function(e){
      $(this).find('.tooltip').remove();
  });
  html.find('div.macro-grid').on('wheel', function(e){
      if (e.originalEvent.wheelDelta>0)
        html.find('.page-control')[0].click()
      else
        html.find('.page-control')[1].click()
    })
  if ($('#macro-manager').length) $('#macro-manager').replaceWith(html);
  else $('body').append(html)

}