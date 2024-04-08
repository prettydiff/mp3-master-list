
(function () {
    const audio = document.getElementsByTagName("audio")[0],
        sort = function (event:MouseEvent):void {
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
            records.sort(function (a, b) {
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
                if (records[thIndex].style.display !== "none") {
                    records[thIndex].setAttribute("class", (displayIndex % 2 === 0) ? "even" : "odd");
                    displayIndex = displayIndex + 1;
                }
                tbody.appendChild(records[thIndex]);
                thIndex = thIndex + 1;
            } while (thIndex < recordLength);
            if (direction === "descend") {
                target.setAttribute("data-direction", "ascend");
            } else {
                target.setAttribute("data-direction", "descend");
            }
        },
        filter = function ():void {
            const textInput:HTMLInputElement = document.getElementsByTagName("input")[0],
                caseSensitive:boolean = document.getElementsByTagName("input")[1].checked,
                value:string = (caseSensitive === true)
                    ? textInput.value
                    : textInput.value.toLowerCase(),
                select:HTMLSelectElement = document.getElementsByTagName("select")[0];
            let index:number = 0,
                displayIndex:number = 0;
            if (select.selectedIndex === 0) {
                do {
                    if ((caseSensitive === true && records[index].innerHTML.includes(value) === true) || (caseSensitive === false && records[index].innerHTML.toLowerCase().includes(value) === true)) {
                        records[index].setAttribute("class", (displayIndex % 2 === 0) ? "even" : "odd");
                        records[index].style.display = "table-row";
                        displayIndex = displayIndex + 1;
                    } else {
                        records[index].style.display = "none";
                    }
                    index = index + 1;
                } while (index < recordLength);
            } else {
                const headingIndex:number = select.selectedIndex - 1;
                do {
                    if ((caseSensitive === true && records[index].getElementsByTagName("td")[headingIndex].firstChild.textContent.includes(value) === true) || (caseSensitive === false && records[index].getElementsByTagName("td")[headingIndex].firstChild.textContent.toLowerCase().includes(value) === true)) {
                        records[index].setAttribute("class", (displayIndex % 2 === 0) ? "even" : "odd");
                        records[index].style.display = "table-row";
                        displayIndex = displayIndex + 1;
                    } else {
                        records[index].style.display = "none";
                    }
                    index = index + 1;
                } while (index < recordLength);
            }
        },
        toggle = function ():void {
            const table:HTMLElement = document.getElementsByTagName("table")[1],
                h2:HTMLElement = document.getElementsByTagName("h2")[0];
            if (table === undefined) {
                return;
            }
            if (inputs[2].checked === true) {
                table.style.display = "table";
                h2.style.display = "block";
            } else {
                table.style.display = "none";
                h2.style.display = "none";
            }
        },
        setCurrentTrack = function (tr:HTMLElement, play:boolean):void {
            let td:HTMLCollectionOf<HTMLElement> = null;
            currentTrack.removeAttribute("id");
            currentTrack = tr;
            currentTrack.setAttribute("id", "currentTrack");
            td = tr.getElementsByTagName("td");
            currentTrackName.innerHTML = `Current selected track is <strong>${td[4].innerHTML}</strong> by <em>${td[2].innerHTML}</em>.`;
            audio.src = tr.getAttribute("data-path");
            audio.load();
            if (play === true) {
                audio.play();
            }
        },
        play = function (event:MouseEvent):void {
            const target:HTMLElement = event.target as HTMLElement;
            setCurrentTrack(target.parentNode.parentNode as HTMLElement, true);
        },
        previous = function () {
            let previousElement:HTMLElement = currentTrack;
            do {
                previousElement = previousElement.previousElementSibling as HTMLElement;
                if (previousElement === null) {
                    previousElement = document.getElementsByTagName("tbody")[0].getElementsByTagName("tr")[recordLength - 1];
                }
                if (previousElement.getAttribute("id") === "currentTrack") {
                    return;
                }
            } while (previousElement.style.display === "none");
            setCurrentTrack(previousElement, true);
        },
        next = function ():void {
            let nextElement:HTMLElement = currentTrack;
            do {
                nextElement = nextElement.nextElementSibling as HTMLElement;
                if (nextElement === null) {
                    nextElement = document.getElementsByTagName("tbody")[0].getElementsByTagName("tr")[0];
                }
                if (nextElement.getAttribute("id") === "currentTrack") {
                    return;
                }
            } while (nextElement.style.display === "none");
            setCurrentTrack(nextElement, true);
        },
        buttons:HTMLCollectionOf<HTMLButtonElement> = document.getElementsByTagName("button"),
        records:HTMLElement[] = (function ():HTMLElement[] {
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
        currentTrackName:HTMLElement = document.getElementById("currentTrackName"),
        recordLength:number = records.length,
        inputs:HTMLCollectionOf<HTMLInputElement> = document.getElementsByTagName("input"),
        cellButtons:HTMLCollectionOf<HTMLElement> = document.getElementsByTagName("tbody")[0].getElementsByTagName("button");
    window.onerror = function (event) {
        alert(JSON.stringify(event));
    };
    let index = buttons.length,
        currentTrack:HTMLElement = document.getElementsByTagName("tbody")[0].getElementsByTagName("tr")[0];
    do {
        index = index - 1;
        if (buttons[index].parentNode.nodeName.toLowerCase() === "th") {
            buttons[index].onclick = sort;
        }
    } while (index > 0);
    inputs[0].onblur = filter;
    inputs[1].onclick = filter;
    if (audio !== null) {
        index = cellButtons.length;
        do {
            index = index - 1;
            cellButtons[index].onclick = play;
        } while (index > 0);
        audio.onended = next;
        audio.onerror = function (event) {
            alert(JSON.stringify(event));
        };
        setCurrentTrack(currentTrack, false);
    } else {
        if (inputs[2] !== undefined) {
            // toggle movie wishlist
            inputs[2].onclick = toggle;
        }
    }
    document.getElementsByTagName("select")[0].onchange = filter;
}());