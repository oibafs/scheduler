import { runQuery, getCustomFields } from '../../../../../../modules.js';

export default async function repeat(req, res) {
  const key = process.env.TRELLOKEY;
  const token = process.env.TRELLOTOKEN;
  const { card } = req.query;
  const { body } = req;

  if (req.method === "PUT") {

    // Get idList from original card
    const auth = {
      key: key,
      token: token
    }
  
    const params = { 
      params : {
        fields: "idList",
        customFields: "true",
        customFieldItems: "true",
        }
    };
  
    const cardRes = await runQuery(`https://api.trello.com/1/cards/${card}/?`, "GET", auth, params);

    if (cardRes.status === 200) {
      const cardJson = cardRes.text;
      const idList = cardJson.idList;
      const customFields = getCustomFields(cardJson);

      if (customFields.Recurring && customFields.Recurring != 0) {

        // Copy card
        const copyParams = {
          body: {
            pos: "top",
            idList: idList,
            idCardSource: card,
            keepFromSource: "attachments,checklists,due,labels,members,stickers"
          }
        }

        const copyRes = await runQuery(`https://api.trello.com/1/cards/?`, "POST", auth, copyParams);

        if (copyRes.status === 200) {

          res.status(200).json({
            card,
            copyRes
          })
    
        } else { // Error copy card
          res.status(copyRes.status).send(copyRes.text);
        }

      } else { // No recurrency set
        res.status(204).json({
          cardRes
        });
      }

    } else { // Error get card
      res.status(cardRes.status).send(cardRes.text);
    }

  } else {
    res.status(404).send(`Cannot ${req.method} ${req.url}`);
  }

}