/**
 * Contains Code for migration to version 0.5
 */
(function(){
	var Prefs = rno_common.Prefs
	var Utils = rno_common.Utils
	var MlbCommon = mouselessbrowsing.MlbCommon
	
   var VersionManager = { 
   	VERSION_PREF: "mouselessbrowsing.version",
   	currentVersion: null,
   	
   	hasVersionToBeMigrated: function(){
   		var mlbExtension = Utils.getExtension(MlbCommon.MLB_GUI_ID)
   		this.currentVersion = Prefs.getCharPref(this.VERSION_PREF)
   		if(mlbExtension.version>this.currentVersion){
   			this.currentVersion = mlbExtension.version
   			return true
   		}else{
   			return false
   		}
   	},
   	
   	migrateVersion: function(){
   		Prefs.setCharPref(this.VERSION_PREF, this.currentVersion)
   	},
   	
   	showMigrateDialog: function(){
   		
   	},
   	
   	showVersionInfoPage: function(){
   		//Todo open Tab with version info page
   	},
   	
   	
   }
   var NS = rno_common.Namespace
   NS.bindToNamespace("mouselessbrowsing", "VersionManager", VersionManager)
})()