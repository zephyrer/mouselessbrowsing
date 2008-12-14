with(mlb_common){
with(mouselessbrowsing){
(function(){
   function OtherElementIdsInitializer(pageInitData){
      this.AbstractInitializer(pageInitData)
   }
   
   OtherElementIdsInitializer.prototype = {
      constructor: OtherElementIdsInitializer,

      initIds: function(){
         var embeddedObjects = XPathUtils.getElements("//object | //embed", this.pageInitData.getCurrentDoc())
         for (var i = 0; i < embeddedObjects.length; i++) {
            this.insertSpanForOtherElements(embeddedObjects[i], embeddedObjects[i].parentNode, 
               MlbCommon.IdSpanTypes.OTHER, SpanPosition.NORTH_EAST_OUTSIDE)
         }
         var otherElements = XPathUtils.getElements("//*[@onclick] | //*[@onmousedown] | //*[@onmouseup]| //*[@onmouseover]", this.pageInitData.getCurrentDoc())
         var currentInitCount = this.pageInitData.getInitCounter()
         for (var i = 0; i < otherElements.length; i++) {
            var otherElement = otherElements[i]
            if(DomUtils.getElementsByTagNameAndAttribute(otherElement, "span", MlbCommon.ATTR_ID_SPAN_FLAG, "true").length>0)
               continue
            var idSpan = this.pageInitData.getIdSpan(otherElement)
            if(idSpan && idSpan.mlb_initCounter==currentInitCount)
               continue
            if(this.isImageElement(otherElement, null)){
               var spanPosition = SpanPosition.NORTH_EAST_OVERLAY
            }else{
               var spanPosition = SpanPosition.APPEND_TEXT
            }
            this.insertSpanForOtherElements(otherElement, idSpan, 
               MlbCommon.IdSpanTypes.OTHER, spanPosition)
         }
      },
      
      insertSpanForOtherElements: function(element, exisitingIdSpan, spanType, spanPosition){
         if(exisitingIdSpan){
            if(this.pageInitData.keepExsitingIds){
               return
            }else{
               var idsEnabled = TabLocalPrefs.isIdsEnabledFor(this.pageInitData.getCurrentTopWin(), spanType)
               this.updateSpan(idsEnabled, exisitingIdSpan)
            }
         }else{
            var newSpan = this.getNewSpan(spanType)
            if(spanPosition==SpanPosition.APPEND_TEXT){
               this.insertSpanForTextElement(element, newSpan)
            }else{
               this.doOverlayPositioning(element, newSpan, element.parentNode, spanPosition)
            }
            this.pageInitData.addElementIdSpanBinding(element, newSpan)
            this.pageInitData.pageData.addElementWithId(element)
         }
      }
      
   }
   ObjectUtils.extend(OtherElementIdsInitializer, AbstractInitializer)
   
   Namespace.bindToNamespace("mouselessbrowsing", "OtherElementIdsInitializer", OtherElementIdsInitializer)
})()
}}