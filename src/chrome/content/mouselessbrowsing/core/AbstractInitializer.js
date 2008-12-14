with(mlb_common){
with(mouselessbrowsing){
(function(){
   function AbstractInitializer(pageInitData){
      this.pageInitData = pageInitData
   }
   
   //Static methods
      /*
    * Set special/orignal styles according visibility of id span
    * @param element: Formelement for which the style should be set/reset
    * @param idSpanVisible: Flag indicating if the corresponding idSpan is visible
    */
   AbstractInitializer.setElementStyle = function(element, idSpanVisible){
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

   AbstractInitializer.prototype = {
      constructor: AbstractInitializer,
      AbstractInitializer: AbstractInitializer,
      
      /*
       * Creates new IdSpan
       */
      createSpan: function(){
          if(this.spanPrototype==null){
              //span
              var span = this.pageInitData.getCurrentDoc().createElement("span");
              span.style.cssText = MlbPrefs.styleForIdSpan
              
              //Lets try it with the new version for FF
              span.style.display = "inline";
              
              //Mark this span as id-span
              span.setAttribute(MlbCommon.ATTR_ID_SPAN_FLAG, "true");
              this.spanPrototype = span;
          }
          return this.pageInitData.getCurrentDoc().importNode(this.spanPrototype, true);
      },
      
      doOverlayPositioning: function(element, newSpan, parentElement, spanPosition){
         parentElement = parentElement?parentElement:element
         //Before! inserting evaluate offsets
         var elementOffsetLeft = MlbUtils.getOffsetLeftToBody(element)
         var elementOffsetTop = MlbUtils.getOffsetTopToBody(element)
         
         //Set link position relative but only if neither the link nor one of its descendants are positioned
         //as this would lead to disarrangements
         //See also MLB issue 25, 37,
         if(!this.isPositionedElement(parentElement)){
            parentElement.style.position="relative"
         }

         //Insert Link with absolute Positioning
         newSpan.style.position="absolute"
         newSpan.style.left="0px"
         newSpan.style.top="0px"
         if(parentElement==element)
            element.appendChild(newSpan)
         else
            DomUtils.insertAfter(newSpan, element)
         
         
         //If img is to small relative to the span do not overlay image
         var factor = 2
         if(element.offsetWidth<factor*newSpan.offsetWidth && 
             element.offsetHeight<factor*newSpan.offsetHeight){
            newSpan.style.position="relative"
            return newSpan
         }
         
         //Offsets for img Element
         var idSpanOffsetLeft = MlbUtils.getOffsetLeftToBody(newSpan)
         var idSpanOffsetTop = MlbUtils.getOffsetTopToBody(newSpan)
         var left = elementOffsetLeft - idSpanOffsetLeft + element.offsetWidth
         if(spanPosition==SpanPosition.NORTH_EAST_OUTSIDE){
            //Display in the right upper corner next to the element, as overlay is for e.g. for embedded objects not possible
            var currentMarginRight = this.getComputedStyle(element).marginRight
            currentMarginRight = StringUtils.isEmpty(currentMarginRight)?parseInt(currentMarginRight):0
            element.style.marginRight = (newSpan.offsetWidth-currentMarginRight) + "px" 
         }else if(spanPosition==SpanPosition.NORTH_EAST_OVERLAY){
            left =  left - newSpan.offsetWidth
         }else{
            throw new Error('unkown span position')
         }
         var top = elementOffsetTop - idSpanOffsetTop
         newSpan.style.left = left+"px"
         newSpan.style.top = top+"px"
         newSpan.style.backgroundColor="#EEF3F9"
         newSpan.style.color="black"
         return newSpan
      },
 
      getComputedStyle: function(element){
         return element.ownerDocument.defaultView.getComputedStyle(element, null)
      },
      
      /*
       *  Gets new span for id; 
       */
      getNewSpan: function(typeOfSpan){
          var newSpan = this.createSpan();
          this.setNewSpanId(newSpan)
          //Setting the type the element the id span is created for
          newSpan.setAttribute(MlbCommon.ATTR_ID_SPAN_FOR, typeOfSpan);
          return newSpan;
      },

      findParentOfLastTextNode: function(element){
         var childNodes = element.childNodes
         for (var i = childNodes.length-1; i >= 0; i--) {
            var child = childNodes.item(i)
            if(child.nodeType==Node.TEXT_NODE && !XMLUtils.isEmptyTextNode(child)){
               return element
            }else if (child.hasChildNodes() && this.isElementVisible(child)){
               var result = this.findParentOfLastTextNode(child)
               if(result!=null){
                  return result
               }
            }
         }
         return null;
      },
      
      insertSpanForTextElement: function(element, newSpan){
         //Append to last element in link except for imgages for better style
         var parentOfLastTextNode = this.findParentOfLastTextNode(element)
         if(parentOfLastTextNode!=null){
            parentOfLastTextNode.appendChild(newSpan)
         }else{
            element.appendChild(newSpan);
         }
         return newSpan
      },
      
      /*
       * Checks wether an element is currently visible to avoid appending ids to invisible links
       */
      isElementVisible: function(element){
         //Comment out 08.10.2008 due to mail from Martijn
         /*if(element.className=="" && element.getAttribute('style')==null){
            return true
         }*/
         if(!DomUtils.isVisible(element) ||
            //heuristic values
            element.offsetLeft<-100 || element.offsetTop<-100){
            return false
         }
         return true
      },
      
      isImageElement: function(element, idSpanType){
         if(element.hasAttribute("mlb_image_elem"))
            return true
         var isImage = false
         if(element.getElementsByTagName('img').length>0 ||
            StringUtils.isEmpty(element.textContent) || StringUtils.trim(element.textContent).length==0){
            isImage = true
         }
         //Check if any visible text is there
         function hasVisibleText(element){
            if(!element.hasChildNodes() || !DomUtils.isVisible(element))
               return false
            var children = element.childNodes
            for (var i = 0; i < children.length; i++) {
               var child = children[i]
               if(child.nodeType==3 && !XMLUtils.isEmptyTextNode(child))
                  return true
               else if (child.nodeType==1){
                  var hasText = hasVisibleText(child)
                  if(hasText)
                     return true
               }
                  
            }
            return false
         }
         if(!isImage)
            isImage = !hasVisibleText(element)
         if(isImage)
            element.setAttribute("mlb_image_elem", "true")
         return isImage 
      },

      isPositionedElement: function(element){
         var style = this.getComputedStyle(element)
         if(style.position!="static")
            return true
         if(element.hasChildNodes()){
            for (var i = 0; i < element.childNodes.length; i++) {
               var node = element.childNodes[i]
               if(node.nodeType==1 && this.isPositionedElement(node)){
                  return true
               }
            }
         }
         return false
      },
      
      setNewSpanId: function(span){
         span.mlb_initCounter = this.pageInitData.getInitCounter()
         var newId = this.pageInitData.pageData.getNextId();
         span.textContent = newId
      },

      /*
       * Updates an id span which already exists
       */
      updateSpan: function(visible, span){
         if(visible){
            this.setNewSpanId(span) 
            span.style.display = "inline";
          }else{
            span.style.display = "none";
          }
      },

     
   }
   
   Namespace.bindToNamespace("mouselessbrowsing", "AbstractInitializer", AbstractInitializer)

   SpanPosition = {
      NORTH_EAST_OVERLAY: "NORTH_EAST_OVERLAY",
      NORTH_EAST_OUTSIDE: "NORTH_EAST_OUTSIDE",
      APPEND_TEXT: "APPEND_TEXT" 
   }      
   Namespace.bindToNamespace("mouselessbrowsing", "SpanPosition", SpanPosition)
})()
}}