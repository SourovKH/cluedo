const main = () => {
  const cardsContainer = document.querySelector("#cards");
  const playersContainer = document.querySelector("#players");
  const bottomPane = document.querySelector("#bottom-pane");
  const middlePane = document.querySelector("#middle-pane");
  const resultContainer = document.querySelector(".result-container");

  const gameService = new GameService();
  const view = new View({
    playersContainer,
    cardsContainer,
    bottomPane,
    middlePane,
    resultContainer,
    generateElement
  });

  const gameController = new GameController(gameService, view);

  gameController.start();
};

window.onload = main;
