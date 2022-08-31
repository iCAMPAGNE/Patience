import {Component, ElementRef, OnInit} from '@angular/core';

interface Card {
    id:number;
    value:number;
    valueSymbol:string;
    type:string;
    blackType:boolean;
    pileNr:number;
    turning:boolean;
    turned:boolean;
}
interface Pile {
    cards:Card[];
}
interface position {
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

    piles:Pile[] = [];// new Array(13).fill({cards: []});

  constructor(private elementRef: ElementRef) { }

  ngOnInit(): void {
    for (let p = 0; p < 13; p++) {
      this.piles.push({cards: []});
    }

      ['♧', '♦', '♤', '♥'].forEach((type:string) => {
          for (let value = 1; value <= 13; value++) {
              const blackType:boolean = ['♧', '♤'].indexOf(type) >= 0;
              let valueSymbol:string = '';
              switch (value) {
                  case 1:
                      valueSymbol = 'A';
                      break;
                  case 11:
                      valueSymbol = 'J';
//				icon = card.type % 2 === 0 ? 'url(images/jack-black.png)' : 'url(images/jack-red.png)';
                      break;
                  case 12:
                      valueSymbol = 'Q';
                      break;
                  case 13:
                      valueSymbol = 'K';
                      break;
                  default:
                      valueSymbol = value.toLocaleString();
              }

              const id = this.nr++;
              this.cards.push({id: id, value: value, valueSymbol: valueSymbol, type: type, blackType: blackType, pileNr: 5, turning: false, turned: false});
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
  }

  draaiom(event: Event, card:Card) {
      card.turning = true;
      event.stopPropagation(); // Prevent exectution empty stock-pile click
      const flipCardElement = this.elementRef.nativeElement.querySelector('#card-' + card.id);
      flipCardElement.animate([{ transform: 'rotateY(180deg) '}, { transform: 'translateX(-150px)' } ], { duration: 200 });
      setTimeout(() => {
          card.turned = true;
          this.piles[5].cards.pop();
          card.pileNr = 4;
          this.piles[4].cards.push(card);
          card.turning = false;
      }, 190);
  }

  rechargePile(pileNr:number) {
      if (this.piles[pileNr].cards.find(c => c.turning)) return;
      console.log('rechargePile');
      if (this.piles[4].cards.length > 0) {
          const card = this.piles[4].cards[this.piles[4].cards.length - 1];
          if (card) {
              card.turned = false;
              card.turning = true;
              const flipCardElement = this.elementRef.nativeElement.querySelector('#card-' + card.id);
              flipCardElement.animate([ { transform: 'rotateY(-180deg)' }, { transform: 'translateX(150px)' } ], { duration: 50 });
              setTimeout(() => {
                  card.turning = false;
                  this.piles[4].cards.pop();
                  card.pileNr = 5;
                  this.piles[5].cards.push(card);
                  this.rechargePile(pileNr);
              }, 49);
          }
      }
  }


  cardClick(pileNr:number, card:Card) {
    console.log('clicked card = ', card);
    if (!card || !card.turned) {
      return;
    }

    for (let tryPileNr of [0,1,2,3,6,7,8,9,10,11,12]) {
        if (tryPileNr === pileNr) continue;
        const bottommostCard:Card = this.piles[tryPileNr].cards[this.piles[tryPileNr].cards.length - 1];
        console.log('candidate');
        if (!((tryPileNr < 4 && ((card.value === 1 && !bottommostCard) ||
                (bottommostCard && card.value === bottommostCard.value + 1 && card.type === bottommostCard.type) ))
              || (tryPileNr >= 6 && !bottommostCard && card.value === 13)
              || (tryPileNr >= 6 && (bottommostCard && (card.value === bottommostCard.value - 1) && card.blackType != bottommostCard.blackType)))) continue;
        console.log('Match gevonden');

        const pileElement = this.elementRef.nativeElement.querySelector('#pile-' + tryPileNr);

        const numberInPile:number = this.piles[pileNr].cards.indexOf(card);
        const cards:Card[] = [];
        let offset = 0;
        for (let movingCardId = numberInPile; movingCardId < this.piles[pileNr].cards.length; movingCardId++) {
            const c:Card = this.piles[pileNr].cards[movingCardId];
            cards.push(c);
            const cardElement = this.elementRef.nativeElement.querySelector('#card-' + c.id);
            const moveHorizontal:number = pileElement.offsetLeft - cardElement.getBoundingClientRect().left;
            const moveVertical:number = pileElement.offsetTop + (tryPileNr > 4 ? this.piles[tryPileNr].cards.length * 50 + 50*offset++: 0) - cardElement.getBoundingClientRect().top;
            cardElement.animate([{ transform: 'translate(' + moveHorizontal + 'px,' + moveVertical + 'px)'}], { duration: 200 });
        }
        setTimeout(() => {
            for (let c of cards) {
                this.piles[pileNr].cards.pop();
                c.pileNr = tryPileNr;
                this.piles[tryPileNr].cards.push(c);
            }

            // turn around next (most lowest) card of that pile.
            const nextCard = this.piles[pileNr].cards[this.piles[pileNr].cards.length - 1];
            // console.log(this.piles[pileNr].cards.length);
            // console.log(nextCard);
            if (nextCard && !nextCard.turned) {
                nextCard.turning = true;
                const flipCardElement = this.elementRef.nativeElement.querySelector('#card-' + nextCard.id);
                flipCardElement.animate([{transform: 'rotateY(180deg) '}, {transform: 'rotateY(0deg) '}], {duration: 200});
                setTimeout(() => {
                    nextCard.turned = true;
                    nextCard.turning = false;
                }, 190);
            }
        }, 190);
        break;
    }
  }

  turnCard(card:Card) {

      const cardElement = this.elementRef.nativeElement.querySelector('#card-' + card.id);
      console.log(cardElement.offsetLeft);
      cardElement.animate([{ transform: 'rotateY(0deg) ' } ], { duration: 400 });
      setTimeout(() => {
          card.turned = true;
      }, 400);
//      cardElement.animate([{ transform: 'rotateY(179.9deg)' } ], { duration: 4000 });
      // setTimeout(() => {
      //     card.turned = true;
      //     cardElement.animate([{ transform: 'translateX(-300px)' } ], { duration: 800 });
      //     setTimeout(() => {
      //         this.piles[5].cards.pop();
      //         this.piles[4].cards.push(card);
      //     }, 400);
      // }, 200);
      // setTimeout(() => {
      //
      //     setTimeout(() => {
      //         this.piles[5].cards.pop();
      //         this.piles[4].cards.push(card);
      //     }, 400);
      // });
  }
/*
    createCard(card:Card, pile:Pile, position:position) {
        card.pile = pile;
        card.position = position;
//        var cardElement = $('<div>').attr('id', card.id).addClass('card');
//        var innerCard = $('<div>').addClass('inner-card').css('color', card.type % 2 === 0 ? 'black' : 'red');
//        cardElement.removeClass(card.turned ? 'back' : 'front').addClass(card.turned ? 'front' : 'back');
        var cardTypes = ['♧', '♦', '♤', '♥'];
        var value = null;
        var icon = null
        switch (card.value) {
            case 1:
                value = 'A';
                break;
            case 11:
                value = 'J';
//				icon = card.type % 2 === 0 ? 'url(images/jack-black.png)' : 'url(images/jack-red.png)';
                break;
            case 12:
                value = 'Q';
                break;
            case 13:
                value = 'K';
                break;
            default:
                value = card.value;
        }
//        innerCard.append('<div class="card-text">' + value + ' ' + cardTypes[card.type] + '</div>');
        if (icon) {
//            const backgroundDiv = $('<div>').addClass('card-icon').css('background-image', icon);
//            innerCard.append(backgroundDiv);
        }
  //      cardElement.append(innerCard);
  //      cardElement.click(function () {
  //          cardClick(card);
  //      });

        return null;// cardElement;
    }
*/
}
