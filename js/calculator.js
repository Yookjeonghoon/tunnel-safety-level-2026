function rangeScore(v, ranges){
  for(const r of ranges){
    const minOk = r.min === undefined || (r.minInclusive === false ? v > r.min : v >= r.min);
    const maxOk = r.max === undefined || (r.maxInclusive === true ? v <= r.max : v < r.max);
    if(minOk && maxOk) return r.score;
  }
  return 0;
}
function lengthGrade(length, isSound){
  const t = isSound ? SAFETY_2026.lengthGrade.sound : SAFETY_2026.lengthGrade.normal;
  for(const r of t){
    if(r.min !== undefined && length >= r.min) return r.g;
    if(r.min !== undefined && r.max !== undefined && length >= r.min && length < r.max) return r.g;
    if(r.max !== undefined && length < r.max) return r.g;
  }
  return 4;
}
function rawRiskGrade(x){
  if(x > 29) return 1;
  if(x > 19 && x <= 29) return 2;
  if(x > 14 && x <= 19) return 3;
  return 4;
}
function applyFinalGrade(lengthG, riskG, isSound){
  if(!isSound && lengthG === 4) return 4;
  if(riskG < lengthG) return Math.max(1, lengthG - 1);
  if(riskG > lengthG) return Math.min(4, lengthG + 1);
  return lengthG;
}
function normalScores(v){
  const travel = v.length * v.aadt;
  const heavyTravel = v.length * v.heavyAadt;
  return [
    ['주행거리계', travel, rangeScore(travel,[{max:80000,score:1.5},{min:80000,max:160000,score:2.5},{min:160000,max:320000,score:5},{min:320000,max:640000,score:7.5},{min:640000,score:10}])],
    ['입·출구 표고차', v.elevationDiff, rangeScore(v.elevationDiff,[{max:100,score:.5},{min:100,max:200,score:1},{min:200,max:300,score:1.5},{min:300,score:2}])],
    ['진입부 경사도', v.approachGrade, v.approachGrade < 3 ? .5 : 1],
    ['터널높이', v.height, rangeScore(v.height,[{min:7.5,score:1},{min:5,max:7.5,score:2},{max:5,score:3}])],
    ['터널곡선반경', v.curveRadius, v.curveRadius >= 1800 ? .5 : 1],
    ['대형차 혼입률', v.heavyRate, rangeScore(v.heavyRate,[{max:10,score:.5},{min:10,max:17.5,score:1},{min:17.5,max:25,score:1.5},{min:25,score:2}])],
    ['대형차 주행거리계', heavyTravel, rangeScore(heavyTravel,[{max:5000,score:.5},{min:5000,max:10000,score:1},{min:10000,max:25000,score:2},{min:25000,max:50000,score:4},{min:50000,score:6}])],
    ['위험물 감시시스템', v.hazardMonitoring, v.hazardMonitoring === 'yes' ? 0 : 1],
    ['위험물 유도시스템', v.hazardGuidance, v.hazardGuidance === 'yes' ? 0 : 1],
    ['서비스수준', v.los, SAFETY_2026.los[v.los] || 0],
    ['터널 내 합류/분류', v.mergeCount, v.mergeCount > 0 ? 2 : 0],
    ['진출부 교차로/신호등/TG', v.exitControl, v.exitControl === 'yes' ? 2 : 0],
    ['통행방식', v.trafficDirection, SAFETY_2026.direction[v.trafficDirection] || 0]
  ];
}
function smallScores(v){
  const travel = v.length * v.aadt;
  const smallTruckTravel = v.length * v.smallTruckAadt;
  return [
    ['주행거리계', travel, rangeScore(travel,[{max:80000,score:1.5},{min:80000,max:160000,score:2.5},{min:160000,max:320000,score:5},{min:320000,max:640000,score:7.5},{min:640000,max:1280000,score:10},{min:1280000,max:2560000,score:12.5},{min:2560000,score:15}])],
    ['입·출구 표고차', v.elevationDiff, rangeScore(v.elevationDiff,[{max:100,score:.5},{min:100,max:200,score:1},{min:200,max:300,score:1.5},{min:300,max:400,score:2},{min:400,max:500,score:2.5},{min:500,score:3}])],
    ['진입부 경사도', v.approachGrade, v.approachGrade < 3 ? .5 : 1],
    ['터널높이', v.height, rangeScore(v.height,[{min:7.5,score:1},{min:6,max:7.5,score:2},{min:4.5,max:6,score:3},{min:3,max:4.5,score:4},{max:3,score:5}])],
    ['터널곡선반경', v.curveRadius, v.curveRadius >= 1800 ? .5 : 1],
    ['배연구간', v.exhaustDistance, v.exhaustDistance === 0 ? 3 : rangeScore(v.exhaustDistance,[{max:500,score:0},{min:500,max:3000,score:1},{min:3000,score:2}])],
    ['간이소방서', v.miniFireStation, v.miniFireStation === 'yes' ? 0 : 2],
    ['소형화물 주행거리계', smallTruckTravel, rangeScore(smallTruckTravel,[{max:1000,score:.5},{min:1000,max:5000,score:1},{min:5000,max:10000,score:1.5},{min:10000,score:2}])],
    ['서비스수준', v.los, SAFETY_2026.los[v.los] || 0],
    ['터널 내 합류/분류', v.mergeCount, v.mergeCount === 0 ? 0 : Math.min(4, 1.5 + v.mergeCount * .5)],
    ['진출부 교차로/신호등/TG', v.exitControl, v.exitControl === 'yes' ? 2 : 0],
    ['통행방식', v.trafficDirection, SAFETY_2026.direction[v.trafficDirection] || 0]
  ];
}
function calculate(v){
  const isSound = v.soundTunnel === 'yes';
  const rows = v.tunnelType === 'small' ? smallScores(v) : normalScores(v);
  const riskIndex = rows.reduce((s,r)=>s+Number(r[2]||0),0);
  const lGrade = lengthGrade(v.length, isSound);
  const rGrade = rawRiskGrade(riskIndex);
  const fGrade = applyFinalGrade(lGrade, rGrade, isSound);
  return {riskIndex, lengthGrade:lGrade, rawRiskGrade:rGrade, finalGrade:fGrade, rows};
}
