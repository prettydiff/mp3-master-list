
import { readFile, stat, Stats, writeFile } from "fs";
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
        type:"movie"|"music" = (mp3dir.indexOf("movies") > -1)
            ? "movie"
            : "music",
        typeCaps:string = (type === "movie")
            ? "Movie"
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
                html:string[] = [
                    "<!doctype html>",
                    "<html>",
                    "<head>",
                    `<title>${typeCaps} Master List</title>`,
                    "<style type=\"text/css\">",
                    "body{font-family:sans-serif}",
                    "audio{display:block;width:80em}",
                    "h1{margin:0}",
                    "th{background:#ddd;padding:0.5em}",
                    "td{padding:0.2em 0.4em}",
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
                    "#currentTrack td{background:#fdd;border-color:#900;box-shadow:0.1em 0.1em 0.5em;color:#900}",
                    "</style>",
                    "</head><body>",
                    `<h1>${typeCaps} Master List</h1>`,
                    `<p>Dated: ${dateFormat(Date.now())}</p>`,
                    `<p>Location: ${resolve(process.argv[2])}</p>`,
                ],
                svg:storeString = {
                    play: '<svg version="1.1" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g><path d="M85.5,51.7l-69,39.8c-1.3,0.8-3-0.2-3-1.7V10.2c0-1.5,1.7-2.5,3-1.7l69,39.8C86.8,49,86.8,51,85.5,51.7z"/></g></svg>',
                    sort: '<svg viewBox="0 0 320 512" xmlns="http://www.w3.org/2000/svg"><path d="M27.66 224h264.7c24.6 0 36.89-29.78 19.54-47.12l-132.3-136.8c-5.406-5.406-12.47-8.107-19.53-8.107c-7.055 0-14.09 2.701-19.45 8.107L8.119 176.9C-9.229 194.2 3.055 224 27.66 224zM292.3 288H27.66c-24.6 0-36.89 29.77-19.54 47.12l132.5 136.8C145.9 477.3 152.1 480 160 480c7.053 0 14.12-2.703 19.53-8.109l132.3-136.8C329.2 317.8 316.9 288 292.3 288z"/></svg>'
                },
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
                                html.push("<p><label>Filter <input type=\"text\"/></label> <label>Filter Field <select><option selected=\"selected\">Any</option>");
                                do {
                                    html.push(`<option>${headingMap[headings[htmlIndex]]}</option>`);
                                    htmlIndex = htmlIndex + 1;
                                } while (htmlIndex < headings.length);
                                html.push("</select></label> <label>Case Sensitive <input type=\"checkbox\" checked=\"checked\"/></label></p>");
                                if (type === "movie") {
                                    html.push("<p><label>Show Wishlist <input type=\"checkbox\"/></label></p>");
                                }
                                if (type === "music" && wish === false) {
                                    html.push("<p>Double click on any song in the table below to start playing. <span id=\"currentTrackName\"></span></p>");
                                    html.push("<audio controls=\"true\"></audio>");
                                }
                                html.push("<table><thead><tr>");
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
                                    if (type === "music") {
                                        html.push(`<tr class="${(index % 2 === 0) ? "even" : "odd"}" data-path="${list[index][0]}">`);
                                    } else {
                                        html.push(`<tr class="${(index % 2 === 0) ? "even" : "odd"}">`);
                                    }
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
                                } while (x < 50);
                                html.splice(
                                    x + 1,
                                    0,
                                    `<p>Total files: ${listLength}</p>`,
                                    `<p>Total size: ${common.commas(totalSize)} bytes (${common.prettyBytes(totalSize)})</p>`
                                );
                            }
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