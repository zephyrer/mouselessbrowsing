with(mlb_common){
with(mouselessbrowsing){
(function(){
   const TAB_ID_REGEXP = /^\[\d{2,}\]\s{1}/
   const SHOW_TAB_ID_MS = 'mlb_showTabIdMS'
   const SHOW_TAB_ID_MI = 'mlb_showTabIdMI'
   
   
   function TabIdHandler(){
      this.showTabIdMIAdded = false
      this.showTabIdMI = null
      //Fetch label which is put on the tab for signaling it is loading
      try{
         this.loadingLabel = getBrowser().mStringBundle.getString("tabs.loading")
      }catch(e){
         Utils.logError(e)
      }
   }
   
   TabIdHandler.instance = null
   
   TabIdHandler.getInstance = function(){
      if(!this.instance)
         this.instance = new TabIdHandler()
      return this.instance
   }
   TabIdHandler.init = function(mlbActive){
      this.getInstance().init(mlbActive)
   }
   
   TabIdHandler.toggleTabIdVisibility = function(event){
      this.getInstance().toggleTabIdVisibility(event)
   }

   TabIdHandler.prototype = {
      init: function(mlbActive){
         if(mlbActive && MlbPrefs.enableTabIds)
            this.displayShowTabIdMI()
         else
            this.hideShowTabIdMI()

         if(mlbActive && MlbPrefs.showTabIds)
            this.enableTabIds()
         else
            this.disableTabIds()
      },
      
      disableTabIds: function(){
         this.addOrRemoveEventListeners("remove")
         this.removeTabIds()
         if(this.showTabIdMI)
            this.showTabIdMI.removeAttribute('checked')
       },
      
      displayShowTabIdMI: function(){
         if(!this.showTabIdMIAdded){
            var tabContextMenu = document.getAnonymousElementByAttribute(gBrowser, "anonid", "tabContextMenu")
            var separator = document.createElement("menuseparator")
            separator.setAttribute('anonid', SHOW_TAB_ID_MS)
            tabContextMenu.appendChild(separator)
            this.showTabIdMI = tabContextMenu.appendChild(DomUtils.removeElement(byId(SHOW_TAB_ID_MI)))
            this.showTabIdMIAdded = true
         }
         this.setCollapsedOnShowTabIdMI(false)
      },
      
      enableTabIds: function(){
         this.initTabs()
         this.addOrRemoveEventListeners("add")
         this.showTabIdMI.setAttribute('checked', 'true')
      },
      
      handleDOMAttrModified: function(event){
         var tagName = event.originalTarget.tagName.toLowerCase()
         //Do nothing if
         if(event.attrName!="label" || // not a label attr. is changed
            TAB_ID_REGEXP.test(event.newValue) || // the tab already has an id 
            event.newValue == this.loadingLabel || // the value to be set is "Loading..." as there are depending conditions in the tabbrowser.xml 
            (tagName!="tab" && tagName!="xul:tab")) //target is tab element
            return
         var tab = event.originalTarget
         this.setTabId(tab, tab._tPos+1)
      },
      
      handleTabClose: function(event){
         //must be executed delayed as it won't work otherwise
         Utils.executeDelayed("MLB_TAB_CLOSE", 0, this.initTabs, this)
      },

      handleTabOpen: function(event){
         this.initTabs()
      },
      
      handleTabMove: function(event){
         this.initTabs()
      },
      
      hideShowTabIdMI: function(){
         if(!this.showTabIdMIAdded)
            return
         else
            this.setCollapsedOnShowTabIdMI(true)
         
      },
      
      addOrRemoveEventListeners: function(addOrRemove){
         var functionName = addOrRemove + "EventListener"
         var tabContainer = getBrowser()
         tabContainer[functionName]("TabOpen", this, false)
         tabContainer[functionName]("TabClose", this, false)
         tabContainer[functionName]("TabMove", this, false)
         tabContainer[functionName]("DOMAttrModified", this, true)
      },
      
      initTabs: function(){
         var tabs = getBrowser().mTabs
         for (var i = 0; i < tabs.length; i++) {
            this.setTabId(tabs[i], i+1)
         }
      },
      
      removeTabIds: function(){
         var tabs = getBrowser().mTabs
         for (var i = 0; i < tabs.length; i++) {
            var tab = tabs[i]
            tab.setAttribute('label', tab.getAttribute('label').replace(TAB_ID_REGEXP, ""))
         }
      },
      
      setTabId: function(tab, newId){
         var label = tab.getAttribute('label') 
         if(TAB_ID_REGEXP.test(label)){
            label = label.replace(TAB_ID_REGEXP, "")
         }
         label = "[0" + newId + "] " + label
         tab.setAttribute('label', label)
      },
      
      setCollapsedOnShowTabIdMI: function(collapsed){
         document.getAnonymousElementByAttribute(gBrowser, "anonid", SHOW_TAB_ID_MI).collapsed = collapsed
         document.getAnonymousElementByAttribute(gBrowser, "anonid", SHOW_TAB_ID_MS).collapsed = collapsed
      },
      
      toggleTabIdVisibility: function(){
         var showTabIds = this.showTabIdMI.hasAttribute('checked') 
         if(showTabIds)
            this.enableTabIds()
         else
            this.disableTabIds()
         MlbPrefs.setShowTabIdFlag(showTabIds)
      }
   }
   
   ObjectUtils.extend(TabIdHandler, AbstractGenericEventHandler)
   
   Namespace.bindToNamespace("mouselessbrowsing", "TabIdHandler", TabIdHandler)
   
   function byId(id){
      return document.getElementById(id)
   }
   
})()
}}