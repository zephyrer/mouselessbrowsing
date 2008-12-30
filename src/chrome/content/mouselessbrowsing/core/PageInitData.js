with(mlb_common){
(function(){
   //Constants
   /*
    *Data Containter for holding all data needed for init process
    *@param currentWin: Current win-object for which init should take place
    *@param onpageshow2ndCall: Flag inidicating that this second cycle of initializing, the first is onDomContentLoaded
    *@param keepExsitingIds: Flag indicating that exisitng id spans should not be changed.
    */
   function PageInitData(currentWin, onpageshow2ndCall, installChangeListener, keepExistingIds, eventType){
      this.currentWin = currentWin;
      this.onpageshow2ndCall = onpageshow2ndCall
      this.installChangeListener = installChangeListener
      this.keepExistingIds = keepExistingIds
      this.eventType = eventType
      this.pageData = null
   }
   
   PageInitData.prototype = {
      addElementIdSpanBinding: function(element, idSpan){
         return this.pageData.addElementIdSpanBinding(element, idSpan)   
      },
      
      getCurrentWin: function(){
         return this.currentWin
      },

      setCurrentWin: function(win){
         this.currentWin = win
      },

      getCurrentTopWin: function(){
         return this.currentWin.top
      },
      
      getCurrentDoc: function(){
         return this.currentWin.document
      },
      
      getIdSpan: function(element){
         return this.pageData.getIdSpanByElement(element)
      },
      
      getInitCounter: function(){
         return this.pageData.getInitCounter()   
      },

      getKeepExistingIds: function(){
         return this.keepExistingIds
      },

      setKeepExistingIds: function(keepExistingIds){
         this.keepExistingIds = keepExistingIds
      },

      setPageData: function(pageData){
         this.pageData = pageData
      },
      
      isOnDomContentLoaded: function(){
         return this.eventType==this.EventTypes.DOM_CONTENT_LOADED
      },
      
      EventTypes: {
          DOM_CONTENT_LOADED: "DOMContentLoaded",
          ON_PAGE_SHOW:"onpageshow",
          TOGGLING_IDS:"togglinids"     
      }
   }
   
   Namespace.bindToNamespace("mouselessbrowsing", "PageInitData", PageInitData)
})()
}