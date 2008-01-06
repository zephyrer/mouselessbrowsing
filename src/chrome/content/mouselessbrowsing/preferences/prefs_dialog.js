/* 

  Mouseless Browsing 
  Version 0.5
  Created by Rudolf Noé
  01.01.2008
*/
function doOnload(){
   rno_common.Prefs.loadPrefs(document);
	MLB_onTogglingVisibilityAllIds();
	MLB_setPreviewForIds("styleForIdSpan", "previewIdSpan")
	MLB_setPreviewForIds("styleForFrameIdSpan", "previewFrameIdSpan")
}

function saveUserPrefs(){
   rno_common.Prefs.savePrefs(document);
   rno_common.Utils.notifyObservers(mouselessbrowsing.MlbCommon.MLB_PREF_OBSERVER);
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
}

function MLB_setPreviewForIds(styleTextboxId, previewSpanId){
	var previewSpan = document.getElementById(previewSpanId)
	previewSpan.style.cssText=document.getElementById(styleTextboxId).value
}