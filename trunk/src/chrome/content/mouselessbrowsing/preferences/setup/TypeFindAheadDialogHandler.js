with(mlb_common){
with(mouselessbrowsing){
(function(){
   
   TypeFindAheadSetupDialogHandler = {
      
      doCancel: function(){
         //do nothing
      },
      
      doOK: function(){
         Prefs.savePrefs(document)
      },

      doOnload: function(){
         Prefs.loadPrefs(document);
      }
      
   }
   
   Namespace.bindToNamespace("mouselessbrowsing", "TypeFindAheadSetupDialogHandler", TypeFindAheadSetupDialogHandler)
})()
}}