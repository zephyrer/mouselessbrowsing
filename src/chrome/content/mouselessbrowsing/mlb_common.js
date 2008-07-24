/**
 * Contains constants and loading of common subscripts
 */
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
		
		//ShortcutManager-ClientId
		SCM_CLIENT_ID: "MLB",
		
		/*
		 * Loads Script from url
		 * Must be local url
		 */
		loadScript: function(url){
			var sm = Components.classes["@mozilla.org/moz/jssubscript-loader;1"].
							getService(Components.interfaces.mozIJSSubScriptLoader)
			sm.loadSubScript(url);
		},
		
		init: function(){
			//Load subscripts
			this.loadScript(this.COMMON_CHROME_ULR+"namespace.js")
			this.loadScript(this.COMMON_CHROME_ULR+"constants.js")
			this.loadScript(this.COMMON_CHROME_ULR+"utils.js")
			this.loadScript(this.COMMON_CHROME_ULR+"ControlUtils.js")
			this.loadScript(this.COMMON_CHROME_ULR+"string_utils.js")
			this.loadScript(this.COMMON_CHROME_ULR+"prefs.js")
			this.loadScript(this.COMMON_CHROME_ULR+"xmlutils.js")
			this.loadScript(this.COMMON_CHROME_ULR+"listbox.js")
			this.loadScript(this.COMMON_CHROME_ULR+"keyCodeMapper.js")
			this.loadScript(this.COMMON_CHROME_ULR+"shortcutmanager.js")
			this.loadScript(this.COMMON_CHROME_ULR+"perf_timer.js")
			
			//Init version
			this.MLB_VERSION = rno_common.Utils.getExtension(this.MLB_GUI_ID).version
		}
	}
	
	MlbCommon.init()
	
	var NS = rno_common.Namespace
	NS.bindToNamespace("mouselessbrowsing", "MlbCommon", MlbCommon)
})()