const express = require('express');
const pg = require('pg');
const app = express();
const cors = require('cors');
const path = require('path');

const rateLimit = require('./rate-limit'); //API rate limiter

// Database configuration
const PGHOST = 'work-samples-db.cx4wctygygyq.us-east-1.rds.amazonaws.com';
const PGDATABASE = 'work_samples';
const PGUSER = 'readonly';
const PGPASSWORD = 'w2UIO@#bg532!';

const config = {
  host: PGHOST,
  user: PGUSER, // name of the user account
  password: PGPASSWORD,
  database: PGDATABASE, // name of the database
  max: 10, // max number of clients in the pool
  idleTimeoutMillis: 30000 // how long a client is allowed to remain idle before being closed
}

// configs come from standard PostgreSQL env vars
// https://www.postgresql.org/docs/9.6/static/libpq-envars.html
const pool = new pg.Pool(config);

const queryHandler = (req, res, next) => {
  pool.query(req.sqlQuery).then((r) => {
    return res.json(r.rows || [])
  }).catch(next)
}

app.use(cors({origin: 'http://localhost:3000'}))
app.use(rateLimit); //Attach rate limiter
app.use(express.static(path.join(__dirname, 'build')));

app.get('/events/hourly', (req, res, next) => {
  req.sqlQuery = `
    SELECT *
    FROM public.hourly_events
    ORDER BY date, hour
    LIMIT 168;
  `
  return next()
}, queryHandler)

app.get('/events/daily', (req, res, next) => {
  req.sqlQuery = `
    SELECT date, SUM(events) AS events
    FROM public.hourly_events
    GROUP BY date
    ORDER BY date
    LIMIT 7;
  `
  return next()
}, queryHandler)

app.get('/stats/hourly', (req, res, next) => {
  req.sqlQuery = `
    SELECT *
    FROM public.hourly_stats
    ORDER BY date, hour
    LIMIT 168;
  `
  return next()
}, queryHandler)

app.get('/stats/daily', (req, res, next) => {
  req.sqlQuery = `
    SELECT date,
        SUM(impressions) AS impressions,
        SUM(clicks) AS clicks,
        SUM(revenue) AS revenue
    FROM public.hourly_stats
    GROUP BY date
    ORDER BY date
    LIMIT 7;
  `
  return next()
}, queryHandler)

app.get('/poi', (req, res, next) => {
  req.sqlQuery = `
    SELECT *
    FROM public.poi;
  `
  return next()
}, queryHandler)

app.get('/poi-stats/daily', (req, res, next) => {
  req.sqlQuery = `
    SELECT s.date, 
        CAST(SUM(s.impressions) as int) AS impressions,
        CAST(SUM(s.clicks) as int) AS clicks,
        CAST(SUM(s.revenue) as float) AS revenue,
        p.name AS name,
        p.lat AS lat,
        p.lon AS lng,
        CASE WHEN e.events IS NULL THEN CAST(0 as int) ELSE CAST(e.events as int) END AS events
    FROM public.hourly_stats s
    INNER JOIN public.poi p on s.poi_id = p.poi_id
    LEFT JOIN (
        SELECT e.date,
            e.poi_id,
            SUM(e.events) AS events
        FROM public.hourly_events e
        GROUP BY e.date, e.poi_id
    ) e on s.poi_id = e.poi_id and s.date = e.date
    GROUP BY s.date, s.poi_id, p.name, p.lat, p.lon, e.events
    ORDER BY date
    LIMIT 168;
  `
  return next()
}, queryHandler)

app.listen(process.env.PORT || 5555, (err) => {
  if (err) {
    console.error(err)
    process.exit(1)
  } else {
    console.log(`Running on ${process.env.PORT || 5555}`)
  }
})

// last resorts
process.on('uncaughtException', (err) => {
  console.log(`Caught exception: ${err}`)
  process.exit(1)
})
process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason)
  process.exit(1)
})
