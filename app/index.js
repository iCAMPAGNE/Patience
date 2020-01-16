'use strict';

angular.module('Patience.app', ['ngRoute'])
.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: 'app/index.html?dev=' + Math.floor(Math.random() * 100),
    controller: 'IndexCtrl',
    controllerAs: 'vm'
  });
}])
.controller('IndexCtrl', ['$timeout', '$interval', '$route', function($timeout, $interval, $route) {
	var vm = this;
	
	vm.name = "Patience";
	
	$('.card').remove();
	
	var zIndex = 100;
	var cards = [];
	var spread = [];
	var nr = 0;
	// 0 = klaver, schoppen = 2, ruiten = 1, harten = 3
	[0, 2, 1, 3].forEach(function(type) {
		for (var value = 1; value <= 13; value++) {
			const id = nr++;
			cards.push({id: id, value: value, type: type, turned: false});
			spread.push(cards.length - 1);
		}
	});
	
	for (var pile = 5; pile <= 11; pile++) {
		for (var x = 1; x <= pile - 4; x++) {
			const playField = $('#pile-' + pile);
			const spreadNr = Math.floor(Math.random() * spread.length);
			const card = cards[spread[spreadNr]];
			spread.splice(spreadNr, 1);
			card.turned = x === pile - 4;
			var cardElement = createCard(card, pile, x).css('top', 2 * x + 14.5 + 'em');
			playField.append(cardElement);
		}
	}
	
	const playField = $('#pile-14');
	while (spread.length > 0) {
		const spreadNr = Math.floor(Math.random() * spread.length);
		const card = cards[spread[spreadNr]];
		spread.splice(spreadNr, 1);
		var cardElement = createCard(card, 14, spread.length).css('top', '1.5em').css('left', '61.5em').css('z-index', zIndex--);
		cardElement.css({'background-image': 'url(/images/card_back.png)'});
		$(document.body).append(cardElement);
	}
	
	vm.showButton = false;
	vm.buttonText = 'HOERA !!  U heeft gewonnen! Druk op de knop voor een nieuw spelletje.';
	vm.buttonAction = function() {
		$route.reload();
	}
	
	function rePile() {
		cards.forEach(function (pileCard) {
			if (pileCard.pile === 13) {
				pileCard.turned = false;
				moveCardToPile(pileCard, 14, 40 - pileCard.position);
			}
		});
		$('#pile-14').off('click');
	}
	
	function createCard(card, pile, position) {
		card.pile = pile;
		card.position = position;
		var cardElement = $('<div>').attr('id', card.id).addClass('card');
		cardElement.css({'background-image':  card.turned ? 'url(/images/card_' + card.id + '.png)' : 'url(/images/card_back.png)'});
		cardElement.click(function () {
			cardClick(card);
		});
		
		return cardElement;
	}
	
	function cardClick(card) {
		if (!card.turned && card.pile !== 14) {
			return; // Als kaart op rug ligt mag ie niet verplaats worden, behalve de stapel rechtsboven
		}
		findSpot(card, false);

		// Check if game is done
		var gameOver = true;
		cards.forEach(function (card) {
			if (card.pile >= 5 && card.pile <= 11 && !card.turned) {
				gameOver = false;
			}
		});
		if (gameOver) {
			var cardNr = 0;
			var cardMoved = false;
			var promise = $interval(function() {
				if (cardNr === 0) {
					cardMoved = false;
				}
				console.log(cardNr + ' ' + cardMoved);
				const card = cards[cardNr];
				cardNr++;
				if (card.pile >= 5 && card.pile <= 11) {
					var movableCard = true;
					for (var nr = 0; nr < 52; nr++) {
						if (cards[nr].pile === card.pile && cards[nr].position > card.position) {
							movableCard = false;
						}
					}
					if (movableCard) {
						if (findSpot(card, true)) {
							console.log('  card moved to pile ' + card.pile);
							cardMoved = true;
						}
					}
				}
				if (cardNr >= 52) {
					cardNr = 0;
					if (!cardMoved) {
						// Try turned-stock-card and get new ones if needed.
						var turnedStockCardSuccess = false;
						while (!turnedStockCardSuccess) {
							var turnedStockCard = findUpperCardOfPile(13);
							if (!turnedStockCard) {
								console.log('No turned cards in stock ');
								var stockCard = findUpperCardOfPile(14);
								if (!stockCard) {
									// Stock is completely empty, so we are done.
									console.log('GAME OVER');
									$interval.cancel(promise);
									turnedStockCardSuccess = true;
									vm.showButton = true;
									return;
								} else {
									console.log('Turns on stockCard ', stockCard);
									findSpot(stockCard);
									turnedStockCard = findUpperCardOfPile(13);
								}
							}
								
							if (findSpot(turnedStockCard, false)) {
								turnedStockCardSuccess = true;
							} else {
								console.log('turned stock card could not be placed. ', turnedStockCard);
								var stockCard = findUpperCardOfPile(14);
								if (!stockCard) {
									rePile();
									stockCard = findUpperCardOfPile(14);
									console.log('Repiled ' + stockCard);
								}
								findSpot(stockCard);
							}								
						}
					}
				}
			}, 10);
		}
	}
	
	function findSpot(card, finalPilesOnly) {
		var replaced = false;

		if (card.pile === 14) { // Card is on stock-pile
			card.turned = true;
			var position = 1; // Bepaal hoeveel kaarten er al omgedraaid zijn.
			cards.forEach(function (pileCard) {
				if (pileCard.pile === 13) {
					position++;
				}
			});
			moveCardToPile(card, 13, position);
			replaced = true;

			var leeg = true;
			cards.forEach(function (pileCard) {
				if (pileCard.pile === 14) {
					leeg = false;
				}
			});
			if (leeg) {
				$timeout(function() {
					$('#pile-14').click(function () {
						rePile();
					});
				}, 0);
			}
		} else {
			var pile = 1;
			while (!replaced && pile <= 11) {
				var upperCard = null;
				cards.forEach(function (pileCard) { // Find card on top for this pile
					if (pileCard.pile === pile && (!upperCard || pileCard.position > upperCard.position)) {
						upperCard = pileCard;
					}
				});
				// First check match for final (first four) piles. Value and type should match.
				if (pile <= 4 && ((!upperCard && card.value === 1) || (upperCard && upperCard.value === card.value - 1 && upperCard.type === card.type))) {
					replaced = true;
					
					cards.forEach(function (pileCard) {
						if (pileCard.pile === card.pile && pileCard.position > card.position && pileCard.turned) {
							replaced = false; // Final piles can only have one card at the time
						}
					});
				}
				// Then check match for working piles (<= 7) Value and color should match.
				if (!finalPilesOnly && pile > 4 && pile <= 11 && ((!upperCard && card.value === 13) || 
						(upperCard && upperCard.value === card.value + 1 && upperCard.type % 2 != card.type % 2))) {
					replaced = true;
				}
				if (replaced) {
					cards.forEach(function (pileCard) {
						if (pileCard.pile === card.pile && pileCard.position === card.position - 1) {
							pileCard.turned = true;
							var pileCardElement = $('#' + pileCard.id);
							$timeout(function () { // Turning has to wait until card has been moved.
								pileCardElement.css({'background-image': 'url(/images/card_' + pileCard.id + '.png)'});
							}, 1000);
						}
						if (card.pile > 4 && card.pile < 12 && pileCard.pile === card.pile && pileCard.position > card.position) {
							const pos = pileCard.position;
							moveCardToPile(pileCard, pile, pos - card.position + (!!upperCard ? upperCard.position + 1 : 1));
						}
					});
					moveCardToPile(card, pile, !!upperCard ? upperCard.position + 1 : 1);
				}
				pile++;
			}
		}
		if (!replaced) {
			$('#' + card.id).effect('shake');
		}
		return replaced;
	}
	
	function moveCardToPile(card, pile, position) {
		var pileOffset = 0;
		card.pile = pile;
		card.position = position;
		if (pile !== 13) {
			pileOffset = card.position;
		}
		const cardElement = $('#' + card.id);
		var left = card.pile <= 4 ? card.pile - 1 : card.pile >= 13 ? card.pile - 8 : card.pile - 5;
//		cardElement.css('left', 10 * left + 1.5 + 'em');
//		cardElement.css('top', 2 * (pile > 4 && pile < 12 ? pileOffset - 5 : 0) + (pile > 4 && pile < 12 ? 26 : 1.5) + 'em');
		cardElement.animate({zIndex: 1000});
		cardElement.animate({left: 10 * left + 1.5 + 'em', top: 2 * (pile > 4 && pile < 12 ? pileOffset - 5 : 0) + (pile > 4 && pile < 12 ? 24.5 : 1.5) + 'em'});
//		cardElement.css('z-index', position + 1);
		cardElement.animate({zIndex: position + 1});
//		cardElement.css('background-color', card.turned ? '#DDFFEE' : '#448888');
		cardElement.css({'background-image':  card.turned ? 'url(/images/card_' + card.id + '.png)' : 'url(/images/card_back.png)'});
	}
	
	function findUpperCardOfPile(pile) {
		var cardOnTop = null;
		cards.forEach(function (card) {
			if (card.pile === pile && (pile === 14 || card.turned) && (cardOnTop == null || card.position > cardOnTop.position)) {
				cardOnTop = card;
			}
		});
		return cardOnTop;
	} 
}]);
