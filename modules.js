export async function runQuery(url, method, auth, json) {
  const queryParser = require("querystring");
  let params = {};
  params = Object.assign(params, auth);
  params = Object.assign(params, json.params);
  const query = queryParser.stringify(params);
  url = url + query;
  const body = json.body ? JSON.stringify(json.body) : {};
  const contentType = json.body ? "application/json" : "text/plain"
  let response;

  if (method === "GET") {

    return fetch(url, {
      method : method,
    })
    .then(response => response.text()
      .then(text => {

        if (response.ok) {
          text = JSON.parse(text);
        }

        return {
          status : response.status,
          statusText : response.statusText,
          text : text
        }

      })
    )

  } else {

    return fetch(url, {
      method : method,
      body : body,
      headers : {
        'Content-Type' : contentType
      }
    })
    .then(response => response.text()
      .then(text => {

        if (response.ok) {
          text = JSON.parse(text);
        }

        return {
          status : response.status,
          statusText : response.statusText,
          text : text
        }

      })
    )

  }

}

export function getCustomFields(cardJson) {
  let json = {};

  // Process custom field items
  for (let i = 0; i < cardJson.customFieldItems.length; i ++) {

    // Find custom field model
    const model = cardJson.customFields.filter(model => model.id == cardJson.customFieldItems[i].idCustomField);
    const name = model[0].name;

    if (cardJson.customFieldItems[i].value) {

      // Direct value
      const value = Object.values(cardJson.customFieldItems[i].value)[0];
      json[name] = value;

    } else {

      // Get value from options
      const value = Object.values(model[0].options.filter(model => model.id == cardJson.customFieldItems[i].idValue)[0].value)[0];
      json[name] = value;

    }

  }

  // Get custom field ids and values
  for (let i = 0; i < cardJson.customFields.length; i ++) {
    const name = cardJson.customFields[i].name;
    const customFieldId = "idCustomField" + name;
    json.[customFieldId] = cardJson.customFields[i].id;

    for (let j = 0; j < (cardJson.customFields[i].options ? cardJson.customFields[i].options.length : 0); j ++) {
      const idValue = cardJson.customFields[i].options[j].id;
      const value = cardJson.customFields[i].options[j].value.text;
      const customFieldIdValue = "idCustomFieldValue" + name + value;
      json.[customFieldIdValue] = idValue;
    }

  }

  return json;
}

export function daysUntilRepeat(originalDate, recurring, recPeriod) {
  let future = new Date(originalDate);

  switch (recPeriod) {

    case "days":
      return recurring;
      break;

    case "weeks":
      return (recurring * 7);
      break;

    case "months":
      future.setUTCMonth(future.getUTCMonth() + recurring);
      return dateDiff(originalDate, future);
      break;

    case "years":
      future.setUTCFullYear(future.getUTCFullYear() + recurring);
      return dateDiff(originalDate, future);
      break;

  }

}

export function addDays(originalDate, daysToAdd, actionDays, today) {
  let futureDay = new Date(originalDate);

  if (daysToAdd == 0) {
    return futureDay;
  }

  let i = 0;

  do {
    i ++;

    futureDay.setUTCDate(futureDay.getUTCDate() + 1);
    let dayOfWeek = futureDay.getUTCDay();

    switch(actionDays) {

      case "Workdays":

        while (dayOfWeek == 0 || dayOfWeek == 6) {
          futureDay.setUTCDate(futureDay.getUTCDate() + 1);
          dayOfWeek = futureDay.getUTCDay();
        };
    
        break;

      case "Weekends":

        while (dayOfWeek != 0 && dayOfWeek != 6) {
          futureDay.setUTCDate(futureDay.getUTCDate() + 1);
          dayOfWeek = futureDay.getUTCDay();
        };

        break;

      case "Days off":

        while (dayOfWeek != 6) {
          futureDay.setUTCDate(futureDay.getUTCDate() + 1);
          dayOfWeek = futureDay.getUTCDay();
        };

        break;
          
      default:
        break;

    };

  }
  while (i < daysToAdd || futureDay < today);

  return futureDay;
}

export function getCheckListItems(cardJson, complete) {
  let jsonItems = [];

  // Process check lists
  for(let i = 0; i < cardJson.checklists.length; i ++) {

    // Process check list items
    for(let j = 0; j < cardJson.checklists[i].checkItems.length; j ++) {

      // Items incomplete and with due date
      if((cardJson.checklists[i].checkItems[j].state === "incomplete" || complete) && cardJson.checklists[i].checkItems[j].due) {
 
        jsonItems.push({
          id: cardJson.checklists[i].checkItems[j].id,
          name: cardJson.checklists[i].checkItems[j].name,
          due: cardJson.checklists[i].checkItems[j].due,
        });
        
      }

    }

  }

  return jsonItems;
}

export function dateDiff(originalDate, futureDate) {
  const _MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.floor((futureDate - originalDate) / _MS_PER_DAY);
}

export function postponeByRules(json) {
  let putJson = {};

  // 1. checklist overdue -> due + postponable (consider action days): if still overdue => today
  //    checklist due today -> due + postponable (consider action days)
  const actionDays = json.customFields.["Action days"] ? json.customFields.["Action days"] : "Any day";
  const daysPostponable = setDaysPostponable(json.customFields.["Days postponable"], json.customFields.Priority);
  const recurring = json.customFields.Recurring ? parseInt(json.customFields.Recurring) : 0;
  const today = new Date();
  const checkListHours = 21;
  let earlierDate;
  let laterDate;

  today.setUTCHours(0,0,0,0);

  putJson.checkListItems = [];

  for (let i = 0; i < json.checkListItems.length; i ++) {
    let dueDate = new Date(json.checkListItems[i].due);
    const tomorrow = addDays(today, 1, actionDays, today);

    if(dueDate < tomorrow) {
      dueDate = addDays(dueDate, daysPostponable, actionDays, today);
      dueDate.setUTCHours(checkListHours);
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
  let nextAction = new Date(json.customFields.["Next action"]);

  if (json.customFields.["Next action"]) {
    nextAction.setUTCFullYear(earlierDate.getUTCFullYear());
    nextAction.setUTCMonth(earlierDate.getUTCMonth());
    nextAction.setUTCDate(earlierDate.getUTCDate());  
  } else {
    nextAction = earlierDate;
  }

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

  // 3. due date -> if lower than later date => original date + postponable weeks -> if greater than today + recurring => later date
  let due = new Date(json.due);

  if (due < laterDate || !json.due) {

    if (!json.due) {
      due = laterDate;
    } else {
      due.setUTCDate(due.getUTCDate() + daysPostponable * 7);
    }

    let nextRecurrent = new Date(today);
    nextRecurrent.setUTCDate(nextRecurrent.getUTCDate() + recurring);

    if (recurring > 0 && due > nextRecurrent) {
      due.setUTCFullYear(laterDate.getUTCFullYear());
      due.setUTCMonth(laterDate.getUTCMonth());
      due.setUTCDate(laterDate.getUTCDate());
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

function setDaysPostponable(daysPostponable, priority) {
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

  return days;
}