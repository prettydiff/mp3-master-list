
import { Stats } from "fs";

declare global {

    type directory_item = [string, fileType, string, number, number, directory_data, string];
    type directory_mode = "array" | "hash" | "list" | "read" | "search" | "type";
    type fileType = "directory" | "error" | "file" | "link";
    type hash = "blake2d512" | "blake2s256" | "sha1" | "sha3-224" | "sha3-256" | "sha3-384" | "sha3-512" | "sha384" | "sha512-224" | "sha512-256" | "sha512" | "shake128" | "shake256";
    type mediaType = "movie"|"music"|"television" ;
    type searchType = "fragment" | "list" | "negation" | "negation-list" | "regex";

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
        bodyDiv: HTMLElement;
        buttons: HTMLCollectionOf<HTMLElement>;
        caseSensitive: HTMLInputElement;
        cellButtons: HTMLCollectionOf<HTMLElement>;
        colors: NodeListOf<HTMLInputElement>;
        currentTime: HTMLElement;
        currentTrack: HTMLElement;
        currentTrackName: HTMLElement;
        displayCount: HTMLElement;
        duration: HTMLElement;
        filter: HTMLInputElement;
        filterField: HTMLSelectElement;
        filterType: HTMLSelectElement;
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

    interface Tags {
        /**
         * The 'Album/Movie/Show title' frame is intended for the title of the recording(/source of sound) which the audio in the file is taken from.
         */
        album?: string,
        /**
         * The 'BPM' frame contains the number of beats per minute in the mainpart of the audio. The BPM is an integer and represented as a numerical string.
         */
        bpm?: string,
        /**
         *  The 'Composer(s)' frame is intended for the name of the composer(s). They are seperated with the "/" character.
         */
        composer?: string,
        /**
         * The 'Content type', which previously was stored as a one byte numeric value only, is now a numeric string. You may use one or several of the types as ID3v1.1 did or, since the category list would be impossible to maintain with accurate and up to date categories, define your own.
         *
         * References to the ID3v1 genres can be made by, as first byte, enter "(" followed by a number from the genres list (appendix A) and ended with a ")" character. This is optionally followed by a refinement, e.g. "(21)" or "(4)Eurodisco". Several references can be made in the same frame, e.g. "(51)(39)". If the refinement should begin with a "(" character it should be replaced with "((", e.g. "((I can figure out any genre)" or "(55)((I think...)"
         */
        genre?: string,
        /**
         * The 'Copyright message' frame, which must begin with a year and a space character (making five characters), is intended for the copyright holder of the original sound, not the audio file itself. The absence of this frame means only that the copyright information is unavailable or has been removed, and must not be interpreted to mean that the sound is public domain. Every time this field is displayed the field must be preceded with "Copyright © ".
         */
        copyright?: string,
        /**
         * The 'Encoding time' frame contains a timestamp describing when the
         audio was encoded. Valid timestamps are yyyy, yyyy-MM, yyyy-MM-dd, yyyy-MM-ddTHH, yyyy-MM-ddTHH:mm and yyyy-MM-ddTHH:mm:ss.
        */
        encodingTime?: string,
        /**
         * The 'Date' frame is a numeric string in the DDMM format containing the date for the recording. This field is always four characters long.
         */
        date?: string,
        /**
         * The 'Playlist delay' defines the numbers of milliseconds of silence between every song in a playlist. The player should use the "ETC" frame, if present, to skip initial silence and silence at the end of the audio to match the 'Playlist delay' time. The time is represented as a numeric string.
         */
        playlistDelay?: string,
        /**
         * The 'Original release time' frame contains a timestamp describing when the original recording of the audio was released. Valid timestamps are yyyy, yyyy-MM, yyyy-MM-dd, yyyy-MM-ddTHH, yyyy-MM-ddTHH:mm and yyyy-MM-ddTHH:mm:ss.
         */
        originalReleaseTime?: string,
        /**
         * The 'Recording time' frame contains a timestamp describing when the audio was recorded. Valid timestamps are yyyy, yyyy-MM, yyyy-MM-dd, yyyy-MM-ddTHH, yyyy-MM-ddTHH:mm and yyyy-MM-ddTHH:mm:ss.
         */
        recordingTime?: string,
        /**
         * The 'Release time' frame contains a timestamp describing when the audio was first released. Valid timestamps are yyyy, yyyy-MM, yyyy-MM-dd, yyyy-MM-ddTHH, yyyy-MM-ddTHH:mm and yyyy-MM-ddTHH:mm:ss.
         */
        releaseTime?: string,
        /**
         * The 'Tagging time' frame contains a timestamp describing then the audio was tagged. Valid timestamps are yyyy, yyyy-MM, yyyy-MM-dd, yyyy-MM-ddTHH, yyyy-MM-ddTHH:mm and yyyy-MM-ddTHH:mm:ss.
         */
        taggingTime?: string,
        /**
         * The 'Encoded by' frame contains the name of the person or organisation that encoded the audio file. This field may contain a copyright message, if the audio file also is copyrighted by the encoder.
         */
        encodedBy?: string,
        /**
         * The 'Lyricist(s)/Text writer(s)' frame is intended for the writer(s) of the text or lyrics in the recording. They are seperated with the "/" character.
         */
        textWriter?: string,
        /**
         * The 'File type' frame indicates which type of audio this tag defines. The following type and refinements are defined:
         *
         * MPG       MPEG Audio
         * /1        MPEG 1/2 layer I
         * /2        MPEG 1/2 layer II
         * /3        MPEG 1/2 layer III
         * /2.5      MPEG 2.5
         *  /AAC     Advanced audio compression
         * VQF       Transform-domain Weighted Interleave Vector Quantization
         * PCM       Pulse Code Modulated audio
         *
         * but other types may be used, not for these types though. This is used in a similar way to the predefined types in the "Media type" frame, but without parentheses. If this frame is not present audio type is assumed to be "MPG".
         */
        fileType?: string,
        /**
         * The 'Involved people list' is very similar to the musician credits list, but maps between functions, like producer, and names.
         */
        involvedPeopleList?: string,
        /**
         * The 'Time' frame is a numeric string in the HHMM format containing the time for the recording. This field is always four characters long.
         */
        time?: string,
        /**
         * The 'Content group description' frame is used if the sound belongs to a larger category of sounds/music. For example, classical music is often sorted in different musical sections (e.g. "Piano Concerto", "Weather - Hurricane").
         */
        contentGroup?: string,
        /**
         * The 'Title/Songname/Content description' frame is the actual name of the piece (e.g. "Adagio", "Hurricane Donna").
         */
        title?: string,
        /**
         * The 'Subtitle/Description refinement' frame is used for information directly related to the contents title (e.g. "Op. 16" or "Performed live at Wembley").
         */
        subtitle?: string,
        /**
         * The 'Initial key' frame contains the musical key in which the sound starts. It is represented as a string with a maximum length of three characters. The ground keys are represented with "A","B","C","D","E", "F" and "G" and halfkeys represented with "b" and "#". Minor is represented as "m". Example "Cbm". Off key is represented with an "o" only.
         */
        initialKey?: string,
        /**
         * The 'Language(s)' frame should contain the languages of the text or lyrics spoken or sung in the audio. The language is represented with three characters according to ISO-639-2. If more than one language is used in the text their language codes should follow according to their usage.
         */
        language?: string,
        /**
         * The 'Length' frame contains the length of the audiofile in milliseconds, represented as a numeric string.
         */
        length?: string,
        /**
         * The 'Musician credits list' is intended as a mapping between instruments and the musician that played it. Every odd field is an instrument and every even is an artist or a comma delimited list of artists.
         */
        musicianCreditsList?: string,
        /**
         * The 'Media type' frame describes from which media the sound originated. This may be a text string or a reference to the predefined media types found in the list below. References are made within "(" and ")" and are optionally followed by a text refinement, e.g. "(MC) with four channels". If a text refinement should begin with a "(" character it should be replaced with "((". Predefined refinements is appended after the media type, e.g. "(CD/A)" or "(VID/PAL/VHS)".
         *
         *DIG     Other digital media
        *    /A  Analog transfer from media
        *
        *ANA     Other analog media
        *   /WAC Wax cylinder
        *   /8CA 8-track tape cassette
        *
        *CD      CD
        *     /A Analog transfer from media
        *    /DD DDD
        *    /AD ADD
        *    /AA AAD
        *
        *LD      Laserdisc
        *     /A Analog transfer from media
        *
        *TT      Turntable records
        *    /33 33.33 rpm
        *    /45 45 rpm
        *    /71 71.29 rpm
        *    /76 76.59 rpm
        *    /78 78.26 rpm
        *    /80 80 rpm
        *
        *MD      MiniDisc
        *     /A Analog transfer from media
        *
        *DAT     DAT
        *     /A Analog transfer from media
        *     /1 standard, 48 kHz/16 bits, linear
        *     /2 mode 2, 32 kHz/16 bits, linear
        *     /3 mode 3, 32 kHz/12 bits, nonlinear, low speed
        *     /4 mode 4, 32 kHz/12 bits, 4 channels
        *     /5 mode 5, 44.1 kHz/16 bits, linear
        *     /6 mode 6, 44.1 kHz/16 bits, 'wide track' play
        *
        *DCC     DCC
        *     /A Analog transfer from media
        *
        *DVD     DVD
        *     /A Analog transfer from media
        *
        *TV      Television
        *   /PAL PAL
        *  /NTSC NTSC
        * /SECAM SECAM
        *
        *VID     Video
        *   /PAL PAL
        *  /NTSC NTSC
        * /SECAM SECAM
        *   /VHS VHS
        *  /SVHS S-VHS
        *  /BETA BETAMAX
        *
        *RAD     Radio
        *    /FM FM
        *    /AM AM
        *    /LW LW
        *    /MW MW
        *
        *TEL     Telephone
        *     /I ISDN
        *
        *MC      MC (normal cassette)
        *     /4 4.75 cm/s (normal speed for a two sided cassette)
        *     /9 9.5 cm/s
        *     /I Type I cassette (ferric/normal)
        *    /II Type II cassette (chrome)
        *   /III Type III cassette (ferric chrome)
        *    /IV Type IV cassette (metal)
        *
        *REE     Reel
        *     /9 9.5 cm/s
        *    /19 19 cm/s
        *    /38 38 cm/s
        *    /76 76 cm/s
        *     /I Type I cassette (ferric/normal)
        *    /II Type II cassette (chrome)
        *   /III Type III cassette (ferric chrome)
        *    /IV Type IV cassette (metal)
        */
        mediaType?: string,
        /**
         * The 'Mood' frame is intended to reflect the mood of the audio with a few keywords, e.g. "Romantic" or "Sad".
         */
        mood?: string,
        /**
         * The 'Original album/movie/show title' frame is intended for the title of the original recording (or source of sound), if for example the music in the file should be a cover of a previously released song.
         */
        originalTitle?: string,
        /**
         * The 'Original filename' frame contains the preferred filename for the file, since some media doesn't allow the desired length of the filename. The filename is case sensitive and includes its suffix.
         */
        originalFilename?: string,
        /**
         * The 'Original lyricist(s)/text writer(s)' frame is intended for the text writer(s) of the original recording, if for example the music in the file should be a cover of a previously released song. The text writers are seperated with the "/" character.
         */
        originalTextwriter?: string,
        /**
         * The 'Original artist(s)/performer(s)' frame is intended for the performer(s) of the original recording, if for example the music in the file should be a cover of a previously released song. The performers are seperated with the "/" character.
         */
        originalArtist?: string,
        /**
         * The 'Original release year' frame is intended for the year when the original recording, if for example the music in the file should be a cover of a previously released song, was released. The field is formatted as in the "Year" frame.
         */
        originalYear?: string,
        /**
         * The 'File owner/licensee' frame contains the name of the owner or licensee of the file and it's contents.
         */
        fileOwner?: string,
        /**
         * The 'Lead artist(s)/Lead performer(s)/Soloist(s)/Performing group' is used for the main artist(s). They are seperated with the "/" character.
         */
        artist?: string,
        /**
         * The 'Band/Orchestra/Accompaniment' frame is used for additional information about the performers in the recording.
         */
        performerInfo?: string,
        /**
         * The 'Conductor' frame is used for the name of the conductor.
         */
        conductor?: string,
        /**
         * The 'Interpreted, remixed, or otherwise modified by' frame contains more information about the people behind a remix and similar interpretations of another existing piece.
         */
        remixArtist?: string,
        /**
         * The 'Part of a set' frame is a numeric string that describes which part of a set the audio came from. This frame is used if the source described in the "Album/Movie/Show title" frame is divided into several mediums, e.g. a double CD. The value may be extended with a "/" character and a numeric string containing the total number of parts in the set. E.g. "1/2".
         */
        partOfSet?: string,
        /**
         * The 'Produced notice' frame, in which the string must begin with a year and a space character (making five characters), is intended for the production copyright holder of the original sound, not the audio file itself. The absence of this frame means only that the production copyright information is unavailable or has been removed, and must not be interpreted to mean that the audio is public domain. Every time this field is displayed the field must be preceded with "Produced " (P) " ", where (P) is one character showing a P in a circle.
     
        */
        producedNotice?: string,
        /**
         * The 'Publisher' frame simply contains the name of the label or publisher.
         */
        publisher?: string,
        /**
         * The 'Track number/Position in set' frame is a numeric string containing the order number of the audio-file on its original recording. This may be extended with a "/" character and a numeric string containing the total numer of tracks/elements on the original recording. E.g. "4/9".
         */
        trackNumber?: string,
        TRCK?: string,
        /**
         * The 'Recording dates' frame is a intended to be used as complement to the "Year", "Date" and "Time" frames. E.g. "4th-7th June, 12th June" in combination with the "Year" frame.
         */
        recordingDates?: string,
        /**
         * The 'Internet radio station name' frame contains the name of the internet radio station from which the audio is streamed.
         */
        internetRadioName?: string,
        /**
         * The 'Internet radio station owner' frame contains the name of the owner of the internet radio station from which the audio is streamed.
         */
        internetRadioOwner?: string,
        /**
         * The 'Album sort order' frame defines a string which should be used instead of the album name (TALB) for sorting purposes. E.g. an album named "A Soundtrack" might preferably be sorted as "Soundtrack".
         */
        albumSortOrder?: string,
        /**
         * The 'Performer sort order' frame defines a string which should be used instead of the performer (TPE2) for sorting purposes.
         */
        performerSortOrder?: string,
        /**
         * The 'Title sort order' frame defines a string which should be used instead of the title (TIT2) for sorting purposes.
         */
        titleSortOrder?: string,
        /**
         * The 'Size' frame contains the size of the audiofile in bytes, excluding the ID3v2 tag, represented as a numeric string.
         */
        size?: string,
        /**
         * The 'ISRC' frame should contain the International Standard Recording Code (ISRC) (12 characters).
         */
        ISRC?: string,
        /**
         * The 'Software/Hardware and settings used for encoding' frame includes the used audio encoder and its settings when the file was encoded. Hardware refers to hardware encoders, not the computer on which a program was run.
         */
        encodingTechnology?: string,
        /**
         * The 'Set subtitle' frame is intended for the subtitle of the part of a set this track belongs to.
         */
        setSubtitle?: string,
        /**
         * The 'Year' frame is a numeric string with a year of the recording. This frames is always four characters long (until the year 10000).
         */
        year?: string,
        comment?: {
            language: string,
            text: string,
        },
        unsynchronisedLyrics?: {
            language: string,
            text: string
        },
        /**
         * `SYLT` tag frames
         *
         * @see {@link https://id3.org/d3v2.3.0 4.10. Synchronised lyrics/text}
         */
        synchronisedLyrics?: Array<{
            /**
             * 3 letter ISO 639-2 language code, for example: eng
             * @see {@link https://id3.org/ISO%20639-2 ISO 639-2}
             */
            language: string,
            /**
             * Absolute time unit:
             * {@link TagConstants.TimeStampFormat}
             */
            timeStampFormat: number,
            /**
             * {@link TagConstants.SynchronisedLyrics.ContentType}
             */
            contentType: number,
            /**
             * Content descriptor
             */
            shortText?: string,
            synchronisedText: Array<{
            text: string,
            /**
             * A positive integer expressing an absolute time in unit according
             * to `timeStampFormat`.
             */
            timeStamp: number
            }>
        }>,
        userDefinedText?: [{
            description: string,
            value: string
        }]
        /**
         * `APIC` (attached picture) tag frames
         *
         * Filename or image data.
         */
        image?: string | {
            mime: string
            /**
             * See https://en.wikipedia.org/wiki/ID3#ID3v2_embedded_image_extension
             */
            type: {
            /**
             * {@link TagConstants.AttachedPicture.PictureType }
             */
            id: number,
            /**
             * @deprecated Provided as an information when a tag is read,
             * unused when a tag is written.
             */
            name?: string
            },
            description: string,
            imageBuffer: Buffer,
        },
        popularimeter?: {
            email: string,
            /**
             * 1-255
             */
            rating: number,
            counter: number,
        },
        private?: [{
            ownerIdentifier: string,
            data: string
        }],
        /**
         * This frame's purpose is to be able to identify the audio file in a
         * database that may contain more information relevant to the content.
         * Since standardisation of such a database is beyond this document,
         * all frames begin with a null-terminated string with a URL
         * containing an email address, or a link to a location where an email
         * address can be found, that belongs to the organisation responsible
         * for this specific database implementation. Questions regarding the
         * database should be sent to the indicated email address. The URL
         * should not be used for the actual database queries. The string
         * "http://www.id3.org/dummy/ufid.html" should be used for tests.
         * Software that isn't told otherwise may safely remove such frames.
         *
         * There may be more than one "UFID" frame in a tag, but only one with
         * the same `ownerIdentifier`.
         */
        uniqueFileIdentifier?: Array<{
            /**
             * Must be non-empty.
             */
            ownerIdentifier: string,
            /**
             * Up to 64 bytes of binary data.
             * Providing more data will result in an undefined behaviour.
             */
            identifier: Buffer
        }>,
        chapter?: Array<{
            elementID: string,
            endTimeMs: number,
            startTimeMs: number,
            tags?: Tags
        }>,
        tableOfContents?: Array<{
            elementID: string,
            isOrdered?: boolean,
            elements?: Array<string>
            tags?: Tags
        }>,
        /**
         * The 'Commercial information' frame is a URL pointing at a webpage with information such as where the album can be bought. There may be more than one "WCOM" frame in a tag, but not with the same content.
         */
        commercialUrl?: Array<string>,
        /**
         * The 'Copyright/Legal information' frame is a URL pointing at a webpage where the terms of use and ownership of the file is described.
         */
        copyrightUrl?: string,
        /**
         * The 'Official audio file webpage' frame is a URL pointing at a file specific webpage.
         */
        fileUrl?: string,
        /**
         * The 'Official artist/performer webpage' frame is a URL pointing at the artists official webpage. There may be more than one "WOAR" frame in a tag if the audio contains more than one performer, but not with the same content.
         */
        artistUrl?: Array<string>,
        /**
         * The 'Official audio source webpage' frame is a URL pointing at the official webpage for the source of the audio file, e.g. a movie.
         */
        audioSourceUrl?: string,
        /**
         * The 'Official internet radio station homepage' contains a URL pointing at the homepage of the internet radio station.
         */
        radioStationUrl?: string,
        /**
         * The 'Payment' frame is a URL pointing at a webpage that will handle the process of paying for this file.
         */
        paymentUrl?: string,
        /**
         * The 'Publishers official webpage' frame is a URL pointing at the official wepage for the publisher.
         */
        publisherUrl?: string,
        /**
         * The 'User-defined URL link' frame is intended for URL links concerning the audiofile in a similar way to the other "W"-frames. There may be more than one "WXXX" frame in each tag, but only one with the same description.
         */
        userDefinedUrl?: Array<{
            description: string,
            url: string
        }>,
        /**
         * ETCO frame
         *
         * @see {@link https://id3.org/id3v2.3.0#Event_timing_codes 4.6. Event timing codes}
         */
        eventTimingCodes?: {
            /**
             * Absolute time unit:
             * {@link TagConstants.TimeStampFormat}
             */
            timeStampFormat: number,
            keyEvents: Array<{
            /**
             * {@link TagConstants.EventTimingCodes.EventType}
             */
            type: number,
            /**
             * Absolute time in unit according to `timeStampFormat`.
             */
            timeStamp: number
            }>
        },
        commercialFrame?: Array<{
            /**
             * Object containing price information.
             * Key is a three letter currency code according to ISO-4217 (e.g. EUR).
             * Value is a price string or number, e.g. 17.52
             */
            prices: {
            [currencyCode: string]: string|number
            },
            /**
             * Describes how long the price is valid
             */
            validUntil: {
            year: number,
            month: number,
            day: number
            },
            contactUrl?: string,
            /**
             * Describes how the audio is delivered when bought
             * {@link TagConstants.CommercialFrame.ReceivedAs}
             */
            receivedAs: number,
            /**
             * Name of the seller
             */
            nameOfSeller?: string,
            /**
             * Short description of the product
             */
            description?: string,
            /**
             * Optional logo of the seller.
             */
            sellerLogo?: {
            /**
             * Mime type of picture.
             * Only allowed values: image/jpeg, image/png, image/
             */
            mimeType?: string,
            /**
             * Buffer containing the picture
             */
            picture: Buffer
            }
        }>,
        raw?: Tags
    }
}