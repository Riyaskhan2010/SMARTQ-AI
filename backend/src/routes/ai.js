// AI Prediction & Recommendation Routes
// Calls Python FastAPI service; falls back to built-in algorithm if unavailable
const router = require('express').Router();
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');
const { calculateETA, getCrowdLevel } = require('../services/queueService');
const prisma = new PrismaClient();

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

async function callAIService(endpoint, payload) {
  try {
    const { data } = await axios.post(`${AI_URL}${endpoint}`, payload, { timeout: 3000 });
    return { data, fromAI: true };
  } catch {
    return { data: null, fromAI: false };
  }
}

// POST /api/ai/predict
router.post('/predict', authenticate, async (req, res) => {
  try {
    const { queueId, departmentId } = req.body;

    // Gather live data
    let queueData;
    if (queueId) {
      queueData = await prisma.queue.findUnique({
        where: { id: queueId },
        include: { tokens: { where: { status: 'WAITING' } } },
      });
    } else if (departmentId) {
      queueData = await prisma.queue.findUnique({
        where: { departmentId },
        include: { tokens: { where: { status: 'WAITING' } } },
      });
    }

    const counters = queueData
      ? await prisma.counter.findMany({ where: { departmentId: queueData.departmentId } })
      : [];

    const activeCounters = counters.filter(c => c.status === 'OPEN').length;
    const waitingCount   = queueData?.tokens?.length || 0;

    const services = queueData
      ? await prisma.service.findMany({ where: { department: { id: queueData.departmentId } } })
      : [];
    const avgServiceTime = services.length
      ? services.reduce((s, svc) => s + svc.avgServiceTime, 0) / services.length
      : 8;

    const now = new Date();
    const payload = {
      waiting_count: waitingCount,
      active_counters: activeCounters,
      avg_service_time: avgServiceTime,
      hour_of_day: now.getHours(),
      day_of_week: now.getDay(),
      no_show_rate: 0.08,
    };

    // Try Python AI service first
    const aiResult = await callAIService('/predict', payload);

    let estimatedWait, crowdLevel, confidence, recommendation;

    if (aiResult.fromAI && aiResult.data) {
      estimatedWait = aiResult.data.estimated_wait;
      crowdLevel    = aiResult.data.crowd_level;
      confidence    = aiResult.data.confidence;
      recommendation = aiResult.data.recommendation;
    } else {
      // Built-in fallback
      estimatedWait = calculateETA({ waitingAhead: waitingCount, activeCounters, avgServiceTime });
      crowdLevel    = getCrowdLevel(waitingCount, activeCounters);
      confidence    = Math.min(0.95, 0.65 + activeCounters * 0.05);
      if (waitingCount / Math.max(1, activeCounters) > 8) {
        recommendation = `Opening Counter ${activeCounters + 1} may reduce estimated waiting time by approximately ${Math.ceil(estimatedWait * 0.35)} minutes.`;
      } else {
        recommendation = 'Queue is operating within normal parameters.';
      }
    }

    // Save prediction
    let savedPrediction = null;
    if (queueData) {
      savedPrediction = await prisma.prediction.create({
        data: {
          queueId: queueData.id, estimatedWait, crowdLevel, confidence,
          activeCounters, waitingCount, avgServiceTime, noShowRate: 0.08, recommendation,
        },
      });
    }

    res.json({ estimatedWait, crowdLevel, confidence, recommendation, activeCounters, waitingCount, avgServiceTime, fromAI: aiResult.fromAI, prediction: savedPrediction });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/recommend
router.post('/recommend', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const { queueId } = req.body;

    const queue = await prisma.queue.findUnique({
      where: { id: queueId },
      include: { tokens: { where: { status: 'WAITING' } } },
    });
    if (!queue) return res.status(404).json({ error: 'Queue not found' });

    const counters = await prisma.counter.findMany({ where: { departmentId: queue.departmentId } });
    const activeCounters = counters.filter(c => c.status === 'OPEN').length;
    const waitingCount   = queue.tokens.length;
    const avgServiceTime = 8;

    const currentETA  = calculateETA({ waitingAhead: waitingCount, activeCounters, avgServiceTime });
    const expectedETA = calculateETA({ waitingAhead: waitingCount, activeCounters: activeCounters + 1, avgServiceTime });

    let action = '', message = '';
    if (waitingCount / Math.max(1, activeCounters) > 8) {
      action  = `Open Counter ${activeCounters + 1}`;
      message = `High crowd detected. ${waitingCount} patients waiting with only ${activeCounters} active counters.`;
    } else if (waitingCount < 3 && activeCounters > 1) {
      action  = `Consider closing Counter ${activeCounters}`;
      message = `Low crowd. Only ${waitingCount} patients waiting across ${activeCounters} counters.`;
    } else {
      action  = 'No action required';
      message = `Queue is operating within normal parameters. ${waitingCount} waiting, ${activeCounters} active.`;
    }

    const rec = await prisma.recommendation.create({
      data: { queueId, message, action, currentETA, expectedETA, isAccepted: false },
    });

    res.json({ recommendation: rec, currentETA, expectedETA, improvement: currentETA - expectedETA });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
