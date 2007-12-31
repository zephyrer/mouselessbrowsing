/*
 * Mouseless Browsing 
 * Version 0.5
 * Created by Rudolf Noé
 * 30.12.2007
 */

(function(){
	//Imports
   var Prefs = rno_common.Prefs
   var MlbCommon = mouselessbrowsing.MlbCommon
   
	var MlbPrefs = {
		disableAllIds: null,
		idsForLinksEnabled: null,
		idsForImgLinksEnabled: null,
		idsForFormElementsEnabled: null,
		idsForFramesEnabled: null,
		showKeybufferInStatusbar: null,
		exclusiveUseOfNumpad: null,
		showIdsOnDemand: null,
		executeAutomaticEnabled: null,
		delayForAutoExecute: null,
		timeToClearKeybuffer: null,
		styleForIdSpan: null,
		styleForFrameIdSpan: null,
		pixelsToScroll: null,
		//
		visibilityMode: null,

		initPrefs: function (){
		    try{
				//Checking actual preference settings
				this.initShowIdPrefs();
				this.showIdsOnDemand = Prefs.getBoolPref("mouselessbrowsing.showIdsOnDemand");
		      this.showKeybufferInStatusbar = Prefs.getBoolPref("mouselessbrowsing.showKeybufferInStatusbar");
		      this.exclusiveUseOfNumpad = Prefs.getBoolPref("mouselessbrowsing.exclusiveNumpad");
		      this.executeAutomaticEnabled = Prefs.getBoolPref("mouselessbrowsing.executeAutomatic");
		      this.delayForAutoExecute = Prefs.getCharPref("mouselessbrowsing.autoExecuteDelay");
		      this.timeToClearKeybuffer = Prefs.getCharPref("mouselessbrowsing.autoExecuteDelay");
		      this.pixelsToScroll = Prefs.getCharPref("mouselessbrowsing.pixelsToScroll");
		      this.styleForIdSpan = Prefs.getCharPref("mouselessbrowsing.styleForIdSpan");
		      this.styleForFrameIdSpan = Prefs.getCharPref("mouselessbrowsing.styleForFrameIdSpan");
		      this.disableAllIds = Prefs.getBoolPref("mouselessbrowsing.disableAllIds");
				this.visibilityMode = this.disableAllIds==false?
				  MlbCommon.VisibilityModes.CONFIG:MlbCommon.VisibilityModes.NONE;
		      try{
		        	MLB_updateIdsAfterToggling();
		      }catch(e){}
		    }catch(e){
		    	 alert(e)
		    	 throw e
		    }
		},
		
		/*
		 * Sepearte function for reuse when toggling visibility of spans
		 */
		initShowIdPrefs: function (){
			this.idsForLinksEnabled = Prefs.getBoolPref("mouselessbrowsing.enableLinkIds");
		   this.idsForImgLinksEnabled = Prefs.getBoolPref("mouselessbrowsing.enableImgLinkIds");
		   this.idsForFormElementsEnabled = Prefs.getBoolPref("mouselessbrowsing.enableFormElementIds");
			this.idsForFramesEnabled = Prefs.getBoolPref("mouselessbrowsing.enableFrameIds");
		}
	
	} 
   var NS = rno_common.Namespace
   NS.bindToNamespace("mouselessbrowsing", "MlbPrefs", MlbPrefs)
})()
