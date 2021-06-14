import { get } from "http";
import { runQuery } from "./common";
const crypto = require("crypto");

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
      const repeatCardRes = await runQuery(`${process.env.BASEURL}/api/1/trello/cards/${card.id}/repeat`, "POST", undefined, undefined, true);

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

export const moveToList = async (data, list) => {

  const params = {
    params: {
      fields: "id,name"
    }
  };

  let result = {};

  const getBoardRes = await runQuery(`https://api.trello.com/1/boards/${data.board.id}/lists?`, "GET", params);

  if (getBoardRes.status === 200) {

    let toListId;
    try {
      const toList = getBoardRes.text.filter(item => item.name === list);
      if (toList.length > 0) {
        toListId = toList[0].id;
      }

      if (toListId) {

        const params = {
          params: {
            idList: toListId,
            pos: "top"
          }
        };

        const moveToListRes = await runQuery(`https://api.trello.com/1/cards/${data.card.id}?`, "PUT", params);

        result.status = moveToListRes.status;
        if (moveToListRes.status === 200) {
          result.text = `Moved ${data.card.name} to ${list}`;
        } else {
          result.text = `Error moving card ${data.card.name} to ${list}`;
        }
      } else {
        result.status = 200;
        result.text = `Board ${data.board.name} does not seem to have a list ${list}`;
      }

    } catch (error) {
      result.status = 200;
      result.text = `Board ${data.board.name} does not seem to have a list ${list}`;
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

export const setStatus = async (card, toStatus) => {

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
    const value = status.options.filter(item => item.value.text === toStatus)[0].id;

    const params = {
      body: {
        idValue: value
      }
    };

    const putCustomFieldItemRes = await runQuery(`https://api.trello.com/1/cards/${card.id}/customField/${fieldStatus}/item?`, "PUT", params);

    result.status = putCustomFieldItemRes.status;
    if (putCustomFieldItemRes.status === 200) {
      result.text = `Updated the value for the Status custom field on ${card.name} to ${toStatus}`;
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
          number: "0"
        }
      }
    };

    const putCustomFieldItemRes = await runQuery(`https://api.trello.com/1/cards/${card.id}/customField/${fieldImportance}/item?`, "PUT", params);

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

export const setStatusToList = async (card) => {

  const params = {
    params: {
      fields: "id",
      customFields: true,
      list: true
    }
  };

  let result = {};

  const getCardRes = await runQuery(`https://api.trello.com/1/cards/${card.id}?`, "GET", params);

  if (getCardRes.status === 200) {
    const listName = getCardRes.text.list.name;
    const status = getCardRes.text.customFields.filter(item => item.name === "Status")[0];
    const value = status.options.filter(item => item.value.text === listName);
    const valueId = value.length > 0 ? value[0].id : undefined;

    if (valueId) {
      result = await setStatus(card, listName);
    } else {
      result.status = 200;
      result.text = `Status of card ${card.name} matches with list ${listName}`;
    }
  } else {
    result.status = getCardRes.status;
    result.text = `Error getting information from card ${card.name}`;
  }
  return result;
}

export const moveToListAsStatus = async (data) => {

  const params = {
    params: {
      fields: "id",
      customFields: true,
      list: true
    }
  };

  let result = {};

  const getCardRes = await runQuery(`https://api.trello.com/1/cards/${data.card.id}?`, "GET", params);

  if (getCardRes.status === 200) {
    const customFieldStatus = getCardRes.text.customFields.filter(item => item.id === data.customField.id);
    if (customFieldStatus.length > 0 && customFieldStatus[0].options.filter) {
      const statusValue = customFieldStatus[0].options.filter(item => item.id === data.customFieldItem.idValue);
      const status = statusValue.length > 0 ? statusValue[0].value.text : undefined;
      if (status) {
        const listName = getCardRes.text.list.name;
        if (listName != status) {
          result = await moveToList(data, status);
        } else {
          result.status = 200;
          result.text = `The list the card ${data.card.name} is on matches with status ${status}`;
        }
      } else {
        result.status = 200;
        result.text = `Could not determine status of card ${data.card.name}`;
      }
    } else {
      result.status = 200;
      result.text = `Could not determine status of card ${data.card.name}`;
    }
  } else {
    result.status = getCardRes.status;
    result.text = `Error getting information from card ${data.card.name}`;
  }
  return result;
}

export const setStatusInProgress = async (card) => {

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
    const customFields = getCardRes.text.customFields;
    const customFieldItems = getCardRes.text.customFieldItems;

    let statusIsToDo;
    try {
      const fieldStatus = customFields.filter(item => item.name === "Status")[0];
      const options = fieldStatus.options;
      const valueToDoId = options.filter(item => item.value.text === "To do")[0].id;
      statusIsToDo = customFieldItems.filter(item => item.idValue === valueToDoId).length > 0;
    } catch (error) {
    }

    if (statusIsToDo) {
      result = await setStatus(card, "In progress");
    } else {
      result.status = 200;
      result.text = `Status of card ${card.name} is not "To do"`;
    }
  } else {
    result.status = getCardRes.status;
    result.text = `Error getting information from card ${card.name}`;
  }
  return result;
}

export const setTriggerLabel = async (data) => {
  let result = {};

  const getBoardRes = await runQuery(`https://api.trello.com/1/boards/${data.board.id}/labels?`, "GET");

  if (getBoardRes.status === 200) {
    let labelTriggerId;
    try {
      labelTriggerId = getBoardRes.text.filter(item => item.name === "trigger")[0].id;
    } catch (error) {
    }

    if (labelTriggerId) {
      const params = {
        params: {
          value: labelTriggerId
        }
      };
      const postCardRes = await runQuery(`https://api.trello.com/1/cards/${data.card.id}/idLabels?`, "POST", params);
      result.status = postCardRes.status;
      if (postCardRes.status === 200) {
        result.text = `Added label 'trigger' to card ${data.card.name}`;
      } else {
        result.text = `Error adding the label 'trigger' to card ${data.card.name}`;
      }
    } else {
      result.status = 200;
      result.text = `Board ${data.board.name} does not seem to have a label 'trigger'`;
    }
  } else {
    result.status = getBoardRes.status;
    result.text = `Error getting information from board ${data.board.name}`;
  }
  return result;
}

export const removeVote = async (action) => {
  let result = {};

  const deleteVoteRes = await runQuery(`https://api.trello.com/1/cards/${action.data.card.id}/membersVoted/${action.memberCreator.id}?`, "DELETE");

  result.status = deleteVoteRes.status;
  if (deleteVoteRes.status === 200) {
    result.text = `Deleted the vote from card ${action.data.card.name}`;
  } else {
    result.text = `Error deleting the vote from card ${action.data.card.name}`;
  }
  return result;
}

const setActionDays = async (card, toActionDays) => {
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
    let fieldActionDays;
    let valueActionDays;
    try {
      const actionDays = getCardRes.text.customFields.filter(item => item.name === "Action days")[0];
      fieldActionDays = actionDays.id;
      valueActionDays = actionDays.options.filter(item => item.value.text === toActionDays)[0].id;

      const currentValue = getCardRes.text.customFieldItems.filter(item => item.id === fieldActionDays);
      if (currentValue.length === 0) {
        const params = {
          body: {
            idValue: valueActionDays
          }
        };

        const putCustomFieldItemRes = await runQuery(`https://api.trello.com/1/cards/${card.id}/customField/${fieldActionDays}/item?`, "PUT", params);

        result.status = putCustomFieldItemRes.status;
        if (putCustomFieldItemRes.status === 200) {
          result.text = `Updated the value for the 'Action days' custom field on ${card.name} to ${toActionDays}`;
        } else {
          result.text = `Error updating the value for the 'Action days' custom field on ${card.name}`;
        }
      } else {
        result.status = 200;
        result.text = `Card ${card.name} already has 'Action days' field set`;
      }

    } catch (error) {
      result.status = 200;
      result.text = `Error getting information from 'Action days' field on ${card.name}`;
    }
  } else {
    result.status = getCardRes.status;
    result.text = `Error getting information from card ${card.name}`;
  }
  return result;
}

export const setActionDaysField = async (data) => {
  let result = {};

  if (data.board.name === "Pessoal") {
    result = await setActionDays(data.card, "Any day");
  } else if (data.board.name === "Gestão Atividades(Time)") {
    result = await setActionDays(data.card, "Workdays");
  } else {
    result.status = 200;
    result.text = `No action days rule to execute on board ${data.board.name}`;
  }

  return result;
}

export const verifyTrelloWebhookRequest = (request, secret, callbackURL) => {
  const base64Digest = (s) => {
    return crypto.createHmac("sha1", secret).update(s).digest("base64");
  };
  const content = JSON.stringify(request.body) + callbackURL;
  const doubleHash = base64Digest(content);
  const headerHash = request.headers["x-trello-webhook"];
  return doubleHash == headerHash;
}

export const toggleTodayLabel = async (data) => {
  const tomorrow = () => {
    const today = new Date();
    const midNight = new Date(today.setHours(0, 0, 0, 0));
    return new Date(midNight.setDate(midNight.getDate() + 1));
  }

  let result = {};

  const getBoardRes = await runQuery(`https://api.trello.com/1/boards/${data.board.id}/labels?`, "GET");

  if (getBoardRes.status === 200) {
    let labelTodayId;
    try {
      labelTodayId = getBoardRes.text.filter(item => item.name === "today")[0].id;
    } catch (error) {
    }

    if (labelTodayId) {
      const params = {
        params: {
          fields: "labels",
          list: "true"
        }
      };

      const getCardRes = await runQuery(`https://api.trello.com/1/cards/${data.card.id}?`, "GET", params);

      if (getCardRes.status === 200) {
        const today = data.card.due ? new Date(data.card.due) < tomorrow() : false;
        const labelToday = getCardRes.text.labels.filter(i => i.name === "today").length > 0;
        const doneList = getCardRes.text.list.name === "Done";
        const addLabel = today && !labelToday && !doneList;
        const deleteLabel = (!today && labelToday) || doneList;

        if (addLabel) {
          const params = {
            params: {
              value: labelTodayId
            }
          };
          const postCardRes = await runQuery(`https://api.trello.com/1/cards/${data.card.id}/idLabels?`, "POST", params);
          result.status = postCardRes.status;
          if (postCardRes.status === 200) {
            result.text = `Added label 'today' to card ${data.card.name}`;
          } else {
            result.text = `Error adding the label 'today' to card ${data.card.name}`;
          }
        } else if (deleteLabel) {
          const deleteLabelRes = await runQuery(`https://api.trello.com/1/cards/${data.card.id}/idLabels/${labelTodayId}?`, "DELETE");
          result.status = deleteLabelRes.status;
          if (deleteLabelRes.status === 200) {
            result.text = `Deleted the label today from card ${data.card.name}`;
          } else {
            result.text = `Error deleting the label today from card ${data.card.name}`;
          }
        } else {
          result.status = 200;
          result.text = `No change on label 'today' for card ${data.card.name}`;
        }
      } else {
        result.status = getCardRes.status;
        result.text = `Error getting information from card ${data.card.name}`;
      }
    } else {
      result.status = 200;
      result.text = `Board ${data.board.name} does not seem to have a label 'today'`;
    }
  } else {
    result.status = getBoardRes.status;
    result.text = `Error getting information from board ${data.board.name}`;
  }
  return result;
}

const fieldValue = (customFields, customFieldItems, name) => {
  try {
    const model = customFields.filter(i => i.name === name)[0];
    const field = customFieldItems.filter(i => i.idCustomField === model.id)[0];
    switch (model.type) {
      case ("list"):
        return model.options.findIndex(i => i.id === field.idValue).toString();
      case ("checkbox"):
        return field.value.checked;
      default:
        return field.value[model.type];
    }
  }
  catch (err) {
    return "null";
  }
}

export const setImportance = async (card) => {

  const params = {
    params: {
      fields: "labels,due",
      customFields: true,
      customFieldItems: true,
      list: true
    }
  };

  let result = {};

  const getCardRes = await runQuery(`https://api.trello.com/1/cards/${card.id}?`, "GET", params);

  if (getCardRes.status === 200) {
    const customFields = getCardRes.text.customFields;
    const customFieldItems = getCardRes.text.customFieldItems;
    const labels = getCardRes.text.labels;
    const dueDate = getCardRes.text.due;
    const doneList = getCardRes.text.list.name === "Done";

    const priority = fieldValue(customFields, customFieldItems, "Priority");
    const star = labels.filter(i => i.name === "star").length > 0;
    const due = dueDate ? new Date(dueDate) : new Date("2999/12/31");
    const category = fieldValue(customFields, customFieldItems, "Category");
    let nextAction = new Date(fieldValue(customFields, customFieldItems, "Deadline"));
    const importance = fieldValue(customFields, customFieldItems, "Importance");
    let newImportance = 2;

    if (!doneList) {

      switch (priority) {
        case "0":
          newImportance += 3;
          break;

        case "1":
          newImportance += 2;
          break;

        case "2":
          newImportance += 1;
          break;

        default:
          break;
      }

      newImportance += star ? 1 : 0;

      const today = new Date();

      // Calculate difference between two dates in days
      const dateDiff = (originalDate, futureDate) => {
        const _MS_PER_DAY = 1000 * 60 * 60 * 24;
        return Math.floor((futureDate - originalDate) / _MS_PER_DAY);
      }

      const daysToDue = dateDiff(today, due);

      if (daysToDue < 0) {
        newImportance += 3;
      } else if (daysToDue < 1) {
        newImportance += 2;
      }

      newImportance += (category === "3") ? 1 : 0;

      nextAction = isNaN(nextAction) ? new Date("2999/12/31") : nextAction;
      const daysToNextAction = dateDiff(today, nextAction);

      if (daysToNextAction < 0) {
        newImportance += 6;
      } else if (daysToNextAction < 1) {
        newImportance += 5;
      } else if (daysToNextAction < 2) {
        newImportance += 3;
      } else if (daysToNextAction < 7) {
        newImportance += 2;
      } else if (daysToNextAction < 14) {
        newImportance += 1;
      }

    } else {
      newImportance = 0;
    }

    if (newImportance != importance) {
      const fieldImportance = getCardRes.text.customFields.filter(item => item.name === "Importance")[0].id;

      const params = {
        body: {
          value: {
            number: newImportance.toString()
          }
        }
      };

      const putCustomFieldItemRes = await runQuery(`https://api.trello.com/1/cards/${card.id}/customField/${fieldImportance}/item?`, "PUT", params);

      result.status = putCustomFieldItemRes.status;
      if (putCustomFieldItemRes.status === 200) {
        result.text = `Updated the value for the Importance custom field on ${card.name} to ${newImportance}`;
      } else {
        result.text = `Error updating the value for the Importance custom field on ${card.name}`;
      }
    } else {
      result.status = 200;
      result.text = `Importance of card ${card.name} has not changed`;
    }
  } else {
    result.status = getCardRes.status;
    result.text = `Error getting information from card ${card.name}`;
  }
  return result;
}

export const sortCard = async (data) => {

  const params = {
    params: {
      fields: "idList"
    }
  };

  let result = {};

  const getCardRes = await runQuery(`https://api.trello.com/1/cards/${data.card.id}?`, "GET", params);

  if (getCardRes.status === 200) {
    const idList = getCardRes.text.idList;
    console.log("idList", idList);
    result = await sortList(data.board.id, idList, data.card.id);
  } else {
    result.status = getCardRes.status;
    result.text = `Error getting information from card ${data.card.name}`;
  }
  return result;
}

const sortList = async (idBoard, idList, idCard) => {
  let result = {};

  const params = {
    params: {
      fields: "pos,due",
      customFieldItems: true
    }
  };

  const getBoardRes = await runQuery(`https://api.trello.com/1/boards/${idBoard}/customFields?`, "GET");
  const getListRes = await runQuery(`https://api.trello.com/1/lists/${idList}/cards?`, "GET", params);

  if (getBoardRes.status != 200) {
    result.status = getBoardRes.status;
    result.text = `Error getting information from board ${idBoard}`;
    return result;
  }
  if (getListRes.status != 200) {
    result.status = getListRes.status;
    result.text = `Error getting information from list ${idList}`;
    return result;
  }

  // Sort the whole list
  const board = getBoardRes.text;
  const list = getListRes.text;

  const cards = list.map((item) => {
    const importance = fieldValue(board.customFields, item.customFieldItems, "Importance");
    const sortImportance = (100 - (isNaN(parseInt(importance)) ? 90 : importance)).toString();
    return {
      id: item.id,
      pos: item.pos,
      sorter: (
        sortImportance
        + fieldValue(board.customFields, item.customFieldItems, "Priority")
        + item.due
        + fieldValue(board.customFields, item.customFieldItems, "Deadline")
        + fieldValue(board.customFields, item.customFieldItems, "Start date"))
    }
  })

  const sortedCards = cards.sort(
    (a, b) => {
      if (a.sorter > b.sorter) {
        return 1;
      } else if (b.sorter > a.sorter) {
        return -1;
      }
      return 0;
    });

  // Update pos value for the changed card only if its position in the list is to be changed
  const oldIndex = list.findIndex(item => item.id === idCard);
  const newIndex = sortedCards.findIndex(item => item.id === idCard);
  if (newIndex != oldIndex) {
    if (newIndex > 0) {
      posBefore = sortedCards[newIndex - 1].pos;
    } else {
      posBefore = 0;
    }
    const listLength = sortedCards.length;
    if (newIndex < (listLength - 1)) {
      posAfter = sortedCards[newIndex + 1].pos;
    } else {
      posAfter = sortedCards[listLength - 1].pos + 100;
    }
    sortedCards[newIndex].pos = posBefore + (posAfter - posBefore) / 2;

    const params = {
      params: {
        pos: sortedCards[newIndex].pos.toString()
      }
    };

    const changePosRes = await runQuery(`https://api.trello.com/1/cards/${data.card.id}?`, "PUT", params);

    result.status = changePosRes.status;
    if (changePosRes.status === 200) {
      result.text = `Changed position of ${data.card.name} in list`;
    } else {
      result.text = `Error changing position of ${data.card.name} in list`;
    }
  } else {
    result.status = 200;
    result.text = "No need to sort the list";
  }
}