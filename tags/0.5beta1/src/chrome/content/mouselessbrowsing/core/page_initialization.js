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
	
   var CallTypes = {
      FIRST_CALL: 1,
      INTERMEDIATE_CALL: 2,
      FINAL_CALL: 4,
   }

	//Data Containter for holding
	//all data needed for init process
	function PageInitData(currentTopWin, currentWin, currentDoc, pageData, callType){
      //
      this.currentTopWin = currentTopWin;
      this.currentWin = currentWin;
      this.currentDoc = currentDoc;
      
      this.pageData = pageData;
      //Call Type
      this.callType = callType;      	
	}
	
	var PageInitializer = {
		
		//Variables which contain objects of webpage, which is
		//actually initialized
//		currentDoc: null,
//		currentWin: null,
//		currentTopWin: null,
		
		//Prototype for Id-span-elment for Ids
		spanPrototype: null,
		
		//RegEx for checking if an link is empty
		regexWhitespace: /\s/g,
		
		//Timer for intermediate Initialization
		initTimer: null,
		
		STYLE_CLASS_DEF_ID: "mlbStyleClass",
		STYLE_CLASS_NAME: "mlbIdSpan",
		
		//Called after update of Prefs
		init: function(){
         this.spanPrototype = null;
		},
		
		onPageShow: function(event){
		   if(event!=null && event.persisted){
				this.startInitilizing(event.originalTarget.defaultView, CallTypes.FINAL_CALL);
		   }
		},
		
		onDOMContentLoaded: function(event){
			if(event!=null){
				this.startInitilizing(event.originalTarget.defaultView, CallTypes.FINAL_CALL);
			}
		},
		
		startInitilizing: function(win, callType){
		   var pageInitData = new PageInitData(win.top, win, win.document, 
            this.getPageData(win), callType)  
		
		   //Is MLB activated?
		   if(MlbPrefs.disableAllIds==true || MlbPrefs.showIdsOnDemand==true ){
		   	MlbPrefs.visibilityMode=MlbCommon.VisibilityModes.NONE;
		   	GlobalData.previousVisibilityMode=MlbCommon.VisibilityModes.CONFIG
		   	//If history back was pressed after toggling of the ids 
		   	//the alreay generated ids must be hidden
		   	if(this.hasIdSpans(pageInitData.currentWin)){
					EventHandler.updateIdsAfterToggling();
		   	}
		   	return;
		   }
		
		   if(win==win.top){
		   	//Topwin is loaded
		   	//Create new page data
		   	var pageData = new PageData()
            this.setPageData(win, pageData)
            pageInitData.pageData = pageData
		      this.initAll(pageInitData);
		   }else if(this.getPageData(win) && 
		            this.getPageData(win).initialized){
		   	//Subframe was reloaded
		      this.reloadFrame(pageInitData);
		   }else{
		   	//Subframe was loaded but topwin isn't fully loaded
			   //Frames will be initialized starting at the top
		   	return
		   }
		},
		
		initAfterToggling: function(win){
			var pageData = new mouselessbrowsing.PageData();
         var pageInitData = new PageInitData(win.top, win, win.document, pageData, CallTypes.FINAL_CALL);
         this.setPageData(win.top, pageData)
         this.initAll(pageInitData)  
		},
		
		initAll: function (pageInitData){
			if(MlbPrefs.debugPerf){
				var perfTimer = new PerfTimer()
			}
			//Todo
			if(pageInitData.callType==null){
				pageInitData.callType=CallTypes.FINAL_CALL
			}
			//Utils.logMessage("MBL_initAll: callType " + callType);
			
			if(pageInitData.callType&CallTypes.FINAL_CALL && this.initTimer!=null){
				clearTimeout(this.initTimer);
				this.initTimer = null;
			}	
			
		    //Initilize Page-Data
		   if(pageInitData.pageData==null){
			   this.setPageData(pageInitData.currentTopWin, new mouselessbrowsing.PageData())
		   }

			if(pageInitData.callType==CallTypes.FIRST_CALL){
			   this.initTimer = setTimeout("initAll("+ this.INTERMEDIATE_CALL + ")", 200);
			   return	
			}

		    //Init-Frames
		   this.initFrame(pageInitData, pageInitData.currentTopWin);
			
		    //Set init-Flag
		   if(pageInitData.callType & CallTypes.FINAL_CALL){
            pageInitData.pageData.initialized=true;
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
		initFrame: function(pageInitData, win){
		    pageInitData.currentWin = win;
		    pageInitData.currentDoc = win.document;
		
		    //Saving start Id
		    var startId = pageInitData.pageData.counter;   
		    
		    //Insert Style Class Def
		    this.insertStyleClassDef(pageInitData)
		    
		    //Init ids for frames
		    if(MlbPrefs.idsForFramesEnabled && pageInitData.currentDoc){
		        this.initFramesIds(pageInitData);
		    }
		    
		    //Init ids for form elements
		    if(MlbPrefs.idsForFormElementsEnabled && pageInitData.currentDoc){
		        this.initFormElements(pageInitData)
		    }    
		
			//Init ids for links
		    if((MlbPrefs.idsForLinksEnabled || MlbPrefs.idsForImgLinksEnabled) 
		        && pageInitData.currentDoc){
		        this.initLinks(pageInitData)
		    }
		    
		    //Recursive call for all subframes
		    for(var i = 0; i<win.frames.length; i++){
		        this.initFrame(pageInitData, win.frames[i]);
		    }
		    
		    //Saving start and end ids of one frame
		    var endId = pageInitData.pageData.counter;
		    pageInitData.pageData.numberOfIdsMap[win.name]=endId-startId;
		    pageInitData.pageData.startIdMap[win.name]=startId;
		},
		
		insertStyleClassDef: function(pageInitData){
			if(pageInitData.currentDoc.getElementById(MlbCommon.STYLE_CLASS_DEF_ID)!=null){
				return
			}
			var styleElem = pageInitData.currentDoc.createElement("style")
			styleElem.setAttribute("type", "text/css")
			styleElem.setAttribute("id", this.STYLE_CLASS_DEF_ID)
			
			var appendNode = pageInitData.currentDoc.getElementsByTagName('head')[0]
			if(appendNode==null){
				appendNode = pageInitData.currentDoc.documentElement
			}
			appendNode.appendChild(styleElem)
			var mlbStyleSheet = pageInitData.currentDoc.styleSheets[pageInitData.currentDoc.styleSheets.length-1]
			mlbStyleSheet.insertRule("." + this.STYLE_CLASS_NAME + "{" + 
			    MlbPrefs.styleForIdSpan+"}", 0)
			
			
		},
		
		reloadFrame: function (pageInitData){
		    var oldNumberOfIds = pageInitData.pageData.numberOfIdsMap[pageInitData.currentWin.name];
		    var startId = pageInitData.pageData.counter = 
		             pageInitData.pageData.startIdMap[pageInitData.currentWin.name];
		    this.initFrame(pageInitData, pageInitData.currentWin);
		    var actNumberOfIds = pageInitData.pageData.counter - startId;
		    if(actNumberOfIds>oldNumberOfIds){
		        this.initAll(null, true);
		    }
		},
		
		/*
		 * Init Frame-Ids
		 */
		initFramesIds: function(pageInitData){
         for(var i = 0; i<pageInitData.currentWin.frames.length; i++){
            var frame = pageInitData.currentWin.frames[i];
			   var doc = frame.document
		    	if(frame.idSpan!=null){
               //Id Span is already there
               this.updateSpan(pageInitData, MlbPrefs.idsForFramesEnabled, frame.idSpan);
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
		    var links = pageInitData.currentDoc.getElementsByTagName("A");
		    
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
		       var isImageLink = this.hasOnlyImgChilds(link);
		       
		       //Check against preferences
		       if(link.idSpan==null &&
		         ((isImageLink && !MlbPrefs.idsForImgLinksEnabled) ||
		          (!isImageLink && !MlbPrefs.idsForLinksEnabled))){
		            continue;
		       }
		

		       //Is there already a span with the id
		       if(link.idSpan!=null){
		          var showIdSpan = isImageLink && MlbPrefs.idsForImgLinksEnabled ||
		       					      !isImageLink && MlbPrefs.idsForLinksEnabled;
		          this.updateSpan(pageInitData, showIdSpan, link.idSpan);
		       }else{
		          //Insert new Span
		          if(isImageLink){
		             var newSpan = this.getNewSpan(pageInitData, MlbCommon.IdSpanTypes.IMG);
		          }else{
		             var newSpan = this.getNewSpan(pageInitData, MlbCommon.IdSpanTypes.LINK);
		          }
		           
		          //Append to last element in link except for imgages for better style
		          if(link.hasChildNodes() && 
		             link.lastChild.nodeType==Node.ELEMENT_NODE && 
		             !XMLUtils.isTagName(link.lastChild, "img")){
		                link.lastChild.appendChild(newSpan);
		          }else{
			          link.appendChild(newSpan);
		          }
                                
                if(isImageLink && MlbPrefs.smartPositioning){
                	var img = link.getElementsByTagName("img")[0]
                	this.smartImageLinkPositioning(img, newSpan)
                }					
					 //Set reference to idSpan 
		          link.idSpan=newSpan;
		        }
		        //Update elements array
		        pageInitData.pageData.addElementWithId(link);
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
		
		/*
		    Init for form-elements
		*/
		initFormElements: function (pageInitData){
			//RNO, 20.06.2008: included
//         var forms = pageInitData.currentDoc.forms
//         for(var i=0; i<forms.length; i++ ){
//            this.addIdToFormElements(pageInitData, forms[i].elements);
//		   }
		   //Todo adapt
		   //Iteration over form elements
		   var formelements = pageInitData.currentDoc.getElementsByTagName("input");
		   this.addIdToFormElements(pageInitData, formelements);
		   formelements = pageInitData.currentDoc.getElementsByTagName("select");
		   this.addIdToFormElements(pageInitData, formelements);
		   formelements = pageInitData.currentDoc.getElementsByTagName("button");
		   this.addIdToFormElements(pageInitData, formelements);
		   formelements = pageInitData.currentDoc.getElementsByTagName("textarea");
		   this.addIdToFormElements(pageInitData, formelements);
		},
		
		/*
		 * Inserts Ids for a list of form elements
		 */
		addIdToFormElements: function(pageInitData, nodeList){
			for(var i=0; i<nodeList.length; i++){
			   var element = nodeList.item(i);
			
			   //Hidden input-fields do not get ids ;-)
			   if(element.type=="hidden"){
			      continue;
			   }
			
			   var parent = element.parentNode;
			   if(element.idSpan!=null){
			      this.updateSpan(pageInitData, MlbPrefs.idsForFormElementsEnabled, element.idSpan);
			      this.setElementStyle(element, MlbPrefs.idsForFormElementsEnabled)
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
				       //var adjusted = this.adjustWidthOfFormElement(element, newSpan)
		             this.smartFormelementPositioning(element)
				    } 
			    }
			    pageInitData.pageData.addElementWithId(element)
			}
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
	         style.marginLeft = (-idSpan.offsetWidth)+"px"
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
		        var span = pageInitData.currentDoc.createElement("span");
		        span.className = this.STYLE_CLASS_NAME
		        
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
		    return pageInitData.currentDoc.importNode(this.spanPrototype, true);
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
      }
      
	}
	
   var NS = rno_common.Namespace
   NS.bindToNamespace("mouselessbrowsing", "PageInitializer", PageInitializer)
   
})()

