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
   var Utils = rno_common.Utils
   var GlobalData = mouselessbrowsing.GlobalData
   
	function SiteRule (urlRegEx, visibilityMode, exclusiveUseOfNumpad, showIdsOnDemand){
		this.urlRegEx = urlRegEx
		this.visibilityMode = visibilityMode
		this.exclusiveUseOfNumpad = exclusiveUseOfNumpad
		this.showIdsOnDemand = showIdsOnDemand
	}
	
	var MlbPrefs = {
		showIdsOnDemand: null,
		exclusiveUseOfNumpad: null,
		smartPositioning: null,
		showTabIds: null,
		showKeybufferInStatusbar: null,
		executeAutomaticEnabled: null,
		delayForAutoExecute: null,
		pixelsToScroll: null,
		maxIdNumber: null,
		useSelfDefinedCharsForIds: null,
		idChars: null,
		disableAllIds: null,
		idsForLinksEnabled: null,
		idsForImgLinksEnabled: null,
		idsForFormElementsEnabled: null,
		idsForFramesEnabled: null,
		siteRules: null,
		styleForIdSpan: null,
		styleForFrameIdSpan: null,
		//Not configurable via prefs dialog 
		debugPerf: null,
		initOnDomContentLoaded: false,
		visibilityMode: null,
      
      //Backup of prefs in case of applying site rule
      prefsBackup: null,
      
		initPrefs: function (){
		    try{
				//Checking actual preference settings
				this.showIdsOnDemand = Prefs.getBoolPref("mouselessbrowsing.showIdsOnDemand");
		      this.exclusiveUseOfNumpad = Prefs.getBoolPref("mouselessbrowsing.exclusiveNumpad");
				this.smartPositioning = Prefs.getBoolPref("mouselessbrowsing.smartPositioning");
	      	this.initOnDomContentLoaded= Prefs.getBoolPref("mouselessbrowsing.initOnDomContentLoaded") 
		      this.showTabIds = Prefs.getBoolPref("mouselessbrowsing.showTabIds");
		      this.showKeybufferInStatusbar = Prefs.getBoolPref("mouselessbrowsing.showKeybufferInStatusbar");
		      this.executeAutomaticEnabled = Prefs.getBoolPref("mouselessbrowsing.executeAutomatic");
		      this.delayForAutoExecute = Prefs.getCharPref("mouselessbrowsing.autoExecuteDelay");
		      this.pixelsToScroll = Prefs.getCharPref("mouselessbrowsing.pixelsToScroll");
		      this.maxIdNumber = Prefs.getCharPref("mouselessbrowsing.maxIdNumber");
		      this.useSelfDefinedCharsForIds = Prefs.getBoolPref("mouselessbrowsing.useSelfDefinedCharsForIds");
		      if(this.useSelfDefinedCharsForIds){
			      this.idChars = Prefs.getCharPref("mouselessbrowsing.idChars");
		      }else{
		      	this.idChars = "1234567890"
		      }
		      this.disableAllIds = Prefs.getBoolPref("mouselessbrowsing.disableAllIds");
				this.initShowIdPrefs(MlbCommon.VisibilityModes.CONFIG);
		      this.initSiteRules();
		      this.styleForIdSpan = Prefs.getCharPref("mouselessbrowsing.styleForIdSpan");
		      this.styleForFrameIdSpan = Prefs.getCharPref("mouselessbrowsing.styleForFrameIdSpan");
		      this.initVisibilityMode()      
		      
		      this.prefsBackup = null;

		      //Init optional Prefs
		      if(Prefs.hasUserPref("mouselessbrowsing.debugPerf")){
		      	this.debugPerf = Prefs.getBoolPref("mouselessbrowsing.debugPerf") 
		      }
		      
		    }catch(e){
		    	 alert(e)
		    	 throw e
		    }
		},
		
		initVisibilityMode: function(){
			this.visibilityMode = this.disableAllIds==false?
			  MlbCommon.VisibilityModes.CONFIG:MlbCommon.VisibilityModes.NONE;
		},
		
		/*
		 * Seperate function for reuse when toggling visibility of spans
		 */
		initShowIdPrefs: function (visibilityMode){
			this.visibilityMode = visibilityMode
			switch (this.visibilityMode) {
				case MlbCommon.VisibilityModes.NONE:
					this.disableAllIds = true
					break;
				case MlbCommon.VisibilityModes.CONFIG:
					this.disableAllIds = false
					this.idsForLinksEnabled = Prefs.getBoolPref("mouselessbrowsing.enableLinkIds");
				   this.idsForImgLinksEnabled = Prefs.getBoolPref("mouselessbrowsing.enableImgLinkIds");
				   this.idsForFormElementsEnabled = Prefs.getBoolPref("mouselessbrowsing.enableFormElementIds");
					this.idsForFramesEnabled = Prefs.getBoolPref("mouselessbrowsing.enableFrameIds");
					break;
				case MlbCommon.VisibilityModes.ALL:
					this.disableAllIds = false
					this.idsForLinksEnabled = true
				   this.idsForImgLinsEnabled = true
				   this.idsForFormElementsEnabled = true
					this.idsForFramesEnabled = true
					break;
			}
			//Make flag for all ids persistent	
		   Prefs.setBoolPref("mouselessbrowsing.disableAllIds", this.disableAllIds);
		},
		
		initSiteRules: function(){
			this.siteRules = new Array()
			if(!Prefs.hasUserPref('mouselessbrowsing.siteRules')){
				return
			}
         var siteRulesArray = Prefs.getPrefsForListbox('mouselessbrowsing.siteRules')
         for(var i=0; i<siteRulesArray.length; i++) {
         	var urlRegEx = Utils.convert2RegExp(siteRulesArray[i][0])
         	var visibilityMode = siteRulesArray[i][1]
         	//Following values are stored as strings
         	var exclusiveUseOfNumpad = (siteRulesArray[i][2]=='true')
         	var showIdsOnDemand = (siteRulesArray[i][3]=='true')
         	this.siteRules.push(new SiteRule(urlRegEx, visibilityMode, exclusiveUseOfNumpad, showIdsOnDemand))
         }
		},
		
		applySiteRules: function(win){
         if(win.top!=win){
            return
         }
         var url = win.location.href
         for(var i=0; i<this.siteRules.length; i++) {
            var siteRule = this.siteRules[i]
            if(siteRule.urlRegEx.test(url)){
               if(this.prefsBackup==null){
                  this.prefsBackup = new SiteRule(null, this.visibilityMode, this.exclusiveUseOfNumpad, this.showIdsOnDemand)
               }
            	this.initShowIdPrefs(siteRule.visibilityMode)
            	this.exclusiveUseOfNumpad = siteRule.exclusiveUseOfNumpad 
            	this.showIdsOnDemand = siteRule.showIdsOnDemand
            	break; 
            }else if(this.prefsBackup!=null){
            	//reset prefs
            	this.initShowIdPrefs(this.prefsBackup.visibilityMode)
            	this.exclusiveUseOfNumpad = this.prefsBackup.exclusiveUseOfNumpad 
            	this.showIdsOnDemand = this.prefsBackup.showIdsOnDemand
            	this.prefsBackup = null
            }         
         }
         this.initVisibilityMode()
      },
		
	} 
   var NS = rno_common.Namespace
   NS.bindToNamespace("mouselessbrowsing", "MlbPrefs", MlbPrefs)
})()
