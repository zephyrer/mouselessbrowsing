with(mlb_common){
with(mouselessbrowsing){
(function(){
   function FormElementIdsInitializer(pageInitData){
      this.AbstractInitializer(pageInitData)
   }
   
   FormElementIdsInitializer.prototype = {
      constructor: FormElementIdsInitializer,

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
       * Init for form-elements
      */
      initIds: function (){
         var doc = this.pageInitData.getCurrentDoc()
         var xPathExp = "//input | //select | //textarea | //button | //iframe | //*[contains(@role,'button')] | //*[@role='menuitem']"
         var snapshot = doc.evaluate(xPathExp, doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
         for (var i = 0; i < snapshot.snapshotLength; i++) {
            var element = snapshot.snapshotItem(i)
            
            // Hidden input-fields and fieldsets do not get ids ;-)
            if (element.type == "hidden" || 
                  MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.FIELDSET) ||
                  // File fields are not clickable and focusable via JS
                  // for security reasons
                  MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.FILE) ||
                  (MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.IFRAME) && element.contentDocument.designMode=="off") ||
                  !DomUtils.isVisible(element)) {
               continue;
            }

            var parent = element.parentNode;
            var idSpan = this.pageInitData.getIdSpan(element);
            if (idSpan != null) {
               if (this.pageInitData.keepExsitingIds) {
                  if(MlbPrefs.smartPositioning){
                     this.doOverlayPositioningForFormelements(element, idSpan)
                  }
                  continue
               } else {
                  var idsEnabled = TabLocalPrefs.isIdsForFormElementsEnabled(this.pageInitData.getCurrentTopWin())
                  this.updateSpan(idsEnabled, idSpan);
                  AbstractInitializer.setElementStyle(element, idsEnabled)
               }
            } else {
               // Generate new span
               var newSpan = this.getNewSpan(MlbCommon.IdSpanTypes.FORMELEMENT);
               
               if (element.nextSibling != null) {
                  newSpan = parent.insertBefore(newSpan,
                        element.nextSibling);
               } else {
                  newSpan = parent.appendChild(newSpan);
               }
               this.pageInitData.addElementIdSpanBinding(element, newSpan)

               if (MlbPrefs.smartPositioning) {
                  this.smartFormelementPositioning(element, newSpan)
               }
            }
            element = MlbUtils.isEditableIFrame(element)?element.contentDocument.body:element
            this.pageInitData.pageData.addElementWithId(element)
         }
      },
      
      /*
       * Do the preparation of smart/overlay positioning for form elements
       * @param element: element which id span should be smart/overlayed positioned
       */
      smartFormelementPositioning:function(element, idSpan){
         //Array for backup element styles if id is off
         var elemStylesIdOff = new Array()
         //Array for backup element styles if id is on
         var elemStylesIdOn = new Array()
         
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
         this.doOverlayPositioningForFormelements(element, idSpan)
         
      },
      
      /*
       * Do the smart/overlay positioning of formelements
       * Separate method so it can be called twice in case of double initialization (see onpageshow2ndCall)
       */
      doOverlayPositioningForFormelements: function(element, idSpan){
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

   }
   ObjectUtils.extend(FormElementIdsInitializer, AbstractInitializer)
   
   Namespace.bindToNamespace("mouselessbrowsing", "FormElementIdsInitializer", FormElementIdsInitializer)
})()
}}