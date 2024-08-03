
// cspell: words dgimsuvi

(function () {
    const body:HTMLElement = document.getElementsByTagName("body")[0],
        documentType:"movie"|"music"|"television" = body.getAttribute("class") as "movie"|"music"|"television",
        trackList:HTMLElement[] = [],
        list = {
            filter: function ():void {
                const caseSensitive:boolean = dom.caseSensitive.checked,
                    value:string = (caseSensitive === true)
                        ? dom.filter.value
                        : dom.filter.value.toLowerCase(),
                    field:HTMLSelectElement = dom.filterField,
                    searchType:searchType = dom.filterType.value as searchType,
                    headingIndex:number = field.selectedIndex,
                    // a trimmed array
                    commaValues:string[] = (function ():string[] {
                        const values:string[] = value.split(",");
                        values.forEach(function (item:string, itemIndex:number, itemArray:string[]):void {
                            itemArray[itemIndex] = item.trim();
                        });
                        return values;
                    }()),
                    // search function
                    searchTest = function (text:string):boolean {
                        if ((searchType === "fragment" || searchType === "negation") && ((caseSensitive === true && text.includes(value) === true) || (caseSensitive === false && text.toLowerCase().includes(value) === true))) {
                            return true;
                        }
                        if (searchType === "list" || searchType === "negation-list") {
                            let count:number = commaValues.length;
                            do {
                                count = count - 1;
                                if ((caseSensitive === true && text.includes(commaValues[count]) === true) || (caseSensitive === false && text.toLowerCase().includes(commaValues[count]) === true)) {
                                    return true;
                                }
                            } while (count > 0);
                        }
                        if (searchType === "regex") {
                            let regValue:string = value,
                                flags:string = "";
                            if ((/^\//).test(value) === true && (/\/[dgimsuvi]*$/).test(value) === true) {
                                regValue = regValue.replace("/", "");
                                flags = regValue.slice(regValue.lastIndexOf("/") + 1);
                                regValue = regValue.replace(/\/[dgimsuvi]*$/, "");
                            }
                            const reg:RegExp = new RegExp(regValue, flags);
                            if (reg.test(text) === true) {
                                return true;
                            }
                        }
                        return false;
                    },
                    mediaTable:HTMLElement = document.getElementsByTagName("table")[0];
                let index:number = 0,
                    displayCount:number = 0,
                    mediaCount:number = 0,
                    plural:string = "s",
                    recordTest:boolean = false,
                    cellIndex:number = 0,
                    cells:HTMLCollectionOf<HTMLTableCellElement> = null;
                do {
                    cells = dom.recordsAll[index].getElementsByTagName("td");
                    // execute the search function on cell contents
                    if (field.selectedIndex === 0) {
                        cellIndex = cells.length;
                        recordTest = false;
                        do {
                            cellIndex = cellIndex - 1;
                            recordTest = searchTest(cells[cellIndex].textContent);
                            if (recordTest === true) {
                                break;
                            }
                        } while (cellIndex > 1);
                    } else {
                        recordTest =  searchTest(cells[headingIndex].textContent);
                    }
                    // visually apply the filter
                    if (((searchType === "negation" || searchType === "negation-list") && recordTest === false) || (searchType !== "negation" && searchType !== "negation-list" && recordTest === true)) {
                        dom.recordsAll[index].setAttribute("class", (displayCount % 2 === 0) ? "even" : "odd");
                        dom.recordsAll[index].style.display = "table-row";
                        displayCount = displayCount + 1;
                        if (dom.recordsAll[index].parentElement.parentElement === mediaTable) {
                            mediaCount = mediaCount + 1;
                        }
                    } else {
                        dom.recordsAll[index].style.display = "none";
                    }
                    index = index + 1;
                } while (index < recordLengthAll);
                if (mediaCount === 1) {
                    plural = "";
                }
                dom.displayCount.lastChild.textContent = ` ${mediaCount} result${plural} (${(((mediaCount / recordLengthMedia) * 100)).toFixed(2)}%)`;
            },
            filterKey: function (event:KeyboardEvent):void {
                const key:string = event.key.toLowerCase();
                if (key === "enter") {
                    list.filter();
                }
            },
            sort: function (event:MouseEvent):void {
                const target:HTMLElement = tools.ancestor(event.target as HTMLElement, "button") as HTMLElement,
                    direction:string = target.getAttribute("data-direction"),
                    th:HTMLElement = tools.ancestor(target, "th"),
                    thList:HTMLCollectionOf<HTMLElement> = tools.ancestor(th, "thead").getElementsByTagName("th"),
                    table:HTMLElement = tools.ancestor(th, "table"),
                    records:HTMLElement[] = (table === document.getElementsByTagName("table")[0])
                        ? dom.recordsMedia
                        : dom.recordsWish,
                    recordsLength:number = (records === dom.recordsMedia)
                        ? recordLengthMedia
                        : recordLengthWish,
                    tbody:HTMLElement = table.getElementsByTagName("tbody")[0] as HTMLElement,
                    label:string = th.lastChild.textContent.trim();
                let displayCount:number = 0,
                    thIndex = thList.length;
                do {
                    thIndex = thIndex - 1;
                } while (thIndex > 0 && thList[thIndex] !== th);
                records.sort(function (a, b) {
                    const numeric:boolean = (label === "File Size" || label === "Modified"),
                        tda = (numeric === true)
                            ? a.getElementsByTagName("td")[thIndex].getAttribute("data-numeric")
                            : (a.getElementsByTagName("td")[thIndex].firstChild === null)
                                ? null
                                : a.getElementsByTagName("td")[thIndex].firstChild.textContent,
                        tdb = (numeric === true)
                            ? b.getElementsByTagName("td")[thIndex].getAttribute("data-numeric")
                            : (b.getElementsByTagName("td")[thIndex].firstChild === null)
                                ? null
                                : b.getElementsByTagName("td")[thIndex].firstChild.textContent;
                    if (direction === "descend") {
                        if (((numeric === true || label === "Track") && Number(tda) < Number(tdb)) || (numeric === false && label !== "Track" && tda < tdb)) {
                            return 1;
                        }
                        return -1;
                    }
                    if (((numeric === true || label === "Track") && Number(tda) < Number(tdb)) || (numeric === false && label !== "Track" && tda < tdb)) {
                        return -1;
                    }
                    return 1;
                });
                tbody.innerHTML = "";
                thIndex = 0;
                do {
                    if (records[thIndex].style.display !== "none") {
                        records[thIndex].setAttribute("class", (displayCount % 2 === 0) ? "even" : "odd");
                        displayCount = displayCount + 1;
                    }
                    tbody.appendChild(records[thIndex]);
                    thIndex = thIndex + 1;
                } while (thIndex < recordsLength);
                dom.recordsAll = dom.recordsMedia.concat(dom.recordsWish);
                if (direction === "descend") {
                    target.setAttribute("data-direction", "ascend");
                } else {
                    target.setAttribute("data-direction", "descend");
                }
            },
            toggle: function ():void {
                const table:HTMLElement = document.getElementsByTagName("table")[1],
                    h2:HTMLElement = document.getElementsByTagName("h2")[0];
                if (table === undefined) {
                    return;
                }
                if (dom.wishlist.checked === true) {
                    table.style.display = "table";
                    h2.style.display = "block";
                } else {
                    table.style.display = "none";
                    h2.style.display = "none";
                }
            }
        },
        playEvents = {
            buttonPlayerActive: function (button:HTMLElement):void {
                let index:number = dom.playerControls.length;
                do {
                    index = index - 1;
                    if (dom.playerControls[index].getAttribute("class") !== "random" && dom.playerControls[index].getAttribute("class") !== "random active") {
                        dom.playerControls[index].removeAttribute("class");
                    }
                } while (index > 0);
                button = tools.ancestor(button, "button");
                button.setAttribute("class", "active");
            },
            durationChange: function ():void {
                dom.duration.innerHTML = tools.humanTime(dom.media.duration);
                tools.titleTop();
            },
            error: function ():void {
                dom.duration.innerHTML = "Error";
            },
            minimize: function (event:MouseEvent):void {
                const target:HTMLElement = event.target as HTMLElement,
                    parent:HTMLElement = dom.currentTrackName.parentNode as HTMLElement,
                    player:HTMLElement = parent.parentNode as HTMLElement,
                    children:NodeListOf<ChildNode> = player.childNodes;
                let index = children.length,
                    child:HTMLElement = null;
                if (target.firstChild.textContent === "-") {
                    target.removeChild(target.firstChild);
                    target.appendChild(document.createTextNode("+"));
                    target.setAttribute("class", "active");
                    do {
                        index = index - 1;
                        child = children[index] as HTMLElement;
                        if (child !== parent) {
                            child.style.display = "none";
                        }
                    } while (index > 0);
                } else {
                    target.removeChild(target.firstChild);
                    target.appendChild(document.createTextNode("-"));
                    target.removeAttribute("class");
                    do {
                        index = index - 1;
                        child = children[index] as HTMLElement;
                        if (child !== parent) {
                            child.style.display = "block";
                        }
                    } while (index > 0);
                    player.style.removeProperty("height");
                }
            },
            mute: function (event:MouseEvent):void {
                const target:HTMLElement = tools.ancestor(event.target as HTMLElement, "button"),
                    input:HTMLInputElement = target.getElementsByTagName("input")[0];
                if (input.checked === true) {
                    input.checked = false;
                    target.removeAttribute("class");
                    dom.media.volume = 0;
                } else {
                    input.checked = true;
                    target.setAttribute("class", "active");
                    dom.media.volume = playEvents.volume;
                }
            },
            next: function ():void {
                let nextElement:HTMLElement = (dom.random.checked === true)
                    ? document.getElementsByTagName("tbody")[0].getElementsByTagName("tr")[tools.randomIndex()]
                    : dom.currentTrack;

                // cycle through hidden next tracks
                do {
                    nextElement = nextElement.nextElementSibling as HTMLElement;
                    if (nextElement === null) {
                        nextElement = document.getElementsByTagName("tbody")[0].getElementsByTagName("tr")[0];
                    }
                    if (nextElement.getAttribute("id") === "currentTrack") {
                        return;
                    }
                } while (nextElement.style.display === "none");

                // assign the selected track for playing
                tools.setCurrentTrack(nextElement, true);
                trackList.push(nextElement);
                playEvents.buttonPlayerActive(dom.playerControls[1]);
            },
            pause: function (event:MouseEvent):void {
                dom.media.pause();
                playEvents.playing = false;
                playEvents.buttonPlayerActive(event.target as HTMLElement);
                dom.currentTrack.getElementsByTagName("button")[0].removeAttribute("class");
            },
            play: function ():void {
                dom.media.play();
                playEvents.playing = true;
                setTimeout(tools.currentTime, 50);
            },
            playList: function (event:MouseEvent):void {
                const target:HTMLElement = event.target as HTMLElement,
                    next:HTMLElement = tools.ancestor(target, "tr");
                tools.setCurrentTrack(next, true);
                trackList.push(next);
                playEvents.buttonPlayerActive(dom.playerControls[1]);
            },
            playPlayer: function (event:MouseEvent):void {
                if (playEvents.playing === true) {
                    dom.media.currentTime = 0;
                }
                playEvents.play();
                playEvents.buttonPlayerActive(event.target as HTMLElement);
                dom.currentTrack.getElementsByTagName("button")[0].setAttribute("class", "active");
            },
            playing: false,
            previous: function ():void {
                trackList.pop();
                let trackListTest:boolean = (trackList.length > 0),
                    previousElement:HTMLElement = (trackListTest === true)
                        ? trackList.pop()
                        : dom.currentTrack;

                // remove the class attribute from the currentTrack, because its no longer the actively playing track
                dom.currentTrack.getElementsByTagName("button")[0].removeAttribute("class");

                // cycle through hidden previous tracks
                if (trackListTest === false || (trackListTest === true && previousElement.style.display === "none")) {
                    do {
                        previousElement = previousElement.previousElementSibling as HTMLElement;
                        if (previousElement === null) {
                            previousElement = document.getElementsByTagName("tbody")[0].getElementsByTagName("tr")[recordLengthMedia - 1];
                        }
                        if (previousElement.getAttribute("id") === "currentTrack") {
                            return;
                        }
                    } while (previousElement.style.display === "none");
                }

                // assign the selected track for playing
                tools.setCurrentTrack(previousElement, true);
                playEvents.buttonPlayerActive(dom.playerControls[1]);
            },
            randomToggle: function (event:MouseEvent):void {
                const target:HTMLElement = tools.ancestor(event.target as HTMLElement, "button");
                if (dom.random.checked === true) {
                    dom.random.checked = false;
                    target.setAttribute("class", "random");
                } else {
                    dom.random.checked = true;
                    target.setAttribute("class", "random active");
                }
            },
            slider: function (event:MouseEvent|TouchEvent):void {
                const eventType:string = event.type,
                    touch:boolean = (event !== null && eventType === "touchstart"),
                    target:HTMLElement = event.target as HTMLElement,
                    button:HTMLElement = (eventType === "click")
                        ? (target.nodeName.toLowerCase() === "p")
                            ? target.getElementsByTagName("button")[0]
                            : target
                        : tools.ancestor(target, "button");
                const sliderType:"seek"|"volume" = (button === dom.seekSlider)
                        ? "seek"
                        : "volume",
                    parentName:"p"|"span" = (sliderType === "seek")
                        ? "p"
                        : "span",
                    parent:HTMLElement = (eventType === "click")
                        ? tools.ancestor(target, parentName)
                        : tools.ancestor(button, parentName),
                    parentOffset:number = parent.offsetLeft,
                    buttonWidth:number = button.clientWidth,
                    max:number = (parent.clientWidth + 2) - buttonWidth,
                    min:number = -2,
                    drop = function (dropEvent:Event):void {
                        dropEvent.preventDefault();
                        if (touch === true) {
                            document.ontouchmove = null;
                            document.ontouchend  = null;
                        } else {
                            document.onmousemove = null;
                            document.onmouseup   = null;
                        }
                    },
                    move = function (moveEvent:MouseEvent|TouchEvent):void {
                        const touchMove:TouchEvent = (touch === true)
                                ? moveEvent as TouchEvent
                                : null,
                            mouseMove:MouseEvent = (touch === true)
                                ? null
                                : moveEvent as MouseEvent,
                            clientX:number = (touch === true)
                                ? touchMove.touches[0].clientX
                                : mouseMove.clientX,
                            x:number = clientX - buttonWidth - parentOffset;
                        if (x - 1 > min && x + 1 < max) {
                            button.style.left = `${(x / 16).toFixed(2)}em`;
                            if (sliderType === "seek") {
                                dom.media.currentTime = (x / (max - min)) * dom.media.duration;
                            } else {
                                playEvents.volume = x / (max - min);
                                dom.media.volume = playEvents.volume;
                            }
                        }
                    };
                if (eventType === "click") {
                    if (target.nodeName.toLowerCase() === "p") {
                        move(event);
                    }
                } else {
                    event.preventDefault();
                    if (touch === true) {
                        document.ontouchmove  = move;
                        document.ontouchstart = null;
                        document.ontouchend   = drop;
                    } else {
                        document.onmousemove = move;
                        document.onmousedown = null;
                        document.onmouseup   = drop;
                    }
                }
            },
            stop: function (event:MouseEvent):void {
                playEvents.pause(event);
                dom.media.currentTime = 0;
                dom.currentTime.innerHTML = "00:00:00";
                dom.seekSlider.style.left = "0";
            },
            timeJump: function (event:KeyboardEvent):void {
                const key:string = event.key;
                if (key === "ArrowLeft") {
                    event.preventDefault();
                    dom.media.currentTime = dom.media.currentTime - 5;
                } else if (key === "ArrowRight") {
                    event.preventDefault();
                    dom.media.currentTime = dom.media.currentTime + 5;
                }
            },
            volume: 0.5
        },
        tools = {
            ancestor: function (node:HTMLElement, name:string):HTMLElement {
                let parent:HTMLElement = node;
                if (parent.nodeName.toLowerCase() === name) {
                    return parent;
                }
                do {
                    parent = parent.parentNode as HTMLElement;
                    if (parent === document.documentElement) {
                        return parent;
                    }
                } while (parent.nodeName.toLowerCase() !== name);
                return parent;
            },
            currentTime: function ():void {
                dom.currentTime.innerHTML = tools.humanTime(dom.media.currentTime);
                dom.seekSlider.style.left = `${((dom.media.currentTime / dom.media.duration) * 100).toFixed(2)}%`;
                if (playEvents.playing === true) {
                    setTimeout(tools.currentTime, 50);
                }
            },
            getRecords: function (tableIndex:number):HTMLElement[] {
                const output:HTMLElement[] = [],
                    populate = function (indexValue:number):void {
                        const tbody:HTMLElement = document.getElementsByTagName("tbody")[indexValue],
                            tr:HTMLCollectionOf<HTMLElement> = (tbody === undefined)
                                ? null
                                : tbody.getElementsByTagName("tr"),
                            trLen:number = (tbody === undefined)
                                ? 0
                                : tr.length;
                        let index:number = 0;
                        if (trLen === 0) {
                            return;
                        }
                        do {
                            output.push(tr[index]);
                            index = index + 1;
                        } while (index < trLen);
                    };
                if (tableIndex < 0) {
                    populate(0);
                    populate(1);
                } else {
                    populate(tableIndex);
                }
                return output;
            },
            humanTime: function (input:number):string {
                const hour:number = Math.floor(input / 3600),
                    min:number = Math.floor((input % 3600) / 60),
                    second:number = Math.floor((input % 3600) % 60),
                    hStr:string = (hour < 10)
                        ? `0${hour}`
                        : String(hour),
                    mStr:string = (min < 10)
                        ? `0${min}`
                        : String(min),
                    sStr:string = (second < 10)
                        ? `0${second}`
                        : String(second);
                return `${hStr}:${mStr}:${sStr}`;
            },
            randomIndex: function ():number {
                let index:number = recordLengthMedia;
                const shown:number[] = [],
                    seed:number = (window.crypto.getRandomValues(new Uint32Array(1))[0] / 1e10);
                do {
                    index = index - 1;
                    if (dom.recordsMedia[0].style.display === "table-row") {
                        shown.push(index);
                    }
                } while (index > 0);
                return shown[Math.round(seed * shown.length)];
            },
            scrollTo: function ():void {
                window.scroll({
                    behavior: "smooth",
                    left: 0,
                    top: dom.currentTrack.offsetTop + 200
                });
            },
            setCurrentTrack: function (tr:HTMLElement, play:boolean):void {
                const td:HTMLCollectionOf<HTMLElement> = tr.getElementsByTagName("td");
                dom.currentTrack.getElementsByTagName("button")[0].removeAttribute("class");
                dom.currentTrack.removeAttribute("id");
                dom.currentTrack = tr;
                dom.currentTrack.setAttribute("id", "currentTrack");
                if (documentType === "music") {
                    dom.currentTrackName.innerHTML = `<strong>${td[4].innerHTML}</strong> by <em>${td[2].innerHTML}</em>`;
                } else {
                    dom.currentTrackName.innerHTML = `<strong>${td[2].innerHTML}</strong>`;
                }
                dom.playerSource.src = tr.getAttribute("data-path");
                dom.media.load();
                if (play === true) {
                    playEvents.play();
                    dom.currentTrack.getElementsByTagName("button")[0].setAttribute("class", "active");
                }
            },
            slider: function(name:string):void {
                const track:"seekTrack"|"volumeTrack" = `${name}Track` as "seekTrack"|"volumeTrack",
                    slider:"seekSlider"|"volumeSlider" = `${name}Slider` as "seekSlider"|"volumeSlider";
                dom[track].onclick = playEvents.slider;
                dom[slider].onmousedown = playEvents.slider;
                dom[slider].ontouchstart = playEvents.slider;
            },
            titleTop: function ():void {
                dom.title.style.marginTop = `${(dom.player.clientHeight / 20) + 1.5}em`;
            }
        },
        dom:dom = {
            buttons: document.getElementsByTagName("button"),
            caseSensitive: document.getElementById("caseSensitive") as HTMLInputElement,
            cellButtons: document.getElementsByTagName("tbody")[0].getElementsByTagName("button"),
            currentTime: document.getElementById("currentTime"),
            currentTrack: document.getElementsByTagName("tbody")[0].getElementsByTagName("tr")[0],
            currentTrackName: document.getElementById("currentTrackName").getElementsByTagName("span")[0],
            displayCount: document.getElementById("filtered-results"),
            duration: document.getElementById("duration"),
            filter: document.getElementById("filter") as HTMLInputElement,
            filterField: document.getElementsByTagName("select")[0],
            filterType: document.getElementsByTagName("select")[1],
            minimize: document.getElementById("minimize"),
            mute: document.getElementById("mute"),
            player: document.getElementById("player"),
            media: (documentType === "music")
                ? document.createElement("audio")
                : document.createElement("video"),
            playerControls: document.getElementById("player").getElementsByClassName("controls")[0].getElementsByTagName("button"),
            playerSource: document.createElement("source"),
            random: document.getElementById("player").getElementsByClassName("random")[0].getElementsByTagName("input")[0] as HTMLInputElement,
            randomButton: document.getElementById("player").getElementsByClassName("random")[0] as HTMLElement,
            recordsAll: tools.getRecords(-1),
            recordsMedia: tools.getRecords(0),
            recordsWish: tools.getRecords(1),
            seekSlider: document.getElementById("seekSlider"),
            seekTrack: document.getElementById("seekSlider").parentNode as HTMLElement,
            title: document.getElementsByTagName("h1")[0],
            volumeSlider: document.getElementById("volumeSlider"),
            volumeTrack: document.getElementById("volumeSlider").parentNode as HTMLElement,
            wishlist: document.getElementById("wishlist") as HTMLInputElement
        },
        recordLengthAll:number = dom.recordsAll.length,
        recordLengthMedia:number = dom.recordsMedia.length,
        recordLengthWish:number = dom.recordsWish.length;
    let buttonIndex = dom.buttons.length;

    // apply a dynamic marge above the title
    tools.titleTop();

    // iphone styles
    if (navigator.userAgent.toLowerCase().indexOf("iphone") > -1 || navigator.userAgent.toLowerCase().indexOf("ipad") > -1) {
        body.setAttribute("class", `${documentType} iphone`);
    } else {
        // iphone doesn't get volume controls as they make you use the physical volume buttons
        dom.media.volume = playEvents.volume;
    }

    // set media type
    if (documentType === "music") {
        dom.playerSource.type = "audio/mp3";
    } else {
        dom.playerSource.type = "video/mp4";
        dom.player.insertBefore(dom.media, dom.player.firstChild);
    }

    // disable browser media controls
    dom.media.controls = false;

    // do this to ensure track time data populates
    dom.media.setAttribute("preload", "metadata");

    // put the media element into the DOM
    dom.media.appendChild(dom.playerSource);

    // apply any filter on page load if there is text in the filter field
    if (dom.filter.value !== "") {
        list.filter();
    }

    // table header sort buttons
    do {
        buttonIndex = buttonIndex - 1;
        if (dom.buttons[buttonIndex].parentNode.nodeName.toLowerCase() === "th") {
            dom.buttons[buttonIndex].onclick = list.sort;
        }
    } while (buttonIndex > 0);

    // apply a bunch of event handlers
    body.ondblclick = tools.scrollTo;
    dom.filter.onblur = list.filter;
    dom.filter.onkeydown = list.filterKey;
    dom.caseSensitive.onclick = list.filter;
    dom.filterField.onchange = list.filter;
    dom.filterType.onchange = list.filter;
    dom.minimize.onclick = playEvents.minimize;

    // play buttons in the records
    buttonIndex = dom.cellButtons.length;
    do {
        buttonIndex = buttonIndex - 1;
        dom.cellButtons[buttonIndex].onclick = playEvents.playList;
    } while (buttonIndex > 0);

    // sliders
    tools.slider("seek");
    tools.slider("volume");
    dom.volumeSlider.style.left = `${((dom.volumeTrack.clientWidth / 2) - (dom.volumeSlider.clientWidth / 2)) / 16}em`;

    // mute
    dom.mute.onclick = playEvents.mute;
    // previous
    dom.playerControls[0].onclick = playEvents.previous;
    // play
    dom.playerControls[1].onclick = playEvents.playPlayer;
    // pause
    dom.playerControls[2].onclick = playEvents.pause;
    // stop
    dom.playerControls[3].onclick = playEvents.stop;
    // next
    dom.playerControls[4].onclick = playEvents.next;
    // random button
    dom.randomButton.onclick = playEvents.randomToggle;

    // seek skipping
    document.onkeydown = playEvents.timeJump;

    // general media player events
    dom.media.onended = playEvents.next;
    dom.media.ondurationchange = playEvents.durationChange;
    dom.media.onerror = playEvents.error;

    if (dom.wishlist !== null) {
        // toggle movie wishlist
        dom.wishlist.onclick = list.toggle;
    }

    if (dom.random.checked === true) {
        dom.randomButton.setAttribute("class", "random active");
    }

    // set the active track
    tools.setCurrentTrack(dom.currentTrack, false);
}());