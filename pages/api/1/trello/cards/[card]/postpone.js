import next from 'next';
import { runQuery, getCustomFields, getCheckListItems, postponeByRules } from '../../../../../../modules.js';

//daysUntilRepeat, addDays, , dateDiff

export default async function postpone(req, res) {
  const key = process.env.TRELLOKEY;
  const token = process.env.TRELLOTOKEN;
  const { card } = req.query;
  const { body } = req;
  let returnJson = {};

  if (req.method === "PUT") {

    // Get card info

    const auth = {
      key: key,
      token: token
    };
  
    const params = { 
      params : {
        fields: "name,start,due,idBoard",
        customFields: "true",
        customFieldItems: "true",
        checklists: "all",
        key: key,
        token: token,    
      }
    };
  
    const cardRes = await runQuery(`https://api.trello.com/1/cards/${card}/?`, "GET", auth, params);

    if (cardRes.status === 200) {

      // Calculate new dates
      const cardJson = cardRes.text; 
      returnJson.due = cardJson.due;
      returnJson.customFields = getCustomFields(cardJson);
      returnJson.checkListItems = getCheckListItems(cardJson);  
      const putJson = postponeByRules(returnJson);
  
      // Start updates
      let putResponse = [];
  
      // Update main fields
      if (putJson.main) {
        const putRes = await runQuery(`https://api.trello.com/1/cards/${card}/?`, "PUT", auth, putJson.main);

        const putResJson = {
          action: "PUT - Change main fields",
          status: putRes.status,
          statusText: putRes.statusText,
          text: (putRes.status === 200) ? putJson.main : putRes.text
        };

        putResponse.push(putResJson);
      }
  
      // Update custom fields
      for (let i = 0; i < putJson.customFields.length; i ++) {
        const putRes = await runQuery(`https://api.trello.com/1/cards/${card}/customField/${putJson.customFields[i].idCustomField}/item?`, "PUT", auth, putJson.customFields[i]);

        const putResJson = {
          action: `PUT - Change custom field ${i}`,
          status: putRes.status,
          statusText: putRes.statusText,
          text: (putRes.status === 200) ? putJson.customFields[i] : putRes.text
        };

        putResponse.push(putResJson);
      }
  
      // Update check list items
      for (let i = 0; i < putJson.checkListItems.length; i ++) {
        const putRes = await runQuery(`https://api.trello.com/1/cards/${card}/checkItem/${putJson.checkListItems[i].id}?`, "PUT", auth, putJson.checkListItems[i]);
 
        const putResJson = {
          action: `PUT - Change check list item ${i}`,
          status: putRes.status,
          statusText: putRes.statusText,
          text: (putRes.status === 200) ? putJson.checkListItems[i] : putRes.text
        };

        putResponse.push(putResJson);     
      }
  
      // Return
      res.status(200).json({
        putResponse
      });
    
    } else { // Error getting card
      res.status(cardRes.status).send(cardRes.text);
    }

  } else {
    res.status(405).send(`Cannot ${req.method} ${req.url}`);
  }
    
}