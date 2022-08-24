import {Component, ElementRef, OnInit} from '@angular/core';

interface Card {
    id:number;
    value:number;
    type:number;
    pile?:Pile;
    position?: position;
    turning: boolean;
    turned: boolean;
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
    cardTypes = ['♧', '♦', '♤', '♥'];
    cards:Card[] = [];
    spread:number[] = [];
    nr:number = 0;

    piles:Pile[] = [];// new Array(13).fill({cards: []});

  constructor(private elementRef: ElementRef) { }

  ngOnInit(): void {
    for (let p = 0; p < 13; p++) {
      this.piles.push({cards: []});
    }

      [0, 1, 2, 3].forEach((type:number) => {
          for (let value = 1; value <= 13; value++) {
              const id = this.nr++;
              this.cards.push({id: id, value: value, type: type, turning: false, turned: false});
              this.spread.push(this.cards.length - 1);
          }
      });

      // Shake and spread cards on the seven play-fields
      for (let pileNr = 6; pileNr <= 12; pileNr++) {
          for (let x = 1; x <= pileNr - 5; x++) {
              const spreadNr = Math.floor(Math.random() * this.spread.length);
              const card = this.cards[this.spread[spreadNr]];
              this.spread.splice(spreadNr, 1);
              card.turned = x === pileNr - 4;
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

  draaiom(card:Card) {
      card.turning = true;
      const flipCardElement = this.elementRef.nativeElement.querySelector('#card-' + card.id);
      flipCardElement.animate([{ transform: 'rotateY(180deg) '}, { transform: 'translateX(-150px)' } ], { duration: 500 });
      setTimeout(() => {
          card.turned = true;
          card.turning = false;
          this.piles[5].cards.pop();
          this.piles[4].cards.push(card);
      }, 490);
  }

  cardClick(pileNr:number, cardNr:number) {
      console.log(pileNr + '/' + cardNr);
    const card = this.cards.find(c => c.id == cardNr);
    if (!card || !card.turned) {
      return;
    }

    let searching:boolean = true;
    for (let tryPileNr = 0; searching && (tryPileNr < 4);tryPileNr++) {
      if (tryPileNr != pileNr) {
          const pileElement = this.elementRef.nativeElement.querySelector('#pile-' + tryPileNr);
          const cardElement = this.elementRef.nativeElement.querySelector('#card-' + card.id);
          const moveHorizontal:number = pileElement.offsetLeft - cardElement.offsetLeft;
          const moveVertical:number = pileElement.offsetTop - cardElement.offsetTop;
          cardElement.animate([{ transform: 'translate(' + moveHorizontal + 'px,' + moveVertical + 'px)'}], { duration: 500 });
          setTimeout(() => {
              this.piles[pileNr].cards.pop();
              this.piles[tryPileNr].cards.push(card);
          }, 500);
          searching = false;
      }
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
}
