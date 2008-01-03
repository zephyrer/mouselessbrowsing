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
		
		//global varials
		currentWin: null,
		currentTopWin: null,
		currentDoc: null,
		
		//Flag for openening link in new tab
		openInNewTabFlag: true,
		
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
		onkeydown: function(event){
		   //All events are handled by the chrome window
		   var browser = window.getBrowser();
		   if(!browser){
		      return;
		   }
		    
		   if(event.shiftKey ||
		      MlbPrefs.visibilityMode==MlbCommon.VisibilityModes.NONE){
            this.resetVars();
		    	return;
		   }
		    
		   this.setWinVariables();
		
		   //With new keystroke clear old timer
		   clearTimeout(this.timerId);
		    
		   var keyCode = event.keyCode;
		    
		   //Suppress event if exclusive use
		   if(this.isCaseOfExclusivlyUseOfNumpad(event)){
		   	this.stopEvent(event);
		   }
		
		   //On enter 
		   if(keyCode==13 && this.keybuffer!=""){
		       if(this.shouldExecute()){
		           this.execute();
		           this.stopEvent(event);
		       }
		       this.resetVars();
		       return;
		   }
		
		   //Translation for numpad-keys (NUMPAD0-NUMPAD9)
		   if(keyCode>=96 && keyCode<=105){
		       keyCode -= 48;
		   }
		    
		   //Check rules for not applying mouseless browsing
		   var numberWasPressed =  keyCode>=KeyboardEvent.DOM_VK_0 && keyCode<=KeyboardEvent.DOM_VK_9
		   var backspaceWasPressed = keyCode==KeyboardEvent.DOM_VK_BACK_SPACE
		   
		   //Reset vars if...
		   if( (!numberWasPressed && !backspaceWasPressed) ||
		       (!(event.altKey || event.ctrlKey) && 
		         MlbUtils.isWritableElement(event.originalTarget) && 
		         !this.isCaseOfExclusivlyUseOfNumpad(event))){
		       this.resetVars();
		       return
		   }
		    
			//Update this.keybuffer
			if(backspaceWasPressed){
			   this.keybuffer = this.keybuffer.substring(0,this.keybuffer.length-1);
			}else{
			   this.keybuffer = this.keybuffer + String.fromCharCode(keyCode);
			}
			//Update statusbar
			if(MlbPrefs.showKeybufferInStatusbar){
			   this.updateStatuspanel(this.keybuffer);
			}
			
			//Set flag whether link should be opened in new tab
			this.openInNewTabFlag = this.isOpenInNewTab(event)
			
			if(this.isExecuteAutomatic(event)){
			   this.timerId = setTimeout("mouselessbrowsing.EventHandler.executeAutomatic()", MlbPrefs.delayForAutoExecute);
			}else{
			   this.timerId = setTimeout("mouselessbrowsing.EventHandler.resetVars()", MlbPrefs.delayForAutoExecute);
			}
		},
		
		isExecuteAutomatic: function(event){
		    //Always if Ctrl or Alt-Key was Pressed
		    if (event.ctrlKey || event.altKey){
		       return true
		    }else if(MlbPrefs.executeAutomaticEnabled==false){
		       return false
		    }else if(this.isCaseOfExclusivlyUseOfNumpad(event) ||
		             !MlbUtils.isWritableElement(event.orginalTarget.srcElement)){
		       return true
		    }else{
		       return false
		    }
		},
			
		isOpenInNewTab: function(event){
		    return event.altKey;
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
			if(this.currentTopWin.mlbPageData.elementsWithId[this.keybuffer]!=null ||
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
		    var element = this.currentTopWin.mlbPageData.getElementForId(this.keybuffer);
		    this.currentDoc = element.ownerDocument;
		    this.currentWin = this.currentDoc.defaultView;
		    //Return code for onclick-functions
		    var returnCode = true;
		    var tagName = element.tagName.toLowerCase();
		    var type = element.type?element.type.toLowerCase():null;
		    
		    if(tagName=="body"){
		        this.currentDoc.defaultView.focus();
		        return;
		    }
		    //If it is text- or password-field
		    if((tagName=="input" && (type=="text" || type=="password")) ||
		        tagName=="textarea"){
		            element.select();
		    } 
		    //If its an anchor and it should be openend in a new Tab
		    else if(tagName=="a" && this.openInNewTabFlag){
		        openNewTabWith(element.href, element);
		        return;
		    }
		    //In every other case try to focus
		    else {
		        try{
		            element.focus();
		        }catch(e){}
		    }
		    	
		    //And simulate click
		    var clickEvent = this.currentDoc.createEvent("MouseEvents");
		    clickEvent.initMouseEvent( "click", true, true, this.currentWin, 0, 0, 0, 0, 0, 
		        this.openInNewTabFlag, false, false, false, 0, element );
		    element.dispatchEvent(clickEvent);
		 
		},
		
		/*
		 * Toggles the visibility of the Ids
		 */
		toggleIds: function(){
		   if(this.isSuppressShortCut()){
		    return;
		   }
		   this.setWinVariables();
			
			if(MlbPrefs.visibilityMode==MlbCommon.VisibilityModes.CONFIG || MlbPrefs.visibilityMode==MlbCommon.VisibilityModes.ALL){
				GlobalData.previousVisibilityMode=MlbPrefs.visibilityMode;
		    	MlbPrefs.visibilityMode=MlbCommon.VisibilityModes.NONE;
		    }
		    else if (GlobalData.previousVisibilityMode==MlbCommon.VisibilityModes.CONFIG){
		       GlobalData.previousVisibilityMode=MlbPrefs.visibilityMode;
		       MlbPrefs.visibilityMode=MlbCommon.VisibilityModes.CONFIG;
		    }
		    else {
		       GlobalData.previousVisibilityMode=MlbPrefs.visibilityMode;
		       MlbPrefs.visibilityMode=MlbCommon.VisibilityModes.ALL;
		    }
		    this.updateIdsAfterToggling();
		    return ShortCutManager.SUPPRESS_KEY
		},
		
		/*
		 * Toggles between showing the ids for the configured elements and
		 * all elements
		 */
		toggleAllIds: function(){
			GlobalData.previousVisibilityMode=MlbPrefs.visibilityMode;
		   if(MlbPrefs.visibilityMode==MlbCommon.VisibilityModes.NONE || 
		      MlbPrefs.visibilityMode==MlbCommon.VisibilityModes.CONFIG){
		    	MlbPrefs.visibilityMode=MlbCommon.VisibilityModes.ALL;
		   }else{ 
		    	MlbPrefs.visibilityMode=MlbCommon.VisibilityModes.CONFIG;
		   }
		   this.updateIdsAfterToggling();
		},
		
		updateIdsAfterToggling: function(){
		   if(MlbPrefs.visibilityMode==MlbCommon.VisibilityModes.NONE){
			   MlbPrefs.disableAllIds=true;
		   }else{
			   MlbPrefs.disableAllIds=false;
		   }
			Prefs.setBoolPref("mouselessbrowsing.disableAllIds", MlbPrefs.disableAllIds);
		
		   this.setWinVariables();
			if(MlbPrefs.visibilityMode==MlbCommon.VisibilityModes.NONE){
		       MlbPrefs.idsForFormElementsEnabled = false;
		       MlbPrefs.idsForImgLinksEnabled = false;
		       MlbPrefs.idsForLinksEnabled = false;
		       MlbPrefs.idsForFramesEnabled = false;
		       this.hideIdSpans(this.currentTopWin);
		       //Reset PageData
		       this.currentTopWin.mlbPageData = new mouselessbrowsing.PageData()
		    }else if(MlbPrefs.visibilityMode==MlbCommon.VisibilityModes.CONFIG){
		       //Setting prefs back to configured values
		       MlbPrefs.initShowIdPrefs()
		       this.getPageInitializer().initAll();
		    }else{
		        MlbPrefs.idsForFormElementsEnabled = true;
		        MlbPrefs.idsForImgLinksEnabled = true;
		        MlbPrefs.idsForLinksEnabled = true;
		        MlbPrefs.idsForFramesEnabled = true;
		        this.getPageInitializer().initAll();
		    }
		},
		
		/*
		 * Hides all Id spans
		 * Called recusvily an all frames
		 */
		hideIdSpans: function(winObj){
		    var spans = winObj.document.getElementsByTagName("span");
		    for(var i=0; i<spans.length; i++){
		        var span = spans[i];
		        if(!MlbUtils.isIdSpan(span)){
		            continue;
		        }
               span.style.display = "none";
		    }
		    var frames = winObj.frames;
		    for(var i=0; i<frames.length; i++){
		        this.hideIdSpans(frames[i]);
		    }
		},
		
		setWinVariables: function(){
		    if(window.getBrowser()){
		        this.currentTopWin = this.currentWin = window.getBrowser().contentWindow;
		    }
		},
		
		/*
		 * Moves back or forward in history
		 */ 
		moveHistory: function(direction){
		    if(this.isSuppressShortCut())
		        return;
		    //Due to fact ff crashes otherwise a setTimeout must be applied
		    if(direction=="forward")
		        getBrowser().goForward();
		    else
		        getBrowser().goBack();
		    
		    return ShortCutManager.SUPPRESS_EVENT;
		},
		
		/*
		 * Some shortcuts will be suppressed if they have no modifier
		 * and a textfield or selectbox is focused
		 */
		isSuppressShortCut: function(){
		    var lEvent = ShortCutManager.currentEvent;
		    if(this.isNonPrintableKey(lEvent))
		    	return false;
		    return !lEvent.altKey && !lEvent.ctrlKey && 
		        MlbUtils.isWritableElement(lEvent.originalTarget) && 
		        !this.isCaseOfExclusivlyUseOfNumpad(lEvent);
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
		    if(this.keybuffer!="" || this.isSuppressShortCut()){
		        //Then it's case of opening in new tab with postfix character
		        return;
		    }
		    this.setWinVariables();
		    var focusedWindow = document.commandDispatcher.focusedWindow;
		    if(direction=="up")
		        focusedWindow.scrollBy(0, -MlbPrefs.pixelsToScroll);
		    else
		        focusedWindow.scrollBy(0, MlbPrefs.pixelsToScroll);
		},
		 /*
		  * Checks wether the actual-keystroke should be suppressed
		  */
		isCaseOfExclusivlyUseOfNumpad: function(event){
		    var keyCode = event.keyCode;
		    var isNumpad = keyCode>=96 && keyCode<=107 || keyCode>=110 && keyCode<=111;
		    return MlbPrefs.exclusiveUseOfNumpad && isNumpad;
		},
		
		/*
		 * Opens Link in a new tab
		 */
		openLinkInNewTabViaPostfixKey: function(){
		    if(this.keybuffer=="" || this.isSuppressShortCut())
		        return;
		    var element = this.currentTopWin.mlbPageData.elementsWithId[this.keybuffer];   
		    if(element==null)
		        return;
		    var tagName = element.tagName.toLowerCase();
		    if(tagName!="a")
		        return;
		    openNewTabWith(element.href, element);
		    this.resetVars();
		},
		
		/*
		 * Toggles the exclusive use of numpad
		 */
		toggleExclusiveUseOfNumpadSecondCall: false,
		toggleExclusiveUseOfNumpad: function(){
		    if(this.toggleExclusiveUseOfNumpadSecondCall==false){
		         this.toggleExclusiveUseOfNumpadSecondCall=true;
		        setTimeout("this.toggleExclusiveUseOfNumpadSecondCall=false", 1000);
		    }else{
		        MlbPrefs.exclusiveUseOfNumpad = !MlbPrefs.exclusiveUseOfNumpad;
		    }
		},
		
		updateStatuspanel: function(status){
			var label = "MLB 0.5";
			if(MlbPrefs.exclusiveUseOfNumpad)
				label = label + " [Exclusive] ";
		    document.getElementById("mlb-status").label= label + status;
		},
		
		changeTabByNumber: function(){
			var index = this.keybuffer.substring(1);
			index = index-1;
			var browser = getBrowser();
			if (index >= browser.tabContainer.childNodes.length)
				return;
		
			var oldTab = browser.selectedTab;
		  	var newTab = browser.tabContainer.childNodes[index];
		  	if (newTab != oldTab) {
		    	oldTab.selected = false;
		    	browser.selectedTab = newTab;
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
         //needed?
//		   event.preventBubble();
//		   event.preventCapture();
		   event.stopPropagation();
		},
		
		selectLink: function(){
		   if(this.keybuffer=="" || this.isSuppressShortCut())
		        return;
		    var element = this.currentTopWin.mlbPageData.elementsWithId[this.keybuffer];   
		    if(element==null)
		        return;
		    var tagName = element.tagName.toLowerCase();
		    if(tagName!="a")
		        return;
		 	//Select Link
		   	element.focus();
		   	var range = this.currentDoc.createRange();
		   	range.selectNode(element);
			var selection = this.currentWin.getSelection()
			selection.removeAllRanges();
			selection.addRange(range);
		
		    var clickEvent = this.currentDoc.createEvent("MouseEvents");
		    clickEvent.initMouseEvent( "click", true, true, this.currentWin, 0, 0, 0, 0, 0, 
		        this.openInNewTabFlag, false, false, false, 2, element );
		    element.dispatchEvent(clickEvent);
			
		    this.resetVars();
		    return ShortCutManager.SUPPRESS_EVENT;
		},
		
		openConfiguration: function(){
			openDialog(MlbCommon.MLB_CHROME_URL+"/preferences/prefs.xul", "prefs", "chrome, modal, centerscreen")
		},
		
		getPageInitializer: function(){
			return mouselessbrowsing.PageInitializer
		}
   }

   var NS = rno_common.Namespace
   NS.bindToNamespace("mouselessbrowsing", "EventHandler", EventHandler)

})()