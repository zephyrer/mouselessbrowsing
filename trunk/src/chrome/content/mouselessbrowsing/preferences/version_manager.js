/**
 * Contains Code for migration to version 0.5
 */
(function(){
	var Prefs = mlb_common.Prefs
	var Utils = mlb_common.Utils
	var MlbUtils = mouselessbrowsing.MlbUtils
	var MlbCommon = mouselessbrowsing.MlbCommon
	
   var VersionManager = { 
   	VERSION_PREF: "mouselessbrowsing.version",
   	versionComparator: Components.classes["@mozilla.org/xpcom/version-comparator;1"]
                   .getService(Components.interfaces.nsIVersionComparator),
   	
      versionsToBeMigrated: ["0.5"],
                   
   	hasVersionToBeMigrated: function(){
   		var newInstalledVersion = Utils.getExtension(MlbCommon.MLB_GUI_ID).version
   		var currentVersion = Prefs.getCharPref(this.VERSION_PREF)
   		if(this.versionComparator.compare(newInstalledVersion, currentVersion)>0){
   			return true
   		}else{
   			return false
   		}
   	},
   	
   	doMigration: function(){
   		var currentVersion = Prefs.getCharPref(this.VERSION_PREF)
   		for (var i = 0; i < this.versionsToBeMigrated.length; i++) {
   			var version = this.versionsToBeMigrated[i]
   			if(this.versionComparator.compare(version, currentVersion)>0){
   				var mirgationFunctionName = "migrateToVersion_" + version.replace(/\./g,"_") 
   				this[mirgationFunctionName]()
   				MlbUtils.logDebugMessage("Successfully migrated to version " + version)
   			}
   		}
   		Prefs.setCharPref(this.VERSION_PREF, Utils.getExtension(MlbCommon.MLB_GUI_ID).version)
   		setTimeout(mouselessbrowsing.VersionManager.showVersionInfoPage, 1000)
   	},
   	
   	migrateToVersion_0_5: function(){
   		this.migrateStyles()
   		this.deleteObsoletePrefs()
   	},
   	
   	migrateStyles: function(){
   		var prefKeyStyleForIdSpan = "mouselessbrowsing.styleForIdSpan"
   		var prefKeyStyleForFrameIdSpan = "mouselessbrowsing.styleForFrameIdSpan"
   		if(!Prefs.hasUserPref(prefKeyStyleForIdSpan) && 
   		    !Prefs.hasUserPref(prefKeyStyleForFrameIdSpan)){
   		    	return
   		}
   		var args = {out:null}
   		openDialog(MlbCommon.MLB_CHROME_URL+"/preferences/style_migration_dialog.xul", "", "chrome, dialog, modal", args)
   		if(args.out==null || args.out=="KEEP"){
   			return
   		}
   		if (Prefs.hasUserPref(prefKeyStyleForIdSpan)) {
   			Application.prefs.get(prefKeyStyleForIdSpan).reset()
			}
			if (Prefs.hasUserPref(prefKeyStyleForFrameIdSpan)) {
   			Application.prefs.get(prefKeyStyleForFrameIdSpan).reset()
			}
   	},
   	
   	deleteObsoletePrefs: function(){
			if (Prefs.hasUserPref('mouselessbrowsing.enableCtrlPlusDigit')) {
   			Application.prefs.get('mouselessbrowsing.enableCtrlPlusDigit').reset()
			}
			if (Prefs.hasUserPref('mouselessbrowsing.useSelfDefinedCharsForIds')) {
   			Application.prefs.get('mouselessbrowsing.useSelfDefinedCharsForIds').reset()
			}
			if (Prefs.hasUserPref('mouselessbrowsing.showTabIds')) {
   			Application.prefs.get('mouselessbrowsing.showTabIds').reset()
			}
			MlbUtils.logDebugMessage('Old prefs deleted')
   	},
   	
   	showVersionInfoPage: function(){
   		var newTab = Utils.openUrlInNewTab('http://mlb.whatsnew.rudolf-noe.de')
   		newTab.moveBefore(Application.activeWindow.tabs[0])
         newTab.focus();
   	}
   	
   	
   	
   }
   var NS = mlb_common.Namespace
   NS.bindToNamespace("mouselessbrowsing", "VersionManager", VersionManager)
})()