/*
 * Util-Functions of MLB
 * Rudolf Noé
 * 31.12.2007 
 */
(function(){
	
	//Imports
	var MlbCommon = mouselessbrowsing.MlbCommon
	
	var MlbUtils = {
		/*
		 * Determines wether the provided span-node is an Id-Span
		 * @param DOM-Element
		 * @returns boolean
		 */
		isIdSpan: function(element){
         return element.getAttribute && element.getAttribute(MlbCommon.ATTR_ID_SPAN_FLAG)!=null;
      },
	}
	var NS = rno_common.Namespace
	NS.bindToNamespace("mouselessbrowsing", "MlbUtils", MlbUtils)
})()