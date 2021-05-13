import { runQuery, getCustomFields, getCheckListItems, addDays, daysUntilRepeat, dateDiff } from '../../../../../../modules/common.js';

export default async function repeat(req, res) {
  const startHours = 8;
  const endHours = 20;
  const { card } = req.query;

  const lists = {
    //Gestão Atividades(Time)
    "5db83c370351f02c0cc4cdc0": "60744f6fcc5e726b0cee8f28", //Backlog
    "60744f6fcc5e726b0cee8f28": "60744f6fcc5e726b0cee8f28", //To do
    "60744f744099274270a2bbc8": "60744f6fcc5e726b0cee8f28", //In progress
    "60744f7a9f7fca812d031a57": "60744f6fcc5e726b0cee8f28", //Blocked
    "5db83c48f7622f4bb7aa13ee": "60744f6fcc5e726b0cee8f28", //Done
    //Pessoal
    "5ecff75273eafa24ffced66c": "6071bd1743cb2465fd87ab91", //Backlog
    "6071bd1743cb2465fd87ab91": "6071bd1743cb2465fd87ab91", //To do
    "6071bd25acd850653e4f0a81": "6071bd1743cb2465fd87ab91", //In progress
    "6071bde7bda1bb25b1060b8d": "6071bd1743cb2465fd87ab91", //Blocked
    "5ecff75273eafa24ffced671": "6071bd1743cb2465fd87ab91"  //Done
  }

  if (req.method === "POST") {

    // Get info from original card

    const params = {
      params: {
        fields: "idList,due,start",
        customFields: "true",
        customFieldItems: "true",
        checklists: "all",
      }
    };

    const cardRes = await runQuery(`https://api.trello.com/1/cards/${card}/?`, "GET", params);

    if (cardRes.status === 200) {
      const cardJson = cardRes.text;
      const idList = lists[cardJson.idList] ? lists[cardJson.idList] : cardJson.idList;
      const customFields = getCustomFields(cardJson);
      let recurring = customFields.Recurring ? parseInt(customFields.Recurring) : 0;
      const recPeriod = customFields["Recurring period"] ? customFields["Recurring period"] : "days";
      const actionDays = customFields["Action days"] ? customFields["Action days"] : "Any day";

      if (recurring != 0) {

        // Copy card
        const copyParams = {
          body: {
            pos: "top",
            idList: idList,
            idCardSource: card,
            keepFromSource: "attachments,checklists,due,labels,members,stickers"
          }
        }

        const copyRes = await runQuery(`https://api.trello.com/1/cards/?`, "POST", copyParams);

        if (copyRes.status === 200) {
          const copyJson = copyRes.text;
          const newCard = copyJson.id;

          // Get checklist items from new card
          const paramsCL = {
            params: {
              fields: "id",
              checklists: "all",
            }
          };

          const getCheckListRes = await runQuery(`https://api.trello.com/1/cards/${newCard}/?`, "GET", paramsCL);

          if (getCheckListRes.status === 200) {
            const checkListsJson = getCheckListRes.text;
            const checkLists = getCheckListItems(checkListsJson, true);

            // Change fields
            let putJson = {};

            // Checklist items
            let earliestDate;
            putJson.checkListItems = [];
            for (let i = 0; i < checkLists.length; i++) {
              let checkListDue = new Date(checkLists[i].due);
              checkLists[i].due = (recPeriod === "days") ? addDays(checkListDue, recurring, actionDays, checkListDue) : new Date(checkListDue.setUTCDate(checkListDue.getUTCDate() + recurring));
              earliestDate = (checkLists[i].due < earliestDate || !earliestDate) ? new Date(checkLists[i].due) : earliestDate;
              putJson.checkListItems.push({
                id: checkLists[i].id,
                params: {
                  due: JSON.parse(JSON.stringify(checkLists[i].due))
                }
              })
            }

            // Due date
            let due;
            if (earliestDate) { // first checklist item date
              due = earliestDate;
            } else {
              due = cardJson.due ? new Date(cardJson.due) : new Date();
              if (!cardJson.due) {
                due.setHours(endHours, 0, 0, 0);
              }
            }
            recurring = daysUntilRepeat(due, recurring, recPeriod);

            // Start date
            let start = new Date(due);
            start.setHours(startHours, 0, 0, 0);
            if (cardJson.start) {
              start = new Date(cardJson.start);
            }
            start = (recPeriod === "days") ? addDays(start, recurring, actionDays, start) : new Date(start.setUTCDate(start.getUTCDate() + recurring));

            // Due date
            due = (recPeriod === "days") ? addDays(due, recurring, actionDays, due) : new Date(due.setUTCDate(due.getUTCDate() + recurring));

            putJson.main = {
              params: {
                start: JSON.parse(JSON.stringify(start)),
                due: JSON.parse(JSON.stringify(due))
              }
            };

            // Custom fields
            putJson.customFields = [];

            // Status
            // Commented out because Butler is setting status according to the list the card is created in
            /*             customFields.Status = "To do";
            
                        putJson.customFields.push({
                          idCustomField : customFields.idCustomFieldStatus,
                          body : {
                              idValue : JSON.parse(JSON.stringify(customFields["idCustomFieldValueStatusTo do"]))
                          }
                        }); */

            // Start date (Custom fields)
            customFields["Start date"] = new Date(start);
            putJson.customFields.push({
              idCustomField: customFields["idCustomFieldStart date"],
              body: {
                value: {
                  date: JSON.parse(JSON.stringify(customFields["Start date"]))
                }
              }
            });

            // Next action
            if (customFields["Deadline"]) { // card has next action date
              let nextAction = new Date(customFields["Deadline"]);
              nextAction = (recPeriod === "days") ? addDays(nextAction, recurring, actionDays, nextAction) : new Date(nextAction.setUTCDate(nextAction.getUTCDate() + recurring));
              customFields["Deadline"] = new Date(nextAction);
              putJson.customFields.push({
                idCustomField: customFields["idCustomDeadline"],
                body: {
                  value: {
                    date: JSON.parse(JSON.stringify(customFields["Deadline"]))
                  }
                }
              });
            }

            // Date concluded
            customFields["Date concluded"] = null;
            putJson.customFields.push({
              idCustomField: customFields["idCustomFieldDate concluded"],
              body: {
                value: JSON.parse(JSON.stringify(""))
              }
            });

            // Change main fields of new card
            const changeMainRes = await runQuery(`https://api.trello.com/1/cards/${newCard}/?`, "PUT", putJson.main);

            if (changeMainRes.status === 200) {

              // Change custom fields of new card
              let changeCFRes;

              console.log(putJson.customFields);
              for (let i = 0; i < putJson.customFields.length; i++) {
                const changeCustomFieldRes = await runQuery(`https://api.trello.com/1/cards/${newCard}/customField/${putJson.customFields[i].idCustomField}/item?`, "PUT", putJson.customFields[i]);
                changeCFRes = changeCustomFieldRes;

                if (changeCustomFieldRes.status != 200) {
                  break;
                }

              }

              if (putJson.customFields.length === 0 || changeCFRes.status === 200) {

                // Change check list items of new card
                let changeCLRes;

                for (let i = 0; i < putJson.checkListItems.length; i++) {
                  const changeCheckListRes = await runQuery(`https://api.trello.com/1/cards/${newCard}/checkItem/${putJson.checkListItems[i].id}?`, "PUT", putJson.checkListItems[i]);
                  changeCLRes = changeCheckListRes;

                  if (changeCheckListRes.status != 200) {
                    break;
                  }

                }

                if (putJson.checkListItems.length === 0 || changeCLRes.status === 200) {

                  res.status(201).json({
                    newCard
                  })

                } else { // Error changing check list items
                  res.status(changeCLRes.status).send(changeCLRes.text);
                }

              } else { // Error changing custom fields
                res.status(changeCFRes.status).send(changeCFRes.text);
              }

            } else { // Error changing main fields
              res.status(changeMainRes.status).send(changeMainRes.text);
            }

          } else { // Error getting check lists from new card
            res.status(getCheckListRes.status).send(getCheckListRes.text);
          }

        } else { // Error copying card
          res.status(copyRes.status).send(copyRes.text);
        }

      } else { // No recurrency set
        res.status(204).json({
          cardRes
        });
      }

    } else { // Error getting card
      res.status(cardRes.status).send(cardRes.text);
    }

  } else {
    res.status(404).send(`Cannot ${req.method} ${req.url}`);
  }

}