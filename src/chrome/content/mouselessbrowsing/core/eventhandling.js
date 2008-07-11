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
	var Prefs = rno_common.Prefs
	var MlbPrefs = mouselessbrowsing.MlbPrefs
	var MlbCommon = mouselessbrowsing.MlbCommon
	var MlbUtils = mouselessbrowsing.MlbUtils
	var GlobalData = mouselessbrowsing.GlobalData
		
   var EventHandler = {
		//Keybuffer
		keybuffer: "",
		
		//Flag for openening link in new tab
		openInNewTabFlag: false,
		
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

		   //All events are handled by the chrome window
		   var browser = window.getBrowser();
		   //Do nothing if
         //In case of Shift/Alt Gr key or if no ids are visible, do nothing
		   if(!browser ||
            event.shiftKey ||
            //Alt GR 
            (event.ctrlKey && event.altKey) ||
            //Ids not visible		   		  
		      MlbPrefs.visibilityMode==MlbCommon.VisibilityModes.NONE ||
		      //Focus is on writable Element
		      !this.isCharCodeInIds(charString)){ 
		    	return;
		   }
		    
		   //With new keystroke clear old timer
		   clearTimeout(this.timerId);
		    
		    
		   //On enter 
		   if(keyCode==13 && this.keybuffer!=""){
		       if(this.shouldExecute()){
		           this.execute();
		           this.stopEvent(event);
		       }
		       this.resetVars();
		       return;
		   }
		
			this.keybuffer = this.keybuffer + String.fromCharCode(charCode);

			//Update statusbar
			if(MlbPrefs.showKeybufferInStatusbar){
			   this.updateStatuspanel(this.keybuffer);
			}
			
			//Set flag whether link should be opened in new tab
			this.openInNewTabFlag = event.altKey
			
			if(this.isExecuteAutomatic(event)){
			   this.timerId = setTimeout("mouselessbrowsing.EventHandler.executeAutomatic()", MlbPrefs.delayForAutoExecute);
			}else{
			   this.timerId = setTimeout("mouselessbrowsing.EventHandler.resetVars()", MlbPrefs.delayForAutoExecute);
			}
		},
		
		onkeydown: function(event){
         //Suppress event if exclusive use
         //Todo make it properly as in case of alphanummeric ids it makes no sense
         if(MlbUtils.isWritableElement(event.originalTarget) && 
         	!this.isCaseOfExclusivlyUseOfNumpad(event)){
               this.stopEvent(event)
               this.eventStopped = true
         }
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
			if(this.getContentWin().mlbPageData.hasElementWithId(this.keybuffer) ||
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
		    var element = this.getContentWin().mlbPageData.getElementForId(this.keybuffer);
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
		    //If its an anchor and it should be openend in a new Tab
		    else if(tagName=="a" && this.openInNewTabFlag){
		        Utils.openUrlInNewTab(element.href);
		        return;
		    }
		    //In every other case try to focus
		    else {
		        try{
		            element.focus();
		        }catch(e){}
		    }
		    	
		    //And simulate click
		    var clickEvent = currentDoc.createEvent("MouseEvents");
		    clickEvent.initMouseEvent( "click", true, true, currentWin, 1, 0, 0, 0, 0, 
		        this.openInNewTabFlag, false, false, false, 0, null);
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
	       MlbPrefs.initShowIdPrefs(visibilityMode);
         //Set visibility flags		    
			if(visibilityMode==MlbCommon.VisibilityModes.NONE){
		       this.hideIdSpans(this.getContentWin());
		    }else {
		       this.getPageInitializer().initAfterToggling(this.getContentWin());
		    }
		},
		
		/*
		 * Hides all Id spans
		 * Called recusvily an all frames
		 */
		hideIdSpans: function(winObj){
	       //Reset PageData
	       this.getContentWin().mlbPageData = new mouselessbrowsing.PageData()
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
		
		getContentWin: function(){
			return window.getBrowser().contentWindow;
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
		   this.openInNewTabFlag=false;
		   this.updateStatuspanel("");
			this.openContextMenu = false;
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
		    return MlbPrefs.exclusiveUseOfNumpad && isNumpad;
		},
		
		/*
		 * Opens Link in a new tab
		 */
		openLinkInNewTabViaPostfixKey: function(){
		    if(this.keybuffer=="")
		        return;
		    var element = this.getContentWin().mlbPageData.getElementForId[this.keybuffer];   
		    if(element==null)
		        return;
		    var tagName = element.tagName.toLowerCase();
		    if(tagName!="a")
		        return;
		    Utils.openUrlInNewTab(element.href);
		    this.resetVars();
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
		},
		
		updateStatuspanel: function(status){
			var label = "MLB 0.5 ";
			if(MlbPrefs.exclusiveUseOfNumpad)
				label = label + "[Exclusive] ";
		    document.getElementById("mlb-status").label= label + status;
		},
		
		changeTabByNumber: function(){
			var index = this.keybuffer.substring(1);
			index = index-1;
			var tabs = Application.activeWindow.tabs
			if(index<=tabs.length){
				tabs[index].focus()
			}
		},
		
		/**
		 * Override function of browser.js to suppress
		 * Changetab on input of ctrl + number
		 */
		ctrlNumberTabSelection: function(event){
		  if (event.altKey && event.keyCode == KeyEvent.DOM_VK_RETURN) {
		    // XXXblake Proper fix is to just check whether focus is in the urlbar. However, focus with the autocomplete widget is all
		    // hacky and broken and there's no way to do that right now. So this just patches it to ensure that alt+enter works when focus
		    // is on a link.
		    if (!(document.commandDispatcher.focusedElement instanceof HTMLAnchorElement)) {
		      // Don't let winxp beep on ALT+ENTER, since the URL bar uses it.
		      event.preventDefault();
		      return;
		    }
		  }
		},
		
		stopEvent: function(event){
         event.preventDefault();
		   event.stopPropagation();
		},
		
		selectLink: function(){
		   if(this.keybuffer=="")
		        return;
		    var element = this.getContentWin().mlbPageData.getElementForId[this.keybuffer];   
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
		
		openConfiguration: function(){
			openDialog(MlbCommon.MLB_CHROME_URL+"/preferences/prefs.xul", "prefs", "chrome, modal, centerscreen")
		},
		
		elementFocused: function(event){
			focusedElement = document.commandDispatcher.focusedElement
			if(!this.isElementWithOverlayPositioning(focusedElement) || 
			     focusedElement.idSpan==null){
				return
			}
			focusedElement.idSpan.style.visibility="hidden"
		},
		
		elementFocusLost: function(event){
			var focusedElement = event.originalTarget
			if(!this.isElementWithOverlayPositioning(focusedElement) || 
              focusedElement.idSpan==null){
            return
         }
			if(MlbPrefs.idsForFormElementsEnabled){
            focusedElement.idSpan.style.visibility="visible"   				
			}
		},
		
		isElementWithOverlayPositioning: function(element){
			return MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.TEXT) || 
            MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.PASSWORD) ||
            MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.TEXTAREA) ||
            MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.SELECT)
      },
		
		getPageInitializer: function(){
			return mouselessbrowsing.PageInitializer
		},
		
		firefoxPopupset: new Array('PopupAutoComplete', 'contentAreaContextMenu'),
		blurActiveElement: function(event){
			for(var i=0; i<this.firefoxPopupset.length; i++) {
				if(document.getElementById(this.firefoxPopupset[i]).state=="open"){
					return
				}
			}
         getBrowser().contentDocument.activeElement.blur()			
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
			
			Utils.logMessage("Tabs changed")
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
		
		addSiteRule:function(){
			var urlbar = document.getElementById("urlbar")
			openDialog(MlbCommon.MLB_CHROME_URL+"/preferences/prefs.xul", "prefs", "chrome, modal, centerscreen", urlbar.value)
		}
   }

   var NS = rno_common.Namespace
   NS.bindToNamespace("mouselessbrowsing", "EventHandler", EventHandler)

})()