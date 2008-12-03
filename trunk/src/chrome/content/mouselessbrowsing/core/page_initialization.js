/*
 * Mouseless Browsing 
 * Version 0.5
 * Created by Rudolf Noé
 * 31.12.2007
 */
(function(){
	//Imports
	var Utils = mlb_common.Utils
	var XMLUtils = mlb_common.XMLUtils
	var PerfTimer = mlb_common.PerfTimer
	var MlbPrefs = mouselessbrowsing.MlbPrefs
	var TabLocalPrefs = mouselessbrowsing.TabLocalPrefs
	var MlbCommon = mouselessbrowsing.MlbCommon
	var MlbUtils = mouselessbrowsing.MlbUtils
	var GlobalData = mouselessbrowsing.GlobalData
	var PageData = mouselessbrowsing.PageData
	var EventHandler = mouselessbrowsing.EventHandler
	
	/*
	 *Data Containter for holding all data needed for init process
	 *@param currentWin: Current win-object for which init should take place
	 *@param onpageshow2ndCall: Flag inidicating that this second cycle of initializing, the first is onDomContentLoaded
	 *@param keepExsitingIds: Flag indicating that exisitng id spans should not be changed.
	 */
	function PageInitData(currentWin, onpageshow2ndCall, keepExsitingIds, eventType){
      this.currentWin = currentWin;
      this.onpageshow2ndCall = onpageshow2ndCall
      this.keepExsitingIds = keepExsitingIds
      this.eventType = eventType
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
		},
		setPageData: function(pageData){
			this.pageData = pageData
		}, 
		
		EventTypes: {
		    DOM_CONTENT_LOADED: "DOMContentLoaded",
		    ON_PAGE_SHOW:"onpageshow",
		    TOGGLING_IDS:"togglinids"	    
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
         TabLocalPrefs.applySiteRules(content)
         this.updatePage();
		},
		
		//Function called on pageShow event
		onPageShow: function(event){
			var onpageshow2ndCall = !event.persisted && MlbPrefs.initOnDomContentLoaded

			var win = event.originalTarget.defaultView
			//Onpage show init starts from topwin if already initialized after DOMCOntentLoaded
         //It is not enough to load when topwin is loaded as subframes could trigger XmlHttpRequests
         //e.g. Gmail
			var topWinIsInitialized = win.top.mlb_initialized==true
         if(!topWinIsInitialized && win!=win.top && MlbPrefs.initOnDomContentLoaded){
            return
         }
         //After topwin is initialized ids has always to be regenerated entirely as with frameset no top win will be loaded any more
         //The && onpageshow2ndCall is necessary in the case where a page is loaded from the cache
         var keepExsitingIds = !topWinIsInitialized
			this.prepareInitialization(event, onpageshow2ndCall, keepExsitingIds);
         if(win==win.top){
            win.mlb_initialized=true
         }
		},
		
		//Function called on DOMContentLoaded event
		onDOMContentLoaded: function(event){
			if(MlbPrefs.initOnDomContentLoaded){
				var keepExsitingIds = !this.isFrameset(event.originalTarget.defaultView.top)
			   this.prepareInitialization(event, false, keepExsitingIds);
			}
		},
		
		isFrameset: function(win){
			try{
			   return win.document.body.tagName.toUpperCase()=="FRAMESET"
			}catch(e){
				return false
			}
		}, 
		
		prepareInitialization: function(event, onpageshow2ndCall, keepExsitingIds){
         var win = event.originalTarget.defaultView
         MlbUtils.logDebugMessage('init win: "' + win.name + '"| event: ' + event.type + '| topwin: ' + (win==win.top) + '| keepexistingIds: ' + keepExsitingIds)
         var pageInitData = new PageInitData(win, onpageshow2ndCall, keepExsitingIds, event.type)
         
         //Apply URL exceptions
         //Could not be in initPage as it should not be executed on toggleing
         TabLocalPrefs.applySiteRules(win)
         
         //Is MLB activated?
         if(TabLocalPrefs.isShowIdsOnDemand(win)){
            //Set the visibility modes so that with toggeling the ids will become visible
         	var currentVisibilityMode = TabLocalPrefs.getVisibilityMode(win)
         	if(currentVisibilityMode!=MlbCommon.VisibilityModes.NONE){
               TabLocalPrefs.setVisibilityMode(win, MlbCommon.VisibilityModes.NONE);
         	}
            //If history back was pressed after toggling of the ids 
            //the alreay generated ids must be hidden
            var topWin = pageInitData.getCurrentTopWin()
            if(this.hasVisibleIdSpans(topWin)){
               EventHandler.hideIdSpans(topWin);
            }
            return;
         }

         this.initPage(pageInitData)
		},

		/*
		 * Updates the page after toggling of ids or if prefs has changed
		 */
		updatePage: function(){
         var pageInitData = new PageInitData(content, false, false);
         this.initPage(pageInitData)  
		},
		
		/*
		 * Main entry method for initializing
		 * @param pageInitData:
		 */ 
		initPage: function(pageInitData){
         
			var win = pageInitData.getCurrentTopWin()

			if(TabLocalPrefs.isDisableAllIds(win)==true){
				return
			}
		   
		   var pageData = this.getPageData(win)
		   if(pageData==null){
		   	pageInitData.keepExsitingIds = false
		   }
		   if(!pageInitData.keepExsitingIds){
		   	pageData = this.createPageData()
		   }
	   	pageInitData.pageData = pageData 
	      this.setPageData(win, pageData)
	      //Even if only a frame is loaded everything is initialized
	      //There is no performance issues as the already exisiting ids are only updated

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
		    if(TabLocalPrefs.isIdsForFramesEnabled(win) && pageInitData.getCurrentDoc()){
		        this.initFramesIds(pageInitData);
		    }
		    
		    //Init ids for form elements
		    if(TabLocalPrefs.isIdsForFormElementsEnabled(win) && pageInitData.getCurrentDoc()){
		        this.initFormElements(pageInitData)
		    }    
		
			//Init ids for links
		    if((TabLocalPrefs.isIdsForLinksEnabled(win) || TabLocalPrefs.isIdsForImgLinksEnabled(win)) 
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
			   	if(pageInitData.keepExsitingIds){
			   		continue
			   	}else{
	               this.updateSpan(pageInitData, TabLocalPrefs.isIdsForFramesEnabled(pageInitData.getCurrentTopWin()), frame.idSpan);
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
		      pageInitData.pageData.addElementWithId(doc.body);
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
		initLinks : function(pageInitData) {
			//For performance reasons in case of keep existing ids only the not initialized a are taken
			var xpathExp = "//A"
			if (pageInitData.keepExsitingIds) {
				xpathExp += "[not(@MLB_hasIdSpan)]"				
			}
			var topWin = pageInitData.getCurrentTopWin()
			var doc = pageInitData.getCurrentDoc()
		   var links = doc.evaluate(xpathExp, doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)

			// Limit max. number of links
			var maxIdNumber = MlbPrefs.maxIdNumber

			for (var i = 0; i < links.snapshotLength; i++) {
				if (pageInitData.pageData.counter >= maxIdNumber) {
					break;
				}

				var link = links.snapshotItem(i);
				// is there anything noteworth
				if (!link.idSpan && !this.isMarkableLink(link)) {
					continue;
				}

				// Display image links?
				var isImageLink = this.isImageLink(link);

				var idSpan = this.getAndResetIdSpan(link, link, pageInitData);

				// Check against preferences
				if (idSpan == null
						&& ((isImageLink && !TabLocalPrefs.isIdsForImgLinksEnabled(topWin)) || (!isImageLink && !TabLocalPrefs.isIdsForLinksEnabled(topWin)))) {
					continue;
				}

				// Is there already a span with the id
				if (idSpan != null) {
					if (pageInitData.keepExsitingIds) {
						continue
					} else {
			     			var showIdSpan = isImageLink
								&& TabLocalPrefs.isIdsForImgLinksEnabled(topWin)
								|| !isImageLink
								&& TabLocalPrefs.isIdsForLinksEnabled(topWin);
						this.updateSpan(pageInitData, showIdSpan, idSpan);
					}
				} else {
					// Insert new Span
					if (isImageLink) {
						var newSpan = this.insertSpanForImageLink(pageInitData,
								link)
					} else {
						var newSpan = this.insertSpanForTextLink(pageInitData, link)
					}
					// Set reference to idSpan
					link.idSpan = newSpan;
				}
				// Update elements array
				pageInitData.pageData.addElementWithId(link);
			}
		},
		
		/*
		 * TODO: Remove in future release
		 
		insertSpanForTextLink: function(pageInitData, link){
         var newSpan = this.getNewSpan(pageInitData, MlbCommon.IdSpanTypes.LINK);
         // Append to last element in link except for imgages for better
			// style
			if(link.hasChildNodes() && 
			   link.lastChild.nodeType==Node.ELEMENT_NODE && 
			   !XMLUtils.isTagName(link.lastChild, "img")){
			      link.lastChild.appendChild(newSpan);
			}else{
			   link.appendChild(newSpan);
			}
			return newSpan
		},*/

		insertSpanForTextLink: function(pageInitData, link){
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
				}else if (child.hasChildNodes() && this.isElementVisible(child)){
					var recursiveResult = this.findParentOfLastTextNode(child)
					if(recursiveResult!=null){
						return recursiveResult
					}
				}
			}
			return null;
		},
		
		/*
		 * Checks wether an element is currently visible to avoid appending ids to invisible links
		 */
		isElementVisible: function(element){
			//Comment out 08.10.2008 due to mail from Martijn
			/*if(element.className=="" && element.getAttribute('style')==null){
				return true
			}*/
			var style = this.getComputedStyle(element)
			if(style.display=="none" || style.visibility=="hidden" || 
			   element.offsetLeft<-100 || element.offsetTop<-100){
				return false
			}
			return true
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
			   //position relative on the parent element can lead to misplacing in case that one child is positioned
			   //relative or absolute and not the direct parent has the position attribute but on ancestor higher in the 
			   //hierarchy
            //See also MLB issue 25, 37, 
            //TODO for future release 
	      	var linkStyle = this.getComputedStyle(link)
	      	var imgStyle = this.getComputedStyle(imgElement)
	      	if(linkStyle.position=="static" && imgStyle.position=="static"){
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
			if((link.idSpan && link.idSpan.getAttribute(MlbCommon.ATTR_ID_SPAN_FOR)==MlbCommon.IdSpanTypes.IMG) ||
			   ((link.getElementsByTagName('img').length>0 || this.getComputedStyle(link).backgroundImage!="none") &&
			   XMLUtils.containsNoText(link))){
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
					if (pageInitData.keepExsitingIds) {
						if(MlbPrefs.smartPositioning){
      					this.doOverlayPosioning(element)
						}
						continue
					} else {
						var idsEnabled = TabLocalPrefs.isIdsForFormElementsEnabled(pageInitData.getCurrentTopWin())
						this.updateSpan(pageInitData, idsEnabled, idSpan);
						this.setElementStyle(element, idsEnabled)
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
            top = offsets.elemOffsetTop-offsets.spanOffsetTop
            style.borderColor="#7F9DB9"
            var compStyle = this.getComputedStyle(element)
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
		hasVisibleIdSpans: function(winObj){
			if(this.isFrameset(winObj)){
				for (var i = 0; i < winObj.frames.length; i++) {
					var hasIdsSpans = this.hasVisibleIdSpans(winObj.frames[i])
					if(hasIdsSpans){
						return true
					}
				}
				return false
			}else{
   			var spans = winObj.document.getElementsByTagName("span");
   		    for(var i=0; i<spans.length; i++){
   		        if(MlbUtils.isIdSpan(spans[i]) && spans[i].style.display=="inline")
   		            return true;
   		    }
   		    return false;
			}
		},
		
		/*
		 * Updates an id span which already exists
		 */
		updateSpan: function(pageInitData, visible, span){
			if(visible){
				span.textContent=pageInitData.pageData.getNextId();
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
      },
      
      getComputedStyle: function(element){
      	return element.ownerDocument.defaultView.getComputedStyle(element, null)
      }
	}
	
   var NS    = mlb_common.Namespace
   NS.bindToNamespace("mouselessbrowsing", "PageInitializer", PageInitializer)
   
})()

