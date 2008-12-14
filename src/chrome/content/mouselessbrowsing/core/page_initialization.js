/*
 * Mouseless Browsing 
 * Version 0.5
 * Created by Rudolf Noé
 * 31.12.2007
 */
with(mlb_common){
with(mouselessbrowsing){
(function(){

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
         var keepExsitingIds = !topWinIsInitialized
			this.prepareInitialization(event, onpageshow2ndCall, keepExsitingIds, true);
         if(win==win.top){
            win.mlb_initialized=true
         }
		},
		
		//Function called on DOMContentLoaded event
		onDOMContentLoaded: function(event){
			if(MlbPrefs.initOnDomContentLoaded){
				var keepExsitingIds = !DomUtils.isFramesetWindow(event.originalTarget.defaultView.top)
			   this.prepareInitialization(event, false, keepExsitingIds, false);
			}
		},
		
		prepareInitialization: function(event, onpageshow2ndCall, keepExsitingIds, installChangeListener){
         var win = event.originalTarget.defaultView
         MlbUtils.logDebugMessage('init win: "' + win.name + '"| event: ' + event.type + '| topwin: ' + (win==win.top) + '| keepexistingIds: ' + keepExsitingIds)
         var pageInitData = new PageInitData(win, onpageshow2ndCall, keepExsitingIds, installChangeListener, event.type)
         
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
		updatePage: function(topWin){
         if(!topWin)
            topWin = content
         var perfTimer = new PerfTimer()
         var pageInitData = new PageInitData(topWin, false, false, true);
         this.initPage(pageInitData)  
         MlbUtils.logDebugMessage("Update page finished: " + perfTimer.stop())
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
            pageData = this.createPageData()
		   }else if(!pageInitData.keepExsitingIds){
		   	pageData.reset()
		   }
	   	pageInitData.pageData = pageData 
	      this.setPageData(win, pageData)
         
         //Increment initCounter
         pageData.incrementInitCounter()
         
	      //Even if only a frame is loaded everything is initialized
	      //There is no performance issues as the already exisiting ids are only updated

	      if(MlbPrefs.debugPerf){
				var perfTimer = new PerfTimer()
			}
         var topWin = pageInitData.getCurrentTopWin()
         
			//Deactivate change listener
         if(!MlbPrefs.disableAutomaticPageUpdateOnChange)
            this.deactivateChangeListener(topWin)
         
		   //Init-Frames starting with top-win
		   this.initFrame(pageInitData, topWin);
         
         //Activate Change listener
         if(!MlbPrefs.disableAutomaticPageUpdateOnChange && pageInitData.installChangeListener)
            this.activateChangeListener(pageInitData)
			
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
      
      activateChangeListener: function(pageInitData){
         var topWin = pageInitData.getCurrentTopWin()
			var changeListener = function(e) {
            var node = e.relatedNode
				if(node.nodeType!=1 || 
              (node.tagName=="SPAN" && node.getAttribute(MlbCommon.ATTR_ID_SPAN_FLAG)=="true"))
               return
//				MlbUtils.logDebugMessage(e.type	+ "  " + node)
            var win = node.ownerDocument.defaultView
				Utils.executeDelayed("UPDATE_PAGE", 500, function(){
               PageInitializer.updatePage(topWin)
            })
			}
         MlbUtils.iterateFrames(topWin, function(win){
            if(!MlbUtils.isVisibleWindow(win))
               return
				this.addOrRemoveChangeListener(win, "add", changeListener)
         }, this)
			this.getPageData(topWin).setChangeListener(changeListener)
         
      },

      deactivateChangeListener: function(topWin){
         // Disable change listener
         var pageData = this.getPageData(topWin)
			var changeListener = pageData.getChangeListener()
			if (changeListener) {
            MlbUtils.iterateFrames(topWin, function(win){
   				this.addOrRemoveChangeListener(win, "remove", changeListener)
            }, this)
				pageData.setChangeListener(null)
			}
      },
		
      addOrRemoveChangeListener: function(win, addOrRemove, listenerFunc){
         if(!win.document.body)
            return
         win.document.body[addOrRemove+"EventListener"]("DOMNodeInserted", listenerFunc, true)
      },

      /*
		 * Initializes one Frame Is called recursivly @param pageInitData @param
		 * win: current win to initialize
		 * 
		 */
		initFrame: function(pageInitData, win){
			 //If document of win is editable skip it, it is a "rich-text-field", e.g. at Gmail
			 if(win.document.designMode=="on"){
			 	return
			 }

          //skip invisble frames
          if(!MlbUtils.isVisibleWindow(win)){
            return
          }
			 
          //Watch for making it editable
			 win.document.wrappedJSObject.watch("designMode", this.onChangeDesignMode)
          
			 pageInitData.setCurrentWin(win);
		
		    //Init ids for frames
          if(pageInitData.getCurrentDoc()){
   		    if(TabLocalPrefs.isIdsForFramesEnabled(win)){
   		        (new FrameIdsInitializer(pageInitData)).initIds()
   		    }
   		    
   		    //Init ids for form elements
   		    if(TabLocalPrefs.isIdsForFormElementsEnabled(win)){
   		        (new FormElementIdsInitializer(pageInitData)).initIds()
   		    }    
   		
   			//Init ids for links
   		    if(TabLocalPrefs.isIdsForLinksEnabled(win) || TabLocalPrefs.isIdsForImgLinksEnabled(win)){
//   		        this.initLinks(pageInitData)
               (new LinkIdsInitializer(pageInitData)).initIds()
   		    }
   			
             //Init ids for all other clickable elements
   		    if(TabLocalPrefs.isIdsForOtherElementsEnabled(win)){
   		        (new OtherElementIdsInitializer(pageInitData)).initIds()
   		    }
          }
		    
		    //Recursive call for all subframes
		    for(var i = 0; i<win.frames.length; i++){
             var frame = win.frames[i]
		       this.initFrame(pageInitData, win.frames[i]);
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
		 * Checks wether window already contains ids
		 */
		hasVisibleIdSpans: function(winObj){
			if(DomUtils.isFramesetWindow(winObj)){
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
       * Gets the current page data
       * @param win: arbitray content win
       * @return the page data stored in the top win
       */
      getPageData: function(win){
         if(!win)
            win = content
      	return win.top._mlbPageData
      },
      
      /*
       * Sets the current page data
       * @param win: arbitray content win
       * @param pageData
       */
      setPageData: function(win, pageData){
      	win.top._mlbPageData = pageData
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
      
      getWindowData: function(win, key){
         if(!win._mouselessStorage || !win._mouselessStorage[key])
            return null
         return win._mouselessStorage[key]
      },

      setWindowData: function(win, key, value){
         if(!win._mouselessStorage)
            win._mouselessStorage = new Object()
         win._mouselessStorage[key] = value
      },
      
      disableMlb: function(){
         Firefox.iterateAllBrowsers(function(browser){
            if(PageInitializer.getPageData(browser.contentWindow))
               PageInitializer.deactivateChangeListener(browser.contentWindow)
         })
      }
   }      
	
   var NS = mlb_common.Namespace
   NS.bindToNamespace("mouselessbrowsing", "PageInitializer", PageInitializer)
})()
}}
