const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = Number(process.env.PORT || 3030);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const dataDir = path.join(__dirname, 'data');
const reviewsData = JSON.parse(fs.readFileSync(path.join(dataDir, 'reviews.json'), 'utf8'));
const dealershipsData = JSON.parse(fs.readFileSync(path.join(dataDir, 'dealerships.json'), 'utf8'));

const Reviews = require('./review');
const Dealerships = require('./dealership');

app.get('/', (_req, res) => res.send('Welcome to the Mongoose API'));

app.get('/fetchReviews', async (_req, res) => {
  try { res.json(await Reviews.find()); }
  catch (e) { res.status(500).json({ error: 'Error fetching reviews' }); }
});

app.get('/fetchReviews/dealer/:id', async (req, res) => {
  try { res.json(await Reviews.find({ dealership: String(req.params.id) })); }
  catch (e) { res.status(500).json({ error: 'Error fetching dealer reviews' }); }
});

app.get('/fetchDealers', async (_req, res) => {
  try { res.json(await Dealerships.find()); }
  catch (e) { res.status(500).json({ error: 'Error fetching dealerships' }); }
});

app.get('/fetchDealers/:state', async (req, res) => {
  try { res.json(await Dealerships.find({ state: req.params.state })); }
  catch (e) { res.status(500).json({ error: 'Error fetching dealerships by state' }); }
});

app.get('/fetchDealer/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid dealer ID' });
  try {
    const dealer = await Dealerships.findOne({ id });
    if (!dealer) return res.status(404).json({ error: 'Dealer not found' });
    res.json(dealer);
  } catch (e) { res.status(500).json({ error: 'Error fetching dealership' }); }
});

app.post('/insert_review', async (req, res) => {
  const data = req.body || {};
  const required = ['name', 'dealership', 'review'];
  if (required.some(k => !String(data[k] || '').trim())) {
    return res.status(400).json({ error: 'Name, dealership and review are required' });
  }
  try {
    const last = await Reviews.findOne().sort({ id: -1 });
    const review = new Reviews({
      id: last ? Number(last.id) + 1 : 1,
      name: data.name,
      dealership: String(data.dealership),
      review: data.review,
      purchase: data.purchase || false,
      purchase_date: data.purchase_date || '',
      car_make: data.car_make || '',
      car_model: data.car_model || '',
      car_year: data.car_year || ''
    });
    res.status(201).json(await review.save());
  } catch (e) {
    console.error('insert_review:', e);
    res.status(500).json({ error: 'Error inserting review' });
  }
});

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URL || 'mongodb://mongo_db:27017/dealershipsDB');
    await Reviews.deleteMany({});
    await Dealerships.deleteMany({});
    await Reviews.insertMany(reviewsData.reviews);
    await Dealerships.insertMany(dealershipsData.dealerships);
    console.log(`Loaded ${reviewsData.reviews.length} reviews and ${dealershipsData.dealerships.length} dealerships`);
    app.listen(port, '0.0.0.0', () => console.log(`Server is running on http://localhost:${port}`));
  } catch (e) {
    console.error('API startup failed:', e);
    process.exit(1);
  }
}
start();
