const $ = (id) => document.getElementById(id);
const numberValue = (id) => Number($(id).value || 0);

function getInputValues(){
  return {
    tunnelType: $('tunnelType').value,
    length: numberValue('length'),
    aadt: numberValue('aadt'),
    soundTunnel: $('soundTunnel').value,
    elevationDiff: numberValue('elevationDiff'),
    approachGrade: numberValue('approachGrade'),
    height: numberValue('height'),
    curveRadius: numberValue('curveRadius'),
    heavyRate: numberValue('heavyRate'),
    heavyAadt: numberValue('heavyAadt'),
    smallTruckAadt: numberValue('smallTruckAadt'),
    exhaustDistance: numberValue('exhaustDistance'),
    miniFireStation: $('miniFireStation').value,
    hazardMonitoring: $('hazardMonitoring').value,
    hazardGuidance: $('hazardGuidance').value,
    los: $('los').value,
    mergeCount: numberValue('mergeCount'),
    exitControl: $('exitControl').value,
    trafficDirection: $('trafficDirection').value
  };
}

function setTunnelTypeFields(){
  const isSmall = $('tunnelType').value === 'small';
  document.querySelectorAll('.small-only').forEach(el => el.classList.toggle('hidden', !isSmall));
  document.querySelectorAll('.normal-only').forEach(el => el.classList.toggle('hidden', isSmall));
}

function validateInputs(){
  let ok = true;
  document.querySelectorAll('input[type="number"]').forEach(input => {
    const value = Number(input.value || 0);
    const invalid = Number.isNaN(value) || value < 0;
    input.classList.toggle('invalid', invalid);
    if(invalid) ok = false;
  });
  return ok;
}

function gradeClass(g){ return `grade-${g}`; }
function badgeClass(g){ return `badge g${g}`; }
function fmt(n){ return Number(n).toLocaleString('ko-KR', {maximumFractionDigits:2}); }

function renderResult(result){
  const el = $('result');
  const now = new Date().toLocaleString('ko-KR');
  const rows = result.rows.map((r, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${r[0]}</td>
      <td>${typeof r[1] === 'number' ? fmt(r[1]) : r[1]}</td>
      <td class="score">${fmt(r[2])}</td>
    </tr>`).join('');

  el.innerHTML = `
    <div class="result-title">
      <h2>계산 결과</h2>
      <span class="timestamp">계산시각: ${now}</span>
    </div>
    <div class="summary">
      <div class="metric"><span>위험도지수 X</span><b>${fmt(result.riskIndex)}</b></div>
      <div class="metric ${gradeClass(result.lengthGrade)}"><span>연장등급</span><b>${result.lengthGrade}등급</b></div>
      <div class="metric ${gradeClass(result.rawRiskGrade)}"><span>위험도 기준 방재등급</span><b>${result.rawRiskGrade}등급</b></div>
      <div class="metric ${gradeClass(result.finalGrade)}"><span>최종 적용 방재등급</span><b>${result.finalGrade}등급</b></div>
    </div>
    <p><span class="${badgeClass(result.finalGrade)}">최종 ${result.finalGrade}등급</span> 연장등급과 위험도 기준 등급의 관계를 반영하여 산정했습니다.</p>
    <div class="details" aria-label="산정 근거 표">
      <table>
        <thead><tr><th>No.</th><th>항목</th><th>입력/계산값</th><th>점수</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  el.classList.add('show');
  el.scrollIntoView({behavior:'smooth', block:'start'});
}

function downloadJson(data){
  const payload = {meta:{standard:'국토교통부예규 제461호, 시행 2026.04.30', version:'0.2'}, input:getInputValues(), result:data};
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tunnel-safety-2026-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

let lastResult = null;
$('tunnelType').addEventListener('change', setTunnelTypeFields);
$('calcForm').addEventListener('submit', (e) => {
  e.preventDefault();
  if(!validateInputs()) return alert('0 이상의 숫자로 입력해 주세요.');
  lastResult = calculate(getInputValues());
  renderResult(lastResult);
});
$('resetBtn').addEventListener('click', () => {
  $('calcForm').reset();
  setTunnelTypeFields();
  $('result').classList.remove('show');
});
$('printBtn').addEventListener('click', () => window.print());
$('jsonBtn').addEventListener('click', () => {
  if(!lastResult){
    if(!validateInputs()) return alert('0 이상의 숫자로 입력해 주세요.');
    lastResult = calculate(getInputValues());
  }
  downloadJson(lastResult);
});

setTunnelTypeFields();
