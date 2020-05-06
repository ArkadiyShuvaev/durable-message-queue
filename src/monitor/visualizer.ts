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
        readline.cursorTo(process.stdout, this.cursor, 0);
        process.stdout.clearLine(0);
        this.timer = setInterval(() => {
            process.stdout.write("\u2588")
            this.cursor++;
            if (this.cursor >= this.size) {
                clearTimeout(this.timer as NodeJS.Timeout);
                // enable cursor
                //process.stdout.write("\x1B[?25h");
            }
        }, 200)
    }
}
