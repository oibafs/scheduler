import { runQuery } from "./common";

export const joinCard = async (card: string, member: string) => {

  const params = {
    body: {
      value: member,
    }
  };

  const cardRes = await runQuery(`https://api.trello.com/1/cards/${card}/idMembers?`, "POST", params);
  console.log(cardRes);

  return cardRes;
}