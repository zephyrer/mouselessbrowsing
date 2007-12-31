/*
 * Mouseless Browsing 
 * Version 0.5
 * Created by Rudolf Noé
 * 31.12.2007
 */
(function(){
	//Imports
	var MlbPrefs = mouselessbrowsing.MlbPrefs
	var MlbCommon = mouselessbrowsing.MlbCommon
	var MlbUtils = mouselessbrowsing.MlbUtils
	
	var PageInitializer = {
		
		previousVisibilityMode: MlbCommon.VisibilityModes.CONFIG,
		
		//Variables which contain objects of webpage, which is
		//actually initialized
		currentDoc: null,
		currentWin: null,
		currentTopWin: null,
		
		//Prototype for Id-span-elment for Ids
		spanPrototype: null,
		noBrPrototype: null,
		
		//Flag if formelements could be moved for surrounding it with a nobr-tag
		formElementsMoveable: false,
		
		//RegEx for checking if an link is empty
		regexWhitespace: /\s/g,
		
		//Timer for intermediate Initialization
		Timer: null,
		
		/*
		    Onload-function for every page
		    Registered in mouselessbrowsingOverlay.js
		*/
		handleEvent: function(event){
			//Utils.logMessage("MLB: doOnload");
			this.doOnload(event);
		},
		
		doOnload: function(event, callType){
		   //var start = (new Date()).getTime();
		
		   //Seting actual window, document object and top-Window
		   //Must be set for the eventuality that Ids are switched on
		   if(event!=null)
				this.currentWin = event.originalTarget.defaultView;
		   this.currentDoc = this.currentWin.document;
		   this.currentTopWin = this.currentWin.top;
		
		   //Is MLB activated?
		   if(MlbPrefs.disableAllIds==true || MlbPrefs.showIdsOnDemand==true ){
		   	MlbPrefs.visibilityMode=MlbCommon.VisibilityModes.NONE;
		   	this.previousVisibilityMode=MlbCommon.VisibilityModes.CONFIG
		   	if(this.hasIdSpans(this.currentWin))
					updateIdsAfterToggling();
		   	return;
		   }
		
		   if(this.currentTopWin==this.currentWin){
		   	//Topwin is loaded
		      this.initAll(callType);
		   }else if(this.currentTopWin.initialized){
		   	//Subframe was reloaded
		      this.reloadFrame();
		   }else{
		   	//Subframe was loaded but topwin isn't fully loaded
			   //Frames will be initialized starting at the top
		   	return
		   }
		   
		   //Dumping consumed time
		   //dump("MouselessBrowsing: Initialization takes " + ((new Date()).getTime() - start) + " msec\n");
		},
		
		FIRST_CALL: 1,
		INTERMEDIATE_CALL: 2,
		FINAL_CALL: 4,
		
		initAll: function (callType){
			if(callType==null){
				callType=this.FINAL_CALL
			}
			//Utils.logMessage("MBL_initAll: callType " + callType);
		   this.currentWin = this.currentTopWin;
			
			if(callType&this.FINAL_CALL && this.Timer!=null){
				clearTimeout(this.Timer);
				this.Timer = null;
			}	
			
		    //Initilize Page-Data
			this.currentTopWin.mlbPageData = new mouselessbrowsing.PageData()

//			this.currentTopWin.mlbPageData.elementsWithId = new Array(1000);
//			this.currentTopWin.mlbPageData.counter = 0;
//			this.currentTopWin.mlbPageData.numberOfIdsMap = new Object();
//			this.currentTopWin.mlbPageData.startIdMap = new Object();
		    
		    //Init-Frames
		    this.initFrame(this.currentTopWin);
		
		//	if(!(callType&this.FINAL_CALL) || callType&this.INTERMEDIATE_CALL){
		//		this.Timer = setTimeout("initAll("+ this.INTERMEDIATE_CALL + ")", 200);	
		//	}
			
		    //Set init-Flag
		    if(callType & this.FINAL_CALL)
		    	this.currentTopWin.initialized=true;
		},
		
		/*
		 * Initializes one Frame
		 * Is called recursivly
		 */
		initFrame: function(win){
		    this.currentWin = win;
		    this.currentDoc = win.document;
		
		    //Saving start Id
		    var startId = this.currentTopWin.mlbPageData.counter;   
		    
		    //Init ids for frames
		    if(MlbPrefs.idsForFramesEnabled && this.currentDoc){
		        this.initFramesIds();
		    }
		    
		    //Init ids for form elements
		    if(MlbPrefs.idsForFormElementsEnabled && this.currentDoc){
		        this.initFormElements()
		    }    
		
			//Init ids for links
		    if((MlbPrefs.idsForLinksEnabled || MlbPrefs.idsForImgLinksEnabled) 
		        && this.currentDoc){
		        this.initLinks()
		    }
		    
		    //Recursive call for all subfrmes
		    for(var i = 0; i<win.frames.length; i++){
		        this.initFrame(win.frames[i]);
		    }
		    
		    //Saving start and end ids of one frame
		    var endId = this.currentTopWin.mlbPageData.counter;
		    this.currentTopWin.mlbPageData.numberOfIdsMap[win.name]=endId-startId;
		    this.currentTopWin.mlbPageData.startIdMap[win.name]=startId;
		},
		
		reloadFrame: function (){
		    var win = this.currentWin;
		    var oldNumberOfIds = this.currentTopWin.mlbPageData.numberOfIdsMap[win.name];
		    var startId = this.currentTopWin.mlbPageData.counter = this.currentTopWin.mlbPageData.startIdMap[win.name];
		    this.initFrame(win);
		    var actNumberOfIds = this.currentTopWin.mlbPageData.counter - startId;
		    if(actNumberOfIds>oldNumberOfIds){
		        initAll();
		    }
		},
		
		/*
		 * Init Frame-Ids
		 */
		initFramesIds: function(){
		    for(var i = 0; i<this.currentWin.frames.length; i++){
		    	var frame = this.currentWin.frames[i];
			   var doc = frame.document
		    	if(frame.idSpan!=null){
		    		this.updateSpan(MlbPrefs.idsForFramesEnabled, frame.idSpan);
		        }else{
			        var idSpan = this.getNewSpan(MlbCommon.IdSpanTypes.FRAME);
			        //Setting different style
			        idSpan.style.cssText = MlbPrefs.styleForFrameIdSpan;
			        
			        //Insert Span
			        idSpan = doc.importNode(idSpan, true)
			        doc.body.insertBefore(idSpan, doc.body.firstChild);
			        
			        //Set reference to idSpan
			        frame.idSpan = idSpan;
			    }
			    //Update element Array
		       this.currentTopWin.mlbPageData.elementsWithId[this.currentTopWin.mlbPageData.counter] = doc.body;
		    }
		},
		
		/*
		    Init for Links
		*/
		initLinks: function (){
		    //Iteration over links
		    var links = this.currentDoc.getElementsByTagName("A");
		    for(var i=0; i<links.length; i++){
		        var link = links[i];
		        //is there anything noteworth
		        if (!this.isMarkableLink(link))
		            continue;
		
		        //Display image links?
		        var hasOnlyImgLink = this.hasOnlyImgChilds(link);
		        
		        //Check against preferences
		        if(link.idSpan==null &&
		        	((hasOnlyImgLink && !MlbPrefs.idsForImgLinksEnabled) ||
		            (!hasOnlyImgLink && !MlbPrefs.idsForLinksEnabled))){
		            continue;
		        }
		
		        //Is there already a span with the id
		        if(link.idSpan!=null){
		        	var showIdSpan = hasOnlyImgLink && MlbPrefs.idsForImgLinksEnabled ||
		        					!hasOnlyImgLink && MlbPrefs.idsForLinksEnabled;
		        	this.updateSpan(showIdSpan, link.idSpan);
		        }else{
		            //Insert new Span
		            if(hasOnlyImgLink)
		                var newSpan = this.getNewSpan(MlbCommon.IdSpanTypes.IMG);
		            else
		                var newSpan = this.getNewSpan(MlbCommon.IdSpanTypes.LINK);
		            
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
		        this.currentTopWin.mlbPageData.elementsWithId[this.currentTopWin.mlbPageData.counter] = link;
		    }
		},
		
		/*
		 * Checks wether this link consists 
		 */
		hasOnlyImgChilds: function(element){
		    if(!element.hasChildNodes())
		        return false;
		    var childNodes = element.childNodes;
		    for(var i=0; i<childNodes.length; i++){
		        var childNode = childNodes[i];
		        //Id-Spans will be ignored
		        if(MlbUtils.isIdSpan(childNode))
		            continue;
		        if(childNode.hasChildNodes()){
		            var flag = this.hasOnlyImgChilds(childNode);
		            if(!flag)
		                return false;
		        }
		        if(!Utils.isEmptyTextNode(childNode) && !Utils.isTagName(childNode, "img"))
		            return false;
		    }
		    return true;
		},
		
		/*
		    Init for form-elements
		*/
		initFormElements: function (){
		    this.checkIfFormElementsCouldBeMoved();
		    //Iteration over form elements
		    var formelements = this.currentDoc.getElementsByTagName("input");
		    this.addIdToFormElements(formelements);
		    formelements = this.currentDoc.getElementsByTagName("select");
		    this.addIdToFormElements(formelements);
		    formelements = this.currentDoc.getElementsByTagName("button");
		    this.addIdToFormElements(formelements);
		    formelements = this.currentDoc.getElementsByTagName("textarea");
		    this.addIdToFormElements(formelements);
		},
		
		/*
		 * Checks whether a form element could be moved
		 * Reason: if moveable a <nobr>-elment could be put around
		 * the form element and id-span, which enhances the style of the page
		 * TODO: Checking if necessary
		 */ 
		checkIfFormElementsCouldBeMoved: function(){
		    if(!this.currentDoc.forms || this.currentDoc.forms.length<=0){
		        this.formElementsMoveable = false;
		        return;
		    }
		    var newFormElem = this.currentDoc.createElement("input");
		    newFormElem = this.currentDoc.forms[0].appendChild(newFormElem);
		    if(newFormElem.forms!=null){
		        this.formElementsMoveable = true;
		    }else{
		        this.formElementsMoveable = false;
		    }
		    this.currentDoc.forms[0].removeChild(newFormElem);
		},
		
		/*
		 * Inserts Ids for a list of form elements
		 */
		addIdToFormElements: function(nodeList){
		    for(var i=0; i<nodeList.length; i++){
		        var element = nodeList.item(i);
		
		        //Hidden input-fields do not get ids ;-)
		        if(element.type=="hidden"){
		            continue;
		        }
		
		        var parent = element.parentNode;
		        if(element.idSpan!=null){
		        	this.updateSpan(MlbPrefs.idsForFormElementsEnabled, element.idSpan);
		        }else {
		        	//Adjust width
		            this.adjustWidthOfFormElement(element);
		            
		            //Generate new span
		            var newSpan = this.getNewSpan(MlbCommon.IdSpanTypes.FORMELEMENT);
		            
		            //Insert id span
		            if(this.formElementsMoveable){
		                var nobr = this.getNoBr();
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
		        this.currentTopWin.mlbPageData.elementsWithId[this.currentTopWin.mlbPageData.counter] = element;
		    }
		},
		
		/*
		 * Adjust the width of textfield and selectboxes, to minimize
		 * the impact on the overall layout
		 */
		adjustWidthOfFormElement: function(element){
		    var isTextOrPassword = Utils.isTagName(element, "INPUT") && 
		                            (element.type=="text" || element.type=="password")
		    var isSelectbox = Utils.isTagName(element, "SELECT"); 
		    if(isTextOrPassword || isSelectbox){
		    	var isBiggerThan = element.offsetWidth && element.offsetWidth>=100;
		    	if(isBiggerThan)
			        element.style.width = (element.offsetWidth-20)+"px";
		    }
		},
		
		/*
		 *  Gets new span for id; 
		 */
		getNewSpan: function(typeOfSpan){
		    var newSpan = this.createSpan();
		    newSpan.innerHTML = this.getNextId();
		    //Setting the type the element the id span is created for
		    newSpan.setAttribute(MlbCommon.ATTR_ID_SPAN_FOR, typeOfSpan);
		    return newSpan;
		},
		
		/*
		 * Creates new IdSpan
		 * TODO: Performance tuning
		 */
		createSpan: function(){
		    if(this.spanPrototype==null){
		        //span
		        var span = this.currentDoc.createElement("span");
		        span.style.cssText = MlbPrefs.styleForIdSpan;
		        
		        //The span has to be hidden before inserting into the DOM
		        //otherwise the layout will not be correct.
		        //span.style.display = "none";
		        //Lets try it with the new version for FF
		        span.style.display = "inline";
		        
		        //Mark this span as id-span
		        span.setAttribute(MlbCommon.ATTR_ID_SPAN_FLAG, "true", true);
		        this.spanPrototype = span;
		    }
		    if(this.spanPrototype.style.cssText!=MlbPrefs.styleForIdSpan){
		        this.spanPrototype.style.cssText=MlbPrefs.styleForIdSpan;
		    }
		    return this.currentDoc.importNode(this.spanPrototype, true);
		},
		
		/*
		 * Create nobr-Element to surround form elements for better layout
		 */
		getNoBr: function(){
		    if(this.noBrPrototype==null){
		        this.noBrPrototype = this.currentDoc.createElement("nobr");
		    }
		    return this.noBrPrototype.cloneNode(true);
		},
		
		/*
		 * Creates ids and updates counter
		 */
		getNextId: function(){
		    this.currentTopWin.mlbPageData.counter = this.currentTopWin.mlbPageData.counter+1;
		    //Due to bug in seldom cases, check for NaN-Ids
		    if(isNaN(this.currentTopWin.mlbPageData.counter)){
		        initAll();
		    }
		    return this.currentTopWin.mlbPageData.counter;
		},
		
		/*
		 * Checks wether an id span should be appended to an link
		 * ToDo: Check for performance issues
		 */
		isMarkableLink: function(link){
		    //No real link
		    if(link.getAttribute("href") == null && link.getAttribute("onclick") == null) 
		        return false;
		
		    //Img Link is ok    
		    if(link.getElementsByTagName("img").length>0)
		        return true;
		        
		    //empty link
		    if(link.innerHTML=="" || !link.text || link.text.replace(this.regexWhitespace, "").length==0)
		        return false;
		                
		    return true;
		},
		
		/*
		 * Checks wether window already contains ids
		 */
		hasIdSpans: function(winObj){
			var spans = winObj.document.getElementsByTagName("span");
		    for(var i=0; i<spans.length; i++){
		        if(MlbUtils.isIdSpan(spans[i]))
		            return true;
		    }
		    return false;
		},
		
		/*
		 * Updates an id span which already exists
		 */
		updateSpan: function(visible, span){
			if(visible){
				span.innerHTML=this.getNextId();
				span.style.display = "inline";
		    }else{
		    	span.style.display = "none";	            	
		    }
		},
		
		webProgressListener: {
		    onLocationChange: function  (webProgress , request , location ){
		    	this.currentWin = webProgress.DOMWindow;
		    	Utils.logMessage("Loc-Change: " + location.host + location.path +
		    		"  " + webProgress.DOMWindow);
		    	
		    	this.doOnload(null, this.FIRST_CALL);
		    },
		    
		    onStateChange: function( webProgress , request , stateFlags , status ){
		    	this.currentWin = webProgress.DOMWindow;
		    	
		    	
		    	var message = "State-Change: ";
		    	message += this.currentWin.name + "  ";
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
				
		    	Utils.logMessage(message + " " + webProgress.DOMWindow);
				
				if(stateFlags&MlbCommon.WEBPROGRESS_STATE_STOP)
					doOnload(null, this.FINAL_CALL);
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
	}
	
   var NS = rno_common.Namespace
   NS.bindToNamespace("mouselessbrowsing", "PageInitializer", PageInitializer)
})()
