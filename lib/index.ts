
import { readFile, writeFile } from "fs";
import { resolve, sep } from "path";

// import * as tags from "jsmediatags";
import * as id3 from "node-id3";

import common from "./common.js";
import directory from "./directory.js";
import humanTime from "./humanTime.js";
import log from "./log.js";

// cspell:words Audiobook, Bhangra, Breakbeat, Breakz, Chillout, Darkwave, Dubstep, Electroclash, Eurodance, Illbient, Industro, Jpop, jsmediatags, Krautrock, Leftfield, Negerpunk, Neue, Polsk, Psybient, Psytrance, Shoegaze, Showtunes, Synthpop, TALB, TLEN, TRCK, Welle, xlink

const init = function () {
    let wishlist0:string[][] = null,
        wishlist1:string[][] = null,
        wishlist2:string[][] = null,
        browser:string = "";
    const mp3dir:string = process.argv[2],
        startTime:bigint = process.hrtime.bigint(),
        type:mediaType = (mp3dir.indexOf("music") > -1)
            ? "music"
            : (mp3dir.indexOf("movie") > -1)
                ? "movie"
                : "television",
        update:boolean = (process.argv.indexOf("update") > -1),
        typeCaps:string = (type === "movie")
            ? "Movie"
                : (type === "television")
                    ? "Television"
                    : "Music",
        nextAction:string = (type === "movie" || type === "television")
            ? " Writing output"
            : "Reading ID3 tags",
        defaultFiles:string[] = [
            "D:\\movies",
            "D:\\music",
            "D:\\television"
        ],
        fileStore:string[] = [],
        projectPath:string = (function () {
            const dirs:string[] = process.argv[1].split(sep);
            dirs.pop();
            return dirs.join(sep) + sep;
        }()),
        libPath:string = projectPath.replace(`${sep}js${sep}`, `${sep}lib${sep}`),
        dateFormat = function (dateNumber:number):string {
            const date:Date = new Date(dateNumber),
                pad = function (input:number, milliseconds:boolean):string {
                    const str:string = String(input);
                    if (milliseconds === true) {
                        if (str.length === 1) {
                            return `${str}00`;
                        }
                        if (str.length === 2) {
                            return `${str}0`;
                        }
                    } else if (str.length === 1) {
                        return `0${str}`;
                    }
                    return str;
                },
                months:storeString = {
                    "0": "JAN",
                    "1": "FEB",
                    "2": "MAR",
                    "3": "APR",
                    "4": "MAY",
                    "5": "JUN",
                    "6": "JUL",
                    "7": "AUG",
                    "8": "SEP",
                    "9": "OCT",
                    "10": "NOV",
                    "11": "DEC"
                };
            return `${pad(date.getDate(), false)} ${months[date.getMonth()]} ${date.getFullYear()} ${pad(date.getHours(), false)}:${pad(date.getMinutes(), false)}:${pad(date.getSeconds(), false)}.${pad(date.getMilliseconds(), true)}`;
        },
        headingMap = function (mediaType:mediaType):storeString {
            if (mediaType === "music") {
                return {
                    "play": "Play",
                    "genre": "Genre",
                    "artist": "Artist",
                    "album": "Album",
                    "title": "Title",
                    "track": "Track",
                    "path": "File Path",
                    "sizeFormatted": "File Size",
                    "modified": "Modified",
                    "hash": "Hash"
                };
            }
            return {
                "play": "Play",
                "genre": (mediaType === "movie")
                    ? "Genre"
                    : "Show",
                "title": "Title",
                "track": (mediaType === "movie")
                    ? "Year"
                    : "Season",
                "artist": "Type",
                "path": "File Path",
                "sizeFormatted": "File Size",
                "modified": "Modified",
                "hash": "Hash"
            };
        },
        headings:string[] = Object.keys(headingMap(type)),
        svg:storeString = {
            circle:        '<svg version="1.1" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd" stroke="none" stroke-width="1"><g fill="#000000" transform="translate(-170.000000, -86.000000)"><g transform="translate(170.000000, 86.000000)"><path d="M10,0 C4.5,0 0,4.5 0,10 C0,15.5 4.5,20 10,20 C15.5,20 20,15.5 20,10 C20,4.5 15.5,0 10,0 L10,0 Z M10,18 C5.6,18 2,14.4 2,10 C2,5.6 5.6,2 10,2 C14.4,2 18,5.6 18,10 C18,14.4 14.4,18 10,18 L10,18 Z"/></g></g></g></svg>',
            play:          '<svg version="1.1" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g><path d="M85.5,51.7l-69,39.8c-1.3,0.8-3-0.2-3-1.7V10.2c0-1.5,1.7-2.5,3-1.7l69,39.8C86.8,49,86.8,51,85.5,51.7z"/></g></svg>',
            pause:         '<svg version="1.1" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M44.2,78.3H32.1c-1.1,0-2-0.9-2-2V23.7c0-1.1,0.9-2,2-2h12.1c1.1,0,2,0.9,2,2v52.5C46.2,77.4,45.3,78.3,44.2,78.3z"/><path d="M67.9,78.3H55.8c-1.1,0-2-0.9-2-2V23.7c0-1.1,0.9-2,2-2h12.1c1.1,0,2,0.9,2,2v52.5C69.9,77.4,69,78.3,67.9,78.3z"/></svg>',
            random:        '<svg version="1.1" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M370.1,181.3H399v47.3l81-83.2L399,64v54h-28.9c-82.7,0-129.4,61.9-170.6,116.5c-37,49.1-69,95.4-120.6,95.4H32v63.3h46.9  c82.7,0,129.4-65.8,170.6-120.4C286.5,223.7,318.4,181.3,370.1,181.3z M153.2,217.5c3.5-4.6,7.1-9.3,10.7-14.1  c8.8-11.6,18-23.9,28-36.1c-29.6-27.9-65.3-48.5-113-48.5H32v63.3c0,0,13.3-0.6,46.9,0C111.4,182.8,131.8,196.2,153.2,217.5z   M399,330.4h-28.9c-31.5,0-55.7-15.8-78.2-39.3c-2.2,3-4.5,6-6.8,9c-9.9,13.1-20.5,27.2-32.2,41.1c30.4,29.9,67.2,52.5,117.2,52.5  H399V448l81-81.4l-81-83.2V330.4z"/></svg>',
            sort:          '<svg version="1.1" viewBox="0 0 320 512" xmlns="http://www.w3.org/2000/svg"><path d="M27.66 224h264.7c24.6 0 36.89-29.78 19.54-47.12l-132.3-136.8c-5.406-5.406-12.47-8.107-19.53-8.107c-7.055 0-14.09 2.701-19.45 8.107L8.119 176.9C-9.229 194.2 3.055 224 27.66 224zM292.3 288H27.66c-24.6 0-36.89 29.77-19.54 47.12l132.5 136.8C145.9 477.3 152.1 480 160 480c7.053 0 14.12-2.703 19.53-8.109l132.3-136.8C329.2 317.8 316.9 288 292.3 288z"/></svg>',
            stop:          '<svg version="1.1" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M78,80H22c-1.1,0-2-0.9-2-2V22c0-1.1,0.9-2,2-2h56c1.1,0,2,0.9,2,2v56C80,79.1,79.1,80,78,80z"/></svg>',
            trackNext:     '<svg version="1.1" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M18,25.5v49.1c0,1.5,1.7,2.5,3,1.7L65,51v25c0,1.1,0.9,2,2,2h13c1.1,0,2-0.9,2-2V24c0-1.1-0.9-2-2-2H67c-1.1,0-2,0.9-2,2  v25.1L21,23.8C19.7,23,18,24,18,25.5z"/></svg>',
            trackPrevious: '<svg version="1.1" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M82,25.5v49.1c0,1.5-1.7,2.5-3,1.7L35,51v25c0,1.1-0.9,2-2,2H20c-1.1,0-2-0.9-2-2V24c0-1.1,0.9-2,2-2h13c1.1,0,2,0.9,2,2  v25.1l44-25.4C80.3,23,82,24,82,25.5z"/></svg>',
            volumeDown:    '<svg version="1.1" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M66.9,22.9v54.1c0,1.5-1.7,2.5-3,1.7l-27-16h-21c-1.1,0-2-0.9-2-2v-22c0-1.1,0.9-2,2-2h21l27-15.6  C65.2,20.4,66.9,21.4,66.9,22.9z"/><path d="M72.3,57.9c-0.6,0-1-0.4-1-1s0.4-1,1-1c3.3,0,5.9-2.6,5.9-5.9c0-3.3-2.6-5.9-5.9-5.9c-0.6,0-1-0.4-1-1s0.4-1,1-1  c4.4,0,7.9,3.5,7.9,7.9S76.7,57.9,72.3,57.9z"/><path d="M72.3,64.8c-0.6,0-1-0.4-1-1s0.4-1,1-1c7.1,0,12.8-5.7,12.8-12.8s-5.7-12.8-12.8-12.8c-0.6,0-1-0.4-1-1s0.4-1,1-1  c8.2,0,14.8,6.6,14.8,14.8S80.5,64.8,72.3,64.8z"/></svg>',
            volumeUp:      '<svg version="1.1" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M59.5,22.9v54.1c0,1.5-1.7,2.5-3,1.7l-27-16h-21c-1.1,0-2-0.9-2-2v-22c0-1.1,0.9-2,2-2h21l27-15.6  C57.8,20.4,59.5,21.4,59.5,22.9z"/><path d="M64.9,57.9c-0.6,0-1-0.4-1-1s0.4-1,1-1c3.3,0,5.9-2.6,5.9-5.9c0-3.3-2.6-5.9-5.9-5.9c-0.6,0-1-0.4-1-1s0.4-1,1-1  c4.4,0,7.9,3.5,7.9,7.9S69.3,57.9,64.9,57.9z"/><path d="M64.9,64.8c-0.6,0-1-0.4-1-1s0.4-1,1-1c7.1,0,12.8-5.7,12.8-12.8S72,37.2,64.9,37.2c-0.6,0-1-0.4-1-1s0.4-1,1-1  c8.2,0,14.8,6.6,14.8,14.8S73.1,64.8,64.9,64.8z"/><path d="M64.9,71.7c-0.6,0-1-0.4-1-1s0.4-1,1-1c10.9,0,19.7-8.8,19.7-19.7s-8.8-19.7-19.7-19.7c-0.6,0-1-0.4-1-1s0.4-1,1-1  c12,0,21.7,9.7,21.7,21.7C86.6,62,76.9,71.7,64.9,71.7z"/><path d="M64.9,78.6c-0.6,0-1-0.4-1-1s0.4-1,1-1c14.7,0,26.6-11.9,26.6-26.6S79.6,23.4,64.9,23.4c-0.6,0-1-0.4-1-1s0.4-1,1-1  c15.8,0,28.6,12.8,28.6,28.6C93.5,65.8,80.7,78.6,64.9,78.6z"/></svg>'
        },
        buildHTML = function (mediaData:string[], totalData:string, mediaType:mediaType):string {
            const mediaTypeCaps:string = mediaType.charAt(0).toUpperCase() + mediaType.slice(1),
                headingList:storeString = headingMap(mediaType),
                headingItems:string[] = Object.keys(headingList),
                location:string = (update === true)
                    ? (mediaType === "movie")
                        ? defaultFiles[0]
                        : (mediaType === "music")
                            ? defaultFiles[1]
                            : defaultFiles[2]
                    : mp3dir,
                html1:string[] = [
                    "<!doctype html>",
                    "<html>",
                    "<head>",
                    `<title>${mediaTypeCaps} Master List</title>`,
                    "<meta name=\"viewport\" content=\"width=device-width, height=device-height, initial-scale=1, user-scalable=0, minimum-scale=1, maximum-scale=1\"/>",
                    "<meta name=\"content-type\" content=\"text/html; charset=utf8\"/>",
                    "<style type=\"text/css\">",
                    "body{font-family:sans-serif;font-size:10px;text-size-adjust:100%;-webkit-text-size-adjust:100%}",
                    "h1{font-size:2em;margin:0}",
                    "legend,p,td,th{font-size:1.6em}",
                    "th{background:#ddd;padding:0.5em}",
                    "td{padding:0.2em 0.4em}",
                    "fieldset{margin:1em 0}",
                    "th,td{font-family:monospace}",
                    "td,th,table{border:0.1em solid #666;border-collapse:collapse}",
                    "th{min-width:1em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
                    "table button{border-color:#000;border-style:solid;border-width:0.1em}",
                    "thead svg{height:1em;width:1em}",
                    "tbody svg{height:20%;width:20%}",
                    "th button{float:left;margin:0 1em 0 0}",
                    "tbody td button{display:block;cursor:pointer;font-size:1em;margin:0.2em;text-align:center;width:5em}",
                    "tbody tr:hover{background:#def}",
                    ".number{text-align:right}",
                    ".odd{background:#eee}",
                    ".data-points span,",
                    "label span{display:inline-block;width:10em}",
                    "#filtered-results{color:#00f}",
                    "#currentTrack td{background:#fdd;border-color:#900;box-shadow:0.1em 0.1em 0.5em;color:#900}",
                    "#currentTrackName{clear:both;margin:0.5em 0 0.5em;text-align:center}",
                    "#currentTrackName span{display:block;height:1em;margin:0 4em;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
                    "#minimize{float:left}",
                    "#mute{float:right}",
                    "#mute input{display:none}",
                    "#player{background:#eee;border-color:#999;border-style:solid;border-width:0.1em;box-shadow:0.1em 0.1em 0.2em #ddd;height:auto;margin:0;position:fixed;top:1em;width:60em}",
                    "#player button{background:transparent;border-style:none;cursor:pointer;font-size:1em}",
                    "tbody td button.active,",
                    "tbody td button.active svg,",
                    "#player #minimize.active,",
                    "#player #minimize.active svg,",
                    "#player #mute.active,",
                    "#player #mute.active svg,",
                    "#player .controls button.active,",
                    "#player .controls button.active svg{border-color:#00f;color:#00f;fill:#00f}",
                    "#player .controls input{display:none}",
                    "tbody td button.active,",
                    "#player #minimize.active,",
                    "#player #mute.active,",
                    "#player .controls button.active{background:#eef;box-shadow:inset 0.1em 0.1em 0.2em #aaa}",
                    "#player .controls{clear:both;float:none;height:1.6em;margin:0 0 0.5em;text-align:center}",
                    "#player .controls button,",
                    "#player #mute,",
                    "#player #minimize{background:#ddd;border-color:#000;border-style:solid;border-width:0.1em;box-shadow:0.1em 0.1em 0.2em #ccc;display:inline-block;height:1.2em;line-height:0.5em;margin:0 1em;width:2em}",
                    "#player #mute svg{height:1em}",
                    "#player #mute{margin:-1.2em 1em 0 0}",
                    "#player #minimize{margin:0 -3.2em 0 1em}",
                    "#player .controls svg{width:1em}",
                    "#player .trackVolume,",
                    "#player .track{border-color:#000;border-style:none none solid;border-width:0.25em;cursor:pointer;margin:0 1em 2em;position:relative;text-align:left}",
                    "#player .trackVolume{display:inline-block;height:0.5em;margin:0 0.25em;width:8em}",
                    "#player button{padding:0}",
                    "#player .controls .slider{width:10em}",
                    "#player .controls .trackVolume button,",
                    "#player #seekSlider{background:#fff;border-radius:50%;cursor:ew-resize;height:1em;left:0;margin:0;position:relative;top:0.85em;width:1em}",
                    "#player #volumeSlider{border-style:none;box-shadow:none;top:0.1em}",
                    "#player .volumeMinus{display:inline-block;margin:0 0 0 1em}",
                    "#player video{width:inherit}",
                    "fieldset select,",
                    "fieldset input[type=\"text\"]{display:inline-block;padding:0.1em;width:12em}",
                    ".iphone #player .pipe,.iphone #player .volumeMinus,.iphone #player .trackVolume,.iphone #player .volumePlus,.iphone #player #mute{display:none}",
                    ".iphone #player #minimize{margin:0 0 0 1em}",
                    ".iphone #player video{max-height:0em}",
                    "#currentTime{float:left;margin:-1.5em 0 0.25em 1em}",
                    "#duration{float:right;margin:-1.5em 1em 0.25em 0}",
                    "@media only screen and (max-width: 800px) {#player{margin:-1em;max-width:100%}#player .controls button{margin:0 0.75em;width:1.5em}}",
                    "@media only screen and (max-width: 400px) {#player .pipe,#player .volumeMinus,#player .trackVolume,#player .volumePlus{display:none}#player #currentTrackName span{font-size:0.7em}}",
                    "</style>",
                    `</head><body class="${mediaType}">`,
                    `<div id="player"><p class="track" role="slider"><button id="seekSlider">${svg.circle}</button></p><p id="currentTime">00:00:00</p><p id="duration">00:00:00</p><p class="controls"><button>${svg.trackPrevious}</button><button>${svg.play}</button><button>${svg.pause}</button><button class="active">${svg.stop}</button><button>${svg.trackNext}</button><button class="random">${svg.random}<input type="checkbox"/></button><span class="pipe">|</span><span class="volumeMinus">-</span><span class="trackVolume" role="slider"><button id="volumeSlider">${svg.circle}</button></span><span class="volumePlus">+</span></p><p id="currentTrackName"><button id="minimize">-</button><span></span><button id="mute" class="active">${svg.volumeUp}<input type="checkbox"/></button></p></div>`,
                    `<h1>${mediaTypeCaps} Master List</h1>`,
                    "<fieldset class=\"data-points\"><legend>Summary</legend>"
                ],
                totals:string[] = [totalData],
                html2:string[] = [
                    `<p><span>Dated</span> ${dateFormat(Date.now())}</p>`,
                    `<p><span>Location</span> ${location}</p>`,
                    "</fieldset>",
                    "<fieldset><legend>List Options</legend>",
                    "<p><label><span>Filter</span><input type=\"text\" id=\"filter\"/></label></p>",
                    "<p><label><span>Filter Field</span><select><option selected=\"selected\">Any</option>"
                ],
                html3:string[] = (function ():string[] {
                    // filter by column
                    let count:number = 1;
                    const output:string[] = [];
                    do {
                        output.push(`<option>${headingList[headingItems[count]]}</option>`);
                        count = count + 1;
                    } while (count < headingItems.length);
                    return output;
                }()),
                html4:string[] = [
                    "</select></label></p>",
                    "<p><label><span>Filter Search Type</span><select>",
                    "<option selected=\"selected\" value=\"fragment\">Text Search</option>",
                    "<option value=\"negation\">Negative Text</option>",
                    "<option value=\"regex\">Regular Expression</option>",
                    "<option value=\"list\">Comma Separated List</option>",
                    "<option value=\"negation-list\">Negative Comma Separated List</option>",
                    "</select></label></p>",
                    "<p><label><span>Case Sensitive</span><input type=\"checkbox\" checked=\"checked\" id=\"caseSensitive\"/></label></p>",
                    (mediaType === "movie" || mediaType === "television")
                        ? "<p><label><span>Show Wishlist</span><input type=\"checkbox\" id=\"wishlist\"/></label></p>"
                        : "",
                    "</fieldset><table><thead><tr>"
                ],
                html5:string[] = (function ():string[] {
                    // table headers
                    let count:number = 0;
                    const output:string[] = [];
                    do {
                        output.push(`<th><button data-direction="descend">${svg.sort}</button> ${headingList[headingItems[count]]}</th>`);
                        count = count + 1;
                    } while (count < headingItems.length);
                    output.push("</tr></thead><tbody>");
                    return output;
                }()),
                // mediaData here
                html6:string[] = [
                    "</tbody></table>",
                    `<h2 style=\"display:none\">${mediaTypeCaps} Wishlist</h2>`,
                    "<table style=\"display:none\"><thead><tr>"
                ],
                html7:string[] = (function ():string[] {
                    // table headers
                    let count:number = 0;
                    const output:string[] = [];
                    do {
                        output.push(`<th><button data-direction="descend">${svg.sort}</button> ${headingList[headingItems[count]]}</th>`);
                        count = count + 1;
                    } while (count < headingItems.length);
                    output.push("</tr></thead><tbody>");
                    return output;
                }()),
                html8:string[] = (function ():string[] {
                    // table wishlist body
                    let count:number = 0;
                    const output:string[] = [];
                    if (mediaType === "movie" && wishlist0.length > 0) {
                        do {
                            output.push(`<tr><td>none</td><td>${wishlist0[count][0]}</td><td>${wishlist0[count][1]}</td><td>${wishlist0[count][2]}</td><td>Movie</td><td>wishlist</td><td>0</td><td>none</td><td>none</td></tr>`);
                            count = count + 1;
                        } while (count < wishlist0.length);
                    } else if (mediaType === "television" && wishlist2.length > 0) {
                        do {
                            output.push(`<tr><td>none</td><td>${wishlist2[count][0]}</td><td>${wishlist2[count][1]}</td><td>Television</td><td>wishlist</td><td>none</td><td>none</td><td>none</td><td>none</td></tr>`);
                            count = count + 1;
                        } while (count < wishlist2.length);
                    }
                    output.push("</tbody></table>");
                    return output;
                }()),
                html9:string[] = [
                    "<script type=\"application/javascript\">",
                    browser,
                    "</script></body></html>"
                ];
            return html1.concat(totals, html2, html3, html4, html5, mediaData, html6, html7, html8, html9).join("\n");
        },
        dirCallback = function (title:string, text:string[], fileList:directory_list):void {
            let index:number = 0,
                totalSize:number = 0;
            const readTags = function (wish:string[]):void {
                    const absolute = function (dir:string):string {
                            return mp3dir + sep + dir.replace(/\//g, sep);
                        },
                        list:string[]|directory_list = fileList,
                        dataList:string[] = [];
                    let dirs:string[] = [],
                        listLength:number = list.length;
                    if (index < listLength && wish === null) {
                        if (type === "music") {
                            // @ts-ignore
                            id3.default.read(absolute(list[index][0]), function (id3Err:NodeJS.ErrnoException, tags:Tags):void {
                                if (id3Err === null) {
                                    if (tags.genre !== undefined) {
                                        if (tags.genre === "20" || tags.genre === "(20)") {
                                            fileList[index][5].genre = "Alternative";
                                        } else if (tags.genre === "36" || tags.genre === "(36)") {
                                            fileList[index][5].genre = "Game";
                                        } else if (tags.genre === "52" || tags.genre === "(52)") {
                                            fileList[index][5].genre = "Electronic";
                                        } else if ((/^\w/).test(tags.genre) === true) {
                                            fileList[index][5].genre = tags.genre;
                                        } else {
                                            fileList[index][5].genre = tags.genre.replace(/^\(?\d+\)?/, "");
                                        }
                                    }
                                    fileList[index][5].album = tags.album;
                                    fileList[index][5].artist = tags.artist;
                                    fileList[index][5].title = tags.title;
                                    fileList[index][5].track = (tags.raw.TRCK === undefined) ? "" : tags.raw.TRCK;
                                    fileList[index][5].modified = dateFormat(fileList[index][5].mtimeMs);
                                    fileList[index][5].sizeFormatted = common.commas(fileList[index][5].size);
                                    totalSize = totalSize + fileList[index][5].size;
                                    index = index + 1;
                                    readTags(null);
                                } else {
                                    log([`Error reading id3 tag of file: ${absolute(list[index][0])}`, JSON.stringify(id3Err)]);
                                }
                            });
                        } else {
                            dirs = list[index][0].split("/");
                            if (dirs.length > 1) {
                                fileList[index][5].genre = dirs[0];
                                fileList[index][5].title = dirs[dirs.length - 1].slice(0,  dirs[dirs.length - 1].lastIndexOf("."));
                                fileList[index][5].track = (type === "movie")
                                    ? fileList[index][5].title.slice(fileList[index][5].title.lastIndexOf("(") + 1, fileList[index][5].title.length - 1)
                                    : (dirs.length > 2)
                                        ? dirs[1]
                                        : "Season 1";
                                fileList[index][5].artist = dirs[dirs.length - 1].slice(dirs[dirs.length - 1].lastIndexOf(".") + 1);
                                fileList[index][5].title = fileList[index][5].title.replace(/\s*\(\d+\)$/, "");
                                fileList[index][5].modified = dateFormat(fileList[index][5].mtimeMs);
                                fileList[index][5].sizeFormatted = common.commas(fileList[index][5].size);
                                totalSize = totalSize + fileList[index][5].size;
                                index = index + 1;
                            } else {
                                list.splice(index, 1);
                                listLength = listLength - 1;
                            }
                            readTags(null);
                        }
                    } else {
                        const location:string = `${resolve(process.argv[2]) + sep}list.html`,
                            browser:string = `${resolve(process.argv[2]) + sep}browser.js`,
                            writeList = function (html:string):void {
                                writeFile(location, html, function (erw:NodeJS.ErrnoException):void {
                                    if (erw === null) {
                                        log([
                                            `${humanTime(startTime, false)}List written to location: ${location}`
                                        ]);
                                    } else {
                                        log([
                                            `Error writing list to location: ${location}`,
                                            JSON.stringify(erw)
                                        ]);
                                    }
                                });
                            };
                        let htmlIndex:number = 1;
                        if (update === false && type === "music") {
                            log([
                                `${humanTime(startTime, false)}All files read for ID3 tags. Writing report.`
                            ]);
                        }
                        if (listLength > 0) {
                            htmlIndex = 0;
                            index = 0;
                            do {
                                dataList.push(`<tr class="${(index % 2 === 0) ? "even" : "odd"}" data-path="${list[index][0]}">`);
                                do {
                                    if (headings[htmlIndex] === "play") {
                                        dataList.push(`<td><button>${svg.play}</button></td>`);
                                    } else if (headings[htmlIndex] === "path") {
                                        dataList.push(`<td>${list[index][0]}</td>`);
                                    } else if (headings[htmlIndex] === "hash") {
                                        dataList.push(`<td>${list[index][2]}</td>`);
                                    } else if (headings[htmlIndex] === "modified") {
                                        dataList.push(`<td data-numeric="${fileList[index][5].mtimeMs}">${fileList[index][5].modified}</td>`);
                                    } else if (headings[htmlIndex] === "sizeFormatted") {
                                        dataList.push(`<td class="number" data-numeric="${fileList[index][5].size}">${fileList[index][5].sizeFormatted}</td>`);
                                    } else if (headings[htmlIndex] === "title") {
                                        dataList.push(`<td>${fileList[index][5].title}</td>`);
                                    } else {
                                        if (headings[htmlIndex] === "sizeFormatted" || (type === "movie" && headings[htmlIndex] === "track")) {
                                            // @ts-ignore
                                            dataList.push(`<td${(headings[htmlIndex] === "sizeFormatted" || headings[htmlIndex] === "track") ? " class=\"number\"" : ""}>${fileList[index][5][headings[htmlIndex]]}</td>`);
                                        } else {
                                            // @ts-ignore
                                            dataList.push(`<td>${fileList[index][5][headings[htmlIndex]]}</td>`);
                                        }
                                    }
                                    htmlIndex = htmlIndex + 1;
                                } while (htmlIndex < headings.length);
                                htmlIndex = 0;
                                dataList.push("</tr>");
                                index = index + 1;
                            } while (index < listLength);
                            writeList(buildHTML(dataList, `<p><span>Total files</span> ${listLength}</p>\n<p><span>Total size</span> ${common.commas(totalSize)} bytes (${common.prettyBytes(totalSize)})</p>\n<p id="filtered-results"><span>Filtered Results</span> ${listLength} results (100.00%)</p>`, type));
                        }
                    }
                };
            fileList.sort(function (a, b):1|-1 {
                if (a[0] < b[0]) {
                    return -1;
                }
                return 1;
            });
            readTags(null);
            if (update === false) {
                log([
                    "",
                    `${humanTime(startTime, false)}Hashing complete for ${fileList.length} ${typeCaps} files. ${nextAction}.`
                ]);
            }
        };
    log.title(`${typeCaps} Master List`);
    log([`${humanTime(startTime, false)}Hashing files`]);
    readFile(`${projectPath}browser.js`, function (erRead:NodeJS.ErrnoException, fileData:Buffer):void {
        if (erRead === null) {
            browser = fileData.toString();
            if (update === true) {
                let fileCount = 0;
                const extraction = function ():void {
                        let writeCount:number = 0;
                        const getFragment = function (index:number, start:string, end:string):string {
                                return fileStore[index].slice(fileStore[index].indexOf(start), fileStore[index].indexOf(end));
                            },
                            writeCallback = function (writeError:NodeJS.ErrnoException):void {
                                if (writeError === null) {
                                    writeCount = writeCount + 1;
                                    if (writeCount === 6) {
                                        log([`${humanTime(startTime, false)}All updates written. Commit changes in the project directory.`]);
                                    }
                                } else {
                                    log(["Error writing list output", JSON.stringify(writeError)]);
                                }
                            },
                            totalMovie:string = getFragment(0, "<p><span>Total files</span>", "\n<p><span>Dated</span> "),
                            totalMusic:string = getFragment(1, "<p><span>Total files</span>", "\n<p><span>Dated</span> "),
                            totalTelevision:string = getFragment(2, "<p><span>Total files</span>", "\n<p><span>Dated</span> "),
                            recordsMovie:string = getFragment(0, "<tr class=\"even\" data-path=", "</tbody></table>"),
                            recordsMusic:string = getFragment(1, "<tr class=\"even\" data-path=", "</tbody></table>"),
                            recordsTelevision:string = getFragment(2, "<tr class=\"even\" data-path=", "</tbody></table>"),
                            htmlMovie:string = buildHTML([recordsMovie], totalMovie, "movie"),
                            htmlMusic:string = buildHTML([recordsMusic], totalMusic, "music"),
                            htmlTelevision:string = buildHTML([recordsTelevision], totalTelevision, "television");
                        writeFile(`${libPath}list_movie.html`, htmlMovie, writeCallback);
                        writeFile(`${libPath}list_music.html`, htmlMusic, writeCallback);
                        writeFile(`${libPath}list_television.html`, htmlTelevision, writeCallback);
                        writeFile(`${defaultFiles[0] + sep}list.html`, htmlMovie, writeCallback);
                        writeFile(`${defaultFiles[1] + sep}list.html`, htmlMusic, writeCallback);
                        writeFile(`${defaultFiles[2] + sep}list.html`, htmlTelevision, writeCallback);
                    },
                    fileCallback = function (erFile:NodeJS.ErrnoException, fileData:Buffer):void {
                        if (erFile === null) {
                            fileStore.push(fileData.toString());
                            fileCount = fileCount + 1;
                            if (fileCount < defaultFiles.length) {
                                readFile(`${defaultFiles[fileCount] + sep}list.html`, fileCallback);
                            } else {
                                const libPath:string = projectPath.replace(`${sep}js${sep}`, `${sep}lib${sep}`);
                                readFile(`${libPath}wishlist_movie.json`, function (erJSON0:NodeJS.ErrnoException, wishlist:Buffer):void {
                                    if (erJSON0 === null) {
                                        wishlist0 = JSON.parse(wishlist.toString());
                                        readFile(`${libPath}wishlist_music.json`, function (erJSON1:NodeJS.ErrnoException, wishlist:Buffer):void {
                                            if (erJSON1 === null) {
                                                wishlist1 = JSON.parse(wishlist.toString());
                                                readFile(`${libPath}wishlist_television.json`, function (erJSON2:NodeJS.ErrnoException, wishlist:Buffer):void {
                                                    if (erJSON2 === null) {
                                                        wishlist2 = JSON.parse(wishlist.toString());
                                                        extraction();
                                                    } else {
                                                        log(["Error reading JSON", JSON.stringify(erJSON2)]);
                                                    }
                                                });
                                            } else {
                                                log(["Error reading JSON", JSON.stringify(erJSON1)]);
                                            }
                                        });
                                    } else {
                                        log(["Error reading JSON", JSON.stringify(erJSON0)]);
                                    }
                                });
                            }
                        }
                    };
                log(["Reading prior created lists."]);
                readFile(`${defaultFiles[fileCount] + sep}list.html`, fileCallback);
            } else {
                if (process.argv.length < 3) {
                    log(["Please specify a file system location."]);
                } else {
                    readFile(`${libPath}wishlist_${type}.json`, function (erJSON:NodeJS.ErrnoException, wishlist:Buffer):void {
                        if (type === "movie") {
                            wishlist0 = JSON.parse(wishlist.toString());
                        } else if (type === "music") {
                            wishlist1 = JSON.parse(wishlist.toString());
                        } else if (type === "television") {
                            wishlist2 = JSON.parse(wishlist.toString());
                        }
                        directory({
                            callback: dirCallback,
                            depth: 0,
                            mode: "hash",
                            path: process.argv[2],
                            search: "",
                            startTime: startTime,
                            symbolic: false,
                            testing: false,
                            type: type
                        });
                    });
                }
            }
        } else {
            log(["Error reading browser.js", JSON.stringify(erRead)]);
        }
    });
};

init();