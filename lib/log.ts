
import text from "./text.ts";

// verbose metadata printed to the shell about the application
const log = function terminal_utilities_log(output:string[], end?:boolean):void {
    const logger:(input:string) => void = function terminal_utilities_log_logger(input:string):void {
            // eslint-disable-next-line
            console.log(input);
        };
    if (output[output.length - 1] === "") {
        output.pop();
    }
    output.forEach(function terminal_utilities_log_each(value:string) {
        logger(value);
    });
};

log.title = function terminal_utilities_log_title(message:string):void {
    const formatted:string = `${text.cyan + text.bold + text.underline + message + text.none}`;
    log(["", "", formatted, "", ""]);
};

export default log;
