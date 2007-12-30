(function(){
	var MlbCommon = { 
		//Constants
		COMMON_CHROME_ULR: "chrome://mouselessbrowsing/content/common/",
		
		MLB_GUI_ID: "{c0bcf963-624b-47fe-aa78-8cc02434cf32}",
		MLB_VERSION: null,
		MLB_CHROME_URL: "chrome://mouselessbrowsing/content/mouselessbrowsing",
		MLB_PREF_OBSERVER: "MLB_PREF_OBSERVER",
		
		//Attribute of the id-span that flags the span as an id-span
		MLB_idSpanFlag: "MLB_idSpanFlag",
		
		//Attribute of the id-span identifying the type element the id is for
		//see Tyes for id-Spans
		//Used for toggling the visibility of the id-spans
		MLB_idSpanFor: "idSpanFor",
		 
		//Types of id-Spans, the value of the Attribute MLB_idSpanFor
		MLB_idSpanForFrame: "frame",
		MLB_idSpanForImg: "img",
		MLB_idSpanForFormElem: "formelement",
		MLB_idSpanForLink: "link",
		
		//ShortcutManager-ClientId
		SCM_CLIENT_ID: "MLB",
		
		//WebProgress State-Flags
		MLB_WEBPROGRESS_STATE_START: 1,
		MLB_WEBPROGRESS_STATE_STOP: 16,
		
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
			this.loadScript(this.COMMON_CHROME_ULR+"prefs.js")
			this.loadScript(this.COMMON_CHROME_ULR+"xmlutils.js")
			this.loadScript(this.COMMON_CHROME_ULR+"listbox.js")
			this.loadScript(this.COMMON_CHROME_ULR+"keyCodeMapper.js")
			this.loadScript(this.COMMON_CHROME_ULR+"shortcutmanager.js")
			
			//Init version
			this.MLB_VERSION = rno_common.Utils.getExtension(this.MLB_GUI_ID).version
		}
	}
	
	MlbCommon.init()
	
	var NS = rno_common.Namespace
	NS.bindToNamespace("mouselessbrowsing", "MlbCommon", MlbCommon)
})()