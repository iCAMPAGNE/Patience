
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
    cards: Card[];
}
