import { joinCard } from "../../../../../modules/webhooks.ts";

export default function callback(req, res) {
  let ret = {
    actions: []
  };
  let status = 200;

  const { body } = req;

  // create card
  if (body.action && body.action.type === "createCard" && body.action.data.card.name.indexOf("https://") != 0) {
    Promise.all([
      joinCard(body.action.data.card.id, body.action.idMemberCreator)
    ])
      .then((response) => {
        response.map((item) => {
          console.log(item);

          ret.actions.push({
            name: "joinCard",
            status: item.status,
            result: item.text,
          });
          status = item.status != 200 ? item.status : status;
          res.status(status).json(ret);
        })
      });
  } else {
    res.status(204).send();
  }
}