export default function callback(req, res) {
  const { body } = req;

  // create card
  if (body.action.type === 'createCard') {

  }

  console.log(util.inspect(body, false, null, true));
  res.status(200).json(body);
}