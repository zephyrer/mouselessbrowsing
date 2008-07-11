/*
 * Mouseless Browsing 
 * Version 0.5
 * Created by Rudolf Noé
 * 30.12.2007
 */

(function(){
	
	var MlbCommon = mouselessbrowsing.MlbCommon
	var Prefs = rno_common.Prefs
	var MlbPrefs = mouselessbrowsing.MlbPrefs
	var Utils = rno_common.Utils
   
   //Prefs observer
   var MLB_prefObserver = null;
   
	InitManager = {
		init: function (){
		    this.registerAsObserver();
		    MlbPrefs.initPrefs();
		    this.initShortCuts();
		    this.initRemaining();
		},
		
		registerAsObserver: function(){
			//Add preferences-observer
	      MLB_prefObserver = Utils.createObserverForInterface(InitManager)
	      Utils.registerObserver(MlbCommon.MLB_PREF_OBSERVER, MLB_prefObserver)
		},
		
		initShortCuts: function (){
		    ShortCutManager.clearAllShortCutsForClientId(MlbCommon.SCM_CLIENT_ID);
		    this.allCombinedShortCutKeys = null;
		
		    var combinedKeyCode = Prefs.getCharPref("mouselessbrowsing.keys.toggleMLB");
		    ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode, "mouselessbrowsing.EventHandler.toggleIds()", MlbCommon.SCM_CLIENT_ID);
		    
			 combinedKeyCode = Prefs.getCharPref("mouselessbrowsing.keys.toggleAllIds");
		    ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode, "mouselessbrowsing.EventHandler.toggleAllIds()", MlbCommon.SCM_CLIENT_ID);
		    
		    combinedKeyCode = Prefs.getCharPref("mouselessbrowsing.keys.historyBack");
		    ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode, "mouselessbrowsing.EventHandler.moveHistory('back')", MlbCommon.SCM_CLIENT_ID);
		
		    combinedKeyCode = Prefs.getCharPref("mouselessbrowsing.keys.historyForward");
		    ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode, "mouselessbrowsing.EventHandler.moveHistory('forward')", MlbCommon.SCM_CLIENT_ID);
		    
		    combinedKeyCode = Prefs.getCharPref("mouselessbrowsing.keys.clearKeybuffer");
		    ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode, "mouselessbrowsing.EventHandler.resetVars()", MlbCommon.SCM_CLIENT_ID);
		    
		    combinedKeyCode = Prefs.getCharPref("mouselessbrowsing.keys.scrollDown");
		    ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode, "mouselessbrowsing.EventHandler.scrollUpDown('down')", MlbCommon.SCM_CLIENT_ID);
		    
		    combinedKeyCode = Prefs.getCharPref("mouselessbrowsing.keys.scrollUp");
		    ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode, "mouselessbrowsing.EventHandler.scrollUpDown('up')", MlbCommon.SCM_CLIENT_ID);
		    
		    combinedKeyCode = Prefs.getCharPref("mouselessbrowsing.keys.openInNewTabPostfixKey");
		    ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode, "mouselessbrowsing.EventHandler.openLinkInNewTabViaPostfixKey()", MlbCommon.SCM_CLIENT_ID);
		    
		    combinedKeyCode = Prefs.getCharPref("mouselessbrowsing.keys.selectLink");
		    ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode, "mouselessbrowsing.EventHandler.selectLink()", MlbCommon.SCM_CLIENT_ID);

		    combinedKeyCode = Prefs.getCharPref("mouselessbrowsing.keys.blurActiveElement");
		    ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode, "mouselessbrowsing.EventHandler.blurActiveElement()", MlbCommon.SCM_CLIENT_ID);
		    
		    combinedKeyCode = Prefs.getCharPref("mouselessbrowsing.keys.openConfig");
		    ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode, "mouselessbrowsing.EventHandler.openConfiguration()", MlbCommon.SCM_CLIENT_ID);

		    combinedKeyCode = Prefs.getCharPref("mouselessbrowsing.keys.addSiteRule");
		    ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode, "mouselessbrowsing.EventHandler.addSiteRule()", MlbCommon.SCM_CLIENT_ID);

		    //Toggling exclusive use with double stroke of numpad-key
		    ShortCutManager.addJsShortCutWithCombinedKeyCode(2304, "mouselessbrowsing.EventHandler.toggleExclusiveUseOfNumpad()", MlbCommon.SCM_CLIENT_ID);
		
		    combinedKeyCode = Prefs.getCharPref("mouselessbrowsing.keys.toggleExlusiveUseOfNumpad");
		    if(combinedKeyCode!=2304)
			    ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode, "mouselessbrowsing.EventHandler.exclusiveUseOfNumpad = !mouselessbrowsing.EventHandler.exclusiveUseOfNumpad;", MlbCommon.SCM_CLIENT_ID);
		
		},
		
		initRemaining: function(){
		    //Display keybuffer in statusbar?
		    var statusbarpanel = document.getElementById("mlb-status");
		    if(MlbPrefs.showKeybufferInStatusbar){
		        statusbarpanel.style.display="block";
		    }else{
		        statusbarpanel.style.display="none";
		    }
		    //Delete prototype span for updating css
		    if(mouselessbrowsing.PageInitializer){
	    	   mouselessbrowsing.PageInitializer.init()
		    }
		},
		
		observe: function(){
			this.init();
		}
	
	}
	
	var NS = rno_common.Namespace
	NS.bindToNamespace("mouselessbrowsing","InitManager", InitManager)

})()