import process from "process";
import readline from "readline";
import { Row } from "../types";

export default class Visualizer {
    private timer: NodeJS.Timeout | undefined;
    private previousRowCount: number;
    private isFirstStart: number;
    private updateInterval: number;
    private lastSymbolStateId: number;
    constructor (updateIntervalInSeconds:number, size: number = 50) {
        this.lastSymbolStateId = -1;
        this.previousRowCount = 0;
        this.isFirstStart = 0;
        this.updateInterval = updateIntervalInSeconds * 1000;
    }

    render(rows: ReadonlyArray<Row>): void {
        this.incrementOrResetIndexState();
        const startTime = new Date().getTime();
        const stopTime = startTime + this.updateInterval;
        let remainderOfSeconds = (stopTime - new Date().getTime())/1000;
        let previousStrLength = remainderOfSeconds.toString().length;

        if(this.timer?.hasRef()) {
            clearTimeout(this.timer as NodeJS.Timeout);
        }

        if (rows.length < this.previousRowCount || this.isFirstStart === 0) {
            console.clear();
            this.isFirstStart++;
        }
        this.previousRowCount = rows.length;

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

        // set position on the "first" row and clear it
        readline.cursorTo(process.stdout, 0, 0);
        process.stdout.clearLine(0);

        this.timer = setInterval(() => {

            //hide cursor
            process.stdout.write("\x1B[?25l");
            readline.cursorTo(process.stdout, 0, 0);

            switch (this.lastSymbolStateId) {
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

            this.incrementOrResetIndexState();

            readline.cursorTo(process.stdout, 2, 0);

            if (remainderOfSeconds.toString().length < previousStrLength) {
                process.stdout.clearLine(1); // to the right from cursor
            }

            if (remainderOfSeconds > 0) {
                process.stdout.write(remainderOfSeconds.toString());
            } else {
                // enable cursor
                process.stdout.write("\x1B[?25h");

                // clear remaining time value
                readline.cursorTo(process.stdout, 2, 0);
                process.stdout.clearLine(1); // to the right from cursor

                clearTimeout(this.timer as NodeJS.Timeout);
            }

            previousStrLength = remainderOfSeconds.toString().length;
            remainderOfSeconds = (stopTime - new Date().getTime())/1000;
        }, 200)
    }

    private incrementOrResetIndexState() {
        if (this.lastSymbolStateId >= 7) {
            this.lastSymbolStateId = 0;
        } else {
            this.lastSymbolStateId++;
        }
    }
}
