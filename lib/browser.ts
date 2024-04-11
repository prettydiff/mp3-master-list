
(function () {
    const type:"movie"|"music" = document.getElementsByTagName("body")[0].getAttribute("data-type") as "movie"|"music",
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
            player: (type === "music")
                ? document.createElement("audio")
                : document.createElement("video"),
            playerControls: document.getElementById("player").getElementsByClassName("controls")[0].getElementsByTagName("button"),
            random: document.getElementById("player").getElementsByClassName("random")[0].getElementsByTagName("input")[0] as HTMLInputElement,
            randomButton: document.getElementById("player").getElementsByClassName("random")[0] as HTMLElement,
            records: (function ():HTMLElement[] {
                const output:HTMLElement[] = [],
                    populate = function (tableIndex:number):void {
                        const tr:HTMLCollectionOf<HTMLElement> = document.getElementsByTagName("tbody")[tableIndex].getElementsByTagName("tr"),
                            trLen:number = tr.length;
                        let index:number = 0;
                        do {
                            output.push(tr[index]);
                            index = index + 1;
                        } while (index < trLen);
                    };
                populate(0);
                if (document.getElementsByTagName("table").length > 1) {
                    populate(1);
                }
                return output;
            }()),
            seekSlider: document.getElementById("seekSlider"),
            seekTrack: document.getElementById("seekSlider").parentNode as HTMLElement,
            sortSelect: document.getElementsByTagName("select")[0],
            volumeSlider: document.getElementById("volumeSlider"),
            volumeTrack: document.getElementById("volumeSlider").parentNode as HTMLElement,
            wishlist: document.getElementById("wishlist") as HTMLInputElement
        },
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
                        if ((caseSensitive === true && dom.records[index].innerHTML.includes(value) === true) || (caseSensitive === false && dom.records[index].innerHTML.toLowerCase().includes(value) === true)) {
                            dom.records[index].setAttribute("class", (displayIndex % 2 === 0) ? "even" : "odd");
                            dom.records[index].style.display = "table-row";
                            displayIndex = displayIndex + 1;
                        } else {
                            dom.records[index].style.display = "none";
                        }
                        index = index + 1;
                    } while (index < recordLength);
                } else {
                    const headingIndex:number = select.selectedIndex - 1;
                    do {
                        if ((caseSensitive === true && dom.records[index].getElementsByTagName("td")[headingIndex].firstChild.textContent.includes(value) === true) || (caseSensitive === false && dom.records[index].getElementsByTagName("td")[headingIndex].firstChild.textContent.toLowerCase().includes(value) === true)) {
                            dom.records[index].setAttribute("class", (displayIndex % 2 === 0) ? "even" : "odd");
                            dom.records[index].style.display = "table-row";
                            displayIndex = displayIndex + 1;
                        } else {
                            dom.records[index].style.display = "none";
                        }
                        index = index + 1;
                    } while (index < recordLength);
                }
            },
            sort: function (event:MouseEvent):void {
                const target:HTMLElement = event.target as HTMLElement,
                    direction:string = target.getAttribute("data-direction"),
                    th:HTMLCollectionOf<HTMLElement> = document.getElementsByTagName("thead")[0].getElementsByTagName("th"),
                    tbody:HTMLElement = document.getElementsByTagName("tbody")[0];
                let thIndex:number = th.length,
                    displayIndex:number = 0,
                    label:string = "";
                do {
                    thIndex = thIndex - 1;
                } while (thIndex > 0 && th[thIndex] !== target.parentNode);
                label = th[thIndex].firstChild.textContent.trim();
                dom.records.sort(function (a, b) {
                    const numeric:boolean = (label === "File Size" || label === "Modified"),
                        tda = (numeric === true)
                            ? a.getElementsByTagName("td")[thIndex].getAttribute("data-numeric")
                            : a.getElementsByTagName("td")[thIndex].firstChild.textContent,
                        tdb = (numeric === true)
                            ? b.getElementsByTagName("td")[thIndex].getAttribute("data-numeric")
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
                    if (dom.records[thIndex].style.display !== "none") {
                        dom.records[thIndex].setAttribute("class", (displayIndex % 2 === 0) ? "even" : "odd");
                        displayIndex = displayIndex + 1;
                    }
                    tbody.appendChild(dom.records[thIndex]);
                    thIndex = thIndex + 1;
                } while (thIndex < recordLength);
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
            durationChange: function () {
                dom.duration.innerHTML = tools.humanTime(dom.player.duration);
            },
            minimize: function (event:MouseEvent) {
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
                    player.style.height = "3.5em";
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
                    dom.player.volume = 0;
                } else {
                    input.checked = true;
                    target.setAttribute("class", "active");
                    dom.player.volume = playEvents.volume;
                }
            },
            next: function ():void {
                let nextElement:HTMLElement = (dom.random.checked === true)
                    ? document.getElementsByTagName("tbody")[0].getElementsByTagName("tr")[Math.floor(recordLength * Math.random())]
                    : dom.currentTrack;
                do {
                    nextElement = nextElement.nextElementSibling as HTMLElement;
                    if (nextElement === null) {
                        nextElement = document.getElementsByTagName("tbody")[0].getElementsByTagName("tr")[0];
                    }
                    if (nextElement.getAttribute("id") === "currentTrack") {
                        return;
                    }
                } while (nextElement.style.display === "none");
                tools.setCurrentTrack(nextElement, true);
                playEvents.buttonPlayerActive(dom.playerControls[1]);
            },
            pause: function (event:MouseEvent):void {
                dom.player.pause();
                playEvents.playing = false;
                playEvents.buttonPlayerActive(event.target as HTMLElement);
                dom.currentTrack.getElementsByTagName("button")[0].removeAttribute("class");
            },
            play: function ():void {
                dom.player.play();
                playEvents.playing = true;
                setTimeout(tools.currentTime, 50);
            },
            playList: function (event:MouseEvent):void {
                const target:HTMLElement = event.target as HTMLElement;
                tools.setCurrentTrack(tools.ancestor(target, "tr"), true);
                playEvents.buttonPlayerActive(dom.playerControls[1]);
            },
            playPlayer: function (event:MouseEvent) {
                if (playEvents.playing === true) {
                    dom.player.currentTime = 0;
                }
                playEvents.play();
                playEvents.buttonPlayerActive(event.target as HTMLElement);
                dom.currentTrack.getElementsByTagName("button")[0].setAttribute("class", "active");
            },
            playing: false,
            previous: function () {
                let previousElement:HTMLElement = (dom.random.checked === true)
                    ? document.getElementsByTagName("tbody")[0].getElementsByTagName("tr")[Math.floor(recordLength * Math.random())]
                    : dom.currentTrack;
                dom.currentTrack.getElementsByTagName("button")[0].removeAttribute("class");
                do {
                    previousElement = previousElement.previousElementSibling as HTMLElement;
                    if (previousElement === null) {
                        previousElement = document.getElementsByTagName("tbody")[0].getElementsByTagName("tr")[recordLength - 1];
                    }
                    if (previousElement.getAttribute("id") === "currentTrack") {
                        return;
                    }
                } while (previousElement.style.display === "none");
                tools.setCurrentTrack(previousElement, true);
                playEvents.buttonPlayerActive(dom.playerControls[1]);
            },
            random: function (event:MouseEvent) {
                const target:HTMLElement = tools.ancestor(event.target as HTMLElement, "button");
                if (dom.random.checked === true) {
                    dom.random.checked = false;
                    target.setAttribute("class", "random");
                } else {
                    dom.random.checked = true;
                    target.setAttribute("class", "random active");
                }
            },
            slider: function (event:MouseEvent|TouchEvent) {
                const eventType:string = event.type,
                    touch:boolean = (event !== null && eventType === "touchstart"),
                    target:HTMLElement = event.target as HTMLElement,
                    button:HTMLElement = (eventType === "click")
                        ? target.getElementsByTagName("button")[0]
                        : tools.ancestor(target, "button"),
                    type:"seek"|"volume" = (button === dom.seekSlider)
                        ? "seek"
                        : "volume",
                    parentName:"p"|"span" = (type === "seek")
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
                            if (type === "seek") {
                                dom.player.currentTime = (x / (max - min)) * dom.player.duration;
                            } else {
                                playEvents.volume = x / (max - min);
                                dom.player.volume = playEvents.volume;
                            }
                        }
                    };
                if (eventType === "click") {
                    move(event);
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
            stop: function (event:MouseEvent) {
                playEvents.pause(event);
                dom.player.currentTime = 0;
                dom.currentTime.innerHTML = "00:00:00";
                dom.seekSlider.style.left = "0";
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
                dom.currentTime.innerHTML = tools.humanTime(dom.player.currentTime);
                dom.seekSlider.style.left = `${((dom.player.currentTime / dom.player.duration) * 100).toFixed(2)}%`;
                if (playEvents.playing === true) {
                    setTimeout(tools.currentTime, 50);
                }
            },
            humanTime: function (input:number) {
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
            setCurrentTrack: function (tr:HTMLElement, play:boolean):void {
                const td:HTMLCollectionOf<HTMLElement> = tr.getElementsByTagName("td");
                dom.currentTrack.getElementsByTagName("button")[0].removeAttribute("class");
                dom.currentTrack.removeAttribute("id");
                dom.currentTrack = tr;
                dom.currentTrack.setAttribute("id", "currentTrack");
                dom.currentTrackName.innerHTML = `<strong>${td[4].innerHTML}</strong> by <em>${td[2].innerHTML}</em>`;
                dom.player.src = tr.getAttribute("data-path");
                dom.player.load();
                if (play === true) {
                    playEvents.play();
                    dom.currentTrack.getElementsByTagName("button")[0].setAttribute("class", "active");
                }
            }
        },
        recordLength:number = dom.records.length;
    let index = dom.buttons.length;
    if (dom.filter.value !== "") {
        list.filter();
    }
    dom.player.setAttribute("preload", "metadata");
    do {
        index = index - 1;
        if (dom.buttons[index].parentNode.nodeName.toLowerCase() === "th") {
            dom.buttons[index].onclick = list.sort;
        }
    } while (index > 0);
    dom.filter.onblur = list.filter;
    dom.caseSensitive.onclick = list.filter;
    dom.sortSelect.onchange = list.filter;
    dom.minimize.onclick = playEvents.minimize;
    dom.player.volume = playEvents.volume;
    if (type === "music") {
        tools.setCurrentTrack(dom.currentTrack, false);
        index = dom.cellButtons.length;
        do {
            index = index - 1;
            dom.cellButtons[index].onclick = playEvents.playList;
        } while (index > 0);
        dom.mute.onclick = playEvents.mute;
        dom.seekTrack.onclick = playEvents.slider;
        dom.volumeTrack.onclick = playEvents.slider;
        dom.seekSlider.onmousedown = playEvents.slider;
        dom.volumeSlider.onmousedown = playEvents.slider;
        dom.volumeSlider.style.left = `${((dom.volumeTrack.clientWidth / 2) - (dom.volumeSlider.clientWidth / 2)) / 16}em`;
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
        //svgControls[5].onclick = previous;
        //svgControls[6].onclick = previous;
        dom.player.onended = playEvents.next;
        dom.player.ondurationchange = playEvents.durationChange;
        dom.randomButton.onclick = playEvents.random;
        if (window.innerWidth < 800) {
            let player:HTMLElement = dom.currentTime.parentNode as HTMLElement;
            player.style.width = "100%";
        }
    } else {
        if (dom.wishlist !== null) {
            // toggle movie wishlist
            dom.wishlist.onclick = list.toggle;
        }
    }
}());