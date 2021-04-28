export default function callback(req, res) {
  const { body } = req;
  console.log(body);
  res.status(200).json(body);
}