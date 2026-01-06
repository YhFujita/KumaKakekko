// 障害物のCSVデータ (id, type, color, width, height, y_offset)
// type: 0=矩形, 1=その他(将来用)
const obstacleCsvData = `
1,0,red,40,40,0
2,0,blue,40,40,0
3,0,green,50,50,0
4,0,purple,30,60,0
5,0,orange,60,30,0
`;

// CSVをパースしてオブジェクトの配列にする関数
function parseObstacleData(csv) {
  const lines = csv.trim().split('\n');
  const data = [];
  
  for (let line of lines) {
    const parts = line.split(',');
    if (parts.length >= 6) {
      data.push({
        id: parseInt(parts[0]),
        type: parseInt(parts[1]),
        color: parts[2].trim(),
        width: parseInt(parts[3]),
        height: parseInt(parts[4]),
        yOffset: parseInt(parts[5])
      });
    }
  }
  return data;
}

const obstacleTypes = parseObstacleData(obstacleCsvData);
