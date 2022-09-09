import {Component, ElementRef, OnInit, HostListener} from '@angular/core';

interface Card {
    id:number;
    value:number;
    imageUrl:string;
    type:string;
    blackType:boolean;
    pileNr:number;
    searching:boolean;
    turning:boolean;
    turned:boolean;
}
interface Pile {
    cards:Card[];
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})

export class HomeComponent implements OnInit {
    cards:Card[] = [];
    spread:number[] = [];
    nr:number = 0;
    gameEnded:boolean = false;

    piles:Pile[] = [];// new Array(13).fill({cards: []});

    screenHeight: any;
    screenWidth: any;

    @HostListener('window:resize', ['$event'])
    getScreenSize() {
        this.screenHeight = window.innerHeight;
        this.screenWidth = window.innerWidth;
        console.log(this.screenWidth, this.screenHeight);
    }

  constructor(private elementRef: ElementRef) {
      this.getScreenSize();
  }

  ngOnInit(): void {
    for (let p = 0; p < 13; p++) {
      this.piles.push({cards: []});
    }

      ['clubs', 'diamonds', 'spades', 'hearts'].forEach((type:string) => {
          for (let value = 1; value <= 13; value++) {
              const blackType:boolean = ['clubs', 'spades'].indexOf(type) >= 0;
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
              this.cards.push({id: id, value: value, imageUrl: imageUrl, type: type, blackType: blackType, pileNr: 5, searching: false, turning: false, turned: false});
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

      setTimeout(() => {
          const pileElement = this.elementRef.nativeElement.querySelector('#pile-0');
          console.log('pile-0 = ', pileElement.getBoundingClientRect().left + ' / ' + pileElement.getBoundingClientRect().top);
          console.log('pile-0 = ', pileElement.offsetLeft + ' / ' + pileElement.offsetTop);
          console.log('pile-1 = ', this.elementRef.nativeElement.querySelector('#pile-1').getBoundingClientRect().left + ' / ' + this.elementRef.nativeElement.querySelector('#pile-1').getBoundingClientRect().top +
          '    ' + this.elementRef.nativeElement.querySelector('#pile-1').offsetLeft + ' / ' + this.elementRef.nativeElement.querySelector('#pile-1').offsetTop);
          console.log('pile-6 = ', this.elementRef.nativeElement.querySelector('#pile-6').getBoundingClientRect().left + ' / ' + this.elementRef.nativeElement.querySelector('#pile-6').getBoundingClientRect().top);
          const cardElement = this.elementRef.nativeElement.querySelector('#card-' +  this.piles[11].cards[5].id);
          console.log('card 6 = ', cardElement.getBoundingClientRect().left + ' / ' + cardElement.getBoundingClientRect().top + '    ' + cardElement.offsetLeft + ' / ' + cardElement.offsetTop);
          const cardElement2 = this.elementRef.nativeElement.querySelector('#card-' +  this.piles[12].cards[6].id);
          console.log('card 7 = ', cardElement2.getBoundingClientRect().left + ' / ' + cardElement2.getBoundingClientRect().top + '    ' + cardElement2.offsetLeft + ' / ' + cardElement2.offsetTop);
          // const cardBottomElement = this.elementRef.nativeElement.querySelector('#card-' +  this.piles[12].cards[6].id);
          // console.log('card bottom = ', cardBottomElement.getBoundingClientRect().left + '/' + cardBottomElement.getBoundingClientRect().top);
      })
  }

  draaiom(event: Event, card:Card) {
      if (this.piles.some(pile => pile.cards.some(card => card.searching))) {
          console.log('draaiom occupied');
          return;
      }
      card.searching = true;
      card.turning = true;
      event.stopPropagation(); // Prevent exectution empty stock-pile click
      const flipCardElement = this.elementRef.nativeElement.querySelector('#card-' + card.id);
      flipCardElement.animate([{ transform: 'rotateY(180deg) '}, { transform: 'translateX(-10vw)' } ], { duration: 200 });
      setTimeout(() => {
          card.turned = true;
          this.piles[5].cards.pop();
          card.pileNr = 4;
          this.piles[4].cards.push(card);
          card.turning = false;
          card.searching = false;
      }, 190);
  }

    turnAround() {
        const card:Card = this.piles[5].cards[this.piles[5].cards.length - 1];
        if (this.piles.some(pile => pile.cards.some(card => card.searching))) {
            console.log('turnAround occupied');
            return;
        }
        card.searching = true;
        card.turning = true;
        this.piles[5].cards.pop();
        card.pileNr = 4;
        card.turned = true;
        this.piles[4].cards.push(card);
        card.turning = false;
        card.searching = false;
        this.checkGameStatus();
    }

  rechargePile() {
      if (this.piles.some(pile => pile.cards.some(card => card.searching))) return;
      if (this.piles[5].cards.find(c => c.turning)) {
          console.log('rechargePile done, going to checkGameStatus');
          this.checkGameStatus();
          return;
      }
      if (this.piles[4].cards.length > 0) {
          const card = this.piles[4].cards[this.piles[4].cards.length - 1];
          if (card) {
              card.turned = false;
              card.turning = true;
              const flipCardElement = this.elementRef.nativeElement.querySelector('#card-' + card.id);
              flipCardElement.animate([ { transform: 'rotateY(-180deg)' }, { transform: 'translateX(10vw)' } ], { duration: 50 });
              setTimeout(() => {
                  card.turning = false;
                  this.piles[4].cards.pop();
                  card.pileNr = 5;
                  this.piles[5].cards.push(card);
                  this.rechargePile();
              }, 49);
          } else {
              this.checkGameStatus();
          }
      } else {
          this.checkGameStatus();
      }
  }


  cardClick(pileNr:number, card:Card, first4PilesOnly:boolean): boolean {
      if (this.piles.some(pile => pile.cards.some(card => card.searching))) {
          console.log('cardClick occupied');
          return false;
      }
    if (!card || !card.turned) {
      return false;
    }
    card.searching = true;
      const factor:number = 50* this.screenHeight / 1000;

    for (let tryPileNr of [0,1,2,3,6,7,8,9,10,11,12]) {
        console.log(pileNr + ': tryPileNr = ' + tryPileNr);
        if (tryPileNr === pileNr) continue;
        if (first4PilesOnly && tryPileNr > 3) continue;
        const bottommostCard:Card = this.piles[tryPileNr].cards[this.piles[tryPileNr].cards.length - 1];
        console.log('candidate');
        if (!((tryPileNr < 4 && ((card.value === 1 && !bottommostCard) ||
                (bottommostCard && card.value === bottommostCard.value + 1 && card.type === bottommostCard.type && card.id === this.piles[pileNr].cards[this.piles[pileNr].cards.length - 1].id) ))
              || (tryPileNr >= 6 && !bottommostCard && card.value === 13)
              || (tryPileNr >= 6 && (bottommostCard && (card.value === bottommostCard.value - 1) && card.blackType != bottommostCard.blackType)))) continue;

        console.log('match');

        const numberInPile:number = this.piles[pileNr].cards.indexOf(card);
        const cards:Card[] = [];
        let offset = 0;
        for (let movingCardId = numberInPile; movingCardId < this.piles[pileNr].cards.length; movingCardId++) {
            const c:Card = this.piles[pileNr].cards[movingCardId];
            cards.push(c);
            const pileElement = this.elementRef.nativeElement.querySelector('#pile-' + tryPileNr);
            const cardElement = this.elementRef.nativeElement.querySelector('#card-' + c.id);
            const moveHorizontal:number = pileElement.getBoundingClientRect().left - cardElement.getBoundingClientRect().left;

            let moveVertical: number;
            if (tryPileNr < 4) {
                const pileElement = this.elementRef.nativeElement.querySelector('#pile-' + tryPileNr);
                moveVertical = pileElement.getBoundingClientRect().top - cardElement.getBoundingClientRect().top;
            } else {
                if (this.piles[tryPileNr].cards.length === 0) {
                    const pileElement = this.elementRef.nativeElement.querySelector('#pile-' + tryPileNr);
                    moveVertical = pileElement.getBoundingClientRect().top + 45 * offset++ - cardElement.getBoundingClientRect().top;
                } else {
                    const bottomCardOfTryPileElement = this.elementRef.nativeElement.querySelector('#card-' + this.piles[tryPileNr].cards[this.piles[tryPileNr].cards.length - 1].id);
                    moveVertical = bottomCardOfTryPileElement.getBoundingClientRect().top + factor + factor * offset++ - cardElement.getBoundingClientRect().top;
                }
            }
            console.log(cardElement.getBoundingClientRect().top + ' ->  ' + pileElement.getBoundingClientRect().top +  '   = ' + moveVertical);
            cardElement.animate([{ transform: 'translate(' + moveHorizontal/(this.screenWidth/100) + 'vw,' + moveVertical/(this.screenHeight/100) + 'vh)'}], { duration: 200 });
        }
        setTimeout(() => {
            console.log('moving card(s)');
            for (let c of cards) {
                this.piles[pileNr].cards.pop();
                c.pileNr = tryPileNr;
                this.piles[tryPileNr].cards.push(c);
            }

            // turn around next (most lowest) card of that pile.
            const nextCard = this.piles[pileNr].cards[this.piles[pileNr].cards.length - 1];
            if (nextCard && !nextCard.turned) {
                nextCard.turning = true;
                const flipCardElement = this.elementRef.nativeElement.querySelector('#card-' + nextCard.id);
                flipCardElement.animate([{transform: 'rotateY(180deg) '}, {transform: 'rotateY(0deg) '}], {duration: 200});
                setTimeout(() => {
                    nextCard.turned = true;
                    nextCard.turning = false;
                    card.searching = false;
                    this.checkGameStatus();
                }, 190);
            } else {
                card.searching = false;
                this.checkGameStatus();
            }
        }, 190);
        return true;
    }
    card.searching = false;
    return false;
  }

  checkGameStatus() {

      // Has game ended?
      setTimeout(() => {
          console.log('Has game ended?');
          if (!this.piles.some((pile, index) => index >= 6 && pile.cards.some(card => !card.turned))) {
              console.log('Game about to end');
              if (this.piles.some((pile, index) => index >= 4 && pile.cards.length > 0)) {
                  console.log('ending game');
                  let nextPileNr = 6;
                  while (this.piles[nextPileNr].cards.length === 0 || !this.cardClick(nextPileNr, this.piles[nextPileNr].cards[this.piles[nextPileNr].cards.length - 1], true)) {
                      nextPileNr = nextPileNr === 12 ? 4 : nextPileNr + 1;
                      console.log('Attempt failed, next pile is ' + nextPileNr + '  ' + (this.piles[5].cards.length === 0));
                      if (nextPileNr === 5) {
                          if (this.piles[5].cards.length === 0) {
                              this.rechargePile();
                          } else {
                              this.turnAround();
                          }
                          return;
                      }
                  }
              } else {
                  this.gameEnded = true;
                  console.log('gameEnded ' + this.gameEnded);
              }
          }
      }, 10);

  }

  startGame() {
      this.cards = [];
      this.spread = [];
      this.nr = 0;
      this.gameEnded = false;

      this.piles = [];// new Array(13).fill({cards: []});

      this.ngOnInit();
  }
}
