/*
 * Mouseless Browsing 
 * Version 0.5
 * Created by Rudolf Noé
 * 31.12.2007
 */
(function(){
	//Imports
	var Utils = rno_common.Utils
	var XMLUtils = rno_common.XMLUtils
	var PerfTimer = rno_common.PerfTimer
	var MlbPrefs = mouselessbrowsing.MlbPrefs
	var MlbCommon = mouselessbrowsing.MlbCommon
	var MlbUtils = mouselessbrowsing.MlbUtils
	var GlobalData = mouselessbrowsing.GlobalData
	var EventHandler = mouselessbrowsing.EventHandler
	
	var PageInitializer = {
		
		//Variables which contain objects of webpage, which is
		//actually initialized
		currentDoc: null,
		currentWin: null,
		currentTopWin: null,
		
		//Prototype for Id-span-elment for Ids
		spanPrototype: null,
		
		//RegEx for checking if an link is empty
		regexWhitespace: /\s/g,
		
		//Timer for intermediate Initialization
		initTimer: null,
		
		//Called after update of Prefs
		init: function(){
         this.spanPrototype = null;
		},
		
		onPageShow: function(event){
			//Utils.logMessage("Pageshow: " + event.originalTarget.defaultView.document.title)
		   //var start = (new Date()).getTime();
		
		   //Seting actual window, document object and top-Window
		   //Must be set for the eventuality that Ids are switched on
		   if(event!=null){
				this.startInitilizing(event.originalTarget.defaultView, this.CallTypes.FINAL_CALL);
		   }
			else{
				return; 
			}
		},
		
		startInitilizing: function(win, callType){
			this.currentWin = win		
		   this.currentDoc = win.document;
		   this.currentTopWin = win.top;
		
		   //Is MLB activated?
		   if(MlbPrefs.disableAllIds==true || MlbPrefs.showIdsOnDemand==true ){
		   	MlbPrefs.visibilityMode=MlbCommon.VisibilityModes.NONE;
		   	GlobalData.previousVisibilityMode=MlbCommon.VisibilityModes.CONFIG
		   	//If history back was pressed after toggling of the ids 
		   	//the alreay generated ids must be hidden
		   	if(this.hasIdSpans(this.currentWin)){
					EventHandler.updateIdsAfterToggling();
		   	}
		   	return;
		   }
		
		   if(this.currentTopWin==this.currentWin){
		   	//Topwin is loaded
		      this.initAll(callType);
		   }else if(this.currentTopWin.mlbPageData && 
		            this.currentTopWin.mlbPageData.initialized){
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
		
		CallTypes: {
         FIRST_CALL: 1,
         INTERMEDIATE_CALL: 2,
         FINAL_CALL: 4,
		},
		
		initAll: function (callType, initPageData){
			if(MlbPrefs.debugPerf){
				var perfTimer = new PerfTimer()
			}
			//Todo
			if(callType==null){
				callType=this.CallTypes.FINAL_CALL
			}
			//Utils.logMessage("MBL_initAll: callType " + callType);
			
			if(callType&this.CallTypes.FINAL_CALL && this.initTimer!=null){
				clearTimeout(this.initTimer);
				this.initTimer = null;
			}	
			
		    //Initilize Page-Data
		   if(this.currentTopWin.mlbPageData==null || initPageData){
			   this.currentTopWin.mlbPageData = new mouselessbrowsing.PageData()
		   }

			if(callType==this.CallTypes.FIRST_CALL){
			   this.initTimer = setTimeout("initAll("+ this.INTERMEDIATE_CALL + ")", 200);
			   return	
			}

		    //Init-Frames
		   this.initFrame(this.currentTopWin);
			
		    //Set init-Flag
		   if(callType & this.CallTypes.FINAL_CALL){
            this.currentTopWin.mlbPageData.initialized=true;
		   }
		   if(MlbPrefs.debugPerf){
            var timeConsumed = perfTimer.stop()
            Utils.logMessage("MLB Time for loading:" + timeConsumed)
         }
		   
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
		    
		    //Recursive call for all subframes
		    for(var i = 0; i<win.frames.length; i++){
		        this.initFrame(win.frames[i]);
		    }
		    
		    //Saving start and end ids of one frame
		    var endId = this.currentTopWin.mlbPageData.counter;
		    this.currentTopWin.mlbPageData.numberOfIdsMap[win.name]=endId-startId;
		    this.currentTopWin.mlbPageData.startIdMap[win.name]=startId;
		},
		
		reloadFrame: function (){
		    var oldNumberOfIds = this.currentTopWin.mlbPageData.numberOfIdsMap[this.currentWin.name];
		    var startId = this.currentTopWin.mlbPageData.counter = 
		             this.currentTopWin.mlbPageData.startIdMap[this.currentWin.name];
		    this.initFrame(this.currentWin);
		    var actNumberOfIds = this.currentTopWin.mlbPageData.counter - startId;
		    if(actNumberOfIds>oldNumberOfIds){
		        this.initAll(null, true);
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
               //Id Span is already there
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
		      this.currentTopWin.mlbPageData.addElementWithId(doc.body);
		   }
		},
		
		/*
		    Init for Links
		*/
		initLinks: function (){
		    //Iteration over links
		    var links = this.currentDoc.getElementsByTagName("A");
		    var maxIdNumber = MlbPrefs.maxIdNumber
		    var counter = this.currentTopWin.mlbPageData.counter
		    var max = Math.min(links.length, maxIdNumber-counter)
		    var linkCounter = 0
		    for(var i=0; i < links.length; i++){
		       var link = links[i];
		       //is there anything noteworth
		       if (!this.isMarkableLink(link)){
		          continue;
		       }
		       
		       
		       //Display image links?
		       var hasOnlyImgLink = this.hasOnlyImgChilds(link);
		       
		       //Check against preferences
		       if(link.idSpan==null &&
		         ((hasOnlyImgLink && !MlbPrefs.idsForImgLinksEnabled) ||
		          (!hasOnlyImgLink && !MlbPrefs.idsForLinksEnabled))){
		            continue;
		       }
		
		       linkCounter++
		       if(linkCounter>max){
		       	break;
		       }

		       //Is there already a span with the id
		       if(link.idSpan!=null){
		          var showIdSpan = hasOnlyImgLink && MlbPrefs.idsForImgLinksEnabled ||
		       					      !hasOnlyImgLink && MlbPrefs.idsForLinksEnabled;
		          this.updateSpan(showIdSpan, link.idSpan);
		       }else{
		          //Insert new Span
		          if(hasOnlyImgLink){
		             var newSpan = this.getNewSpan(MlbCommon.IdSpanTypes.IMG);
		          }else{
		             var newSpan = this.getNewSpan(MlbCommon.IdSpanTypes.LINK);
		          }
		           
		          //Append to last element in link except for imgages
//		          var appender = link;
//		          if(link.hasChildNodes() && link.lastChild.nodeType==Node.ELEMENT_NODE && 
//		             XMLUtils.isTagName(link.lastChild, "img")){
//		                appender = link.lastChild;
//		          }
//		          appender.appendChild(newSpan);
                link.appendChild(newSpan)
                
                if(hasOnlyImgLink){
                	var img = link.getElementsByTagName("img")[0]
                	this.smartImageLinkPositioning(img, newSpan)
                }					
					 //Set reference to idSpan 
		          link.idSpan=newSpan;
		        }
		        //Update elements array
		        this.currentTopWin.mlbPageData.addElementWithId(link);
		    }
		},
		
		smartImageLinkPositioning: function(img, idSpan){
			var offsets = this.calculateOffsets(img, idSpan)
			var overlayPositions = this.calculateOverlayPosition(img, idSpan, offsets)
			var factor = 0.25
			var style = idSpan.style
			if(img.offsetWidth*factor<idSpan.offsetWidth && 
			   img.offsetHeight*factor<idSpan.offsetHeight){
				overlayPositions.left=overlayPositions.left+idSpan.offsetWidth
			}else{
				style.backgroundColor="#EEF3F9"
				style.color="black"
			}
			style.left = overlayPositions.left+"px"
			style.top = overlayPositions.top+"px"
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
		            if(!this.hasOnlyImgChilds(childNode)){
		                return false;
		            }
		        }
		        if(!XMLUtils.isEmptyTextNode(childNode) && !XMLUtils.isTagName(childNode, "img"))
		            return false;
		    }
		    return true;
		},
		
		/*
		    Init for form-elements
		*/
		initFormElements: function (){
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
			      this.setElementStyle(element, MlbPrefs.idsForFormElementsEnabled)
			   }else{
			      //Generate new span
			      var newSpan = this.getNewSpan(MlbCommon.IdSpanTypes.FORMELEMENT);
			      
			      if(MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.BUTTON)||
			         MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.TEXT) ||
			         MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.PASSWORD) ||
			         MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.SELECT)){
			      	var orgWidth = element.style.width
			      	element.style.width = (orgWidth-10)+"px"
			      	var widthAdjusted = true
			      }else{
			      	var widthAdjusted = false
			      }
			      if(element.nextSibling!=null){
			         newSpan = parent.insertBefore(newSpan, element.nextSibling);
			      }else{
			         newSpan = parent.appendChild(newSpan);
			      }
			      //newSpan = parent.insertBefore(newSpan, element)
			      
			      if(widthAdjusted){
			      	element.style.width = orgWidth
			      }
			      //Set cross reference 
			      element.idSpan = newSpan
			      MlbUtils.setElementForIdSpan(newSpan, element)
			      
				    if(true){
				       //var adjusted = this.adjustWidthOfFormElement(element, newSpan)
		             this.smartFormelementPositioning(element)
				    } 
			    }
			    this.currentTopWin.mlbPageData.addElementWithId(element)
			}
		},
		
		smartFormelementPositioning:function(element){
			var elemStylesIdOff = new Array()
			var elemStylesIdOn = new Array()
			
         var idSpan = element.idSpan
          
         var style = idSpan.style
         //Do first everything what could change offsets
         if(this.isLineBreakInbetween(element, idSpan)){
         	elemStylesIdOff.push({style:"marginBottom", value:element.style.marginBottom})
         	var newMarginBottom = (-idSpan.offsetHeight+5)+"px"
         	element.style.marginBottom = newMarginBottom
         	elemStylesIdOn.push({style:"marginBottom", value:newMarginBottom})
         }else{
	         style.marginLeft = (-idSpan.offsetWidth)+"px"
         }
         if(MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.SELECT)){
            //Pos in middle of button
            style.border = null;
         }else if(MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.BUTTON) ||
                   MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.RADIO) ||
                   MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.CHECKBOX)){
            //Pos in middle next to button
         	elemStylesIdOff.push({style:"marginRight", value:element.style.marginRight})
            element.style.marginRight=(idSpan.offsetWidth)+"px"
            elemStylesIdOn.push({style:"marginRight", value:idSpan.offsetWidth+"px"})
         }
         if(elemStylesIdOff.length>0){
         	element.elemStylesIdOff=elemStylesIdOff
         }
         if(elemStylesIdOn.length>0){
            element.elemStylesIdOn=elemStylesIdOn
         }
         
         //Calculate offsets
         var offsets = this.calculateOffsets(element, idSpan)
         
		   var left = null;
		   var top = null;
		   
		   //Calculate left and top
		   if(MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.TEXT) || 
		      MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.PASSWORD) ||
		      MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.TEXTAREA)){
		      //Pos in upper right corner
	         var positions = this.calculateOverlayPosition(element, idSpan, offsets)
	         left = positions.left
	         top = positions.top
		      style.borderColor="#7F9DB9"
		      var compStyle = getComputedStyle(element, "")
		      style.color = compStyle.color
		   }else if(MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.SELECT)){
		   	//Pos in middle of button
		   	var widthOfSelectButton = 18
		      left = offsets.elemOffsetLeft-offsets.spanOffsetLeft + (element.offsetWidth-widthOfSelectButton) + 
		             (widthOfSelectButton-idSpan.offsetWidth)/2
         		      top = offsets.elemOffsetTop-offsets.spanOffsetTop + (element.offsetHeight-idSpan.offsetHeight)/2
		      style.backgroundColor="#B4C7EB"
		   }else if(MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.BUTTON) ||
		             MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.RADIO) ||
		             MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.CHECKBOX)){
            //Pos in middle next to button
            left = offsets.elemOffsetLeft-offsets.spanOffsetLeft + element.offsetWidth
            top = offsets.elemOffsetTop-offsets.spanOffsetTop + (element.offsetHeight-idSpan.offsetHeight)/2
           	element.style.marginRight=(idSpan.offsetWidth)+"px"
         }
		  
		   //Set top and left
		   if(top!=null){
		      style.top = top+"px"
		   }
		   if(left!=null){
   	      style.left = left+"px"
		   }
		},
		
		
		/*
		 * Adjust the width of textfield and selectboxes, to minimize
		 * the impact on the overall layout
		 * @returns true if offsets have to recalculated
		 */
		adjustWidthOfFormElement: function(element, newSpan){
		   if(MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.TEXT) ||
		      MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.PASSWORD) ||
		      MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.SELECT)){
               var isBiggerThan = element.offsetWidth && element.offsetWidth>=90;
			      if(isBiggerThan && this.isLineBreakInbetween(newSpan, element)){
			           element.style.width = (element.offsetWidth-newSpan.offsetWidth)+"px";
			           //offsets has to be recalcualted
			           return true
	            }
		   }
		   return false
		},
		
		isLineBreakInbetween: function(elem1, elem2){
         var elem1OffsetTop = MlbUtils.getOffsetTopToBody(elem1)
         var elem2OffsetTop = MlbUtils.getOffsetTopToBody(elem2)
         return elem1OffsetTop<elem2OffsetTop-10
		},
		
		/*
		 *  Gets new span for id; 
		 */
		getNewSpan: function(typeOfSpan){
		    var newSpan = this.createSpan();
		    newSpan.innerHTML = this.currentTopWin.mlbPageData.getNextId();
		    //Setting the type the element the id span is created for
		    newSpan.setAttribute(MlbCommon.ATTR_ID_SPAN_FOR, typeOfSpan);
		    return newSpan;
		},
		
		/*
		 * Creates new IdSpan
		 * TODO: Performance tuning
		 * Is Prototype still sensefull
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
		    //Removed on 01.01.2008, 13:16
//		    if(this.spanPrototype.style.cssText!=MlbPrefs.styleForIdSpan){
//		        this.spanPrototype.style.cssText=MlbPrefs.styleForIdSpan;
//		    }
		    return this.currentDoc.importNode(this.spanPrototype, true);
		},
		
		/*
		 * Checks wether an id span should be appended to an link
		 * ToDo: Check for performance issues
		 */
		isMarkableLink: function(link){
		    //No real link
		    if(link.getAttribute("href") == null && link.getAttribute("onclick") == null) 
		        return false;
		
		    //Img Link is ok or with class is ok    
		    if(link.getElementsByTagName("img").length>0 || link.className!=null)
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
		updateSpan: function(visible, span, element){
			if(visible){
				span.innerHTML=this.currentTopWin.mlbPageData.getNextId();
				span.style.display = "inline";
		    }else{
		    	span.style.display = "none";
		    }
		},
		
		setElementStyle: function(element, idSpanVisible){
			var styleArray = null
			if(idSpanVisible==false && element.elemStylesIdOff!=null){
				styleArray = element.elemStylesIdOff
         } else if (idSpanVisible==true && element.elemStylesIdOn!=null){
				styleArray = element.elemStylesIdOn
         }
         if(styleArray==null){
         	return
         }
         for(var i=0; i<styleArray.length; i++ ){
            var styleEntry = styleArray[i]
            element.style[styleEntry.style] = styleEntry.value
         }
		},
		
		calculateOverlayPosition:function(element, idSpan, offsets){
         var left = offsets.elemOffsetLeft-offsets.spanOffsetLeft + element.offsetWidth - idSpan.offsetWidth
         var top = offsets.elemOffsetTop-offsets.spanOffsetTop
         return {left:left, top:top}
		},
		
		calculateOffsets: function(element, idSpan){
         var offsets = {
            elemOffsetLeft:MlbUtils.getOffsetLeftToBody(element),
            elemOffsetTop: MlbUtils.getOffsetTopToBody(element),
            spanOffsetTop: MlbUtils.getOffsetTopToBody(idSpan),
            spanOffsetLeft: MlbUtils.getOffsetLeftToBody(idSpan)
         }
         return offsets
      },			
	}
	
   var NS = rno_common.Namespace
   NS.bindToNamespace("mouselessbrowsing", "PageInitializer", PageInitializer)
   
   
   MLB_webProgressListener = {
          onLocationChange: function  (webProgress , request , location ){
            var currentTopWin = webProgress.DOMWindow.top;
            var init = currentTopWin.mlbPageData && currentTopWin.mlbPageData.initialized
//            Utils.logMessage("Loc-Change: Host:" + location.host + " Path: " + location.path +
//               "  Window name:" + this.currentWin.name + " init: " + init + " request: " + request);
            
//          this.doOnload(null, this.FIRST_CALL);
          },
          
          onStateChange: function( webProgress , request , stateFlags , status ){
            this.currentWin = webProgress.DOMWindow;
            
            
            var message = "State-Change: ";
            message += "Win name: " + this.currentWin.name + "  Stateflags: ";
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
            
            //Utils.logMessage(message + " Doc title:" + webProgress.DOMWindow.document.title);
            
//            if(stateFlags&MlbCommon.WEBPROGRESS_STATE_STOP)
//               doOnload(null, this.FINAL_CALLServicer
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
   
})()

