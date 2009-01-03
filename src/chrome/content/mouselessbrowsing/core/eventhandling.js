/*
 * Mouseless Browsing 
 * This files contains all the event-handling and actions
 * Version 0.5
 * Created by Rudolf Noé
 * 31.12.2007
 */
with(mlb_common){
with(mouselessbrowsing){
(function(){
   
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
            //Case Ids not visible		   		  
		      TabLocalPrefs.getVisibilityMode()==MlbCommon.VisibilityModes.NONE ||
		      //Case char ids and modifier was pressed
            (MlbPrefs.isCharIdType() && (event.ctrlKey || event.altKey || event.metaKey)) ||
            
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
			this.openInNewTab = ShortcutManager.encodeEventModifier(event)==MlbPrefs.modifierForOpenInNewTab
			this.openInNewWindow= ShortcutManager.encodeEventModifier(event)==MlbPrefs.modifierForOpenInNewWindow
			this.openInCoolirisPreviews = ShortcutManager.encodeEventModifier(event)==MlbPrefs.modifierForOpenInCoolirisPreviews
			
         if(this.isExecuteAutomatic(event)){
            if(MlbPrefs.executeInstantlyWhenIdUnique && MlbUtils.getPageData().isIdUnique(this.keybuffer))
               this.executeAutomatic()
            else
			      this.timerId = setTimeout("mouselessbrowsing.EventHandler.executeAutomatic()", MlbPrefs.delayForAutoExecute);
			}else{
			   this.setResetTimer()
			}
		},
		
		onkeydown: function(event){
			//Case excl. use of numpad, second part is to avoid overwriting of change tab 
         if((this.isCaseOfExclusivlyUseOfNumpad(event) && (!event.ctrlKey||this.isOneOfConfiguredModifierCombination(event)))
            //Case Digit + modifier 
            || (MlbPrefs.isNumericIdType() && this.isDigitPressed(event) && this.isOneOfConfiguredModifierCombination(event) 
               && !this.isAltCtrlInEditableField(event))
            //Case input is blocked for MLB
            || this.blockKeyboardInputForMLBActive){
               this.stopEvent(event)
               this.eventStopped=true
               //Fix for Bug Id 13 and Workaround for FF Bug 291082; 
               if(MlbUtils.isElementOfType(event.originalTarget, MlbUtils.ElementTypes.SELECT)){
               	event.originalTarget.blur()
               }
         }else{
         	   this.eventStopped=false
         }
         
         if(this.blockKeyboardInputForMLBActive){
         	this.setTimerForBlockKeyboardInputReset()
         }
		},
		
      isOneOfConfiguredModifierCombination: function(event) {
			var encodedModifierCode = ShortcutManager.encodeEventModifier(event)
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
			return MlbUtils.isWritableElement(event.originalTarget) &&  ShortcutManager.isModifierCombination(event, ShortcutManager.CTRL_ALT)
		},
		
		isDigitPressed: function(event){
         var keyCode = event.which
         return (keyCode>=KeyEvent.DOM_VK_0 && keyCode<=KeyEvent.DOM_VK_9) ||
                 (keyCode>=KeyEvent.DOM_VK_NUMPAD0 && keyCode<=KeyEvent.DOM_VK_NUMPAD9)
		},
		
		handleEnter: function(){
			var event = InitManager.getShortcutManager().getCurrentEvent();
         if(this.shouldExecute()){
           this.execute();
           this.stopEvent(event);
         }
         this.resetVars();
         return ShortcutManager.DO_NOT_SUPPRESS_KEY
		},

		/*
		    Autoexecution function when pressed ctrl-key
		*/
		executeAutomatic: function(){
		    if(this.shouldExecute()){
		        this.execute();
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
			
		
		shouldExecute: function(){
			if(MlbUtils.getPageData() && //avoid error if page is changed in the meantime e.g. with history back
			   MlbUtils.getPageData().hasElementWithId(this.keybuffer) ||
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
		    var element = MlbUtils.getPageData().getElementForId(this.keybuffer);
		    //If onDomContentLoaded the pageData is not refreshed removed items could be in the pageData
		    if(element.ownerDocument==null){//Element no longer exists within the document
		    	return
		    }
		    var currentDoc = element.ownerDocument;
		    var currentWin = currentDoc.defaultView;
		    //Return code for onclick-functions
		    var returnCode = true;
		    var tagName = element.tagName.toLowerCase();
		    var type = element.type?element.type.toLowerCase():null;
		    
		    if(tagName=="body"){
		        currentWin.focus();
		        if(currentDoc.body){
		          currentDoc.body.focus()
		        }
		        return;
		    }
		    //First try at least to focus
          try{
             element.focus();
          }catch(e){}

          //If it is text- or password-field
		    if((tagName=="input" && (type=="text" || type=="password")) ||
		        tagName=="textarea"){
		            element.select()
		    } 
		    //If its an anchor check different possibilities
		    else if (tagName == "a") {
   			var loadInBackground = Prefs.getBoolPref("browser.tabs.loadInBackground")
				if (this.openInNewTab) {
					Utils.openUrlInNewTab(element.href, !loadInBackground);
					return;
				} else if (this.openInNewWindow) {
					Utils.openInNewWindow(element.href, true)
					return;
				}else if (this.openInCoolirisPreviews){
   		    	this.showCoolirisPreview(element);
   		    	return
		      }else if (element.target!=null && element.target.length>0  
		                && !this.isTargetInCurrentWin(currentWin.top, element.target)){//Extra handling as FF does not open link if it not within the same window
		      	var tabs = Application.activeWindow.tabs
		      	for (var i = 0; i < tabs.length; i++) {
		      		var tab = tabs[i]
		      		if(tab.document.defaultView.name==element.target){
		      			tab.load(Utils.createURI(element.href))
		      			if(!loadInBackground){
		      		     tab.focus()
		      			}
		      			return
		      		}
		      	}
               var newTab = Utils.openUrlInNewTab(element.href, !loadInBackground);
               //set name of new window
               //TODO make it right
               if(element.target!="_blank")
                  newTab.document.defaultView.name = element.target
               return;
		      }
			 }

		    //And simulate click
          function performEvent(type){
   		    var clickEvent = currentDoc.createEvent("MouseEvents");
   		    clickEvent.initMouseEvent( type, true, true, currentWin, 1, 0, 0, 0, 0, 
   		        false, false, false, false, 0, null);
   		    element.dispatchEvent(clickEvent);
          }
          performEvent("mouseover")
          performEvent("mousedown")
          performEvent("click")
          performEvent("mouseup")
		},
		
		/*
		 * Determines whether the target of a link is within the current win
		 */
		isTargetInCurrentWin: function(topWin, target){
			var allFrames = MlbUtils.getAllFrames(topWin)
			if(target=="_self" || target=="_parent" || target=="_top" ||
			   allFrames.some(function(element){return element.name==target})){
				return true
			}
			return false
		},
		
		/*
		 * Toggles the visibility of the Ids
		 */
		toggleIds: function(){
			if(this.isSuppressShortCut()){
				return
			}
			var currentVisibilityMode = TabLocalPrefs.getVisibilityMode()
			var previousVisibilityMode = TabLocalPrefs.getPreviousVisibilityMode()
			var resultingVisibilityMode = null;
			if((currentVisibilityMode==MlbCommon.VisibilityModes.CONFIG || currentVisibilityMode==MlbCommon.VisibilityModes.ALL)){
			   if(this.getPageInitializer().hasVisibleIdSpans(content)){
   				//If ids are currently shown, switch to visibility mode "none"
   		    	resultingVisibilityMode=MlbCommon.VisibilityModes.NONE;
			   }else{//Special case to make ids visible on first shortcut after reenabling MLB 
   		    	resultingVisibilityMode=MlbCommon.VisibilityModes.CONFIG;
			   }			   	
		   }else if(previousVisibilityMode==MlbCommon.VisibilityModes.CONFIG){
	         //Previous mode was config, switch back to config mode		   	
            resultingVisibilityMode=MlbCommon.VisibilityModes.CONFIG;
			}else {
			   //Previous mode was all, switch back to all mode
			   resultingVisibilityMode=MlbCommon.VisibilityModes.ALL;
			}
		   this.updateIdsAfterToggling(resultingVisibilityMode, currentVisibilityMode);
         
		},
		
		/*
		 * Toggles between showing the ids for the configured elements and
		 * all elements
		 */
		toggleAllIds: function(){
         var currentVisibilityMode = TabLocalPrefs.getVisibilityMode()
		   var resultingVisibilityMode = null
		   if(currentVisibilityMode==MlbCommon.VisibilityModes.NONE || currentVisibilityMode==MlbCommon.VisibilityModes.CONFIG){
		    	resultingVisibilityMode=MlbCommon.VisibilityModes.ALL;
		   }else{ 
		    	resultingVisibilityMode=MlbCommon.VisibilityModes.CONFIG;
		   }
		   this.updateIdsAfterToggling(resultingVisibilityMode, currentVisibilityMode);
         
		},
		
		/*
		 * Initiates the update of the id spans after toggling the ids
		 */
		updateIdsAfterToggling: function(visibilityMode, currentVisibilityMode){
	      TabLocalPrefs.initVisibilityModeAndShowIdPrefs(visibilityMode);
         //Hide all as the 
			if(visibilityMode==MlbCommon.VisibilityModes.NONE){
            this.getPageInitializer().deactivateChangeListener(content)
            this.hideIdSpans(content);
		    }else {
            if(currentVisibilityMode==MlbCommon.VisibilityModes.ALL)//hide first all id spans as the number of spans will be less
               this.hideIdSpans(content)
		      this.getPageInitializer().updatePage();
		    }
		},
      
		/*
		 * Hides all Id spans
		 * Called recusvily an all frames
		 */
		hideIdSpans: function(winObj){
	       //Reset PageData
          var pageData = MlbUtils.getPageData(winObj)
          function _hideIdSpans(winObj){
   		    var doc = winObj.document;
   		    var spans = doc.evaluate("//span[@MLB_idSpanFlag]", doc, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null)
   		    for(var i=0; i<spans.snapshotLength; i++){
      		     var span = spans.snapshotItem(i)
                 span.style.display = "none";
                 var elementForSpan = pageData.getElementBySpan(span)
                 if(elementForSpan!=null){
                    AbstractInitializer.setElementStyle(elementForSpan, false)
                 }
   		    }
   		    var frames = winObj.frames;
   		    for(var i=0; i<frames.length; i++){
   		        _hideIdSpans(frames[i]);
   		    }
          }
          _hideIdSpans(winObj)
          if(pageData)//is null on first initialization after startup
            pageData.initResetableMembers()
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
		    
		},
		
		/*
		 * Some shortcuts will be suppressed if they have no modifier
		 * and a textfield or selectbox is focused
		 */
		isSuppressShortCut: function(){
		    var event = InitManager.getShortcutManager().getCurrentEvent();
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
		    if(direction=="up")
		        content.scrollBy(0, -MlbPrefs.pixelsToScroll);
		    else
		        content.scrollBy(0, MlbPrefs.pixelsToScroll);
          
		},
		 /*
		  * Checks wether the actual-keystroke should be suppressed
		  */
		isCaseOfExclusivlyUseOfNumpad: function(event){
		    var keyCode = event.keyCode;
		    var isNumpad = (keyCode>=96 && keyCode<=106) || (keyCode==108) || (keyCode>=110 && keyCode<=111) 
		    return MlbPrefs.isNumericIdType() && TabLocalPrefs.isExclusiveUseOfNumpad() && isNumpad;
		},
		
      /*
       * Opens Link in a new tab
       */
      openLinkInOtherLocationViaPostfixKey : function(event, locationId) {
			if (this.keybuffer == ""){
				return;
         }
			var element = MlbUtils.getPageData().getElementForId(this.keybuffer);
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
		   return ShortcutManager.PREVENT_FURTHER_EVENTS;
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
		        TabLocalPrefs.toggleExclusiveUseOfNumpad()
		    }
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
		   if(this.keybuffer==""){
            return;
         }
         var pageData = MlbUtils.getPageData() 
         var element = pageData.getElementForId(this.keybuffer);   
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
		   range.setEndBefore(pageData.getIdSpanByElement(element))
			//Set new Selection
			selection.removeAllRanges();
			selection.addRange(range);
			
			this.resetVars();
         
		},
		
		onElementFocusEvent: function(event){
			var focusedElement = event.originalTarget
			if(!this.isElementWithOverlayPositioning(focusedElement)){
				return
			}
         var idSpan = null
         if (focusedElement instanceof HTMLDocument
               && focusedElement.designMode == "on") {
            idSpan = focusedElement.defaultView.frameElement.idSpan
         }else if(focusedElement.ownerDocument){
            var win = focusedElement.ownerDocument.defaultView
            var pageData = MlbUtils.getPageData(win)
            if(pageData!=null){
               idSpan = pageData.getIdSpanByElement(focusedElement)
            }
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
         }else{
         	this.blockKeyboardInputForMLBActive=true
            this.setTimerForBlockKeyboardInputReset()
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

		//TODO Remove tab numbering stuff
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
		},
      
      disableMlb: function(){
         //Hide ids in all browsers
         Firefox.iterateAllBrowsers(function(browser){
            EventHandler.hideIdSpans(browser.contentWindow)
         })
      },
      
      setResetTimer: function(){
         this.timerId = setTimeout("mouselessbrowsing.EventHandler.resetVars()", MlbPrefs.delayForAutoExecute);
      }
      
   }

   var NS = mlb_common.Namespace
   NS.bindToNamespace("mouselessbrowsing", "EventHandler", EventHandler)

})()
}}