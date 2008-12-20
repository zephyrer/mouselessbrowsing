with(mlb_common){
with(mouselessbrowsing){
(function(){
   function FormElementIdsInitializer(pageInitData){
      this.AbstractInitializer(pageInitData)
   }
   
   FormElementIdsInitializer.prototype = {
      constructor: FormElementIdsInitializer,

      /*
       * Init for form-elements
      */
      _initIds: function (){
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
            
            if(MlbPrefs.omitSmartPosForCheckboxAndRadio && (MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.CHECKBOX) || 
                  MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.RADIO))){
               element.setAttribute("mlb_smartPositioning", "false")
            }
            
            var parent = element.parentNode;
            var idSpan = this.pageInitData.getIdSpan(element);
            if (idSpan != null) {
               if (this.pageInitData.getKeepExistingIds()) {
                  if(MlbPrefs.smartPositioning && element.getAttribute("mlb_smartPositioning")!="false"){
                     this.doOverlayPositioningForFormelements(element, idSpan)
                  }
                  continue
               } else {
                  this.updateSpan(idSpan);
               }
            } else {
               // Generate new span
               var newSpan = this.getNewSpan(MlbCommon.IdSpanTypes.FORMELEMENT);
               
               if(element.hasAttribute('role') && this.isTextElement(element)){
                  this.insertSpanForTextElement(element, newSpan)
                  element.setAttribute("mlb_smartPositioning", "false")
               }else if(element.nextSibling != null) {
                  newSpan = parent.insertBefore(newSpan, element.nextSibling);
               } else {
                  newSpan = parent.appendChild(newSpan);
               }
               this.pageInitData.addElementIdSpanBinding(element, newSpan)

               if (MlbPrefs.smartPositioning && element.getAttribute("mlb_smartPositioning")!="false") {
                  this.doOverlayPositioningForFormelements(element, newSpan)
               }
            }
            element = MlbUtils.isEditableIFrame(element)?element.contentDocument.body:element
            this.pageInitData.pageData.addElementWithId(element)
         }
      },
      
      /*
       * Do the smart/overlay positioning of formelements
       * Separate method so it can be called twice in case of double initialization (see onpageshow2ndCall)
       */
      doOverlayPositioningForFormelements: function(element, idSpan){
         var style = idSpan.style
         
         //Calculate left and top
         if(MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.TEXT) || 
            MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.PASSWORD) ||
            MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.TEXTAREA) ||
            MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.IFRAME) ||
            (MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.SELECT) && element.size>1)){
            style.borderColor="#7F9DB9"
            var compStyle = this.getComputedStyle(element)
            style.color = compStyle.color
            if(MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.IFRAME)){
               //Because of scrollbars and the iframe has almost always background transparent
               style.backgroundColor = "white"
            }else{
               style.backgroundColor = compStyle.backgroundColor
            }
            this.positionIdSpan(idSpan, element, SpanPosition.NORTH_EAST_INSIDE)   
         }else if(MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.BUTTON) ||
                   MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.RADIO) ||
                   MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.CHECKBOX) ||
                   MlbUtils.isElementOfType(element, MlbUtils.ElementTypes.SELECT)){
            //Pos in middle next to button
            this.positionIdSpan(idSpan, element, SpanPosition.EAST_OUTSIDE)
         }else{
            throw new Error('unknown element type for element ' + element.tagName)
         }
      }
      
   }
   ObjectUtils.extend(FormElementIdsInitializer, AbstractInitializer)
   
   Namespace.bindToNamespace("mouselessbrowsing", "FormElementIdsInitializer", FormElementIdsInitializer)
})()
}}