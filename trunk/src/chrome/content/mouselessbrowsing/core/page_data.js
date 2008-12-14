(function(){
   //Imports
   var MlbCommon = mouselessbrowsing.MlbCommon
   	
   //Constructor
	function PageData(idChars){	
		
      this.changeListener = null
      
      //id to object/span map
      //key: unique id which is set as attribute on element and idSpan
      //value: Object with element and idSpan property
      this.elementIdSpanMap = new Object()
      //numeric key for binding map
      this.elementIdSpanMapKey = 0
      //Counter which hold the actual number of initializations
      this.initCounter = 0
      
      this.initResetableMembers()
	}
   
   //Static create method to enable hooking of layout debugger
   PageData.createPageData = function(idChars){
      return new PageData(idChars)
   }
	
	PageData.prototype =  {

      getInitCounter: function(){
         return this.initCounter
      },
      
      setInitCounter: function(initCounter){
         this.initCounter = initCounter
      },

      getChangeListener: function(){
         return this.changeListener
      },

      setChangeListener: function(changeListener){
         this.changeListener = changeListener
      },
      
      addElementIdSpanBinding: function(element, idSpan){
         var bindingKey = this.elementIdSpanMapKey++
         this.elementIdSpanMap[bindingKey]= {element:element, idSpan: idSpan}
         element.setAttribute(MlbCommon.MLB_BINDING_KEY_ATTR, bindingKey) 
         idSpan.setAttribute(MlbCommon.MLB_BINDING_KEY_ATTR, bindingKey) 
      },
      
      getElementBySpan: function(refSpan){
         if(!refSpan.hasAttribute(MlbCommon.MLB_BINDING_KEY_ATTR))
            return null
         return this.elementIdSpanMap[refSpan.getAttribute(MlbCommon.MLB_BINDING_KEY_ATTR)].element
      },
      
      getIdSpanByElement: function(refElement){
         if(!refElement.hasAttribute(MlbCommon.MLB_BINDING_KEY_ATTR))
            return null
         return this.elementIdSpanMap[refElement.getAttribute(MlbCommon.MLB_BINDING_KEY_ATTR)].idSpan
      },
      
      incrementInitCounter: function(){
         return ++this.initCounter
      },
      
      initResetableMembers: function(idChars){
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
      },

      addElementWithId: function(element){
			this.elementsWithId[this.counter] = element;
			if(this.useCharIds){
				this.idToElementMap[this.currentId] = element;
			}
		},
		
		getElementForId:function(id){
			if(this.useCharIds){
				return this.idToElementMap[id.toUpperCase()]
			}else{
				return this.elementsWithId[id]
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

      hasElementWithId: function(id){
			if(this.useCharIds){
				return this.idToElementMap[id.toUpperCase()]!=null
			}else{
				return this.elementsWithId[id]!=null
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
      
      reset: function(){
         this.initResetableMembers() 
      },
		
		
	}
	
	var NS = mlb_common.Namespace;
	NS.bindToNamespace("mouselessbrowsing", "PageData", PageData)
})()