import { authorize, getCards } from "../modules/cards";

// This function gets called at build time
export async function getStaticProps() {
  // const token = await authorize()
  // console.log(token)
  const cards = await getCards()

  // By returning { props: { posts } }, the Blog component
  // will receive `posts` as a prop at build time
  return {
    props: {
      cards
    },
    revalidate: 60,
  }
}

// TODO: Need to fetch `posts` (by calling some API endpoint)
//       before this page can be pre-rendered.
function cards({ cards }) {
  if (cards.map) {
    const activityList = []
    cards.map((item) => {
      const activity = {
        today: item.today,
        importance: item.importance,
        due: item.due,
        name: item.name,
        url: item.url,
        board: item.nameBoard,
        parentCardId: item.parentCardId,
        id: item.id,
      }
      activityList.push(activity);
      console.log(item.today, activity.today);
    })

    const x = 2;

    return (
      <div>
        <ul>
          {activityList.map((activity) => (
            <li>
              {activity.parentCardId === "" ?
                <li>
                  <a href={activity.url}>
                    <p>{`Importance: ${activity.today} - ${activity.importance} - Due: ${activity.due} - ${activity.board} - ${activity.name}`}</p>
                  </a>
                </li>
                :
                <ul>
                  <li>
                    <a href={activity.url}>
                      <p>{`Importance: ${activity.importance} - Due: ${activity.due} - ${activity.name}`}</p>
                    </a>
                  </li>
                </ul>
              }
            </li>
          ))}
        </ul>
      </div>
    )

    return (
      <div>
        <ul>
          {activityList.map((activity) => (
            <li>
              <a href={activity.url}>
                <p>{`Importance: ${activity.importance} - Due: ${activity.due} - ${activity.name} - ${activity.board}`}</p>
              </a>
            </li>
            // <li>{activity.name}</li>
          ))}
        </ul>
      </div>
    )
  } else {
    return (
      <div>
        <p>{ }</p>
      </div>
    )

  }

}

export default cards