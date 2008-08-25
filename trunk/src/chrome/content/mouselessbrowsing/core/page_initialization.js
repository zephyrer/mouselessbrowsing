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
	var PageData = mouselessbrowsing.PageData
	var EventHandler = mouselessbrowsing.EventHandler
	
	/*
	 *Data Containter for holding all data needed for init process
	 *@param currentWin: current content win
	 *@param pageData: PageData object holding the data for the page which will be initialized 
	 *@param onpageshow2ndCall: Flag inidicating that this second cycle of initializing, the first is onDomContentLoaded
	 *@param keepExistingIds: Flag indicating that exisitng id spans should not be changed.
	 */
	function PageInitData(currentWin, pageData, onpageshow2ndCall, keepExistingIds){
      //
      this.currentWin = currentWin;
      this.pageData = pageData;
      this.onpageshow2ndCall = onpageshow2ndCall
      this.keepExistingIds = keepExistingIds
	}
	
	PageInitData.prototype = {
		getCurrentWin: function(){
			return this.currentWin
		},

		setCurrentWin: function(win){
			this.currentWin = win
		},

		getCurrentTopWin: function(){
			return this.currentWin.top
		},
		
		getCurrentDoc: function(){
			return this.currentWin.document
		}
	}
	
	var PageInitializer = {
		
		//Prototype for Id-span-elment for Ids
		spanPrototype: null,
		
		//RegEx for checking if an link is empty
		regexWhitespace: /\s/g,
		
		//Called after update of Prefs
		init: function(){
         this.spanPrototype = null;
         mouselessbrowsing.EventHandler.hideIdSpans(content)
         MlbPrefs.applySiteRules(content)
         this.updatePage();
		},
		
		//Function called on pageShow event
		onPageShow: function(event){
			var onpageshow2ndCall = event.type=="pageshow" && !event.persisted && MlbPrefs.initOnDomContentLoaded
			this.startInitalizing(event, onpageshow2ndCall, onpageshow2ndCall);
		},
		
		//Function called on DOMContentLoaded event
		onDOMContentLoaded: function(event){
			if(MlbPrefs.initOnDomContentLoaded){
			   this.startInitalizing(event, false, false);
			}
		},
		
		/*
		 * Main entry method for initializing
		 * @param event: The event initiating the call
		 * @param onpageshow2ndCall: Flag indicating wether this is the 2nd call for initializing the win
		 * @param keepExistingIds: Flag indicating whether already existing ids should be left unchanged 
		 */ 
		startInitalizing: function(event, onpageshow2ndCall, keepExistingIds){
			var win = event.originalTarget.defaultView
			MlbUtils.logDebugMessage('startInitilizing win: "' + win.name + '" event: ' + event.type + ' topwin: ' + (win==win.top))
		   var pageInitData = new PageInitData(win, this.getPageData(win), onpageshow2ndCall, keepExistingIds)
		   
		   //Apply URL exceptions
		   MlbPrefs.applySiteRules(win)
		   
		   //Is MLB activated?
		   if(MlbPrefs.disableAllIds==true || MlbPrefs.showIdsOnDemand==true ){
		   	//Set the visibility modes so that with toggeling the ids will become visible
		      MlbPrefs.visibilityMode=MlbCommon.VisibilityModes.NONE;
            GlobalData.previousVisibilityMode=MlbCommon.VisibilityModes.CONFIG
		   	//If history back was pressed after toggling of the ids 
		   	//the alreay generated ids must be hidden
		   	if(this.hasIdSpans(pageInitData.getCurrentWin())){
					EventHandler.hideIdSpans(pageInitData.getCurrentTopWin());
		   	}
		   	return;
		   }
		   
		   //Onpage show init starts from topwin
		   //This is the last event
		   if(event.type=="pageshow" && win!=win.top){
		   	return
		   }
		   var pageData = null
		   if(onpageshow2ndCall){
   		   pageData = this.getPageData(win)
		   }else{
		   	pageData = this.createPageData()
		   }
	   	pageInitData.pageData = pageData 
	      this.setPageData(win, pageData)
	      //Even if only a frame is loaded everything is initialized
	      //There is no performance issues as the already exisiting ids are only updated
	      this.initAll(pageInitData);
		},
		
		/*
		 * Updates the page after toggling of ids or if prefs has changed
		 */
		updatePage: function(){
			var win = MlbUtils.getCurrentContentWin();
			var pageData = this.createPageData();
         var pageInitData = new PageInitData(win, pageData, false, false);
         this.setPageData(win.top, pageData)
         this.initAll(pageInitData)  
		},
		
		/*
		 * Main init-method
		 */
		initAll: function (pageInitData){
			if(MlbPrefs.debugPerf){
				var perfTimer = new PerfTimer()
			}
			
		    //Init-Frames starting with top-win
		   this.initFrame(pageInitData, pageInitData.getCurrentTopWin());
			
		   if(MlbPrefs.debugPerf){
            var timeConsumed = perfTimer.stop()
            var debugMessage = "MLB time for"
            if(pageInitData.onpageshow2ndCall){
            	debugMessage += " 2nd"
            }else if(MlbPrefs.initOnDomContentLoaded){
            	debugMessage += " 1st"
            }
            debugMessage += " initialization: " + timeConsumed + " msec"
            Utils.logMessage(debugMessage)
         }
		   
		},
		
		/*
		 * Initializes one Frame
		 * Is called recursivly
		 * @param pageInitData
		 * @param win: current win to initialize
		 * 
		 */
		initFrame: function(pageInitData, win){
			 //If document of win is editable skip it, it is a "rich-text-field", e.g. at Gmail
			 if(win.document.designMode=="on"){
			 	return
			 }
			 //Watch for making it editable
			 win.document.wrappedJSObject.watch("designMode", this.onChangeDesignMode)

			 pageInitData.setCurrentWin(win);
		
		    //Init ids for frames
		    if(MlbPrefs.isIdsForFramesEnabled() && pageInitData.getCurrentDoc()){
		        this.initFramesIds(pageInitData);
		    }
		    
		    //Init ids for form elements
		    if(MlbPrefs.isIdsForFormElementsEnabled() && pageInitData.getCurrentDoc()){
		        this.initFormElements(pageInitData)
		    }    
		
			//Init ids for links
		    if((MlbPrefs.isIdsForLinksEnabled() || MlbPrefs.isIdsForImgLinksEnabled()) 
		        && pageInitData.getCurrentDoc()){
		        this.initLinks(pageInitData)
		    }
		    
		    //Recursive call for all subframes
		    for(var i = 0; i<win.frames.length; i++){
		        this.initFrame(pageInitData, win.frames[i]);
		    }
		},
		
		/*
		 * Init Frame-Ids
		 */
		initFramesIds: function(pageInitData){
         for(var i = 0; i<pageInitData.getCurrentWin().frames.length; i++){
            var frame = pageInitData.getCurrentWin().frames[i];
			   var doc = frame.document
			   if(frame.document.designMode=="on" || doc.body==null){
			   	//do not mark editable IFrames; these are used as rich text fields
			   	//in case of onDomContentLoaded event the body of frames are partly not available
			   	continue
			   }else if(frame.idSpan!=null){
			   	if(pageInitData.keepExistingIds){
			   		continue
			   	}else{
	               this.updateSpan(pageInitData, MlbPrefs.isIdsForFramesEnabled(), frame.idSpan);
			   	}
		      }else{
			      var idSpan = this.getNewSpan(pageInitData, MlbCommon.IdSpanTypes.FRAME);
			      //Setting different style
			      idSpan.style.cssText = MlbPrefs.styleForFrameIdSpan;
			      
			      //Insert Span
			      idSpan = doc.importNode(idSpan, true)
			      doc.body.insertBefore(idSpan, doc.body.firstChild);
			        
			      //Set reference to idSpan
			      frame.idSpan = idSpan;
			   }
			   //Update element Array
		      pageInitData.pageData.addElementWithId(doc.defaultView);
		   }
		},
		
		onChangeDesignMode: function(property, oldValue, newValue){
		   if(newValue && newValue.toString().toLowerCase()=="on"){
   			//Remove old id spans
		   	//"this" is in this context HTMLDocument!
		   	var spans = this.getElementsByTagName('span')
		   	for (var i = 0; i < spans.length; i++) {
		   		var span = spans[i]
		   		if(span.hasAttribute("MLB_idSpanFlag")){
		   			span.parentNode.removeChild(span)
		   			//Correct index as spans array is updated on the fly
		   			i--
		   		}
		   	}
		   	setTimeout("mouselessbrowsing.PageInitializer.updatePage()")
		   }
		   return newValue
		},
		
		/*
		    Init for Links
		*/
		initLinks: function (pageInitData){
		    //Iteration over links
		    var links = pageInitData.getCurrentDoc().getElementsByTagName("A");
		    
		    //Limit max. number of links
		    var maxIdNumber = MlbPrefs.maxIdNumber
		    
		    for(var i=0; i < links.length; i++){
		       if(pageInitData.pageData.counter>=maxIdNumber){
		       	break;
		       }

		       var link = links[i];
		       //is there anything noteworth
		       if (!this.isMarkableLink(link)){
		          continue;
		       }
		       
		       //Display image links?
		       //TODO remove one of possibilities, no performance impact
//		       var isImageLink = this.hasOnlyImgChilds(link);
		       var isImageLink = this.isImageLink(link);
		       
		       var idSpan = this.getAndResetIdSpan(link, link, pageInitData);
		       
		       //Check against preferences
		       if(idSpan==null &&
		         ((isImageLink && !MlbPrefs.isIdsForImgLinksEnabled()) ||
		          (!isImageLink && !MlbPrefs.isIdsForLinksEnabled()))){
		            continue;
		       }
		
		       //Is there already a span with the id
             if(idSpan!=null){  
   		       if(pageInitData.keepExistingIds){
		       	    continue
		       	 }else{
		             var showIdSpan = isImageLink && MlbPrefs.isIdsForImgLinksEnabled() ||
		       					      !isImageLink && MlbPrefs.isIdsForLinksEnabled();
		             this.updateSpan(pageInitData, showIdSpan, idSpan);
		       	 }
		       }else{
		          //Insert new Span
		          if(isImageLink){
                  var newSpan = this.insertSpanForImageLink(pageInitData, link)		             
		          }else{
		          	//Todo remove?
//                  var newSpan = this.insertSpanForTextLink(pageInitData, link)		             
                  var newSpan = this.insertSpanForTextLinkNew(pageInitData, link)		             
		          }
					 //Set reference to idSpan 
		          link.idSpan=newSpan;
		        }
		        //Update elements array
		        pageInitData.pageData.addElementWithId(link);
		    }
		},
		
		insertSpanForTextLink: function(pageInitData, link){
         var newSpan = this.getNewSpan(pageInitData, MlbCommon.IdSpanTypes.LINK);
         //Append to last element in link except for imgages for better style
			if(link.hasChildNodes() && 
			   link.lastChild.nodeType==Node.ELEMENT_NODE && 
			   !XMLUtils.isTagName(link.lastChild, "img")){
			      link.lastChild.appendChild(newSpan);
			}else{
			   link.appendChild(newSpan);
			}
			return newSpan
		},

		insertSpanForTextLinkNew: function(pageInitData, link){
         var newSpan = this.getNewSpan(pageInitData, MlbCommon.IdSpanTypes.LINK);
         //Append to last element in link except for imgages for better style
			var parentOfLastTextNode = this.findParentOfLastTextNode(link)
			if(parentOfLastTextNode!=null){
				parentOfLastTextNode.appendChild(newSpan)
			}else{
			   link.appendChild(newSpan);
			}
			return newSpan
		},
		
		findParentOfLastTextNode: function(element){
			var childNodes = element.childNodes
			for (var i = childNodes.length-1; i >= 0; i--) {
				var child = childNodes.item(i)
				if(child.nodeType==Node.TEXT_NODE && !XMLUtils.isEmptyTextNode(child)){
					return element
				}else if (child.hasChildNodes()){
					var recursiveResult = this.findParentOfLastTextNode(child)
					if(recursiveResult!=null){
						return recursiveResult
					}
				}
			}
			return null;
		},
		
		insertSpanForImageLink: function(pageInitData, link){
			var newSpan = this.getNewSpan(pageInitData, MlbCommon.IdSpanTypes.IMG);
         if(MlbPrefs.smartPositioning){
            var imgElement = link.getElementsByTagName("img")[0]
            if(imgElement==null){
            	//Case of background-image
            	imgElement = link
            }
			   //Before! inserting evaluate offsets
			   var imgElementOffsetLeft = MlbUtils.getOffsetLeftToBody(imgElement)
			   var imgElementOffsetTop = MlbUtils.getOffsetTopToBody(imgElement)
			   
	      	//Set link position relative
	      	var linkStyle = getComputedStyle(link, null)
	      	if(linkStyle.position=="static"){
	      		link.style.position="relative"
	      	}

	      	//Insert Link with absolute Positioning
	         newSpan.style.position="absolute"
	         newSpan.style.left="0px"
	         newSpan.style.top="0px"
	      	link.appendChild(newSpan)
	      	
	      	//If img is to small relative to the span do not overlay image
	      	var factor = 2
	      	if(imgElement.offsetWidth<factor*newSpan.offsetWidth && 
	      	    imgElement.offsetHeight<factor*newSpan.offsetHeight){
	      		newSpan.style.position="relative"
	      		return newSpan
	      	}
				
				//Offsets for img Element
			   var idSpanOffsetLeft = MlbUtils.getOffsetLeftToBody(newSpan)
			   var idSpanOffsetTop = MlbUtils.getOffsetTopToBody(newSpan)
	      	var left = imgElementOffsetLeft - idSpanOffsetLeft + imgElement.offsetWidth - newSpan.offsetWidth
	      	var top = imgElementOffsetTop - idSpanOffsetTop
	         newSpan.style.left = left+"px"
	         newSpan.style.top = top+"px"
				newSpan.style.backgroundColor="#EEF3F9"
				newSpan.style.color="black"
				return newSpan
         }else{
         	return link.appendChild(newSpan)
         }             
		},
		
		/*
		 * Checks wether this link consists 
		 * Remove in future version
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
		 * Checks whether the link is pure img link
		 */
		isImageLink: function(link){
			if((link.getElementsByTagName('img').length>0 ||
			   getComputedStyle(link, null).backgroundImage!="none") &&
			   XMLUtils.containsNoText(link)){
				return true
			}else{
				return false
			}
		},
		
		/*
		 * Init for form-elements
		*/
		initFormElements: function (pageInitData){
		   var doc = pageInitData.getCurrentDoc()
			var snapshot = doc.evaluate("//input | //select | //textarea | //button | //iframe", doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
			for (var i = 0; i < snapshot.snapshotLength; i++) {
				var element = snapshot.snapshotItem(i)
            
				// Hidden input-fields and fieldsets do not get ids ;-)
				if (element.type == "hidden" || 
				      MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.FIELDSET) ||
						// File fields are not clickable and focusable via JS
						// for security reasons
						MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.FILE) ||
						(MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.IFRAME) && element.contentDocument.designMode=="off")) {
					continue;
				}

				var parent = element.parentNode;
				var idSpan = this.getAndResetIdSpan(element, parent,
						pageInitData);
				if (idSpan != null) {
					if (pageInitData.keepExistingIds) {
						if(MlbPrefs.smartPositioning){
      					this.doOverlayPosioning(element)
						}
						continue
					} else {
						this.updateSpan(pageInitData, MlbPrefs.isIdsForFormElementsEnabled(), idSpan);
						// TODO check this line
						this.setElementStyle(element, MlbPrefs.isIdsForFormElementsEnabled())
					}
				} else {
					// Generate new span
   				var newSpan = this.getNewSpan(pageInitData,MlbCommon.IdSpanTypes.FORMELEMENT);
			      
			      if (element.nextSibling != null) {
						newSpan = parent.insertBefore(newSpan,
								element.nextSibling);
					} else {
						newSpan = parent.appendChild(newSpan);
					}

					element.idSpan = newSpan
					MlbUtils.setElementForIdSpan(newSpan, element)

					if (MlbPrefs.smartPositioning) {
						this.smartFormelementPositioning(element)
					}
				}
				element = MlbUtils.isEditableIFrame(element)?element.contentDocument.body:element
				pageInitData.pageData.addElementWithId(element)
			}
		},
		
		/*
		 * Do the preparation of smart/overlay positioning for form elements
		 * @param element: element which id span should be smart/overlayed positioned
		 */
		smartFormelementPositioning:function(element){
			//Array for backup element styles if id is off
			var elemStylesIdOff = new Array()
			//Array for backup element styles if id is on
			var elemStylesIdOn = new Array()
			
         var idSpan = element.idSpan
         var style = idSpan.style

         style.position="relative"
         
         //Do first everything what could change offsets of element
         if(this.isLineBreakInbetween(element, idSpan) && idSpan.nextSibling==null){
         	elemStylesIdOff.push({style:"marginBottom", value:element.style.marginBottom})
         	var newMarginBottom = (-idSpan.offsetHeight+5)+"px"
         	element.style.marginBottom = newMarginBottom
         	elemStylesIdOn.push({style:"marginBottom", value:newMarginBottom})
         }else{
	         idSpan.style.marginLeft = (-idSpan.offsetWidth)+"px"
         }
         if(MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.BUTTON) ||
                   MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.RADIO) ||
                   MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.CHECKBOX)){
            //Pos in middle next to button/checkbox/radio
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
         this.doOverlayPosioning(element)
         
		},
		
		/*
		 * Do the smart/overlay positioning of formelements
		 * Separate method so it can be called twice in case of double initialization (see onpageshow2ndCall)
		 */
		doOverlayPosioning: function(element){
			var idSpan = element.idSpan
			var style = idSpan.style
			//Calculate offsets
         var offsets = this.calculateOffsetsToBody(element, idSpan)
         
         var left = null;
         var top = null;
         
         //Calculate left and top
         if(MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.TEXT) || 
            MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.PASSWORD) ||
            MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.TEXTAREA) ||
            MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.IFRAME)){
            //Pos in upper right corner
            left = offsets.elemOffsetLeft-offsets.spanOffsetLeft + element.offsetWidth - idSpan.offsetWidth
            //Todo put in
//          if(element.offsetHeight <element.scrollHeight){
//            	//vertical scrollbar is visible
//            	left-=element.offsetWidth-element.clientWidth
//            }
            top = offsets.elemOffsetTop-offsets.spanOffsetTop
            style.borderColor="#7F9DB9"
            var compStyle = getComputedStyle(element, "")
            style.color = compStyle.color
            if(MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.IFRAME)){
            	//Because of scrollbars and the iframe has almost always background transparent
               style.backgroundColor = "white"
            }else{
               style.backgroundColor = compStyle.backgroundColor
            }
            	
         }else if(MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.SELECT)){
            //Pos in middle of button
            var widthOfSelectButton = 18
            left = offsets.elemOffsetLeft-offsets.spanOffsetLeft + (element.offsetWidth-widthOfSelectButton) + 
                   (widthOfSelectButton-idSpan.offsetWidth)/2
                     top = offsets.elemOffsetTop-offsets.spanOffsetTop+3// + (element.offsetHeight-idSpan.offsetHeight)/2
            //TODO Make this configurable
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
         	//Take already set value into acount
         	var currentTop = style.top!=""?parseInt(style.top, 10):0
            style.top = (currentTop+top)+"px"
         }
         if(left!=null){
         	var currentLeft = style.left!=""?parseInt(style.left, 10):0
            style.left = (currentLeft+left)+"px"
         }
		},
		
		/*
		 * Checks wether two elements is a line break
		 */
		isLineBreakInbetween: function(elem1, elem2){
         var elem1OffsetTop = MlbUtils.getOffsetTopToBody(elem1)
         var elem2OffsetTop = MlbUtils.getOffsetTopToBody(elem2)
         return elem1OffsetTop+elem1.offsetHeight<elem2OffsetTop
		},
		
		/*
		 *  Gets new span for id; 
		 */
		getNewSpan: function(pageInitData, typeOfSpan){
		    var newSpan = this.createSpan(pageInitData);
		    newSpan.innerHTML = pageInitData.pageData.getNextId();
		    //Setting the type the element the id span is created for
		    newSpan.setAttribute(MlbCommon.ATTR_ID_SPAN_FOR, typeOfSpan);
		    return newSpan;
		},
		
		/*
		 * Creates new IdSpan
		 * TODO: Performance tuning
		 * Is Prototype still sensefull
		 */
		createSpan: function(pageInitData){
		    if(this.spanPrototype==null){
		        //span
		        var span = pageInitData.getCurrentDoc().createElement("span");
		        span.style.cssText = MlbPrefs.styleForIdSpan
		        
		        //Lets try it with the new version for FF
		        span.style.display = "inline";
		        
		        //Mark this span as id-span
		        span.setAttribute(MlbCommon.ATTR_ID_SPAN_FLAG, "true");
		        this.spanPrototype = span;
		    }
		    return pageInitData.getCurrentDoc().importNode(this.spanPrototype, true);
		},
		
		/*
		 * Checks wether an id span should be appended to an link
		 * TODO: Check for performance issues
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
		updateSpan: function(pageInitData, visible, span){
			if(visible){
				span.innerHTML=pageInitData.pageData.getNextId();
				span.style.display = "inline";
		    }else{
		    	span.style.display = "none";
		    }
		},
		
		/*
		 * Set special/orignal styles according visibility of id span
		 * @param element: Formelement for which the style should be set/reset
		 * @param idSpanVisible: Flag indicating if the corresponding idSpan is visible
		 */
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
		
		/*
		 * Calculates the offsets 
		 */
		calculateOffsetsToBody: function(element, idSpan){
         var offsets = {
            elemOffsetLeft:MlbUtils.getOffsetLeftToBody(element),
            elemOffsetTop: MlbUtils.getOffsetTopToBody(element),
            spanOffsetTop: MlbUtils.getOffsetTopToBody(idSpan),
            spanOffsetLeft: MlbUtils.getOffsetLeftToBody(idSpan)
         }
         return offsets
      },
      
      /*
       * Gets the current page data
       * @param win: arbitray content win
       * @return the page data stored in the top win
       */
      getPageData: function(win){
      	return win.top.mlbPageData
      },
      
      /*
       * Sets the current page data
       * @param win: arbitray content win
       * @param pageData
       */
      setPageData: function(win, pageData){
      	win.top.mlbPageData = pageData
      },
      
      /*
       * Creates new page data
       */
      createPageData: function(){
         if(MlbPrefs.isCharIdType()){
         	return new PageData(MlbPrefs.idChars)
         }else{
         	return new PageData(null)
         }
      },
      
      /*
       * TODO: Save IdToSpan map in page data for better performance
       */
      getAndResetIdSpan: function(element, parentOfIdSpan, pageInitData){
          if(element.idSpan!=null){
          	return element.idSpan
          }else if(!pageInitData.onpageshow2ndCall){
            return null;
          }else{
         	var spans = parentOfIdSpan.getElementsByTagName("span")
         	for (var i = 0; i < spans.length; i++) {
         		var span = spans[i]
         		if(span.getAttribute(MlbCommon.ATTR_ID_SPAN_FLAG)=="true"){
            	  element.idSpan = span
            	  return span
         		}
         	}
          }
          return null
      }
	}
	
   var NS    = rno_common.Namespace
   NS.bindToNamespace("mouselessbrowsing", "PageInitializer", PageInitializer)
   
})()

