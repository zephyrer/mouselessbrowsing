(function(){
   //Imports
   var MlbCommon = mouselessbrowsing.MlbCommon
   	
   //Constructor
	function PageData(idChars){	
		
		
		//Element Counter
		this.counter = 0
		
		//Array with id-marked elements
		this.elementsWithId = new Array(1000)

		if(idChars!=null){
			this.useCharIds = true
			this.idChars = idChars
			this.currentId = ""
			this.idToElementMap = new Object()
		}
		
		this.absolutePositionedFormElements = new Array();
	}
	
	PageData.prototype =  {
		addElementWithId: function(element){
			this.elementsWithId[this.counter] = element;
			if(this.useCharIds){
				this.idToElementMap[this.currentId] = element;
			}
		},
		
		getNextId:function(){
			this.counter = this.counter+1
			if(this.useCharIds){
				this.currentId = this.getNextCharId(this.currentId, this.currentId.length-1)
				return this.currentId
			}else{
				return this.counter
			}
		},
		
		getNextCharId: function(id, indexInId){
	      if(indexInId==-1) {
	         return this.idChars.charAt(0)+ id;
	      }
	      charAtIndex = id.charAt(indexInId);
	      indexOfCharInChars = this.idChars.indexOf(charAtIndex);
	      newValue = "";
	      if(indexOfCharInChars==this.idChars.length-1) {
	         newValue = this.replaceChar(id, indexInId, this.idChars.charAt(0));
	         return this.getNextCharId(newValue, indexInId-1);
	      }else {
	         return this.replaceChar(id, indexInId, this.idChars.charAt(indexOfCharInChars+1));
	      }
		},

	   replaceChar: function(value, index, newChar) {
	      result = "";
	      if(index!=0) {
	         result = value.substring(0, index);
	      }
	      result = result + newChar;
	      if(index!=value.length-1) {
	         result = result + value.substring(index+1);
	      }
	      return result;
	   },
		
		getElementForId:function(id){
			if(this.useCharIds){
				return this.idToElementMap[id.toUpperCase()]
			}else{
				return this.elementsWithId[id]
			}
		},
		
		hasElementWithId: function(id){
			if(this.useCharIds){
				return this.idToElementMap[id.toUpperCase()]!=null
			}else{
				return this.elementsWithId[id]!=null
			}
		},
		
		addToAbsolutePosFormElements: function(element){
			this.absolutePositionedFormElements.push(element)
		}
	}
	
	var NS = mlb_common.Namespace;
	NS.bindToNamespace("mouselessbrowsing", "PageData", PageData)
})()