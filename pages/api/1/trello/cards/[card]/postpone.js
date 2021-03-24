import { runQuery, postponeCard } from '../../../../../../modules.js';

export default async function postpone(req, res) {
  const { card, simulation } = req.query;
  
  if (req.method === "PUT") {

    // Postpone card
    const cardRes = await postponeCard(card, simulation);

    if (cardRes.status === 200) {

      // Return
      res.status(200).json(cardRes);
    
    } else { // Error getting card
      res.status(cardRes.status).send(cardRes.text);
    }

  } else {
    res.status(405).send(`Cannot ${req.method} ${req.url}`);
  }
    
}