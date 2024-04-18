
import { Stats } from "fs";

declare global {

    type directory_item = [string, fileType, string, number, number, directory_data, string];
    type directory_mode = "array" | "hash" | "list" | "read" | "search" | "type";
    type fileType = "directory" | "error" | "file" | "link";
    type hash = "blake2d512" | "blake2s256" | "sha1" | "sha3-224" | "sha3-256" | "sha3-384" | "sha3-512" | "sha384" | "sha512-224" | "sha512-256" | "sha512" | "shake128" | "shake256";
    type searchType = "fragment" | "negation" | "regex";

    /**
     * For directory of terminal/commands/library/directory.
     * ```typescript
     * interface config_command_directory {
     *     callback: (title:string, text:string[], dir:directory_list) => void;
     *     depth: number;
     *     mode: directory_mode;
     *     path: string;
     *     search: string;
     *     startTime: bigint;
     *     symbolic: boolean;
     *     testing: boolean;
     *     type: "movie" | "music" | "television";
     * }
     * type searchType = "fragment" | "negation" | "regex";
     * ``` */
    interface config_command_directory {
        callback: (title:string, text:string[], dir:directory_list) => void;
        depth: number;
        mode: directory_mode;
        path: string;
        search: string;
        startTime: bigint;
        symbolic: boolean;
        testing: boolean;
        type: "movie" | "music" | "television";
    }

    /**
     * For hash of terminal/commands/library/hash.
     * ```typescript
     * interface config_command_hash {
     *     algorithm: hash;
     *     callback: (title:string, hashOutput:hashOutput) => void;
     *     digest: "base64" | "hex";
     *     directInput: boolean;
     *     id: string;
     *     list: boolean;
     *     parent: number;
     *     source: Buffer | string;
     *     stat: directory_data;
     * }
     * type hash = "blake2d512" | "blake2s256" | "sha1" | "sha3-224" | "sha3-256" | "sha3-384" | "sha3-512" | "sha384" | "sha512-224" | "sha512-256" | "sha512" | "shake128" | "shake256";
     * ``` */
    interface config_command_hash {
        algorithm: hash;
        callback: (title:string, hashOutput:hash_output) => void;
        digest: "base64" | "hex";
        directInput: boolean;
        id: string;
        list: boolean;
        parent: number;
        source: Buffer | string;
        stat: directory_data;
    }

    /**
     * For writeStream of terminal/utilities/writeStream
     * ```typescript
     * interface config_writeStream {
     *     callback: (error:NodeJS.ErrnoException) => void;
     *     destination: string;
     *     source: string;
     *     stat: Stats;
     * }
     * ``` */
        interface config_writeStream {
        callback: (error:NodeJS.ErrnoException) => void;
        destination: string;
        source: Buffer | string;
        stat: Stats;
    }

    /**
     * Meta data comprising the fifth index of a *directory_item*.
     * ```typescript
     * interface directory_data {
     *     album: string;
     *     artist: string;
     *     atimeMs: number;
     *     ctimeMs: number;
     *     genre: string;
     *     id3: string;
     *     length: number;
     *     linkPath: string;
     *     linkType: "" | "directory" | "file";
     *     mode: number;
     *     modified: string;
     *     mtimeMs: number;
     *     size: number;
     *     sizeFormatted: string;
     *     title: string;
     *     track: string;
     * }
     * ``` */
    interface directory_data {
        album: string;
        artist: string;
        atimeMs: number;
        ctimeMs: number;
        genre: string;
        id3: string;
        length: number;
        linkPath: string;
        linkType: "" | "directory" | "file";
        mode: number;
        modified: string;
        mtimeMs: number;
        size: number;
        sizeFormatted: string;
        title: string;
        track: string;
    }

    /**
     * The output of command *directory*.
     *
     * directoryItem Schema
     * * 0 - string, Absolute path of the file system artifact at its source
     * * 1 - fileType
     * * 2 - string, hash value, empty string unless fileType is "file" and args.hash === true and be aware this is exceedingly slow on large directory trees
     * * 3 - number, index in parent child items
     * * 4 - number, number of child items
     * * 5 - directoryData, a custom subset of Stats object
     * * 6 - string, written path as determined by utilities/rename.ts
     *
     * - failures - an object property on the array containing a list of read or access failures
     *
     * ```typescript
     * interface directory_list extends Array<directory_item> {
     *     failures?: string[];
     *     [index:number]: directoryItem;
     * }
     * type directory_item = [string, fileType, string, number, number, directory_data, string];
     * type fileType = "directory" | "error" | "file" | "link";
     * ``` */
    interface directory_list extends Array<directory_item> {
        failures?: string[];
        [index:number]: directory_item;
    }

    interface dom {
        buttons: HTMLCollectionOf<HTMLElement>;
        caseSensitive: HTMLInputElement;
        cellButtons: HTMLCollectionOf<HTMLElement>;
        currentTime: HTMLElement;
        currentTrack: HTMLElement;
        currentTrackName: HTMLElement;
        duration: HTMLElement;
        filter: HTMLInputElement;
        media: HTMLMediaElement;
        minimize: HTMLElement;
        mute: HTMLElement;
        player: HTMLElement;
        playerControls: HTMLCollectionOf<HTMLElement>;
        playerSource: HTMLSourceElement;
        random: HTMLInputElement;
        randomButton: HTMLElement;
        recordsAll: HTMLElement[];
        recordsMedia: HTMLElement[];
        recordsWish: HTMLElement[];
        seekSlider: HTMLElement;
        seekTrack: HTMLElement;
        sortSelect: HTMLSelectElement;
        title: HTMLElement;
        volumeSlider: HTMLElement;
        volumeTrack: HTMLElement;
        wishlist: HTMLInputElement;
    }

    /**
     * The output structure of the *hash* command.
     * ```typescript
     * interface hash_output {
     *     filePath: string;
     *     hash: string;
     *     id?: string;
     *     parent?: number;
     *     stat?: directory_data;
     * }
     * ``` */
    interface hash_output {
        filePath: string;
        hash: string;
        id?: string;
        parent?: number;
        stat?: directory_data;
    }

    /**
     * Provides globally available utilities, such as string formatting tools.
     * ```typescript
     * interface module_common {
     *     capitalize  : (input:string) => string;                              // Converts the first character of a string to a capital letter if that first character is a lowercase letter.
     *     commas      : (input:number) => string;                              // Converts a number into a string with commas separating character triplets from the right.
     *     dateFormat  : (date:Date) => string;                                 // Converts a date object into US Army date format.
     *     prettyBytes : (input:number) => string;                              // Converts a number into an abbreviated exponent of 2 describing storage size, example: 2134321 => 2.0MB.
     *     time        : (date:Date) => string;                                 // Produce a formatted time string from a date object.
     * }
     * ``` */
    interface module_common {
        capitalize: (input:string) => string;
        commas: (input:number) => string;
        dateFormat: (date:Date) => string;
        prettyBytes: (input:number) => string;
        time: (date:Date) => string;
    }

    interface storeFlag {
        [key:string]: boolean;
    }

    interface storeNumber {
        [key:string]: number;
    }

    interface storeString {
        [key:string]: string;
    }

}