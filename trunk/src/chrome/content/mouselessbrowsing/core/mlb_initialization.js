/*
 * Mouseless Browsing 
 * Version 0.5
 * Created by Rudolf Noé
 * 30.12.2007
 */

(function(){
	
	var MlbCommon = mouselessbrowsing.MlbCommon
	var Prefs = rno_common.Prefs

	InitManager = {
		init: function (){
		    MLB_ConfigManager.initPrefs();
		    this.initShortCuts();
		    this.initRemaining();
		},
		
		
		initShortCuts: function (){
		    ShortCutManager.clearAllShortCutsForClientId(MlbCommon.SCM_CLIENT_ID);
		    this.allCombinedShortCutKeys = null;
		
		    var combinedKeyCode = Prefs.getCharPref("mouselessbrowsing.keys.toggleMLB");
		    ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode, "MLB_toggleIds()", MlbCommon.SCM_CLIENT_ID);
		    
			 combinedKeyCode = Prefs.getCharPref("mouselessbrowsing.keys.toggleAllIds");
		    ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode, "MLB_toggleAllIds()", MlbCommon.SCM_CLIENT_ID);
		    
		    combinedKeyCode = Prefs.getCharPref("mouselessbrowsing.keys.historyBack");
		    ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode, "MLB_moveHistory('back')", MlbCommon.SCM_CLIENT_ID);
		
		    combinedKeyCode = Prefs.getCharPref("mouselessbrowsing.keys.historyForward");
		    ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode, "MLB_moveHistory('forward')", MlbCommon.SCM_CLIENT_ID);
		    
		    combinedKeyCode = Prefs.getCharPref("mouselessbrowsing.keys.clearKeybuffer");
		    ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode, "MLB_resetVars()", MlbCommon.SCM_CLIENT_ID);
		    
		    combinedKeyCode = Prefs.getCharPref("mouselessbrowsing.keys.scrollDown");
		    ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode, "MLB_scrollUpDown('down')", MlbCommon.SCM_CLIENT_ID);
		    
		    combinedKeyCode = Prefs.getCharPref("mouselessbrowsing.keys.scrollUp");
		    ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode, "MLB_scrollUpDown('up')", MlbCommon.SCM_CLIENT_ID);
		    
		    combinedKeyCode = Prefs.getCharPref("mouselessbrowsing.keys.openInNewTabPostfixKey");
		    ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode, "MLB_openLinkInNewTabViaPostfixKey()", MlbCommon.SCM_CLIENT_ID);
		    
		    combinedKeyCode = Prefs.getCharPref("mouselessbrowsing.keys.selectLink");
		    ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode, "MLB_selectLink()", MlbCommon.SCM_CLIENT_ID);
		
		    //Toggling exclusive use with dobble stroke of numpad-key
		    ShortCutManager.addJsShortCutWithCombinedKeyCode(2304, "MLB_toggleExclusiveUseOfNumpad()", MlbCommon.SCM_CLIENT_ID);
		
		    combinedKeyCode = Prefs.getCharPref("mouselessbrowsing.keys.toggleExlusiveUseOfNumpad");
		    if(combinedKeyCode!=2304)
			    ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode, "MLB_exclusiveUseOfNumpad = !MLB_exclusiveUseOfNumpad;", MlbCommon.SCM_CLIENT_ID);
		
		},
		
		initRemaining: function(){
		    //Display keybuffer in statusbar?
		    var statusbarpanel = document.getElementById("mlb-status");
		    if(MLB_showKeybufferInStatusbar){
		        statusbarpanel.style.display="block";
		    }else{
		        statusbarpanel.style.display="none";
		    }
		}
	
	}
	
	var NS = rno_common.Namespace
	NS.bindToNamespace("mouselessbrowsing","InitManager", InitManager)

})()