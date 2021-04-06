import { runQuery } from '../../../../../../../../modules/common.js';

export default async function item(req, res) {
  const { card, idCustomField, key, token } = req.query;
  
  if (true) { //(req.method === "PUT") {

    const options = {
      body: req.body
    };

/*     const response = await runQuery(`https://api.trello.com/1/cards/${card}/customField/${idCustomField}/item?key=${key}&token=${token}`, "PUT", options, false, true);

    if (response.status === 200) {

      // Return
      res.status(200).json(response.text);
    
    } else { // Error
      res.status(response.status).send(response.text);
    }
 */
    res.status(200).send(JSON.parse('{"id":"606cac2fef1e150ba02a22bc","value":{"date":"2021-04-09T21:00:00.000Z"},"idCustomField":"5ecff75373eafa24ffced703","idModel":"606ca635d64bc534726dcfae","modelType":"card"}'));
  } else {
    res.status(405).send(`Cannot ${req.method} ${req.url}`);
  }
    

}