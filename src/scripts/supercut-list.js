let listContainer = document.getElementById('supercut-list');

document.addEventListener('DOMContentLoaded', (event) => {
  let previousSupercuts = Object.keys(localStorage).map((k) =>
    JSON.parse(localStorage[k]),
  );
  console.log(previousSupercuts);
  previousSupercuts.forEach((el) => {
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
