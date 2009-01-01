/*
 * Mouseless Browsing 
 * Version 0.5
 * Created by Rudolf Noé
 * 30.12.2007
 */

with(mlb_common){
with(mouselessbrowsing){
(function(){
	
	var STRINGBUNDLE_ID = "mouselessbrowsingOverlaySB"

   //Prefs observer
   var MLB_prefObserver = null;
   
   //EventHandler
   var mainKeyPressHandler = {handleEvent: function(event){EventHandler.onkeypress(event)}};
   var mainKeyDownHandler = {handleEvent: function(event){EventHandler.onkeydown(event)}}
   var mainDomContentLoadedHandler = {handleEvent: function(event){PageInitializer.onDOMContentLoaded(event)}}
   var mainPageShowHander = {handleEvent: function(event){PageInitializer.onPageShow(event)}}
   var googleProjectHelperHandler = {handleEvent: function(event){GoogleProjectHelper.onPageShow(event)}}
   var focusHandler = {handleEvent: function(event){EventHandler.onElementFocusEvent(event)}}
   var tabSelectHandler = {handleEvent: function(event){mouselessbrowsing.TabLocalPrefs.onTabSelect()}}
   
   
	var InitManager = {
		eventHandlersActive: false,
      scm: new ShortcutManager(window, "keydown"),
		
		init: function(event){
		   MlbPrefs.initPrefs();
         VersionManager.doMigration()
         if(MLB_prefObserver==null){
            this.registerObservers();
         }
         this.scm.clearAllShortcuts(MlbCommon.SCM_CLIENT_ID);
			if(MlbPrefs.disableMLB){
				this.disableMLB()
			}else{
				this.enableMLB()
			}
		   this.initStatusbar();
         if(Application.prefs.getValue("mouselessbrowsing.debug.layoutdebugger", false)){
            LayoutDebugger.init()
         }
		   MlbUtils.logDebugMessage("InitManager.init done")
		},
		
		enableMLB: function (){
		    this.initShortCuts();
		    if(!this.eventHandlersActive){
		       this.initEventHandlers("addEventListener");
		       this.eventHandlersActive = true
		    }
		    TabLocalPrefs.initPrefs()
		    this.initMenu();
          var showIdsOnDemand = Prefs.getBoolPref("mouselessbrowsing.showIdsOnDemand");
          var disableAllIds = Prefs.getBoolPref("mouselessbrowsing.disableAllIds");
          //Init the current page the others are only initialized on demand
          PageInitializer.init()

          //As only the current page will be entirely initialized for performance reasons
          //the visibility mode of the others must be adjusted 
          Firefox.iterateAllBrowsers(function(browser){
             if(browser==Firefox.getActiveBrowser())
               return
          	var contentWin = browser.contentWindow
          	var visibilityMode = TabLocalPrefs.getVisibilityMode(contentWin)
          	var idsVisible = PageInitializer.hasVisibleIdSpans(contentWin)  
            if(visibilityMode==MlbCommon.VisibilityModes.NONE && idsVisible){
          		EventHandler.hideIdSpans(contentWin)
          	}
          })
		},
		
		disableMLB: function(){
			//Remove event listener
			if(this.eventHandlersActive){
			   this.initEventHandlers("removeEventListener")
			   this.eventHandlersActive = false
			}
			//Add single shortcut for enabling MLB
			this.setShortcut("mouselessbrowsing.keys.toggleEnableDisableMLB", "mouselessbrowsing.InitManager.toggleEnableDisableMLB()");
		   PageInitializer.disableMlb()
			EventHandler.disableMlb()
		},
      
      getShortcutManager: function(){
         return this.scm
      },
		
		registerObservers: function(){
			//Add preferences-observer
	      MLB_prefObserver = Utils.createObserverForInterface(InitManager)
	      Utils.registerObserver(MlbCommon.MLB_PREF_OBSERVER, MLB_prefObserver)
	      Utils.observeObject(TabLocalPrefs, "observedPropExclusiveUseOfNumpad", this.initStatusbar, this)
		},
		
		initEventHandlers : function(addOrRemoveListenerFunction) {
			var tabbrowser = document.getElementById("content"); // tabbrowser
			//key event listener
			window[addOrRemoveListenerFunction]("keypress", mainKeyPressHandler, true);  
         window[addOrRemoveListenerFunction]("keydown", mainKeyDownHandler, true);
         
         //load event listener
   		tabbrowser[addOrRemoveListenerFunction]("DOMContentLoaded", mainDomContentLoadedHandler, true);
	  		tabbrowser[addOrRemoveListenerFunction]("pageshow", mainPageShowHander, false);
			tabbrowser[addOrRemoveListenerFunction]("pageshow", googleProjectHelperHandler, false);

			// Focus Listener
			getBrowser()[addOrRemoveListenerFunction]("focus", focusHandler, true);
			getBrowser()[addOrRemoveListenerFunction]("blur", focusHandler, true);
         
			//Tab select listener
			getBrowser().tabContainer[addOrRemoveListenerFunction]("TabSelect", tabSelectHandler,false);
		},
		
		initShortCuts: function (){
		    //Shortcut for Enter
		    this.scm.addShortcut(208, "mouselessbrowsing.EventHandler.handleEnter()", null, MlbCommon.SCM_CLIENT_ID);
		    
          this.setShortcut("mouselessbrowsing.keys.openInNewTabPostfixKey", "mouselessbrowsing.EventHandler.openLinkInOtherLocationViaPostfixKey(event, mouselessbrowsing.MlbCommon.OpenLinkLocations.TAB)");

          this.setShortcut("mouselessbrowsing.keys.openInNewWindowPostfixKey", "mouselessbrowsing.EventHandler.openLinkInOtherLocationViaPostfixKey(event, mouselessbrowsing.MlbCommon.OpenLinkLocations.WINDOW)");

          this.setShortcut("mouselessbrowsing.keys.openInCoolirisPreviewsPostfixKey", "mouselessbrowsing.EventHandler.openLinkInOtherLocationViaPostfixKey(event, mouselessbrowsing.MlbCommon.OpenLinkLocations.COOLIRIS_PREVIEW)");

		    this.setShortcut("mouselessbrowsing.keys.toggleMLB", "mouselessbrowsing.EventHandler.toggleIds()");
		    
			 this.setShortcut("mouselessbrowsing.keys.toggleAllIds", "mouselessbrowsing.EventHandler.toggleAllIds()");

         this.setShortcut("mouselessbrowsing.keys.updatePage", function(){PageInitializer.updatePage(); return ShortcutManager.SUPPRESS_KEY});
         
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
			 if(MlbPrefs.toggleExlNumpadWithDoubleStrokeNumKey){
		       this.scm.addShortcut(2304, "mouselessbrowsing.EventHandler.toggleExclusiveUseOfNumpad();", null, MlbCommon.SCM_CLIENT_ID);
			 }
		
		    combinedKeyCode = Prefs.getCharPref("mouselessbrowsing.keys.toggleExlusiveUseOfNumpad");
		    if(combinedKeyCode!="2304" && combinedKeyCode!="0")
			    this.scm.addShortcut(combinedKeyCode, "mouselessbrowsing.TabLocalPrefs.toggleExclusiveUseOfNumpad();",  null, MlbCommon.SCM_CLIENT_ID);
		    
			 this.setShortcut("mouselessbrowsing.keys.toggleEnableDisableMLB", "mouselessbrowsing.InitManager.toggleEnableDisableMLB()");
		},
		
		setShortcut: function(prefsKey, jsCode){
			var combinedKeyCode = Prefs.getCharPref(prefsKey);
			if(combinedKeyCode!="0"){
				this.scm.addShortcut(combinedKeyCode, jsCode, null, MlbCommon.SCM_CLIENT_ID);
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
          var skinUrlPrefix = "chrome://mouselessbrowsing/skin/" 
          if(MlbPrefs.disableMLB){
          	statusIcon.src = skinUrlPrefix + "MLB_disabled.ico"
          }else{
          	statusIcon.src = skinUrlPrefix + "MLB.ico"
          }
          if(MlbPrefs.showMlbIconInStatusbar){
              statusIcon.style.display="block";
          }else{
              statusIcon.style.display="none";
          }
          var exlNumpadIcon = document.getElementById("mlb-status-exl-numpad-image");
          if(TabLocalPrefs.isExclusiveUseOfNumpad() && MlbPrefs.showMlbIconInStatusbar && !MlbPrefs.isCharIdType() && !MlbPrefs.disableMLB){
              exlNumpadIcon.style.display="block";
          }else{
              exlNumpadIcon.style.display="none";
          }       
          var statusLabel = document.getElementById("mlb-status");
          if(MlbPrefs.showKeybufferInStatusbar && !MlbPrefs.disableMLB){
              statusLabel.style.display="block";
          }else{
              statusLabel.style.display="none";
          }
          var tooltiptext = "Mouseless Browsing " + MlbCommon.MLB_VERSION
          if(MlbPrefs.disableMLB){
          	tooltiptext += " disabled"
          }
          if(TabLocalPrefs.isExclusiveUseOfNumpad() && !MlbPrefs.isCharIdType() && !MlbPrefs.disableMLB){
          	tooltiptext += "\n" + Utils.getString(STRINGBUNDLE_ID, "exclusiveUseOfNumpadActive")
          }
          statusPanel.tooltipText = tooltiptext
		},
		
		toggleEnableDisableMLB: function(){
			MlbUtils.logDebugMessage('init on toggling')
			Prefs.setBoolPref("mouselessbrowsing.disableMLB", !MlbPrefs.disableMLB)
			this.init()
		},
		
		observe: function(){
			this.init();
		}
	
	}
	
	var NS = mlb_common.Namespace
	NS.bindToNamespace("mouselessbrowsing","InitManager", InitManager)

   //TODO remove, used only for test purposes
   function showOffsets(event){
      if(event.ctrlKey && event.button==2){
        var target = event.originalTarget
        
        var offset = DomUtils.getOffsetToBody(target)
        mlb_common.Utils.logMessage("MLB: TagName: " + target.tagName + " OffsetLeft (Body): " + offset.x + " OffsetTop (Body): " + offset.y)
        event.stopPropagation()
        event.preventDefault()
      }
   }
	
})()
}}

