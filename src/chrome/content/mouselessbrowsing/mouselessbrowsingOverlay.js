/* 
  Mouseless Browsing 
  Version 0.4.4
  Created by Rudolf Noé
  30.12.2007
*/

//Add event for each window
window.addEventListener('load',  MLB_onInit, false);


/*
    Initilization for window
*/
function MLB_onInit() {
  
  //ShortcutManager must be initialized first, that it processes the
  //key-down-events first ;-)
  ShortCutManager.getInstance();
  
  //Add Main-Key Listener
  window.addEventListener("keydown", MLB_onkeydown, true);  
  
  //Add onload listener to each page
  var appcontent = document.getElementById("appcontent");   // browser
  if(appcontent){
	appcontent.addEventListener("pageshow", MLB_doOnload, true);
  }
  
  //Add preferences-observer
  var observerService = Components.classes["@mozilla.org/observer-service;1"].
    getService(Components.interfaces.nsIObserverService);
  observerService.addObserver(MLB_prefObserver, "MBL-PrefChange", true);
  
  //Init shortcuts and preferences
  MLB_init();
} 

MLB_prefObserver = {
    observe: function ( subject , topic , data ){
        MLB_init();
    },
	QueryInterface: function(iid) {
		if (!iid.equals(Components.interfaces.nsISupports)
				&& !iid.equals(Components.interfaces.nsISupportsWeakReference)
				&& !iid.equals(Components.interfaces.nsIObserver)) {
			dump("MBL Window Pref-Observer factory object: QI unknown interface: " + iid + "\n");
			throw Components.results.NS_ERROR_NO_INTERFACE; }
		return this;
	}
    
}
