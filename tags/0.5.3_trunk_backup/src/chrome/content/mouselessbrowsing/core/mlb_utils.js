/*
 * Util-Functions of MLB
 * Rudolf Noé
 * 31.12.2007 
 */
(function(){
	
	//Imports
	var MlbCommon = mouselessbrowsing.MlbCommon
	var MlbPrefs = mouselessbrowsing.MlbPrefs
	var Utils = mlb_common.Utils
	var XMLUtils = mlb_common.XMLUtils 
	var COOLIRIS_PREVIEWS_GUI_ID = "{CE6E6E3B-84DD-4cac-9F63-8D2AE4F30A4B}"
	
	var MlbUtils = {
      /*
       * Returns an array with all window object of all frames included in the provided win (inkl. the provided win itself)
       */
      getAllFrames: function(win, resultArray){
          if(resultArray==null){
            resultArray = new Array()
            resultArray.push(win)
          }
          for (var i = 0; i < win.frames.length; i++) {
            var frame = win.frames[i]
            resultArray.push(frame)
            this.getAllFrames(frame, resultArray)
          } 
          return resultArray
      },
      
      getPageData: function(win){
         if(!win)
            win = content
         return win.top._mlbPageData
      },
      
		isElementOfType: function(element, type){
			if(this.ElementTypes.TEXT==type){
				return XMLUtils.isTagName(element, "INPUT") && "text"==element.type
			}else if (this.ElementTypes.PASSWORD==type){
            return XMLUtils.isTagName(element, "INPUT") && "password"==element.type
			}else if(this.ElementTypes.TEXTAREA==type){
            return XMLUtils.isTagName(element, "TEXTAREA")
         }else if(this.ElementTypes.SELECT==type){
            return XMLUtils.isTagName(element, "SELECT")
         }else if(this.ElementTypes.BUTTON==type){
            return XMLUtils.isTagName(element, "BUTTON") || 
                     (XMLUtils.isTagName(element, "INPUT") && "button"==element.type) ||
                     (XMLUtils.isTagName(element, "INPUT") && "submit"==element.type) ||
                     (XMLUtils.isTagName(element, "INPUT") && "reset"==element.type)  ||
                     (XMLUtils.isTagName(element, "INPUT") && "image"==element.type)  ||
                     (XMLUtils.isTagName(element, "INPUT") && "file"==element.type) ||
                     (element.hasAttribute('role') && element.getAttribute('role').indexOf("button")!=-1)
         }else if(this.ElementTypes.CHECKBOX==type){
            return XMLUtils.isTagName(element, "INPUT") && "checkbox"==element.type
         }else if(this.ElementTypes.RADIO==type){
            return XMLUtils.isTagName(element, "INPUT") && "radio"==element.type
         }else if(this.ElementTypes.FIELDSET==type){
            return XMLUtils.isTagName(element, "FIELDSET")
         }else if(this.ElementTypes.FILE==type){
         	return XMLUtils.isTagName(element, "INPUT") && "file"==element.type
         }else if(this.ElementTypes.IFRAME==type){
            return XMLUtils.isTagName(element, "IFRAME")	
         }
         return false
		},
		
		isCoolirisPreviewsInstalled: function(){
			return Utils.isExtensionInstalledAndEnabled(COOLIRIS_PREVIEWS_GUI_ID)
		},
		
      isEditableIFrame: function(element){
      	if((element instanceof HTMLDocument && element.designMode=="on") ||
      	  (element.tagName && element.tagName.toUpperCase()=="IFRAME" && element.contentDocument.designMode=="on")){
      	  return true
         }else{
         	return false
         }
      },
      
      
      /*
       * Determines wether the provided span-node is an Id-Span
       * @param DOM-Element
       * @returns boolean
       */
      isIdSpan: function(element){
         return element.getAttribute && element.getAttribute(MlbCommon.ATTR_ID_SPAN_FLAG)!=null;
      },

      /*
      * Returns true when the srcElement of the keyevent is an textfield, password-field
      * selectbox or textarea
      */
      isWritableElement: function(element){
         if(element==null || element.tagName==null)
             return false;
         var tagName = element.tagName.toUpperCase();
         var type = element.type?element.type.toUpperCase():"";
         var isWritableFormElement = (tagName.indexOf("INPUT")!=-1 && (type=="TEXT" || 
                 type=="PASSWORD")) || tagName.indexOf("TEXTAREA")!=-1 || 
                 tagName.indexOf("SELECT")!=-1 ||
                 element.ownerDocument.designMode=="on"
         return isWritableFormElement;
      },
      
      isVisibleWindow: function(win){
         return win.innerHeight!=0 && win.innerWidth!=0
      },
      
      iterateFrames: function(win, handler, thisObj){
         var frames = this.getAllFrames(win)
         for (var i = 0; i < frames.length; i++) {
            if(thisObj)
               handler.apply(thisObj, [frames[i]])
            else
               handler(frames[i])
         }
      },
      
      logDebugMessage: function(messageString){
         Utils.logDebugMessage("MLB: " + messageString, MlbPrefs.DEBUG_PREF_ID)
      },
      
      /*
       * Sets the current page data
       * @param win: arbitray content win
       * @param pageData
       */
      setPageData: function(win, pageData){
         win.top._mlbPageData = pageData
      },
      
      showMlbHelp: function() {
         Utils.openUrlInNewTab("http://mlb.rudolf-noe.de", true)
      },
      
      ElementTypes: {
         BUTTON: "BUTTON",
         CHECKBOX: "CHECKBOX",
         FIELDSET: "FIELDSET",
         FILE: "FILE",
         PASSWORD: "PASSWORD",
         RADIO: "RADIO",
         SELECT: "SELECT",
         TEXT: "TEXT",
         TEXTAREA: "TEXTAREA"
      }
	}
	var NS = mlb_common.Namespace
	NS.bindToNamespace("mouselessbrowsing", "MlbUtils", MlbUtils)
})()