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
            return r(records.sort((l, r) => {
                l[id] - r[id]
            }));
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
    ['src/assets/food_desc.csv', 'id'],
    ['src/assets/food_groups.csv', 'id'],
    ['src/assets/nut_data.csv', 'id'],
    ['src/assets/nutr_def.csv', 'nutId'],
    ['src/assets/weight.csv', 'foodDescId'],
]
async function main() {
    for (let file of FILES) {
        let content = await readFile(file[0]);
        let json = await convertCsvToJson(content, file[1]);
        await writeFile(file[0].substr(0, file[0].length - 3) + 'json', JSON.stringify(json));
    }
}


main().then(() => console.log('done')).catch(e => console.error('error in main', e));
