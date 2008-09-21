(function() {
	var MlbPrefs = mouselessbrowsing.MlbPrefs
	var SiteRule = mouselessbrowsing.SiteRule
	var MlbCommon = mouselessbrowsing.MlbCommon
	var Prefs = mlb_common.Prefs
	var Utils = mlb_common.Utils

	function TabLocalPrefs() {
		this.init()
	}
	
	//Static member variables
	TabLocalPrefs.observedPropExclusiveUseOfNumpad = Prefs.getBoolPref("mouselessbrowsing.exclusiveNumpad");

	function getPrefs(contentWin) {
		var browser = gBrowser.mCurrentBrowser
		if (contentWin != null) {
			var browsers = gBrowser._browsers
			if (browsers != null) {
				for (var i = 0; i < browsers.length; i++) {
					if (browsers[i].contentWindow == contentWin.top) {
						browser = browsers[i]
						break;
					}
				}
			}
		}
		if (browser.mouselssbrowsing_tab_data == null) {
			browser.mouselssbrowsing_tab_data = new TabLocalPrefs()
		}
		return browser.mouselssbrowsing_tab_data
	}
	TabLocalPrefs.getPrefs = getPrefs

	function isExclusiveUseOfNumpad(win) {
		return TabLocalPrefs.getPrefs(win).exclusiveUseOfNumpad
	}
	TabLocalPrefs.isExclusiveUseOfNumpad = isExclusiveUseOfNumpad

	function onTabSelect() {
		Utils.executeDelayed("SetExlNumpadOnTabChange", 300, function(){
   		TabLocalPrefs.observedPropExclusiveUseOfNumpad = getPrefs().exclusiveUseOfNumpad
		})
	}
	TabLocalPrefs.onTabSelect = onTabSelect

	function initPrefs() {
		var browsers = gBrowser._browsers
		if (browsers != null) {
			for (var i = 0; i < browsers.length; i++) {
				var cw = browsers[i].contentWindow
				var tabLocalPrefs = getPrefs(cw)
				tabLocalPrefs.init()
				tabLocalPrefs.applySiteRules(cw)
				if(browsers[i]==gBrowser.mCurrentBrowser){
					TabLocalPrefs.observedPropExclusiveUseOfNumpad = tabLocalPrefs.exclusiveUseOfNumpad
				}
			}
		}
	}
	TabLocalPrefs.initPrefs = initPrefs

	function toggleExclusiveUseOfNumpad() {
		getPrefs().toggleExclusiveUseOfNumpad()
		TabLocalPrefs.observedPropExclusiveUseOfNumpad = getPrefs().exclusiveUseOfNumpad
		return ShortCutManager.SUPPRESS_KEY
	}
	TabLocalPrefs.toggleExclusiveUseOfNumpad = toggleExclusiveUseOfNumpad

	function isIdsForLinksEnabled(win) {
		return getPrefs(win).idsForLinksEnabled
	}
	TabLocalPrefs.isIdsForLinksEnabled = isIdsForLinksEnabled

	function isIdsForImgLinksEnabled(win) {
		return getPrefs(win).idsForImgLinksEnabled
	}
	TabLocalPrefs.isIdsForImgLinksEnabled = isIdsForImgLinksEnabled

	function isIdsForFormElementsEnabled(win) {
		return getPrefs(win).idsForFormElementsEnabled
	}
	TabLocalPrefs.isIdsForFormElementsEnabled = isIdsForFormElementsEnabled

	function isIdsForFramesEnabled(win) {
		return getPrefs(win).idsForFramesEnabled
	}
	TabLocalPrefs.isIdsForFramesEnabled = isIdsForFramesEnabled

   function getPreviousVisibilityMode(){
      return getPrefs().previousVisibilityMode
   }
   TabLocalPrefs.getPreviousVisibilityMode = getPreviousVisibilityMode
   
   function initShowIdPrefs(visibilityMode){
   	getPrefs().initShowIdPrefs(visibilityMode)
   }
   TabLocalPrefs.initShowIdPrefs = initShowIdPrefs
   
   function applySiteRules(contentWin){
   	var tabLocalPrefs = getPrefs(contentWin)
   	tabLocalPrefs.applySiteRules(contentWin)
   	TabLocalPrefs.observedPropExclusiveUseOfNumpad = tabLocalPrefs.exclusiveUseOfNumpad 
   }
   TabLocalPrefs.applySiteRules = applySiteRules
   
	function getVisibilityMode(){
      return getPrefs().visibilityMode
	}
	TabLocalPrefs.getVisibilityMode = getVisibilityMode

   function setVisibilityMode(win, visibilityMode){
   	getPrefs(win).setVisibilityMode(visibilityMode)
   }
   TabLocalPrefs.setVisibilityMode = setVisibilityMode
   
   function isDisableAllIds(win){
   	return getPrefs(win).isDisableAllIds()
   }
   TabLocalPrefs.isDisableAllIds = isDisableAllIds
	
   function isShowIdsOnDemand(win){
      return getPrefs(win).showIdsOnDemand 	
   }
   TabLocalPrefs.isShowIdsOnDemand = isShowIdsOnDemand
   
	TabLocalPrefs.prototype = {
		init : function() {
			this.showIdsOnDemand = Prefs.getBoolPref("mouselessbrowsing.showIdsOnDemand");
			this.exclusiveUseOfNumpad = Prefs.getBoolPref("mouselessbrowsing.exclusiveNumpad");
			var disableAllIds = Prefs.getBoolPref("mouselessbrowsing.disableAllIds");
			if (disableAllIds) {
				this.visibilityMode = MlbCommon.VisibilityModes.NONE
				this.previousVisibilityMode = MlbCommon.VisibilityModes.CONFIG
			} else {
				this.visibilityMode = MlbCommon.VisibilityModes.CONFIG
				this.previousVisibilityMode = MlbCommon.VisibilityModes.NONE
			}
			this.initShowIdPrefs(this.visibilityMode);
			this.prefsBackup = null
		},

		isDisableAllIds : function() {
			return !this.idsForLinksEnabled && !this.idsForImgLinksEnabled
					&& !this.idsForFormElementsEnabled
					&& !this.idsForFramesEnabled
		},

		setVisibilityMode : function(visibilityMode) {
			this.previousVisibilityMode = this.visibilityMode
			this.visibilityMode = visibilityMode
		},

		applySiteRules : function(win) {
			var url = win.top.location.href
			for (var i = 0; i < MlbPrefs.siteRules.length; i++) {
				var siteRule = MlbPrefs.siteRules[i]
				if (siteRule.urlRegEx.test(url)) {
					if (this.prefsBackup == null) {
						this.prefsBackup = new SiteRule(null,
								this.visibilityMode, this.exclusiveUseOfNumpad,
								null)//showon demand could not be changed tab wise
					}
					this.initShowIdPrefs(siteRule.visibilityMode)
					this.exclusiveUseOfNumpad = siteRule.exclusiveUseOfNumpad
					this.showIdsOnDemand = siteRule.showIdsOnDemand
					this.visibilityMode = siteRule.visibilityMode
					break;
				} else if (this.prefsBackup != null) {
					// reset prefs to global ones
					this.initShowIdPrefs(this.prefsBackup.visibilityMode)
					this.exclusiveUseOfNumpad = this.prefsBackup.exclusiveUseOfNumpad
					this.showIdsOnDemand = Prefs.getBoolPref("mouselessbrowsing.showIdsOnDemand");
					this.visibilityMode = this.prefsBackup.visibilityMode
					this.prefsBackup = null
				}
			}
		},

		/*
		 * Seperate function for reuse when toggling visibility of spans
		 */
		initShowIdPrefs : function(visibilityMode) {
			this.visibilityMode = visibilityMode
			var disableAllIds = false
			switch (this.visibilityMode) {
				case MlbCommon.VisibilityModes.NONE :
					disableAllIds = true
					this.idsForLinksEnabled = false
					this.idsForImgLinksEnabled = false
					this.idsForFormElementsEnabled = false
					this.idsForFramesEnabled = false
					break;
				case MlbCommon.VisibilityModes.CONFIG :
					this.idsForLinksEnabled = Prefs.getBoolPref("mouselessbrowsing.enableLinkIds");
					this.idsForImgLinksEnabled = Prefs.getBoolPref("mouselessbrowsing.enableImgLinkIds");
					this.idsForFormElementsEnabled = Prefs.getBoolPref("mouselessbrowsing.enableFormElementIds");
					this.idsForFramesEnabled = Prefs.getBoolPref("mouselessbrowsing.enableFrameIds");
					break;
				case MlbCommon.VisibilityModes.ALL :
					this.idsForLinksEnabled = true
					this.idsForImgLinksEnabled = true
					this.idsForFormElementsEnabled = true
					this.idsForFramesEnabled = true
					break;
			}
		},
		
		toggleExclusiveUseOfNumpad: function(){
			if(this.prefsBackup!=null){
				this.prefsBackup.exclusiveUseOfNumpad = !this.exclusiveUseOfNumpad
			}
			this.exclusiveUseOfNumpad = !this.exclusiveUseOfNumpad
		}
	}

	var NS = mlb_common.Namespace;
	NS.bindToNamespace("mouselessbrowsing", "TabLocalPrefs", TabLocalPrefs)
})()