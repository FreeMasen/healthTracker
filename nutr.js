const fs = require('fs');
const csv = require('csv-parse');
const moment = require('moment');
async function readFile(filePath) {
    return new Promise((r, j) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) return j(err);
            return r(data);
        })
    });
}


/**
 * @param {string} content
 */
async function convertCsvToJson(content, id) {
    return new Promise((r, j) => {
        csv(content, {delimiter: ',', columns: true, cast: mapValue}, (err, records) => {
            if (err) return j(err);
            return r(records.sort((l, r) => l[id] - r[id]));
        });
    });
}

function mapValue(value, context) {
    if (context.header) {
        return formatKey(value);
    }
    if (context.column.indexOf('id') > -1) {
        try {
            return parseInt(value)
        } catch (e) {
            return value;
        }
    }
    if (value.indexOf('/') > -1) {
        return moment(value, 'MM/dd/yyyy');
    }
    if (!context.quoting) {
        let parse;
        if (value.indexOf('.') > -1) {
            parse = parseFloat
        } else {
            parse = parseInt;
        }
        try {
            let parsed = parse(value);
            if (isNaN(parsed)) {
                return value;
            }
            return parsed;
        } catch (e) {
            console.log('failed to parse non-quoted', value);
            return value;
        }
    } 
    return value;
}

/**
 * 
 * @param {string} key 
 */
function formatKey(key) {
    let ret = '';
    let cap = false;
    for (let i = 0; i < key.length; i++) {
        let char = key[i];
        if (char === '_') {
            cap = true;
            continue;
        }
        if (cap) {
            ret += char.toLocaleUpperCase();
            cap = false;
        } else {
            ret += char;
        }
    }
    return ret;
}

async function writeFile(file, data) {
    return new Promise((r, j) => {
        fs.writeFile(file, data, err => {
            if (err) return j(err);
            return r();
        });
    });
}
const FILES = [
    // ['src/assets/food_desc.csv', 'id'],
    // ['src/assets/food_details.csv', 'id'],
    // ['src/assets/food_groups.csv', 'id'],
    // ['src/assets/nut_data.csv', 'id'],
    // ['src/assets/nutr_def.csv', 'nutId'],
    // ['src/assets/weight.csv', 'foodDescId'],
    ['nutr/Nutrients.csv', 'NDB_No'],
    ['nutr/Products.csv', 'NDB_No'],
    ['nutr/Serving_size.csv', 'NDB_No'],
];
const rl = require('readline');
async function main() {
    for (let file of FILES) {
        
        console.log('starting file', file);
        // let content = await readFile(file[0]);
        let json = await csvToObjs(file[0]);
        await writeFile(file[0].substr(0, file[0].length - 3) + 'json', JSON.stringify(json));
    }
}

async function csvToObjs(file) {
    const readStream = rl.createInterface({
        input: fs.createReadStream(file),
    });
    let pastHeader = false;
    let headers = [];
    let ret = [];
    for await (const line of readStream) {
        if (!pastHeader) {
            headers = line.split(',');
        }
        let entry = {};
        let parts = line.split(',');
        for (let i = 0; i < headers.length; i++) {
            entry[headers[i]] = formatEntry(parts[i]);
        }
        ret.push(entry);
    }
    return ret;
}
const zero = '0'.charAt(0);
const nine = '9'.charAt(0);
function formatEntry(entry) {
    if (entry[0] == '"') {
        entry = entry.substr(1);
    }
    if (entry[entry.length - 1] == '"') {
        entry = entry.substr(0, entry.length - 1);
    }
    if (/[^\d]/.exec(entry) === 0)
    {
        return parseInt(entry);
    }
    return entry;
}


main().then(() => console.log('done')).catch(e => console.error('error in main', e));
