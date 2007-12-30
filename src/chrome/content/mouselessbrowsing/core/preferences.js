/*
 * Mouseless Browsing 
 * Version 0.5
 * Created by Rudolf Noé
 * 30.12.2007
 */

(function(){
   var Prefs = rno_common.Prefs
	var MlbPrefs = {
		MLB_disableAllIds: null,
		MLB_idsForLinksEnabled: null,
		MLB_idsForImgLinksEnabled: null,
		MLB_idsForFormElementsEnabled: null,
		MLB_idsForFramesEnabled: null,
		MLB_showKeybufferInStatusbar: null,
		MLB_exclusiveUseOfNumpad: null,
		MLB_showIdsOnDemand: null,
		MLB_executeAutomaticEnabled: null,
		MLB_delayForAutoExecute: null,
		MLB_timeToClearKeybuffer: null,
		MLB_styleForIdSpan: null,
		MLB_styleForFrameIdSpan: null,
		MLB_pixelsToScroll: null,
		MLB_visibilityMode: null,

		initPrefs: function (){
		    try{
				//Checking actual preference settings
				MLB_ConfigManager.initShowIdPrefs();
				MLB_showIdsOnDemand = Prefs.getBoolPref("mouselessbrowsing.showIdsOnDemand");
		      MLB_showKeybufferInStatusbar = Prefs.getBoolPref("mouselessbrowsing.showKeybufferInStatusbar");
		      MLB_exclusiveUseOfNumpad = Prefs.getBoolPref("mouselessbrowsing.exclusiveNumpad");
		      MLB_executeAutomaticEnabled = Prefs.getBoolPref("mouselessbrowsing.executeAutomatic");
		      MLB_delayForAutoExecute = Prefs.getCharPref("mouselessbrowsing.autoExecuteDelay");
		      MLB_timeToClearKeybuffer = Prefs.getCharPref("mouselessbrowsing.autoExecuteDelay");
		      MLB_pixelsToScroll = Prefs.getCharPref("mouselessbrowsing.pixelsToScroll");
		      MLB_styleForIdSpan = Prefs.getCharPref("mouselessbrowsing.styleForIdSpan");
		      MLB_styleForFrameIdSpan = Prefs.getCharPref("mouselessbrowsing.styleForFrameIdSpan");
		      MLB_disableAllIds = Prefs.getBoolPref("mouselessbrowsing.disableAllIds");
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
			MLB_idsForLinksEnabled = Prefs.getBoolPref("mouselessbrowsing.enableLinkIds");
		   MLB_idsForImgLinksEnabled = Prefs.getBoolPref("mouselessbrowsing.enableImgLinkIds");
		   MLB_idsForFormElementsEnabled = Prefs.getBoolPref("mouselessbrowsing.enableFormElementIds");
			MLB_idsForFramesEnabled = Prefs.getBoolPref("mouselessbrowsing.enableFrameIds");
		}
	
	} 
   var NS = rno_common.Namespace
   NS.bindToNamespace("mouselessbrowsing", "MlbPrefs", MlbPrefs)
})()
