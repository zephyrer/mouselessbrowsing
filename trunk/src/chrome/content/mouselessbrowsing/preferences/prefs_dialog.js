/* 

  Mouseless Browsing 
  Version 0.5
  Created by Rudolf Noé
  01.01.2008
*/
function doOnload(){
   rno_common.Prefs.loadPrefs(document);
	MLB_onTogglingVisibilityAllIds();
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

