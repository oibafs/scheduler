import { fillCardId, joinCard, moveToDone, repeatCard, leaveCard, setDateConcluded, setStatusDone, removeTodayLabel } from "../../../../../modules/webhooks.js";

export default function callback(req, res) {
  let ret = {
    actions: []
  };
  let status = 200;

  const { body, method } = req;
  console.log("method", method);
  console.log("body", body);
  console.log("body.action.data", body.action.data);

  if (method === "HEAD") {
    res.status(200).send();
    return;
  }

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
        console.log(status, ret);
        res.status(status).json(ret);
      })
      .catch((error) => {
        console.log("error", error);
        res.status(500).send();
      });

    // mark due date complete
  } else if (body.action && body.action.type === "updateCard" && body.action.display.translationKey === "action_marked_the_due_date_complete") {
    Promise.all([
      repeatCard(body.action.data.card),
      moveToDone(body.action.data)
    ])
      .then((response) => {
        response.map((item) => {

          ret.actions.push(item.text);
          status = item.status != 200 ? item.status : status;
        });
        console.log(status, ret);
        res.status(status).json(ret);
      })
      .catch((error) => {
        console.log("error", error);
        res.status(500).send();
      });

    // move card to Done
  } else if (body.action && body.action.type === "updateCard" && body.action.display.translationKey === "action_move_card_from_list_to_list" && body.action.data.listAfter.name === "Done" && body.action.data.card.name.indexOf("https://") != 0) {
    Promise.all([
      leaveCard(body.action.data.card, body.action.memberCreator),
      setDateConcluded(body.action.data.card),
      setStatusDone(body.action.data.card),
      removeTodayLabel(body.action.data.card)
    ])
      .then((response) => {
        response.map((item) => {

          ret.actions.push(item.text);
          status = item.status != 200 ? item.status : status;
        });
        console.log(status, ret);
        res.status(status).json(ret);
      })
      .catch((error) => {
        console.log("error", error);
        res.status(500).send();
      });

    // no action
  } else {
    console.log(status);
    res.status(200).send();
    return;
  }
}