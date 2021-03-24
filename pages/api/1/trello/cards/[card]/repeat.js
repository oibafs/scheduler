import { runQuery, getCustomFields, getCheckListItems, addDays, daysUntilRepeat, dateDiff } from '../../../../../../modules/common.js';

export default async function repeat(req, res) {
  const key = process.env.TRELLOKEY;
  const token = process.env.TRELLOTOKEN;
  const startHours = 8;
  const endHours = 20;
  const { card } = req.query;
  const { body } = req;

  if (req.method === "POST") {

    // Get info from original card

    const auth = {
      key: key,
      token: token
    };
  
    const params = { 
      params : {
        fields: "idList,due,start",
        customFields: "true",
        customFieldItems: "true",
        checklists: "all",
        }
    };
  
    const cardRes = await runQuery(`https://api.trello.com/1/cards/${card}/?`, "GET", auth, params);

    if (cardRes.status === 200) {
      const cardJson = cardRes.text;
      const idList = cardJson.idList;
      const customFields = getCustomFields(cardJson);
      let recurring = customFields.Recurring ? parseInt(customFields.Recurring) : 0;
      const recPeriod = customFields.["Recurring period"] ? customFields.["Recurring period"] : "days";
      const actionDays = customFields.["Action days"] ? customFields.["Action days"] : "Any day";
  
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

        const copyRes = await runQuery(`https://api.trello.com/1/cards/?`, "POST", auth, copyParams);

        if (copyRes.status === 200) {
          const copyJson = copyRes.text;
          const newCard = copyJson.id;

          // Get checklist items from new card
          const paramsCL = { 
            params : {
              fields: "id",
              checklists: "all",
              }
          };
      
          const getCheckListRes = await runQuery(`https://api.trello.com/1/cards/${newCard}/?`, "GET", auth, paramsCL);

          if (getCheckListRes.status === 200) {
            const checkListsJson = getCheckListRes.text;
            const checkLists = getCheckListItems(checkListsJson, true);

            // Change fields
            let putJson = {};

            // Start date
            let due = cardJson.due ? new Date(cardJson.due) : new Date();
            recurring = daysUntilRepeat(due, recurring, recPeriod);

            if (!cardJson.due) {
              due.setHours(endHours, 0, 0, 0);
            }

            let start = new Date(due);
            start.setHours(startHours, 0, 0, 0);

            if (cardJson.start) {
              start = new Date(cardJson.start);
            }

            start = (recPeriod === "days") ? addDays(start, recurring, actionDays, start) : new Date(start.setUTCDate(start.getUTCDate() + recurring));

            // Due date
            due = (recPeriod === "days") ? addDays(due, recurring, actionDays, due) : new Date(due.setUTCDate(due.getUTCDate() + recurring));

            putJson.main = {
              params : {
                start : JSON.parse(JSON.stringify(start)),
                due : JSON.parse(JSON.stringify(due))
              }
            };

            // Custom fields
            putJson.customFields = [];

            // Status
            customFields.Status = "ToDo";

            putJson.customFields.push({
              idCustomField : customFields.idCustomFieldStatus,
              body : {
                  idValue : JSON.parse(JSON.stringify(customFields.idCustomFieldValueStatusToDo))
              }
            });
        
            // Start date (Custom fields)
            customFields["Start date"] = new Date(start);

            putJson.customFields.push({
              idCustomField : customFields.["idCustomFieldStart date"],
              body : {
                value : {
                  date : JSON.parse(JSON.stringify(customFields.["Start date"]))
                }
              }
            });

            // Checklist items
            let earliestDate;
            putJson.checkListItems = [];

            for (let i = 0; i < checkLists.length; i ++) {
              let checkListDue = new Date(checkLists[i].due);
              checkLists[i].due = (recPeriod === "days") ? addDays(checkListDue, recurring, actionDays, checkListDue) : new Date(checkListDue.setUTCDate(checkListDue.getUTCDate() + recurring));
              earliestDate = (checkLists[i].due < earliestDate || !earliestDate) ? new Date(checkLists[i].due) : earliestDate;

              putJson.checkListItems.push({
                id : checkLists[i].id,
                params : {
                  due : JSON.parse(JSON.stringify(checkLists[i].due))
                }
              })
        
            }

            // Next action
            const nextAction = new Date(customFields.["Next action"]);
            customFields.["Next action"] = customFields.["Next action"] ? new Date(nextAction.setUTCDate(nextAction.getUTCDate() + dateDiff(nextAction, earliestDate))) : new Date(earliestDate);
            
            putJson.customFields.push({
              idCustomField : customFields.["idCustomFieldNext action"],
              body : {
                value : {
                  date : JSON.parse(JSON.stringify(customFields.["Next action"]))
                }
              }
            });

            // Date concluded
            customFields.["Date concluded"] = null;

            putJson.customFields.push({
              idCustomField : customFields.["idCustomFieldDate concluded"],
              body : {
                value : JSON.parse(JSON.stringify(""))
              }
            });

            // Change main fields of new card
            const changeMainRes = await runQuery(`https://api.trello.com/1/cards/${newCard}/?`, "PUT", auth, putJson.main);

            if (changeMainRes.status === 200) {

              // Change custom fields of new card
              let changeCFRes;

              for (let i = 0; i < putJson.customFields.length; i ++) {
                const changeCustomFieldRes = await runQuery(`https://api.trello.com/1/cards/${newCard}/customField/${putJson.customFields[i].idCustomField}/item?`, "PUT", auth, putJson.customFields[i]);
                changeCFRes = changeCustomFieldRes;

                if (changeCustomFieldRes.status != 200) {
                  break;
                }

              }

              if (changeCFRes.status === 200) {

                // Change check list items of new card
                let changeCLRes;

                for (let i = 0; i < putJson.checkListItems.length; i ++) {
                  const changeCheckListRes = await runQuery(`https://api.trello.com/1/cards/${newCard}/checkItem/${putJson.checkListItems[i].id}?`, "PUT", auth, putJson.checkListItems[i]);
                  changeCLRes = changeCheckListRes;

                  if (changeCheckListRes.status != 200) {
                    break;
                  }

                }

                if (changeCLRes.status === 200) {
            
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