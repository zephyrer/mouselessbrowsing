MLB_PageDataClass = {
	//Constructor
	PageData: function(){
		//Element Counter
		this.counter=0;
		//Array with id-marked elements
		this.elementsWithId = new Array(1000);
		
		//Object used as map to store the number of Ids
		//used in this window/frame and all its subframes
		//Key: window.name; Value: number of ids (including the ids of all subframes)
		this.numberOfIdsMap = new Object();
		
		//Object used as map to store the start-id of windows/frames
		//Key: window.name; Value: start-id
		this.startIdMap = new Object();

		
		//Flag which indicates that document is already initialised
		//i.e. the ids were inserted
		//Used for frames
		this.initialized = false;

		//
		//previousVisisbility Mode
		previousVisibilityMode = "config";
	}
}