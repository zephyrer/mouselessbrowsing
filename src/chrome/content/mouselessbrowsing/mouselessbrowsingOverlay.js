/* 


  Mouseless Browsing 
  Version 0.4.1
  Created by Rudolf Noé
  01.07.2005
    
*/
(function(){

var MlbCommon = mouselessbrowsing.MlbCommon
var Utils = rno_common.Utils

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
	appcontent.addEventListener("pageshow", MLB_doOnload, true);
  }
  
  //Add preferences-observer
  MLB_prefObserver = Utils.createObserver(mouselessbrowsing.InitManager.init)
  Utils.registerObserver(MlbCommon.MLB_PREF_OBSERVER, MLB_prefObserver)

  //window.getBrowser().addProgressListener(MLB_webProgressListener);

  //Init shortcuts and preferences
  mouselessbrowsing.InitManager.init();
} 

})()