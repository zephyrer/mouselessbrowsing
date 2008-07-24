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
		},
		
		//Function called on pageShow event
		onPageShow: function(event){
			var onpageshow2ndCall = event.type=="pageshow" && !event.persisted && MlbPrefs.initOnDomContentLoaded
			this.startInitalizing(event.originalTarget.defaultView, event, onpageshow2ndCall, onpageshow2ndCall);
		},
		
		//Function called on DOMContentLoaded event
		onDOMContentLoaded: function(event){
			if(MlbPrefs.initOnDomContentLoaded){
			   this.startInitalizing(event.originalTarget.defaultView, event, false, false);
			}
		},
		
		//Main entry method for initializing 
		startInitalizing: function(win, event, onpageshow2ndCall, keepExistingIds){
			Utils.logDebugMessage('startInitilizing win: "' + win.name + '" event: ' + event.type + ' topwin: ' + (win==win.top), MlbPrefs.DEBUG_PREF_ID)
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
		   
		   var pageData = this.getPageData(win)
		   if(event.type=="DOMContentLoaded" ||
		       event.type=="pageshow" && win==win.top && pageData==null){
		      pageData = this.createPageData()
		   }else{
		   	return
		   }
	   	pageInitData.pageData = pageData 
	      this.setPageData(win, pageData)
	      this.initAll(pageInitData);
//		   if(win==win.top){
//		   	//Topwin is loaded
//		   	if(pageInitData.onpageshow2ndCall && pageData!=null){
//		   		//When moving fast through the history the pagedata could be null
//		   		//2nd call --> use existing pageData created on 1st call
//		   		pageInitData.pageData = pageData
//		   	}else{
//		   		//Create new pageData and set it
//			   	pageData = this.createPageData()
//	            this.setPageData(win, pageData)
//	            pageInitData.pageData = pageData
//		   	}
//		   }else if(pageData){
////          Todo remove
////		      this.reloadFrame(pageInitData);
//		      this.initAll(pageInitData);
//		   }
		},
		
		initAfterPrefChange: function(){
			var win = MlbUtils.getCurrentContentWin();
			var pageData = this.createPageData();
         var pageInitData = new PageInitData(win, pageData, false, false);
         this.setPageData(win.top, pageData)
         this.initAll(pageInitData)  
		},
		
		initAll: function (pageInitData){
			if(MlbPrefs.debug){
				var perfTimer = new PerfTimer()
			}
			
		    //Initilize Page-Data
		   if(pageInitData.pageData==null){
			   this.setPageData(pageInitData.getCurrentTopWin(), this.createPageData())
		   }

		    //Init-Frames
		   this.initFrame(pageInitData, pageInitData.getCurrentTopWin());
			
		   if(MlbPrefs.debug){
            var timeConsumed = perfTimer.stop()
            Utils.logMessage("MLB Time for loading " + (pageInitData.onpageshow2ndCall?"2st":"1nd") + " call :" + timeConsumed)
         }
		   
		},
		
		/*
		 * Initializes one Frame
		 * Is called recursivly
		 */
		initFrame: function(pageInitData, win){
			 //If document of win is editable skip it, it is a "rich-text-field"
			 if(win.document.designMode=="on"){
			 	return
			 }
		    pageInitData.setCurrentWin(win);
		
		    //Saving start Id
		    var startId = pageInitData.pageData.counter;   
		    
		    //Init ids for frames
		    if(MlbPrefs.idsForFramesEnabled && pageInitData.getCurrentDoc()){
		        this.initFramesIds(pageInitData);
		    }
		    
		    //Init ids for form elements
		    if(MlbPrefs.idsForFormElementsEnabled && pageInitData.getCurrentDoc()){
		        this.initFormElements(pageInitData)
		    }    
		
			//Init ids for links
		    if((MlbPrefs.idsForLinksEnabled || MlbPrefs.idsForImgLinksEnabled) 
		        && pageInitData.getCurrentDoc()){
		        this.initLinks(pageInitData)
		    }
		    
		    this.smartAbsoluteFormElementPositiioning(pageInitData)
		    
		    //Recursive call for all subframes
		    for(var i = 0; i<win.frames.length; i++){
		        this.initFrame(pageInitData, win.frames[i]);
		    }
		    
		    //Saving start and end ids of one frame
		    var endId = pageInitData.pageData.counter;
		    pageInitData.pageData.numberOfIdsMap[win.name]=endId-startId;
		    pageInitData.pageData.startIdMap[win.name]=startId;
		},
		
		//Todo remove as no longer needed
		reloadFrame: function (pageInitData){
         if(MlbPrefs.debug){
            var perfTimer = new PerfTimer()
         }
		    var oldNumberOfIds = pageInitData.pageData.numberOfIdsMap[pageInitData.getCurrentWin().name];
		    var startId = pageInitData.pageData.counter = 
		             pageInitData.pageData.startIdMap[pageInitData.getCurrentWin().name];
		    this.initFrame(pageInitData, pageInitData.getCurrentWin());
		    var actNumberOfIds = pageInitData.pageData.counter - startId;
		    if(actNumberOfIds>oldNumberOfIds){
		    	  pageInitData.pageData = this.createPageData()
		        this.initAll(pageInitData);
		    }
         if(MlbPrefs.debug){
            var timeConsumed = perfTimer.stop()
            Utils.logMessage("MLB Time for reloading frame" + (pageInitData.onpageshow2ndCall?"2st":"1nd") + " call :" + timeConsumed)
         }
		},
		
		/*
		 * Init Frame-Ids
		 */
		initFramesIds: function(pageInitData){
         for(var i = 0; i<pageInitData.getCurrentWin().frames.length; i++){
            var frame = pageInitData.getCurrentWin().frames[i];
			   var doc = frame.document
			   if(doc.designMode=="on" || doc.body==null){
			   	//do not mark editable IFrames; these are used as rich text fields
			   	//initOnDomContentLoaded the body of frames are partly not available
			   	continue
			   }else if(frame.idSpan!=null){
			   	if(pageInitData.keepExistingIds){
			   		continue
			   	}else{
	               this.updateSpan(pageInitData, MlbPrefs.idsForFramesEnabled, frame.idSpan);
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
		       //Todo remove one of possibilities, no performance impact
//		       var isImageLink = this.hasOnlyImgChilds(link);
		       var isImageLink = this.isImageLink(link);
		       
		       var idSpan = this.getAndResetIdSpan(link, link, pageInitData);
		       
		       //Check against preferences
		       if(idSpan==null &&
		         ((isImageLink && !MlbPrefs.idsForImgLinksEnabled) ||
		          (!isImageLink && !MlbPrefs.idsForLinksEnabled))){
		            continue;
		       }
		
             
		       //Is there already a span with the id
             if(idSpan!=null){  
   		       if(pageInitData.keepExistingIds){
		       	    continue
		       	 }else{
		             var showIdSpan = isImageLink && MlbPrefs.idsForImgLinksEnabled ||
		       					      !isImageLink && MlbPrefs.idsForLinksEnabled;
		             this.updateSpan(pageInitData, showIdSpan, idSpan);
		       	 }
		       }else{
		          //Insert new Span
		          if(isImageLink){
                  var newSpan = this.insertSpanForImageLink(pageInitData, link)		             
		          }else{
                  var newSpan = this.insertSpanForTextLink(pageInitData, link)		             
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
		
		insertSpanForImageLink: function(pageInitData, link){
			var newSpan = this.getNewSpan(pageInitData, MlbCommon.IdSpanTypes.IMG);
         if(!MlbPrefs.smartPositioning){
         	return link.appendChild(newSpan)
         }else{             
            var imgElement = link.getElementsByTagName("img")[0]
            if(imgElement==null){
            	//Case of background-image
            	imgElement = link
            }
			   //Before! inserting evaluate offsets
			   var imgElementOffsetLeft = MlbUtils.getOffsetLeftToBody(imgElement)
			   var imgElementOffsetTop = MlbUtils.getOffsetTopToBody(imgElement)
			   
	      	//Set link position relative
			   //Todo check if can be left out
			   //It could be that there are already elements positioned absolute within the link which would then be not possitioned corrctly any more
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
         }
		},
		
		
		/*
		 * Remove, replaced by insertSpan for image link
		 * Todo Remove
		 */
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
			style.position="relative"
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
		
		isImageLink: function(element){
			if((element.getElementsByTagName('img').length>0 ||
			   getComputedStyle(element, null).backgroundImage!="none") &&
			   XMLUtils.containsNoText(element)){
				return true
			}else{
				return false
			}
		},
		
		/*
		    Init for form-elements
		    Idea: switch to document.evaluate
		*/
		initFormElements: function (pageInitData){
         var forms = pageInitData.getCurrentDoc().forms
         if(forms!=null){
	         for(var i=0; i<forms.length; i++ ){
	            this.setIdsOnFormElements(pageInitData, forms[i].elements, false);
			   }
         }
		   var formelements = pageInitData.getCurrentDoc().getElementsByTagName("input");
         this.setIdsOnFormElements(pageInitData, formelements, true);
		   formelements = pageInitData.getCurrentDoc().getElementsByTagName("select");
         this.setIdsOnFormElements(pageInitData, formelements, true);
		   formelements = pageInitData.getCurrentDoc().getElementsByTagName("button");
         this.setIdsOnFormElements(pageInitData, formelements, true);
		   formelements = pageInitData.getCurrentDoc().getElementsByTagName("textarea");
         this.setIdsOnFormElements(pageInitData, formelements, true);
		},
		
		/*
		 * Inserts Ids for a list of form elements
		 */
		setIdsOnFormElements : function(pageInitData, formNodeList, excludeElementsWithIdSpan){
			for(var i=0; i<formNodeList.length; i++){
			   var element = formNodeList.item(i)
			
			   //Hidden input-fields and fieldsets do not get ids ;-)
			   if(element.type=="hidden" ||
			      MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.FIELDSET) ||
			      //File fields are not clickable and focusable via JS
			      MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.FILE)){
			      continue;
			   }
			
			   var parent = element.parentNode;
			   var idSpan = this.getAndResetIdSpan(element, parent, pageInitData);
            if(idSpan!=null){
//            	if(excludeElementsWithIdSpan || pageInitData.keepExistingIds){
            	if(excludeElementsWithIdSpan || pageInitData.keepExistingIds){
//            		if(!this.isAbsolutePositionedFormElement(element)){
            		 this.doOverlayPosioning(element)
//            	  }
            		continue
            	//Todo
//            	}else if(MlbPrefs.smartPositioning && pageInitData.keepExistingIds){
//            	  //this.smartAbsoulteFormElementPositiioning(element)
//            	  continue
            	}else {
				      this.updateSpan(pageInitData, MlbPrefs.idsForFormElementsEnabled, idSpan);
				      this.setElementStyle(element, MlbPrefs.idsForFormElementsEnabled)
            	}
			   }else{
			      //Generate new span
			      var newSpan = this.getNewSpan(pageInitData, MlbCommon.IdSpanTypes.FORMELEMENT);
			      
			      if(MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.BUTTON)||
			         MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.TEXT) ||
			         MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.PASSWORD) ||
			         MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.SELECT)){
			      	var orgWidth = element.style.width
		      	   element.style.width = "0px"
			      	var widthAdjusted = true
			      }else{
			      	var widthAdjusted = false
			      }
//					 if (MlbPrefs.smartPositioning
//					 && this.isAbsolutePositionedFormElement(element)) {
//					 	newSpan.style.display = "none"
//						// Make absolute
////						var parentStyle = getComputedStyle(parent, null)
////						if (parentStyle.position == "static") {
////							parent.style.position = "relative"
////						}
//						newSpan.style.position = "absolute"
//						newSpan.style.top = "0px"
//						newSpan.style.left = "0px"
//						newSpan.style.borderColor = "#7F9DB9"
//					}
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
			      
				    if(MlbPrefs.smartPositioning){
				    	//Todo remove?
//				    	if (this.isAbsolutePositionedFormElement(element)){
////				    		this.smartAbsoulteFormElementPositiioning(element)
//				    		pageInitData.pageData.addToAbsolutePosFormElements(element)
//				    	}else{
				        // var adjusted = this.adjustWidthOfFormElement(element, newSpan)
		                this.smartFormelementPositioning(element)
//				      }
				    } 
			    }
			    pageInitData.pageData.addElementWithId(element)
			}
		},
		
		isAbsolutePositionedFormElement: function(element){
			return  MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.TEXT) ||
                  MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.PASSWORD) ||
                  MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.SELECT) ||
                  MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.TEXTAREA)
		},
		
		smartFormelementPositioning:function(element){
			var elemStylesIdOff = new Array()
			var elemStylesIdOn = new Array()
			
         var idSpan = element.idSpan
          
         var style = idSpan.style
         style.position="relative"
         //Do first everything what could change offsets
         if(this.isLineBreakInbetween(element, idSpan) && idSpan.nextSibling==null){
         	elemStylesIdOff.push({style:"marginBottom", value:element.style.marginBottom})
         	var newMarginBottom = (-idSpan.offsetHeight+5)+"px"
         	element.style.marginBottom = newMarginBottom
         	elemStylesIdOn.push({style:"marginBottom", value:newMarginBottom})
         }else{
	         idSpan.style.marginLeft = (-idSpan.offsetWidth)+"px"
         }
         if(MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.SELECT)){
            //Pos in middle of button
            style.borderStyle = "none";
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
         this.doOverlayPosioning(element)
         
		},
		
		doOverlayPosioning: function(element){
			var idSpan = element.idSpan
			var style = idSpan.style
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
            style.backgroundColor = compStyle.backgroundColor
         }else if(MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.SELECT)){
            //Pos in middle of button
            var widthOfSelectButton = 18
            left = offsets.elemOffsetLeft-offsets.spanOffsetLeft + (element.offsetWidth-widthOfSelectButton) + 
                   (widthOfSelectButton-idSpan.offsetWidth)/2
                     top = offsets.elemOffsetTop-offsets.spanOffsetTop+3// + (element.offsetHeight-idSpan.offsetHeight)/2
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
         	var currentTop = style.top!=""?parseInt(style.top, 10):0
            style.top = (currentTop+top)+"px"
         }
         if(left!=null){
         	var currentLeft = style.left!=""?parseInt(style.left, 10):0
            style.left = (currentLeft+left)+"px"
         }
		},
		
		smartAbsoluteFormElementPositiioning: function(pageInitData) {
			var absolutePosFormElements = pageInitData.pageData.absolutePositionedFormElements
			for (var i = 0; i < absolutePosFormElements.length; i++) {
   			var element = absolutePosFormElements[i]
   			var idSpan = element.idSpan
				idSpan.style.position = "absolute"
				idSpan.style.top = "0px"
				idSpan.style.left = "0px"
				idSpan.style.borderColor = "#7F9DB9"

				var offsets = this.calculateOffsets(element, idSpan)
				// Offsets for img Element
				if (MlbUtils.isElementOfType(element,MlbUtils.ElementTypes.SELECT)) {
//					// Pos in middle of button
//					var widthOfSelectButton = 18
//					left = offsets.elemOffsetLeft - offsets.spanOffsetLeft
//							+ (element.offsetWidth - widthOfSelectButton)
//							+ (widthOfSelectButton - idSpan.offsetWidth) / 2
//					top = offsets.elemOffsetTop - offsets.spanOffsetTop + 3// +
																			// (element.offsetHeight-idSpan.offsetHeight)/2
					idSpan.style.backgroundColor = "#B4C7EB"
				}
//				else {
					var left = offsets.elemOffsetLeft - offsets.spanOffsetLeft
							+ element.offsetWidth - idSpan.offsetWidth
					var top = offsets.elemOffsetTop - offsets.spanOffsetTop
//				}
				idSpan.style.left = left + "px"
				idSpan.style.top = top + "px"
			}
		},
		
		/*
		 * Adjust the width of textfield and selectboxes, to minimize the impact
		 * on the overall layout @returns true if offsets have to recalculated
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
		    return pageInitData.getCurrentDoc().importNode(this.spanPrototype, true);
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
      
      //gets the current page data
      getPageData: function(win){
      	return win.top.mlbPageData
      },
      
      //sets the current page data
      setPageData: function(win, pageData){
      	win.top.mlbPageData = pageData
      },
      
      createPageData: function(){
         if(MlbPrefs.isCharIdType()){
         	return new PageData(MlbPrefs.idChars)
         }else{
         	return new PageData(null)
         }
      },
      
      getAndResetIdSpan: function(element, parentOfIdSpan, pageInitData){
          if(!pageInitData.onpageshow2ndCall || element.idSpan){
          	return element.idSpan
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
	
   var NS = rno_common.Namespace
   NS.bindToNamespace("mouselessbrowsing", "PageInitializer", PageInitializer)
   
})()

