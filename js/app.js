const $ = id => document.getElementById(id);
function num(id){ return Number($(id).value || 0); }
function values(){ return {
  tunnelType:$('tunnelType').value, length:num('length'), aadt:num('aadt'), soundTunnel:$('soundTunnel').value,
  elevationDiff:num('elevationDiff'), approachGrade:num('approachGrade'), height:num('height'), curveRadius:num('curveRadius'),
  heavyRate:num('heavyRate'), heavyAadt:num('heavyAadt'), smallTruckAadt:num('smallTruckAadt'), exhaustDistance:num('exhaustDistance'), miniFireStation:$('miniFireStation').value,
  hazardMonitoring:$('hazardMonitoring').value, hazardGuidance:$('hazardGuidance').value, los:$('los').value, mergeCount:num('mergeCount'), exitControl:$('exitControl').value, trafficDirection:$('trafficDirection').value
};}
function render(){
  const v = values(); const r = calculate(v); window.lastResult = {input:v,result:r,meta:SAFETY_2026.meta};
  $('result').classList.add('show');
  $('result').innerHTML = `
    <h2>계산 결과</h2>
    <div class="summary">
      <div class="pill">위험도지수 X <b>${r.riskIndex.toFixed(1)}</b></div>
      <div class="pill">연장등급 <b>${r.lengthGrade}등급</b></div>
      <div class="pill">최종 방재등급 <b>${r.finalGrade}등급</b></div>
    </div>
    <p>위험도지수 기준 방재등급: ${r.rawRiskGrade}등급</p>
    <div class="details"><table><thead><tr><th>항목</th><th>입력/산정값</th><th>점수</th></tr></thead><tbody>${r.rows.map(x=>`<tr><td>${x[0]}</td><td>${x[1]}</td><td>${Number(x[2]).toFixed(1)}</td></tr>`).join('')}</tbody></table></div>`;
}
function toggleType(){
  const small = $('tunnelType').value === 'small';
  document.querySelectorAll('.small-only').forEach(e=>e.classList.toggle('hidden',!small));
  document.querySelectorAll('.normal-only').forEach(e=>e.classList.toggle('hidden',small));
}
$('calcBtn').addEventListener('click', render);
$('printBtn').addEventListener('click', () => window.print());
$('jsonBtn').addEventListener('click', () => { if(!window.lastResult) render(); const blob = new Blob([JSON.stringify(window.lastResult,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='tunnel-safety-2026-result.json'; a.click(); URL.revokeObjectURL(a.href); });
$('tunnelType').addEventListener('change', toggleType);
toggleType(); render();
