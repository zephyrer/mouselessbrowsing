/* 

  Mouseless Browsing 
  Version 0.5
  Created by Rudolf Noé
  01.01.2008
*/
var MlbCommon = mouselessbrowsing.MlbCommon
var Utils = rno_common.Utils

function doOnload(){
   rno_common.Prefs.loadPrefs(document);
	document.title = "Mouseless Browsing " + MlbCommon.MLB_VERSION 
   MLB_onCommandIdType();
	MLB_onTogglingVisibilityAllIds();
	MLB_setPreviewForIds("styleForIdSpan")
	MLB_setPreviewForIds("styleForFrameIdSpan")
	byId('siteRulesLB').addEventListener("select", MLB_onSelectSiteRule, false)
	if(window.arguments){
		//Case of adding site rule
		MLB_initForAddingSiteRule(window.arguments[0])
	}
}

function MLB_initForAddingSiteRule(url){
   byId('siteruletab').click();
   byId('urlPatterTB').value=url	
}

function saveUserPrefs(){
	try{
		MLB_validateUserInput()
	}catch(e){
		alert(e)
		return false
	}
   rno_common.Prefs.savePrefs(document);
   rno_common.Utils.notifyObservers(MlbCommon.MLB_PREF_OBSERVER);
}

function dialogHelp(){
   var browserWin = rno_common.Utils.getMostRecentBrowserWin()
   if(browserWin==null){
      return
   }
   var browser = browserWin.getBrowser()
   browser.selectedTab = browser.addTab("http://mlb.rudolf-noe.de")
   browserWin.focus()      
}

function MLB_onTogglingVisibilityAllIds(){
	var disableVisibilityFlags = document.getElementById("allIds").checked;
	var visibilityFlags = document.getElementsByAttribute ( "visibilityFlag", "true" );
	for(var i=0; i<visibilityFlags.length; i++){
		visibilityFlags[i].disabled=disableVisibilityFlags;
	}
}

function MLB_setStyleDefault(styleTextboxId){
	var Prefs = rno_common.Prefs 
	var textbox = document.getElementById(styleTextboxId)
	var prefId = textbox.getAttribute("prefid")
	if(Prefs.hasUserPref(prefId)){
	  Prefs.clearUserPref(prefId)
	}
	textbox.value=Prefs.getCharPref(prefId)
   MLB_setPreviewForIds(styleTextboxId)
}

function MLB_setPreviewForIds(styleTextboxId){
	var styleTextbox = document.getElementById(styleTextboxId);
	var previewSpan = document.getElementById(styleTextbox.getAttribute('previewSpanId'));
	previewSpan.style.cssText=styleTextbox.value
}

function MLB_addSiteRule(){
   var Listbox = rno_common.Listbox;
   var urlPattern = byId("urlPatterTB").value
   var visibilityModeML = byId("visibilityModeML")
   var siteRuleExclusiveNumpadCB = byId("siteRuleExclusiveNumpadCB")
   var siteRuleOnDemandFlagCB = byId("siteRuleOnDemandFlagCB")
   var siteRulesLB = byId("siteRulesLB")
   var items = Listbox.getItems(siteRulesLB);
   var newListitem = Listbox.appendMultiColumnItem(siteRulesLB, [urlPattern, visibilityModeML.label, siteRuleExclusiveNumpadCB.checked, siteRuleOnDemandFlagCB.checked], 
         [urlPattern, visibilityModeML.value, siteRuleExclusiveNumpadCB.checked, siteRuleOnDemandFlagCB.checked], null, [null, "display:none", "display:none", "display:none"])
}

function MLB_updateSiteRule(){
   var urlPattern = byId("urlPatterTB").value
   var visibilityModeML = byId("visibilityModeML")
   var siteRulesLB = byId("siteRulesLB")
   var siteRuleExclusiveNumpadCB = byId("siteRuleExclusiveNumpadCB")
   var siteRuleOnDemandFlagCB = byId("siteRuleOnDemandFlagCB")
   var selectedIndex = siteRulesLB.selectedIndex
   if(selectedIndex==-1){
      alert('No item to update selected!')
      return
   }
   rno_common.Listbox.updateSelectedRow(siteRulesLB, [urlPattern, visibilityModeML.label, siteRuleExclusiveNumpadCB.checked, siteRuleOnDemandFlagCB.checked], 
         [urlPattern, visibilityModeML.value, siteRuleExclusiveNumpadCB.checked, siteRuleOnDemandFlagCB.checked])
}

function MLB_removeSiteRule(){
   var siteRulesLB = byId("siteRulesLB")
   var selectedIndex = siteRulesLB.selectedIndex
   if(selectedIndex==-1){
   	alert('No item to remove selected!')
   	return
   }
   siteRulesLB.removeItemAt(selectedIndex)
   siteRulesLB.focus();
}

function MLB_onSelectSiteRule(){
   var siteRulesLB = byId("siteRulesLB")
   var updateBtn = byId("updateBtn")
   var removeBtn = byId("removeBtn")
   if(siteRulesLB.selectedIndex==-1){
      updateBtn.disabled=true
      removeBtn.disabled=true
   }else{
      updateBtn.disabled=false
      removeBtn.disabled=false
      var listcells = rno_common.Listbox.getSelectedListCells(siteRulesLB)
      byId('urlPatterTB').setAttribute("value", listcells[0].getAttribute('value'))
      byId('visibilityModeML').value=listcells[1].getAttribute('value')
      byId('siteRuleExclusiveNumpadCB').checked=(listcells[2].getAttribute('value')=='true')
      byId('siteRuleOnDemandFlagCB').checked=(listcells[3].getAttribute('value')=='true')
   }
}

function MLB_onInputIdCharsTB(){
   var idCharsTB = byId('idCharsTB')
   if(idCharsTB.value!=null){
   	idCharsTB.value = idCharsTB.value.toUpperCase()
   }	
}

function MLB_validateUserInput() {
	// No duplicate chars in self defined char set for ids
	var useCharIds = byId('idtype').value == MlbCommon.IdTypes.CHAR
	var idCharsTB = byId('idCharsTB')
	if (useCharIds) {
		var charMap = new Object()
		var selfDefindedCharSet = idCharsTB.value
		if (selfDefindedCharSet == "") {
			throw Error("No id char defined")
		}
		for (var i = 0; i < selfDefindedCharSet.length; i++) {
			var singleChar = selfDefindedCharSet.charAt(i)
			if (charMap[singleChar] != null) {
				throw Error("The character '"
						+ singleChar
						+ "' is defined multiple times in the self-defined character set for ids.")
			}
			charMap[singleChar] = ""
		}
	}
}

function MLB_onCommandIdType(){
   var idTypeRG = byId('idtype')
   if(idTypeRG.value==MlbCommon.IdTypes.NUMERIC){
      byId('idCharsTB').disabled=true   
      byId('exclusiveNumpad').disabled=false   
      byId('modifierForWritableElement').disabled=false  
      byId('modifierForOpenInNewTab').disabled=false
   }else{
      byId('idCharsTB').disabled=false   
      byId('exclusiveNumpad').disabled=true   
      byId('modifierForWritableElement').disabled=true  
      byId('modifierForOpenInNewTab').disabled=true   
   }
}

function byId(elementId){
	return document.getElementById(elementId)
}