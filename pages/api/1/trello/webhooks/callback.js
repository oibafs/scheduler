export default function callback(req, res) {
  const { body } = req;
  res.status(200).json(body);
}