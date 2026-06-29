const $ = (id) => document.getElementById(id);
const numberValue = (id) => Number($(id).value || 0);

const FIELD_IDS = [
  'tunnelType','length','aadt','soundTunnel','soundPanelMaterial','centerBarrier','fireSpreadZone','buildingDistance','elevationDiff','approachGrade','height','curveRadius',
  'heavyRate','heavyAadt','smallTruckAadt','exhaustDistance','miniFireStation','hazardMonitoring','hazardGuidance',
  'los','mergeCount','exitControl','trafficDirection'
];

const LABELS = {
  tunnelType:{normal:'일반 도로터널', small:'소형차 전용터널'},
  soundTunnel:{no:'아니오', yes:'예'},
  hazardMonitoring:{yes:'있음', no:'없음'},
  hazardGuidance:{yes:'있음', no:'없음'},
  miniFireStation:{yes:'있음', no:'없음'},
  los:{'A-C':'LOS A~C', D:'LOS D', 'E-F':'LOS E~F'},
  exitControl:{no:'없음', yes:'있음'},
  trafficDirection:{oneWithShoulder:'일방통행 · 갓길 있음', oneNoShoulder:'일방통행 · 갓길 없음', twoWithShoulder:'대면통행 · 갓길 있음', twoNoShoulder:'대면통행 · 갓길 없음'}, soundPanelMaterial:{noncombustible:'불연재료', quasi:'준불연재료', flame:'난연재료', other450:'기타재료·450℃ 이상', other:'기타재료·그 외'}, centerBarrier:{yes:'설치', no:'미설치'}, fireSpreadZone:{yes:'있음', no:'없음'}
};

function labelValue(key, value){
  return LABELS[key]?.[value] || value;
}

function getInputValues(){
  return {
    tunnelType: $('tunnelType').value,
    length: numberValue('length'),
    aadt: numberValue('aadt'),
    soundTunnel: $('soundTunnel').value,
    soundPanelMaterial: $('soundPanelMaterial').value,
    centerBarrier: $('centerBarrier').value,
    fireSpreadZone: $('fireSpreadZone').value,
    buildingDistance: numberValue('buildingDistance'),
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
  const sf = $('soundFields');
  if(sf) sf.classList.toggle('hidden', $('soundTunnel').value !== 'yes');
}

function validateInputs(){
  let ok = true;
  document.querySelectorAll('input[type="number"]').forEach(input => {
    const value = Number(input.value || 0);
    const invalid = Number.isNaN(value) || value < 0;
    input.classList.toggle('invalid', invalid);
    if(invalid) ok = false;
  });
  if(numberValue('length') <= 0){ $('length').classList.add('invalid'); ok = false; }
  return ok;
}

function gradeClass(g){ return `grade-${g}`; }
function badgeClass(g){ return `badge g${g}`; }
function fmt(n){ return Number(n).toLocaleString('ko-KR', {maximumFractionDigits:2}); }

function renderInputSummary(input){
  const common = [
    ['터널 종류', labelValue('tunnelType', input.tunnelType)],
    ['방음터널', labelValue('soundTunnel', input.soundTunnel)],
    ['터널연장', `${fmt(input.length)} m`],
    ['튜브당 AADT', `${fmt(input.aadt)} 대/일`],
    ['터널높이', `${fmt(input.height)} m`],
    ['통행방식', labelValue('trafficDirection', input.trafficDirection)]
  ];
  return common.map(([k,v]) => `<div class="input-chip"><span>${k}</span><b>${v}</b></div>`).join('');
}

function renderResult(result, input){
  const el = $('result');
  const now = new Date().toLocaleString('ko-KR');
  const rows = result.rows.map((r, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${r[0]}</td>
      <td>${typeof r[1] === 'number' ? fmt(r[1]) : labelValue(String(r[0]), r[1])}</td>
      <td class="score">${fmt(r[2])}</td>
    </tr>`).join('');

  const formula = result.rows.map(r => fmt(r[2])).join(' + ');
  const facilityRows = renderFacilitySummary(result.finalGrade, result.lengthGrade);

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

    <div class="input-summary" aria-label="입력 요약">${renderInputSummary(input)}</div>

    <details class="explain" open>
      <summary>계산근거 보기</summary>
      <div class="formula"><strong>X = </strong>${formula} = <b>${fmt(result.riskIndex)}</b></div>
      <div class="details" aria-label="산정 근거 표">
        <table>
          <thead><tr><th>No.</th><th>항목</th><th>입력/계산값</th><th>점수</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </details>

    <details class="explain" open>
      <summary>방재시설 설치기준 요약</summary>
      <div class="details"><table><thead><tr><th>시설</th><th>적용 판단</th><th>비고</th></tr></thead><tbody>${facilityRows}</tbody></table></div>
      <p style="padding:12px 16px;color:#5b6472">표 1.2.3의 세부 예외·권장시설·보강설비는 설계조건에 따라 달라질 수 있으므로 최종 적용 전 원문표를 확인하세요.</p>
    </details>`;
  el.classList.add('show');
  el.scrollIntoView({behavior:'smooth', block:'start'});
}

function downloadJson(data){
  const payload = {meta:{standard:'국토교통부예규 제461호, 시행 2026.04.30', version:'1.0-rc1'}, input:getInputValues(), result:data};
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tunnel-safety-2026-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function encodeState(){
  const params = new URLSearchParams();
  const values = getInputValues();
  FIELD_IDS.forEach(id => params.set(id, values[id]));
  return `${location.origin}${location.pathname}?${params.toString()}`;
}

function restoreState(){
  const params = new URLSearchParams(location.search);
  FIELD_IDS.forEach(id => {
    if(params.has(id) && $(id)) $(id).value = params.get(id);
  });
  setTunnelTypeFields();
}

let lastResult = null;
$('tunnelType').addEventListener('change', setTunnelTypeFields);
$('soundTunnel').addEventListener('change', setTunnelTypeFields);
$('calcForm').addEventListener('submit', (e) => {
  e.preventDefault();
  if(!validateInputs()) return alert('터널연장은 0보다 커야 하며, 숫자 입력값은 0 이상이어야 합니다.');
  const input = getInputValues();
  lastResult = calculate(input);
  renderResult(lastResult, input);
});
$('resetBtn').addEventListener('click', () => {
  $('calcForm').reset();
  setTunnelTypeFields();
  $('result').classList.remove('show');
  history.replaceState(null, '', location.pathname);
});
$('printBtn').addEventListener('click', () => window.print());
$('jsonBtn').addEventListener('click', () => {
  if(!lastResult){
    if(!validateInputs()) return alert('터널연장은 0보다 커야 하며, 숫자 입력값은 0 이상이어야 합니다.');
    lastResult = calculate(getInputValues());
  }
  downloadJson(lastResult);
});
$('shareBtn').addEventListener('click', async () => {
  const url = encodeState();
  try{
    await navigator.clipboard.writeText(url);
    alert('현재 입력값이 포함된 URL을 복사했습니다.');
  }catch(e){
    prompt('아래 URL을 복사하세요.', url);
  }
});


function renderFacilitySummary(finalGrade, lengthGrade){
  const rows = [
    ['소화기구','설치','연장등급 기준 기본시설'],
    ['옥내소화전설비', finalGrade <= 2 || lengthGrade <= 2 ? '설치 검토/대상' : '조건부', '연장등급·방재등급 병행'],
    ['비상경보설비', finalGrade <= 3 ? '설치' : '조건부', '방재등급 기준'],
    ['자동화재탐지설비', finalGrade <= 2 ? '설치' : '조건부', '방재등급 기준'],
    ['비상방송설비', finalGrade <= 3 ? '설치' : '조건부', '방재등급 기준'],
    ['CCTV', finalGrade <= 3 ? '설치' : '조건부', '방재등급 기준'],
    ['진입차단설비', finalGrade <= 3 ? '설치 검토' : '조건부', '방재등급 기준'],
    ['비상조명등', lengthGrade <= 3 ? '설치' : '조건부', '연장등급 기준'],
    ['피난연결통로/대피시설', lengthGrade <= 3 ? '설치 검토' : '조건부', '연장 및 구조조건 확인'],
    ['제연설비', finalGrade <= 2 ? '설치 검토' : '조건부', '환기방식·위험도 확인'],
    ['비상전원설비', finalGrade <= 3 ? '설치 검토' : '조건부', '시설 구성에 따라 결정']
  ];
  return rows.map(r=>`<tr><td>${r[0]}</td><td><b>${r[1]}</b></td><td>${r[2]}</td></tr>`).join('');
}

const HELP_DATA = {
  tunnelType:{title:'터널 종류',summary:'일반 도로터널 또는 소형차 전용터널을 선택합니다.',why:'소형차 전용터널은 통과 가능한 차종과 방재 대응 조건이 달라 위험도 산정 항목이 일부 달라집니다.',where:['도로계획/설계보고서','도로관리기관의 터널 기본현황','소형차 전용도로 지정 자료'],basis:'제1편 1.2 적용범위, 2.3.2 위험도지수 산정기준',example:'일반 국도 터널은 일반 도로터널, 소형자동차만 통과 가능한 지하도로는 소형차 전용터널을 선택합니다.',impact:'선택에 따라 계산 항목이 자동 전환됩니다.'},
  length:{title:'터널연장 L',summary:'터널 입구부부터 출구부까지의 길이입니다. 단위는 m입니다.',why:'연장등급 산정의 핵심 입력값이며, AADT와 곱해 주행거리계 위험도에도 반영됩니다.',where:['터널 일반도','도로설계보고서','시설물대장 또는 유지관리대장'],basis:'제1편 2.3.1 터널 등급구분, 2.3.2 주행거리계',example:'1.25 km 터널은 1250으로 입력합니다.',impact:'연장이 길수록 연장등급 및 주행거리계 점수가 커질 수 있습니다.'},
  aadt:{title:'튜브당 AADT',summary:'목표연도의 연평균일교통량입니다. 일방통행 터널은 튜브당 교통량을 입력합니다.',why:'터널 이용 차량이 많을수록 사고 노출 가능성이 커져 위험도지수에 반영됩니다.',where:['교통량 조사보고서','교통영향평가','실시설계보고서','관리기관 교통량 통계'],basis:'제1편 1.3 정의 및 2.3.2 주행거리계',example:'튜브당 20,000대/일이면 20000을 입력합니다.',impact:'터널연장 × AADT가 주행거리계 점수로 변환됩니다.'},
  soundPanelMaterial:{title:'방음판 재료 성능',summary:'방음터널 방음판의 방화성능 재료 등급을 선택합니다.',why:'방음판 재료는 화재확산 위험도에 직접 반영됩니다.',where:['방음시설 설계도서','자재 성능시험 성적서','방화성능 검토서'],basis:'표 1.2.2(c) 방음터널 위험도지수',example:'준불연 성능이면 준불연재료를 선택합니다.',impact:'불연 0점, 준불연 0.5점, 난연 1점, 기타재료는 2~4점입니다.'},
  centerBarrier:{title:'중앙분리벽',summary:'방음터널 내 중앙분리벽 설치 여부입니다.',why:'반대방향 터널로 화재가 확산되는 것을 방지하는 조건입니다.',where:['방음터널 횡단면도','방재계획서'],basis:'표 1.2.2(c) 방음터널 위험도지수',example:'중앙분리벽이 계획되어 있으면 설치를 선택합니다.',impact:'미설치 시 2점이 추가됩니다.'},
  fireSpreadZone:{title:'화재확산 방지구역',summary:'종방향 화재확산을 방지하기 위한 구획 설치 여부입니다.',why:'화재가 방음터널 전체로 확산되는 위험을 줄입니다.',where:['방음터널 상세도','방재계획서'],basis:'표 1.2.2(c) 방음터널 위험도지수',example:'50m 이내 간격의 확산방지구간이 있으면 있음을 선택합니다.',impact:'없음 시 1점이 추가됩니다.'},
  buildingDistance:{title:'인접 민가 이격거리',summary:'방음터널 측벽에서 가장 가까운 민가까지의 거리입니다.',why:'화재 시 주변 건축물 영향 가능성을 반영합니다.',where:['현황측량도','배치도','현장조사'],basis:'표 1.2.2(c) 방음터널 위험도지수',example:'가장 가까운 민가가 35m이면 35를 입력합니다.',impact:'50m 이상 0점, 거리가 가까울수록 점수가 증가합니다.'},
  soundTunnel:{title:'방음터널 여부',summary:'터널형 방음시설이면 “예”를 선택합니다.',why:'방음터널은 일반 터널과 다른 화재 확산 특성과 시설 특성이 있어 일부 기준을 별도로 고려합니다.',where:['시설물 명칭 및 설계도서','방음시설 설계보고서','관리기관 시설대장'],basis:'제1편 1.3 정의, 2.1 일반사항, 2.3.2 방음터널 추가 위험인자',example:'도로 위를 덮는 터널형 방음시설이면 예를 선택합니다.',impact:'연장등급 기준이 일부 달라지며 방음터널 추가 위험인자 입력항목이 표시됩니다.'},
  elevationDiff:{title:'입·출구 표고차',summary:'터널 입구와 출구의 높이 차이입니다. 단위는 m입니다.',why:'표고차가 크면 종단 방향 기류와 피난·제연 조건에 영향을 줄 수 있습니다.',where:['종단면도','도로설계보고서','터널 일반도'],basis:'제1편 2.3.2 터널제원',example:'입구 120m, 출구 240m이면 표고차 120을 입력합니다.',impact:'표고차가 클수록 해당 위험도 점수가 증가합니다.'},
  approachGrade:{title:'진입부 경사도',summary:'터널 진입부의 종단경사입니다. 단위는 %입니다.',why:'경사가 크면 차량 주행 안정성, 정체, 화재 시 연기 거동에 영향을 줄 수 있습니다.',where:['종단면도','도로설계보고서','선형계산서'],basis:'제1편 2.3.2 터널제원',example:'3.2% 경사는 3.2로 입력합니다.',impact:'현재 로직에서는 3% 미만과 3% 이상을 구분합니다.'},
  height:{title:'터널높이',summary:'터널 내부 유효 높이 또는 시설한계와 관련된 높이 조건입니다. 단위는 m입니다.',why:'높이가 낮을수록 열과 연기가 상대적으로 집중될 수 있어 위험도 산정에 반영됩니다.',where:['표준횡단면도','건축한계/시설한계 도면','터널 설계보고서'],basis:'제1편 2.3.2 터널제원',example:'유효 높이가 7.5m이면 7.5로 입력합니다.',impact:'높이가 낮을수록 점수가 커질 수 있습니다.'},
  curveRadius:{title:'터널곡선반경',summary:'터널 평면선형의 대표 곡선반경입니다. 단위는 m입니다.',why:'곡선반경이 작으면 시거와 사고 대응에 불리할 수 있어 위험도에 반영됩니다.',where:['평면도','선형계산서','도로설계보고서'],basis:'제1편 1.3 곡선터널 정의, 2.3.2 터널제원',example:'최소 곡선반경 1,500m이면 1500을 입력합니다.',impact:'현재 로직에서는 1,800m 이상/미만을 구분합니다.'},
  heavyRate:{title:'대형차 혼입률',summary:'전체 교통량 중 대형버스, 중형트럭, 대형트럭, 특수트럭 등의 비율 합계입니다.',why:'대형차는 화재 규모와 사고 피해가 커질 수 있어 위험도지수에 반영됩니다.',where:['차종별 교통량 조사표','교통량 조사보고서','실시설계보고서'],basis:'제1편 1.3 대형차혼입률 정의, 2.3.2 위험인자',example:'대형차 비율이 12.5%이면 12.5를 입력합니다.',impact:'비율이 높을수록 해당 점수가 증가합니다.'},
  heavyAadt:{title:'대형차 통과대수',summary:'하루 동안 터널을 통과하는 대형차 대수입니다. 단위는 대/일입니다.',why:'위험물 수송 및 대형차 화재 위험을 주행거리계 형태로 반영하기 위한 값입니다.',where:['차종별 교통량 자료','교통량 조사보고서','유지관리 교통량 자료'],basis:'제1편 2.3.2 위험물 법적규제 관련 위험인자',example:'대형차가 1,000대/일이면 1000을 입력합니다.',impact:'터널연장 × 대형차 통과대수로 대형차 주행거리계 점수가 산정됩니다.'},
  smallTruckAadt:{title:'소형화물 통과대수',summary:'소형차 전용터널에서 소형화물차의 통과대수입니다.',why:'소형차 전용터널의 화재 위험 특성을 보정하기 위한 항목입니다.',where:['차종별 교통량 조사표','소형차 전용도로 교통량 자료'],basis:'제1편 2.3.2(b) 소형차 전용터널 위험도지수',example:'소형화물 500대/일이면 500을 입력합니다.',impact:'터널연장 × 소형화물 통과대수로 점수가 산정됩니다.'},
  exhaustDistance:{title:'배연구간 최대거리',summary:'소형차 전용터널에서 배연구간 관련 최대거리 조건입니다. 단위는 m입니다.',why:'화재 연기 제어와 피난환경 확보 가능성에 영향을 주는 항목입니다.',where:['환기·제연 설계보고서','방재설비 설계도면','제연 시뮬레이션 자료'],basis:'제1편 2.3.2(b) 소형차 전용터널 위험도지수',example:'최대거리 700m이면 700을 입력합니다. 해당 없음/미설치 조건은 0으로 둡니다.',impact:'거리가 길거나 해당 설비가 없으면 점수가 증가할 수 있습니다.'},
  miniFireStation:{title:'간이소방서 설치',summary:'소형차 전용터널에서 긴급 소화·구조활동을 위한 간이소방서 설치 여부입니다.',why:'접근성이 낮은 장대·지하 터널에서 초기 대응능력에 영향을 줍니다.',where:['방재계획서','운영관리계획서','소방 협의자료'],basis:'제1편 2.2.6 소형차 전용터널의 소화·구조활동 시설',example:'터널 전용 소방·구급 차량과 상주 인력이 계획되어 있으면 있음으로 선택합니다.',impact:'없음 선택 시 소형차 전용터널 위험도 점수가 증가합니다.'},
  hazardMonitoring:{title:'위험물 감시시스템',summary:'위험물수송 차량을 터널 진입 전 감시·검지하는 시스템입니다.',why:'위험물 차량의 이상상태를 사전에 확인하여 사고 가능성을 줄이는 항목입니다.',where:['ITS/방재설비 설계도','운영관리계획서','위험물 차량 관리계획'],basis:'제1편 1.3 위험물 차량 감시시스템 정의, 2.3.2 위험인자',example:'열화상·스캐닝 등으로 진입 통제 가능한 시스템이 있으면 있음으로 선택합니다.',impact:'없음 선택 시 위험도 점수가 증가합니다.'},
  hazardGuidance:{title:'위험물 유도시스템',summary:'위험물수송 차량을 안내·유도하여 안전거리 등을 확보하는 시스템입니다.',why:'위험물 차량 운행 시 사고 확대 가능성을 낮추기 위한 운영 항목입니다.',where:['운영관리계획서','위험물 차량 통행관리 자료','ITS 설계도서'],basis:'제1편 1.3 위험물 차량 유도시스템 정의, 2.3.2 위험인자',example:'관리자 또는 유도차량 안내 체계가 있으면 있음으로 선택합니다.',impact:'없음 선택 시 위험도 점수가 증가합니다.'},
  los:{title:'서비스수준',summary:'도로의 교통상태를 나타내는 서비스수준(LOS)입니다.',why:'정체가 심할수록 화재·사고 시 피난과 소방 접근이 어려워질 수 있습니다.',where:['교통분석 보고서','교통영향평가','도로용량 분석자료'],basis:'제1편 1.3 도로의 설계서비스수준, 2.3.2 정체정도',example:'분석 결과 LOS D이면 LOS D를 선택합니다.',impact:'LOS가 나쁠수록 점수가 증가합니다.'},
  mergeCount:{title:'터널 내 합류/분류 개소',summary:'터널 내부에서 차로가 합류하거나 분류되는 지점의 개수입니다.',why:'합류·분류는 사고 가능성과 정체 가능성을 증가시킬 수 있습니다.',where:['평면도','교통처리계획도','도로설계보고서'],basis:'제1편 2.3.2 정체정도',example:'터널 내부 램프 합류가 1개 있으면 1을 입력합니다.',impact:'개소가 있으면 정체 관련 점수가 증가합니다.'},
  exitControl:{title:'진출부 1km 이내 교차로/신호등/TG',summary:'터널 진출부 1km 이내에 교차로, 신호등, 요금소 등이 있는지 선택합니다.',why:'진출부 병목은 터널 내부 정체를 유발할 수 있어 위험도에 반영됩니다.',where:['평면도','교통처리계획도','현장 조사자료'],basis:'제1편 2.3.2 정체정도',example:'출구 후 700m 지점에 신호교차로가 있으면 있음으로 선택합니다.',impact:'있음 선택 시 정체 관련 점수가 증가합니다.'},
  trafficDirection:{title:'통행방식',summary:'일방통행/대면통행 및 갓길 유무를 선택합니다.',why:'대면통행과 갓길 부재는 사고 대응과 차량 우회·정차 공간 확보에 불리합니다.',where:['도로 횡단면도','교통운영계획','터널 현황자료'],basis:'제1편 2.3.2 통행방식',example:'상·하행 분리 쌍굴 터널이고 갓길이 있으면 일방통행·갓길 있음을 선택합니다.',impact:'대면통행 및 갓길 없음 조건일수록 점수가 높아집니다.'}
};

const GLOSSARY = [
  ['AADT','연평균일교통량. 1년 동안의 평균 일교통량입니다.'],
  ['튜브당 교통량','쌍굴 등 일방통행 터널에서 한 개 터널 튜브에 적용하는 교통량입니다.'],
  ['위험도지수 X','주행거리계, 제원, 교통, 위험물, 정체 조건 등을 점수화해 합산한 값입니다.'],
  ['연장등급','터널연장 L을 기준으로 정하는 등급입니다.'],
  ['방재등급','위험도지수 X를 기준으로 산정하고 연장등급과의 관계를 반영하는 등급입니다.'],
  ['대형차 혼입률','대형버스, 중형트럭, 대형트럭, 특수트럭 구성비의 합입니다.'],
  ['LOS','Level of Service. 도로 교통상태의 질을 나타내는 서비스수준입니다.'],
  ['방음터널','터널과 유사한 형상의 터널형 방음시설입니다.']
];

function helpButton(id){
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'help-btn';
  btn.setAttribute('aria-label', `${HELP_DATA[id]?.title || id} 도움말`);
  btn.textContent = 'i';
  btn.addEventListener('click', (e)=>{e.preventDefault(); openHelp(id);});
  return btn;
}

function installHelpButtons(){
  Object.keys(HELP_DATA).forEach(id => {
    const input = $(id);
    if(!input) return;
    const label = input.closest('.field');
    if(!label || label.querySelector('.help-btn')) return;
    label.insertBefore(helpButton(id), input);
    const hint = document.createElement('span');
    hint.className = 'field-hint';
    hint.textContent = HELP_DATA[id].summary;
    label.appendChild(hint);
  });
}

function openHelp(id){
  const d = HELP_DATA[id];
  if(!d) return;
  $('helpContent').innerHTML = `
    <div class="help-kicker">입력항목 도움말</div>
    <h2 id="helpTitle" class="help-title">${d.title}</h2>
    <div class="help-grid">
      <div class="help-box"><strong>무엇을 입력하나요?</strong><p>${d.summary}</p></div>
      <div class="help-box"><strong>왜 필요한가요?</strong><p>${d.why}</p></div>
      <div class="help-box"><strong>어디서 확인하나요?</strong><ul class="help-list">${d.where.map(x=>`<li>${x}</li>`).join('')}</ul></div>
      <div class="help-box"><strong>입력 예시</strong><p>${d.example}</p></div>
      <div class="help-box"><strong>관련 기준</strong><p>${d.basis}</p></div>
      <div class="help-box"><strong>계산에 미치는 영향</strong><p><span class="help-impact">${d.impact}</span></p></div>
    </div>`;
  $('helpModal').classList.add('open');
  $('helpModal').setAttribute('aria-hidden','false');
}

function openGlossary(){
  $('helpContent').innerHTML = `
    <div class="help-kicker">지침 기반 용어사전</div>
    <h2 id="helpTitle" class="help-title">용어사전</h2>
    <div class="glossary-grid">${GLOSSARY.map(([k,v])=>`<div class="term"><b>${k}</b><span>${v}</span></div>`).join('')}</div>`;
  $('helpModal').classList.add('open');
  $('helpModal').setAttribute('aria-hidden','false');
}

function closeHelp(){
  $('helpModal').classList.remove('open');
  $('helpModal').setAttribute('aria-hidden','true');
}

function setBeginnerMode(){
  document.body.classList.toggle('expert-mode', !$('beginnerMode').checked);
}

function rangeWarnings(){
  const checks = [
    ['length', numberValue('length') > 10000, '터널연장이 10km를 초과합니다. 입력 단위(m)를 확인하세요.'],
    ['aadt', numberValue('aadt') > 200000, 'AADT가 200,000대/일을 초과합니다. 튜브당 교통량인지 확인하세요.'],
    ['heavyRate', numberValue('heavyRate') > 100, '혼입률은 일반적으로 100%를 초과할 수 없습니다.'],
    ['height', numberValue('height') > 15, '터널높이가 15m를 초과합니다. 입력값을 확인하세요.'],
    ['approachGrade', numberValue('approachGrade') > 12, '진입부 경사도가 매우 큽니다. % 단위를 확인하세요.']
  ];
  document.querySelectorAll('.range-warn').forEach(e=>e.remove());
  document.querySelectorAll('.field.warn').forEach(e=>e.classList.remove('warn'));
  checks.forEach(([id, warn, msg])=>{
    const input=$(id); if(!input) return;
    const field=input.closest('.field');
    if(warn){
      field.classList.add('warn');
      const s=document.createElement('span'); s.className='range-warn'; s.textContent='⚠ '+msg; field.appendChild(s);
    }
  });
}

installHelpButtons();
$('beginnerMode').addEventListener('change', setBeginnerMode);
$('glossaryBtn').addEventListener('click', openGlossary);
document.querySelectorAll('[data-close-help]').forEach(el => el.addEventListener('click', closeHelp));
document.addEventListener('keydown', e => { if(e.key === 'Escape') closeHelp(); });
document.querySelectorAll('input,select').forEach(el => el.addEventListener('change', rangeWarnings));
document.querySelectorAll('input').forEach(el => el.addEventListener('input', rangeWarnings));
setBeginnerMode();
rangeWarnings();


restoreState();

// V1.0 RC2: 계산기 / 평가기준 / 등급별 방재시설 탭 전환
function installTabs(){
  const buttons = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      buttons.forEach(b => b.classList.toggle('active', b === btn));
      panels.forEach(p => p.classList.toggle('active', p.id === `tab-${target}`));
      window.scrollTo({top: document.querySelector('.tabbar').offsetTop - 12, behavior:'smooth'});
    });
  });
}
installTabs();


// Facility criteria tabs
document.querySelectorAll('.facility-tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.facilityTab;
    document.querySelectorAll('.facility-tab-btn').forEach(b => b.classList.toggle('active', b === btn));
    document.querySelectorAll('.facility-tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `facility-${target}`);
    });
  });
});
