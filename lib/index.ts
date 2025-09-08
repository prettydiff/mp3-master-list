
import { readFile, writeFile } from "fs";
import { sep } from "path";

// import * as tags from "jsmediatags";
import * as id3 from "node-id3";

import common from "./common.js";
import directory from "./directory.js";
import humanTime from "./humanTime.js";
import log from "./log.js";

// cspell:words Audiobook, Bhangra, Breakbeat, Breakz, Chillout, Darkwave, Dubstep, Electroclash, Eurodance, Illbient, Industro, Jpop, jsmediatags, Krautrock, Leftfield, Negerpunk, Neue, Polsk, Psybient, Psytrance, Shoegaze, Showtunes, Synthpop, TALB, TLEN, TRCK, Welle, xlink

const init = function () {
    let browser:string = "",
        styles:string = "",
        readFiles:number = 0;
    const location:string = process.argv[2],
        startTime:bigint = process.hrtime.bigint(),
        type:mediaType = (location.indexOf("music") > -1)
            ? "music"
            : (location.indexOf("movie") > -1)
                ? "movie"
                : "television",
        typeCaps:string = (type === "movie")
            ? "Movie"
                : (type === "television")
                    ? "Television"
                    : "Music",
        nextAction:string = (type === "movie" || type === "television")
            ? " Writing output"
            : "Reading ID3 tags",
        dirMode:"hash"|"read" = (type === "music")
            ? "hash"
            : "read",
        modeProper:string = (dirMode === "hash")
            ? "Hashing"
            : "Reading",
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
                    "modified": "Modified"
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
                "modified": "Modified"
            };
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
        buildHTML = function (totalData:string, mediaType:mediaType):string {
            const mediaTypeCaps:string = mediaType.charAt(0).toUpperCase() + mediaType.slice(1),
                headingList:storeString = headingMap(mediaType),
                headingItems:string[] = Object.keys(headingList),
                html1:string[] = [
                    "<!doctype html>",
                    "<html>",
                    "<head>",
                    `<title>${mediaTypeCaps} Master List</title>`,
                    "<meta name=\"viewport\" content=\"width=device-width, height=device-height, initial-scale=1, user-scalable=0, minimum-scale=1, maximum-scale=1\"/>",
                    "<meta http-equiv=\"content-type\" content=\"text/html; charset=utf8\"/>",
                    "<style type=\"text/css\">",
                    styles,
                    "</style>",
                    `</head><body class="${mediaType} white">`,
                    "<div class=\"body\">",
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
                    "<p class=\"radio\"><span>Color Scheme</span><label><input checked=\"checked\" name=\"colorScheme\" type=\"radio\" value=\"default\"/> Default</label><label><input name=\"colorScheme\" type=\"radio\" value=\"white\"/> White</label></p>",
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
                    output.push("</tr></thead><tbody></tbody></table>");
                    return output;
                }()),
                html6:string[] = [
                    "<script type=\"application/javascript\">",
                    browser,
                    "</script></div></body></html>"
                ];
            // html1 - top of html file: head, body, title
            // totals - totalData - passed in HTML containing file size calculations
            // html2 - date, location, color scheme option
            // html3 - filter field options
            // html4 - filter search type
            // html5 - data table header
            // mediaData - passed in dataList, the data table body
            // html9 - bottom of file and browser JavaScript
            return html1.concat(totals, html2, html3, html4, html5, html6).join("\n");
        },
        dirCallback = function (title:string, text:string[], fileList:directory_list):void {
            let index:number = 0,
                totalSize:number = 0;
            const recurse = function () {
                    // recursion throttling to prevent a "maximum call stack exceeded error"
                    if (index % 2000 === 0) {
                        setTimeout(readTags, 0);
                    } else {
                        readTags();
                    }
                },
                readTags = function ():void {
                    const absolute = function (dir:string):string {
                            return location + sep + dir.replace(/\//g, sep);
                        },
                        list:string[]|directory_list = fileList;
                    let dirs:string[] = [],
                        listLength:number = list.length;
                    if (index < listLength) {
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
                                    recurse();
                                } else {
                                    log([`Error reading id3 tag of file: ${absolute(list[index][0])}`, JSON.stringify(id3Err)]);
                                }
                            });
                        } else {
                            dirs = list[index][0].split("/");
                            if (dirs.length > 1 && list[index][1] === "file") {
                                fileList[index][5].genre = (type === "movie")
                                    ? dirs[0]
                                    : dirs[1];
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
                            recurse();
                        }
                    } else {
                        const write = function (content:string, write_location:string) {
                            writeFile(
                                write_location,
                                content,
                                function (erw:NodeJS.ErrnoException):void {
                                    if (erw === null) {
                                        log([
                                            `${humanTime(startTime, false)[0]}List written to location: ${write_location}`
                                        ]);
                                    } else {
                                        log([
                                            `Error writing list to location: ${write_location}`,
                                            JSON.stringify(erw)
                                        ]);
                                    }
                                }
                            );
                        };
                        if (type === "music") {
                            log([
                                `${humanTime(startTime, false)[0]}All files read for ID3 tags. Writing report.`
                            ]);
                        }
                        write(buildHTML(`<p><span>Total files</span> ${listLength}</p>\n<p><span>Total size</span> ${common.commas(totalSize)} bytes (${common.prettyBytes(totalSize)})</p>\n<p id="filtered-results"><span>Filtered Results</span> ${listLength} results (100.00%)</p>`, type), `\\\\192.168.1.3\\write_here\\list_${type}.html`);
                        write(JSON.stringify(fileList), `\\\\192.168.1.3\\write_here\\list_${type}.json`);
                    }
                };
            fileList.sort(function (a, b):1|-1 {
                if (a[0] < b[0]) {
                    return -1;
                }
                return 1;
            });
            recurse();
            log([
                "",
                `${humanTime(startTime, false)[0] + modeProper} complete for ${fileList.length} ${typeCaps} files. ${nextAction}.`
            ]);
        },
        readComplete = function ():void {
            readFiles = readFiles + 1;
            if (readFiles === 2) {
                if (process.argv.length < 3) {
                    log(["Please specify a file system location."]);
                } else {
                    directory({
                        callback: dirCallback,
                        depth: 0,
                        mode: dirMode,
                        path: process.argv[2],
                        search: "",
                        startTime: startTime,
                        symbolic: false,
                        type: type
                    });
                }
            }
        };
    log.title(`${typeCaps} Master List`);
    log([`${humanTime(startTime, false)[0] + modeProper} files`]);
    readFile(`${projectPath.replace("js", "lib")}style.css`, function (erRead:NodeJS.ErrnoException, fileData:Buffer):void {
        if (erRead === null) {
            styles = fileData.toString();
            readComplete();
        } else {
            log(["Error reading style.css", JSON.stringify(erRead)]);
        }
    });
    readFile(`${projectPath}browser.js`, function (erRead:NodeJS.ErrnoException, fileData:Buffer):void {
        if (erRead === null) {
            browser = fileData.toString();
            readComplete();
        } else {
            log(["Error reading browser.js", JSON.stringify(erRead)]);
        }
    });
};

init();