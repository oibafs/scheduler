import { runQuery, getCustomFields, getCheckListItems, addDays, daysUntilRepeat } from './common.js';

export async function postponeCard(card, simulation) {

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
    returnJson.due = cardJson.due;
    returnJson.customFields = getCustomFields(cardJson);
    returnJson.checkListItems = getCheckListItems(cardJson);  
    const putJson = postponeByRules(returnJson);

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

    // Update custom fields
    for (let i = 0; i < putJson.customFields.length; i ++) {
      const putRes = await runQuery(`https://api.trello.com/1/cards/${card}/customField/${putJson.customFields[i].idCustomField}/item?`, "PUT", putJson.customFields[i], simulation);

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

    if (putResponse.length != 0) {
      await runQuery(`https://api.trello.com/1/cards/${card}/actions/comments?`, "POST", params, simulation);
    }

    putResponse.status = 200;
    return putResponse;

  } else {
    return cardRes;
  }

}

function postponeByRules(json) {
  let putJson = {};

  // 1. checklist overdue -> due + postponable (consider action days): if still overdue => today
  //    checklist due today -> due + postponable (consider action days)
  const actionDays = json.customFields.["Action days"] ? json.customFields.["Action days"] : "Any day";
  const recPeriod = json.customFields.["Recurring period"] ? json.customFields.["Recurring period"] : "days";
  const today = new Date();
  today.setUTCHours(0,0,0,0);
  const tomorrow = addDays(today, 1, actionDays, today);
  let earlierDate;
  let laterDate;
  putJson.checkListItems = [];

  for (let i = 0; i < json.checkListItems.length; i ++) {
    let dueDate = new Date(json.checkListItems[i].due);
  
    if(dueDate < tomorrow) {
      const recurring = daysUntilRepeat(dueDate, json.customFields.Recurring ? parseInt(json.customFields.Recurring) : 0, recPeriod);
      const daysPostponable = setDaysPostponable(json.customFields.["Days postponable"], json.customFields.Priority, recurring);
      dueDate = addDays(dueDate, daysPostponable, actionDays, today);
      json.checkListItems[i].due = dueDate;

      putJson.checkListItems.push({
        id : json.checkListItems[i].id,
        params : {
          due : JSON.parse(JSON.stringify(dueDate))
        }
      })
    }

    earlierDate = (dueDate < earlierDate || !earlierDate) ? dueDate : earlierDate;
    laterDate = (dueDate > laterDate || !laterDate) ? dueDate : laterDate;
  }

  // 2. next action -> same date as earlier checklist item
  putJson.customFields = [];

  if (earlierDate) {
    let nextAction = earlierDate;

    if (JSON.stringify(nextAction) != JSON.stringify(json.customFields.["Next action"])) {
      json.customFields.["Next action"] = nextAction;

      putJson.customFields.push({
        idCustomField : json.customFields.["idCustomFieldNext action"],
        body : {
          value : {
            date : JSON.parse(JSON.stringify(json.customFields.["Next action"]))
          }
        }
      });
    
    };

  }

  // 3. due date -> if lower than later date => original date + postponable weeks -> if greater than today + recurring => later date
  let due = new Date(json.due);

  if ((due < laterDate || !json.due) && laterDate) {
    const recurring = daysUntilRepeat(due, json.customFields.Recurring ? parseInt(json.customFields.Recurring) : 0, recPeriod);
    const daysPostponable = setDaysPostponable(json.customFields.["Days postponable"], json.customFields.Priority, recurring);

    if (!json.due) {
      due = laterDate;
    } else {
      due.setUTCDate(due.getUTCDate() + daysPostponable * 7);
    }

    let nextRecurrent = new Date(today);
    nextRecurrent.setUTCDate(nextRecurrent.getUTCDate() + recurring);
    nextRecurrent.setUTCHours(due.getUTCHours(), due.getUTCMinutes(), due.getUTCSeconds(), 0);

    if (recurring > 0 && due > nextRecurrent) {
      due = nextRecurrent;
    }

  }

  if (JSON.stringify(due) != JSON.stringify(json.due)) {
    json.due = due;

    putJson.main = {
      params : {
        due : JSON.parse(JSON.stringify(json.due))
      }
    };
  
  };

  return putJson;
}

function setDaysPostponable(daysPostponable, priority, recurring) {
  let days;

  if(daysPostponable) {
    days = parseInt(daysPostponable);
  } else {

    switch(priority) {

      case "Urgent":
        days = 1;
        break;

      case "Important":
        days = 2;
        break;

      case "Medium":
        days = 3;
        break;

      default:
        days = 4;
        break;

    }
  }

  if (days > recurring && recurring != 0) {
    days = recurring;
  }

  return days;
}