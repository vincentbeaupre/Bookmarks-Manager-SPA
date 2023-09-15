let contentScrollPosition = 0;
let selectedCategory = null;

Init_UI();

async function Init_UI() {

  renderBookmarks(selectedCategory);

  $('#createBookmark').on("click", async function () {
    saveContentScrollPosition();
    renderCreateBookmarkForm();
  });
  $('#abort').on("click", async function () {
    renderBookmarks(selectedCategory);
  });
}

function renderAbout() {
  saveContentScrollPosition();
  eraseContent();
  $("#createBookmark").hide();
  $("#abort").show();
  $("#actionTitle").text("À propos...");
  $("#content").append(
    $(`
            <div class="aboutContainer">
                <h2>Gestionnaire de favoris</h2>
                <hr>
                <p>
                    Petite application de gestion de favoris à titre de démonstration
                    d'interface utilisateur monopage réactive.
                </p>
                <p>
                    Auteur: Vincent Beaupré
                </p>
                <p>
                    Collège Lionel-Groulx, automne 2023
                </p>
            </div>
        `))
}

async function renderBookmarks(category = null) {
  showWaitingGif();
  $("#actionTitle").text("Liste des favoris");
  $("#createBookmark").show();
  $("#abort").hide();
  let bookmarks = await Bookmarks_API.Get();
  eraseContent();
  if (bookmarks !== null) {
    if (category) {
      bookmarks = bookmarks.filter(bookmark => bookmark.Category === category);
    }
    bookmarks.forEach(bookmark => {
      $("#content").append(renderBookmark(bookmark));
    });
    restoreContentScrollPosition();
    // Attached click events on command icons
    $(".editCmd").on("click", function () {
      saveContentScrollPosition();
      renderEditBookmarkForm(parseInt($(this).attr("editBookmarkId")));
    });
    $(".deleteCmd").on("click", function () {
      saveContentScrollPosition();
      renderDeleteBookmarkForm(parseInt($(this).attr("deleteBookmarkId")));
    });
  } else {
    renderError("Service introuvable");
  }

  updateDropdown();
}

async function updateDropdown() {
  let bookmarks = await Bookmarks_API.Get();
  populateDropdown(bookmarks);
}

function populateDropdown(bookmarks) {

  const categoriesSet = new Set(bookmarks.map(b => b.Category));
  const $dropdownMenu = $(".dropdown-menu");

  $dropdownMenu.empty();

  const $allItem = $('<div>', { class: 'dropdown-item d-flex align-items-center' });
  const $checkmarkAll = $('<i>', { class: 'fa fa-check' })
    .css('opacity', '0')
    .css('color', 'rgb(0, 87, 204)')
    .css('margin-right', '5px');
  $allItem.append($checkmarkAll).append('Toutes les catégories');
  $allItem.on('click', (e) => {
    e.stopPropagation();

    $('.dropdown-item .fa-check').css('opacity', '0');
    $checkmarkAll.css('opacity', '1');
    selectedCategory = null;
    renderBookmarks();
  });

  if (selectedCategory === null) {
    $checkmarkAll.css('opacity', '1');
  }

  $dropdownMenu.append($allItem);

  const $divider = $('<div>', { class: 'dropdown-divider' });
  $dropdownMenu.append($divider);

  categoriesSet.forEach(category => {
    const $item = $('<div>', { class: 'dropdown-item d-flex align-items-center' });
    const $checkmark = $('<i>', { class: 'fa fa-check' })
      .css('opacity', category === selectedCategory ? '1' : '0')
      .css('color', 'rgb(0, 87, 204)')
      .css('margin-right', '5px');
    $item.append($checkmark).append(category);

    $item.on('click', (e) => {
      e.stopPropagation();

      $('.dropdown-item .fa-check').css('opacity', '0');
      $checkmark.css('opacity', '1');
      selectedCategory = category;
      renderBookmarks(category);
    });

    $dropdownMenu.append($item);
  });

  const $aboutDivider = $('<div>', { class: 'dropdown-divider' });
  $dropdownMenu.append($aboutDivider);

  const $aboutItem = $('<div>', { class: 'dropdown-item' });
  const $icon = $('<i>', { class: 'menuIcon fa fa-info-circle mx-2' });
  const $aboutText = $('<span>', { text: 'À propos...' });

  $aboutItem.append($icon).append($aboutText);
  $aboutItem.on('click', renderAbout);
  $dropdownMenu.append($aboutItem);
}

function showWaitingGif() {
  $("#content").empty();
  $("#content").append($("<div class='waitingGifcontainer'><img class='waitingGif' src='Loading_icon.gif' /></div>'"));
}
function eraseContent() {
  $("#content").empty();
}
function saveContentScrollPosition() {
  contentScrollPosition = $("#content")[0].scrollTop;
}
function restoreContentScrollPosition() {
  $("#content")[0].scrollTop = contentScrollPosition;
}
function renderError(message) {
  eraseContent();
  $("#content").append(
    $(`
            <div class="errorContainer">
                ${message}
            </div>
        `)
  );
}
function renderCreateBookmarkForm() {
  renderBookmarkForm();
}
async function renderEditBookmarkForm(id) {
  showWaitingGif();
  let bookmark = await Bookmarks_API.Get(id);
  if (bookmark !== null)
    renderBookmarkForm(bookmark);
  else
    renderError("Favori introuvable!");
}
async function renderDeleteBookmarkForm(id) {
  showWaitingGif();
  $("#createBookmark").hide();
  $("#abort").show();
  $("#actionTitle").text("Retrait");
  let bookmark = await Bookmarks_API.Get(id);
  eraseContent();
  if (bookmark !== null) {
    $("#content").append(`
        <div class="bookmarkdeleteForm">
            <h4>Effacer le favori suivant?</h4>
            <br>
            <div class="bookmarkRow" bookmark_id=${bookmark.Id}">
                <div class="bookmarkContainer">
                <div class="bookmarkLayout">
                <div class="iconContainer">
                  <span class="regular-favicon" style="background-image: url('http://www.google.com/s2/favicons?sz=64&domain=${bookmark.URL}')"></span>
                </div>
                <div class="bookmarkInfo">
                  <span class="bookmarkTitle">${bookmark.Title}</span>
                  <span class="bookmarkCategory">${bookmark.Category}</span>
                </div>
              </div>
                </div>  
            </div>   
            <br>
            <input type="button" value="Effacer" id="deleteBookmark" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </div>    
        `);
        $('#deleteBookmark').on("click", async function () {
          showWaitingGif();
          let result = await Bookmarks_API.Delete(bookmark.Id);
          if (result) {
              let remainingBookmarksInCategory = await Bookmarks_API.Get();
              if (selectedCategory) {
                  remainingBookmarksInCategory = remainingBookmarksInCategory.filter(b => b.Category === selectedCategory);
              }
  
              // If no bookmarks left in the selected category, display all bookmarks.
              if (!remainingBookmarksInCategory.length) {
                  selectedCategory = null; 
              }
  
              renderBookmarks(selectedCategory);
          } else {
              renderError("Une erreur est survenue!");
          }
      });
    $('#cancel').on("click", function () {
      renderBookmarks(selectedCategory);
    });
  } else {
    renderError("Favori introuvable!");
  }
}
function newBookmark() {
  bookmark = {};
  bookmark.Id = 0;
  bookmark.Title = "";
  bookmark.URL = "";
  bookmark.Category = "";
  return bookmark;
}
function renderBookmarkForm(bookmark = null) {
  $("#createBookmark").hide();
  $("#abort").show();
  eraseContent();
  let create = bookmark == null;
  if (create) bookmark = newBookmark();
  $("#actionTitle").text(create ? "Création" : "Modification");
  const icon = create ? '<i class="fa-regular fa-bookmark fa-2x big-favicon"></i>' : `<div class="big-favicon" style="background-image: url('http://www.google.com/s2/favicons?sz=64&domain=${bookmark.URL}'); margin-bottom: 20px"></div>`;

  $("#content").append(`

  <form class="form" id="bookmarkForm">
  <div>
    ${icon}
  </div>
  <input type="hidden" name="Id" value="${bookmark.Id}" />
  <label for="Title" class="form-label">Titre </label>
  <input class="form-control Alpha" name="Title" id="Title" placeholder="Titre" required RequireMessage="Veuillez entrer un titre" InvalidMessage="Le titre comporte un caractère illégal" value="${bookmark.Title}" />
  <label for="URL" class="form-label">URL </label>
  <input class="form-control URL" name="URL" id="URL" placeholder="URL" required RequireMessage="Veuillez entrer un URL" InvalidMessage="Veuillez entrer un URL valide" value="${bookmark.URL}" />
  <label for="Category" class="form-label">Catégorie </label>
  <input class="form-control Category" name="Category" id="Category" placeholder="Catégorie" required RequireMessage="Veuillez entrer une catégorie" InvalidMessage="Veuillez entrer une catégorie valide" value="${bookmark.Category}" />
  <hr>
  <input type="submit" value="Enregistrer" id="saveBookmark" class="btn btn-primary">
  <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
</form>
    `);

  initFormValidation();
  $('#bookmarkForm').on("submit", async function (event) {
    event.preventDefault();
    let bookmark = getFormData($("#bookmarkForm"));
    bookmark.Id = parseInt(bookmark.Id);
    showWaitingGif();
    let result = await Bookmarks_API.Save(bookmark, create);
    if (result)
      renderBookmarks(selectedCategory);
    else
      renderError("Une erreur est survenue!");
  });
  $('#cancel').on("click", function () {
    renderBookmarks(selectedCategory);
  });
}

function getFormData($form) {
  const removeTag = new RegExp("(<[a-zA-Z0-9]+>)|(</[a-zA-Z0-9]+>)", "g");
  var jsonObject = {};
  $.each($form.serializeArray(), (index, control) => {
    jsonObject[control.name] = control.value.replace(removeTag, "");
  });
  return jsonObject;
}

function renderBookmark(bookmark) {
  return $(`
  <div class="bookmarkRow" bookmark_id="${bookmark.Id}">
  <div class="bookmarkContainer noselect">
    <div class="bookmarkLayout">
      <a href=${bookmark.URL} class="iconContainer">
        <span class="regular-favicon" style="background-image: url('http://www.google.com/s2/favicons?sz=64&domain=${bookmark.URL}')"></span>
      </a>
      <div class="bookmarkInfo">
        <span class="bookmarkTitle">${bookmark.Title}</span>
        <span class="bookmarkCategory">${bookmark.Category}</span>
      </div>
    </div>
    <div class="bookmarkCommandPanel">
      <span class="editCmd cmdIcon fa fa-pencil" editBookmarkId="${bookmark.Id}" title="Modifier ${bookmark.Title}"></span>
      <span class="deleteCmd cmdIcon fa fa-trash" deleteBookmarkId="${bookmark.Id}" title="Effacer ${bookmark.Title}"></span>
    </div>
  </div>
</div>
       
    `);
}