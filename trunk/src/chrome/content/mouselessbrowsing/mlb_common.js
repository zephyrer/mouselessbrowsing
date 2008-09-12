/**
 * Contains constants and loading of common subscripts
 */
 DE_MOUSELESS_EXTENSION_NS = null;
(function(){
	var MlbCommon = { 
		//Constants
		COMMON_CHROME_ULR: "chrome://mouselessbrowsing/content/common/",
		
		MLB_GUI_ID: "{c0bcf963-624b-47fe-aa78-8cc02434cf32}",
		MLB_VERSION: null,
		MLB_CHROME_URL: "chrome://mouselessbrowsing/content/mouselessbrowsing",
		MLB_PREF_OBSERVER: "MLB_PREF_OBSERVER",
		
		//Attribute of the id-span that flags the span as an id-span
		ATTR_ID_SPAN_FLAG: "MLB_idSpanFlag",

		//Attribute of the id-span identifying the type element the id is for
		//see Tyes for id-Spans
		//Used for toggling the visibility of the id-spans
		ATTR_ID_SPAN_FOR: "idSpanFor",
		
		//Attribute of id span containing the element it belongs to
		//Not fill in every case
		ATTR_ELEMENT_FOR_ID_SPAN: "idSpanElement",
		 
		//Types of id-Spans, the value of the Attribute MLB_idSpanFor
		IdSpanTypes: {
			FRAME: "FRAME",
			IMG: "IMG",
			FORMELEMENT: "FORMELEMENT",
			LINK: "LINK"
		},
		
		VisibilityModes: {
			ALL: "ALL",
			CONFIG: "CONFIG",
			NONE: "NONE"
		},
		
		ModifierCodes:{
			CTRL: 1,
			ALT: 2,
			SHIFT: 4
		},
		
		IdTypes:{
			NUMERIC: "NUMERIC",
			CHAR: "CHAR"
		},
		
		OpenLinkLocations:{
			TAB:"TAB",
			WINDOW:"WINDOW",
			COOLIRIS_PREVIEW:"COOLIRIS_PREVIEW"
		},
		
		//ShortcutManager-ClientId
		SCM_CLIENT_ID: "MLB",
		
		/*
		 * Loads Script from url
		 * Must be local url
		 */
		loadScript: function(url, scopeObj){
			var sm = Components.classes["@mozilla.org/moz/jssubscript-loader;1"].
							getService(Components.interfaces.mozIJSSubScriptLoader)
			sm.loadSubScript(url, scopeObj);
		},
		
		init: function(){
			//Create Namespace objects
			DE_MOUSELESS_EXTENSION_NS = window['mlb_common'] = new Object()
			//Load subscripts
			this.loadScript(this.COMMON_CHROME_ULR+"namespace.js", DE_MOUSELESS_EXTENSION_NS)
			this.loadScript(this.COMMON_CHROME_ULR+"constants.js", DE_MOUSELESS_EXTENSION_NS)
			this.loadScript(this.COMMON_CHROME_ULR+"utils.js", DE_MOUSELESS_EXTENSION_NS)
			this.loadScript(this.COMMON_CHROME_ULR+"ControlUtils.js", DE_MOUSELESS_EXTENSION_NS)
			this.loadScript(this.COMMON_CHROME_ULR+"string_utils.js", DE_MOUSELESS_EXTENSION_NS)
			this.loadScript(this.COMMON_CHROME_ULR+"xmlutils.js", DE_MOUSELESS_EXTENSION_NS)
			this.loadScript(this.COMMON_CHROME_ULR+"prefs.js", DE_MOUSELESS_EXTENSION_NS)
			this.loadScript(this.COMMON_CHROME_ULR+"pref_utils.js", DE_MOUSELESS_EXTENSION_NS)
			this.loadScript(this.COMMON_CHROME_ULR+"listbox.js", DE_MOUSELESS_EXTENSION_NS)
			this.loadScript(this.COMMON_CHROME_ULR+"keyinputbox.js", DE_MOUSELESS_EXTENSION_NS)
			this.loadScript(this.COMMON_CHROME_ULR+"keyCodeMapper.js", DE_MOUSELESS_EXTENSION_NS)
			this.loadScript(this.COMMON_CHROME_ULR+"shortcutmanager.js")
			this.loadScript(this.COMMON_CHROME_ULR+"perf_timer.js", DE_MOUSELESS_EXTENSION_NS)
			//Reset namespace object
			DE_MOUSELESS_EXTENSION_NS = null

			//Init version
			this.MLB_VERSION = mlb_common.Utils.getExtension(this.MLB_GUI_ID).version
		}
	}
	
	MlbCommon.init()
	
	var NS = mlb_common.Namespace
	NS.bindToNamespace("mouselessbrowsing", "MlbCommon", MlbCommon)
})()