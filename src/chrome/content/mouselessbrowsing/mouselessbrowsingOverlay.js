/* 


  Mouseless Browsing 
  Version 0.4.1
  Created by Rudolf Noé
  01.07.2005
    
*/

//Add event for each window
window.addEventListener('load',  MLB_initOnStartup, false);


/*
    Initilization for window
*/
function MLB_initOnStartup() {
  
  //ShortcutManager must be initialized first, that it processes the
  //key-down-events first ;-)
  //ToDo: Why that?
  ShortCutManager.getInstance();
  
  //Add Main-Key-Listener
  window.addEventListener("keydown", MLB_onkeydown, true);  
  
  //Add onload listener to each page
  var appcontent = document.getElementById("appcontent");   // browser
  if(appcontent){
  	//TODO
	//appcontent.addEventListener("pageshow", MLB_doOnload, true);
  }
  
  //Add preferences-observer
  var observerService = Components.classes["@mozilla.org/observer-service;1"].
    getService(Components.interfaces.nsIObserverService);
  observerService.addObserver(MLB_prefObserver, "MBL-PrefChange", true);
  
  window.getBrowser().addProgressListener(MLB_webProgressListener);

  //Init shortcuts and preferences
  MLB_InitManager.init();
} 

MLB_prefObserver = {
    observe: function ( subject , topic , data ){
        MLB_InitManager.init();
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

