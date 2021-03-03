let listContainer = document.getElementById('supercut-list');

document.addEventListener('DOMContentLoaded', (event) => {
  let cookies = Object.keys(localStorage).map((k) => {
    return JSON.parse(localStorage[k]);
  });

  let supercuts = cookies.filter((item) => item['cookieType'] === 'supercut');

  supercuts.forEach((el) => {
    let newListItem = document.createElement('li');
    newListItem.classList.add('center-row');
    let title = document.createElement('p');
    title.textContent = el['title'];
    newListItem.appendChild(title);

    let filterWord = document.createElement('p');
    filterWord.textContent = "'" + el['filter'] + "'";
    newListItem.appendChild(filterWord);
    let link = document.createElement('a');
    link.textContent = 'Link';
    link.href = el['videoURL'];

    newListItem.appendChild(link);
    listContainer.appendChild(newListItem);
  });
});
