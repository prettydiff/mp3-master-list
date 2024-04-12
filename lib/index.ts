
import { readFile, stat, Stats, writeFile } from "fs";
import { resolve, sep } from "path";

import * as tags from "jsmediatags";

import common from "./common.js";
import directory from "./directory.js";
import humanTime from "./humanTime.js";
import log from "./log.js";
import writeStream from "./writeStream.js";

// cspell:words Audiobook, Bhangra, Breakbeat, Breakz, Chillout, Darkwave, Dubstep, Electroclash, Eurodance, Illbient, Industro, Jpop, jsmediatags, Krautrock, Leftfield, Negerpunk, Neue, Polsk, Psybient, Psytrance, Shoegaze, Showtunes, Synthpop, TALB, TLEN, TRCK, Welle, xlink
// cspell:words Akira, Amistad, Broadchurch, Comicbook, Genisys, Honneamise, Interstella, Jima, Kingsman, Longmire, Malkovich, Mononoke, Nimh, Patlabor, Poko, Rango, Ronin, Saldado, Sicario, Skywalker, Supercop, Zootopia

const init = function () {
    const mp3dir:string = process.argv[2],
        startTime:bigint = process.hrtime.bigint(),
        type:"movie"|"music" = (mp3dir.indexOf("music") > -1)
            ? "music"
            : "movie",
        typeCaps:string = (type === "movie")
            ? (mp3dir.indexOf("movie") > -1)
                ? "Movie"
                : "Television"
            : "Music",
        nextAction:string = (type === "movie")
            ? " Writing output"
            : "Reading ID3 tags",
        dirCallback = function (title:string, text:string[], fileList:directory_list):void {
            let index:number = 0,
                listLength:number = fileList.length,
                totalSize:number = 0;
            const production:boolean = true,
                projectPath:string = (function () {
                    const dirs:string[] = process.argv[1].split(sep);
                    dirs.pop();
                    return dirs.join(sep) + sep;
                }()),
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
                html:string[] = [
                    "<!doctype html>",
                    "<html>",
                    "<head>",
                    `<title>${typeCaps} Master List</title>`,
                    "<meta name=\"viewport\" content=\"width=device-width, height=device-height, initial-scale=1.0, user-scalable=0, minimum-scale=1.0, maximum-scale=1.0\">",
                    "<style type=\"text/css\">",
                    "body{font-family:sans-serif;font-size:10px;text-size-adjust:100%}",
                    "h1{font-size:2em;margin:0}",
                    "legend,p,td,th{font-size:1.6em}",
                    "th{background:#ddd;padding:0.5em}",
                    "td{padding:0.2em 0.4em}",
                    "fieldset{margin:1em 0}",
                    "th,td{font-family:monospace}",
                    "td,th,table{border:0.1em solid #666;border-collapse:collapse}",
                    "table button{border-color:#000;border-style:solid;border-width:0.1em}",
                    "thead svg{height:1em;width:1em}",
                    "tbody svg{height:20%;width:20%}",
                    "th button{float:left;margin:0 1em 0 0}",
                    "tbody td button{display:block;cursor:pointer;font-size:1em;margin:0.2em;text-align:center;width:5em}",
                    "tbody tr:hover{background:#def}",
                    ".number{text-align:right}",
                    ".odd{background:#eee}",
                    "label span{display:inline-block;width:10em}",
                    "#currentTrack td{background:#fdd;border-color:#900;box-shadow:0.1em 0.1em 0.5em;color:#900}",
                    "#currentTrackName{clear:both;margin:0.5em 0 0.5em;text-align:center}",
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
                    "#player #mute{margin:0 1em 0 -3.2em}",
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
                    ".iphone #player .pipe,.iphone #player .volumeMinus,.iphone #player .trackVolume,.iphone #player .volumePlus,.iphone #player #mute{display:none}",
                    ".iphone #player #minimize{margin:0 0 0 1em}",
                    "#currentTime{float:left;margin:-1.5em 0 0.25em 1em}",
                    "#duration{float:right;margin:-1.5em 1em 0.25em 0}",
                    "@media only screen and (max-width: 800px) {#player video{max-height:0em}#player .controls button{margin:0 0.75em;width:1.5em}}",
                    "@media only screen and (max-width: 400px) {#player .pipe,#player .volumeMinus,#player .trackVolume,#player .volumePlus{display:none}#player #currentTrackName span{font-size:0.7em}}",
                    "</style>",
                    `</head><body class="${type}">`,
                    `<div id="player"><p class="track" role="slider"><button id="seekSlider">${svg.circle}</button></p><p id="currentTime">00:00:00</p><p id="duration">00:00:00</p><p class="controls"><button>${svg.trackPrevious}</button><button>${svg.play}</button><button>${svg.pause}</button><button class="active">${svg.stop}</button><button>${svg.trackNext}</button><button class="random">${svg.random}<input type="checkbox"/></button><span class="pipe">|</span><span class="volumeMinus">-</span><span class="trackVolume" role="slider"><button id="volumeSlider">${svg.circle}</button></span><span class="volumePlus">+</span></p><p id="currentTrackName"><button id="minimize">-</button><span></span><button id="mute" class="active">${svg.volumeUp}<input type="checkbox" checked="checked"/></button></p></div>`,
                    `<h1>${typeCaps} Master List</h1>`,
                    `<p>Dated: ${dateFormat(Date.now())}</p>`,
                    `<p>Location: ${resolve(process.argv[2])}</p>`,
                ],
                readTags = function (wish:boolean):void {
                    let dirs:string[] = [];
                    const absolute = function (dir:string):string {
                            return mp3dir + sep + dir.replace(/\//g, sep);
                        },
                        wishlist:string[] = [
                            "<td>Action</td><td>300</td><td>2007</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Air Force One</td><td>1997</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Big Trouble in Little China</td><td>1986</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Blade 1</td><td>1998</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Blood Diamond</td><td>2006</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Bourne 1 - Identity</td><td>2002</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Bourne 2 - Supremacy</td><td>2004</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Bourne 3 - Ultimatum</td><td>2007</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Bourne 4 - Bourne Legacy</td><td>2012</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Bourne 5 - Jason Bourne</td><td>2016</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Cliffhanger</td><td>1993</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Commando</td><td>1985</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Deja Vu</td><td>2006</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Die Hard 1</td><td>1988</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Die Hard 2</td><td>1990</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Die Hard 3</td><td>1995</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Die Hard 4</td><td>2007</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Die Hard 5</td><td>2013</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Dirty Dozen</td><td>1967</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Equalizer 1</td><td>2014</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Equalizer 2</td><td>2018</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Equalizer 3</td><td>2023</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Elysium</td><td>2013</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Fast and Furious 1</td><td>2001</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Fast and Furious 2 - 2 Fast 2 Furious</td><td>2003</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Fast and Furious 3 - Tokyo Drift</td><td>2006</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Fast and Furious 4 - Fast & Furious</td><td>2009</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Fast and Furious 5 - Fast Five</td><td>2011</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Fast and Furious 6</td><td>2013</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Fast and Furious 7 - Furious 7</td><td>2015</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Fast and Furious 8 - Fate of the Furious</td><td>2017</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Fast and Furious 9 - F9</td><td>2021</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Fast and Furious 10 - Fast X</td><td>2023</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Fast and Furious - Hobbs and Shaw</td><td>2019</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Firefox</td><td>1982</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Gladiator</td><td>2000</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Hardcore Henry</td><td>2015</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Hero</td><td>2002</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Hunger Games 1</td><td>2012</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Hunger Games 3 - Mocking Jay Part 1</td><td>2014</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Hunger Games 4 - Mocking Jay Part 2</td><td>2015</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Hunger Games 5 - Ballad of Songbirds and Snakes</td><td>2023</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Kingsman 1</td><td>2015</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Kingsman 2</td><td>2017</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Matrix Resurrections</td><td>2021</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Mission Impossible 1</td><td>1996</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Mission Impossible 2</td><td>2000</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Mission Impossible 3</td><td>2006</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Mission Impossible 4 - Ghost Protocol</td><td>2011</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Mission Impossible 5 - Rogue Nation</td><td>2015</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Mission Impossible 6 - Fallout</td><td>2018</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Mission Impossible 7 - Dead Reckoning</td><td>2023</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>National Treasure 1</td><td>2004</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>National Treasure 2</td><td>2007</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Ong-Bak</td><td>2003</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Out of Time</td><td>2003</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Police Story 1</td><td>1985</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Police Story 2</td><td>1988</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Police Story 3 - Supercop 1</td><td>1992</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Police Story 4 - Supercop 2</td><td>1993</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Police Story 5 - First Strike</td><td>1996</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Police Story 6 - New Police Story</td><td>2004</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Police Story 7 - Police Story 2013</td><td>2013</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Predator 1</td><td>1987</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Predator 2</td><td>1990</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Predator 3 - Predators</td><td>2010</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Predator 4 - Predator</td><td>2018</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Predator 5 - Prey</td><td>2022</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>The Professional</td><td>1994</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Sicario</td><td>2015</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Sicario Day of the Saldado</td><td>2018</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Spectral</td><td>2016</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Taken 1</td><td>2008</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Taken 2</td><td>2012</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Taken 3</td><td>2014</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Tears of the Sun</td><td>2003</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Tenet</td><td>2020</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Terminator 1</td><td>1984</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Terminator 2 - Judgement Day</td><td>1991</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Terminator 3 - Rise of the Machines</td><td>2003</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Terminator 4 - Terminator Salvation</td><td>2005</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Terminator 5 - Genisys</td><td>2015</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Terminator 6 - Dark Fate</td><td>2019</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Total Recall</td><td>1990</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Total Recall</td><td>2012</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Transporter 1</td><td>2002</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Transporter 2</td><td>2005</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Transporter 3</td><td>2008</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Action</td><td>Transporter 4 - Refueled</td><td>2015</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Animation</td><td>Akira</td><td>1988</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Animation</td><td>Beowulf</td><td>2007</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Animation</td><td>Despicable Me 1</td><td>2010</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Animation</td><td>Despicable Me 2</td><td>2013</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Animation</td><td>Despicable Me 3</td><td>2017</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Animation</td><td>Despicable Me 4</td><td>2024</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Animation</td><td>Beowulf</td><td>2007</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Animation</td><td>Ghost in the Shell 1</td><td>1995</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Animation</td><td>Ghost in the Shell 2 - Innocence</td><td>2004</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Animation</td><td>Ghost in the Shell 3 - Stand Alone Complex</td><td>2006</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Animation</td><td>Ghost in the Shell 4 - New Movie</td><td>2015</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Animation</td><td>Grave of the Fireflies</td><td>1988</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Animation</td><td>Hugo</td><td>2011</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Animation</td><td>Interstella 5555</td><td>2003</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Animation</td><td>Kung Fu Panda 1</td><td>2007</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Animation</td><td>Kung Fu Panda 2</td><td>2011</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Animation</td><td>Kung Fu Panda 3</td><td>2016</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Animation</td><td>Kung Fu Panda 4</td><td>2024</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Animation</td><td>Lady and the Tramp</td><td>1955</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Animation</td><td>Lego Movie</td><td>2014</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Animation</td><td>Minions 1</td><td>2015</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Animation</td><td>Minions 2 - Rise of Gru</td><td>2022</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Animation</td><td>Nightmare Before Christmas</td><td>1993</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Animation</td><td>Oliver and Company</td><td>1988</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Animation</td><td>Patlabor 1</td><td>1989</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Animation</td><td>Patlabor 2</td><td>1993</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Animation</td><td>Patlabor 3</td><td>2002</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Animation</td><td>Pom Poko</td><td>1994</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Animation</td><td>Princess Mononoke</td><td>1997</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Animation</td><td>Rango</td><td>2011</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Animation</td><td>Ratatouille</td><td>2007</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Animation</td><td>Royal Space Force: Wings of Honneamise</td><td>1987</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Animation</td><td>Secret of Nimh</td><td>1982</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Animation</td><td>Shrek 1</td><td>2001</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Animation</td><td>Shrek 2</td><td>2004</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Animation</td><td>Shrek 3</td><td>2007</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Animation</td><td>Sleeping Beauty</td><td>1959</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Animation</td><td>Snow White and the Seven Dwarfs</td><td>1937</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Animation</td><td>Spirited Away</td><td>2001</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Animation</td><td>Transformers the Movie</td><td>1986</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Animation</td><td>Your Name</td><td>2016</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Animation</td><td>Zootopia</td><td>2016</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Comedy</td><td>Airplane 2</td><td>1982</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Comedy</td><td>Being John Malkovich</td><td>1999</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Comedy</td><td>I'm A Cyborg, But That's Ok</td><td>2006</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Comedy</td><td>John Dies at the End</td><td>2012</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Comedy</td><td>Who Framed Roger Rabbit</td><td>1988</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Comicbook</td><td>Captain Marvel 2</td><td>2023</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Docudrama</td><td>12 Years a Slave</td><td>2013</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Docudrama</td><td>Alexander</td><td>2004</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Docudrama</td><td>Amistad</td><td>1997</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Docudrama</td><td>Argo</td><td>2012</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Docudrama</td><td>Ben-Hur</td><td>1959</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Docudrama</td><td>Bridge of Spies</td><td>2015</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Docudrama</td><td>Das Boot</td><td>1981</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Docudrama</td><td>Devi's Double</td><td>2011</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Docudrama</td><td>Flags of our Fathers</td><td>2006</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Docudrama</td><td>Green Book</td><td>2018</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Docudrama</td><td>King's Speech</td><td>2010</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Docudrama</td><td>Last Emperor</td><td>1987</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Docudrama</td><td>Letters from Iwo Jima</td><td>2006</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Docudrama</td><td>Mark Felt</td><td>2017</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Docudrama</td><td>The Mule</td><td>2018</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Docudrama</td><td>Spartacus</td><td>1960</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Docudrama</td><td>Tora Tora Tora</td><td>1970</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Drama</td><td>Color Purple</td><td>1985</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Drama</td><td>Crouching Tiger, Hidden Dragon</td><td>2000</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Drama</td><td>Eternal Sunshine of the Spotless Mind</td><td>2004</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Drama</td><td>Fried Green Tomatoes</td><td>1991</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Drama</td><td>Huckleberry Finn</td><td>1993</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Drama</td><td>Horse Whisperer</td><td>1998</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Drama</td><td>Lions for Lambs</td><td>2007</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Drama</td><td>Lord of the Flies</td><td>1990</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Drama</td><td>The Natural</td><td>1984</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Drama</td><td>The Road</td><td>2009</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Drama</td><td>Seven Samurai</td><td>1954</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Drama</td><td>Snow Falling on Cedars</td><td>1999</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Science Fiction</td><td>Fifth Element</td><td>1997</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Science Fiction</td><td>Minority Report</td><td>2002</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Science Fiction</td><td>Star Wars 8 - Last Jedi</td><td>2017</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Science Fiction</td><td>Star Wars 9 - Rise of Skywalker</td><td>2019</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Science Fiction</td><td>Surrogates</td><td>2009</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Thriller</td><td>Arlington Road</td><td>1999</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Thriller</td><td>The Client</td><td>1994</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Thriller</td><td>The Firm</td><td>1993</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Thriller</td><td>Ronin</td><td>1998</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Thriller</td><td>X-Files</td><td>1998</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Western</td><td>A Fistful of Dollars</td><td>1964</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Western</td><td>For A Few Dollars More</td><td>1965</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>Western</td><td>Good, Bad, and The Ugly</td><td>1966</td><td>Movie</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>none</td><td>Aeon Flux</td><td>1991</td><td>Television</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>none</td><td>Bosch</td><td>2014</td><td>Television</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>none</td><td>Bosch Legacy</td><td>2022</td><td>Television</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>none</td><td>Broadchurch</td><td>2013</td><td>Television</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>none</td><td>Dark</td><td>2017</td><td>Television</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>none</td><td>Expanse</td><td>2015</td><td>Television</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>none</td><td>Goliath</td><td>2016</td><td>Television</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>none</td><td>Jean Claude Van Johnson</td><td>2016</td><td>Television</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>none</td><td>Lonesome Dove</td><td>1989</td><td>Television</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>none</td><td>Longmire</td><td>2012</td><td>Television</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>none</td><td>Outer Range</td><td>2022</td><td>Television</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>none</td><td>Shogun</td><td>1980</td><td>Television</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>none</td><td>Silent Sea</td><td>2021</td><td>Television</td><td>wish list</td><td>0</td><td>none</td><td>none</td>",
                            "<td>none</td><td>Squid Game</td><td>2021</td><td>Television</td><td>wish list</td><td>0</td><td>none</td><td>none</td>"
                        ],
                        list:string[]|directory_list = (wish === true)
                            ? wishlist
                            : fileList;
                    if (wish === true) {
                        listLength = wishlist.length;
                    }
                    if (index < listLength && wish === false) {
                        if (type === "music") {
                            tags.read(absolute(list[index][0]), {
                                onSuccess: function(tag) {
                                    fileList[index][5].album = tag.tags.album;
                                    fileList[index][5].artist = tag.tags.artist;
                                    fileList[index][5].genre = (tag.tags.genre === "36") ? "Game" : tag.tags.genre;
                                    // @ts-ignore
                                    fileList[index][5].id3 = tag.version;
                                    fileList[index][5].title = tag.tags.title;
                                    fileList[index][5].track = (tag.tags.track === undefined) ? "" : tag.tags.track;
                                    fileList[index][5].modified = dateFormat(fileList[index][5].mtimeMs);
                                    fileList[index][5].sizeFormatted = common.commas(fileList[index][5].size);
                                    totalSize = totalSize + fileList[index][5].size;
                                    index = index + 1;
                                    readTags(false);
                                },
                                onError: function(error) {
                                    log([
                                        `Error reading ID3 tag of file ${mp3dir + sep + list[index][0]}`,
                                        error.type,
                                        error.info
                                    ]);
                                }
                            });
                        } else {
                            dirs = list[index][0].split("/");
                            if (dirs.length > 1) {
                                fileList[index][5].genre = dirs[dirs.length - 2].charAt(0).toUpperCase() + dirs[dirs.length - 2].slice(1);
                                fileList[index][5].title = dirs[dirs.length - 1].slice(0,  dirs[dirs.length - 1].lastIndexOf("."));
                                fileList[index][5].track = fileList[index][5].title.slice(fileList[index][5].title.indexOf("(") + 1, fileList[index][5].title.length - 1);
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
                            readTags(false);
                        }
                    } else {
                        const headingMap:storeString = (type === "music")
                                ? {
                                    "play": "Play",
                                    "genre": "Genre",
                                    "artist": "Artist",
                                    "album": "Album",
                                    "title": "Title",
                                    "track": "Track",
                                    "path": "File Path",
                                    "sizeFormatted": "File Size",
                                    "id3": "ID3 Version",
                                    "modified": "Modified",
                                    "hash": "Hash"
                                }
                                : {
                                    "play": "Play",
                                    "genre": "Genre",
                                    "title": "Title",
                                    "track": "Year",
                                    "artist": "Type",
                                    "path": "File Path",
                                    "sizeFormatted": "File Size",
                                    "modified": "Modified",
                                    "hash": "Hash"
                                },
                            headings:string[] = Object.keys(headingMap),
                            location:string = `${resolve(process.argv[2]) + sep}list.html`,
                            browser:string = `${resolve(process.argv[2]) + sep}browser.js`,
                            writeList = function ():void {
                                writeFile(location, html.join("\n"), function (erw:NodeJS.ErrnoException):void {
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
                        let htmlIndex:number = 0;
                        if (type === "music") {
                            log([
                                `${humanTime(startTime, false)}All files read for ID3 tags. Writing report.`
                            ]);
                        }
                        if (listLength > 0) {
                            if (wish === true) {
                                html.push("<h2 style=\"display:none\">Movie and Television Wishlist</h2>");
                                html.push("<table style=\"display:none\"><thead><tr>");
                            } else {
                                html.push("<fieldset><legend>List Options</legend>");
                                html.push("<p><label><span>Filter</span><input type=\"text\" id=\"filter\"/></label></p>");
                                html.push("<p><label><span>Filter Field</span><select><option selected=\"selected\">Any</option>");
                                do {
                                    html.push(`<option>${headingMap[headings[htmlIndex]]}</option>`);
                                    htmlIndex = htmlIndex + 1;
                                } while (htmlIndex < headings.length);
                                html.push("</select></label></p>");
                                html.push("<p><label><span>Case Sensitive</span><input type=\"checkbox\" checked=\"checked\" id=\"caseSensitive\"/></label></p>");
                                if (type === "movie") {
                                    html.push("<p><label><span>Show Wishlist</span><input type=\"checkbox\" id=\"wishlist\"/></label></p>");
                                }
                                html.push("</fieldset><table><thead><tr>");
                            }
                            htmlIndex = 0;
                            do {
                                html.push(`<th><button data-direction="descend">${svg.sort}</button> ${headingMap[headings[htmlIndex]]}</th>`);
                                htmlIndex = htmlIndex + 1;
                            } while (htmlIndex < headings.length);
                            htmlIndex = 0;
                            index = 0;
                            html.push("</tr></thead><tbody>");
                            if (wish === true) {
                                do {
                                    html.push(`<tr>${wishlist[index]}</tr>`);
                                    index = index + 1;
                                } while (index < listLength);
                            } else {
                                do {
                                    html.push(`<tr class="${(index % 2 === 0) ? "even" : "odd"}" data-path="${list[index][0]}">`);
                                    do {
                                        if (headings[htmlIndex] === "play") {
                                            html.push(`<td><button>${svg.play}</button></td>`);
                                        } else if (headings[htmlIndex] === "path") {
                                            html.push(`<td>${list[index][0]}</td>`);
                                        } else if (headings[htmlIndex] === "hash") {
                                            html.push(`<td>${list[index][2]}</td>`);
                                        } else if (headings[htmlIndex] === "modified") {
                                            html.push(`<td data-numeric="${fileList[index][5].mtimeMs}">${fileList[index][5].modified}</td>`);
                                        } else if (headings[htmlIndex] === "sizeFormatted") {
                                            html.push(`<td class="number" data-numeric="${fileList[index][5].size}">${fileList[index][5].sizeFormatted}</td>`);
                                        } else if (headings[htmlIndex] === "title") {
                                            html.push(`<td>${fileList[index][5].title}</td>`);
                                        } else {
                                            // @ts-ignore
                                            html.push(`<td${(headings[htmlIndex] === "sizeFormatted" || headings[htmlIndex] === "track") ? " class=\"number\"" : ""}>${fileList[index][5][headings[htmlIndex]]}</td>`);
                                        }
                                        htmlIndex = htmlIndex + 1;
                                    } while (htmlIndex < headings.length);
                                    htmlIndex = 0;
                                    html.push("</tr>");
                                    index = index + 1;
                                } while (index < listLength);
                            }
                            html.push("</tbody></table>");
                            if (wish === false) {
                                let x:number = 0;
                                do {
                                    if (html[x].indexOf("<h1>") === 0) {
                                        break;
                                    }
                                    x = x + 1;
                                } while (x < 100);
                                html.splice(
                                    x + 1,
                                    0,
                                    `<p>Total files: ${listLength}</p>`,
                                    `<p>Total size: ${common.commas(totalSize)} bytes (${common.prettyBytes(totalSize)})</p>`
                                );
                            }
                            // after the tables are complete
                            if (type === "music" || (type === "movie" && wish === true)) {
                                if (production === true) {
                                    readFile(`${projectPath}browser.js`, function (erRead:NodeJS.ErrnoException, fileData:Buffer):void {
                                        if (erRead === null) {
                                            const fileString:string = fileData.toString("utf8");
                                            html.push("<script type=\"application/javascript\">");
                                            html.push(fileString);
                                            html.push("</script></body></html>");
                                            writeList();
                                        } else {
                                            log([
                                                `Error reading browser.js`,
                                                JSON.stringify(erRead)
                                            ]);
                                        }
                                    });
                                } else {
                                    // for testing browser.js as a separate file
                                    stat(`${projectPath}browser.js`, function (ers:NodeJS.ErrnoException, stat:Stats):void {
                                        if (ers === null) {
                                            writeStream({
                                                callback: function () {
                                                    html.push("<script src=\"browser.js\" type=\"application/javascript\"></script>");
                                                    html.push("</body></html>");
                                                    writeList();
                                                },
                                                destination: browser,
                                                source: `${projectPath}browser.js`,
                                                stat: stat
                                            });
                                        } else {
                                            log([
                                                `Error on stat of browser.js`,
                                                JSON.stringify(ers)
                                            ]);
                                        }
                                    });
                                }
                            }
                        }
                    }
                };
            fileList.sort(function (a, b):1|-1 {
                if (a[0] < b[0]) {
                    return -1;
                }
                return 1;
            });
            readTags(false);
            if (type === "movie") {
                readTags(true);
            }
            log([
                "",
                `${humanTime(startTime, false)}Hashing complete for ${fileList.length} ${typeCaps} files. ${nextAction}.`
            ]);
        };
    log.title(`${typeCaps} Master List`);
    log([`${humanTime(startTime, false)}Hashing files`]);
    if (process.argv.length < 3) {
        log(["Please specify a file system location."]);
    } else {
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
    }
};

init();