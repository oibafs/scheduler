import { runQuery } from "./common";

export const joinCard = async (card, member) => {

  const params = {
    body: {
      value: member,
    }
  };
  let result;

  const cardRes = await runQuery(`https://api.trello.com/1/cards/${card.id}/idMembers?`, "POST", params);

  result.status = cardRes.status;
  if (cardRes.status === 200) {
    result.text = `${cardRes.text[0].fullName} joined ${card.name}`;
  } else {
    result.text = `Error joining ${card.name}`;
  }

  return result;
}