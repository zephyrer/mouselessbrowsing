/*
 * Mouseless Browsing 
 * This files contains all the event-handling and actions
 * Version 0.5
 * Created by Rudolf Noé
 * 31.12.2007
 */

(function(){
   
   //Imports   		
	var Utils = rno_common.Utils
	var StringUtils = rno_common.StringUtils
	var Prefs = rno_common.Prefs
	var MlbPrefs = mouselessbrowsing.MlbPrefs
	var MlbCommon = mouselessbrowsing.MlbCommon
	var MlbUtils = mouselessbrowsing.MlbUtils
	var GlobalData = mouselessbrowsing.GlobalData
		
   var EventHandler = {
		//Keybuffer
		keybuffer: "",
		
		//Flag indicating whether a event was stopped
		//Set onkeydown and used onkeypress
		eventStopped: false,
		
		//Flag indicating whether the keyboard input should be blocked for MLB
		blockKeyboardInputForMLBActive: false,
		
		//TimerId for reseting blocking of keyboard input
		blockKeyboardInputTimerId: null,
		
		//Flag for openening link in new tab
		openInNewTab: false,
		
		//Flag for openening link in new tab
		openInNewWindow: false,
		
		//Flag for opening link in Cooliris Previews
		openInCoolirisPreviews: false,
		
		//Regexp for keybuffercontent to focus special tab
		changeTabByNumberRegExp: /^0[1-9]$/,
		
		globalIds: {
			"0": "urlbar",
			"00": "searchbar",
			"01": "changeTab",
			"02": "changeTab",
			"03": "changeTab",
			"04": "changeTab",
			"05": "changeTab",
			"06": "changeTab",
			"07": "changeTab",
			"08": "changeTab",
			"09": "changeTab"
		},
		
		//Indicates wether Element should be selected and opens the context-menu
		openContextMenu: false,
		
		//Timer-id from setTimeout(..) for clearing the this.keybuffer
		timerId: null,
		
		/*
		    Main-eventhandling for every page
		*/
		onkeypress: function(event){

		   var keyCode = event.which;
		   var charCode = event.charCode
		   var charString = String.fromCharCode(charCode).toUpperCase()

		   //Do nothing if
		   if(!window.getBrowser() ||
            //Ids not visible		   		  
		      MlbPrefs.visibilityMode==MlbCommon.VisibilityModes.NONE ||
            (MlbPrefs.isCharIdType() && (event.ctrlKey || event.altKey)) ||
            (MlbPrefs.isNumericIdType() && MlbUtils.isWritableElement(event.originalTarget) && !this.eventStopped && !this.isOneOfConfiguredModifierCombination(event)) ||
            (MlbUtils.isWritableElement(event.originalTarget) && !this.eventStopped) ||
		      !this.isCharCodeInIds(charString)){ 
		    	return;
		   }
 
		   //With new keystroke clear old timer
		   clearTimeout(this.timerId);
		    
			this.keybuffer = this.keybuffer + String.fromCharCode(charCode);

			//Update statusbar
			if(MlbPrefs.showKeybufferInStatusbar){
			   this.updateStatuspanel(this.keybuffer.toUpperCase());
			}
			
			//Set flag whether link should be opened in new tab or in cooliris preview
			this.openInNewTab = ShortCutManager.encodeEventModifier(event)==MlbPrefs.modifierForOpenInNewTab
			this.openInNewWindow= ShortCutManager.encodeEventModifier(event)==MlbPrefs.modifierForOpenInNewWindow
			this.openInCoolirisPreviews = ShortCutManager.encodeEventModifier(event)==MlbPrefs.modifierForOpenInCoolirisPreviews
			
			if(this.isExecuteAutomatic(event)){
			   this.timerId = setTimeout("mouselessbrowsing.EventHandler.executeAutomatic()", MlbPrefs.delayForAutoExecute);
			}else{
			   this.timerId = setTimeout("mouselessbrowsing.EventHandler.resetVars()", MlbPrefs.delayForAutoExecute);
			}
		},
		
		onkeydown: function(event){
         //Suppress event if exclusive use
         //Todo make it properly as in case of alphanummeric ids it makes no sense
         if((this.isCaseOfExclusivlyUseOfNumpad(event)) 
            || (MlbPrefs.isNumericIdType() && this.isDigitPressed(event) && this.isOneOfConfiguredModifierCombination(event) 
               && !this.isAltCtrlInEditableField(event))
            || this.blockKeyboardInputForMLBActive){
               this.stopEvent(event)
               this.eventStopped=true
         }else{
         	   this.eventStopped=false
         }
         
         if(this.blockKeyboardInputForMLBActive){
         	this.setTimerForBlockKeyboardInputReset()
         }
		},
		
      isOneOfConfiguredModifierCombination: function(event) {
			var encodedModifierCode = ShortCutManager.encodeEventModifier(event)
			if (encodedModifierCode == MlbPrefs.modifierForWritableElement ||
					encodedModifierCode == MlbPrefs.modifierForOpenInNewTab ||
					encodedModifierCode == MlbPrefs.modifierForOpenInNewWindow ||
					(encodedModifierCode == MlbPrefs.modifierForOpenInCoolirisPreviews && MlbUtils.isCoolirisPreviewsInstalled())) {
				return true
			} else {
				return false
			}
		},
		
		isAltCtrlInEditableField: function(event){
			return MlbUtils.isWritableElement(event.originalTarget) &&  ShortCutManager.isModifierCombination(event, ShortCutManager.CTRL_ALT)
		},
		
		isDigitPressed: function(event){
         var keyCode = event.which
         return (keyCode>=KeyEvent.DOM_VK_0 && keyCode<=KeyEvent.DOM_VK_9) ||
                 (keyCode>=KeyEvent.DOM_VK_NUMPAD0 && keyCode<=KeyEvent.DOM_VK_NUMPAD9)
		},
		
		handleEnter: function(){
			var event = ShortCutManager.currentEvent;
         if(this.keybuffer!="" && this.shouldExecute()){
           this.execute();
           this.stopEvent(event);
         }
         this.resetVars();
		},
		
		isCharCodeInIds: function(charString){
			if(MlbPrefs.idChars.indexOf(charString)!=-1){
				return true;
			}else{
				return false;
			}
		},
		
		isExecuteAutomatic: function(event){
		    //Always if Ctrl or Alt-Key was Pressed
		    if (event.ctrlKey || event.altKey){
		       return true
		    }else if(MlbPrefs.executeAutomaticEnabled==false){
		       return false
		    }else if(this.isCaseOfExclusivlyUseOfNumpad(event) ||
		             !MlbUtils.isWritableElement(event.originalTarget.srcElement)){
		       return true
		    }else{
		       return false
		    }
		},
			
		/*
		    Autoexecution function when pressed ctrl-key
		*/
		executeAutomatic: function(){
		    if(this.shouldExecute()){
		        this.execute();
		    }
		    this.resetVars();
		    return;
		},
		
		shouldExecute: function(){
			if(MlbUtils.getCurrentContentWin().mlbPageData.hasElementWithId(this.keybuffer) ||
				this.globalIds[this.keybuffer]!=null){
				return true;
			}else{
				return false;
			}
		},
		
		/*
		  Execute action  
		*/
		execute: function(){
		    //First check for focusing URL-Field
		    if(this.keybuffer=="0"){
		        document.getElementById('urlbar').select();
		        return;
		    }
		    
		    if(this.keybuffer=="00"){
		        document.getElementById('searchbar').select();
		        return;
		    }
		    
		    //Check for changing tab by number
		    if(this.changeTabByNumberRegExp.test(this.keybuffer)){
		    	this.changeTabByNumber();
		    	return;
		    }
		    
		    //Else...
		    var element = MlbUtils.getCurrentContentWin().mlbPageData.getElementForId(this.keybuffer);
		    var currentDoc = element.ownerDocument;
		    var currentWin = currentDoc.defaultView;
		    //Return code for onclick-functions
		    var returnCode = true;
		    var tagName = element.tagName.toLowerCase();
		    var type = element.type?element.type.toLowerCase():null;
		    
		    if(tagName=="body"){
		        currentWin.focus();
		        return;
		    }
		    //If it is text- or password-field
		    if((tagName=="input" && (type=="text" || type=="password")) ||
		        tagName=="textarea"){
		    	      element.focus()
		            element.select()
		    } 
		    //If its an anchor check different possibilities
		    else if (tagName == "a") {
				if (this.openInNewTab) {
					var loadInBackground = Prefs.getBoolPref("browser.tabs.loadInBackground")
					Utils.openUrlInNewTab(element.href, !loadInBackground);
					return;
				} else if (this.openInNewWindow) {
					Utils.openInNewWindow(element.href, true)
					return;
				}else if (this.openInCoolirisPreviews){
   		    	this.showCoolirisPreview(element);
   		    	return
		      }
			 }
		    //In every other case try to focus
		    else {
		        try{
		            element.focus();
		        }catch(e){}
		    }
		    

		    var targetBlank = false
		    var target = element.target
		    if(tagName=="a" && (target=="_blank" || /new$/.test(target))){
		    	targetBlank = true
		    }
		    
		    //And simulate click
		    var clickEvent = currentDoc.createEvent("MouseEvents");
		    clickEvent.initMouseEvent( "click", true, true, currentWin, 1, 0, 0, 0, 0, 
		        targetBlank, false, false, false, 0, null);
		    element.dispatchEvent(clickEvent);
		},
		
		/*
		 * Toggles the visibility of the Ids
		 */
		toggleIds: function(){
			if(this.isSuppressShortCut()){
				return
			}
			var resultingVisibilityMode = null;
			if(MlbPrefs.visibilityMode==MlbCommon.VisibilityModes.CONFIG || MlbPrefs.visibilityMode==MlbCommon.VisibilityModes.ALL){
				//If ids are currently shown, switch to visibility mode "none"
				GlobalData.previousVisibilityMode=MlbPrefs.visibilityMode;
		    	resultingVisibilityMode=MlbCommon.VisibilityModes.NONE;
		   }else if(GlobalData.previousVisibilityMode==MlbCommon.VisibilityModes.CONFIG){
	         //Previous mode was config, switch back to config mode		   	
            GlobalData.previousVisibilityMode=MlbPrefs.visibilityMode;
            resultingVisibilityMode=MlbCommon.VisibilityModes.CONFIG;
			}else {
			   //Previous mode was all, switch back to all mode
			   GlobalData.previousVisibilityMode=MlbPrefs.visibilityMode;
			   resultingVisibilityMode=MlbCommon.VisibilityModes.ALL;
			}
		   this.updateIdsAfterToggling(resultingVisibilityMode);
		   return ShortCutManager.SUPPRESS_KEY
		},
		
		/*
		 * Toggles between showing the ids for the configured elements and
		 * all elements
		 */
		toggleAllIds: function(){
			GlobalData.previousVisibilityMode=MlbPrefs.visibilityMode;
		   var resultingVisibilityMode = null
		   if(MlbPrefs.visibilityMode==MlbCommon.VisibilityModes.NONE || MlbPrefs.visibilityMode==MlbCommon.VisibilityModes.CONFIG){
		    	resultingVisibilityMode=MlbCommon.VisibilityModes.ALL;
		   }else{ 
		    	resultingVisibilityMode=MlbCommon.VisibilityModes.CONFIG;
		   }
		   this.updateIdsAfterToggling(resultingVisibilityMode);
		},
		
		/*
		 * Initiates the update of the id spans after toggling the ids
		 */
		updateIdsAfterToggling: function(visibilityMode){
	       MlbPrefs.initShowIdPrefs(visibilityMode, true);
         //Set visibility flags		    
			if(visibilityMode==MlbCommon.VisibilityModes.NONE){
		       this.hideIdSpans(MlbUtils.getCurrentContentWin());
		    }else {
		       this.getPageInitializer().updatePage();
		    }
		},
		
		/*
		 * Hides all Id spans
		 * Called recusvily an all frames
		 */
		hideIdSpans: function(winObj){
	       //Reset PageData
	       MlbUtils.getCurrentContentWin().mlbPageData = new mouselessbrowsing.PageData()
		    var spans = winObj.document.getElementsByTagName("span");
		    for(var i=0; i<spans.length; i++){
		        var span = spans[i];
		        if(!MlbUtils.isIdSpan(span)){
		            continue;
		        }
              span.style.display = "none";
              var elementForSpan = MlbUtils.getElementForIdSpan(span)
              if(elementForSpan!=null){
                 this.getPageInitializer().setElementStyle(elementForSpan, false)
              }
		    }
		    var frames = winObj.frames;
		    for(var i=0; i<frames.length; i++){
		        this.hideIdSpans(frames[i]);
		    }
		},
		
		/*
		 * Moves back or forward in history
		 */ 
		moveHistory: function(direction){
			if(this.isSuppressShortCut()){
				return
			}
		    //Due to fact ff crashes otherwise a setTimeout must be applied
		    if(direction=="forward")
		        getBrowser().goForward();
		    else
		        getBrowser().goBack();
		    
		    return ShortCutManager.SUPPRESS_KEY;
		},
		
		/*
		 * Some shortcuts will be suppressed if they have no modifier
		 * and a textfield or selectbox is focused
		 */
		isSuppressShortCut: function(){
		    var event = ShortCutManager.currentEvent;
		    if(this.isNonPrintableKey(event))
		    	return false;
		    var modifierPressed = event.altKey || event.ctrlKey
		    return !modifierPressed && 
		        MlbUtils.isWritableElement(event.originalTarget) && 
		        !this.isCaseOfExclusivlyUseOfNumpad(event);
		},
		
		isNonPrintableKey: function(event){
			var keyCode = event.keyCode;
			if((keyCode>=112 && keyCode<=123) || keyCode<49)
				return true;
			else
				return false;
		},
		
		resetVars: function(){
		   this.keybuffer="";
		   this.openInNewTab=false;
		   this.openInNewWindow=false;
		   this.openInCoolirisPreviews=false;
		   this.updateStatuspanel("");
			this.openContextMenu = false;
			clearTimeout(this.timerId);
			this.clearTimerForBlockKeyboardInput()
		},
		
		/*
		 * scrolling up/down
		 */
		scrollUpDown: function(direction){
		    if(this.isSuppressShortCut()){
		    	return
		    }
		    var focusedWindow = document.commandDispatcher.focusedWindow;
		    if(direction=="up")
		        focusedWindow.scrollBy(0, -MlbPrefs.pixelsToScroll);
		    else
		        focusedWindow.scrollBy(0, MlbPrefs.pixelsToScroll);
		    return ShortCutManager.SUPPRESS_KEY; 
		},
		 /*
		  * Checks wether the actual-keystroke should be suppressed
		  */
		isCaseOfExclusivlyUseOfNumpad: function(event){
		    var keyCode = event.keyCode;
		    var isNumpad = (keyCode>=96 && keyCode<=106) || (keyCode>=110 && keyCode<=111) 
		    return MlbPrefs.isNumericIdType() && MlbPrefs.exclusiveUseOfNumpad && isNumpad;
		},
		
      /*
       * Opens Link in a new tab
       */
      openLinkInOtherLocationViaPostfixKey : function(event, locationId) {
			if (this.keybuffer == "")
				return;
			var element = MlbUtils.getCurrentContentWin().mlbPageData.getElementForId(this.keybuffer);
			if (element == null)
				return;
			var tagName = element.tagName.toLowerCase();
			if (tagName != "a")
				return;
			this.resetVars();
			var href = element.href
			if (locationId == MlbCommon.OpenLinkLocations.TAB) {
				Utils.openUrlInNewTab(href, !Prefs.getBoolPref("browser.tabs.loadInBackground"));
			} else if (locationId == MlbCommon.OpenLinkLocations.WINDOW) {
				//Otherwise the key is displayed
				this.blurActiveElement(event)
				Utils.openInNewWindow(href, true)
			} else if (locationId == MlbCommon.OpenLinkLocations.COOLIRIS_PREVIEW && MlbUtils.isCoolirisPreviewsInstalled()) {
				this.showCoolirisPreview(element)
			}
			return ShortCutManager.SUPPRESS_KEY	| ShortCutManager.PREVENT_FURTHER_EVENTS;
		},
		
		showCoolirisPreview: function(link) {
			var dummyEvent = content.document.createEvent("MouseEvents");
			cpvw_docHandler.initPreviewShow(dummyEvent, link.href, link)
		},

		/*
		 * Toggles the exclusive use of numpad
		 */
		toggleExclusiveUseOfNumpadSecondCall: false,
		toggleExclusiveUseOfNumpad: function(){
		    if(this.toggleExclusiveUseOfNumpadSecondCall==false){
		         this.toggleExclusiveUseOfNumpadSecondCall=true;
		        setTimeout("mouselessbrowsing.EventHandler.toggleExclusiveUseOfNumpadSecondCall=false", 1000);
		    }else{
		        MlbPrefs.exclusiveUseOfNumpad = !MlbPrefs.exclusiveUseOfNumpad;
		    }
		    return ShortCutManager.SUPPRESS_KEY
		},
		
		updateStatuspanel: function(status){
		    document.getElementById("mlb-status").value= status;
		},
		
		changeTabByNumber: function(){
			var index = this.keybuffer.substring(1);
			index = index-1;
			var tabs = Application.activeWindow.tabs
			if(index<=tabs.length){
				tabs[index].focus()
			}
		},
		
		stopEvent: function(event){
         event.preventDefault();
		   event.stopPropagation();
		},
		
		selectLink: function(){
		   if(this.keybuffer=="")
		        return;
		    var element = MlbUtils.getCurrentContentWin().mlbPageData.getElementForId(this.keybuffer);   
		    if(element==null)
		        return;
		    var tagName = element.tagName.toLowerCase();
		    if(tagName!="a")
		        return;
		 	//Select Link
		   element.focus();
		   var doc = element.ownerDocument;
			var selection = doc.defaultView.getSelection()

		   //Create new Range
		   var range = doc.createRange();
		   range.selectNode(element);
		   range.setEndBefore(element.idSpan)
			//Set new Selection
			selection.removeAllRanges();
			selection.addRange(range);
			
			this.resetVars();
		   return ShortCutManager.SUPPRESS_KEY;
		},
		
		onElementFocusEvent: function(event){
			focusedElement = event.originalTarget
			if(!this.isElementWithOverlayPositioning(focusedElement)){
				return
			}
         var idSpan = focusedElement.idSpan
         if(focusedElement instanceof HTMLDocument && focusedElement.designMode=="on"){
         	idSpan = focusedElement.defaultView.frameElement.idSpan
         }
         if(idSpan==null){
         	return
         }
         if(event.type=="focus"){
			   idSpan.style.visibility="hidden"
         }else{
			   idSpan.style.visibility="visible"
         }
		},
		
		isElementWithOverlayPositioning: function(element){
			return MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.TEXT) || 
            MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.PASSWORD) ||
            MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.TEXTAREA) ||
            MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.SELECT) ||
            MlbUtils.isEditableIFrame(element)
      },
		
		getPageInitializer: function(){
			return mouselessbrowsing.PageInitializer
		},
		
		blurActiveElement: function(event){
			if(MlbPrefs.isEscKey(MlbPrefs.BLUR_ACTIVE_ELEMENT_KEY_PREF_ID) &&
			   this.isPopupOpen()){
			   	return
			}
			var activeElement = getBrowser().contentDocument.activeElement
			while(activeElement.tagName=="FRAME" || activeElement.tagName=="IFRAME"){
				activeElement = activeElement.contentDocument.activeElement
			}
			if(activeElement.blur){       
				activeElement.blur()
			}
			if(activeElement.ownerDocument.designMode=="on"){
				activeElement.ownerDocument.defaultView.top.focus()
			}
		},
		
		/*
		 * Toggles the blocking of the keyboard input
		 */
		toggleBlockKeyboardInputForMLB:function(){
   		if(MlbPrefs.isEscKey(MlbPrefs.BLOCK_KEYBOARD_INDPUT_PREF_ID) &&
            this.isPopupOpen()){
               return
         }
         if(this.blockKeyboardInputForMLBActive){
         	this.blockKeyboardInputForMLBActive=false
         	this.clearTimerForBlockKeyboardInput()
         	MlbUtils.logDebugMessage("Block input: " + this.blockKeyboardInputForMLBActive)
         }else{
         	this.blockKeyboardInputForMLBActive=true
            this.setTimerForBlockKeyboardInputReset()
            MlbUtils.logDebugMessage("Block input: " + this.blockKeyboardInputForMLBActive)
         }
		},
		
		/*
		 * Sets timer for reseting keyboard input blocking
		 */
		setTimerForBlockKeyboardInputReset: function(){
			this.clearTimerForBlockKeyboardInput()
		   this.blockKeyboardInputTimerId = setTimeout(mouselessbrowsing.EventHandler.resetBlockKeyboardInput, MlbPrefs.delayForAutoExecute)	
		},
		
		/*
		 * Clears Timer responsible for resetting keyboard input blocking
		 */
		clearTimerForBlockKeyboardInput: function(){
			if(this.blockKeyboardInputTimerId!=null){
				clearTimeout(this.blockKeyboardInputTimerId)
				this.blockKeyboardInputTimerId=null
			}
		},
      
		/*
		 * Resets keyboard input blocking
		 */
		resetBlockKeyboardInput:function(){
			mouselessbrowsing.EventHandler.blockKeyboardInputForMLBActive=false
			MlbUtils.logDebugMessage("Block input: " + mouselessbrowsing.EventHandler.blockKeyboardInputForMLBActive)
		},
		
		isPopupOpen : function() {
			var popupsets = document.getElementsByTagName("popupset")
			for (var i = 0; i < popupsets.length; i++) {
				var popups = popupsets[i].childNodes
				for (var j = 0; j < popups.length; j++) {
					if (popups[j].state == "open") {
						return true
					}
				}
			}
			return false
		},

		/*
		 * (Re) numbers the tabs
		 */
		numberTabs: function(){
			if(!MlbPrefs.showTabIds){
				return
			}
			var tabs = Application.activeWindow.tabs
			for(var i=0; i<tabs.length; i++) {
				var tab = tabs[i]._getTab()
				if(tab==null){
					return
				}
				tab.label = this.createTabIdText(i) + tabs[i].document.title
			}
		},
		
		renumberTab:function(event){
         if(!MlbPrefs.showTabIds){
            return
         }
			var activeTabIndex = Application.activeWindow.activeTab.index
			var activeTab = Application.activeWindow.tabs[activeTabIndex]._getTab()
			activeTab.label = this.createTabIdText(activeTabIndex) + activeTab.label  
		},
		
		createTabIdText: function(index){
			return "[0" + (index+1) + "] "
		},
		
      openConfiguration: function(event){
      	if(event!=null && event.button!=0){
      	  return
      	}
         openDialog(MlbCommon.MLB_CHROME_URL+"/preferences/prefs.xul", "mlb_prefs", "chrome, centerscreen").focus()
      },

		addSiteRule:function(){
			var urlbar = document.getElementById("urlbar")
			openDialog(MlbCommon.MLB_CHROME_URL+"/preferences/prefs.xul", "mlb_prefs", "chrome, centerscreen", urlbar.value).focus()
		},
		
		reportBug: function(){
			Utils.openUrlInNewTab('http://code.google.com/p/mouselessbrowsing/issues/list', true)
		},
		
		giveFeedback:function(){
			Utils.getMostRecentBrowserWin().content.location.href="mailto:info@mouseless.de"
		},
		
		hideMlbMenu:function(){
         MlbPrefs.setShowMlbMenuFlag(false)
         document.getElementById('mlb_tools_menu').style.display="none"     
		},
		
		hideMlbStatusbar: function(){
			MlbPrefs.setShowMlbStatusbarFlag(false)
			mouselessbrowsing.InitManager.initStatusbar()
		}
   }

   var NS = rno_common.Namespace
   NS.bindToNamespace("mouselessbrowsing", "EventHandler", EventHandler)

})()