var Utils = {
    prefs: Components.classes["@mozilla.org/preferences-service;1"].
                getService(Components.interfaces.nsIPrefBranch),

    getCharPref: function(key){
        return Utils.prefs.prefHasUserValue(key)?Utils.prefs.getCharPref(key):null;
    },
    
    getBoolPref: function(key){
        return Utils.prefs.prefHasUserValue(key)?Utils.prefs.getBoolPref(key):false;
    },

    hasUserPref: function(key){
    	return Utils.prefs.prefHasUserValue(key);
   	},
   	setCharPref: function(key, value){
   		Utils.prefs.setCharPref(key, value);
   	},
    /*
     * Returns true when the srcElement of the keyevent is an textfield, password-field
     * selectbox or textarea
     */
    isWritableElement: function(element){
        if(element==null || element.tagName==null)
            return false;
        var tagName = element.tagName.toUpperCase();
        var type = element.type?element.type.toUpperCase():"";
        var isWritableFormElement = (tagName.indexOf("INPUT")!=-1 && (type=="TEXT" || 
                type=="PASSWORD")) || tagName.indexOf("TEXTAREA")!=-1 || 
                tagName.indexOf("SELECT")!=-1;
        return isWritableFormElement;
    },
        
    isTagName: function(element, tagName){
        if(!element || !element.tagName)
            return false;
        return element.tagName.toUpperCase()==tagName.toUpperCase();
    },
    
    isEmptyTextNode: function(element){
        if(element.nodeType==Node.TEXT_NODE && element.nodeValue=="")
            return true
        else
            return false;
    },
    
    logMessage: function (aMessage) {
        var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
                       .getService(Components.interfaces.nsIConsoleService);
        consoleService.logStringMessage(aMessage);
    },
    
    logError: function(error){
        var errorMessage = "";
        for(e in error){
            errorMessage = errorMessage + e + ": " + error[e] + "\n";
        }
        Utils.logMessage(errorMessage);
    }
}