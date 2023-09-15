class View {
  #playersContainer;
  #cardsContainer;
  #htmlGenerator;
  #listeners;
  #bottomPane;

  constructor({
    playersContainer,
    cardsContainer,
    bottomPane,
    generateElement
  }) {
    this.#playersContainer = playersContainer;
    this.#cardsContainer = cardsContainer;
    this.#htmlGenerator = generateElement;
    this.#bottomPane = bottomPane;
    this.#listeners = {};
  }

  addListener(eventName, callback) {
    this.#listeners[eventName] = callback;
  }

  #renderPlayerInfo({ name, id, character }) {
    const playerInfoElement = this.#htmlGenerator([
      "div",
      { class: "player-info", id: `player-${id}` },
      [
        ["div", { class: `icon ${character}`, id: `avatar-${id}` }, character],
        ["div", { class: "name" }, name],
        ["div", { class: "message hide", id: `message-${id}` }, []]
      ]
    ]);

    this.#playersContainer.appendChild(playerInfoElement);
  }

  #renderCard({ title }) {
    const cardElement = document.createElement("div");
    cardElement.classList.add("card");
    cardElement.innerText = title;

    this.#cardsContainer.appendChild(cardElement);
  }

  #arrangePlayers(players, playerId) {
    const indexOfPlayer = players.findIndex(({ id }) => id === playerId);
    const playersInOrder = players.slice(indexOfPlayer);
    playersInOrder.push(...players.slice(0, indexOfPlayer));

    return playersInOrder;
  }

  #createButton(value, id) {
    return this.#htmlGenerator([
      "input",
      {
        type: "button",
        id,
        value,
        class: "button"
      },
      []
    ]);
  }

  #deleteButton(buttonId) {
    const button = document.querySelector(`#${buttonId}`);
    if (!button) return;

    button.remove();
  }

  #renderBoard(svg) {
    const boardContainer = document.querySelector("#board");
    boardContainer.innerHTML = svg;
    const tileElements = boardContainer.querySelectorAll("rect");
    boardContainer.classList.add("disable-click");

    tileElements.forEach(tile => {
      tile.onclick = () => {
        this.#listeners.movePawn(tile.id);
      };
    });
  }

  #highlightCurrentPlayer(currentPlayerId) {
    const players = document.querySelectorAll(".icon");
    players.forEach(player => player.classList.remove("highlight"));

    const currentPlayer = document.querySelector(`#avatar-${currentPlayerId}`);
    currentPlayer.classList.add("highlight");
  }

  #isButtonPresent(buttonId) {
    return document.querySelector(`#${buttonId}`);
  }

  #renderEndTurnButton(isYourTurn) {
    if (!isYourTurn) {
      this.#deleteButton("end-turn-btn");
      return;
    }

    if (isYourTurn && this.#isButtonPresent("end-turn-btn")) return;

    const endTurnBtn = this.#createButton("End Turn", "end-turn-btn");

    endTurnBtn.onclick = () => {
      const { onEndTurn } = this.#listeners;
      onEndTurn();
    };

    this.#bottomPane.appendChild(endTurnBtn);
  }

  #renderAccuseButton(isYourTurn) {
    if (!isYourTurn) {
      this.#deleteButton("accuse-btn");
      return;
    }

    if (isYourTurn && this.#isButtonPresent("accuse-btn")) return;

    const accuseBtn = this.#createButton("Accuse", "accuse-btn");

    accuseBtn.onclick = () => {
      const { startAccusation } = this.#listeners;
      startAccusation();
    };

    this.#bottomPane.appendChild(accuseBtn);
  }

  #renderAccusationMessage(isYourTurn, isAccusing, currentPlayerId) {
    if (!isAccusing) return;
    if (isYourTurn) return;

    const accusingPlayer = document.querySelector(
      `#message-${currentPlayerId}`
    );
    accusingPlayer.classList.toggle("hide");
    accusingPlayer.innerText = "I am Accusing";
  }

  setupGame({ players, cards, playerId }, boardSvg) {
    this.#renderBoard(boardSvg);
    const playersInOrder = this.#arrangePlayers(players, playerId);
    const [firstPlayer] = playersInOrder;
    firstPlayer.name = firstPlayer.name + " (you)";

    playersInOrder.forEach(player => this.#renderPlayerInfo(player));
    cards.forEach(card => this.#renderCard(card));
  }

  disableMove() {
    const boardContainer = document.querySelector("#board");
    boardContainer.classList.add("disable-click");
  }

  enableMove() {
    const boardContainer = document.querySelector("#board");
    boardContainer.classList.remove("disable-click");
  }

  renderGameState(gameState) {
    const { isYourTurn, currentPlayerId, isAccusing, characterPositions } =
      gameState;
    this.#highlightCurrentPlayer(currentPlayerId);

    this.#renderAccusationMessage(isYourTurn, isAccusing, currentPlayerId);
    this.#renderEndTurnButton(isYourTurn);
    this.#renderAccuseButton(isYourTurn);
    if (isYourTurn) this.enableMove();
    this.#updateCharacterPositions(characterPositions);
  }

  setupAccuseDialog(cardsInfo) {
    console.log(cardsInfo);
  }

  #updateCharacterPositions(characterPositions) {
    Object.entries(characterPositions).forEach(([character, { x, y }]) => {
      const pawn = `${character}-pawn`;
      const previousPositionElement = document.querySelector(`.${pawn}`);
      previousPositionElement?.classList.remove(pawn);

      const currentPositionElement = document.getElementById(`${x},${y}`);
      currentPositionElement.classList.add(pawn);
    });
  }
}
