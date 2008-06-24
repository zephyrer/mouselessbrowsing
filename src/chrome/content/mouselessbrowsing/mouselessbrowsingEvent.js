/*
 * Mouseless Browsing 
 * This files contains all the event-handling and actions
 * Version 0.4.4
 * Created by Rudolf Noé
 * 30.12.2007
 */

/*
    Main-eventhandling for every page
*/
function MLB_onkeydown(event){
    //All events are handled by the chrome window
    var browser = window.getBrowser();
    if(!browser){
        return;
    }
    
    if(event.shiftKey){
    	MLB_resetVars();
    	return;
    }
    
    MLB_setWinVariables();

    //With new keystroke clear old timer
    clearTimeout(MLB_timerId);
    
    var keyCode = event.keyCode;
    
    //Suppress event if exclusive use
    if(MLB_isCaseOfExclusivlyUseOfNumpad(event)){
    	MLB_stopEvent(event);
    }

    //On enter 
    if(keyCode==13 && MLB_keybuffer!=""){
        if(MLB_shouldExecute()){
            MLB_execute();
            MLB_stopEvent(event);
        }
        MLB_resetVars();
        return;
    }

    //Translation for numpad-keys
    if(keyCode>=96 && keyCode<=105){
        keyCode -= 48;
    }
    
    //Check rules for not applying mouseless browsing
    if( ((keyCode<48 || keyCode>57) && keyCode!=8) ||
        (!(event.altKey || event.ctrlKey) && 
          Utils.isWritableElement(event.originalTarget) && 
          !MLB_isCaseOfExclusivlyUseOfNumpad(event))){
        //Otherwise clear Keybuffer
        MLB_resetVars();
        return
    }
    
    //Update keybuffer
    if(keyCode==8)
        MLB_keybuffer = MLB_keybuffer.substring(0,MLB_keybuffer.length-1);
    else
        MLB_keybuffer = MLB_keybuffer + String.fromCharCode(keyCode);
    
    //Update statusbar
    if(MLB_showKeybufferInStatusbar){
        MLB_updateStatuspanel(MLB_keybuffer);
    }
    
    //Set flag whether link should be opened in new tab
    MLB_openInNewTabFlag = MLB_isOpenInNewTab(event)
    
    //Execute automatic?
    //If ctrl-key was pressed execution starts automatically
    if(MLB_isExecuteAutomatic(event)){
        MLB_timerId = setTimeout("MLB_executeAutomatic()", MLB_delayForAutoExecute);
    }else{
        MLB_timerId = setTimeout("MLB_resetVars()", MLB_timeToClearKeybuffer);
    }
}

function MLB_isExecuteAutomatic(event){
    //Always if Ctrl or Alt-Key was Pressed
    if ((event.ctrlKey || event.altKey) && 
         !(event.ctrlKey && event.altKey))
        return true;

    var executeAutomatic = true;
    var srcElement = event.originalTarget;
    if(srcElement!=null && srcElement.tagName){
        var tagName = srcElement.tagName.toUpperCase();
        if(Utils.isWritableElement(srcElement)){
            executeAutomatic = false;
        }
    }
    
    return MLB_executeAutomaticEnabled && 
        (executeAutomatic || MLB_isCaseOfExclusivlyUseOfNumpad(event));
}

function MLB_isOpenInNewTab(event){
    return event.altKey;
}

/*
    Autoexecution function when pressed ctrl-key
*/
function MLB_executeAutomatic(){
    if(MLB_shouldExecute()){
        MLB_execute();
    }
    MLB_resetVars();
    return;
}

function MLB_shouldExecute(){
	if(MLB_topWin.MLB_elementsWithId[MLB_keybuffer]!=null ||
		MLB_globalShortCuts[MLB_keybuffer]!=null){
		return true;
	}else{
		return false;
	}
}

/*
  Execute action  
*/
function MLB_execute(){
    //First check for focusing URL-Field
    if(MLB_keybuffer=="0"){
        document.getElementById('urlbar').select();
        return;
    }
    
    if(MLB_keybuffer=="00"){
        document.getElementById('searchbar').select();
        return;
    }
    
    //If no ids visible return
    if(MLB_visibilityMode=="none"){
    	return
    }
    
    //Check for changing tab by number
    if(MLB_changeTabByNumberRegExp.test(MLB_keybuffer)){
    	MLB_changeTabByNumber();
    	return;
    }
        
    //ThenFetch element
    var element = MLB_topWin.MLB_elementsWithId[MLB_keybuffer];
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
    else if(tagName=="a" && MLB_openInNewTabFlag){
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
        MLB_openInNewTabFlag, false, false, false, 0, element );
    element.dispatchEvent(clickEvent);
 
}

/*
 * Toggles the visibility of the Ids
 */
function MLB_toggleIds(){
    if(MLB_isSuppressShortCut()){
        return;
    }
	
	if(MLB_visibilityMode=="config" || MLB_visibilityMode=="all"){
		MLB_previousVisibilityMode=MLB_visibilityMode;
    	MLB_visibilityMode="none";
    }
    else if (MLB_previousVisibilityMode=="config"){
    	MLB_previousVisibilityMode=MLB_visibilityMode;
        MLB_visibilityMode="config";
    }
    else {
    	MLB_previousVisibilityMode=MLB_visibilityMode;
        MLB_visibilityMode="all";
    }
    MLB_updateIdsAfterToggling();
}

/*
 * Toggles between showing the ids for the configured elements and
 * all elements
 */
function MLB_toggleAllIds(){
	MLB_previousVisibilityMode=MLB_visibilityMode;
    if(MLB_visibilityMode=="none" || MLB_visibilityMode=="config")
    	MLB_visibilityMode="all";
    else 
    	MLB_visibilityMode="config";
    MLB_updateIdsAfterToggling();
}

function MLB_updateIdsAfterToggling(){
    if(MLB_visibilityMode=="none")
	    MLB_disableAllIds=true;
	else
		MLB_disableAllIds=false;
	Utils.prefs.setBoolPref("mouselessbrowsing.disableAllIds", MLB_disableAllIds);

    MLB_setWinVariables();
	if(MLB_visibilityMode=="none"){
        MLB_mouselessBrowsingForFormElementsEnabled = false;
        MLB_mouselessBrowsingForImgLinksEnabled = false;
        MLB_mouselessBrowsingForLinksEnabled = false;
        MLB_mouselessBrowsingForFramesEnabled = false;
        MLB_toggleVisibilityOfSpans(MLB_topWin);
    }else if(MLB_visibilityMode=="config"){
        //Setting prefs back to configured values
        MLB_initShowIdPrefs();
        //if(MLB_topWin.MLB_initialized)
          //  MLB_toggleVisibilityOfSpans(MLB_topWin);
//        else
            MLB_initAll(MLB_topWin);
    }else{
        MLB_mouselessBrowsingForFormElementsEnabled = true;
        MLB_mouselessBrowsingForImgLinksEnabled = true;
        MLB_mouselessBrowsingForLinksEnabled = true;
        MLB_mouselessBrowsingForFramesEnabled = true;
        MLB_initAll(MLB_topWin);
    }
}

/*
 * Hides all Id spans
 * Called recusvily an all frames
 */
function MLB_toggleVisibilityOfSpans(winObj){
    var spans = winObj.document.getElementsByTagName("span");
    for(var i=0; i<spans.length; i++){
        var span = spans[i];
        if(!MLB_isIdSpan(span))
            continue;
        var typeOfSpan = span.getAttribute(MLB_idSpanForAttr);
        if((typeOfSpan==MLB_idSpanForFormElem && MLB_mouselessBrowsingForFormElementsEnabled) ||
            (typeOfSpan==MLB_idSpanForFrame && MLB_mouselessBrowsingForFramesEnabled) ||
            (typeOfSpan==MLB_idSpanForLink && MLB_mouselessBrowsingForLinksEnabled) ||
            (typeOfSpan==MLB_idSpanForImg && MLB_mouselessBrowsingForImgLinksEnabled)){
                span.style.display = "inline";
         }else{
                span.style.display = "none";
         }
    }
    var frames = winObj.frames;
    for(var i=0; i<frames.length; i++){
        MLB_toggleVisibilityOfSpans(frames[i]);
    }
}

function MLB_setWinVariables(){
    if(window.getBrowser()){
        MLB_topWin = MLB_currentWin = window.getBrowser().contentWindow;
    }
}

/*
 * Moves back or forward in history
 */ 
function MLB_moveHistory(direction){
    if(MLB_isSuppressShortCut())
        return;
    //Due to fact ff crashes otherwise a setTimeout must be applied
    if(direction=="forward")
        getBrowser().goForward();
    else
        getBrowser().goBack();
    
    return ShortCutManager.SUPPRESS_EVENT;
}

/*
 * Some shortcuts will be suppressed if they have no modifier
 * and a textfield or selectbox is focused
 */
function MLB_isSuppressShortCut(){
    var lEvent = ShortCutManager.currentEvent;
    if(MLB_isNonPrintableKey(lEvent))
    	return false;
    return !lEvent.altKey && !lEvent.ctrlKey && 
        Utils.isWritableElement(lEvent.originalTarget) && 
        !MLB_isCaseOfExclusivlyUseOfNumpad(lEvent);
}

function MLB_isNonPrintableKey(event){
	var keyCode = event.keyCode;
	if((keyCode>=112 && keyCode<=123) || keyCode<49)
		return true;
	else
		return false;
}

function MLB_resetVars(){
    MLB_keybuffer="";
    MLB_openInNewTabFlag=false;
    MLB_updateStatuspanel("");
	MLB_openContextMenu = false;
}

/*
 * scrolling up/down
 */
function MLB_scrollUpDown(direction){
    if(MLB_keybuffer!="" || MLB_isSuppressShortCut())
        //Then it's case of opening in new tab with postfix character
        return;
    MLB_setWinVariables();
    var focusedWindow = document.commandDispatcher.focusedWindow;
    if(direction=="up")
        focusedWindow.scrollBy(0, -MLB_pixelsToScroll);
    else
        focusedWindow.scrollBy(0, MLB_pixelsToScroll);
}
 /*
  * Checks wether the actual-keystroke should be suppressed
  */
function MLB_isCaseOfExclusivlyUseOfNumpad(event){
    var keyCode = event.keyCode;
    var isNumpad = keyCode>=96 && keyCode<=107 || keyCode>=109 && keyCode<=111;
    return MLB_exclusiveUseOfNumpad && isNumpad;
}

/*
 * Opens Link in a new tab
 */
function MLB_openLinkInNewTabViaPostfixKey(){
    if(MLB_keybuffer=="" || MLB_isSuppressShortCut())
        return;
    var element = MLB_topWin.MLB_elementsWithId[MLB_keybuffer];   
    if(element==null)
        return;
    var tagName = element.tagName.toLowerCase();
    if(tagName!="a")
        return;
    openNewTabWith(element.href, element);
    MLB_resetVars();
}

/*
 * Toggles the exclusive use of numpad
 */
var MLB_toggleExclusiveUseOfNumpadSecondCall = false;
function MLB_toggleExclusiveUseOfNumpad(){
    if(MLB_toggleExclusiveUseOfNumpadSecondCall==false){
         MLB_toggleExclusiveUseOfNumpadSecondCall=true;
        setTimeout("MLB_toggleExclusiveUseOfNumpadSecondCall=false", 1000);
    }else{
        MLB_exclusiveUseOfNumpad = !MLB_exclusiveUseOfNumpad;
    }
}

function MLB_updateStatuspanel(status){
	var label = "MLB ";
	if(MLB_exclusiveUseOfNumpad)
		label = label + "[Exclusive] ";
    document.getElementById("mlb-status").label= label + status;
}

function MLB_isIdSpan(element){
    return element.getAttribute && element.getAttribute(MLB_idSpanFlag)!=null;
}

function MLB_changeTabByNumber(){
	var index = MLB_keybuffer.substring(1);
	index = index-1;
	var browser = getBrowser();
	if (index >= browser.tabContainer.childNodes.length)
		return;

	var oldTab = browser.selectedTab;
  	var newTab = browser.tabContainer.childNodes[index];
  	if (newTab != oldTab) {
    	browser.selectedTab = newTab;
  	}
}

/**
 * Override function of browser.js to suppress
 * Changetab on input of ctrl + number
 */
function ctrlNumberTabSelection(event){
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
}

function MLB_stopEvent(event){
  event.preventDefault();
  event.preventBubble();
  event.preventCapture();
  event.stopPropagation();
}

function MLB_selectLink(){
   if(MLB_keybuffer=="" || MLB_isSuppressShortCut())
        return;
    var element = MLB_topWin.MLB_elementsWithId[MLB_keybuffer];   
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
        MLB_openInNewTabFlag, false, false, false, 2, element );
    element.dispatchEvent(clickEvent);
	
    MLB_resetVars();
    return ShortCutManager.SUPPRESS_EVENT;
}