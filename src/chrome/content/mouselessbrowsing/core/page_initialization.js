/*
 * Mouseless Browsing 
 * Version 0.4.1
 * Created by Rudolf Noé
 * 01.07.2005
 *
 * Licence Statement
 * Version:  MPL 1.1
 *
 * The contents of this file are subject to the Mozilla Public License
 * Version 1.1  (the "License"); you may  not use this  file except in
 * compliance with the License.  You  may obtain a copy of the License
 * at http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See
 * the  License  for  the   specific  language  governing  rights  and
 * limitations under the License.
 */


/*
 * Global variables for page initilization
 */

var MLB_previousVisibilityMode = "config";

//Variables which contain objects of webpage, which is
//actually initialized
var MLB_doc = null;
var MLB_currentWin = null;
var MLB_topWin = null;

//Prototype for Id-span-elment for Ids
var MLB_spanPrototype = null;
var MLB_noBrPrototype = null;

//Flag if formelements could be moved for surrounding it with a nobr-tag
var MLB_formElementsMoveable = false;

//RegEx for checking if an link is empty
MLB_regexWhitespace = /\s/g

//Timer for intermediate Initialization
MLB_Timer = null;

/*
    Onload-function for every page
    Registered in mouselessbrowsingOverlay.js
*/
function MLB_doFocus(event){
	//MLB_Utils.logMessage("MLB: MLB_doFocus");
	//MLB_doOnload(event, true);
}

function MLB_doOnload(event, callType){
    //var start = (new Date()).getTime();

    //Seting actual window, document object and top-Window
    //Must be set for the eventuality that Ids are switched on
    if(event!=null)
	    MLB_currentWin = event.originalTarget.defaultView;
    MLB_doc = MLB_currentWin.document;
    MLB_topWin = MLB_currentWin.top;

    //Is MLB activated?
    if(MLB_disableAllIds==true || MLB_showIdsOnDemand==true ){
    	MLB_visibilityMode="none";
    	MLB_previousVisibilityMode="config"
    	if(MLB_hasIdSpans(MLB_currentWin))
			MLB_updateIdsAfterToggling();
    	return;
   	}

    //Frames will be initialized starting at the top
	if(MLB_topWin!=MLB_currentWin && !MLB_topWin.MLB_initialized){
        return;
    }
    
    //In cases that only a frame is loaded anew, not everything
    //should be reinitalized
    if(MLB_topWin.MLB_initialized){
        MLB_reloadFrame();
    }else{
        MLB_initAll(callType);
    }
    
    //Dumping consumed time
    //dump("MouselessBrowsing: Initialization takes " + ((new Date()).getTime() - start) + " msec\n");
}

MLB_FIRST_CALL = 1;
MLB_INTERMEDIATE_CALL = 2;
MLB_FINAL_CALL = 4;
function MLB_initAll(callType){
	if(callType==null){
		callType=MLB_FINAL_CALL
	}
	MLB_Utils.logMessage("MBL_initAll: callType " + callType);
	var topWin = MLB_topWin;
    MLB_currentWin = topWin;
	
	if(callType&MLB_FINAL_CALL && MLB_Timer!=null){
		clearTimeout(MLB_Timer);
		MLB_Timer = null;
	}	
	
    //Initilize Page-Data
	topWin.MLB_elementsWithId = new Array(1000)
	topWin.MLB_counter = 0;
	topWin.MLB_numberOfIdsMap = new Object();
	topWin.MLB_startIdMap = new Object();
    
    //Init-Frames
    MLB_initFrame(topWin);

//	if(!(callType&MLB_FINAL_CALL) || callType&MLB_INTERMEDIATE_CALL){
//		MLB_Timer = setTimeout("MLB_initAll("+ MLB_INTERMEDIATE_CALL + ")", 200);	
//	}
	
    //Set init-Flag
    if(callType & MLB_FINAL_CALL)
    	topWin.MLB_initialized=true;
}

/*
 * Initializes one Frame
 * Is called recursivly
 */
function MLB_initFrame(win){
    MLB_currentWin = win;
    MLB_doc = win.document;

    //Saving start Id
    var startId = MLB_topWin.MLB_counter;   
    
    //Init ids for frames
    if(MLB_idsForFramesEnabled && MLB_doc){
        MLB_initFramesIds();
    }
    
    //Init ids for form elements
    if(MLB_idsForFormElementsEnabled && MLB_doc){
        MLB_initFormElements()
    }    

	//Init ids for links
    if((MLB_idsForLinksEnabled || MLB_idsForImgLinksEnabled) 
        && MLB_doc){
        MLB_initLinks()
    }
    
    //Recursive call for all subfrmes
    for(var i = 0; i<win.frames.length; i++){
        MLB_initFrame(win.frames[i]);
    }
    
    //Saving start and end ids of one frame
    var endId = MLB_topWin.MLB_counter;
    MLB_topWin.MLB_numberOfIdsMap[win.name]=endId-startId;
    MLB_topWin.MLB_startIdMap[win.name]=startId;
}

function MLB_reloadFrame(){
    var win = MLB_currentWin;
    var oldNumberOfIds = MLB_topWin.MLB_numberOfIdsMap[win.name];
    var startId = MLB_topWin.MLB_counter = MLB_topWin.MLB_startIdMap[win.name];
    MLB_initFrame(win);
    var actNumberOfIds = MLB_topWin.MLB_counter - startId;
    if(actNumberOfIds>oldNumberOfIds){
        MLB_initAll();
    }
}

/*
 * Init Frame-Ids
 */
function MLB_initFramesIds(){
    for(var i = 0; i<MLB_currentWin.frames.length; i++){
    	var frame = MLB_currentWin.frames[i];
    	if(frame.idSpan!=null){
    		MLB_updateSpan(MLB_idsForFramesEnabled, frame.idSpan);
        }else{
	        var idSpan = MLB_getNewSpan(MLB_idSpanForFrame);
	        //Setting different style
	        idSpan.style.cssText = MLB_styleForFrameIdSpan;
	        
	        //Insert Span
	        var doc = frame.document
	        idSpan = doc.importNode(idSpan, true)
	        doc.body.insertBefore(idSpan, body.firstChild);
	        
	        //Set reference to idSpan
	        frame.idSpan = idSpan;
	    }
	    //Update element Array
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

        //Display image links?
        var hasOnlyImgLink = MLB_hasOnlyImgChilds(link);
        
        //Check against preferences
        if(link.idSpan==null &&
        	((hasOnlyImgLink && !MLB_idsForImgLinksEnabled) ||
            (!hasOnlyImgLink && !MLB_idsForLinksEnabled))){
            continue;
        }

        //Is there already a span with the id
        if(link.idSpan!=null){
        	var showIdSpan = hasOnlyImgLink && MLB_idsForImgLinksEnabled ||
        					!hasOnlyImgLink && MLB_idsForLinksEnabled;
        	MLB_updateSpan(showIdSpan, link.idSpan);
        }else{
            //Insert new Span
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
			
			//Set reference to idSpan 
            link.idSpan=newSpan;
        }
        //Update elements array
        MLB_topWin.MLB_elementsWithId[MLB_topWin.MLB_counter] = link;
    }
}

/*
 * Checks wether this link consists 
 */
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
        if(!MLB_Utils.isEmptyTextNode(childNode) && !MLB_Utils.isTagName(childNode, "img"))
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
 * the form element and id-span, which enhances the style of the page
 * TODO: Checking if necessary
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

/*
 * Inserts Ids for a list of form elements
 */
function MLB_addIdToFormElements(nodeList){
    for(var i=0; i<nodeList.length; i++){
        var element = nodeList.item(i);

        //Hidden input-fields do not get ids ;-)
        if(element.type=="hidden"){
            continue;
        }

        var parent = element.parentNode;
        if(element.idSpan!=null){
        	MLB_updateSpan(MLB_idsForFormElementsEnabled, element.idSpan);
        }else {
        	//Adjust width
            MLB_adjustWidthOfFormElement(element);
            
            //Generate new span
            var newSpan = MLB_getNewSpan(MLB_idSpanForFormElem);
            
            //Insert id span
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
            //Set reference to the idSpan
            element.idSpan = newSpan;
        }
        //Update element array
        MLB_topWin.MLB_elementsWithId[MLB_topWin.MLB_counter] = element;
    }
}

/*
 * Adjust the width of textfield and selectboxes, to minimize
 * the impact on the overall layout
 */
function MLB_adjustWidthOfFormElement(element){
    var isTextOrPassword = MLB_Utils.isTagName(element, "INPUT") && 
                            (element.type=="text" || element.type=="password")
    var isSelectbox = MLB_Utils.isTagName(element, "SELECT"); 
    if(isTextOrPassword || isSelectbox){
    	var isBiggerThan = element.offsetWidth && element.offsetWidth>=100;
    	if(isBiggerThan)
	        element.style.width = (element.offsetWidth-20)+"px";
    }
}

/*
 *  Gets new span for id; 
 */
function MLB_getNewSpan(typeOfSpan){
    var newSpan = MLB_createSpan();
    newSpan.innerHTML = MLB_getNextId();
    //Setting the type the element the id span is created for
    newSpan.setAttribute(MLB_idSpanFor, typeOfSpan);
    return newSpan;
}

/*
 * Creates new IdSpan
 * TODO: Performance tuning
 */
function MLB_createSpan(){
    if(MLB_spanPrototype==null){
        //span
        var span = MLB_doc.createElement("span");
        span.style.cssText = MLB_styleForIdSpan;
        
        //The span has to be hidden before inserting into the DOM
        //otherwise the layout will not be correct.
        //span.style.display = "none";
        //Lets try it with the new version for FF
        span.style.display = "inline";
        
        //Mark this span as id-span
        span.setAttribute(MLB_idSpanFlag, "true", true);
        MLB_spanPrototype = span;
    }
    if(MLB_spanPrototype.style.cssText!=MLB_styleForIdSpan){
        MLB_spanPrototype.style.cssText=MLB_styleForIdSpan;
    }
    return MLB_doc.importNode(MLB_spanPrototype, true);
}

/*
 * Create nobr-Element to surround form elements for better layout
 */
function MLB_getNoBr(){
    if(MLB_noBrPrototype==null){
        MLB_noBrPrototype = MLB_doc.createElement("nobr");
    }
    return MLB_noBrPrototype.cloneNode(true);
}

/*
 * Creates ids and updates counter
 */
function MLB_getNextId(){
    MLB_topWin.MLB_counter = MLB_topWin.MLB_counter+1;
    //Due to bug in seldom cases, check for NaN-Ids
    if(isNaN(MLB_topWin.MLB_counter)){
        MLB_initAll();
    }
    return MLB_topWin.MLB_counter;
}

/*
 * Checks wether an id span should be appended to an link
 * ToDo: Check for performance issues
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

/*
 * Checks wether window already contains ids
 */
function MLB_hasIdSpans(winObj){
	var spans = winObj.document.getElementsByTagName("span");
    for(var i=0; i<spans.length; i++){
        if(MLB_isIdSpan(spans[i]))
            return true;
    }
    return false;
}

/*
 * Updates an id span which already exists
 */
function MLB_updateSpan(visible, span){
	if(visible){
		span.innerHTML=MLB_getNextId();
		span.style.display = "inline";
    }else{
    	span.style.display = "none";	            	
    }
}

MLB_webProgressListener = {
    onLocationChange: function  (webProgress , request , location ){
    	MLB_currentWin = webProgress.DOMWindow;
    	MLB_Utils.logMessage("Loc-Change: " + location.host + location.path +
    		"  " + webProgress.DOMWindow);
    	
    	MLB_doOnload(null, MLB_FIRST_CALL);
    },
    
    onStateChange: function( webProgress , request , stateFlags , status ){
    	MLB_currentWin = webProgress.DOMWindow;
    	
    	
    	var message = "State-Change: ";
    	message += MLB_currentWin.name + "  ";
    	if (stateFlags&1)
    		message += "start";
    	else if (stateFlags&2)
    		message += "redirect";
    	else if (stateFlags&4)
    		message += "transfering";
    	else if (stateFlags&16)
    		message += "stop";

		message += "  ";
		if(stateFlags&65536)
			message += "STATE_IS_REQUEST  ";

		if(stateFlags&131072)
			message += "STATE_IS_DOCUMENT  ";

		if(stateFlags&262144)
			message += "STATE_IS_NETWORK  ";			

		if(stateFlags&524288)
			message += "STATE_IS_WINDOW  ";			

		if(stateFlags&16777216)
			message += "STATE_RESTORING  ";			
		
    	MLB_Utils.logMessage(message + " " + webProgress.DOMWindow);
		
		if(stateFlags&MLB_WEBPROGRESS_STATE_STOP)
			MLB_doOnload(null, MLB_FINAL_CALL);
    },
    
    onProgressChange: function ( webProgress , request , curSelfProgress , maxSelfProgress , curTotalProgress , maxTotalProgress ){
    },
    
    onSecurityChange: function ( webProgress , request , state ){
    },
    
    onStatusChange: function ( webProgress , request , status , message ){
    },

	QueryInterface: function(iid) {
		if (!iid.equals(Components.interfaces.nsISupports)
				&& !iid.equals(Components.interfaces.nsISupportsWeakReference)
				&& !iid.equals(Components.interfaces.nsIWebProgressListener)) {
			dump("MBL Window Pref-Observer factory object: QI unknown interface: " + iid + "\n");
			throw Components.results.NS_ERROR_NO_INTERFACE; }
		return this;
	}
}