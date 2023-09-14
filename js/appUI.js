let contentScrollPosition = 0;
Init_UI();

function Init_UI() {
  renderBookmarks();
  $('#createBookmark').on("click", async function () {
    saveContentScrollPosition();
    renderCreateBookmarkForm();
  });
  $('#abort').on("click", async function () {
    renderBookmarks();
  });
  $('#aboutCmd').on("click", function () {
    renderAbout();
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
async function renderBookmarks() {
  showWaitingGif();
  $("#actionTitle").text("Liste des favoris");
  $("#createBookmark").show();
  $("#abort").hide();
  let bookmark = await Bookmarks_API.Get();
  eraseContent();
  if (bookmark !== null) {
    bookmark.forEach(bookmark => {
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
    renderError("Favoris introuvable!");
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
            <h4>Effacer le favoris suivant?</h4>
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
      if (result)
        renderBookmarks();
      else
        renderError("Une erreur est survenue!");
    });
    $('#cancel').on("click", function () {
      renderBookmarks();
    });
  } else {
    renderError("Favoris introuvable!");
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
      renderBookmarks();
    else
      renderError("Une erreur est survenue!");
  });
  $('#cancel').on("click", function () {
    renderBookmarks();
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