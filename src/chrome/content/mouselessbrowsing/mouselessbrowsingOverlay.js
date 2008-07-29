/*
 * Mouseless Browsing 
 * Version 0.5
 * Created by Rudolf Noé
 * 31.12.2007
*/
(function(){
   
   //Imports
	var Utils = rno_common.Utils
	var MlbCommon = mouselessbrowsing.MlbCommon
	var PageInitializer = mouselessbrowsing.PageInitializer
	var EventHandler = mouselessbrowsing.EventHandler
	
	//Add event for each window
	window.addEventListener('load',  MLB_initOnStartup, false);
	
	/*
	Initilization for main window
	*/
	function MLB_initOnStartup() {
		//ShortcutManager must be initialized first, that it processes the
		//key-down-events first ;-)
		//ToDo: Why that?
		ShortCutManager.getInstance();
		
		//Add Main-Key-Listener
		window.addEventListener("keypress", {handleEvent: function(event){EventHandler.onkeypress(event)}}, true);  
		window.addEventListener("keydown", {handleEvent: function(event){EventHandler.onkeydown(event)}}, true);  
		
		//Add pageshow listener to each page
		var appcontent = document.getElementById("appcontent");   // browser
		if(appcontent){
			appcontent.addEventListener("DOMContentLoaded", {handleEvent: function(event){PageInitializer.onDOMContentLoaded(event)}}, true);
			appcontent.addEventListener("pageshow", {handleEvent: function(event){PageInitializer.onPageShow(event)}}, true);
			//TODO Remove
//			appcontent.addEventListener("mousedown", showOffsets, true);
         //Todo
//			appcontent.addEventListener("pageshow", {handleEvent: function(event){EventHandler.renumberTab(event)}}, true);
		}
		
		//Focus Listener
		getBrowser().addEventListener("focus",{handleEvent: function(event){EventHandler.elementFocused(event)}},true);
      getBrowser().addEventListener("blur",{handleEvent: function(event){EventHandler.elementFocusLost(event)}},true);
		
		//Tab Listener
		//Todo
//		var activeWin = Application.activeWindow
//		activeWin.events.addListener("TabOpen", {handleEvent: function(event){EventHandler.numberTabs(event)}},true)
//		activeWin.events.addListener("TabClose", {handleEvent: function(event){EventHandler.numberTabs(event)}},true)
//		activeWin.events.addListener("TabMove", {handleEvent: function(event){EventHandler.numberTabs(event)}},true)
		
		//Init shortcuts and preferences
		mouselessbrowsing.InitManager.init();
	} 
	
	//Todo remove
	function showOffsets(event){
		if(event.ctrlKey && event.button==2){
		  var target = event.originalTarget
		  var offsetTop = mouselessbrowsing.MlbUtils.getOffsetTopToBody(target)
		  var offsetLeft = mouselessbrowsing.MlbUtils.getOffsetLeftToBody(target)
	     rno_common.Utils.logMessage("MLB: TagName: " + target.tagName + " OffsetLeft (Body): " + offsetLeft + " OffsetTop (Body): " + offsetTop)
	     event.stopPropagation()
	     event.preventDefault()
		}
	}

})()