const SERVICES = {
  puncture:  { name: 'Puncture Fix',      basePrice: 350,  xp: 50,  time: '15–20 min', icon: 'wrench' },
  battery:   { name: 'Battery Jumpstart', basePrice: 450,  xp: 70,  time: '10–15 min', icon: 'zap' },
  engine:    { name: 'Engine Trouble',    basePrice: 600,  xp: 100, time: '30–45 min', icon: 'settings' },
  fuel:      { name: 'Fuel Delivery',     basePrice: 300,  xp: 40,  time: '20–30 min', icon: 'droplets' },
  ev_charge: { name: 'EV Charging',       basePrice: 800,  xp: 90,  time: '15–25 min', icon: 'battery-charging' },
  towing:    { name: 'Towing Service',    basePrice: 1500, xp: 120, time: '25–40 min', icon: 'truck' },
};

const VEHICLE_MULTIPLIERS = { bike: 1.0, car: 1.4, ev: 1.3 };

const PLATFORM_FEE = 0.10;

const LEVEL_THRESHOLDS = [0, 300, 700, 1200, 2000, 3000, 5000, 8000, 12000, 18000];
const LEVEL_NAMES = ['Rookie', 'Helper', 'Tech', 'Specialist', 'Expert', 'Master', 'Elite', 'Legend', 'Hero', 'Champion'];

function calculateFare(serviceType, vehicleType) {
  const service = SERVICES[serviceType];
  if (!service) return 0;
  const multiplier = VEHICLE_MULTIPLIERS[vehicleType] || 1.0;
  return Math.round(service.basePrice * multiplier);
}

function getLevel(xp) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      return {
        level: i + 1,
        name: LEVEL_NAMES[i],
        currentXp: xp,
        nextLevelXp: LEVEL_THRESHOLDS[i + 1] || null,
        prevLevelXp: LEVEL_THRESHOLDS[i],
      };
    }
  }
  return { level: 1, name: 'Rookie', currentXp: xp, nextLevelXp: LEVEL_THRESHOLDS[1], prevLevelXp: 0 };
}

module.exports = { SERVICES, VEHICLE_MULTIPLIERS, PLATFORM_FEE, LEVEL_THRESHOLDS, LEVEL_NAMES, calculateFare, getLevel };
