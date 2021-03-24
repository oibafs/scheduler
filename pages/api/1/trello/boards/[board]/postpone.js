import { runQuery, postponeCard } from '../../../../../../modules.js';

export default async function postpone(req, res) {
  const { board, simulation } = req.query;

  if (req.method === "PUT") {

    // Get cards on the board
    const boardRes = await runQuery(`https://api.trello.com/1/boards/${board}/cards?`, "GET");

    if (boardRes.status === 200) {
      const boardJson = boardRes.text;

      let putResponse = [];
      // Process cards
      for (let i = 0; i < boardJson.length; i ++) {
        const card = boardJson[i];

        if (card.due && !card.dueComplete) {
          const cardRes = await postponeCard(card.id, simulation);

          putResponse.push({
            id: card.id,
            name: card.name,
            response: cardRes
          })

        }

      }

      res.status(200).json({
        putResponse
      });
    
    } else { // Error getting board
      res.status(boardRes.status).send(boardRes.text);
    }

  } else {
    res.status(405).send(`Cannot ${req.method} ${req.url}`);
  }
    
}