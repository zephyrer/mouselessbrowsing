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
         var otherElements = XPathUtils.getElements("//*[@onclick] | //*[@onmousedown] | //*[@onmouseup]| //*[@onmouseover]", this.pageInitData.getCurrentDoc())
         var currentInitCount = this.pageInitData.getInitCounter()
         for (var i = 0; i < otherElements.length; i++) {
            var otherElement = otherElements[i]
            if(DomUtils.getElementsByTagNameAndAttribute(otherElement, "span", MlbCommon.ATTR_ID_SPAN_FLAG, "true").length>0 ||
               !this.isMarkableElement(otherElement)){
               continue
            }
            var idSpan = this.pageInitData.getIdSpan(otherElement)
            if(idSpan && idSpan.mlb_initCounter==currentInitCount)
               continue
            if(this.isImageElement(otherElement, null)){
               var spanPosition = SpanPosition.NORTH_EAST_INSIDE
            }else{
               var spanPosition = SpanPosition.APPEND_TEXT
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
            if(spanPosition==SpanPosition.APPEND_TEXT){
               this.insertSpanForTextElement(element, newSpan)
            }else{
               this.doOverlayPositioning(element, newSpan, element.parentNode, spanPosition)
            }
            this.pageInitData.addElementIdSpanBinding(element, newSpan)
         }
         this.pageInitData.pageData.addElementWithId(element)
      },
      
      //TODO make it correct
      isMarkableElement: function(element){
         var style = this.getComputedStyle(element)
         if(!this.isTextElement(element) && style.backgroundImage=="none" && element.getElementsByTagName('img').length==0)
            return false
         if(element.offsetWidth<2 || element.offsetHeight<2)
            return false
         return true
      }
      
   }
   ObjectUtils.extend(OtherElementIdsInitializer, AbstractInitializer)
   
   Namespace.bindToNamespace("mouselessbrowsing", "OtherElementIdsInitializer", OtherElementIdsInitializer)
})()
}}