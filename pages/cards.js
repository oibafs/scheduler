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
  }
}

// TODO: Need to fetch `posts` (by calling some API endpoint)
//       before this page can be pre-rendered.
function cards({ cards }) {
  if (cards.map) {
    const activityList = []
    cards.map((item) => {
      const activity = {
        importance: item.importance,
        name: item.name,
        url: item.url
      }
      activityList.push(activity)
    })

    return (
      <div>
        <ul>
          {activityList.map((activity) => (
            <li>
              <a href={activity.url}>
                <p>{`Importance: ${activity.importance} - ${activity.name}`}</p>
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