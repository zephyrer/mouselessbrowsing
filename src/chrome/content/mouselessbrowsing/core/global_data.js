/*
 * Global data needed in all MLB JS Files
 */
(function(){
	var GlobalData = {
      previousVisibilityMode: null,
	}
   var NS = mlb_common.Namespace
   NS.bindToNamespace("mouselessbrowsing", "GlobalData", GlobalData)
})()