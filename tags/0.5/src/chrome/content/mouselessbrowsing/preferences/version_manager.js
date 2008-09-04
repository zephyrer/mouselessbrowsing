/**
 * Contains Code for migration to version 0.5
 */
(function(){
	var Prefs = rno_common.Prefs
	var Utils = rno_common.Utils
	var MlbUtils = mouselessbrowsing.MlbUtils
	var MlbCommon = mouselessbrowsing.MlbCommon
	
   var VersionManager = { 
   	VERSION_PREF: "mouselessbrowsing.version",
   	currentVersion: null,
   	
   	hasVersionToBeMigrated: function(){
   		var newInstalledVersion = Utils.getExtension(MlbCommon.MLB_GUI_ID).version
   		this.currentVersion = Prefs.getCharPref(this.VERSION_PREF)
   		var versionComparator = Components.classes["@mozilla.org/xpcom/version-comparator;1"]
                   .getService(Components.interfaces.nsIVersionComparator)
   		if(versionComparator.compare(newInstalledVersion, this.currentVersion)>0){
   			this.currentVersion = newInstalledVersion
   			return true
   		}else{
   			return false
   		}
   	},
   	
   	migrateVersion: function(){
   		Prefs.setCharPref(this.VERSION_PREF, this.currentVersion)
   		this.migrateStyles()
   		this.deleteObsoletePrefs()
   		setTimeout(mouselessbrowsing.VersionManager.showVersionInfoPage, 1000)
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
   var NS = rno_common.Namespace
   NS.bindToNamespace("mouselessbrowsing", "VersionManager", VersionManager)
})()