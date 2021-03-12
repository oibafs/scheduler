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
  for(let i = 0; i < cardJson.customFieldItems.length; i ++) {

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

    if (name == "Next action") {
      json.idCustomFieldNextAction = cardJson.customFieldItems[i].idCustomField;
    }

  }

  return json;
}