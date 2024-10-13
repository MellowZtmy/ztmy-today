// JSONデータを取得する関数
function getJsonData(jsonUrl) {
  return new Promise((resolve, reject) => {
    $.getJSON(jsonUrl, function (data) {
      resolve(data);
    }).fail(function () {
      reject('Failed to load JSON file');
    });
  });
}

// CSVデータを取得する関数
async function fetchCsvData(fileName, skipRowCount = 0) {
  try {
    const response = await fetch(fileName);
    const text = await response.text();
    return parseCsv(text, skipRowCount);
  } catch (error) {
    throw new Error('Failed to load CSV file:' + fileName);
  }
}

// CSVデータをパースする関数（csvデータ内の「,」は「，」にしているため「,」に変換して返却）
function parseCsv(csvText, skipRowCount) {
  var regx = new RegExp(appsettings.commaInString, 'g');
  return csvText
    .trim()
    .split(/\r?\n|\r/)
    .slice(skipRowCount)
    .map((line) => line.split(',').map((value) => value.replace(regx, ',')));
}

// 配列をシャッフルして返す
function shuffle(array) {
  var result = [];
  for (i = array.length; i > 0; i--) {
    var index = Math.floor(Math.random() * i);
    var val = array.splice(index, 1)[0];
    result.push(val);
  }
  return result;
}

// 乱数生成
function getRamdomNumber(num) {
  return Math.floor(Math.random() * num);
}

// データをローカルストレージにセットする関数
function setLocal(key, value) {
  localStorage.setItem(key, value);
}

// ローカルストレージからデータをゲットする関数
function getLocal(key) {
  return localStorage.getItem(key);
}

// ローカルストレージから配列を取得(nullは空に)
function getLocalArray(name) {
  return JSON.parse(localStorage.getItem(name)) ?? [];
}

// ローカルストレージに配列設定(nullは空に)
function setLocalArray(name, array) {
  localStorage.setItem(name, JSON.stringify(array ?? []));
}

// エラー時処理
function showError(errorMsg1, errorMsg2) {
  // コンソールに表示
  console.error(errorMsg1, errorMsg2);
  // 画面に表示
  alert(errorMsg2);
}

// アルバムタップ時
function clickAlbum(image) {
  // 暗め表示の切り替え
  image.classList.toggle('darkened');
  // 選択中リストの編集
  if (image.name === 'album') {
    selectedAlbums = image.classList.contains('darkened')
      ? selectedAlbums.filter((item) => item !== image.id)
      : selectedAlbums.concat(image.id);
  }
  if (image.name === 'minialbum') {
    selectedMinialbums = image.classList.contains('darkened')
      ? selectedMinialbums.filter((item) => item !== image.id)
      : selectedMinialbums.concat(image.id);
  }

  // ローカルストレージに保存
  setLocalArray('selectedAlbums', selectedAlbums);
  setLocalArray('selectedMinialbums', selectedMinialbums);

  // アルバム、ミニアルバムリストより出題する曲リスト取得
  selectedSongIndex = getSelectedSongIndex();
  $('#songCount').text(selectedSongIndex.length + ' Songs');
}

// 配列同士で一致するもののインデックスを返す
function getMatchingIndices(arr1, arr2) {
  return arr1
    .map((item, index) => (arr2.includes(item) ? index : -1))
    .filter((index) => index !== -1);
}

// 出題する曲リスト
function getSelectedSongIndex() {
  return Array.from(
    new Set([
      ...getMatchingIndices(songAlbums, selectedAlbums),
      ...getMatchingIndices(songMinialbums, selectedMinialbums),
    ])
  );
}

// カラーチェンジ
function changeColor(plusCount) {
  // 今のカラーインデックスを取得し、次のインデックス設定
  var colorIndex = Number(getLocal('colorIndex') ?? 2) + plusCount;
  // 設定するカラーを設定（ない場合最初に戻る）
  var colorSet = colorSets[colorIndex] ?? colorSets[0];
  $('body').css({
    background: colorSet[1],
    color: colorSet[2],
  });
  $('.btn--main').css({
    'background-color': colorSet[3],
    color: colorSet[4],
  });
  // 今のカラー設定をローカルストレージに保存
  var colorIndexNow = colorSets[colorIndex] ? colorIndex : 0;
  setLocal('colorIndex', colorIndexNow);
  // 今のカラー表示
  $('#changeColor').html(
    'Color ↺ <br>(' + (colorIndexNow + 1) + '/' + colorSets.length + ')'
  );
}

// 未来日までの日数取得
function getDaysToNextMonthDay(pastDateString) {
  const today = new Date(globalToday.setHours(0, 0, 0, 0));
  const [, month, day] = pastDateString.split('/').map(Number);

  let nextDate = new Date(today.getFullYear(), month - 1, day);
  if (nextDate < today) nextDate.setFullYear(today.getFullYear() + 1);

  return Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
}

// 未来日までの年数取得
function getYearsToNextMonthDay(pastDateString) {
  const today = globalToday;
  const [year, month, day] = pastDateString.split('/').map(Number);

  return (
    today.getFullYear() -
    year +
    (new Date(today.getFullYear(), month - 1, day) < today ? 1 : 0)
  );
}

// 二次元配列を月日でソート
function sortByMonthDay(arr, sortColIndex) {
  const today = new Date(globalToday.setHours(0, 0, 0, 0));

  function daysToToday(dateString) {
    const [, month, day] = dateString.split('/').map(Number);
    const date = new Date(today.getFullYear(), month - 1, day);
    if (date < today) date.setFullYear(today.getFullYear() + 1);
    return (date - today) / (1000 * 60 * 60 * 24);
  }

  // 配列のコピーを作成
  const arrCopy = [...arr];

  // コピーをソート
  return arrCopy.sort(
    (a, b) => daysToToday(a[sortColIndex]) - daysToToday(b[sortColIndex])
  );
}

// ページングタグ作成
function createPagingTag(currentMode, currentPage, listLength, cardPerPage) {
  // 変数初期化
  var tag = '';
  var pageIndex = 0;

  // タグ生成
  tag += '<div class="pagination">';

  // 設定ファイルの「1ページ当たり表示数」分行ループ
  for (let i = 0; i < listLength; i += cardPerPage) {
    pageIndex++;
    tag +=
      ' <a class="' +
      (currentPage === pageIndex ? 'disabled' : 'active') +
      '" onclick="createDisplay(' +
      currentMode +
      ',' +
      pageIndex +
      ')">' +
      pageIndex +
      '</a>';
  }

  tag += '</div>';

  return tag;
}

// 画像クリックイベント追加
function addEnlargeImageEvent() {
  // 拡大表示用の要素を取得
  const overlay = document.getElementById('overlay');
  const overlayImage = overlay.querySelector('img');

  // すべてのimgタグにクリックイベントを追加
  document.querySelectorAll('img').forEach((image) => {
    image.addEventListener('click', () => {
      overlay.style.display = 'flex';
      overlayImage.src = image.src;
    });
  });

  // オーバーレイをクリックすると閉じる
  overlay.addEventListener('click', () => {
    overlay.style.display = 'none';
    overlayImage.src = ''; // 拡大表示終了時に画像をクリア
  });
}
