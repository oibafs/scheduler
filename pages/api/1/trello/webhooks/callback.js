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
      .then((res) => {
        console.log(res);

        ret.actions.push({
          name: "joinCard",
          status: res.status,
          result: res.text,
        });
        status = res.status != 200 ? res.status : status;
        res.status(status).json(ret);
      });
  } else {
    res.status(status);
  }
}