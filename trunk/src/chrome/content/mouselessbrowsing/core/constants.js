/*
 * Mouseless Browsing 
 * Version 0.4.1
 * Created by Rudolf Noé
 * 01.07.2005
 *
 * Licence Statement
 * Version:  MPL 1.1
 *
 * The contents of this file are subject to the Mozilla Public License
 * Version 1.1  (the "License"); you may  not use this  file except in
 * compliance with the License.  You  may obtain a copy of the License
 * at http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See
 * the  License  for  the   specific  language  governing  rights  and
 * limitations under the License.
 */

/*
 * Global constants
 */
 
//Attribute of the id-span that flags the span as an id-span
MLB_idSpanFlag = "MLB_idSpanFlag";

//Attribute of the id-span identifying the type element the id is for
//see Tyes for id-Spans
//Used for toggling the visibility of the id-spans
MLB_idSpanFor = "idSpanFor";
 
//Types of id-Spans, the value of the Attribute MLB_idSpanFor
MLB_idSpanForFrame = "frame";
MLB_idSpanForImg = "img";
MLB_idSpanForFormElem = "formelement";
MLB_idSpanForLink = "link";

//ShortcutManager-ClientId
MLB_SCM_CLIENT_ID = "MLB";

//WebProgress State-Flags
MLB_WEBPROGRESS_STATE_START = 1;
MLB_WEBPROGRESS_STATE_STOP = 16;




 