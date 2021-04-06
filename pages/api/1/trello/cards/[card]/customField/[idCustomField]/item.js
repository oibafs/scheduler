import { runQuery } from '../../../../../../../../modules/common.js';

export default async function item(req, res) {
  const { card, idCustomField, key, token } = req.query;

  switch (req.method) {

    case "PUT":

      const options = {
        body: req.body
      };
  
      const response = await runQuery(`https://api.trello.com/1/cards/${card}/customField/${idCustomField}/item?key=${key}&token=${token}`, "PUT", options, false, true);
  
      if (response.status === 200) {
  
        // Return
        res.status(200).json(response.text);
      
      } else { // Error
        res.status(response.status).send(response.text);
      }

      break;

    case "OPTIONS":
      res.status(200).send("PUT");
      break;

    default:
      res.status(405).send(`Cannot ${req.method} ${req.url}`);
      break;

  }

}
