function MLB_doOnload(){
	//MLB_updateInterval();
	MLB_onTogglingVisibilityAllIds();
}

function MLB_updateInterval(){
	var showIds = document.getElementById('showIdsDuringLoadProcess').checked;
	var intervalField = document.getElementById('updateIntervalOnLoad');
	if(showIds){
		intervalField.disabled=false;
		intervalField.value = gPref.getCharPref('mouselessbrowsing.updateIntervalOnLoad');
	}else{
		intervalField.disabled=true;
		intervalField.value="";
	}
}

function MLB_checkUpdateInterval(){
	var updateIntervalOnLoad = document.getElementById('"updateIntervalOnLoad').value;
	if(isNaN(updateIntervalOnLoad))
		return;
	updateIntervalOnLoad = parseInt(updateIntervalOnLoad, 10);
	if(updateIntervalOnLoad<700)
		alert('Update intervals smaller than 700 msec result in an significant performance overhead');
}

function MLB_onTogglingVisibilityAllIds(){
	var disableVisibilityFlags = document.getElementById("allIds").checked;
	var visibilityFlags = document.getElementsByAttribute ( "visibilityFlag", "true" );
	for(var i=0; i<visibilityFlags.length; i++){
		visibilityFlags[i].disabled=disableVisibilityFlags;
	}
}

function onClickSmartPos(event){
    if(event.originalTarget.checked){
        //Status is before click!!
        //--> disable elements
        document.getElementById("smartPosMinHeight").disabled=true;
        document.getElementById("smartPosMinWidth").disabled=true;
        document.getElementById("styleForImageIdSpan").disabled=true;
    }else{
        document.getElementById("smartPosMinHeight").disabled=false;
        document.getElementById("smartPosMinWidth").disabled=false;
        document.getElementById("styleForImageIdSpan").disabled=false;
    }
}

