import process from "process";
import readline from "readline";
import { Row } from "../types";

export default class Visualizer {
    timer: NodeJS.Timeout | undefined;
    size: number;
    cursor: number;
    previousRowCount: number;
    isFirstStart: number;
    constructor (size: number = 50) {
        this.size = size;
        this.cursor = 0
        this.previousRowCount = 0;
        this.isFirstStart = 0;
    }

    render(rows: ReadonlyArray<Row>): void {
        if (rows.length < this.previousRowCount || this.isFirstStart === 0) {
            console.clear();
            this.isFirstStart++;
        }
        this.previousRowCount = rows.length;
        this.cursor = 0

        for (let idx = 0; idx < rows.length; idx++) {
            const y = idx + 1;
            const row = rows[idx];

            readline.cursorTo(process.stdout, 0, y);
            process.stdout.clearLine(0);

            row.cells.forEach(elem => {
                readline.cursorTo(process.stdout, elem.startIndex, y);
                process.stdout.write(elem.value);
            });
        }

        // readline.cursorTo(process.stdout, 20, 1);
        // process.stdout.write("Published: 43");

        // readline.cursorTo(process.stdout, 20, 2);
        // process.stdout.write("\n");

        //process.stdout.clearLine(0); // Direction = -1 | 0 | 1;

        // set position on the "first" row and clear it
        readline.cursorTo(process.stdout, this.cursor, 0);
        process.stdout.clearLine(0);

        let symbolIdx = 0;
        this.timer = setInterval(() => {
            readline.cursorTo(process.stdout, 0, 0);
            switch (symbolIdx) {
                case 0:
                case 4:
                    process.stdout.write("|");
                    break;
                case 1:
                case 5:
                    process.stdout.write("/");
                    break;
                case 2:
                case 6:
                    process.stdout.write("-");
                    break;
                case 3:
                case 7:
                    process.stdout.write("\\");
            }

            if (symbolIdx >= 7) {
                symbolIdx = 0;
            } else {
                symbolIdx++;
            }
            this.cursor++;
            if (this.cursor >= this.size) {
                clearTimeout(this.timer as NodeJS.Timeout);
                // enable cursor
                //process.stdout.write("\x1B[?25h");
            }
        }, 200)
    }
}
