/*
 * Mouseless Browsing 
 * Version 0.5
 * Created by Rudolf Noé
 * 30.12.2007
 */

(function(){
	
	var MlbCommon = mouselessbrowsing.MlbCommon
	var Prefs = mlb_common.Prefs
	var MlbPrefs = mouselessbrowsing.MlbPrefs
	var Utils = mlb_common.Utils
	var KeyInputbox = mlb_common.KeyInputbox
	var VersionManager = mouselessbrowsing.VersionManager
	var PageInitializer = mouselessbrowsing.PageInitializer
	var STRINGBUNDLE_ID = "mouselessbrowsingOverlaySB"
   
   //Prefs observer
   var MLB_prefObserver = null;
   
	InitManager = {
		init: function (){
		    if(VersionManager.hasVersionToBeMigrated()){
		    	VersionManager.migrateVersion()
		    }
		    this.registerAsObserver();
		    MlbPrefs.initPrefs();
		    this.initShortCuts();
		    this.initMenu();
		    this.initStatusbar();
          if(mouselessbrowsing.PageInitializer){
            mouselessbrowsing.PageInitializer.init()
          }
		},
		
		registerAsObserver: function(){
			//Add preferences-observer
	      MLB_prefObserver = Utils.createObserverForInterface(InitManager)
	      Utils.registerObserver(MlbCommon.MLB_PREF_OBSERVER, MLB_prefObserver)
	      Utils.observeObject(MlbPrefs, "exclusiveUseOfNumpad", "mouselessbrowsing.InitManager.initStatusbar()")
		},
		
		initShortCuts: function (){
		    ShortCutManager.clearAllShortCutsForClientId(MlbCommon.SCM_CLIENT_ID);
		    this.allCombinedShortCutKeys = null;
		
		    //Shortcut for Enter
		    ShortCutManager.addJsShortCutWithCombinedKeyCode(208, "mouselessbrowsing.EventHandler.handleEnter()", MlbCommon.SCM_CLIENT_ID);
		    
          this.setShortcut("mouselessbrowsing.keys.openInNewTabPostfixKey", "mouselessbrowsing.EventHandler.openLinkInOtherLocationViaPostfixKey(event, mouselessbrowsing.MlbCommon.OpenLinkLocations.TAB)");

          this.setShortcut("mouselessbrowsing.keys.openInNewWindowPostfixKey", "mouselessbrowsing.EventHandler.openLinkInOtherLocationViaPostfixKey(event, mouselessbrowsing.MlbCommon.OpenLinkLocations.WINDOW)");

          this.setShortcut("mouselessbrowsing.keys.openInCoolirisPreviewsPostfixKey", "mouselessbrowsing.EventHandler.openLinkInOtherLocationViaPostfixKey(event, mouselessbrowsing.MlbCommon.OpenLinkLocations.COOLIRIS_PREVIEW)");

		    this.setShortcut("mouselessbrowsing.keys.toggleMLB", "mouselessbrowsing.EventHandler.toggleIds()");
		    
			 this.setShortcut("mouselessbrowsing.keys.toggleAllIds", "mouselessbrowsing.EventHandler.toggleAllIds()");
		    
		    this.setShortcut("mouselessbrowsing.keys.historyBack", "mouselessbrowsing.EventHandler.moveHistory('back')");
		
		    this.setShortcut("mouselessbrowsing.keys.historyForward", "mouselessbrowsing.EventHandler.moveHistory('forward')");
		    
		    this.setShortcut("mouselessbrowsing.keys.clearKeybuffer", "mouselessbrowsing.EventHandler.resetVars()");
		    
		    this.setShortcut("mouselessbrowsing.keys.scrollDown", "mouselessbrowsing.EventHandler.scrollUpDown('down')");
		    
		    this.setShortcut("mouselessbrowsing.keys.scrollUp", "mouselessbrowsing.EventHandler.scrollUpDown('up')");
		    
		    this.setShortcut("mouselessbrowsing.keys.selectLink", "mouselessbrowsing.EventHandler.selectLink()");

		    this.setShortcut(MlbPrefs.BLOCK_KEYBOARD_INDPUT_PREF_ID, "mouselessbrowsing.EventHandler.toggleBlockKeyboardInputForMLB()");

		    this.setShortcut(MlbPrefs.BLUR_ACTIVE_ELEMENT_KEY_PREF_ID, "mouselessbrowsing.EventHandler.blurActiveElement()");
		    
		    this.setShortcut("mouselessbrowsing.keys.openConfig", "mouselessbrowsing.EventHandler.openConfiguration()");
		    var combinedKeyCode = Prefs.getCharPref("mouselessbrowsing.keys.openConfig");
			 var openConfigBC = document.getElementById("mlb_openConfig_bc");
			 openConfigBC.setAttribute('acceltext', KeyInputbox.getStringForCombinedKeyCode(combinedKeyCode))

		    this.setShortcut("mouselessbrowsing.keys.addSiteRule", "mouselessbrowsing.EventHandler.addSiteRule()");
		    combinedKeyCode = Prefs.getCharPref("mouselessbrowsing.keys.addSiteRule");
			 var addUrlRuleBC = document.getElementById("mlb_addUrlRule_bc");
			 addUrlRuleBC.setAttribute('acceltext', KeyInputbox.getStringForCombinedKeyCode(combinedKeyCode))

		    //Toggling exclusive use with double stroke of numpad-key
		    ShortCutManager.addJsShortCutWithCombinedKeyCode(2304, "mouselessbrowsing.EventHandler.toggleExclusiveUseOfNumpad();", MlbCommon.SCM_CLIENT_ID);
		
		    combinedKeyCode = Prefs.getCharPref("mouselessbrowsing.keys.toggleExlusiveUseOfNumpad");
		    if(combinedKeyCode!="2304" && combinedKeyCode!="0")
			    ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode, "mouselessbrowsing.MlbPrefs.toggleExclusiveUseOfNumpad();", MlbCommon.SCM_CLIENT_ID);
		
		},
		
		setShortcut: function(prefsKey, jsCode){
			var combinedKeyCode = Prefs.getCharPref(prefsKey);
			if(combinedKeyCode!="0"){
				ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode, jsCode, MlbCommon.SCM_CLIENT_ID);
			}
		},
		
		initMenu: function(){
		   //Display menu?
			var mlbMenu = document.getElementById("mlb_tools_menu");
			if(MlbPrefs.showMlbMenu){
				mlbMenu.style.display="block"
			}else{
				mlbMenu.style.display="none"
			}
		},
		
		initStatusbar:function(){
         //Display keybuffer in statusbar?
          var statusPanel = document.getElementById("mlb-status-panel");
          if(MlbPrefs.showMlbIconInStatusbar || MlbPrefs.showKeybufferInStatusbar){
              statusPanel.style.display="block";
          }else{
              statusPanel.style.display="none";
          }
          var statusIcon = document.getElementById("mlb-status-image");
          if(MlbPrefs.showMlbIconInStatusbar){
              statusIcon.style.display="block";
          }else{
              statusIcon.style.display="none";
          }
          var exlNumpadIcon = document.getElementById("mlb-status-exl-numpad-image");
          if(MlbPrefs.exclusiveUseOfNumpad && MlbPrefs.showMlbIconInStatusbar && !MlbPrefs.isCharIdType()){
              exlNumpadIcon.style.display="block";
          }else{
              exlNumpadIcon.style.display="none";
          }
          var statusLabel = document.getElementById("mlb-status");
          if(MlbPrefs.showKeybufferInStatusbar){
              statusLabel.style.display="block";
          }else{
              statusLabel.style.display="none";
          }
          var tooltiptext = "Mouseless Browsing " + MlbCommon.MLB_VERSION
          if(MlbPrefs.exclusiveUseOfNumpad && !MlbPrefs.isCharIdType()){
          	tooltiptext += "\n\n" + Utils.getString(STRINGBUNDLE_ID, "exclusiveUseOfNumpadActive")
          }
          statusPanel.tooltipText = tooltiptext
		},
		
		observe: function(){
			this.init();
		}
	
	}
	
	var NS = mlb_common.Namespace
	NS.bindToNamespace("mouselessbrowsing","InitManager", InitManager)

})()