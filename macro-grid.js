Hooks.once("setup", async () => {
  game.settings.register('macro-grid', 'onStartup', {
    name: `Display on Startup`,
    hint: `Determines whether the macro grid shows when the page is ready`,
    scope: "client",
    config: true,
    type: Boolean,
    default: false
  });
  game.settings.register("macro-grid", "gridSize", {
    name: `Grid Size`,
    hint: `Size in pixels for the grid squares.`,
    scope: "client",
    config: true,
    type: Number,
    default: 40,
    onChange: value => { 
      Object.values(ui.windows).filter(w=>w.id.startsWith('macro-grid')).forEach(function(w){
        renderMacroGrid(w.id.split('-').at(-1))
      })
    }
  });
  game.settings.register("macro-grid", "gridColor", {
    name: `Grid Color`,
    hint: `CSS color for grid borders.`,
    scope: "client",
    config: true,
    type: String,
    default: "rgba(0,0,0,0.5)",
    onChange: value => { 
      Object.values(ui.windows).filter(w=>w.id.startsWith('macro-grid')).forEach(function(w){
        renderMacroGrid(w.id.split('-').at(-1))
      })
    }
  });
  game.settings.register("macro-grid", "barMode", {
    name: `Grid Color`,
    hint: `CSS color for grid borders.`,
    scope: "client",
    config: false,
    type: Boolean,
    default: false,
    
    onChange: value => { 
      Object.values(ui.windows).filter(w=>w.id.startsWith('macro-grid')).forEach(function(w){
        renderMacroGrid(w.id.split('-').at(-1))
      })
    }
  });
  game.settings.register("macro-grid", "bottomOffset", {
    name: `Bottom Offset`,
    hint: `Distance in pixels the grid will be from the bottom of the screen.`,
    scope: "world",
    config: true,
    type: Number,
    default: 5,
    onChange: value => { 
      renderMacroGrid(game.user.id);
    }
  });

});

Hooks.on('ready', ()=>{
  if(game.settings.get("macro-grid", "onStartup")) renderMacroGrid(game.user.id);
})

Hooks.on('getUserContextOptions', (players, options)=>{
  options.push({
    name: "Macros",
    icon: '<i class="fas fa-code"></i>',
    callback: (li)=>{
      renderMacroGrid(li.data("userId"))
    },
    condition: (li)=>{
      return game.user.isGM || li.data("userId") == game.user.id
    }
  })
})



var renderMacroGrid = function(userId) {
  let id = `macro-grid-${userId}`
  
  let w = Object.values(ui.windows).find(w=>w.id==id)
  if (w)  w.setPosition({})
  let size = game.settings.get("macro-grid", "gridSize")
  let barMode = game.settings.get("macro-grid", "barMode");
  let height = size*5 + size/10*4 + 128
  if (barMode) height = size*1 + 75
  let fromBottom = game.settings.get("macro-grid", "bottomOffset")
  let activePage = +$('#macro-list').data().page
  let user = game.users.get(userId)
  let rendered = !!w;
  let content = `
      <style>
      #hotbar {position: relative !important; bottom: -999px}
      .grid { display: grid; grid-template-columns: repeat(10, ${size}px); gap: ${size/10}px;}/**/
      .grid > div > a.content-link{ position: absolute; background: unset; padding: unset; border: unset;  border-radius: unset; }
      .grid > div > a.content-link > img { border: unset; height: ${size-size/20}px; width: ${size-size/20}px;}
      .grid > div { position: relative; border:1px solid ${game.settings.get("macro-grid", "gridColor")}; height: ${size}px; cursor:pointer; border-radius: ${size/20}px;}
      .grid > div:hover { border:1px solid var(--color-shadow-highlight); box-shadow: 0 0 ${Math.floor(size/5)}px var(--color-shadow-highlight) inset;}
      .grid > div > small {opacity: .75; font-size: ${size/4}px;color: var(--color-text-light-highlight); pointer-events: none; position: absolute; top: 0px; right: 0px; padding: 0px ${size/12}px 0px ${size/12}px; text-align: right; background: #111 !important; }
      a#taskbar-macro-grid  {opacity: 100%}
      .user-select > option {  color: var(--color-text-light-highlight);  background: #111 !important; }
      </style><div class="grid"></div>`

  let d = new Dialog({title:'Macro Grid', content, buttons:{},
    render: async (html)=>{
      html[0].parentElement.style.background="unset"
      html.find('.hotkey').remove()
      let grid = html.find('div.grid')
      for (let b = 50; b > 0; b-=10) 
          for (let i = 1; i <= 10; i++) 
            grid.append(`<div data-slot="${b-10+i}" class="slot"></div>`)
      
      let activePage = ui.hotbar.page;
      if (game.user.id==user.id)
        for (i=1; i<=10; i++)
          html.find(`[data-slot="${activePage*10+i-10}"]`).append(`<small class="hotkey">${i>9?0:i}</small>`)
  
      if (game.settings.get('macro-grid', 'barMode')) {
        html.find('div.slot').hide()
        html.find('small.hotkey').each(function(){
          $(this).parent().show()
        })
      } 
      for (const [slot, id] of Object.entries(user.hotbar)) {
        let macro = game.macros.get(id)
        if (!macro) continue;
        let anchor = await TextEditor.enrichHTML(macro.link, {async:false})
        let $a = $(anchor)
        $a[0].dataset.tooltip = macro.name
        //$a[0].title = macro.name
        $a.html(`<img src="${macro.img}">`)
        $a.contextmenu(async function(e){
          let macro = fromUuidSync(this.dataset.uuid)
          if (e.ctrlKey&&e.shiftKey) {
            let update = foundry.utils.deepClone(user.hotbar)
            let doDelete = await Dialog.wait({
              title: `Delete macro: ${macro.name}?`,
              content: ``,
              buttons: {
                yes: {label: "Delete", callback:()=>{return true}},
                no: {label: "Keep", callback:()=>{return false}}
              },
              close:()=>{return false}
            });
            if (!doDelete) return;
            await macro.delete()
            delete update[this.parentElement.dataset.slot]
            await  user.update({hotbar: update}, {diff: false, recursive: false, noHook: true})
            return this.remove()
          }
          if (e.ctrlKey) {
            let update = foundry.utils.deepClone(user.hotbar)
            delete update[this.parentElement.dataset.slot]
            await  user.update({hotbar: update}, {diff: false, recursive: false, noHook: true})
            return this.remove()
          }
          if (macro)  macro.sheet.render(true)
        })
        html.find(`div[data-slot=${slot}]`).append($a)
      }
  
      html.find(`div.slot`).click(async function(e){
        if (this.children.length) return;
        macro = await Macro.create({name: "New Macro", type: "script"})
        macro.sheet.render(true);
        await user.assignHotbarMacro(macro, $(this).data().slot)
      });
        
      html.find(`div.slot`).bind("drop", async function(e) {
        e.originalEvent.preventDefault()
        let link = $(this).find('a.content-link')
        //let existing 
        //console.log(link, !link.length, !!link.length)
        if (link.length) return ui.notifications.warn('there is already a macro in this slot')
          //existing = Macro.get(link.data("id"))
        
        let dropped = JSON.parse(e.originalEvent.dataTransfer.getData("text"))
        if (dropped.type != 'Macro') return
        let macro = await fromUuid(dropped.uuid)
        //console.log(macro)
        if (!macro) return;
        if (dropped.uuid.startsWith('Compendium')) 
          macro = await Macro.create(macro)
          
        if (!macro.ownership[user.id] && game.user.isGM) {
          let ownership = foundry.utils.deepClone(macro.ownership)
          ownership[user.id] = 1
          await macro.update({ownership})
        }
        let slot = Number(this.dataset.slot);
        let fromSlot = Object.entries(user.hotbar).find(([k,v])=>v==macro.id)?.at(0)||null
        await user.assignHotbarMacro(macro, slot, {fromSlot})
        //if (existing) await user.assignHotbarMacro(existing, fromSlot, {fromSlot:slot})
      })
      if (game.user.id == user.id)
      html.find('.grid').on('wheel', function(e){
        if (game.user.id != userId) return;
        let page = e.originalEvent.wheelDelta>0?activePage+1:activePage-1
        if (page == 0) page = 5
        if (page == 6) page = 1
        ui.hotbar.changePage(page)
      })
      header = html.closest('.app').find('header')
      let title = header.find('.window-title')
      title.text(user.name + " Macros")
  
      if (game.user.id == user.id) {
        header.find('.page-control').show()
        header.find('a.page-number').remove()
        header.find('a.page-control[data-action="page-up"]').after(`<a class="page-number" style="width: 1em;text-align: center;"><i class="fa-solid fa-${ui.hotbar.page}"></i></a>`)
      } else header.find('.page-control').hide()
      
      
      if (rendered) return;
      title.parent().dblclick(function(e){e.preventDefault(); e.stopPropagation() })
      title.after(`<a class="popout" data-tooltip="Pop Out"><i class="fa-solid fa-arrow-up-right-from-square"></i></a>`)
      title.after('<a class="info" data-tooltip="LClick to execute <br> RClick to edit <br> Shift+RClick to remove <br> Ctrl+Shift+RClick to prompt delete<br>Wheel over grid to change page"><i class="fa-solid fa-circle-info"></i></a>')
      title.after(`<a class="directory" data-tooltip="Macro Directory"><i class="fas fa-folder"></i></a>`)
      
      //title.after(`<a class="refresh" data-tooltip="Refresh" ><i class="fa-solid fa-arrows-rotate"></i></a>`)
      if (game.user.id == user.id) {

        title.after(`<a class="page-control" data-action="page-down" data-tooltip="MACRO.PageDown" alt="Next Hotbar Page" aria-describedby="tooltip" ><i class="fas fa-angle-down" ></i></a>`)
        title.after(`<a class="page-number" style="width: 1em;text-align:center;"><i class="fa-solid fa-${ui.hotbar.page}"></i></a>`)        
        title.after( `<a class="page-control" data-action="page-up" data-tooltip="MACRO.PageUp" alt="Previous Hotbar Page" ><i class="fas fa-angle-up"></i></a>`)
        
      }
      header.find('a.popout').click(function(){
        let popout = window.open(`${window.location.origin}/modules/macro-grid/macro-grid.html`, "", "width=500,height=270,location=no,directories=0")
        let renderHotbarHook = Hooks.on('renderHotbar', (app)=>{
          if (popout.closed) return Hooks.off('renderHotbar', renderHotbarHook)
          let hotbar = Object.entries(user.hotbar).reduce((a, [k,v])=>{
              let m = Macro.get(v)
              if (!m) return a
              a[k] = {id: v, name: m.name, img: m.img}
              return a
            }, {})
            let data = {
              type: "hotbar",
              hotbar,
              page: app?.page || 1,
              user: {name: user.name, id: user.id, logged: game.user.id==userId}
            }
            popout.postMessage(data, '*');
        })
        if (userId == game.user.id) return;
        let updateUser = Hooks.on('updateUser',  (updatedUser, updates)=>{
          if (updatedUser.id != userId) return;
          if (!foundry.utils.hasProperty(updates, "hotbar")) return;
          if (popout.closed) return Hooks.off('updateUser', renderHotbarHook)
          let hotbar = Object.entries(user.hotbar).reduce((a, [k,v])=>{
              let m = Macro.get(v)
              if (!m) return a
              a[k] = {id: v, name: m.name, img: m.img}
              return a
            }, {})
            let data = {
              type: "hotbar",
              hotbar,
              user: {name: user.name, id: user.id, logged: game.user.id==userId}
            }
            popout.postMessage(data, '*');
        })
        
      }).dblclick(function(e){e.stopPropagation();});
      header.find('.page-control').click(function(){
        let page = this.dataset.action.includes("up")?ui.hotbar.page+1:ui.hotbar.page-1
        if (page == 0) page = 5
        if (page == 6) page = 1
        ui.hotbar.changePage(page)
        console.log(d)
      }).dblclick(function(e){e.stopPropagation();});
      
      header.find('a.directory').click(function(){
        Hooks.once('renderSidebarTab', (app, html, options)=>{
          app.setPosition({top : d.position.top, left: d.position.left-app.position.width})
        })
        game.macros.directory.renderPopout()
      }).dblclick(function(e){e.stopPropagation();});
      
      header.find('a.refresh').click(function(){
        d.render(true)
      }).dblclick(function(e){e.stopPropagation();});
      
      header.find('.window-title').dblclick(function(e){
        e.stopPropagation();
        if (game.user.id != user.id) return;
       game.settings.set('macro-grid', 'barMode', !game.settings.get('macro-grid', 'barMode'))
        d.render(true)
        
      });
      rendered = true;
    },
    close:()=>{
       Hooks.off('updateUser', updateUserHook)
       Hooks.off('renderHotbar', renderHotbarHook)
    }
  },{resizable:false, width: 'auto', height: 'auto', id})//, top: window.innerHeight-height-fromBottom,

  let updateUserHook = Hooks.on('updateUser', (updatedUser, updates)=>{
    if (updatedUser.id != userId) return;
    if (!foundry.utils.hasProperty(updates, "hotbar")) return;
    d.render()
  })
  
  let renderHotbarHook = Hooks.on('renderHotbar', ()=>{
    if (game.user.id != userId) return;
    d.render()
  })
  
  Hooks.once('renderDialog', (app, html)=>{
    console.log(window.innerHeight , parseInt(html[0].style.height) , fromBottom)
    app.setPosition({top: window.innerHeight - parseInt(html[0].style.height) - fromBottom})
  })
  
  d.render(true)
  return d;
  
}

window.listenForMacroEvents = async function(e) {
  if (e.data.type == "get") {
    Hooks.call('renderHotbar')
  }
  if (e.data.type == "execute") {
    Macro.get(e.data.id).execute()
  }
  if (e.data.type == "edit") {
    Macro.get(e.data.id).sheet.render(true)
  }
  if (e.data.type == "update") {
    let user = User.get(e.data.userId)
    user.update({hotbar: e.data.hotbar}, {diff: false, recursive: false, noHook: true})
  }
  if (e.data.type == "page") {
    ui.hotbar.changePage(e.data.page)
  }
  if (e.data.type == "new") {
    let user = User.get(e.data.userId)
    //let macro = 
      await Macro.create({name: "New Macro", type: "script"}).then(m=>m.sheet.render(true))
    //macro.sheet.render(true);
    await user.assignHotbarMacro(macro, e.data.slot)
  }
  
}

window.addEventListener("message", window.listenForMacroEvents, false)