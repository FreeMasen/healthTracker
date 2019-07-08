import { ITime } from './database';

export function normalizeString(value: string): string {
    let ret = value[0].toLocaleUpperCase();
    for (let i = 1;i<value.length;i++) {
        let char = value[i];
        if (char.toLocaleUpperCase() === char) {
            ret += ` ${char}`;
        } else {
            ret += char;
        }
    }
    return ret
}

export function timeToTime(time: string): ITime {
    let [hoursStr, minutesAndTod] = time.split(':');
    let [minutesStr, tod] = minutesAndTod.split(' ');
    let hours = parseInt(hoursStr);
    let minutes = parseInt(minutesStr);
    if (tod === 'p') {
        return {
            hours: hours + 12,
            minutes,
        }
    }
    return {
        hours,
        minutes,
    }
}

export async function readFile(f: File): Promise<string> {
    return new Promise((r,j) => {
        let reader = new FileReader();
        reader.onerror = e => j(e);
        reader.onload = s => r(reader.result as string);
        reader.readAsText(f);
    });
}