/*
 * Mouseless Browsing 
 * Version 0.4.1
 * Created by Rudolf Noé
 * 01.07.2005
 *
 * Licence Statement
 * Version:  MPL 1.1
 *
 * The contents of this file are subject to the Mozilla Public License
 * Version 1.1  (the "License"); you may  not use this  file except in
 * compliance with the License.  You  may obtain a copy of the License
 * at http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See
 * the  License  for  the   specific  language  governing  rights  and
 * limitations under the License.
 */

  
/**************************************************
    Global functions
***************************************************/
/*
 * Init-Function
 */
MLB_InitManager = {
	init: function (){
	    MLB_ConfigManager.initPrefs();
	    MLB_InitManager.initShortCuts();
	    MLB_InitManager.initRemaining();
	},
	
	
	initShortCuts: function (){
		var prefs = Components.classes["@mozilla.org/preferences-service;1"].
	                getService(Components.interfaces.nsIPrefBranch);
	    ShortCutManager.clearAllShortCutsForClientId(MLB_SCM_CLIENT_ID);
	    MLB_InitManager.allCombinedShortCutKeys = null;
	
	    var combinedKeyCode = prefs.getCharPref("mouselessbrowsing.keys.toggleMLB");
	    ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode, "MLB_toggleIds()", MLB_SCM_CLIENT_ID);
	    if(MLB_InitManager.automaticCtrlShortCut(combinedKeyCode)){
	        ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode | ShortCutManager.CTRL, "MLB_toggleIds()", MLB_SCM_CLIENT_ID);
	    }
	    
		combinedKeyCode = prefs.getCharPref("mouselessbrowsing.keys.toggleAllIds");
	    ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode, "MLB_toggleAllIds()", MLB_SCM_CLIENT_ID);
	    if(MLB_InitManager.automaticCtrlShortCut(combinedKeyCode)){
	        ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode | ShortCutManager.CTRL, "MLB_toggleAllIds()", MLB_SCM_CLIENT_ID);
	    }
	    
	    combinedKeyCode = prefs.getCharPref("mouselessbrowsing.keys.historyBack");
	    ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode, "MLB_moveHistory('back')", MLB_SCM_CLIENT_ID);
	    if(MLB_InitManager.automaticCtrlShortCut(combinedKeyCode)){
	        ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode | ShortCutManager.CTRL, "MLB_moveHistory('back')", MLB_SCM_CLIENT_ID);
	    }
	
	    combinedKeyCode = prefs.getCharPref("mouselessbrowsing.keys.historyForward");
	    ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode, "MLB_moveHistory('forward')", MLB_SCM_CLIENT_ID);
	    if(MLB_InitManager.automaticCtrlShortCut(combinedKeyCode)){
	        ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode | ShortCutManager.CTRL, "MLB_moveHistory('forward')", MLB_SCM_CLIENT_ID);
	    }
	    
	    combinedKeyCode = prefs.getCharPref("mouselessbrowsing.keys.clearKeybuffer");
	    ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode, "MLB_resetVars()", MLB_SCM_CLIENT_ID);
	    
	    combinedKeyCode = prefs.getCharPref("mouselessbrowsing.keys.scrollDown");
	    ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode, "MLB_scrollUpDown('down')", MLB_SCM_CLIENT_ID);
	    
	    combinedKeyCode = prefs.getCharPref("mouselessbrowsing.keys.scrollUp");
	    ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode, "MLB_scrollUpDown('up')", MLB_SCM_CLIENT_ID);
	    
	    combinedKeyCode = prefs.getCharPref("mouselessbrowsing.keys.openInNewTabPostfixKey");
	    ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode, "MLB_openLinkInNewTabViaPostfixKey()", MLB_SCM_CLIENT_ID);
	    
	    combinedKeyCode = prefs.getCharPref("mouselessbrowsing.keys.selectLink");
	    ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode, "MLB_selectLink()", MLB_SCM_CLIENT_ID);
	
	    //Toggling exclusive use with dobble stroke of numpad-key
	    ShortCutManager.addJsShortCutWithCombinedKeyCode(2304, "MLB_toggleExclusiveUseOfNumpad()", MLB_SCM_CLIENT_ID);
	
	    combinedKeyCode = prefs.getCharPref("mouselessbrowsing.keys.toggleExlusiveUseOfNumpad");
	    if(combinedKeyCode!=2304)
		    ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode, "MLB_exclusiveUseOfNumpad = !MLB_exclusiveUseOfNumpad;", MLB_SCM_CLIENT_ID);
	
	},
	
	allCombinedShortCutKeys: null,
	
	automaticCtrlShortCut: 	function(combinedKeyCode){
		if(MLB_InitManager.hasShortCutModifier(combinedKeyCode))
			return false;
	
		if(MLB_InitManager.allCombinedShortCutKeys==null){
			MLB_InitManager.allCombinedShortCutKeys = new Object();
			var prefs = Components.classes["@mozilla.org/preferences-service;1"].
	                    getService(Components.interfaces.nsIPrefService);
			var branch = prefs.getBranch("mouselessbrowsing.keys.");
			var allKeys = branch.getChildList ( '', {});
			for(var i=0; i<allKeys.length; i++){
				var combinedPrefKeyCode = branch.getCharPref(allKeys[i]);
				MLB_InitManager.allCombinedShortCutKeys[combinedPrefKeyCode] = combinedPrefKeyCode;
			}
		}
		if(MLB_InitManager.allCombinedShortCutKeys[combinedKeyCode]!=null)
			return false;
	},
	
	hasShortCutModifier: function(combinedKeyCode){
		return (combinedKeyCode & 0xF) != 0;
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


