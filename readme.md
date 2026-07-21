# MP3 Master List

Creates a HTML table of MP3 files including file path, hash, some ID3 data, file size, and modification date.

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
* split - If false the media list will be written to a single large JSON file, which does not work in IPhones.  If true the media list will be broke into multiple files of at most 500 items.
* type - Determines the data presented in the output table and the media player.  The accepted values are: *movie*, *music*, and *television*.