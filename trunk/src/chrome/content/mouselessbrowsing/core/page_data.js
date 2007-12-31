(function(){
   //Imports
   var MlbCommon = mouselessbrowsing.MlbCommon
   	
   //Constructor
	function PageData(){	
	}
	
	PageData.prototype =  {
		//Element Counter
		counter: 0,
		//Array with id-marked elements
		elementsWithId: new Array(1000),
		
		//Object used as map to store the number of Ids
		//used in this window/frame and all its subframes
		//Key: window.name; Value: number of ids (including the ids of all subframes)
		numberOfIdsMap: new Object(),
		
		//Object used as map to store the start-id of windows/frames
		//Key: window.name; Value: start-id
		startIdMap: new Object(),

		//Flag which indicates that document is already initialised
		//i.e. the ids were inserted
		//Used for frames
		initialized: false,

		//previousVisisbility Mode
		previousVisibilityMode: MlbCommon.VisibilityModes.CONFIG,
	}
	
	var NS = rno_common.Namespace;
	NS.bindToNamespace("mouselessbrowsing", "PageData", PageData)
})()