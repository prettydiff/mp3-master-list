
import { open, read, readFile, stat, Stats, writeFile } from "fs";
import { resolve, sep } from "path";

import * as tags from "jsmediatags";

import common from "./common.js";
import directory from "./directory.js";
import humanTime from "./humanTime.js";
import log from "./log.js";
import writeStream from "./writeStream.js";

// cspell:words Audiobook, Bhangra, Breakbeat, Breakz, Chillout, Darkwave, Dubstep, Electroclash, Eurodance, Illbient, Industro, Jpop, jsmediatags, Krautrock, Leftfield, Negerpunk, Neue, Polsk, Psybient, Psytrance, Shoegaze, Showtunes, Synthpop, TALB, TLEN, TRCK, Welle

const init = function () {
    const mp3dir:string = process.argv[2],
        startTime:bigint = process.hrtime.bigint(),
        dirCallback = function (title:string, text:string[], list:directory_list):void {
            let index:number = 0;
            const listLength:number = list.length,
                genreIndex:storeString = {
                    "0": "Blues",
                    "1": "Classic Rock",
                    "2": "Country",
                    "3": "Dance",
                    "4": "Disco",
                    "5": "Funk",
                    "6": "Grunge",
                    "7": "Hip-Hop",
                    "8": "Jazz",
                    "9": "Metal",
                    "10": "New Age",
                    "11": "Oldies",
                    "12": "Other",
                    "13": "Pop",
                    "14": "Rhythm and Blues",
                    "15": "Rap",
                    "16": "Reggae",
                    "17": "Rock",
                    "18": "Techno",
                    "19": "Industrial",
                    "20": "Alternative",
                    "21": "Ska",
                    "22": "Death Metal",
                    "23": "Pranks",
                    "24": "Soundtrack",
                    "25": "Euro-Techno",
                    "26": "Ambient",
                    "27": "Trip-Hop",
                    "28": "Vocal",
                    "29": "Jazz & Funk",
                    "30": "Fusion",
                    "31": "Trance",
                    "32": "Classical",
                    "33": "Instrumental",
                    "34": "Acid",
                    "35": "House",
                    "36": "Game",
                    "37": "Sound clip",
                    "38": "Gospel",
                    "39": "Noise",
                    "40": "Alternative Rock",
                    "41": "Bass",
                    "42": "Soul",
                    "43": "Punk",
                    "44": "Space",
                    "45": "Meditative",
                    "46": "Instrumental Pop",
                    "47": "Instrumental Rock",
                    "48": "Ethnic",
                    "49": "Gothic",
                    "50": "Darkwave",
                    "51": "Techno-Industrial",
                    "52": "Electronic",
                    "53": "Pop-Folk",
                    "54": "Eurodance",
                    "55": "Dream",
                    "56": "Southern Rock",
                    "57": "Comedy",
                    "58": "Cult",
                    "59": "Gangsta",
                    "60": "Top 40",
                    "61": "Christian Rap",
                    "62": "Pop/Funk",
                    "63": "Jungle music",
                    "64": "Native US",
                    "65": "Cabaret",
                    "66": "New Wave",
                    "67": "Psychedelic",
                    "68": "Rave",
                    "69": "Showtunes",
                    "70": "Trailer",
                    "71": "Lo-Fi",
                    "72": "Tribal",
                    "73": "Acid Punk",
                    "74": "Acid Jazz",
                    "75": "Polka",
                    "76": "Retro",
                    "77": "Musical",
                    "78": "Rock 'n' Roll",
                    "79": "Hard Rock",
                    "80": "Folk",
                    "81": "Folk-Rock",
                    "82": "National Folk",
                    "83": "Swing",
                    "84": "Fast Fusion",
                    "85": "Bebop",
                    "86": "Latin",
                    "87": "Revival",
                    "88": "Celtic",
                    "89": "Bluegrass",
                    "90": "Avantgarde",
                    "91": "Gothic Rock",
                    "92": "Progressive Rock",
                    "93": "Psychedelic Rock",
                    "94": "Symphonic Rock",
                    "95": "Slow Rock",
                    "96": "Big Band",
                    "97": "Chorus",
                    "98": "Easy Listening",
                    "99": "Acoustic",
                    "100": "Humour",
                    "101": "Speech",
                    "102": "Chanson",
                    "103": "Opera",
                    "104": "Chamber Music",
                    "105": "Sonata",
                    "106": "Symphony",
                    "107": "Booty Bass",
                    "108": "Primus",
                    "109": "Porn Groove",
                    "110": "Satire",
                    "111": "Slow Jam",
                    "112": "Club",
                    "113": "Tango",
                    "114": "Samba",
                    "115": "Folklore",
                    "116": "Ballad",
                    "117": "Power Ballad",
                    "118": "Rhythmic Soul",
                    "119": "Freestyle",
                    "120": "Duet",
                    "121": "Punk Rock",
                    "122": "Drum Solo",
                    "123": "A cappella",
                    "124": "Euro-House",
                    "125": "Dance Hall",
                    "126": "Goa music",
                    "127": "Drum & Bass",
                    "128": "Club-House",
                    "129": "Hardcore Techno",
                    "130": "Terror",
                    "131": "Indie",
                    "132": "BritPop",
                    "133": "Negerpunk",
                    "134": "Polsk Punk",
                    "135": "Beat",
                    "136": "Christian Gangsta Rap",
                    "137": "Heavy Metal",
                    "138": "Black Metal",
                    "139": "Crossover",
                    "140": "Contemporary Christian",
                    "141": "Christian Rock",
                    "142": "Merengue",
                    "143": "Salsa",
                    "144": "Thrash Metal",
                    "145": "Anime",
                    "146": "Jpop",
                    "147": "Synthpop",
                    "148": "Christmas",
                    "149": "Art Rock",
                    "150": "Baroque",
                    "151": "Bhangra",
                    "152": "Big beat",
                    "153": "Breakbeat",
                    "154": "Chillout",
                    "155": "Downtempo",
                    "156": "Dub",
                    "157": "EBM",
                    "158": "Eclectic",
                    "159": "Electro",
                    "160": "Electroclash",
                    "161": "Emo",
                    "162": "Experimental",
                    "163": "Garage",
                    "164": "Global",
                    "165": "IDM",
                    "166": "Illbient",
                    "167": "Industro-Goth",
                    "168": "Jam Band",
                    "169": "Krautrock",
                    "170": "Leftfield",
                    "171": "Lounge",
                    "172": "Math Rock",
                    "173": "New Romantic",
                    "174": "Nu-Breakz",
                    "175": "Post-Punk",
                    "176": "Post-Rock",
                    "177": "Psytrance",
                    "178": "Shoegaze",
                    "179": "Space Rock",
                    "180": "Trop Rock",
                    "181": "World Music",
                    "182": "Neoclassical",
                    "183": "Audiobook",
                    "184": "Audio Theatre",
                    "185": "Neue Deutsche Welle",
                    "186": "Podcast",
                    "187": "Indie-Rock",
                    "188": "G-Funk",
                    "189": "Dubstep",
                    "190": "Garage Rock",
                    "191": "Psybient"
                },
                production:boolean = true,
                projectPath:string = (function () {
                    const dirs:string[] = process.argv[1].split(sep);
                    dirs.pop();
                    return dirs.join(sep) + sep;
                }()),
                readTags = function ():void {
                    const dateFormat = function (dateNumber:number):string {
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
                    absolute = function (dir:string):string {
                        return mp3dir + sep + dir.replace(/\//g, sep);
                    };
                    if (index < listLength) {
                        /*
                        open(list[index][0], function (errO:NodeJS.ErrnoException, fd:number):void {
                            if (errO === null) {
                                const bufLength:number = (front === true)
                                        ? 5000
                                        : 128,
                                    buf:Buffer = Buffer.alloc(bufLength);
                                read(fd, {
                                    buffer: buf,
                                    length: bufLength,
                                    offset: 0,
                                    position: (front === true)
                                        ? 0
                                        : list[index][5].size - bufLength
                                }, function (errR:NodeJS.ErrnoException, bytes:number, output:Buffer):void {
                                    if (front === true) {
                                        if (output[0] === 73 && output[1] === 68 && output[2] === 51) {
                                            // ID3v2
                                            const frameSize:number = (output[3] < 3)
                                                    ? 3
                                                    : 4,
                                                flags:storeFlag = (frameSize === 3)
                                                ? {
                                                    "TAL": false,
                                                    "TCO": false,
                                                    "TLE": false,
                                                    "TOA": false,
                                                    "TRK": false,
                                                    "TT2": false
                                                }
                                                : {
                                                    "TALB": false,
                                                    "TCON": false,
                                                    "TIT2": false,
                                                    "TLEN": false,
                                                    "TPE1": false,
                                                    "TRCK": false
                                                },
                                                flagMap:storeString = (frameSize === 3)
                                                ? {
                                                    "TAL": "album",
                                                    "TCO": "genre",
                                                    "TLE": "length",
                                                    "TOA": "artist",
                                                    "TRK": "track",
                                                    "TT2": "title"
                                                }
                                                : {
                                                    "TALB": "album",
                                                    "TCON": "genre",
                                                    "TIT2": "title",
                                                    "TLEN": "length",
                                                    "TPE1": "artist",
                                                    "TRCK": "track"
                                                },
                                                tagSize:number = parseInt(output.subarray(6, 10).toString("hex"), 16),
                                                extendedHeader:number = (frameSize === 3)
                                                    ? 0
                                                    : (output[5] === 63 || output[5] === 191)
                                                        ? parseInt(output.subarray(10, 14).toString("hex"), 16)
                                                        : 0,
                                                frameFlag:number = (frameSize === 3)
                                                    ? 0
                                                    : 2,
                                                size1:number = (output[3] > 3)
                                                    ? 2
                                                    : 0,
                                                trackString = function (size:number, index:number):string {
                                                    const ascii:storeNumber = {
                                                        "0": 0,
                                                        "48": 0,
                                                        "49": 1,
                                                        "50": 2,
                                                        "51": 3,
                                                        "52": 4,
                                                        "53": 5,
                                                        "54": 6,
                                                        "55": 7,
                                                        "56": 8,
                                                        "57": 9
                                                    };
                                                    if (size === 3) {
                                                        return String((ascii[output[index]] * 100) + (ascii[output[index + 1]] * 10) + ascii[output[index + 2]]);
                                                    }
                                                    return String((ascii[output[index]] * 1000) + (ascii[output[index + 1]] * 100) + (ascii[output[index + 2]] * 10) + ascii[output[index + 3]]);
                                                },
                                                frame = function ():void {
                                                    const tag:string = output.toString("utf8", frameIndex, frameIndex + frameSize),
                                                        bodyStart:number = frameIndex + (frameSize * 2),
                                                        size:number = parseInt(output.subarray(frameIndex + frameSize, bodyStart).toString("hex"), 16);
                                                    if (flags[tag] !== undefined) {
                                                        if (tag === "TLEN" || tag === "TLE" || tag === "TRCK" || tag === "TRK") {
                                                            if (output[3] === 4) {
                                                                // @ts-ignore
                                                                list[index][5][flagMap[tag]] = output.toString("utf16le", bodyStart + 5, bodyStart + size + size1);
                                                            } else {
                                                                // @ts-ignore
                                                                list[index][5][flagMap[tag]] = trackString(size, bodyStart + 1);
                                                            }
                                                        } else {
                                                            if (tag === "TCON" && output[3] === 4) {
                                                                list[index][5].genre = output.toString("utf8", (output[bodyStart + frameSize - 1] > 47 && output[bodyStart + frameSize - 1] < 127) ? bodyStart + frameSize - 1 : bodyStart + frameSize + 1, bodyStart + size + size1);
                                                            } else {
                                                                // @ts-ignore
                                                                list[index][5][flagMap[tag]] = output.toString("utf16le", bodyStart + frameSize + 1, (output[3] === 3 && output[bodyStart + size + size1 + 2] > 47 && output[bodyStart + size + size1 + 2] < 127) ? bodyStart + size + size1 + 2 : bodyStart + size + size1);
                                                                if (tag === "TCON") {
                                                                    list[index][5].genre = list[index][5].genre.replace(/^(\(\d+\)\s*)/, "");
                                                                }
                                                            }
                                                        }
                                                        flags[tag] = true;
                                                    }
                                                    if (frameIndex < tagSize - 1 ||
                                                        (frameSize === 4 && (flags.TALB === false || flags.TCON === false || flags.TIT2 === false || flags.TLEN === false || flags.TPE1 === false || flags.TRCK === false)) ||
                                                        (frameSize === 3 && (flags.TAL === false || flags.TCO === false || flags.TT2 === false || flags.TLE === false || flags.TOA === false || flags.TRK === false))
                                                    ) {
                                                        frameIndex = frameIndex + size + (frameSize * 2) + frameFlag;
                                                        // test for tag padding
                                                        if (output[frameIndex] !== 0 && frameIndex < tagSize) {
                                                            frame();
                                                        }
                                                    }
                                                };
                                            let frameIndex:number = 10 + extendedHeader;
                                            list[index][5].id3 = `2.${output[3]}.${output[4]}`;
                                            frame();
                                        }
                                        index = index + 1;
                                        opener(false);
                                    } else {
                                        list[index][5].modified = dateFormat(list[index][5].mtimeMs);
                                        list[index][5].sizeFormatted = common.commas(list[index][5].size);
                                        if (output[0] === 84 && output[1] === 65 && output[2] === 71) {
                                            // ID3v1
                                            const genre:string = output[127].toString();
                                            list[index][5].title = output.subarray(3, 33).toString().replace(/\u0000+/g, "");
                                            list[index][5].artist = output.subarray(33, 63).toString().replace(/\u0000+/g, "");
                                            list[index][5].album = output.subarray(63, 93).toString().replace(/\u0000+/g, "");
                                            list[index][5].genre = (genreIndex[genre] === undefined)
                                                ? ""
                                                : genreIndex[genre];
                                            if (output[125] === 0 && output[126] > 0) {
                                                list[index][5].track = output[126].toString();
                                                list[index][5].id3 = "1.1";
                                            } else {
                                                list[index][5].track = "";
                                                list[index][5].id3 = "1.0";
                                            }
                                        }
                                        opener(true);
                                    }
                                });
                            } else {
                                log([
                                    `Error opening file ${list[index][0]}`,
                                    JSON.stringify(errO)
                                ]);
                            }
                        });
                        */
                        tags.read(absolute(list[index][0]), {
                            onSuccess: function(tag) {
                                list[index][5].album = tag.tags.album;
                                list[index][5].artist = tag.tags.artist;
                                list[index][5].genre = (tag.tags.genre === "36") ? "Game" : tag.tags.genre;
                                // @ts-ignore
                                list[index][5].id3 = tag.version;
                                list[index][5].title = tag.tags.title;
                                list[index][5].track = (tag.tags.track === undefined) ? "" : tag.tags.track;
                                list[index][5].modified = dateFormat(list[index][5].mtimeMs);
                                list[index][5].sizeFormatted = common.commas(list[index][5].size);
                                index = index + 1;
                                readTags();
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
                        const headingMap:storeString = {
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
                            },
                            headings:string[] = Object.keys(headingMap),
                            html:string[] = [
                                "<!doctype html>",
                                "<html>",
                                "<head>",
                                "<title>MP3 Master List</title>",
                                "<style type=\"text/css\">",
                                "body{font-family:sans-serif}",
                                "h1{margin:0}",
                                "th{background:#ddd}",
                                "th,td{font-family:intelOneMono;overflow:nowrap;padding:0.2em 0.4em}",
                                "td,th,table{border:0.1em solid #666;border-collapse:collapse}",
                                "th button{float:right;margin:0 0.25em 0 2em}",
                                "tbody tr:hover{background:#def}",
                                ".number{text-align:right}",
                                ".odd{background:#eee}",
                                "@font-face{font-family:'intelOneMono';font-style:normal;font-weight:400;",
                                "src:local(\"intelOneMono\"),url(\"data:application/octet-stream;base64,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\")format(\"opentype\")}</style>",
                                "</head><body>",
                                "<h1>MP3 Master List</h1>",
                                `<p>Dated: ${dateFormat(Date.now())}</p>`,
                                `<p>Location: ${resolve(process.argv[2])}</p>`,
                                `<p>Total files: ${listLength}</p>`,
                                "<p><label>Filter <input type=\"text\"/></label> <label>Filter Field <select><option selected=\"selected\">Any</option>"
                            ],
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
                        log([
                            `${humanTime(startTime, false)}All files read for ID3 tags. Writing report.`
                        ]);
                        if (listLength > 0) {
                            do {
                                html.push(`<option>${headingMap[headings[htmlIndex]]}</option>`);
                                htmlIndex = htmlIndex + 1;
                            } while (htmlIndex < headings.length);
                            htmlIndex = 0;
                            html.push("</select></label> <label>Case Sensitive <input type=\"checkbox\" checked=\"checked\"/></label></p>");
                            html.push("<table><thead><tr>");
                            do {
                                html.push(`<th>${headingMap[headings[htmlIndex]]} <button data-direction="descend">⇅</button></th>`);
                                htmlIndex = htmlIndex + 1;
                            } while (htmlIndex < headings.length);
                            htmlIndex = 0;
                            index = 0;
                            html.push("</tr></thead><tbody>");
                            do {
                                html.push(`<tr class="${(index % 2 === 0) ? "even" : "odd"}">`);
                                do {
                                    if (headings[htmlIndex] === "path") {
                                        html.push(`<td>${list[index][0]}</td>`);
                                    } else if (headings[htmlIndex] === "hash") {
                                        html.push(`<td>${list[index][2]}</td>`);
                                    } else if (headings[htmlIndex] === "modified") {
                                        html.push(`<td data-numeric="${list[index][5].mtimeMs}">${list[index][5].modified}`);
                                    } else if (headings[htmlIndex] === "sizeFormatted") {
                                        html.push(`<td class="number" data-numeric="${list[index][5].size}">${list[index][5].sizeFormatted}`);
                                    } else {
                                        // @ts-ignore
                                        html.push(`<td${(headings[htmlIndex] === "sizeFormatted" || headings[htmlIndex] === "track") ? " class=\"number\"" : ""}>${list[index][5][headings[htmlIndex]]}</td>`);
                                    }
                                    htmlIndex = htmlIndex + 1;
                                } while (htmlIndex < headings.length);
                                htmlIndex = 0;
                                html.push("</tr>");
                                index = index + 1;
                            } while (index < listLength);
                            html.push("</tbody></table>");
                            if (production === true) {
                                readFile(`${projectPath}browser.js`, function (erRead:NodeJS.ErrnoException, fileData:Buffer):void {
                                    if (erRead === null) {
                                        const fileString:string = fileData.toString("utf8");
                                        html.push("<script type=\"application/javascript\">");
                                        html.push(fileString);//.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
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
                };
            list.sort(function (a, b):1|-1 {
                if (a[0] < b[0]) {
                    return -1;
                }
                return 1;
            });
            readTags();
            log([
                "",
                `${humanTime(startTime, false)}Hashing complete for ${list.length} MP3 files. Reading ID3 tags.`
            ]);
        };
    log.title("MP3 Master List");
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
            symbolic: false
        });
    }
};

init();