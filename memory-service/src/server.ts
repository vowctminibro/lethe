import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'lethe-memory' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Lethe memory service running on http://localhost:${PORT}`);
});
