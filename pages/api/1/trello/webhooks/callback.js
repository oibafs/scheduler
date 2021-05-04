import { fillCardId, joinCard, repeatCard } from "../../../../../modules/webhooks.js";

export default function callback(req, res) {
  let ret = {
    actions: []
  };
  let status = 200;

  const { body } = req;
  console.log(body);

  console.log("body.action.type", body.action.type);
  console.log("body.action.display.translationKey", body.action.display.translationKey);
  // create card
  if (body.action && body.action.type === "createCard" && body.action.data.card.name.indexOf("https://") != 0) {
    Promise.all([
      joinCard(body.action.data.card, body.action.idMemberCreator),
      fillCardId(body.action.data.card)
    ])
      .then((response) => {
        response.map((item) => {

          ret.actions.push(item.text);
          status = item.status != 200 ? item.status : status;
        });
      });

    // mark due date complete
  } else if (body.action && body.action.type === "updateCard" && body.action.display.translationKey === "action_marked_the_due_date_complete") {
    Promise.all([
      repeatCard(body.action.data.card)
    ])
      .then((response) => {
        response.map((item) => {

          ret.actions.push(item.text);
          status = item.status != 200 ? item.status : status;
        });
      });

    // no action
  } else {
    res.status(200).send();
  }
  console.log(status, ret);
  res.status(status).json(ret);
}