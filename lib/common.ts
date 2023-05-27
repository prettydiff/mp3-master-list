
const common:module_common = {

    /* capitalizes a string */
    capitalize: function common_capitalize(input:string):string {
        return input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
    },

    /* takes a number returns a string of that number with commas separating segments of 3 digits */
    commas:  function common_commas(input:number):string {
        const str:string = String(input),
            period:number = str.indexOf(".");
        let arr:string[] = [],
            a:number   = (period > -1)
                ? period
                : str.length;
        if (a < 4) {
            return str;
        }
        arr = String(input).split("");
        do {
            a      = a - 3;
            arr[a] = "," + arr[a];
        } while (a > 3);
        return arr.join("");
    },

    /* Converts a date object into US Army date format. */
    dateFormat: function browser_util_dateFormat(date:Date):string {
        const dateData:string[] = [
                date.getFullYear().toString(),
                date.getMonth().toString(),
                date.getDate().toString(),
                date.getHours().toString(),
                date.getMinutes().toString(),
                date.getSeconds().toString(),
                date.getMilliseconds().toString()
            ],
            output:string[] = [];
        let month:string;
        if (dateData[2].length === 1) {
            dateData[2] = `0${dateData[2]}`;
        }
        if (dateData[3].length === 1) {
            dateData[3] = `0${dateData[3]}`;
        }
        if (dateData[4].length === 1) {
            dateData[4] = `0${dateData[4]}`;
        }
        if (dateData[5].length === 1) {
            dateData[5] = `0${dateData[5]}`;
        }
        if (dateData[6].length === 1) {
            dateData[6] = `00${dateData[6]}`;
        } else if (dateData[6].length === 2) {
            dateData[6] = `0${dateData[6]}`;
        }
        if (dateData[1] === "0") {
            month = "JAN";
        } else if (dateData[1] === "1") {
            month = "FEB";
        } else if (dateData[1] === "2") {
            month = "MAR";
        } else if (dateData[1] === "3") {
            month = "APR";
        } else if (dateData[1] === "4") {
            month = "MAY";
        } else if (dateData[1] === "5") {
            month = "JUN";
        } else if (dateData[1] === "6") {
            month = "JUL";
        } else if (dateData[1] === "7") {
            month = "AUG";
        } else if (dateData[1] === "8") {
            month = "SEP";
        } else if (dateData[1] === "9") {
            month = "OCT";
        } else if (dateData[1] === "10") {
            month = "NOV";
        } else if (dateData[1] === "11") {
            month = "DEC";
        }
        output.push(dateData[2]);
        output.push(month);
        output.push(`${dateData[0]},`);
        output.push(`${dateData[3]}:${dateData[4]}:${dateData[5]}.${dateData[6]}`);
        return output.join(" ");
    },

    /* takes a number returns something like 1.2MB for file size */
    prettyBytes: function common_prettyBytes(input:number):string {
        //find the string length of input and divide into triplets
        let output:string = "",
            length:number  = input
                .toString()
                .length;
        const triples:number = (function terminal_common_prettyBytes_triples():number {
                if (length < 22) {
                    return Math.floor((length - 1) / 3);
                }
                //it seems the maximum supported length of integer is 22
                return 8;
            }()),
            //each triplet is worth an exponent of 1024 (2 ^ 10)
            power:number   = (function terminal_common_prettyBytes_power():number {
                let a:number = triples - 1,
                    b:number = 1024;
                if (triples === 0) {
                    return 0;
                }
                if (triples === 1) {
                    return 1024;
                }
                do {
                    b = b * 1024;
                    a = a - 1;
                } while (a > 0);
                return b;
            }()),
            //kilobytes, megabytes, and so forth...
            unit:string[] = [
                "",
                "KiB",
                "MiB",
                "GiB",
                "TiB",
                "PiB",
                "EiB",
                "ZiB",
                "YiB"
            ];
    
        if (typeof input !== "number" || Number.isNaN(input) === true || input < 0 || input % 1 > 0) {
            //input not a positive integer
            output = "0B";
        } else if (triples === 0) {
            //input less than 1000
            output = `${input}B`;
        } else {
            //for input greater than 999
            length = Math.floor((input / power) * 100) / 100;
            output = length.toFixed(1) + unit[triples];
        }
        return output;
    },

    /* produce a time string from a date object */
    time: function common_time(date:Date):string {
        const hours:string = date.getHours().toString(),
            minutes:string = date.getMinutes().toString(),
            seconds:string = date.getSeconds().toString(),
            pad = function browser_util_time_pad(input:string):string {
                if (input.length === 1) {
                    return `0${input}`;
                }
                return input;
            };
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }

};

export default common;