//PubSub module to allow modules to talk to eachother
const pubsub = (() => {
    let events = {};

    const subscribe = (eventName, fn) => {
        events[eventName] ? events[eventName].push(fn) : 
                events[eventName] = [fn];
    }

    const unsubscribe = (eventName, fn) => {
        indexToRemove = events[eventName].indexOf(fn);
        if (indexToRemove > -1) events[eventName].splice(indexToRemove, 1);
    }

    const publish = (eventName, data) => {
        if (events[eventName]) events[eventName].forEach(func => func(data));
        }

    return {subscribe, unsubscribe, publish}
})();

//Module that checks for win and displays results
const gameControl = (() => {

    const _results = document.querySelector(`#results`);
    const _xPlayer = document.querySelector(`#x-player`);
    const _oPlayer = document.querySelector(`#o-player`);
    const _resultsContainer = document.querySelector(`.results-container`);
    const _pageMask = document.querySelector(`#page-mask`);

    let winConditions = [[0, 1, 2], [3, 4, 5], [6, 7, 8], 
                        [0, 3, 6], [1, 4, 7], [2, 5, 8],
                        [0, 4, 8], [2, 4, 6]];

    let winner = ``;

    const checkScore = (gameArrayLocal) => {
        winner = `none`;
        winConditions.every(win => {
            if ((gameArrayLocal[win[0]] == 'X') && 
                    (gameArrayLocal[win[1]] == 'X') && 
                    (gameArrayLocal[win[2]] == 'X')) {
                winner = _xPlayer.innerHTML;
                return false;
            }

            else if ((gameArrayLocal[win[0]] == 'O') && 
                    (gameArrayLocal[win[1]] == 'O') && 
                    (gameArrayLocal[win[2]] == 'O')) {
                winner = _oPlayer.innerHTML;
                return false;
            }
            else {
                return true;
            }
        });
        if (winner === `none` && !gameArrayLocal.find(element => 
                    element === ` `)) winner = `tie`;
        _displayResults(winner);
        console.log(winner)
        pubsub.publish(`scoreChecked`, winner);
    }

    const _displayResults = () => {

        if (winner !== `none`) {
            (winner === `tie`) ? 
                _results.innerHTML = `It's a Tie!`:
                _results.innerHTML = `${winner} Wins!`;
            _resultsContainer.style.display = `flex`;
            _pageMask.style.display = `block`;
        }
    }

    pubsub.subscribe(`boardChanged`, checkScore);
    return {winner};
})();

//Module that accepts gameplay inputs and renders the board
const boardMaker = (() => {
    const grids = document.querySelectorAll(`.grid`);
    const xPlayerContainer = document.querySelector(`#x-player-container`);
    const oPlayerContainer = document.querySelector(`#o-player-container`);
    
    let gameArray = [` `,` `,` `,` `,` `,` `,` `,` `,` `];
    let whoGoesFirst = `X`;
    let activePlayer = `X`;

    const _createListeners = () => {
        for (let i=0; i<grids.length; i++) {
            grids[i].addEventListener(`click`, (event) => changeGameArray(event));
        }
    }

    const resetArray = () => {
        gameArray = [` `,` `,` `,` `,` `,` `,` `,` `,` `];
        renderBoard();
    }

    const renderBoard = () => {
        for (let i=0; i<grids.length; i++) {
            grids[i].innerHTML = gameArray[i]
        }
        pubsub.publish(`boardChanged`, gameArray);
    }

    const changeGameArray = (event) => {
        if (event.target.innerHTML === ` `) {
        let targetIndex = event.target.getAttribute(`id`).slice(4);
        gameArray[targetIndex] = activePlayer;
        renderBoard();
        }
        else return;
    }

    const changePlayer = (winner) => {
        if (!gameArray.find(element => (element === `X` || element === `O`))) {
            activePlayer = whoGoesFirst;
            (whoGoesFirst === `X`) ? whoGoesFirst = `O` : whoGoesFirst = `X`;
        }
        if (activePlayer === `X`) {
            activePlayer = `O`;
            oPlayerContainer.classList.add(`active-player`);
            xPlayerContainer.classList.remove(`active-player`);
            pubsub.publish(`player2Turn`, [gameArray, winner]);
        }
        else {
            activePlayer = `X`;
            xPlayerContainer.classList.add(`active-player`);
            oPlayerContainer.classList.remove(`active-player`);
        }
    }

    _createListeners();
    pubsub.subscribe(`newGame`, resetArray);
    pubsub.subscribe(`scoreChecked`, changePlayer);
    return {renderBoard}
})();

//Module that allows player(s) to choose names or select AI opponent
const gameSetup = (() => {
    const _player1 = document.querySelector(`#player-1`);
    const _player2 = document.querySelector(`#player-2`);
    const _aiOpponent = document.querySelector(`#ai-opponent`);
    const _letsPlay = document.querySelector(`#lets-play`);
    const _pageMask = document.querySelector(`#page-mask`);
    const _formContainer = document.querySelector(`.form-container`);
    const _xPlayer = document.querySelector(`#x-player`);
    const _oPlayer = document.querySelector(`#o-player`);
    const _playAgain = document.querySelector(`#play-again`);
    const _resultsContainer = document.querySelector(`.results-container`);

    const _setupGame = () => {
        
        _pageMask.style.display = `none`;
        _formContainer.style.display = `none`;
        _resultsContainer.style.display = `none`;
        //if value exists, set as value; otherwise set as defaults.
        _player1.value ? _xPlayer.innerHTML = _player1.value : 
                _xPlayer.innerHTML = `Player 1`;
        _player2.value ? _oPlayer.innerHTML = _player2.value : 
                _oPlayer.innerHTML = `Player 2`;
        pubsub.publish(`newGame`, []);
    }
    
    const _addAiOpponent = () => {
        if (_aiOpponent.checked) {
            _player2.value = `AI`;
            _player2.disabled = true;
        }
        else {
            _player2.value = ``;
            _player2.disabled = false;
        }
    }

    _letsPlay.addEventListener(`click`, _setupGame);
    _aiOpponent.addEventListener(`click`, _addAiOpponent);
    _playAgain.addEventListener(`click`, _setupGame);

    return{};

})();

const aiPlay = (() => {

    const _oPlayer = document.querySelector(`#o-player`);

    const disableClicks = (event) => {
        event.stopPropagation();
        event.preventDefault();
    }

    const makePlay = ([gameArray, winner]) => {
        if (_oPlayer.innerHTML == `AI`) {


            if (gameArray.find(element => element === ` `) && 
                    winner === `none`) {            
                document.addEventListener(`click`, disableClicks, true);
                let i = true;
                while (i == true) {
                    let aiPlayGuess = Math.floor(Math.random() * 
                            gameArray.length);
                    if (gameArray[aiPlayGuess] === ` `) {
                        setTimeout(() => {
                            document.removeEventListener(`click`, disableClicks, true);
                            document.querySelector(`#grid${aiPlayGuess}`).click();
                        }, 1000);
                        i = false;
                    }
                }
            }         
        }
    }

   pubsub.subscribe(`player2Turn`, makePlay);
   pubsub.subscribe('newGAme', makePlay);

})();

boardMaker.renderBoard();
