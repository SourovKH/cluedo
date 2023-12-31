const isSameString = (a, b) => a.toLowerCase() === b.toLowerCase();

class PopupView {
  #middlePane;
  #htmlGenerator;
  #listeners;
  #notificationContainer;
  #resultContainer;

  constructor({ middlePane, generateElement }) {
    this.#middlePane = middlePane;
    this.#htmlGenerator = generateElement;
    this.#listeners = {};
  }

  addListener(eventName, listener) {
    this.#listeners[eventName] = listener;
  }

  notifyPlayerStranded(accuserName, accusationCombination) {
    const message = this.#createGameOverMsg(`${accuserName} Stranded!!`);
    const forMessage = this.#createGameOverMsg("For Accusing...");

    const accusedCards = this.#createCardElements(accusationCombination);
    const cardsContainer = this.#createCardsContainer("accusation-combination");
    cardsContainer.append(...accusedCards);

    this.#notificationContainer.replaceChildren(
      message,
      forMessage,
      cardsContainer
    );
    this.#notificationContainer.showModal();

    setTimeout(() => {
      this.#notificationContainer.close();
    }, 3000);
  }

  #createCardElement(title) {
    const cardTitle = `${title}-card`.toLowerCase().replaceAll(" ", "-");

    return this.#htmlGenerator([
      "div",
      { class: `card ${cardTitle}`, value: title },
      ""
    ]);
  }

  #createMessageElement(message) {
    return this.#htmlGenerator([
      "h3",
      { id: "accusation-result-message" },
      message
    ]);
  }

  #createCardElements({ weapon, room, suspect }) {
    const roomCard = this.#createCardElement(room);
    const suspectCard = this.#createCardElement(suspect);
    const weaponCard = this.#createCardElement(weapon);

    return [roomCard, suspectCard, weaponCard];
  }

  #createCardsContainer(id) {
    return this.#htmlGenerator(["div", { id }, []]);
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

  #createOptionElement(option) {
    return this.#htmlGenerator(["option", { value: option }, option]);
  }

  #createSelectElement(name, id, options) {
    const selectElement = this.#htmlGenerator([
      "select",
      { name, id, required: "true" },
      [["option", { value: "", default: "true", hidden: "true" }, name]]
    ]);
    const optionElements = options.map(option =>
      this.#createOptionElement(option)
    );
    selectElement.append(...optionElements);

    return selectElement;
  }

  #createAndAddSelections(selectionContainer, cardsInfo) {
    const { weapon, room, suspect } = cardsInfo;
    const selectWeaponElement = this.#createSelectElement(
      "weapons",
      "select-weapon",
      weapon
    );

    const selectRoomElement = this.#createSelectElement(
      "rooms",
      "select-room",
      room
    );

    const selectSuspectElement = this.#createSelectElement(
      "suspects",
      "select-suspect",
      suspect
    );

    selectionContainer.append(
      selectRoomElement,
      selectSuspectElement,
      selectWeaponElement
    );
  }

  #readFormData(form) {
    const room = form.querySelector("#select-room").value;
    const weapon = form.querySelector("#select-weapon").value;
    const suspect = form.querySelector("#select-suspect").value;

    return { room, weapon, suspect };
  }

  #createAccuseDialogFrame() {
    return this.#htmlGenerator([
      "dialog",
      { id: "accusation-popup", class: "popup" },
      [
        ["h3", { class: "popup-header" }, "Select Accusation Combination"],
        [
          "form",
          { id: "accuse-form" },
          [
            ["div", { class: "selections" }, []],
            [
              "div",
              { id: "buttons" },
              [
                [
                  "button",
                  {
                    type: "cancel",
                    id: "accuse-cancel-btn",
                    class: "button"
                  },
                  "Cancel"
                ],
                [
                  "button",
                  {
                    value: "default",
                    id: "accuse-confirm-btn",
                    class: "button",
                    disabled: true
                  },
                  "Confirm"
                ]
              ]
            ]
          ]
        ]
      ]
    ]);
  }

  #enableConfirmBtn(requiredFields, confirmBtn) {
    const isValid = [...requiredFields].every(field => field.value !== "");
    confirmBtn.disabled = !isValid;
  }

  #setupAccusationForm(accusationForm, cancelBtn, dialog, confirmBtn) {
    accusationForm.onsubmit = event => {
      event.preventDefault();
      const accusationCombination = this.#readFormData(accusationForm);
      const { accuse } = this.#listeners;

      accuse(accusationCombination);
      dialog.close();
    };

    cancelBtn.onclick = event => {
      event.preventDefault();
      const { cancelAccusation } = this.#listeners;
      accusationForm.reset();
      confirmBtn.disabled = true;
      cancelAccusation();
      dialog.close();
    };

    const requiredFields = accusationForm.getElementsByTagName("select");
    [...requiredFields].forEach(field => {
      field.onchange = () => this.#enableConfirmBtn(requiredFields, confirmBtn);
    });
  }

  #createAccuseDialog(cardsInfo) {
    const dialog = this.#createAccuseDialogFrame();
    const selections = dialog.querySelector(".selections");
    const accusationForm = dialog.querySelector("#accuse-form");
    const cancelBtn = dialog.querySelector("#accuse-cancel-btn");
    const confirmBtn = dialog.querySelector("#accuse-confirm-btn");

    this.#createAndAddSelections(selections, cardsInfo);
    this.#setupAccusationForm(accusationForm, cancelBtn, dialog, confirmBtn);

    return dialog;
  }

  setupAccuseDialog(cardsInfo) {
    const accuseDialog = this.#createAccuseDialog(cardsInfo);
    accuseDialog.oncancel = event => {
      event.preventDefault();
    };
    this.#middlePane.append(accuseDialog);
  }

  renderAccusationResult({ killingCombination, isWon }) {
    const winningMessage = "You Successfully Solved the Murder Mystery";
    const wrongAccusationMessage = "Your Accusation was Wrong";
    const message = isWon ? winningMessage : wrongAccusationMessage;

    const secretCards = this.#createCardElements(killingCombination);
    const cardsContainer = this.#createCardsContainer("killing-combination");
    cardsContainer.append(...secretCards);
    const resultMessage = this.#createMessageElement(message);
    const closeButton = this.#createButton(
      "Close",
      "accusation-result-close-btn"
    );

    closeButton.onclick = () => {
      const accuseButton = document.querySelector("#accuse-btn");
      accuseButton?.remove();
      this.#resultContainer.close();
      const { renderEndTurnButton } = this.#listeners;
      renderEndTurnButton();
    };

    this.#resultContainer.append(resultMessage, cardsContainer, closeButton);
    this.#resultContainer.showModal();
  }

  #createSuspectDialogFrame() {
    return this.#htmlGenerator([
      "dialog",
      { id: "suspicion-popup", class: "popup" },
      [
        ["h3", { class: "popup-header" }, "Select Suspicion Combination"],
        [
          "form",
          { id: "suspect-form" },
          [
            ["div", { class: "selections" }, []],
            [
              "div",
              { id: "buttons" },
              [
                [
                  "button",
                  {
                    value: "default",
                    id: "suspect-confirm-btn",
                    class: "button",
                    disabled: true
                  },
                  "Confirm"
                ]
              ]
            ]
          ]
        ]
      ]
    ]);
  }

  #setupSuspicionForm(suspicionForm, dialog, confirmBtn) {
    suspicionForm.onsubmit = event => {
      event.preventDefault();
      const suspicionCombination = this.#readFormData(suspicionForm);
      this.#listeners.suspect(suspicionCombination);
      dialog.close();
    };

    const requiredFields = suspicionForm.getElementsByTagName("select");
    [...requiredFields].forEach(field => {
      field.onchange = () => this.#enableConfirmBtn(requiredFields, confirmBtn);
    });
  }

  #createSuspicionDialog(room, cardsInfo) {
    const dialog = this.#createSuspectDialogFrame();
    const selections = dialog.querySelector(".selections");
    const suspicionForm = dialog.querySelector("#suspect-form");
    const weapon = cardsInfo.weapon;
    const suspect = cardsInfo.suspect;
    this.#createAndAddSelections(selections, { weapon, suspect, room: [room] });
    const confirmBtn = suspicionForm.querySelector("#suspect-confirm-btn");
    this.#setupSuspicionForm(suspicionForm, dialog, confirmBtn);

    dialog.oncancel = event => event.preventDefault();

    return dialog;
  }

  #createSuspicionPromptFrame() {
    return this.#htmlGenerator([
      "dialog",
      { id: "suspicion-prompt", class: "popup result-container" },
      [
        ["h3", { class: "popup-header" }, "Do you want to Suspect?"],
        [
          "div",
          { id: "suspicion-prompt-btns" },
          [
            [
              "button",
              {
                value: "default",
                id: "suspicion-prompt-yes-btn",
                class: "button"
              },
              "Yes"
            ],
            [
              "button",
              {
                value: "default",
                id: "suspicion-prompt-no-btn",
                class: "button"
              },
              "No"
            ]
          ]
        ]
      ]
    ]);
  }

  renderSuspicionDialog({ room, canSuspect, cardsInfo }) {
    if (room && canSuspect) {
      const suspicionDialog = this.#createSuspicionDialog(room, cardsInfo);
      const roomSelector = suspicionDialog.querySelector("#select-room");
      roomSelector.value = room;
      roomSelector.setAttribute("disabled", true);
      this.#listeners.removeRollDiceButton();
      this.#middlePane.append(suspicionDialog);
      suspicionDialog.showModal();
    }
  }

  #createSuspicionPromptDialog(suspicionPromptDetails) {
    const dialog = this.#createSuspicionPromptFrame();
    const yesBtn = dialog.querySelector("#suspicion-prompt-yes-btn");
    const noBtn = dialog.querySelector("#suspicion-prompt-no-btn");

    yesBtn.onclick = () => {
      dialog.close();
      this.#listeners.startSuspicion();
      this.#listeners.removeRollDiceButton();
      this.#listeners.renderEndTurnButton();
      this.renderSuspicionDialog(suspicionPromptDetails);
    };

    noBtn.onclick = () => {
      this.#listeners.denySuspicion();
      dialog.close();
    };

    dialog.oncancel = event => {
      event.preventDefault();
    };

    return dialog;
  }

  renderSuspicionPrompt({ room, canSuspect, cardsInfo }) {
    const suspicionPrompt = this.#middlePane.querySelector("#suspicion-prompt");
    const dialog = this.#createSuspicionPromptDialog({
      room,
      canSuspect,
      cardsInfo
    });

    if (room && canSuspect) {
      if (!suspicionPrompt) {
        this.#middlePane.append(dialog);
        dialog.showModal();
        return;
      }
      this.#middlePane.removeChild(suspicionPrompt);
      this.#middlePane.append(dialog);
      dialog.showModal();
    }
  }

  #createWaitingMessageElement() {
    const messageElementTemplate = [
      "div",
      { id: "waiting-msg" },
      [
        ["p", {}, "Waiting for Invalidation"],
        ["span", { class: "loader" }, ""]
      ]
    ];

    return this.#htmlGenerator(messageElementTemplate);
  }

  renderSuspicionCombination({
    suspectorName,
    suspicionCombination,
    canInvalidate,
    matchingCards,
    canAnyoneInvalidate
  }) {
    this.#notificationContainer.oncancel = event => event.preventDefault();

    const message = this.#createGameOverMsg(`${suspectorName} Suspected`);
    let waitingMsg = this.#createWaitingMessageElement();

    const cardTitles = (matchingCards || []).map(({ title }) => title);
    const suspectedCards = this.#createCardElements(suspicionCombination);
    const cardsContainer = this.#createCardsContainer("suspicion-combination");
    this.#notificationContainer.replaceChildren(message);

    let confirmBtn = "";
    let invalidationMsg = "";

    if (!canAnyoneInvalidate) {
      invalidationMsg = this.#htmlGenerator(["p", {}, "None invalidated"]);
      waitingMsg = "";
      confirmBtn = this.#createButton("Close", "suspicion-close-btn");
      confirmBtn.onclick = () => this.#notificationContainer.close();
    }

    if (canInvalidate) {
      waitingMsg = "";
      confirmBtn = this.#createButton("Confirm", "invalidation-confirm-btn");
      invalidationMsg = this.#htmlGenerator([
        "p",
        {},
        "Select a card to invalidate"
      ]);

      suspectedCards.forEach(cardElement => {
        const cardTitle = cardElement.getAttribute("value");
        cardElement.classList.add("not-matching-card");

        if (cardTitles.includes(cardTitle)) {
          cardElement.classList.add("matching-card");
          cardElement.classList.remove("not-matching-card");

          cardElement.onclick = () => {
            invalidationMsg.innerText = `You are invalidating ${cardTitle.toUpperCase()}`;
            const selectedCardElem = suspectedCards.find(cardElem =>
              cardElem.classList.contains("card-selected")
            );
            selectedCardElem?.classList.remove("card-selected");
            cardElement.classList.add("card-selected");

            confirmBtn.classList.add("selected-btn");
            confirmBtn.onclick = () => {
              this.#listeners.invalidateCard(cardTitle);
              this.#notificationContainer.close();
            };
          };
        }
      });
    }

    cardsContainer.append(...suspectedCards);
    this.#notificationContainer.append(
      cardsContainer,
      waitingMsg,
      invalidationMsg,
      confirmBtn
    );
    this.#notificationContainer.showModal();
  }

  #findCardWithTitle(cardTitle = "") {
    const cards = this.#notificationContainer.querySelectorAll(".card");
    return [...cards].find(cardElem =>
      isSameString(cardElem.getAttribute("value"), cardTitle)
    );
  }

  renderInvalidation(invalidatorName, invalidatedCardTitle, isYourTurn) {
    const waitingMsg = document.querySelector("#waiting-msg");
    waitingMsg?.remove();

    let invalidationMsg = `${invalidatorName} invalidated`;
    invalidationMsg += isYourTurn ? invalidatedCardTitle : "";

    const invalidationMsgElem = this.#htmlGenerator(["p", {}, invalidationMsg]);

    const cardElement = this.#findCardWithTitle(invalidatedCardTitle);
    cardElement?.classList.add("invalidated-card");

    const closeBtn = this.#createButton("Close", "notification-close-btn");
    closeBtn.onclick = () => this.#notificationContainer.close();

    this.#notificationContainer.append(invalidationMsgElem, closeBtn);
  }

  #createGameOverMsg(message) {
    return this.#htmlGenerator(["h3", { class: "game-over-msg" }, message]);
  }

  #createHomeBtn() {
    const btn = this.#createButton("Play Again", "home");
    btn.onclick = () => this.#listeners.playAgain();
    return btn;
  }

  #displayAllPlayersStranded(killingCombination) {
    const message = this.#createGameOverMsg("All Players stranded");
    const secretCards = this.#createCardElements(killingCombination);
    const cardsContainer = this.#createCardsContainer("killing-combination");
    cardsContainer.append(...secretCards);
    const btn = this.#createHomeBtn();
    this.#resultContainer.replaceChildren(message, cardsContainer, btn);
    this.#resultContainer.showModal();
  }

  #displayWinner(playerName, killingCombination) {
    const message = this.#createGameOverMsg(`${playerName} Won!!`);
    const killingCombinationMsg = this.#createGameOverMsg(
      "Killing Combination is..."
    );
    const btn = this.#createHomeBtn();
    const secretCards = this.#createCardElements(killingCombination);
    const cardsContainer = this.#createCardsContainer("killing-combination");
    cardsContainer.append(...secretCards);
    this.#resultContainer.replaceChildren(
      message,
      killingCombinationMsg,
      cardsContainer,
      btn
    );
    this.#resultContainer.showModal();
  }

  displayGameOver({
    isYourTurn,
    isGameWon,
    playerNames,
    currentPlayerId,
    killingCombination
  }) {
    if (isYourTurn) {
      return setTimeout(() => {
        if (!isGameWon)
          return this.#displayAllPlayersStranded(killingCombination);
        this.#displayWinner(playerNames[currentPlayerId], killingCombination);
      }, 2000);
    }

    if (!isGameWon) return this.#displayAllPlayersStranded(killingCombination);
    this.#displayWinner(playerNames[currentPlayerId], killingCombination);
  }

  closeNotificationDialog() {
    this.#notificationContainer.replaceChildren();
    this.#notificationContainer.close();
  }

  setup() {
    this.#resultContainer = this.#middlePane.querySelector("#result-container");
    this.#notificationContainer = this.#middlePane.querySelector(
      "#notification-container"
    );
  }

  removeAllPopups() {
    const popups = this.#middlePane.querySelectorAll(".popup");
    popups.forEach(popup => popup.close());
  }
}
