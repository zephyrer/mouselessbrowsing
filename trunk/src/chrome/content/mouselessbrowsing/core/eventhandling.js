/*
 * Mouseless Browsing 
 * This files contains all the event-handling and actions
 * Version 0.5
 * Created by Rudolf Noé
 * 31.12.2007
 */

(function(){
   
   //Imports   		
	var MlbPrefs = mouselessbrowsing.MlbPrefs
	var MlbCommon = mouselessbrowsing.MlbCommon
	var MlbUtils = mouselessbrowsing.MlbUtils
	var MlbPageInitializer = mouselessbrowsing.PageInitializer
		
   EventHandler = {
		//Keybuffer
		keybuffer: "",
		
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
		
		handleEvent: function(event){
			this.onkeydown(event)
		},
		/*
		    Main-eventhandling for every page
		*/
		onkeydown: function(event){
		    //All events are handled by the chrome window
		    var browser = window.getBrowser();
		    if(!browser){
		        return;
		    }
		    
		    if(event.shiftKey){
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
		
		    //Translation for numpad-keys
		    if(keyCode>=96 && keyCode<=105){
		        keyCode -= 48;
		    }
		    
		    //Check rules for not applying mouseless browsing
		    if( ((keyCode<48 || keyCode>57) && keyCode!=8) ||
		        (!(event.altKey || event.ctrlKey) && 
		          MLB_Utils.isWritableElement(event.originalTarget) && 
		          !this.isCaseOfExclusivlyUseOfNumpad(event))){
		        //Otherwise clear Keybuffer
		        this.resetVars();
		        return
		    }
		    
		    //Update this.keybuffer
		    if(keyCode==8)
		        this.keybuffer = this.keybuffer.substring(0,this.keybuffer.length-1);
		    else
		        this.keybuffer = this.keybuffer + String.fromCharCode(keyCode);
		    
		    //Update statusbar
		    if(MlbPrefs.showKeybufferInStatusbar){
		        this.updateStatuspanel(this.keybuffer);
		    }
		    
		    //Set flag whether link should be opened in new tab
		    this.openInNewTabFlag = this.isOpenInNewTab(event)
		    
		    //Execute automatic?
		    //If ctrl-key was pressed execution starts automatically
		    if(this.isExecuteAutomatic(event)){
		        this.timerId = setTimeout("mouselessbrowsing.EventHandler.executeAutomatic()", MlbPrefs.delayForAutoExecute);
		    }else{
		        this.timerId = setTimeout("mouselessbrowsing.EventHandler.resetVars()", MlbPrefs.timeToClearKeybuffer);
		    }
		},
		
		isExecuteAutomatic: function(event){
		    //Always if Ctrl or Alt-Key was Pressed
		    if (event.ctrlKey || event.altKey)
		        return true;
		
		    var executeAutomatic = true;
		    var srcElement = event.originalTarget;
		    if(srcElement!=null && srcElement.tagName){
		        var tagName = srcElement.tagName.toUpperCase();
		        if(MLB_Utils.isWritableElement(srcElement)){
		            executeAutomatic = false;
		        }
		    }
		    
		    return MlbPrefs.executeAutomaticEnabled && 
		        (executeAutomatic || this.isCaseOfExclusivlyUseOfNumpad(event));
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
			if(MLB_topWin.mlbPageData.elementsWithId[this.keybuffer]!=null ||
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
		        document.getElementById('urlbar').focus();
		        return;
		    }
		    
		    if(this.keybuffer=="00"){
		        document.getElementById('searchbar').mTextbox.mInputField.select();
		        return;
		    }
		    
		    
		    //Check for changing tab by number
		    
		    if(this.changeTabByNumberRegExp.test(this.keybuffer)){
		    	this.changeTabByNumber();
		    	return;
		    }
		        
		    //ThenFetch element
		    var element = MLB_topWin.mlbPageData.elementsWithId[this.keybuffer];
		    MLB_doc = element.ownerDocument;
		    MLB_currentWin = MLB_doc.defaultView;
		    //Return code for onclick-functions
		    var returnCode = true;
		    var tagName = element.tagName.toLowerCase();
		    var type = element.type?element.type.toLowerCase():null;
		    
		    if(tagName=="body"){
		        MLB_doc.defaultView.focus();
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
		    var clickEvent = MLB_doc.createEvent("MouseEvents");
		    clickEvent.initMouseEvent( "click", true, true, MLB_currentWin, 0, 0, 0, 0, 0, 
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
			
			if(MlbPrefs.visibilityMode==MlbCommon.VisibilityModes.CONFIG || MlbPrefs.visibilityMode==MlbCommon.VisibilityModes.ALL){
				MLB_previousVisibilityMode=MlbPrefs.visibilityMode;
		    	MlbPrefs.visibilityMode=MlbCommon.VisibilityModes.NONE;
		    }
		    else if (MLB_previousVisibilityMode==MlbCommon.VisibilityModes.CONFIG){
		    	MLB_previousVisibilityMode=MlbPrefs.visibilityMode;
		        MlbPrefs.visibilityMode=MlbCommon.VisibilityModes.CONFIG;
		    }
		    else {
		    	MLB_previousVisibilityMode=MlbPrefs.visibilityMode;
		        MlbPrefs.visibilityMode=MlbCommon.VisibilityModes.ALL;
		    }
		    this.updateIdsAfterToggling();
		},
		
		/*
		 * Toggles between showing the ids for the configured elements and
		 * all elements
		 */
		toggleAllIds: function(){
			MLB_previousVisibilityMode=MlbPrefs.visibilityMode;
		    if(MlbPrefs.visibilityMode==MlbCommon.VisibilityModes.NONE || MlbPrefs.visibilityMode==MlbCommon.VisibilityModes.CONFIG)
		    	MlbPrefs.visibilityMode=MlbCommon.VisibilityModes.ALL;
		    else 
		    	MlbPrefs.visibilityMode=MlbCommon.VisibilityModes.CONFIG;
		    this.updateIdsAfterToggling();
		},
		
		updateIdsAfterToggling: function(){
		   if(MlbPrefs.visibilityMode==MlbCommon.VisibilityModes.NONE)
			  MlbPrefs.disableAllIds=true;
			else
			  MlbPrefs.disableAllIds=false;
			MLB_Utils.prefs.setBoolPref("mouselessbrowsing.disableAllIds", MlbPrefs.disableAllIds);
		
		   this.setWinVariables();
			if(MlbPrefs.visibilityMode==MlbCommon.VisibilityModes.NONE){
		      MlbPrefs.idsForFormElementsEnabled = false;
		        MlbPrefs.idsForImgLinksEnabled = false;
		        MlbPrefs.idsForLinksEnabled = false;
		        MlbPrefs.idsForFramesEnabled = false;
		        this.toggleVisibilityOfSpans(MLB_topWin);
		    }else if(MlbPrefs.visibilityMode==MlbCommon.VisibilityModes.CONFIG){
		        //Setting prefs back to configured values
		        MlbPrefs.initShowIdPrefs()
		        //Todo remove
		        //MLB_ConfigManager.initShowIdPrefs();
		        //if(MLB_topWin.MLB_initialized)
		          //  this.toggleVisibilityOfSpans(MLB_topWin);
		//        else
		            //Todo change or remove
		            //MlbPageInitializer.MLB_initAll(MLB_FIRST_CALL+MLB_FINAL_CALL);
		            MlbPageInitializer.initAll();
		    }else{
		        MlbPrefs.idsForFormElementsEnabled = true;
		        MlbPrefs.idsForImgLinksEnabled = true;
		        MlbPrefs.idsForLinksEnabled = true;
		        MlbPrefs.idsForFramesEnabled = true;
		        //Todo change or remove
		        //MlbPageInitializer.MLB_initAll(MLB_FIRST_CALL+MLB_FINAL_CALL);
		        MlbPageInitializer.initAll();
		    }
		},
		
		/*
		 * Hides all Id spans
		 * Called recusvily an all frames
		 */
		toggleVisibilityOfSpans: function(winObj){
		    var spans = winObj.document.getElementsByTagName("span");
		    for(var i=0; i<spans.length; i++){
		        var span = spans[i];
		        if(!MlbUtils.isIdSpan(span))
		            continue;
		        var typeOfSpan = span.getAttribute(MlbCommon.ATTR_ID_SPAN_FOR);
		        if((typeOfSpan==MlbCommon.IdSpanTypes.FORMELEMENT && MlbPrefs.idsForFormElementsEnabled) ||
		            (typeOfSpan==MlbCommon.IdSpanTypes.FRAME && MlbPrefs.idsForFramesEnabled) ||
		            (typeOfSpan==MlbCommon.IdSpanTypes.LINK && MlbPrefs.idsForLinksEnabled) ||
		            (typeOfSpan==MlbCommon.IdSpanTypes.IMG && MlbPrefs.idsForImgLinksEnabled)){
		                span.style.display = "inline";
		         }else{
		                span.style.display = "none";
		         }
		    }
		    var frames = winObj.frames;
		    for(var i=0; i<frames.length; i++){
		        this.toggleVisibilityOfSpans(frames[i]);
		    }
		},
		
		setWinVariables: function(){
		    if(window.getBrowser()){
		        MLB_topWin = MLB_currentWin = window.getBrowser().contentWindow;
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
		        MLB_Utils.isWritableElement(lEvent.originalTarget) && 
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
		    if(this.keybuffer!="" || this.isSuppressShortCut())
		        //Then it's case of opening in new tab with postfix character
		        return;
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
		    var element = MLB_topWin.mlbPageData.elementsWithId[this.keybuffer];   
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
		  event.preventBubble();
		  event.preventCapture();
		  event.stopPropagation();
		},
		
		selectLink: function(){
		   if(this.keybuffer=="" || this.isSuppressShortCut())
		        return;
		    var element = MLB_topWin.mlbPageData.elementsWithId[this.keybuffer];   
		    if(element==null)
		        return;
		    var tagName = element.tagName.toLowerCase();
		    if(tagName!="a")
		        return;
		 	//Select Link
		   	element.focus();
		   	var range = MLB_doc.createRange();
		   	range.selectNode(element);
			var selection = MLB_currentWin.getSelection()
			selection.removeAllRanges();
			selection.addRange(range);
		
		    var clickEvent = MLB_doc.createEvent("MouseEvents");
		    clickEvent.initMouseEvent( "click", true, true, MLB_currentWin, 0, 0, 0, 0, 0, 
		        this.openInNewTabFlag, false, false, false, 2, element );
		    element.dispatchEvent(clickEvent);
			
		    this.resetVars();
		    return ShortCutManager.SUPPRESS_EVENT;
		}
   }

   var NS = rno_common.Namespace
   NS.bindToNamespace("mouselessbrowsing", "EventHandler", EventHandler)

})()