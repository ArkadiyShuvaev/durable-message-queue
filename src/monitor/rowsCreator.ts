import { Cell, Metrics, Row } from "../types";

export default class RowsCreator {
    static create(map: Map<string, Metrics>): ReadonlyArray<Row> {
        const result = Array<Row>();
        const numberOfSpacesBetweenCells = 2;
        const maxLength = this.getMaximumLength(map);

        map.forEach((el, key) => {
            let row: Row = { cells: new Array<Cell>() };

            const queueLabel = "";
            const queueStartIdx = 0;
            const queueValue = `${queueLabel}${key}`;
            row.cells.push({ startIndex: queueStartIdx, value: queueValue });

            const sentLabel = "Sent: ";
            const sentStartIdx = queueLabel.length + maxLength.queueNameMaxLength + numberOfSpacesBetweenCells;
            const sentValue = `${sentLabel}${this.getDefaultValue(el.numberOfMessagesSent)}`;
            row.cells.push({ startIndex: sentStartIdx, value: sentValue });

            const receivedLabel = "Received: ";
            const receivedIdx = sentStartIdx + sentLabel.length + maxLength.sentMaxLength + numberOfSpacesBetweenCells;
            const receivedValue = `${receivedLabel}${this.getDefaultValue(el.numberOfMessagesReceived)}`;
            row.cells.push({ startIndex: receivedIdx, value: receivedValue });

            const deletedLabel = "Deleted: ";
            const deletedIdx = receivedIdx + receivedLabel.length + maxLength.receivedMaxLength + numberOfSpacesBetweenCells;
            const deletedValue = `${deletedLabel}${this.getDefaultValue(el.numberOfMessagesDeleted)}`;
            row.cells.push({ startIndex: deletedIdx, value: deletedValue });

            const returnedLabel = "Returned: ";
            const returnedIdx = deletedIdx + deletedLabel.length + maxLength.deletedMaxLength + numberOfSpacesBetweenCells;
            const returnedValue = `${returnedLabel}${this.getDefaultValue(el.numberOfMessagesReturned)}`;
            row.cells.push({ startIndex: returnedIdx, value: returnedValue });

            const deadLabel = "Dead: ";
            const deadIdx = returnedIdx + returnedLabel.length + maxLength.returnedMaxLength + numberOfSpacesBetweenCells;
            const deadValue = `${deadLabel}${this.getDefaultValue(el.numberOfMessagesDead)}`;
            row.cells.push({ startIndex: deadIdx, value: deadValue });

            result.push(row);
        });

        return result;
    }

    private static getDefaultValue(value: number): string {
        return (value ?? 0).toString();
    }

    private static getMaximumLength(map: Map<string, Metrics>): RowMaxCellLength {
        const result: RowMaxCellLength = {
            queueNameMaxLength: 0,
            sentMaxLength: 0,
            receivedMaxLength: 0,
            deletedMaxLength: 0,
            returnedMaxLength: 0,
            deadMaxLength: 0
        };

        map.forEach((elem, key) => {
            if (key.length > result.queueNameMaxLength) {
                result.queueNameMaxLength = key.length;
            }

            const sentLength = this.getDefaultValue(elem.numberOfMessagesSent).length;
            if (sentLength > result.sentMaxLength) {
                result.sentMaxLength = sentLength;
            }

            const receivedLength = this.getDefaultValue(elem.numberOfMessagesReceived).length;
            if (receivedLength > result.receivedMaxLength) {
                result.receivedMaxLength = receivedLength;
            }

            const deletedLength = this.getDefaultValue(elem.numberOfMessagesDeleted).length;
            if (deletedLength > result.deletedMaxLength) {
                result.deletedMaxLength = deletedLength;
            }

            const returnedLength = this.getDefaultValue(elem.numberOfMessagesReturned).length;
            if (returnedLength > result.returnedMaxLength) {
                result.returnedMaxLength = returnedLength;
            }

            const deadLength = this.getDefaultValue(elem.numberOfMessagesDead).length;
            if (deadLength > result.deadMaxLength) {
                result.deadMaxLength = deadLength;
            }
        });

        return result;
    }

}

interface RowMaxCellLength {
    queueNameMaxLength: number,
    sentMaxLength: number,
    receivedMaxLength: number,
    deletedMaxLength: number,
    returnedMaxLength: number,
    deadMaxLength: number
}
