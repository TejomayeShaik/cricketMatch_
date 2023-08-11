const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();
app.use(express.json());

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertToResponseObjPlayer = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertToResponseObjMatch = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

//api1
app.get("/players/", async (request, response) => {
  const playerListQuery = `select * from  player_details order by player_id;`;
  const playerArray = await db.all(playerListQuery);
  response.send(
    playerArray.map((eachPlayer) => convertToResponseObjPlayer(eachPlayer))
  );
});

//specificPlayer -API2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `select * from player_details where player_id = ${playerId};`;
  const player = await db.get(getPlayerQuery);
  response.send(convertToResponseObjPlayer(player));
});

//update a player - API3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;

  const updatePlayerQuery = `update player_details set 
  player_name = '${playerName}'`;

  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//matchDetails of specific match API_4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `select * from match_details where match_id = ${matchId};`;

  const match = await db.get(getMatchQuery);
  response.send(convertToResponseObjMatch(match));
});

//all matches of a specific player - API5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesQuery = `select * from player_match_score natural join match_details where player_id = ${playerId};`;
  const matchesArray = await db.all(getMatchesQuery);
  response.send(
    matchesArray.map((eachMatch) => convertToResponseObjMatch(eachMatch))
  );
});

//list of players of a specific match - API6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersQuery = `select player_details.player_id as playerId, player_details.player_name as playerName from player_match_score natural join player_details where match_id = ${matchId};`;
  const playersArray = await db.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) => convertToResponseObjPlayer(eachPlayer))
  );
});

//statistics API-7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const query = `select player_id as playerId, player_name as playerName,
    SUM(scores) as totalScore,
    SUM(fours) as totalFours,
    SUM(sixes) as totalSixes from player_match_score natural join player_details where player_id = ${playerId};`;
  const details = await db.get(query);
  response.send(details);
});
module.exports = app;
