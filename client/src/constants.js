export const SERVICES = {
  puncture:  { name: 'Puncture Fix',      basePrice: 350,  time: '15–20 min', emoji: '🛞', color: 'text-orange-500 bg-orange-50' },
  battery:   { name: 'Battery Jumpstart', basePrice: 450,  time: '10–15 min', emoji: '⚡', color: 'text-yellow-500 bg-yellow-50' },
  engine:    { name: 'Engine Trouble',    basePrice: 600,  time: '30–45 min', emoji: '⚙️', color: 'text-gray-600 bg-gray-50' },
  fuel:      { name: 'Fuel Delivery',     basePrice: 300,  time: '20–30 min', emoji: '⛽', color: 'text-blue-500 bg-blue-50' },
  ev_charge: { name: 'EV Charging',       basePrice: 800,  time: '15–25 min', emoji: '🔌', color: 'text-green-500 bg-green-50' },
  towing:    { name: 'Towing Service',    basePrice: 1500, time: '25–40 min', emoji: '🚗', color: 'text-purple-500 bg-purple-50' },
};

export const VEHICLE_TYPES = {
  bike: { label: 'Bike / Scooter', emoji: '🏍️', multiplier: 1.0 },
  car:  { label: 'Car / SUV',      emoji: '🚗', multiplier: 1.4 },
  ev:   { label: 'Electric Vehicle', emoji: '⚡', multiplier: 1.3 },
};

export const LEVEL_NAMES = ['Rookie', 'Helper', 'Tech', 'Specialist', 'Expert', 'Master', 'Elite', 'Legend', 'Hero', 'Champion'];
export const LEVEL_THRESHOLDS = [0, 300, 700, 1200, 2000, 3000, 5000, 8000, 12000, 18000];

export function calculateFare(serviceType, vehicleType) {
  const s = SERVICES[serviceType];
  if (!s) return 0;
  const m = VEHICLE_TYPES[vehicleType]?.multiplier || 1.0;
  return Math.round(s.basePrice * m);
}

export const SPECIALTIES = [
  { key: 'puncture',  label: 'Puncture Fix',      emoji: '🛞' },
  { key: 'battery',   label: 'Battery Jumpstart',  emoji: '⚡' },
  { key: 'engine',    label: 'Engine Repair',      emoji: '⚙️' },
  { key: 'fuel',      label: 'Fuel Delivery',      emoji: '⛽' },
  { key: 'ev_charge', label: 'EV Charging',         emoji: '🔌' },
  { key: 'towing',    label: 'Towing Service',     emoji: '🚗' },
];

export const PARTNER_TYPES = {
  petrol: { label: 'Petrol Pump',         emoji: '⛽', color: 'text-blue-600' },
  ev:     { label: 'EV Charging Station', emoji: '🔌', color: 'text-green-600' },
  hotel:  { label: 'Hotel / Rest Stop',   emoji: '🏨', color: 'text-purple-600' },
};

export const JOB_STATUS_STEPS = [
  { key: 'accepted',    label: 'Mechanic Found',    desc: 'Mechanic accepted your request' },
  { key: 'en_route',   label: 'On the Way',         desc: 'Mechanic is heading to you' },
  { key: 'arrived',    label: 'Mechanic Arrived',   desc: 'Mechanic has reached your location' },
  { key: 'in_progress',label: 'Work in Progress',   desc: 'Mechanic is working on your vehicle' },
  { key: 'completed',  label: 'Job Complete',        desc: 'Your vehicle is ready!' },
];
