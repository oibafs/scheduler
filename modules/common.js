export async function runQuery(url, method, json, simulation, noAuth) {
  const queryParser = require("querystring");
  let params = {};
  json = json ? json : {};

  if (!noAuth) {
    params = Object.assign(params, getAuth());
  }
  
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

    if (!simulation) {

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

    } else {

      return {
        status : 200,
        statusText : "Ok",
        text : {}
      }

    }

  }

}

function getAuth() {
  const key = process.env.TRELLOKEY;
  const token = process.env.TRELLOTOKEN;

  return {
    key: key,
    token: token
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

export function dateDiff(originalDate, futureDate) {
  const _MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.floor((futureDate - originalDate) / _MS_PER_DAY);
}