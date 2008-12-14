with(mlb_common){
with(mouselessbrowsing){
(function(){
   function LinkIdsInitializer(pageInitData){
      this.AbstractInitializer(pageInitData)
   }
   
   LinkIdsInitializer.prototype = {
      constructor: LinkIdsInitializer,

      /*
          Init for Links
      */
      initIds: function() {
         //For performance reasons in case of keep existing ids only the not initialized a are taken
         var xpathExp = "//A"
         if (this.pageInitData.keepExsitingIds) {
            xpathExp += "[not(@MLB_hasIdSpan)]"          
         }
         //ARI syntax
         xpathExp += "|//*[@role='link']"
         
         var topWin = this.pageInitData.getCurrentTopWin()
         var doc = this.pageInitData.getCurrentDoc()
         var links = doc.evaluate(xpathExp, doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)

         // Limit max. number of links
         var maxIdNumber = MlbPrefs.maxIdNumber

         for (var i = 0; i < links.snapshotLength; i++) {
            if (this.pageInitData.pageData.counter >= maxIdNumber) {
               break;
            }

            var link = links.snapshotItem(i);
            // is there anything noteworth
            if (!link.hasAttribute(MlbCommon.MLB_BINDING_KEY_ATTR) && !this.isMarkableLink(link)) {
               continue;
            }

            // Display image links?
//          var isImageLink = this.isImageLink(link);
            //TODO check
            var isImageLink = this.isImageElement(link, MlbCommon.IdSpanTypes.IMG);

            var idSpan = this.pageInitData.getIdSpan(link);

            // Check against preferences
            if (idSpan == null &&
                  ((isImageLink && !TabLocalPrefs.isIdsForImgLinksEnabled(topWin)) || 
                  (!isImageLink && !TabLocalPrefs.isIdsForLinksEnabled(topWin)))) {
               continue;
            }

            // Is there already a span with the id
            if (idSpan != null) {
               if (this.pageInitData.keepExsitingIds) {
                  continue
               } else {
                     var showIdSpan = isImageLink
                        && TabLocalPrefs.isIdsForImgLinksEnabled(topWin)
                        || !isImageLink
                        && TabLocalPrefs.isIdsForLinksEnabled(topWin);
                  this.updateSpan(showIdSpan, idSpan);
               }
            } else {
               // Insert new Span
               if (isImageLink) {
                  var newSpan = this.insertSpanForImageLink(link)
               } else {
                  var newSpan = this.insertSpanForTextLink(link)
               }
               // Set reference to idSpan
               this.pageInitData.addElementIdSpanBinding(link, newSpan)
            }
            // Update elements array
            this.pageInitData.pageData.addElementWithId(link);
         }
      },
      
      insertSpanForImageLink: function(link){
         var newSpan = this.getNewSpan(MlbCommon.IdSpanTypes.IMG);
         if(MlbPrefs.smartPositioning){
            var imgElements = link.getElementsByTagName("img")
            var imgElement = null
            if(imgElements.length==0)
               imgElement = link
            else
               imgElement = imgElements[0]
            return this.doOverlayPositioning(imgElement, newSpan, link, SpanPosition.NORTH_EAST_OVERLAY)
         }else{
            return link.appendChild(newSpan)
         }             
      },
      
      insertSpanForTextLink: function(link){
         var newSpan = this.getNewSpan(MlbCommon.IdSpanTypes.LINK);
         return this.insertSpanForTextElement(link, newSpan)
      },

      /*
       * Checks wether an id span should be appended to an link
       * TODO: Check for performance issues
       */
      isMarkableLink: function(link){
         // No real link
         if (link.tagName=="A" && 
               (StringUtils.isEmpty(link.getAttribute("href")) ||  link.getAttribute("href")=="#") &&
               link.getAttribute("onclick") == null)
            return false;

         // Img Link is ok or with class is ok
         if (link.getElementsByTagName("img").length > 0
               || link.className != null)
            return true;

         // empty link
         if (link.innerHTML == "" || !link.text
               || link.text.replace(this.regexWhitespace, "").length == 0)
            return false;

         return true;
      }
   }
   
   ObjectUtils.extend(LinkIdsInitializer, AbstractInitializer)
   
   Namespace.bindToNamespace("mouselessbrowsing", "LinkIdsInitializer", LinkIdsInitializer)
})()
}}