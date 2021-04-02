import { equalizeCard } from '../../../../../../modules/equalize.js';

export default async function equalizeDates(req, res) {
  const { card, simulation, comment } = req.query;
  
  if (req.method === "PUT") {

    // Equalize dates on card
    const cardRes = await equalizeCard(card, simulation, comment);

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