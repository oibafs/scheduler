import { runQuery } from "../modules/common";

export const authorize = async () => {
  const APIKey = process.env.TRELLOKEY;

  //const auth_link = `https://trello.com/1/authorize?return_url=http://localhost:3000/cardlist&callback_method=postMessage&scope=read&expiration=1hour&name=Card%20%List&key=${APIKey}&response_type=token`
  const auth_link = new URL("https://trello.com/1/authorize")
  auth_link.searchParams.append("return_url", "http://localhost:3000/")
  auth_link.searchParams.append("callback_method", "postMessage")
  auth_link.searchParams.append("scope", "read")
  auth_link.searchParams.append("expiration", "1hour")
  auth_link.searchParams.append("name", "Card List")
  auth_link.searchParams.append("key", APIKey)
  auth_link.searchParams.append("response_type", "token")

  // Call an external API endpoint to get posts
  const res = await fetch(auth_link.href, {
    method: 'GET'
  })

  console.log("res", res)
  return await res.json()
}

const fieldValue = (customFields, customFieldItems, name) => {
  try {
    const models = customFields.filter(i => i.name === name);
    const results = models.map(model => {
      const field = customFieldItems.filter(i => i.idCustomField === model.id)[0];
      return { model, field };
    });
    const result = results.filter(i => i.model && i.field);
    const model = result[0].model;
    const field = result[0].field;

    switch (model.type) {
      case ("list"):
        return model.options.findIndex(i => i.id === field.idValue).toString();
      case ("checkbox"):
        return field.value.checked;
      default:
        return field.value[model.type];
    }
  }
  catch (err) {
    return "null";
  }
}

export const getCards = async () => {
  const params = {
    params: {
      fields: "name,url,dueComplete,due",
      customFieldItems: true
    }
  };
  const getCardsRes = await runQuery(`https://api.trello.com/1/members/me/cards?`, "GET", params);
  if (getCardsRes.status === 200) {
    let ret = getCardsRes.text;
    ret = ret.filter(item => !item.dueComplete);

    let customFields = [];
    ret.map(item => {
      item.customFieldItems.map(item => {
        customFields.push(item.idCustomField)
      })
    });
    const uniqueCustomFields = [...new Set(customFields)];

    let urls = "";
    let batch = 0;
    let customFieldsDef = [];
    const batchQuery = async (urls, customFieldsDef) => {
      urls = urls.slice(0, urls.length - 1);
      const params = {
        params: {
          urls: urls
        }
      };
      const getBatchRes = await runQuery(`https://api.trello.com/1/batch?`, "GET", params);
      const result = getBatchRes.text;
      customFieldsDef = customFieldsDef.concat(result);
      return customFieldsDef;
    };
    for (let i = 0; i < uniqueCustomFields.length; i++) {
      urls = `${urls}/customFields/${uniqueCustomFields[i]},`
      batch++;
      if (batch === 10) {
        customFieldsDef = await batchQuery(urls, customFieldsDef);
        batch = 0;
        urls = "";
      }
    }
    if (batch > 0) {
      customFieldsDef = await batchQuery(urls, customFieldsDef);
    }
    customFieldsDef = customFieldsDef.map(item => item["200"]);

    ret = ret.map(item => {
      item.importance = fieldValue(customFieldsDef, item.customFieldItems, "Importance");
      const sortImportance = (100 - (isNaN(parseInt(item.importance)) ? 1 : item.importance)).toString();
      item.priority = fieldValue(customFieldsDef, item.customFieldItems, "Priority");
      item.deadline = fieldValue(customFieldsDef, item.customFieldItems, "Deadline");
      item.startdate = fieldValue(customFieldsDef, item.customFieldItems, "Start date");
      item.sorter = sortImportance + item.priority + item.due + item.deadline + item.startdate;
      return item;
    })

    const ret2 = ret.sort((a, b) => {
      if (a.sorter > b.sorter) {
        return 1;
      } else if (b.sorter > a.sorter) {
        return -1;
      }
      return 0;
    });

    console.log(ret2);
    return ret2;
  }
  else {
    return {};
  }
}