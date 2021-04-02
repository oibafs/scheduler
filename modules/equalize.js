import { runQuery, getCustomFields, getCheckListItems, addDays, daysUntilRepeat } from './common.js';

export async function equalizeCard(card, simulation, comment) {

  const params = { 
    params : {
      fields: "name,start,due,idBoard",
      customFields: "true",
      customFieldItems: "true",
      checklists: "all"
    }
  };

  const cardRes = await runQuery(`https://api.trello.com/1/cards/${card}/?`, "GET", params);

  if (cardRes.status === 200) {

    // Calculate new dates
    const cardJson = cardRes.text;
    let returnJson = {};
    returnJson.start = cardJson.start;
    returnJson.customFields = getCustomFields(cardJson);
    returnJson.checkListItems = getCheckListItems(cardJson);  
    const putJson = setDates(returnJson);

    // Start updates
    let putResponse = [];

    // Update main fields
    if (putJson.main) {
      const putRes = await runQuery(`https://api.trello.com/1/cards/${card}/?`, "PUT", putJson.main, simulation);

      const putResJson = {
        action: "PUT - Change main fields",
        status: putRes.status,
        statusText: putRes.statusText,
        text: (putRes.status === 200) ? putJson.main : putRes.text
      };

      putResponse.push(putResJson);
    }

    // Update check list items
    for (let i = 0; i < putJson.checkListItems.length; i ++) {
      const putRes = await runQuery(`https://api.trello.com/1/cards/${card}/checkItem/${putJson.checkListItems[i].id}?`, "PUT", putJson.checkListItems[i], simulation);

      const putResJson = {
        action: `PUT - Change check list item ${i}`,
        status: putRes.status,
        statusText: putRes.statusText,
        text: (putRes.status === 200) ? putJson.checkListItems[i] : putRes.text
      };

      putResponse.push(putResJson);     
    }

    // Post result as a comment to the card
    const params = { 
      params : {
        text : JSON.stringify(putResponse)
      }
    };

    if (putResponse.length != 0 && comment) {
      await runQuery(`https://api.trello.com/1/cards/${card}/actions/comments?`, "POST", params, simulation);
    }

    putResponse.status = 200;
    return putResponse;

  } else {
    return cardRes;
  }

}

function setDates(json) {
  let putJson = {};

  // Set standard start date the same as custom field start date
  if (json.customFields.["Start date"] && (json.start != json.customFields.["Start date"])) {
    json.start = json.customFields.["Start date"];

    putJson.main = {
      params : {
        start : JSON.parse(JSON.stringify(json.start))
      }
    };

  }

  // Set first custom field date the same as custom field next action
  putJson.checkListItems = [];

  if (json.checkListItems.length > 0) {

    if (json.customFields.["Next action"] && (json.checkListItems[0].due != json.customFields.["Next action"])) {
      json.checkListItems[0].due = json.customFields.["Next action"];
  
      putJson.checkListItems.push({
        id : json.checkListItems[0].id,
        params : {
          due : JSON.parse(JSON.stringify(json.checkListItems[0].due))
        }
      })
  
    }
  
  }

  return putJson;
}