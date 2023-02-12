let express = require("express");
let sqlite3 = require("sqlite3");
let { open } = require("sqlite");
let path = require("path");

let app = express();
app.use(express.json());
let db = null;

let dbPath = path.join(__dirname, "cricketMatchDetails.db");

let initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is runnig at http://localhost:3000");
    });
  } catch (e) {
    console.log(`Db Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

// API 1 GET all players
app.get("/players/", async (request, response) => {
  const getPlayersQuery = ` 
    SELECT
        player_id as playerId,
        player_name as playerName
     FROM
        player_details
     ORDER BY 
        player_id;`;
  const playersArray = await db.all(getPlayersQuery);
  response.send(playersArray);
});

// API 2 GET a player
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = ` 
    SELECT
       player_id as playerId,
       player_name as playerName
     FROM 
        player_details
     WHERE 
        player_id = ${playerId};`;
  const player = await db.get(getPlayerQuery);
  response.send(player);
});

// API 3 Update details of a player
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerQuery = ` 
    UPDATE
        player_details
     SET 
        player_name = '${playerName}'
     WHERE player_id = ${playerId};`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

// API 4 GET match details
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = ` 
    SELECT
       match_id as matchId,
       match,
       year
     FROM 
        match_details
     WHERE 
        match_id = ${matchId};`;
  const match = await db.get(getMatchQuery);
  response.send(match);
});

// API 5 GET all matches of a player
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = ` 
    SELECT
        match_details.match_id as matchId,
        match,
        year
     FROM 
        match_details NATURAL JOIN player_match_score 
     WHERE player_id = ${playerId};`;
  const playerMatches = await db.all(getPlayerMatchesQuery);
  response.send(playerMatches);
});

// API 6 GET players from a specific match
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersMatchQuery = ` 
    SELECT
        player_details.player_id as playerId,
        player_name as playerName
     FROM 
       player_details NATURAL JOIN player_match_score 
     WHERE match_id = ${matchId};`;
  const matchPlayers = await db.all(getPlayersMatchQuery);
  response.send(matchPlayers);
});

// API 7 GET stats of a player
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getStatsOfPlayerQuery = ` 
    SELECT
        player_details.player_id as playerId,
        player_name as playerName,
        SUM(score) as totalScore,
        SUM(fours) as totalFours,
        SUM(sixes) as totalSixes
     FROM 
        player_details INNER JOIN player_match_score ON player_details.player_id = player_match_score.player_id
     WHERE
        player_details.player_id = ${playerId};`;
  const playerDetails = await db.get(getStatsOfPlayerQuery);
  response.send(playerDetails);
});

module.exports = app;
