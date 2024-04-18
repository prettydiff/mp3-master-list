
(function () {
    const type:"movie"|"music"|"television" = document.getElementsByTagName("body")[0].getAttribute("class") as "movie"|"music"|"television",
        trackList:HTMLElement[] = [],
        list = {
            filter: function ():void {
                const caseSensitive:boolean = dom.caseSensitive.checked,
                    value:string = (caseSensitive === true)
                        ? dom.filter.value
                        : dom.filter.value.toLowerCase(),
                    select:HTMLSelectElement = dom.sortSelect;
                let index:number = 0,
                    displayIndex:number = 0;
                if (select.selectedIndex === 0) {
                    do {
                        if ((caseSensitive === true && dom.recordsAll[index].innerHTML.includes(value) === true) || (caseSensitive === false && dom.recordsAll[index].innerHTML.toLowerCase().includes(value) === true)) {
                            dom.recordsAll[index].setAttribute("class", (displayIndex % 2 === 0) ? "even" : "odd");
                            dom.recordsAll[index].style.display = "table-row";
                            displayIndex = displayIndex + 1;
                        } else {
                            dom.recordsAll[index].style.display = "none";
                        }
                        index = index + 1;
                    } while (index < recordLengthAll);
                } else {
                    const headingIndex:number = select.selectedIndex - 1;
                    do {
                        if ((caseSensitive === true && dom.recordsAll[index].getElementsByTagName("td")[headingIndex].firstChild.textContent.includes(value) === true) || (caseSensitive === false && dom.recordsAll[index].getElementsByTagName("td")[headingIndex].firstChild.textContent.toLowerCase().includes(value) === true)) {
                            dom.recordsAll[index].setAttribute("class", (displayIndex % 2 === 0) ? "even" : "odd");
                            dom.recordsAll[index].style.display = "table-row";
                            displayIndex = displayIndex + 1;
                        } else {
                            dom.recordsAll[index].style.display = "none";
                        }
                        index = index + 1;
                    } while (index < recordLengthAll);
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
                let displayIndex:number = 0,
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
                        records[thIndex].setAttribute("class", (displayIndex % 2 === 0) ? "even" : "odd");
                        displayIndex = displayIndex + 1;
                    }
                    tbody.appendChild(records[thIndex]);
                    thIndex = thIndex + 1;
                } while (thIndex < recordsLength);
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
                        if (tbody === undefined) {
                            return;
                        }
                        do {
                            output.push(tr[index]);
                            index = index + 1;
                        } while (index < trLen);
                    };
                if (tableIndex === -1) {
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
                return Math.floor((window.crypto.getRandomValues(new Uint32Array(1))[0] / 1e10) * recordLengthMedia);
            },
            setCurrentTrack: function (tr:HTMLElement, play:boolean):void {
                const td:HTMLCollectionOf<HTMLElement> = tr.getElementsByTagName("td");
                dom.currentTrack.getElementsByTagName("button")[0].removeAttribute("class");
                dom.currentTrack.removeAttribute("id");
                dom.currentTrack = tr;
                dom.currentTrack.setAttribute("id", "currentTrack");
                if (type === "music") {
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
            duration: document.getElementById("duration"),
            filter: document.getElementById("filter") as HTMLInputElement,
            minimize: document.getElementById("minimize"),
            mute: document.getElementById("mute"),
            player: document.getElementById("player"),
            media: (type === "music")
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
            sortSelect: document.getElementsByTagName("select")[0],
            title: document.getElementsByTagName("h1")[0],
            volumeSlider: document.getElementById("volumeSlider"),
            volumeTrack: document.getElementById("volumeSlider").parentNode as HTMLElement,
            wishlist: document.getElementById("wishlist") as HTMLInputElement
        },
        recordLengthAll:number = dom.recordsAll.length,
        recordLengthMedia:number = dom.recordsMedia.length,
        recordLengthWish:number = dom.recordsWish.length;
    let index = dom.buttons.length;

    // iphone styles
    if (navigator.userAgent.toLowerCase().indexOf("iphone") > -1) {
        document.getElementsByTagName("body")[0].setAttribute("class", `${type} iphone`);
    } else {
        // iphone doesn't get volume controls as they make you use the physical volume buttons
        dom.media.volume = playEvents.volume;
    }

    // set media type
    if (type === "music") {
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

    // apply a dynamic marge above the title
    tools.titleTop();

    // apply any filter on page load if there is text in the filter field
    if (dom.filter.value !== "") {
        list.filter();
    }

    // table header sort buttons
    do {
        index = index - 1;
        if (dom.buttons[index].parentNode.nodeName.toLowerCase() === "th") {
            dom.buttons[index].onclick = list.sort;
        }
    } while (index > 0);

    // apply a bunch of event handlers
    dom.filter.onblur = list.filter;
    dom.caseSensitive.onclick = list.filter;
    dom.sortSelect.onchange = list.filter;
    dom.minimize.onclick = playEvents.minimize;
    index = dom.cellButtons.length;
    do {
        index = index - 1;
        dom.cellButtons[index].onclick = playEvents.playList;
    } while (index > 0);
    // seek
    dom.seekTrack.onclick = playEvents.slider;
    dom.seekSlider.onmousedown = playEvents.slider;
    // volume
    dom.volumeTrack.onclick = playEvents.slider;
    dom.volumeSlider.onmousedown = playEvents.slider;
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

    // set the active track
    tools.setCurrentTrack(dom.currentTrack, false);
}());