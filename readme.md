# MP3 Master List

This application creates a HTML page that includes an audio or video player and a play list.  The play list allows a variety of filtering and sorting on table column.

The goal of this project is to make self-hosted media files available for play via a web browser so that users can play their media anywhere without subscriptions.  The supported media is restricted to the list of supported media by a user's given web browser.

## Execution
`node lib/index.ts path/to/your/config.json`

## Config file
The config file is JSON format following this schema:

```json
{
    "paths": {
        "media": "media/directory/path/",
        "write": "directory/to/write/output/"
    },
    "split": false,
    "type": "music"
}

* paths.media - The directory of your media files. This can be a complex directory structure, but the value must end with a path separator.
* paths.write - The directory where the output will be written.  The value must end with a path separator.
* split - If false the media list will be written to a single large JSON file, which does not work in IPhones.  If true the media list will be broke into multiple files of at most 500 media items each.
* type - Determines the data presented in the output table and the media player.  The accepted values are: *movie*, *music*, and *television*.