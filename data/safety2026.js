window.SAFETY_2026 = {
  meta: { title: '도로터널 방재·환기시설 설치 및 관리지침', order: '국토교통부예규 제461호', effective: '2026-04-30' },
  lengthGrade: {
    normal: [{g:1,min:3000},{g:2,min:1000,max:3000},{g:3,min:500,max:1000},{g:4,max:500}],
    sound:  [{g:1,min:3000},{g:2,min:1000,max:3000},{g:3,min:250,max:1000},{g:4,max:250}]
  },
  riskGrade: [{g:1,min:29,op:'gt'},{g:2,min:19,max:29},{g:3,min:14,max:19},{g:4,max:14}],
  los: {'A-C':1,'D':2,'E-F':3},
  direction: {oneWithShoulder:1,oneNoShoulder:2,twoWithShoulder:5,twoNoShoulder:6}
};
