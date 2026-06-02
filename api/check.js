export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  if (req.method === "POST" && req.body.key === "ceshi123") {
    return res.json({ ok: true })
  }
  return res.json({ ok: false })
}
