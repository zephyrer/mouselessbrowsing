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
		showIdsOnDemand: null,
		exclusiveUseOfNumpad: null,
		smartPositioning: null,
		showKeybufferInStatusbar: null,
		executeAutomaticEnabled: null,
		delayForAutoExecute: null,
		pixelsToScroll: null,
		maxIdNumber: null,
		disableAllIds: null,
		idsForLinksEnabled: null,
		idsForImgLinksEnabled: null,
		idsForFormElementsEnabled: null,
		idsForFramesEnabled: null,
		styleForIdSpan: null,
		styleForFrameIdSpan: null,
		//No configured 
		debugPerf: null,
		visibilityMode: null,

		initPrefs: function (){
		    try{
				//Checking actual preference settings
				this.showIdsOnDemand = Prefs.getBoolPref("mouselessbrowsing.showIdsOnDemand");
		      this.exclusiveUseOfNumpad = Prefs.getBoolPref("mouselessbrowsing.exclusiveNumpad");
				this.smartPositioning = Prefs.getBoolPref("mouselessbrowsing.smartPositioning");
		      this.showKeybufferInStatusbar = Prefs.getBoolPref("mouselessbrowsing.showKeybufferInStatusbar");
		      this.executeAutomaticEnabled = Prefs.getBoolPref("mouselessbrowsing.executeAutomatic");
		      this.delayForAutoExecute = Prefs.getCharPref("mouselessbrowsing.autoExecuteDelay");
		      this.pixelsToScroll = Prefs.getCharPref("mouselessbrowsing.pixelsToScroll");
		      this.maxIdNumber = Prefs.getCharPref("mouselessbrowsing.maxIdNumber");
		      this.disableAllIds = Prefs.getBoolPref("mouselessbrowsing.disableAllIds");
				this.initShowIdPrefs();
		      this.styleForIdSpan = Prefs.getCharPref("mouselessbrowsing.styleForIdSpan");
		      this.styleForFrameIdSpan = Prefs.getCharPref("mouselessbrowsing.styleForFrameIdSpan");
				this.visibilityMode = this.disableAllIds==false?
				  MlbCommon.VisibilityModes.CONFIG:MlbCommon.VisibilityModes.NONE;
		      
		      //Init optional Prefs
		      if(Prefs.hasUserPref("mouselessbrowsing.debugPerf")){
		      	this.debugPerf = Prefs.getBoolPref("mouselessbrowsing.debugPerf") 
		      }
		      try{
		        	MLB_updateIdsAfterToggling();
		      }catch(e){}
		    }catch(e){
		    	 alert(e)
		    	 throw e
		    }
		},
		
		/*
		 * Seperate function for reuse when toggling visibility of spans
		 */
		initShowIdPrefs: function (){
			this.idsForLinksEnabled = Prefs.getBoolPref("mouselessbrowsing.enableLinkIds");
		   this.idsForImgLinksEnabled = Prefs.getBoolPref("mouselessbrowsing.enableImgLinkIds");
		   this.idsForFormElementsEnabled = Prefs.getBoolPref("mouselessbrowsing.enableFormElementIds");
			this.idsForFramesEnabled = Prefs.getBoolPref("mouselessbrowsing.enableFrameIds");
		},
		
		/*
		 * Sets all flags for displaying/hiding different ids to true/false 
		 */
      setVisibilityFlags: function(show){
	     this.idsForFormElementsEnabled = show;
        this.idsForImgLinksEnabled = show;
        this.idsForLinksEnabled = show;
        this.idsForFramesEnabled = show;
		}
	
	} 
   var NS = rno_common.Namespace
   NS.bindToNamespace("mouselessbrowsing", "MlbPrefs", MlbPrefs)
})()
