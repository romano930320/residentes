export default function handler(req, res) {
  res.status(200).json({
    hasBoldSignKey: !!process.env.BOLDSIGN_API_KEY,
  });
}
