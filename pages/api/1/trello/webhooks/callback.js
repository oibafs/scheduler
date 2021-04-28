import { joinCard } from "../../../../../modules/webhooks";

export default function callback(req, res) {
  let ret = {
    actions: []
  };
  let status = 200;

  const { body } = req;

  // create card
  if (body.action.type === "createCard" && body.action.data.card.name.indexOf("https://") != 0) {
    const resJoin = joinCard(body.action.data.card.id, body.action.idMemberCreator);
    console.log(resJoin);

    ret.actions.push({
      name: "joinCard",
      status: resJoin.status,
      result: resJoin.text,
    });
    status = resJoin.status != 200 ? resJoin.status : status;
  }

  res.status(status).json(ret);
}