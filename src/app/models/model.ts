import {BehaviorSubject} from "rxjs";

export interface Card {
    id: number;
    value: number;
    imageUrl: string;
    type: string;
    clubOrSpade: boolean;
    pileNr: number;
    searching: boolean;
    turning: boolean;
    turned: boolean;
    moving: boolean;
}

export interface Pile {
    cards$: ObjectsBehaviorSubject<Card>;
}

export class ObjectsBehaviorSubject<T> extends BehaviorSubject<T[]> {
    pop() {
        this.value.pop();
        super.next(this.value);
    }

    push(obj: T) {
        this.value.push(obj);
        super.next(this.value);
    }

    lastCard(): T {
        return this.value[this.value.length - 1];
    }

    refresh() {
        super.next(this.value);
    }
}