import { joinCard } from "../../../../../modules/webhooks.ts";

export default function callback(req, res) {
  let ret = {
    actions: []
  };
  let status = 200;

  const { body } = req;

  // create card
  if (body.action.type === "createCard" && body.action.data.card.name.indexOf("https://") != 0) {
    const resJoin = joinCard(body.action.data.card.id, body.action.idMemberCreator)
      .then((response) => {
        console.log(response);

        ret.actions.push({
          name: "joinCard",
          status: response.status,
          result: response.text,
        });
        status = response.status != 200 ? response.status : status;
        res.status(status).json(ret);
      });
  } else {
    res.status(status);
  }
}