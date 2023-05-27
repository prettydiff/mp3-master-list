
/* lib/terminal/commands/library/directory - A utility to walk the file system and return a data structure. */

import { exec } from "child_process";
import { lstat, readdir, realpath, stat, Stats } from "fs";
import { sep } from "path";
import { moveCursor } from "readline";

import common from "./common.js";
import hash from "./hash.js";
import humanTime from "./humanTime.js";
import log from "./log.js";
import text from "./text.js";

// similar to node's fs.readdir, but recursive
const directory = function terminal_commands_library_directory(args:config_command_directory):void {
        // arguments:
        // * callback - function - the output is passed into the callback as an argument
        // * depth - number - how many directories deep a recursive scan should read, 0 = full recursion
        // * hash - boolean - whether file types should be hashed
        // * exclusions - string array - a list of items to exclude
        // * path - string - where to start in the local file system
        // * symbolic - boolean - if symbolic links should be identified
        // -
        // directory_list: [].failures
        // 0. absolute path (string)
        // 1. type (fileType)
        // 2. hash (string), empty string unless fileType is "file" and args.hash === true and be aware this is exceedingly slow on large directory trees
        // 3. parent index (number)
        // 4. child item count (number)
        // 5. selected properties from fs.Stat plus some link resolution data
        // 6. write path from the lib/utilities/rename library for file copy
        // * property "failures" is a list of file paths that could not be read or opened
        let dirTest:boolean = false,
            size:number = 0,
            dirs:number = 0,
            longest:number = 0,
            startItem:string = null,
            files:number = 0,
            summary:string;
        const dirCount:number[] = [],
            dirNames:string[] = [],
            searchLast:number = args.search.length - 1,
            searchReg:RegExp = new RegExp(args.search.slice(1, searchLast)),
            searchType:searchType = (function terminal_commands_library_directory_searchType():searchType {
                if (args.mode === "search") {
                    const regString:string = args.search.slice(1, searchLast);
                    if (sep === "\\") {
                        args.search = args.search.toLowerCase();
                    }
                    if (args.search !== "//" && args.search !== "/" && args.search.charAt(0) === "/" && args.search.charAt(searchLast) === "/" && (/^(?:(?:[^?+*{}()[\]\\|]+|\\.|\[(?:\^?\\.|\^[^\\]|[^\\^])(?:[^\]\\]+|\\.)*\]|\((?:\?[:=!]|\?<[=!]|\?>|\?<[^\W\d]\w*>|\?'[^\W\d]\w*')?|\))(?:(?:[?+*]|\{\d+(?:,\d*)?\})[?+]?)?|\|)*$/).test(regString) === true) {
                        return "regex";
                    }
                    if (args.search.charAt(0) === "!") {
                        return "negation";
                    }
                    if (args.search.charAt(0) !== "!") {
                        return "fragment";
                    }
                }
                return null;
            }()),
            title:string = (args.mode === "search")
                ? (args.mode === "search")
                    ? `Directory ${searchType} search`
                    : `Directory ${common.capitalize(args.mode)}`
                : "",
            callback = function terminal_commands_library_directory_callback():void {
                if (args.mode === "hash") {
                    let index:number = 0,
                        fileCount:number = 0;
                    const listLength:number = list.length,
                        mp3List:directory_list = [],
                        loop = function terminal_commands_library_directory_loop():void {
                            do {
                                index = index + 1;
                            } while (index < listLength && list[index][1] !== "file");
                            if (index === listLength) {
                                args.callback(title, [summary, String(longest)], mp3List);
                            } else {
                                hashInput.parent = list[index][3];
                                hashInput.source = args.path + sep + list[index][0].replace(/\//g, sep);
                                hashInput.stat = list[index][5];
                                hash(hashInput);
                            }
                        },
                        hashInput:config_command_hash = {
                            algorithm: "sha3-512",
                            callback: function terminal_commands_library_directory_statWrapper_stat_populate_hashCallback(title:string, output:hash_output):void {
                                list[index][2] = output.hash;
                                mp3List.push(list[index]);
                                fileCount = fileCount + 1;
                                moveCursor(process.stdout, -10000, 0);
                                process.stdout.write(`${humanTime(args.startTime, false)}Hashed file ${fileCount} of ${files} (${((fileCount / files) * 100).toFixed(2)}%).`);
                                if (index > 0) {
                                    loop();
                                } else {
                                    args.callback(title, [summary, String(longest)], mp3List);
                                }
                            },
                            digest: "hex",
                            directInput: false,
                            id: null,
                            list: false,
                            parent: null,
                            source: null,
                            stat: null
                        };
                    log([`${humanTime(args.startTime, false)}File system mapped and starting hashing.`]);
                    loop();

                    // bypass hashing for testing
                    /*
                    const mp3List:directory_list = [],
                        listLength:number = list.length;
                    let index:number = 0;
                    do {
                        if (list[index][1] === "file") {
                            mp3List.push(list[index]);
                        }
                        index = index + 1;
                    } while (index < listLength);
                    args.callback(title, [summary, String(longest)], mp3List);
                    */
                } else if (args.mode === "search") {
                    args.callback(title, [summary, String(longest)], list);
                } else {
                    args.callback(title, [summary, String(longest)], list);
                }
            },
            list:directory_list = [],
            fileList:string[] = [],
            method:(filePath:string, callback:(er:Error, stat:Stats) => void) => void = (args.symbolic === true)
                ? lstat
                : stat,
            dirCounter = function terminal_commands_library_directory_dirCounter(item:string):void {
                const dirList:string[] = item.split(sep);
                let dirPath:string = "",
                    index:number = 0;
                summary = `Total file size of ${text.green + common.commas(size) + text.none} bytes and ${text.angry + common.commas(list.failures.length) + text.none} errors.`;
                dirList.pop();
                dirPath = dirList.join(sep);
                if ((/^\w:$/).test(dirPath) === true) {
                    dirPath = `${dirPath}\\`;
                } else if (dirPath === "") {
                    dirPath = sep;
                }
                index = dirNames.indexOf(dirPath);
                if (index < 0 && args.path === "\\" && (/^\w:\\$/).test(dirPath) === true) {
                    index = 0;
                }
                dirCount[index] = dirCount[index] - 1;
                // 
                if (dirNames.length === 0 && item === args.path) {
                    // empty directory, nothing to traverse
                    callback();
                } else if (dirCount[index] < 1) {
                    // dirCount and dirNames are parallel arrays
                    dirCount.splice(index, 1);
                    dirNames.splice(index, 1);
                    dirs = dirs - 1;
                    if (dirs < 1) {
                        callback();
                    } else {
                        terminal_commands_library_directory_dirCounter(dirPath);
                    }
                }
            },
            statWrapper = function terminal_commands_library_directory_statWrapper(filePath:string, parent:number):void {
                method(filePath, function terminal_commands_library_directory_statWrapper_stat(er:Error, stats:Stats):void {
                    const statData:directory_data = (stats === undefined)
                        ? null
                        : {
                            album: "",
                            artist: "",
                            atimeMs: stats.atimeMs,
                            ctimeMs: stats.ctimeMs,
                            genre: "",
                            id3: "",
                            length: 0,
                            linkPath: "",
                            linkType: "",
                            mode: stats.mode,
                            modified: "",
                            mtimeMs: stats.mtimeMs,
                            size: stats.size,
                            sizeFormatted: "",
                            title: "",
                            track: ""
                        },
                        driveLetter = function terminal_commands_library_directory_statWrapper_stat_driveLetter(input:string):string {
                            return `${input}\\`;
                        },
                        relative = function (input:string):string {
                            return input.replace(args.path + sep, "").replace(/\\/g, "/");
                        },
                        relPath:string = relative(filePath),
                        search = function terminal_commands_library_directory_statWrapper_stat_search(searchItem:string):boolean {
                            const names:string = searchItem.split(sep).pop(),
                                named:string = (sep === "\\")
                                    ? names.toLowerCase()
                                    : names;
                            if (searchType === "regex" && searchReg.test(named) === true) {
                                return true;
                            }
                            if (searchType === "negation" && named.indexOf(args.search.slice(1)) < 0) {
                                return true;
                            }
                            if (searchType === "fragment" && named.indexOf(args.search) > -1) {
                                return true;
                            }
                            return false;
                        },
                        dir = function terminal_commands_library_directory_statWrapper_stat_dir(item:string):void {
                            const dirBody = function terminal_commands_library_directory_statWrapper_stat_dir_dirBody(files:string[]):void {
                                const index:number = (args.mode === "array" || args.mode === "list")
                                        ? fileList.length
                                        : list.length,
                                    relItem:string = relative(item);
                                if (args.mode === "array") {
                                    fileList.push(relItem);
                                } else if (args.mode === "list") {
                                    fileList.push(`directory  0  ${relPath}`);
                                } else {
                                    if (args.mode === "search") {
                                        if (search(item) === true) {
                                            list.push([relPath, "directory", "", parent, files.length, statData, ""]);
                                        }
                                    } else {
                                        list.push([relItem, "directory", "", parent, files.length, statData, ""]);
                                    }
                                }
                                if (files.length < 1) {
                                    dirCounter(item);
                                } else {
                                    // dirCount and dirNames are parallel arrays
                                    dirCount.push(files.length);
                                    dirNames.push(item);
                                    dirs = dirs + 1;
                                }
                                files.forEach(function terminal_commands_library_directory_statWrapper_stat_dir_readDir_each(value:string):void {
                                    if (item === "\\") {
                                        terminal_commands_library_directory_statWrapper(value, index);
                                    } else if ((/^\w:\\$/).test(item) === true) {
                                        terminal_commands_library_directory_statWrapper(item + value, index);
                                    } else if (item === "/") {
                                        terminal_commands_library_directory_statWrapper(`/${value}`, index);
                                    } else {
                                        terminal_commands_library_directory_statWrapper(item + sep + value, index);
                                    }
                                });
                            };
                            if (item === "\\") {
                                //cspell:disable-next-line
                                exec("wmic logicaldisk get name", function terminal_commands_library_directory_statWrapper_stat_dir_windowsRoot(erw:Error, stdout:string, stderr:string):void {
                                    if (erw !== null || stderr !== "") {
                                        list.failures.push(item);
                                        if (dirs > 0) {
                                            dirCounter(item);
                                        } else {
                                            args.mode = "array";
                                            callback();
                                        }
                                    } else {
                                        const drives:string[] = stdout.replace(/Name\s+/, "").replace(/\s+$/, "").replace(/\s+/g, " ").split(" ");
                                        dirBody(drives);
                                    }
                                });
                            } else {
                                readdir(item, {encoding: "utf8"}, function terminal_commands_library_directory_statWrapper_stat_dir_readDir(erd:Error, files:string[]):void {
                                    if (erd !== null) {
                                        list.failures.push(item);
                                        if (dirs > 0) {
                                            dirCounter(item);
                                        } else {
                                            args.mode = "array";
                                            callback();
                                        }
                                    } else {
                                        dirBody(files);
                                    }
                                });
                            }
                        },
                        populate = function terminal_commands_library_directory_statWrapper_stat_populate(type:"directory"|"error"|"file"|"link"):void {
                            if (type === "error") {
                                if (list[parent] !== undefined) {
                                    list[parent][4] = list[parent][4] - 1;
                                }
                                if (args.mode === "list") {
                                    log([`error     0  ${relPath}`]);
                                }
                                list.failures.push(filePath);
                            } else {
                                if (args.mode === "search") {
                                    if (search(filePath) === true) {
                                        list.push([relPath, type, "", parent, 0, statData, ""]);
                                    }
                                } else if (args.mode === "array" || args.mode === "list") {
                                    if (args.mode === "array") {
                                        fileList.push(relPath);
                                    } else {
                                        const typePadding:string = (type === "link")
                                                ? "link     "
                                                : (type === "file")
                                                    ? "file     "
                                                    : "directory",
                                            comma:string = common.commas(stats.size),
                                            size:number = comma.length;
                                        if (size > longest) {
                                            longest = size;
                                        }
                                        fileList.push(`${typePadding}  ${comma}  ${relPath}`);
                                    }
                                } else if ((/\.(m|M)(p|P)3$/).test(relPath) === true) {
                                    files = files + 1;
                                    list.push([relPath, type, "", parent, 0, statData, ""]);
                                }
                            }
                            if (dirs > 0) {
                                dirCounter(filePath);
                            } else {
                                callback();
                            }
                        },
                        linkAction = function terminal_commands_library_directory_statWrapper_stat_linkAction():void {
                            if (args.mode === "type") {
                                args.callback(title, ["link"], null);
                                return;
                            }
                            populate("link");
                        },
                        linkCallback = function terminal_commands_library_directory_statWrapper_stat_linkCallback(linkErr:Error, linkStat:Stats):void {
                            if (linkErr === null) {
                                statData.linkType = (linkStat.isDirectory() === true)
                                    ? "directory"
                                    : "file";
                                realpath(filePath, function terminal_Commands_directory_statWrapper_stat_linkCallback_realPath(realErr:Error, realPath:string):void {
                                    if (realErr === null) {
                                        statData.linkPath = realPath;
                                        linkAction();
                                    } else {
                                        populate("error");
                                    }
                                });
                            } else {
                                populate("error");
                            }
                        };
                    summary = `Total file size of ${text.green + common.commas(size) + text.none} bytes and ${text.angry + common.commas(list.failures.length) + text.none} errors.`;
                    if (filePath === "\\") {
                        const date:Date = new Date(),
                            empty = function terminal_commands_library_directory_statWrapper_empty():boolean {
                                return false;
                            };
                        er = null;
                        stats = {
                            dev: 0,
                            ino: 0,
                            mode: 0,
                            nlink: 0,
                            uid: 0,
                            gid: 0,
                            rdev: 0,
                            size: 0,
                            blksize: 0,
                            blocks: 0,
                            atimeMs: 0,
                            mtimeMs: 0,
                            ctimeMs: 0,
                            birthtimeMs: 0,
                            atime: date,
                            mtime: date,
                            ctime: date,
                            birthtime: date,
                            isBlockDevice: empty,
                            isCharacterDevice: empty,
                            isDirectory: function terminal_commands_library_directory_statWrapper_isDirectory():boolean {
                                return true;
                            },
                            isFIFO: empty,
                            isFile: empty,
                            isSocket: empty,
                            isSymbolicLink: empty
                        };
                    }
                    if (er !== null) {
                        if (er.toString().indexOf("no such file or directory") > 0) {
                            if (args.mode === "type") {
                                args.callback(title, ["error"], null);
                                return;
                            }
                            populate("error");
                        } else {
                            populate("error");
                        }
                    } else if (stat === undefined) {
                        log([`Requested artifact, ${text.cyan + args.path + text.none}, ${text.angry}is missing${text.none}.`]);
                        populate("error");
                    } else if (stats.isDirectory() === true) {
                        if (args.mode === "type") {
                            args.callback(title, ["directory"], null);
                            return;
                        }
                        const dirs:number = (args.path === "\\" && (/\w:$/).test(filePath) === false)
                            ? `\\${filePath.replace(startItem, "")}`.split(sep).length
                            : filePath.replace(startItem, "").split(sep).length;
                        if ((args.depth < 1 || dirs < args.depth) || dirTest === false) {
                            dirTest = true;
                            dir(filePath.replace(/^\w:$/, driveLetter));
                        } else {
                            populate("directory");
                        }
                    } else if (stats.isSymbolicLink() === true) {
                        if (args.symbolic === true) {
                            linkAction();
                        } else {
                            stat(filePath, linkCallback);
                        }
                    } else {
                        if (args.mode === "type") {
                            if (stats.isBlockDevice() === true) {
                                args.callback(title, ["blockDevice"], null);
                            } else if (stats.isCharacterDevice() === true) {
                                args.callback(title, ["characterDevice"], null);
                            } else if (stats.isFIFO() === true) {
                                args.callback(title, ["FIFO"], null);
                            } else if (stats.isSocket() === true) {
                                args.callback(title, ["socket"], null);
                            } else {
                                args.callback(title, ["file"], null);
                            }
                            return;
                        }
                        size = size + stats.size;
                        populate("file");
                    }
                });
            };
        args.path = (args.path.length > 2)
            ? args.path.replace(/(\/|\\)$/, "")
            : args.path;
        startItem = (args.path === "/")
            ? "/"
            : args.path + sep
        list.failures = [];
        statWrapper(args.path, 0);
    };

export default directory;