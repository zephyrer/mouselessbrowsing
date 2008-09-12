/*
 * Mouseless Browsing 
 * Version 0.5
 * Created by Rudolf Noé
 * 30.12.2007
 */

(function(){
	//Imports
   var Prefs = mlb_common.Prefs
   var Utils = mlb_common.Utils
   var MlbCommon = mouselessbrowsing.MlbCommon
   var GlobalData = mouselessbrowsing.GlobalData
   
	function SiteRule (urlRegEx, visibilityMode, exclusiveUseOfNumpad, showIdsOnDemand){
		this.urlRegEx = urlRegEx
		this.visibilityMode = visibilityMode
		this.exclusiveUseOfNumpad = exclusiveUseOfNumpad
		this.showIdsOnDemand = showIdsOnDemand
	}
	
	var MlbPrefs = {
		DEBUG_PREF_ID: "mouselessbrowsing.debug",
		DEBUG_PERF_PREF_ID: "mouselessbrowsing.debug.perf",
		BLUR_ACTIVE_ELEMENT_KEY_PREF_ID: "mouselessbrowsing.keys.blurActiveElement",
		BLOCK_KEYBOARD_INDPUT_PREF_ID: "mouselessbrowsing.keys.blockKeyboardInputForMlb",
		showIdsOnDemand: null,
		enableCtrlPlusDigit: null,
		executeAutomaticEnabled: null,
		initOnDomContentLoaded: null,
		delayForAutoExecute: null,
		pixelsToScroll: null,
		maxIdNumber: null,
		idType: null,
		exclusiveUseOfNumpad: null,
		modifierForWritableElement: null,
		modifierForOpenInNewTab: null,
		modifierForOpenInNewWindow: null,
		modifierForOpenInCoolirisPreviews: null,
		idChars: null,
		disableAllIds: null,
		idsForLinksEnabled: null,
		idsForImgLinksEnabled: null,
		idsForFormElementsEnabled: null,
		idsForFramesEnabled: null,
		smartPositioning: null,
		showKeybufferInStatusbar: null,
		showMlbIconInStatusbar: null,
		showMlbMenu: null,
		siteRules: null,
		styleForIdSpan: null,
		styleForFrameIdSpan: null,
		//Not configurable via prefs dialog 
		debug: null,
		visibilityMode: null,
      
      //Backup of prefs in case of applying site rule
      prefsBackup: null,
      
		initPrefs: function (){
		    try{
				//Checking actual preference settings
				this.showIdsOnDemand = Prefs.getBoolPref("mouselessbrowsing.showIdsOnDemand");
		      this.exclusiveUseOfNumpad = Prefs.getBoolPref("mouselessbrowsing.exclusiveNumpad");
		      this.initOnDomContentLoaded = Prefs.getBoolPref("mouselessbrowsing.initOnDomContentLoaded");
				this.smartPositioning = Prefs.getBoolPref("mouselessbrowsing.smartPositioning");
		      this.showKeybufferInStatusbar = Prefs.getBoolPref("mouselessbrowsing.showKeybufferInStatusbar");
		      this.showMlbIconInStatusbar= Prefs.getBoolPref("mouselessbrowsing.showMlbIconInStatusbar");
		      this.showMlbMenu= Prefs.getBoolPref("mouselessbrowsing.showMlbMenu");
		      this.executeAutomaticEnabled = Prefs.getBoolPref("mouselessbrowsing.executeAutomatic");
		      this.delayForAutoExecute = Prefs.getCharPref("mouselessbrowsing.autoExecuteDelay");
		      this.pixelsToScroll = Prefs.getCharPref("mouselessbrowsing.pixelsToScroll");
		      this.maxIdNumber = Prefs.getCharPref("mouselessbrowsing.maxIdNumber");
		      this.idType = Prefs.getCharPref("mouselessbrowsing.idType");
      		this.modifierForWritableElement = Prefs.getCharPref("mouselessbrowsing.modifierForWritableElement");
      		this.modifierForOpenInNewTab = Prefs.getCharPref("mouselessbrowsing.modifierForOpenInNewTab");
      		this.modifierForOpenInNewWindow = Prefs.getCharPref("mouselessbrowsing.modifierForOpenInNewWindow");
      		this.modifierForOpenInCoolirisPreviews = Prefs.getCharPref("mouselessbrowsing.modifierForOpenInCoolirisPreviews");
		      if(this.isCharIdType()){
			      this.idChars = Prefs.getCharPref("mouselessbrowsing.idChars");
		      }else{
		      	this.idChars = "1234567890"
		      }
		      this.disableAllIds = Prefs.getBoolPref("mouselessbrowsing.disableAllIds");
		      if(!this.disableAllIds){
   				this.initShowIdPrefs(MlbCommon.VisibilityModes.CONFIG, false);
		      }
		      this.initSiteRules()
		      this.initStylePrefs()
		      this.initVisibilityMode()      
		      
		      this.prefsBackup = null;

		      //Init debug prefs
		      this.debug = Prefs.getBoolPref(this.DEBUG_PREF_ID) 
		      this.debugPerf = Prefs.getBoolPref(this.DEBUG_PERF_PREF_ID) 
		      
		    }catch(e){
		    	 alert(e)
		    	 throw e
		    }
		},
		
		initStylePrefs: function(){
			var importantExceptions = {"font-family":"", "margin-left":"", "max-width":""}
		   this.styleForIdSpan = this.addImportantToStyles(Prefs.getCharPref("mouselessbrowsing.styleForIdSpan"), importantExceptions);
		   //For Frame id spans all styles are set to !important 
		   this.styleForFrameIdSpan = this.addImportantToStyles(Prefs.getCharPref("mouselessbrowsing.styleForFrameIdSpan"), {});
		},
		
		/*
		 * Adds !important to styles as styles should not be overruled by page styles
		 */
		addImportantToStyles: function(styleString, exceptions){
		    var styleEntries = styleString.split(";")
		    var newStyleArray = new Array()
		    var styleKeyRegEx = /(\s|:)/
		    for (var i = 0; i < styleEntries.length; i++) {
		       var styleEntry = styleEntries[i]
		       //remove spaces and "\n" at beginning
		       styleEntry = styleEntry.replace(/^[\\n\s]*/,"")
		       if(styleEntry.length==0){
		       	continue
		       }
		       var styleKey = styleEntry.substring(0, styleEntry.search(/[\s:]/))
		       if(styleEntry.indexOf("!important")==-1 && exceptions[styleKey]==null){
		       	styleEntry +=" !important"
		       }
		       newStyleArray.push(styleEntry)
		    }
		    return newStyleArray.join(";")
		},
		
		initVisibilityMode: function(){
			this.visibilityMode = this.disableAllIds==false?
			  MlbCommon.VisibilityModes.CONFIG:MlbCommon.VisibilityModes.NONE;
		},
		
		/*
		 * Seperate function for reuse when toggling visibility of spans
		 */
		initShowIdPrefs: function (visibilityMode, makeDisableAllFlagPersistent){
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
				   this.idsForImgLinksEnabled = true
				   this.idsForFormElementsEnabled = true
					this.idsForFramesEnabled = true
					break;
			}
			if(makeDisableAllFlagPersistent){
			   // Make flag for all ids persistent	
		      Prefs.setBoolPref("mouselessbrowsing.disableAllIds", this.disableAllIds);
			}
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
         var url = win.top.location.href
         for(var i=0; i<this.siteRules.length; i++) {
            var siteRule = this.siteRules[i]
            if(siteRule.urlRegEx.test(url)){
               if(this.prefsBackup==null){
                  this.prefsBackup = new SiteRule(null, this.visibilityMode, this.exclusiveUseOfNumpad, this.showIdsOnDemand)
               }
            	this.initShowIdPrefs(siteRule.visibilityMode, false)
            	this.exclusiveUseOfNumpad = siteRule.exclusiveUseOfNumpad 
            	this.showIdsOnDemand = siteRule.showIdsOnDemand
            	break; 
            }else if(this.prefsBackup!=null){
            	//reset prefs
            	this.initShowIdPrefs(this.prefsBackup.visibilityMode, false)
            	this.exclusiveUseOfNumpad = this.prefsBackup.exclusiveUseOfNumpad 
            	this.showIdsOnDemand = this.prefsBackup.showIdsOnDemand
            	this.prefsBackup = null
            }         
         }
         this.initVisibilityMode()
      },
      
      toggleExclusiveUseOfNumpad: function(){
      	this.exclusiveUseOfNumpad = !this.exclusiveUseOfNumpad
      	return ShortCutManager.SUPPRESS_KEY
      },
      
      isNumericIdType: function(){
      	return this.idType==MlbCommon.IdTypes.NUMERIC
      },
      
      isCharIdType: function(){
      	return this.idType==MlbCommon.IdTypes.CHAR
      },
      
      isIdsForLinksEnabled: function(){
      	return !this.disableAllIds && this.idsForLinksEnabled
      },
      
      isIdsForImgLinksEnabled: function(){
      	return !this.disableAllIds && this.idsForImgLinksEnabled
      },
      
      isIdsForFormElementsEnabled: function(){
      	return !this.disableAllIds && this.idsForFormElementsEnabled
      },
      
      isIdsForFramesEnabled: function(){
      	return !this.disableAllIds && this.idsForFramesEnabled
      },
      
      setShowMlbMenuFlag: function(show){
      	this.showMlbMenu=show
         Prefs.setBoolPref("mouselessbrowsing.showMlbMenu", show)	
      },
      
      setShowMlbStatusbarFlag: function(show){
         this.showMlbIconInStatusbar=show
         Prefs.setBoolPref("mouselessbrowsing.showMlbIconInStatusbar", show)
         this.showKeybufferInStatusbar=show
         Prefs.setBoolPref("mouselessbrowsing.showKeybufferInStatusbar", show) 
      },
      
      isEscKey: function(prefKey){
      	return Prefs.getCharPref(prefKey)==27<<4
      }

	} 
   var NS = mlb_common.Namespace
   NS.bindToNamespace("mouselessbrowsing", "MlbPrefs", MlbPrefs)
})()
