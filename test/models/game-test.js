const { describe, it } = require("node:test");
const assert = require("assert");
const Game = require("../../src/models/game");
const Board = require("../../src/models/board");
const rooms = require("../../resources/rooms.json");
const validTiles = require("../../resources/valid-tiles.json");

describe("Game", () => {
  describe("start", () => {
    it("should start the game", context => {
      const players = {
        add: context.mock.fn(),
        info: context.mock.fn(() => "Mock Data"),
        getCharacterPositions: context.mock.fn(),
        getNextPlayer: context.mock.fn(() => ({
          info: () => ({ id: 1 })
        }))
      };

      const game = new Game({ players });

      game.start();

      const expectedGameStatus = {
        action: null,
        currentPlayerId: 1,
        isGameOver: false
      };

      assert.deepStrictEqual(game.state(), expectedGameStatus);
    });
  });

  describe("getCardsOfPlayer", () => {
    it("should give the cards of player with given id", context => {
      const player = {
        info: context.mock.fn(() => ({ cards: [] }))
      };
      const players = {
        findPlayer: context.mock.fn(() => player)
      };

      const game = new Game({ players });

      assert.deepStrictEqual(game.getCardsOfPlayer(1), []);
    });
  });

  describe("state", () => {
    it("Should give the current game state", context => {
      const player = {
        info: context.mock.fn(() => ({ id: 1 }))
      };
      const players = {
        getNextPlayer: context.mock.fn(() => player),
        getCharacterPositions: () => {},
        info: context.mock.fn(() => ({ id: 1 }))
      };
      const game = new Game({ players });

      game.start();

      assert.strictEqual(game.state().currentPlayerId, 1);
    });
  });

  describe("change turn", () => {
    it("should change the current player to the next player", context => {
      const player = {
        info: context.mock.fn(() => ({ id: 1 }))
      };

      const players = {
        getNextPlayer: context.mock.fn(() => player),
        getCharacterPositions: () => {},
        info: context.mock.fn(() => ({ id: 1 }))
      };

      const game = new Game({ players });

      game.start();
      game.changeTurn();

      assert.deepStrictEqual(game.state().currentPlayerId, 1);
    });
  });

  describe("toggleIsAccusing", () => {
    it("should toggle the isAccusing status", context => {
      const game = new Game({
        players: {
          getCharacterPositions: () => {},
          info: context.mock.fn(() => [])
        }
      });

      game.toggleIsAccusing();

      assert.strictEqual(game.state().action, "accusing");
    });
  });

  describe("validateAccuse", () => {
    it("should declare the winner and end the game as combination matches", context => {
      const killingCombination = {
        weapon: "dagger",
        room: "lounge",
        suspect: "mustard"
      };

      const game = new Game({
        players: {
          getCharacterPositions: () => {},
          strandPlayer: () => {},
          info: context.mock.fn(() => [])
        },
        killingCombination
      });

      const expectedAccusationResult = {
        killingCombination: {
          weapon: "dagger",
          room: "lounge",
          suspect: "mustard"
        },
        isGameWon: true
      };

      const playerId = 1;
      game.validateAccuse(playerId, {
        weapon: "dagger",
        room: "lounge",
        suspect: "mustard"
      });
      assert.deepStrictEqual(game.getGameOverInfo(), expectedAccusationResult);
    });

    it("should make the player stranded as the combination is wrong", context => {
      const killingCombination = {
        weapon: "dagger",
        room: "lounge",
        suspect: "plum"
      };

      const game = new Game({
        players: {
          getCharacterPositions: () => {},
          info: context.mock.fn(() => []),
          strandPlayer: context.mock.fn()
        },
        killingCombination
      });

      const playerId = 1;
      const playerAccusation = { ...killingCombination, suspect: "mustard" };
      const accusationResult = game.validateAccuse(playerId, playerAccusation);

      const expectedAccusationResult = {
        isWon: false,
        killingCombination: {
          weapon: "dagger",
          room: "lounge",
          suspect: "plum"
        }
      };

      assert.deepStrictEqual(accusationResult, expectedAccusationResult);
    });
  });

  describe("getLastAccusationCombination", () => {
    it("Should give the accusation combination of last validation", context => {
      const killingCombination = {
        weapon: "dagger",
        room: "lounge",
        suspect: "plum"
      };

      const game = new Game({
        players: {
          getCharacterPositions: () => {},
          strandPlayer: () => {},
          info: context.mock.fn(() => [])
        },
        killingCombination
      });

      const accusingCombination = {
        weapon: "dagger",
        room: "lounge",
        suspect: "plum"
      };

      game.validateAccuse(1, accusingCombination);

      assert.deepStrictEqual(
        game.getLastAccusationCombination(),
        accusingCombination
      );
    });
  });

  describe("getLastSuspicionCombination", () => {
    it("Should give the suspicion combination of last validation", context => {
      const game = new Game({
        players: {
          getCharacterPositions: () => {},
          strandPlayer: () => {},
          info: context.mock.fn(() => [])
        }
      });

      const suspicionCombination = {
        weapon: "dagger",
        room: "lounge",
        suspect: "plum"
      };

      game.validateSuspicion(1, suspicionCombination);

      assert.deepStrictEqual(
        game.getLastSuspicionCombination(),
        suspicionCombination
      );
    });
  });

  describe("setAction", () => {
    it("Should set Action of game", () => {
      const game = new Game({});
      game.setAction("mockAction");

      assert.strictEqual(game.state().action, "mockAction");
    });
  });

  describe("getCharacterPositions", () => {
    it("Should give the current positions of all characters", context => {
      const getCharacterPositions = context.mock.fn(() => ({}));
      const players = { getCharacterPositions };
      const game = new Game({ players });

      assert.deepStrictEqual(game.getCharacterPositions(), {});
    });
  });

  describe("getLastDiceCombination", () => {
    it("Should give the last dice combination", () => {
      const game = new Game({});
      game.updateDiceCombination([4, 4]);

      assert.deepStrictEqual(game.getLastDiceCombination(), [4, 4]);
    });
  });

  describe("playersInfo", () => {
    it("Should give the players info", context => {
      const players = {
        info: context.mock.fn(() => "mockData"),
        getCharacterPositions: context.mock.fn(() => "mockData")
      };

      const game = new Game({ players });
      const expectedPlayerInfo = {
        players: "mockData",
        currentPlayerId: null,
        strandedPlayerIds: [],
        canAccuse: true,
        shouldEndTurn: false,
        characterPositions: "mockData",
        diceRollCombination: [0, 0],
        canRollDice: true,
        canMovePawn: false,
        isSuspecting: false
      };

      assert.deepStrictEqual(game.playersInfo(), expectedPlayerInfo);
    });
  });

  describe("findPossiblePositions", () => {
    it("Should give all the possible possitions based on the step", context => {
      const players = {
        info: context.mock.fn(() => "mockData"),
        getCharacterPositions: context.mock.fn(() => ({ 1: { x: 7, y: 7 } })),
        getPlayerPosition: () => ({ x: 7, y: 5 })
      };

      const board = new Board({
        validTiles,
        rooms
      });

      const game = new Game({ players, board });
      const expectedPositions = {
        "8,6": { x: 8, y: 6 },
        "6,6": { x: 6, y: 6 },
        "8,4": { x: 8, y: 4 },
        "5,5": { x: 5, y: 5 },
        "6,4": { x: 6, y: 4 },
        "7,3": { x: 7, y: 3 }
      };

      assert.deepStrictEqual(game.findPossiblePositions(2), expectedPositions);
    });

    it("Should give possible positions as empty when when there is no where to move", context => {
      const players = {
        info: context.mock.fn(() => "mockData"),
        getCharacterPositions: context.mock.fn(() => ({ 1: { x: 7, y: 5 } })),
        getPlayerPosition: () => ({ x: 7, y: 5 })
      };

      const board = new Board({
        validTiles,
        rooms
      });

      const game = new Game({ players, board });
      const expectedPositions = {};

      assert.deepStrictEqual(game.findPossiblePositions(0), expectedPositions);
    });
  });

  describe("getPossiblePositions", () => {
    it("Should get the Posible Positions", () => {
      const game = new Game({});
      game.updatePossiblePositions({ "1,4": { x: 1, y: 4 } });

      assert.deepStrictEqual(game.getPossiblePositions(), {
        "1,4": { x: 1, y: 4 }
      });
    });
  });

  describe("toggleIsSuspecting", () => {
    it("should toggle the isSuspecting status", context => {
      const game = new Game({
        players: {
          getCharacterPositions: () => {},
          info: context.mock.fn(() => [])
        }
      });

      game.toggleIsSuspecting();

      assert.strictEqual(game.state().action, "suspecting");
    });
  });

  describe("getLastSuspicionPosition", () => {
    it("should give the last suspicion position of current player", () => {
      const game = new Game({
        players: {
          getLastSuspicionPosition: () => "lounge"
        }
      });

      assert.strictEqual(game.getLastSuspicionPosition(1), "lounge");
    });
  });

  describe("ruleOutSuspicion", () => {
    it("should give id of the invalidator and matching cards", () => {
      const DAGGER = { type: "weapon", title: "dagger" };
      const MUSTARD = { type: "suspect", title: "mustard" };

      const game = new Game({
        players: {
          ruleOutSuspicion: () => ({
            invalidatedBy: 2,
            matchingCards: [DAGGER, MUSTARD]
          })
        }
      });

      game.validateSuspicion(1, { weapon: "dagger", suspect: "mustard" });

      assert.deepStrictEqual(game.ruleOutSuspicion(), {
        invalidatedBy: 2,
        matchingCards: [DAGGER, MUSTARD]
      });
    });
  });
});
