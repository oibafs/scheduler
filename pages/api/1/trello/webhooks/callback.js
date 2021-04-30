import { joinCard } from "../../../../../modules/webhooks.js";

export default function callback(req, res) {
  let ret = {
    actions: []
  };
  let status = 200;

  const { body } = req;
  console.log("Action type", body.action.type);

  // create card
  if (body.action && body.action.type === "createCard" && body.action.data.card.name.indexOf("https://") != 0) {
    Promise.all([
      joinCard(body.action.data.card, body.action.idMemberCreator)
    ])
      .then((response) => {
        console.log("length", response.length);
        response.map((item) => {
          console.log(item);

          ret.actions.push(item.text);
          status = item.status != 200 ? item.status : status;
        });
        console.log(ret);
        res.status(status).json(ret);
      });
  } else {
    res.status(204).send();
  }
}