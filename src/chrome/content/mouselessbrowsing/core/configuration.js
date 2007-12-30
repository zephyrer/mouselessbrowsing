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
    Global variables
***************************************************/
//Current Version
MLB_currentVersion = "0.5";

//Global Preferences Variables
var MLB_disableAllIds
var MLB_idsForLinksEnabled
var MLB_idsForImgLinksEnabled
var MLB_idsForFormElementsEnabled
var MLB_idsForFramesEnabled
var MLB_showKeybufferInStatusbar
var MLB_exclusiveUseOfNumpad
var MLB_showIdsOnDemand
var MLB_executeAutomaticEnabled
var MLB_delayForAutoExecute
var MLB_timeToClearKeybuffer
var MLB_styleForIdSpan
var MLB_styleForFrameIdSpan
var MLB_pixelsToScroll
var MLB_visibilityMode

var MLB_ConfigManager = {
	initPrefs: function (){
	    try{
	        //Checking actual preference settings
	        var prefs = Components.classes["@mozilla.org/preferences-service;1"].
	                getService(Components.interfaces.nsIPrefBranch);
	
	        //Update on new Version 
	        //included since 0.4
	        var oldVersion = "0";
	        var prefKeyVersion = "mouselessbrowsing.version";
	        if(prefs.prefHasUserValue(prefKeyVersion)){
	        	oldVersion = prefs.getCharPref(prefKeyVersion);
	        }
	        if (oldVersion<MLB_currentVersion){
	           	//Something else to do?
	           	prefs.setCharPref(prefKeyVersion, MLB_currentVersion);
	        }
	        
			MLB_ConfigManager.initShowIdPrefs();
			MLB_showIdsOnDemand = prefs.getBoolPref("mouselessbrowsing.showIdsOnDemand");
	        MLB_showKeybufferInStatusbar = prefs.getBoolPref("mouselessbrowsing.showKeybufferInStatusbar");
	        MLB_exclusiveUseOfNumpad = prefs.getBoolPref("mouselessbrowsing.exclusiveNumpad");
	        MLB_executeAutomaticEnabled = prefs.getBoolPref("mouselessbrowsing.executeAutomatic");
	        MLB_delayForAutoExecute = prefs.getCharPref("mouselessbrowsing.autoExecuteDelay");
	        MLB_timeToClearKeybuffer = prefs.getCharPref("mouselessbrowsing.autoExecuteDelay");
	        MLB_pixelsToScroll = prefs.getCharPref("mouselessbrowsing.pixelsToScroll");
	        MLB_styleForIdSpan = prefs.getCharPref("mouselessbrowsing.styleForIdSpan");
	        MLB_styleForFrameIdSpan = prefs.getCharPref("mouselessbrowsing.styleForFrameIdSpan");
	        MLB_disableAllIds = prefs.getBoolPref("mouselessbrowsing.disableAllIds");
	        MLB_visibilityMode = MLB_disableAllIds==false?"config":"none";
	        try{
	        	MLB_updateIdsAfterToggling();
	        }catch(e){}
	    }catch(e){alert(e)}
	},
	
	/*
	 * Sepearte function for reuse when toggling visibility of spans
	 */
	initShowIdPrefs: function (){
	    var prefs = Components.classes["@mozilla.org/preferences-service;1"].
	         getService(Components.interfaces.nsIPrefBranch);
		MLB_idsForLinksEnabled = prefs.getBoolPref("mouselessbrowsing.enableLinkIds");
	    MLB_idsForImgLinksEnabled = prefs.getBoolPref("mouselessbrowsing.enableImgLinkIds");
	    MLB_idsForFormElementsEnabled = prefs.getBoolPref("mouselessbrowsing.enableFormElementIds");
		MLB_idsForFramesEnabled = prefs.getBoolPref("mouselessbrowsing.enableFrameIds");
	}
}