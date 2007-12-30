/*
 * Mouseless Browsing 
 * Version 0.4.3
 * Created by Rudolf Noé
 * 30.12.2007
 */


/**************************************************
    Global variables
***************************************************/
//Current Version
MLB_currentVersion = "0.4.1";

//Array of Elements with Id
var MLB_elementsWithId = null;

//Element counter
var MLB_counter = 0

//Global Preferences Variables
var MLB_disableAllIds
var MLB_mouselessBrowsingForLinksEnabled
var MLB_mouselessBrowsingForImgLinksEnabled
var MLB_mouselessBrowsingForFormElementsEnabled
var MLB_mouselessBrowsingForFramesEnabled
var MLB_showKeybufferInStatusbar
var MLB_exclusiveUseOfNumpad
var MLB_showIdsOnDemand
var MLB_executeAutomaticEnabled
var MLB_delayForAutoExecute
var MLB_timeToClearKeybuffer
var MLB_styleForIdSpan
var MLB_styleForFrameIdSpan
var MLB_pixelsToScroll
var MLB_visibilityMode
var MLB_previousVisibilityMode


//Actual document-object
var MLB_doc = null;
var MLB_currentWin = null;
var MLB_topWin = null;
   
//Flag which indicates that document is already initialised
//i.e. the ids were inserted
//Used for frames
var MLB_initialized = false;

//Object used as map to store the number of Ids
//used in this window/frame and all its subframes
//Key: window.name; Value: number of ids (including the ids of all subframes)
MLB_numberOfIdsMap = null

//Object used as map to store the start-id of windows/frames
//Key: window.name; Value: start-id
MLB_startIdMap = null;

//Keybuffer
var MLB_keybuffer = "";

//Timer-id from setTimeout(..) for clearing the keybuffer
var MLB_timerId = null;

//Flag for openening link in new tab
var MLB_openInNewTabFlag = true;

//Prototype for Id-span-elment for Ids
var MLB_spanPrototype = null;
var MLB_noBrPrototype = null;

//Flag if formelements could be moved for surrounding it with a nobr-tag
var MLB_formElementsMoveable = false;

//Flag indicating wether the actual key stroke should be suppressed
//Used when numpad is exclusivly used by mouseless browsing
var MLB_suppressNumpadKey = false;

//Attribute of the id-span that flags the span as an id-span
MLB_idSpanFlag = "MLB_idSpanFlag";

//Attribute identifying the type of id-span
//Used for toggling the visibility of the id-spans
MLB_idSpanForAttr = "idSpanFor";
//Types of idSpans
MLB_idSpanForFrame = "frame";
MLB_idSpanForImg = "img";
MLB_idSpanForFormElem = "formelement";
MLB_idSpanForLink = "link";

//RegEx for checking if an link is empty
MLB_regexWhitespace = /\s/g

//ShortcutManager-ClientId
MLB_SCM_CLIENT_ID = "MLB";

//Regexp for keybuffercontent to focus special tab
MLB_changeTabByNumberRegExp = /^0[1-9]$/;

MLB_globalShortCuts = {
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
}

//Indicates wether Element should be selected and opens the context-menu
MLB_openContextMenu = false;

/**************************************************
    Global functions
***************************************************/
/*
 * Init-Function
 */
function MLB_init(){
    MLB_initPrefs();
    MLB_initShortCuts();
    MLB_initRemaining();
}

function MLB_initPrefs(){
    try{
        //Checking actual preference settings
        var prefs = Components.classes["@mozilla.org/preferences-service;1"].
                getService(Components.interfaces.nsIPrefBranch);

        //Update on new Version 
        //included since 0.4
        var oldVersion = "0";
        var prefKeyVersion = "mouselessbrowsing.version";
        if(prefs.prefHasUserValue(prefKeyVersion)){
        	oldVersion = prefs.getCharPref(prefKeyVersion);
        }
        if (oldVersion<MLB_currentVersion){
           	MLB_updateToVersion041();
           	prefs.setCharPref(prefKeyVersion, MLB_currentVersion);
        }
        
		MLB_initShowIdPrefs();
		MLB_showIdsOnDemand = prefs.getBoolPref("mouselessbrowsing.showIdsOnDemand");
        MLB_showKeybufferInStatusbar = prefs.getBoolPref("mouselessbrowsing.showKeybufferInStatusbar");
        MLB_exclusiveUseOfNumpad = prefs.getBoolPref("mouselessbrowsing.exclusiveNumpad");
        MLB_executeAutomaticEnabled = prefs.getBoolPref("mouselessbrowsing.executeAutomatic");
        MLB_delayForAutoExecute = prefs.getCharPref("mouselessbrowsing.autoExecuteDelay");
        MLB_timeToClearKeybuffer = prefs.getCharPref("mouselessbrowsing.autoExecuteDelay");
        MLB_pixelsToScroll = prefs.getCharPref("mouselessbrowsing.pixelsToScroll");
        MLB_styleForIdSpan = prefs.getCharPref("mouselessbrowsing.styleForIdSpan");
        MLB_styleForFrameIdSpan = prefs.getCharPref("mouselessbrowsing.styleForFrameIdSpan");
        MLB_disableAllIds = prefs.getBoolPref("mouselessbrowsing.disableAllIds");
        MLB_visibilityMode = MLB_disableAllIds==false?"config":"none";
        MLB_previousVisibilityMode = "config";
        try{
        	MLB_updateIdsAfterToggling();
        }catch(e){}
    }catch(e){alert(e)}
}

/*
 * Sepearte function for reuse when toggling visibility of spans
 */
function MLB_initShowIdPrefs(){
    var prefs = Components.classes["@mozilla.org/preferences-service;1"].
         getService(Components.interfaces.nsIPrefBranch);
	MLB_mouselessBrowsingForLinksEnabled = prefs.getBoolPref("mouselessbrowsing.enableLinkIds");
    MLB_mouselessBrowsingForImgLinksEnabled = prefs.getBoolPref("mouselessbrowsing.enableImgLinkIds");
    MLB_mouselessBrowsingForFormElementsEnabled = prefs.getBoolPref("mouselessbrowsing.enableFormElementIds");
	MLB_mouselessBrowsingForFramesEnabled = prefs.getBoolPref("mouselessbrowsing.enableFrameIds");
}

function MLB_updateToVersion041(){
    var prefs = Components.classes["@mozilla.org/preferences-service;1"].
        getService(Components.interfaces.nsIPrefBranch);
    
    //Update style for links to eliminate free floating links :-)
    var styleForLinks = Utils.getCharPref("mouselessbrowsing.styleForIdSpan");
    //If new installation do nothing, default will be used
    if(styleForLinks==null)
        return;

    //update to Version 0.3.1
    var relativeStlyeRegExp = /position:relative[\s]*;*/;
    if(relativeStlyeRegExp.test(styleForLinks)){
    	styleForLinks =  styleForLinks.replace(relativeStlyeRegExp, "");
	    styleForLinks =  styleForLinks.replace(/left\s*:\s*2\s*(px)*[\s]*;*/, "");
    	styleForLinks =  styleForLinks.replace(/top\s*:\s*-2\s*(px)*[\s]*;*/, "");
    	styleForLinks =  "margin-left:2px;" + styleForLinks;
    }

	//Update to version 0.4
	//Test if float:none entry is already there
	if(!/float\s*:\s*none/.test(styleForLinks)){
		styleForLinks = "float:none;" + styleForLinks;
	}
	prefs.setCharPref("mouselessbrowsing.styleForIdSpan", styleForLinks);
	Utils.logMessage("Mouseless Browsing: The style for the Ids was updated to eliminate misplacing :-)");
	
	//Set Shortcut-pref for toggling to show all ids
	var shortcutToggleIds = prefs.getCharPref("mouselessbrowsing.keys.toggleMLB");
	if(shortcutToggleIds!=null && !isNaN(shortcutToggleIds)){
		shortcutToggleIds = parseInt(shortcutToggleIds,10);
		prefs.setCharPref("mouselessbrowsing.keys.toggleAllIds", shortcutToggleIds|ShortCutManager.CTRL);
		Utils.logMessage("Mouseless Browsing: Shortcut-Pref for toggling to show all Ids set");
	}
}

function MLB_initShortCuts(){
	var prefs = Components.classes["@mozilla.org/preferences-service;1"].
                getService(Components.interfaces.nsIPrefBranch);
    ShortCutManager.clearAllShortCutsForClientId(MLB_SCM_CLIENT_ID);
    MLB_allCombinedShortCutKeys = null;

    var combinedKeyCode = prefs.getCharPref("mouselessbrowsing.keys.toggleMLB");
    ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode, "MLB_toggleIds()", MLB_SCM_CLIENT_ID);
    if(MLB_automaticCtrlShortCut(combinedKeyCode)){
        ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode | ShortCutManager.CTRL, "MLB_toggleIds()", MLB_SCM_CLIENT_ID);
    }
    
	combinedKeyCode = prefs.getCharPref("mouselessbrowsing.keys.toggleAllIds");
    ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode, "MLB_toggleAllIds()", MLB_SCM_CLIENT_ID);
    if(MLB_automaticCtrlShortCut(combinedKeyCode)){
        ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode | ShortCutManager.CTRL, "MLB_toggleAllIds()", MLB_SCM_CLIENT_ID);
    }
    
    combinedKeyCode = prefs.getCharPref("mouselessbrowsing.keys.historyBack");
    ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode, "MLB_moveHistory('back')", MLB_SCM_CLIENT_ID);
    if(MLB_automaticCtrlShortCut(combinedKeyCode)){
        ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode | ShortCutManager.CTRL, "MLB_moveHistory('back')", MLB_SCM_CLIENT_ID);
    }

    combinedKeyCode = prefs.getCharPref("mouselessbrowsing.keys.historyForward");
    ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode, "MLB_moveHistory('forward')", MLB_SCM_CLIENT_ID);
    if(MLB_automaticCtrlShortCut(combinedKeyCode)){
        ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode | ShortCutManager.CTRL, "MLB_moveHistory('forward')", MLB_SCM_CLIENT_ID);
    }
    
    combinedKeyCode = prefs.getCharPref("mouselessbrowsing.keys.clearKeybuffer");
    ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode, "MLB_resetVars()", MLB_SCM_CLIENT_ID);
    
    combinedKeyCode = prefs.getCharPref("mouselessbrowsing.keys.scrollDown");
    ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode, "MLB_scrollUpDown('down')", MLB_SCM_CLIENT_ID);
    
    combinedKeyCode = prefs.getCharPref("mouselessbrowsing.keys.scrollUp");
    ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode, "MLB_scrollUpDown('up')", MLB_SCM_CLIENT_ID);
    
    combinedKeyCode = prefs.getCharPref("mouselessbrowsing.keys.openInNewTabPostfixKey");
    ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode, "MLB_openLinkInNewTabViaPostfixKey()", MLB_SCM_CLIENT_ID);
    
    combinedKeyCode = prefs.getCharPref("mouselessbrowsing.keys.selectLink");
    ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode, "MLB_selectLink()", MLB_SCM_CLIENT_ID);

    //Toggling exclusive use with dobble stroke of numpad-key
    ShortCutManager.addJsShortCutWithCombinedKeyCode(2304, "MLB_toggleExclusiveUseOfNumpad()", MLB_SCM_CLIENT_ID);

    combinedKeyCode = prefs.getCharPref("mouselessbrowsing.keys.toggleExlusiveUseOfNumpad");
    if(combinedKeyCode!=2304)
	    ShortCutManager.addJsShortCutWithCombinedKeyCode(combinedKeyCode, "MLB_exclusiveUseOfNumpad = !MLB_exclusiveUseOfNumpad;", MLB_SCM_CLIENT_ID);

}

MLB_allCombinedShortCutKeys = null;
function MLB_automaticCtrlShortCut(combinedKeyCode){
	if(MLB_hasModifier(combinedKeyCode))
		return false;

	if(MLB_allCombinedShortCutKeys==null){
		MLB_allCombinedShortCutKeys = new Object();
		var prefs = Components.classes["@mozilla.org/preferences-service;1"].
                    getService(Components.interfaces.nsIPrefService);
		var branch = prefs.getBranch("mouselessbrowsing.keys.");
		var allKeys = branch.getChildList ( '', {});
		for(var i=0; i<allKeys.length; i++){
			var combinedPrefKeyCode = branch.getCharPref(allKeys[i]);
			MLB_allCombinedShortCutKeys[combinedPrefKeyCode] = combinedPrefKeyCode;
		}
	}
	if(MLB_allCombinedShortCutKeys[combinedKeyCode]!=null)
		return false;
}

function MLB_hasModifier(combinedKeyCode){
    return (combinedKeyCode & 0xF) != 0;
}

function MLB_initRemaining(){
    //Display keybuffer in statusbar?
    var statusbarpanel = document.getElementById("mlb-status");
    if(MLB_showKeybufferInStatusbar){
        statusbarpanel.style.display="block";
    }else{
        statusbarpanel.style.display="none";
    }
}


/*
    Onload-function for every page
    Registered in mouselessbrowsingOverlay.js
*/
function MLB_doOnload(event){

    //var start = (new Date()).getTime();
    
    //Setting actual window, document object and top-Window
    //Must be set for the eventuality that Ids are switched on
    MLB_currentWin = event.originalTarget.defaultView;
        
    MLB_doc = MLB_currentWin.document;
    MLB_topWin = MLB_currentWin.top;

    if(MLB_disableAllIds==true || MLB_showIdsOnDemand==true){
    	MLB_visibilityMode="none";
    	MLB_previousVisibilityMode="config"
    	if(MLB_hasIdSpans(MLB_currentWin))
			MLB_updateIdsAfterToggling();
    	return;
   	}

    if(!MLB_mouselessBrowsingForLinksEnabled && !MLB_mouselessBrowsingForFormElementsEnabled &&
        !MLB_mouselessBrowsingForImgLinksEnabled && !MLB_mouselessBrowsingForFramesEnabled){
        return;
    }
    
	if(MLB_topWin!=MLB_currentWin && !MLB_topWin.MLB_initialized){
        return;
    }
    
    if(MLB_topWin.MLB_initialized){
        MLB_reloadFrame();
    }else{
        MLB_initAll(MLB_topWin);
    }
    
    //Dumping consumed time
    //dump("MouselessBrowsing: Initialization takes " + ((new Date()).getTime() - start) + " msec\n");
}

function MLB_initAll(topWin){
    MLB_currentWin = topWin;
    //Initilize elementsWithId-Array
    topWin.MLB_elementsWithId = new Array(1000)
    
    topWin.MLB_counter = 0;
    topWin.MLB_numberOfIdsMap = new Object();
    topWin.MLB_startIdMap = new Object();
    MLB_initFrame(topWin);
    topWin.MLB_initialized=true;
}

function MLB_initFrame(win){

    MLB_currentWin = win;
    MLB_doc = win.document;
    var topWin = null;
    if(win.top!=null){
        topWin = win.top;
    }else{
        topWin = win;
    }
    //Saving start Id
    var startId = topWin.MLB_counter;   

    //First the frame ids
    if(MLB_mouselessBrowsingForFramesEnabled && MLB_doc){
        MLB_initFramesIds();
    }

    if(MLB_mouselessBrowsingForFormElementsEnabled && MLB_doc){
        MLB_initFormElements()
    }    

    if((MLB_mouselessBrowsingForLinksEnabled || MLB_mouselessBrowsingForImgLinksEnabled) 
        && MLB_doc){
        MLB_initLinks()
    }

    //Fuer alle Frames
    for(var i = 0; i<win.frames.length; i++){
        MLB_initFrame(win.frames[i]);
    }
    //Saving end counter    
    var endId = topWin.MLB_counter;
    topWin.MLB_numberOfIdsMap[win.name]=endId-startId;
    topWin.MLB_startIdMap[win.name]=startId;
}

function MLB_reloadFrame(){
    var win = MLB_currentWin;
    var topWin = win.top;
    var oldNumberOfIds = topWin.MLB_numberOfIdsMap[win.name];
    var startId = topWin.MLB_counter = topWin.MLB_startIdMap[win.name];
    MLB_initFrame(win);
    var actNumberOfIds = topWin.MLB_counter - startId;
    if(actNumberOfIds>oldNumberOfIds){
        MLB_initAll(topWin);
    }
}

/*
 * Init Frame-Ids
 */
function MLB_initFramesIds(){
    for(var i = 0; i<MLB_currentWin.frames.length; i++){
    	var frame = MLB_currentWin.frames[i];
    	if(frame.idSpan!=null){
        	if(MLB_mouselessBrowsingForFramesEnabled){
        		frame.idSpan.innerHTML=MLB_getNextId();
            	frame.idSpan.style.display = "inline";
        	}else{
        		frame.idSpan.style.display = "none";	            	
            }
        }else{
	        var idSpan = MLB_getNewSpan(MLB_idSpanForFrame);
	        //Setting different style
	        idSpan.style.cssText = MLB_styleForFrameIdSpan;
	        var doc = MLB_currentWin.frames[i].document
	        var body = doc.body;
	        //FF 3.0 idSpan must be imported
	        idSpan = doc.importNode(idSpan, true)
	        body.insertBefore(idSpan, body.firstChild);
	        MLB_currentWin.frames[i].idSpan = idSpan;
	    }
        MLB_topWin.MLB_elementsWithId[MLB_topWin.MLB_counter] = body;
    }
}

/*
    Init for Links
*/
function MLB_initLinks(){
    //Iteration over links
    var links = MLB_doc.getElementsByTagName("A");
    for(var i=0; i<links.length; i++){
        var link = links[i];
        //is there anything noteworth
        if (!MLB_isMarkableLink(link))
            continue;

        //display image links?
        var hasOnlyImgLink = MLB_hasOnlyImgChilds(link);
        if(link.idSpan==null &&
        	((hasOnlyImgLink && !MLB_mouselessBrowsingForImgLinksEnabled) ||
            (!hasOnlyImgLink && !MLB_mouselessBrowsingForLinksEnabled))){
            continue;
        }
        //Is there already a span with the id
        if(link.idSpan!=null){
        	if(hasOnlyImgLink && MLB_mouselessBrowsingForImgLinksEnabled ||
        		!hasOnlyImgLink && MLB_mouselessBrowsingForLinksEnabled){
        		link.idSpan.innerHTML=MLB_getNextId();
            	link.idSpan.style.display = "inline";
        	}else{
        		link.idSpan.style.display = "none";	            	
            }
        }else{
            if(hasOnlyImgLink)
                var newSpan = MLB_getNewSpan(MLB_idSpanForImg);
            else
                var newSpan = MLB_getNewSpan(MLB_idSpanForLink);
            //Append to last element in link except for imgages
            var appender = link;
            var lastChild = link.lastChild;
            if(link.hasChildNodes() && lastChild.nodeType==Node.ELEMENT_NODE && 
                lastChild.tagName.toLowerCase()!="img"){
                appender = lastChild;
            }
            appender.appendChild(newSpan);
            newSpan.style.display = "inline"
            //If id was appended to img, adjust position
            /*
            if(newSpan.previousSibling && Utils.isTagName(newSpan.previousSibling, "img")){
                var img = newSpan.previousSibling;
                var left = img.offsetLeft - newSpan.offsetLeft;
                var top = img.offsetTop - newSpan.offsetTop;
                newSpan.style.left = left;
                newSpan.style.top = top;
                Utils.logMessage("Postioning: Left: " + left + " Top: " + top);
                newSpan.style.position = "relative";
            }*/
            link.idSpan=newSpan;
        }
        MLB_topWin.MLB_elementsWithId[MLB_topWin.MLB_counter] = link;
    }
}

function MLB_hasOnlyImgChilds(element){
    if(!element.hasChildNodes())
        return false;
    var childNodes = element.childNodes;
    for(var i=0; i<childNodes.length; i++){
        var childNode = childNodes[i];
        //Id-Spans will be ignored
        if(MLB_isIdSpan(childNode))
            continue;
        if(childNode.hasChildNodes()){
            var flag = MLB_hasOnlyImgChilds(childNode);
            if(!flag)
                return false;
        }
        if(!Utils.isEmptyTextNode(childNode) && !Utils.isTagName(childNode, "img"))
            return false;
    }
    return true;
}

/*
    Init for form-elements
*/
function MLB_initFormElements(){
    MLB_checkIfFormElementsCouldBeMoved();
    //Iteration over form elements
    var formelements = MLB_doc.getElementsByTagName("input");
    MLB_addIdToFormElements(formelements);
    formelements = MLB_doc.getElementsByTagName("select");
    MLB_addIdToFormElements(formelements);
    formelements = MLB_doc.getElementsByTagName("button");
    MLB_addIdToFormElements(formelements);
    formelements = MLB_doc.getElementsByTagName("textarea");
    MLB_addIdToFormElements(formelements);
}

/*
 * Checks whether a form element could be moved
 * Reason: if moveable a <nobr>-elment could be put around
 * the form element and id-span 
 */ 
function MLB_checkIfFormElementsCouldBeMoved(){
    if(!MLB_doc.forms || MLB_doc.forms.length<=0){
        MLB_formElementsMoveable = false;
        return;
    }
    var newFormElem = MLB_doc.createElement("input");
    newFormElem = MLB_doc.forms[0].appendChild(newFormElem);
    if(newFormElem.forms!=null){
        MLB_formElementsMoveable = true;
    }else{
        MLB_formElementsMoveable = false;
    }
    MLB_doc.forms[0].removeChild(newFormElem);
}

function MLB_addIdToFormElements(nodeList){
    for(var i=0; i<nodeList.length; i++){
        var element = nodeList.item(i);
        if(element.type=="hidden"){
            continue;
        }
        var parent = element.parentNode;
        if(element.idSpan!=null){
        	if(MLB_mouselessBrowsingForFormElementsEnabled){
            	element.idSpan.innerHTML = MLB_getNextId();
            	element.idSpan.style.display = "inline";
            }else{
            	element.idSpan.style.display = "none";
            }
        }else {
            MLB_adjustLength(element)
            var newSpan = MLB_getNewSpan(MLB_idSpanForFormElem);
            if(MLB_formElementsMoveable){
                var nobr = MLB_getNoBr();
                nobr = parent.insertBefore(nobr, element);
                element = parent.removeChild(element);
                nobr.appendChild(element);
                nobr.appendChild(newSpan);
            }else{
                if(element.nextSibling!=null){
                    parent.insertBefore(newSpan, element.nextSibling);
                }else{
                    parent.appendChild(newSpan);
                }
            }
            newSpan.style.display = "inline";
            element.idSpan = newSpan;
        }
        MLB_topWin.MLB_elementsWithId[MLB_topWin.MLB_counter] = element;
    }
}

function MLB_adjustLength(element){
    var isTextOrPassword = Utils.isTagName(element, "INPUT") && 
                            (element.type=="text" || element.type=="password")
    var isSelectbox = Utils.isTagName(element, "SELECT"); 
    /*var isButton = Utils.isTagName(element, "BUTTON") || 
        (Utils.isTagName(element, "SELECT") && (element.type="button" || element.type="text"));*/
    var isBiggerThan = element.offsetWidth && element.offsetWidth>=100;
    if((isTextOrPassword || isSelectbox) && isBiggerThan){
        element.style.width = (element.offsetWidth-20)+"px";
    }
}

/*
    Gets new span for id; 
    updates counter
*/
function MLB_getNewSpan(typeOfSpan){
    var newSpan = MLB_createSpan();
    newSpan.innerHTML = MLB_getNextId();
    //Setting the type the element the id span is created for
    newSpan.setAttribute(MLB_idSpanForAttr, typeOfSpan);
    return newSpan;
}

function MLB_createSpan(){
    if(MLB_spanPrototype==null){
        //span
        var span = MLB_doc.createElement("span");
        span.style.cssText = MLB_styleForIdSpan;
        //initially hidden
        span.style.display = "none";
        //Mark this span as id-span
        span.setAttribute(MLB_idSpanFlag, "true", true);
        MLB_spanPrototype = span;
    }
    if(MLB_spanPrototype.style.cssText!=MLB_styleForIdSpan){
        MLB_spanPrototype.style.cssText=MLB_styleForIdSpan;
    }
    return MLB_doc.importNode(MLB_spanPrototype, true);
}

function MLB_getNoBr(){
    if(MLB_noBrPrototype==null){
        MLB_noBrPrototype = MLB_doc.createElement("nobr");
    }
    return MLB_noBrPrototype.cloneNode(true);
}

function MLB_getNextId(){
    MLB_topWin.MLB_counter = MLB_topWin.MLB_counter+1;
    //Due to bug in seldom cases, check for NaN-Ids
    if(MLB_topWin.MLB_counter==NaN){
        MLB_initAll(MLB_topWin);
    }
    return MLB_topWin.MLB_counter;
}

/*
 * Checks wether an id span should be appended to an link
 */
function MLB_isMarkableLink(link){
    //No real link
    if(link.getAttribute("href") == null && link.getAttribute("onclick") == null) 
        return false;

    //Img Link is ok    
    if(link.getElementsByTagName("img").length>0)
        return true;
        
    //empty link
    if(link.innerHTML=="" || !link.text || link.text.replace(MLB_regexWhitespace, "").length==0)
        return false;
                
    return true;
}

function MLB_hasIdSpans(winObj){
	var spans = winObj.document.getElementsByTagName("span");
    for(var i=0; i<spans.length; i++){
        if(MLB_isIdSpan(spans[i]))
            return true;
    }
    return false;
}