import { runQuery } from "./common";

export const joinCard = async (card, member) => {

  const params = {
    body: {
      value: member,
    }
  };

  let result = {};

  const cardRes = await runQuery(`https://api.trello.com/1/cards/${card.id}/idMembers?`, "POST", params);

  result.status = cardRes.status;
  if (cardRes.status === 200) {
    result.text = `${cardRes.text[0].fullName} joined ${card.name}`;
  } else {
    result.text = `Error joining ${card.name}`;
  }

  return result;
}

export const fillCardId = async (card) => {

  const params = {
    params: {
      fields: "id",
      customFields: true
    }
  };

  let result = {};

  const getCardRes = await runQuery(`https://api.trello.com/1/cards/${card.id}?`, "GET", params);

  if (getCardRes.status === 200) {
    const fieldCardId = getCardRes.text.customFields.filter(item => item.name === "cardId")[0].id;

    const params = {
      body: {
        value: {
          text: card.id
        }
      }
    };

    const putCustomFieldItemRes = await runQuery(`https://api.trello.com/1/cards/${card.id}/customField/${fieldCardId}/item?`, "PUT", params);

    result.status = putCustomFieldItemRes.status;
    if (putCustomFieldItemRes.status === 200) {
      result.text = `Updated the value for the cardId custom field on ${card.name} to ${card.id}`;
    } else {
      result.text = `Error updating the value for the cardId custom field on ${card.name}`;
    }
  } else {
    result.status = getCardRes.status;
    result.text = `Error getting information from card ${card.name}`;
  }
  return result;
}

export const repeatCard = async (card) => {

  const params = {
    params: {
      fields: "id",
      customFields: true,
      customFieldItems: true
    }
  };

  let result = {};

  const getCardRes = await runQuery(`https://api.trello.com/1/cards/${card.id}?`, "GET", params);

  if (getCardRes.status === 200) {

    let recurring;
    if (getCardRes.text.customFields.filter) {
      const fieldRecurring = getCardRes.text.customFields.filter(item => item.name === "Recurring");
      if (fieldRecurring.length > 0) {
        const fieldRecurringValue = getCardRes.text.customFieldItems.filter(item => item.idCustomField === fieldRecurring[0].id);
        recurring = fieldRecurringValue.length > 0 ? fieldRecurringValue[0].value.number : undefined;
      }
    }

    if (recurring) {
      const repeatCardRes = await runQuery(`https://scheduler-ruby.vercel.app/api/1/trello/cards/${card.id}/repeat`, "POST", undefined, undefined, true);

      result.status = repeatCardRes.status;
      if (repeatCardRes.status === 201) {
        result.status = 200;
        result.text = `Created a new instance for ${card.name} with id ${repeatCardRes.text.newCard}`;
      } else {
        result.text = `Error repeating card ${card.name}`;
      }
    } else {
      result.status = 200;
      result.text = `Card ${card.name} is not recurring`;
    }
  } else {
    result.status = getCardRes.status;
    result.text = `Error getting information from card ${card.name}`;
  }
  return result;
}

export const moveToDone = async (data) => {

  const params = {
    params: {
      fields: "id,name"
    }
  };

  let result = {};

  const getBoardRes = await runQuery(`https://api.trello.com/1/boards/${data.board.id}/lists?`, "GET", params);

  if (getBoardRes.status === 200) {

    let doneListId;
    try {
      const doneList = getBoardRes.text.filter(item => item.name === "Done");
      if (doneList.length > 0) {
        doneListId = doneList[0].id;
      }

      if (doneListId) {

        const params = {
          params: {
            idList: doneListId,
            pos: "top"
          }
        };

        const moveToDoneRes = await runQuery(`https://api.trello.com/1/cards/${data.card.id}?`, "PUT", params);

        result.status = moveToDoneRes.status;
        if (moveToDoneRes.status === 200) {
          result.text = `Moved ${data.card.name} to Done`;
        } else {
          result.text = `Error moving card ${data.card.name} to Done`;
        }
      } else {
        result.status = 200;
        result.text = `Board ${data.board.name} does not seem to have a list Done`;
      }

    } catch (error) {
      result.status = 200;
      result.text = `Board ${data.board.name} does not seem to have a list Done`;
    }
  } else {
    result.status = getBoardRes.status;
    result.text = `Error getting information from board ${data.board.name}`;
  }
  return result;
}

export const leaveCard = async (card, member) => {

  let result = {};

  const cardRes = await runQuery(`https://api.trello.com/1/cards/${card.id}/idMembers/${member.id}?`, "DELETE");

  result.status = cardRes.status;
  if (cardRes.status === 200) {
    result.text = `${member.fullName} left ${card.name}`;
  } else {
    result.text = `Error leaving ${card.name}`;
  }

  return result;
}

export const setDateConcluded = async (card) => {

  const params = {
    params: {
      fields: "id",
      customFields: true
    }
  };

  let result = {};

  const getCardRes = await runQuery(`https://api.trello.com/1/cards/${card.id}?`, "GET", params);

  if (getCardRes.status === 200) {
    const fieldDateConcluded = getCardRes.text.customFields.filter(item => item.name === "Date concluded")[0].id;
    const dateConcluded = new Date();

    const params = {
      body: {
        value: {
          date: dateConcluded
        }
      }
    };

    const putCustomFieldItemRes = await runQuery(`https://api.trello.com/1/cards/${card.id}/customField/${fieldDateConcluded}/item?`, "PUT", params);

    result.status = putCustomFieldItemRes.status;
    if (putCustomFieldItemRes.status === 200) {
      result.text = `Updated the value for the Date concluded custom field on ${card.name} to ${dateConcluded}`;
    } else {
      result.text = `Error updating the value for the Date concluded custom field on ${card.name}`;
    }
  } else {
    result.status = getCardRes.status;
    result.text = `Error getting information from card ${card.name}`;
  }
  return result;
}

export const setStatusDone = async (card) => {

  const params = {
    params: {
      fields: "id",
      customFields: true
    }
  };

  let result = {};

  const getCardRes = await runQuery(`https://api.trello.com/1/cards/${card.id}?`, "GET", params);

  if (getCardRes.status === 200) {
    const status = getCardRes.text.customFields.filter(item => item.name === "Status")[0];
    const fieldStatus = status.id;
    const valueDone = status.options.filter(item => item.value.text === "Done")[0].id;

    const params = {
      body: {
        idValue: valueDone
      }
    };

    const putCustomFieldItemRes = await runQuery(`https://api.trello.com/1/cards/${card.id}/customField/${fieldStatus}/item?`, "PUT", params);

    result.status = putCustomFieldItemRes.status;
    if (putCustomFieldItemRes.status === 200) {
      result.text = `Updated the value for the Status custom field on ${card.name} to Done`;
    } else {
      result.text = `Error updating the value for the Status custom field on ${card.name}`;
    }
  } else {
    result.status = getCardRes.status;
    result.text = `Error getting information from card ${card.name}`;
  }
  return result;
}

export const removeTodayLabel = async (card) => {

  const params = {
    params: {
      fields: "id,labels"
    }
  };

  let result = {};

  const getCardRes = await runQuery(`https://api.trello.com/1/cards/${card.id}?`, "GET", params);

  if (getCardRes.status === 200) {

    let labelTodayId;
    try {
      const labelToday = getCardRes.text.labels.filter(item => item.name === "today");
      if (labelToday.length > 0) {
        labelTodayId = labelToday[0].id;
      }

      if (labelTodayId) {
        const deleteLabelRes = await runQuery(`https://api.trello.com/1/cards/${card.id}/idLabels/${labelTodayId}?`, "DELETE");

        result.status = deleteLabelRes.status;
        if (deleteLabelRes.status === 200) {
          result.text = `Deleted the label today from card ${card.name}`;
        } else {
          result.text = `Error deleting the label today from card ${card.name}`;
        }
      } else {
        result.status = 200;
        result.text = `Card ${card.name} does not seem to have a label Today`;
      }
    } catch (error) {
      result.status = 200;
      result.text = `Card ${card.name} does not seem to have a label Today`;
    }
  } else {
    result.status = getCardRes.status;
    result.text = `Error getting information from card ${card.name}`;
  }
  return result;
}

export const setImportanceZero = async (card) => {

  const params = {
    params: {
      fields: "id",
      customFields: true
    }
  };

  let result = {};

  const getCardRes = await runQuery(`https://api.trello.com/1/cards/${card.id}?`, "GET", params);

  if (getCardRes.status === 200) {
    const fieldImportance = getCardRes.text.customFields.filter(item => item.name === "Importance")[0].id;

    const params = {
      body: {
        value: {
          number: 0
        }
      }
    };

    const putCustomFieldItemRes = await runQuery(`https://api.trello.com/1/cards/${card.id}/customField/${fieldDateConcluded}/item?`, "PUT", params);

    result.status = putCustomFieldItemRes.status;
    if (putCustomFieldItemRes.status === 200) {
      result.text = `Updated the value for the Importance custom field on ${card.name} to 0`;
    } else {
      result.text = `Error updating the value for the Importance custom field on ${card.name}`;
    }
  } else {
    result.status = getCardRes.status;
    result.text = `Error getting information from card ${card.name}`;
  }
  return result;
}
