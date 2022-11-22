import {Component, ElementRef, OnInit, HostListener} from '@angular/core';
import { Card, Pile } from '../../models/model';

const GamesPlayedCookie:string = 'GamesPlayedCookie';
const GamesWonCookie:string = 'GamesWonCookie';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html'
})

export class HomeComponent implements OnInit {
    cards: Card[] = [];
    spread: number[] = [];
    nr: number = 0;
    rechargingPile: boolean = false;
    gameEnded: boolean = false;

    piles: Pile[] = [];

    screenHeight: any;
    screenWidth: any;

    gamesPlayed: number = 0;
    gamesWon: number = 0;

    @HostListener('window:resize', ['$event'])
    _getScreenSize() {
        this.screenHeight = window.innerHeight;
        this.screenWidth = window.innerWidth;
    }

    constructor(private elementRef: ElementRef) {
        this._getScreenSize();
    }

    ngOnInit(): void {
        for (let p = 0; p < 13; p++) {
            this.piles.push({cards: []});
        }

        ['clubs', 'diamonds', 'spades', 'hearts'].forEach((type: string) => {
            for (let value = 1; value <= 13; value++) {
                const clubOrSpade: boolean = ['clubs', 'spades'].indexOf(type) >= 0;
                let imageUrl = 'assets/img/';
                switch (value) {
                    case 1:
                        imageUrl += 'ace_of_' + type;
                        break;
                    case 11:
                        imageUrl += 'jack_of_' + type;
                        break;
                    case 12:
                        imageUrl += 'queen_of_' + type;
                        break;
                    case 13:
                        imageUrl += 'king_of_' + type;
                        break;
                    default:
                        imageUrl += value.toLocaleString() + '_of_' + type;
                }
                imageUrl += '.png';

                const id = this.nr++;
                this.cards.push({
                    id: id,
                    value: value,
                    imageUrl: imageUrl,
                    type: type,
                    clubOrSpade: clubOrSpade,
                    pileNr: 5,
                    searching: false,
                    turning: false,
                    turned: false,
                    moving: false
                });
                this.spread.push(this.cards.length - 1);
            }
        });

        // Shake and spread cards on the seven play-fields
        for (let pileNr = 6; pileNr <= 12; pileNr++) {
            for (let x = 1; x <= pileNr - 5; x++) {
                const spreadNr = Math.floor(Math.random() * this.spread.length);
                const card = this.cards[this.spread[spreadNr]];
                card.pileNr = pileNr;
                this.spread.splice(spreadNr, 1);
                card.turned = x === pileNr - 5;
                this.piles[pileNr].cards.push(card);
            }
        }

        // Shake and put the rest of the Cards on the pile upper right
        while (this.spread.length > 0) {
            const spreadNr = Math.floor(Math.random() * this.spread.length);
            const card = this.cards[this.spread[spreadNr]];
            this.spread.splice(spreadNr, 1);
            card.turned = false;
            this.piles[5].cards.push(card);
        }

        // Read and increase number of played games using cookies.

        if (typeof(Storage) !== "undefined") { // Check browser support
            const gamesPlayedCookie = localStorage.getItem(GamesPlayedCookie);
            if (gamesPlayedCookie) {
                this.gamesPlayed = +gamesPlayedCookie;
            }
            localStorage.setItem(GamesPlayedCookie, '' + (++this.gamesPlayed).toString());
        } else {
            console.log("Sorry, your browser does not support Web Storage...");
        }
    }

    turnAround(event: Event, card: Card) {
        if (this.rechargingPile || this.piles.some(pile => pile.cards.some(card => card.searching))) return;
        card.searching = true;
        card.turning = true;
        event.stopPropagation(); // Prevent exectution empty stock-pile click
        const flipCardElement = this.elementRef.nativeElement.querySelector('#card-' + card.id);
        const pile4Element = this.elementRef.nativeElement.querySelector('#pile-4');
        const pile5Element = this.elementRef.nativeElement.querySelector('#pile-5');
        const moveHorizontal: number = pile4Element.getBoundingClientRect().left - pile5Element.getBoundingClientRect().left;
        flipCardElement.animate([{transform: 'rotateY(180deg)'}, {transform: 'translateX(' + moveHorizontal / (this.screenWidth / 100) + 'vw)'}], {duration: 300});
        setTimeout(() => {
            card.turned = true;
            this.piles[5].cards.pop();
            this.piles[4].cards.push(card);
            card.pileNr = 4;
            card.turning = false;
            card.searching = false;
        }, 280);
    }

    private _turnAround() {
        const card: Card = this.piles[5].cards[this.piles[5].cards.length - 1];
        if (this.piles.some(pile => pile.cards.some(card => card.searching))) return;
        card.searching = true;
        card.turning = true;
        this.piles[5].cards.pop();
        card.pileNr = 4;
        card.turned = true;
        this.piles[4].cards.push(card);
        card.turning = false;
        card.searching = false;
        this._checkGameStatus();
    }

    rechargePile() {
        if (this.rechargingPile || this.piles.some(pile => pile.cards.some(card => card.searching))) return;
        this.rechargingPile = true;
        this._rechargePile();
    }

    private _rechargePile() {
        if (this.piles[5].cards.find(c => c.turning)) {
            this._checkGameStatus();
            this.rechargingPile = false;
            return;
        }
        if (this.piles[4].cards.length > 0) {
            const card = this.piles[4].cards[this.piles[4].cards.length - 1];
            card.turned = false;
            card.turning = true;
            const flipCardElement = this.elementRef.nativeElement.querySelector('#card-' + card.id);
            flipCardElement.animate([{transform: 'rotateY(-180deg)'}, {transform: 'translateX(10vw)'}], {duration: 100});
            setTimeout(() => {
                card.turning = false;
                this.piles[4].cards.pop();
                card.pileNr = 5;
                this.piles[5].cards.push(card);
                this._rechargePile();
            }, 95);
        } else {
            this._checkGameStatus();
            this.rechargingPile = false;
        }
    }


    cardClick(pileNr: number, card: Card, first4PilesOnly: boolean): boolean {
        if (this.piles.some(pile => pile.cards.some(card => card.searching))) {
            return false;
        }
        if (!card || !card.turned) {
            return false;
        }
        card.searching = true;
        const offsetPerCard: number = 5 * this.screenHeight / 100;

        for (let tryPileNr of [0, 1, 2, 3, 6, 7, 8, 9, 10, 11, 12]) {
            if (tryPileNr === pileNr) continue;
            if (first4PilesOnly && tryPileNr > 3) continue;
            const bottommostCard: Card = this.piles[tryPileNr].cards[this.piles[tryPileNr].cards.length - 1];
            if (!((tryPileNr < 4 && ((card.value === 1 && !bottommostCard) ||
                    (bottommostCard && card.value === bottommostCard.value + 1 && card.type === bottommostCard.type && card.id === this.piles[pileNr].cards[this.piles[pileNr].cards.length - 1].id) ))
                    || (tryPileNr >= 6 && !bottommostCard && card.value === 13)
                    || (tryPileNr >= 6 && (bottommostCard && (card.value === bottommostCard.value - 1) && card.clubOrSpade != bottommostCard.clubOrSpade)))) continue;

            const numberInPile: number = this.piles[pileNr].cards.indexOf(card);
            const cards: Card[] = [];
            let numberOfCardsToBeMoved = 0;
            let duration = 0;
            for (let movingCardId = numberInPile; movingCardId < this.piles[pileNr].cards.length; movingCardId++) {
                const c: Card = this.piles[pileNr].cards[movingCardId];
                c.moving = true;
                cards.push(c);
                const pileElement = this.elementRef.nativeElement.querySelector('#pile-' + tryPileNr);
                const cardElement = this.elementRef.nativeElement.querySelector('#card-' + c.id );
                const moveHorizontal: number = pileElement.getBoundingClientRect().left - cardElement.getBoundingClientRect().left;

                let moveVertical: number;
                if (tryPileNr < 4) {
                    const pileElement = this.elementRef.nativeElement.querySelector('#pile-' + tryPileNr);
                    moveVertical = pileElement.getBoundingClientRect().top - cardElement.getBoundingClientRect().top;
                } else {
                    if (this.piles[tryPileNr].cards.length === 0) {
                        const pileElement = this.elementRef.nativeElement.querySelector('#pile-' + tryPileNr);
                        moveVertical = pileElement.getBoundingClientRect().top + offsetPerCard * numberOfCardsToBeMoved++ - cardElement.getBoundingClientRect().top;
                    } else {
                        const bottomCardOfTryPileElement = this.elementRef.nativeElement.querySelector('#card-' + this.piles[tryPileNr].cards[this.piles[tryPileNr].cards.length - 1].id);
                        moveVertical = bottomCardOfTryPileElement.getBoundingClientRect().top + offsetPerCard + offsetPerCard * numberOfCardsToBeMoved++ - cardElement.getBoundingClientRect().top;
                    }
                }
                duration = Math.sqrt(Math.pow(moveHorizontal,2) + Math.pow(moveVertical, 2)) / 2;
                cardElement.animate([{transform: 'translate(' + moveHorizontal / (this.screenWidth / 100) + 'vw,' + moveVertical / (this.screenHeight / 100) + 'vh)'}], {duration: duration});
            }
            setTimeout(() => {
                // make the movement of the card(s) final.
                for (let c of cards) {
                    this.piles[pileNr].cards.pop();
                    c.pileNr = tryPileNr;
                    c.moving = false;
                    this.piles[tryPileNr].cards.push(c);
                }

                // Turn around next (most lowest) card of that pile.
                const nextCard = this.piles[pileNr].cards[this.piles[pileNr].cards.length - 1];
                if (nextCard && !nextCard.turned) {
                    nextCard.turning = true;
                    const flipCardElement = this.elementRef.nativeElement.querySelector('#card-' + nextCard.id + '-turning');
                    flipCardElement.animate([{transform: 'rotateY(180deg) '}], {duration: 300});
                    setTimeout(() => {
                        nextCard.turned = true;
                        nextCard.turning = false;
                        card.searching = false;
                        this._checkGameStatus();
                    }, 295);
                } else {
                    card.searching = false;
                    this._checkGameStatus();
                }
            }, duration / 1.1);
            return true;
        }
        card.searching = false;
        return false;
    }

    private _checkGameStatus() {

        // Has game ended?
        setTimeout(() => {
            if (!this.piles.some((pile, index) => index >= 6 && pile.cards.some(card => !card.turned))) {
                if (this.piles.some((pile, index) => index >= 4 && pile.cards.length > 0)) {
                    let nextPileNr = 6;
                    while (this.piles[nextPileNr].cards.length === 0 || !this.cardClick(nextPileNr, this.piles[nextPileNr].cards[this.piles[nextPileNr].cards.length - 1], true)) {
                        nextPileNr = nextPileNr === 12 ? 4 : nextPileNr + 1;
                        if (nextPileNr === 5) {
                            if (this.piles[5].cards.length === 0) {
                                this._rechargePile();
                            } else {
                                this._turnAround();
                            }
                            return;
                        }
                    }
                } else {
                    // Read and increase number of games won using cookies.

                    if (typeof(Storage) !== "undefined") { // Check browser support
                        const gamesWonCookie = localStorage.getItem(GamesWonCookie);
                        if (gamesWonCookie) {
                            this.gamesWon = +gamesWonCookie;
                        }
                        localStorage.setItem(GamesWonCookie, '' + (++this.gamesWon).toString());
                    } else {
                        console.log("Sorry, your browser does not support Web Storage...");
                    }
                    this.gameEnded = true;
                }
            }
        }, 10);

    }

    startGame() {
        this.cards = [];
        this.spread = [];
        this.nr = 0;
        this.gameEnded = false;

        this.piles = [];

        this.ngOnInit();
    }
}
