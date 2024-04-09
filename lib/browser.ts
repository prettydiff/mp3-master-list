
(function () {
    const type:"movie"|"music" = document.getElementsByTagName("body")[0].getAttribute("data-type") as "movie"|"music",
        dom:dom = {
            buttons: document.getElementsByTagName("button"),
            cellButtons: document.getElementsByTagName("tbody")[0].getElementsByTagName("button"),
            currentTime: document.getElementById("currentTime"),
            currentTrack: document.getElementsByTagName("tbody")[0].getElementsByTagName("tr")[0],
            currentTrackName: document.getElementById("currentTrackName"),
            duration: document.getElementById("duration"),
            inputs: document.getElementsByTagName("input"),
            player: (type === "music")
                ? document.createElement("audio")
                : document.createElement("video"),
            random: document.getElementById("random") as HTMLInputElement,
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
            sortSelect: document.getElementsByTagName("select")[0],
            svgControls: document.getElementById("player").getElementsByClassName("controls")[0].getElementsByTagName("svg"),
            wishlist: document.getElementById("wishlist") as HTMLInputElement
        },
        list = {
            filter: function ():void {
                const textInput:HTMLInputElement = dom.inputs[0],
                    caseSensitive:boolean = dom.inputs[1].checked,
                    value:string = (caseSensitive === true)
                        ? textInput.value
                        : textInput.value.toLowerCase(),
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
            durationChange: function () {
                dom.duration.innerHTML = tools.humanTime(dom.player.duration);
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
            },
            pause: function ():void {
                dom.player.pause();
                playEvents.playing = false;
            },
            play: function ():void {
                dom.player.play();
                playEvents.playing = true;
                setTimeout(tools.currentTime, 50);
            },
            playList: function (event:MouseEvent):void {
                const target:HTMLElement = event.target as HTMLElement;
                tools.setCurrentTrack(tools.ancestor(target, "tr"), true);
            },
            playPlayer: function () {
                if (playEvents.playing === true) {
                    dom.player.currentTime = 0;
                }
                playEvents.play();
            },
            playing: false,
            previous: function () {
                let previousElement:HTMLElement = (dom.random.checked === true)
                    ? document.getElementsByTagName("tbody")[0].getElementsByTagName("tr")[Math.floor(recordLength * Math.random())]
                    : dom.currentTrack;
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
            },
            seekDown: function (event:MouseEvent|TouchEvent) {
                const touch:boolean = (event !== null && event.type === "touchstart"),
                    target:HTMLElement = tools.ancestor(event.target as HTMLElement, "button"),
                    parent:HTMLElement = tools.ancestor(target as HTMLElement, "p"),
                    targetWidth:number = target.clientWidth,
                    max:number = (parent.clientWidth + 2) - targetWidth,
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
                            x:number = clientX - (targetWidth * 2);
                        if (x - 1 > min && x + 1 < max) {
                            target.style.left = `${(x / 16).toFixed(2)}em`;
                            dom.player.currentTime = (x / (max - min)) * dom.player.duration;
                        }
                    };
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
            },
            stop: function () {
                playEvents.pause();
                dom.player.currentTime = 0;
                dom.currentTime.innerHTML = "00:00:00";
                dom.seekSlider.style.left = "0";
            }
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
                dom.currentTrack.removeAttribute("id");
                dom.currentTrack = tr;
                dom.currentTrack.setAttribute("id", "currentTrack");
                dom.currentTrackName.innerHTML = `<strong>${td[4].innerHTML}</strong> by <em>${td[2].innerHTML}</em>`;
                dom.player.src = tr.getAttribute("data-path");
                dom.player.load();
                if (play === true) {
                    playEvents.play();
                }
            }
        },
        recordLength:number = dom.records.length;
    let index = dom.buttons.length;
    if (dom.inputs[0].value !== "") {
        list.filter();
    }
    dom.player.setAttribute("preload", "metadata");
    do {
        index = index - 1;
        if (dom.buttons[index].parentNode.nodeName.toLowerCase() === "th") {
            dom.buttons[index].onclick = list.sort;
        }
    } while (index > 0);
    dom.inputs[0].onblur = list.filter;
    dom.inputs[1].onclick = list.filter;
    dom.sortSelect.onchange = list.filter;
    if (type === "music") {
        tools.setCurrentTrack(dom.currentTrack, false);
        index = dom.cellButtons.length;
        do {
            index = index - 1;
            dom.cellButtons[index].onclick = playEvents.playList;
        } while (index > 0);
        dom.seekSlider.onmousedown = playEvents.seekDown;
        // previous
        dom.svgControls[0].onclick = playEvents.previous;
        // play
        dom.svgControls[1].onclick = playEvents.playPlayer;
        // pause
        dom.svgControls[2].onclick = playEvents.pause;
        // stop
        dom.svgControls[3].onclick = playEvents.stop;
        // next
        dom.svgControls[4].onclick = playEvents.next;
        //svgControls[5].onclick = previous;
        //svgControls[6].onclick = previous;
        dom.player.onended = playEvents.next;
        dom.player.ondurationchange = playEvents.durationChange;
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