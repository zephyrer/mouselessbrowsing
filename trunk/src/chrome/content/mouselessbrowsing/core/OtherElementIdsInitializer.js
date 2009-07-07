with(mlb_common){
with(mouselessbrowsing){
(function(){
   
   REG_EX_WITHESPACE =  /^\s*$/
   
   function OtherElementIdsInitializer(pageInitData){
      this.AbstractInitializer(pageInitData)
   }
   
   OtherElementIdsInitializer.prototype = {
      constructor: OtherElementIdsInitializer,

      _initIds: function(){
         var embeddedObjects = XPathUtils.getElements("//object | //embed", this.pageInitData.getCurrentDoc())
         for (var i = 0; i < embeddedObjects.length; i++) {
            var embeddedObject = embeddedObjects[i]
            if(embeddedObject.offsetWidht<2 || embeddedObject.offsetHeight<2)
               continue
            this.insertSpanForOtherElements(embeddedObject, this.pageInitData.getIdSpan(embeddedObject), 
               MlbCommon.IdSpanTypes.OTHER, SpanPosition.NORTH_EAST_OUTSIDE)
         }
         var xPathExp = "//*[(@onclick or @onmousedown or @onmouseup or @onmouseover) and " +
                           "not(@role='presentation' or @role='wairole:presentation')]"
         var otherElements = XPathUtils.getElements(xPathExp, this.pageInitData.getCurrentDoc())
         var currentInitCount = this.pageInitData.getInitCounter()
         for (var i = 0; i < otherElements.length; i++) {
            var otherElement = otherElements[i]
            var idSpan = this.pageInitData.getIdSpan(otherElement)
            //These continue conditions are neccessary as event handlers for the same element could be located on multiple levels 
            //(not only on the element itself)  
            if(idSpan){//If the element already has an associated id span
               if(idSpan.mlb_initCounter==currentInitCount){//and if the element was already updated in this update cycle
                  continue
               }
            //The element hasn't got an associated id span but a descendend element could already have
            }else if(DomUtils.getElementsByTagNameAndAttribute(otherElement, "span", MlbCommon.ATTR_ID_SPAN_FLAG, "true").length>0 ||
               !this.isMarkableElement(otherElement)){//or the element is not markable
               continue
            }

            var spanPosition = null
            if(MlbPrefs.smartPositioning){
               if(this.isImageElement(otherElement, null)){
                  spanPosition = SpanPosition.NORTH_EAST_INSIDE
               }else{
                  spanPosition = SpanPosition.APPEND_TEXT
               }
            }else{
               spanPosition = SpanPosition.NATURAL_FLOW     
            }
            this.insertSpanForOtherElements(otherElement, idSpan, 
               MlbCommon.IdSpanTypes.OTHER, spanPosition)
         }
      },
      
      insertSpanForOtherElements: function(element, exisitingIdSpan, spanType, spanPosition){
         if(exisitingIdSpan){
            if(this.pageInitData.getKeepExistingIds()){
               return
            }else{
               this.updateSpan(exisitingIdSpan)
            }
         }else{
            var newSpan = this.getNewSpan(spanType)
            this.insertIdSpan(newSpan, element, element.parentNode, spanPosition, AbstractInitializer.getImgOverlayStyles())
            this.pageInitData.addElementIdSpanBinding(element, newSpan)
         }
         this.pageInitData.pageData.addElementWithId(element)
      },
      
      //TODO make it correct
      isMarkableElement: function(element){
         if(element.offsetWidth<2 || element.offsetHeight<2)
            return false
         var style = this.getComputedStyle(element)
         if(!this.isTextElement(element) && style.backgroundImage=="none" && element.getElementsByTagName('img').length==0)
            return false
         return true
      }
      
   }
   ObjectUtils.extend(OtherElementIdsInitializer, AbstractInitializer)
   
   Namespace.bindToNamespace("mouselessbrowsing", "OtherElementIdsInitializer", OtherElementIdsInitializer)
})()
}}