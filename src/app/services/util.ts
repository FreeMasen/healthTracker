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
    return ret;
}

export function timeToTime(time: string): ITime {
    const [hoursStr, minutesAndTod] = time.split(':');
    const [minutesStr, tod] = minutesAndTod.split(' ');
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    if (tod === 'p') {
        return {
            hours: hours + 12,
            minutes,
        };
    }
    return {
        hours,
        minutes,
    };
}

export async function readFile(f: File): Promise<string> {
    return new Promise((r, j) => {
        const reader = new FileReader();
        reader.onerror = e => j(e);
        reader.onload = s => r(reader.result as string);
        reader.readAsText(f);
    });
}
