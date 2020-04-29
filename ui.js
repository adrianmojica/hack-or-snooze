$(async function() {
  // cache some selectors we'll be using quite a bit
  const $allStoriesList = $("#all-articles-list");
  const $submitForm = $("#submit-form");
  const $filteredArticles = $("#filtered-articles");
  const $favoriteArticles =$('#favorited-articles');
  const $loginForm = $("#login-form");
  const $createAccountForm = $("#create-account-form");
  const $ownStories = $("#my-articles");
  const $navLogin = $("#nav-login");
  const $navLogOut = $("#nav-logout");
  const $mainNavLinks = $('.main-nav-links');
  const $navWelcome = $('#nav-welcome');
  const $navSubmit = $('#nav-submit');
  const $navFavorites = $('#nav-favorites');
  const $navUserProfile = $('#nav-user-profile');
  const $articlesContainer = $('.articles-container');
  const $navMyStories = $('#nav-my-stories');
  const $userProfile = $('#user-profile');
  const $userProfileName = $('#profile-name');
  const $userProfileUserName = $('#profile-username');
  const $userProfileDate = $('#profile-account-date');

  // global storyList variable
  let storyList = null;

  // global currentUser variable
  let currentUser = null;

  await checkIfLoggedIn();

  /**
   * Event listener for logging in.
   *  If successfully we will setup the user instance
   */

  $loginForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page-refresh on submit

    // grab the username and password
    const username = $("#login-username").val();
    const password = $("#login-password").val();

    // call the login static method to build a user instance
    const userInstance = await User.login(username, password);
    // set the global user to the user instance
    currentUser = userInstance;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Event listener for signing up.
   *  If successfully we will setup a new user instance
   */

  $createAccountForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page refresh

    // grab the required fields
    let name = $("#create-account-name").val();
    let username = $("#create-account-username").val();
    let password = $("#create-account-password").val();

    // call the create method, which calls the API and then builds a new user instance
    const newUser = await User.create(username, password, name);
    currentUser = newUser;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  $submitForm.on("submit",async function(evt){
    evt.preventDefault();
    $author = $('#author').val();
    $title = $('#title').val();
    $url = $('#url').val();
    const username = currentUser.userName;
    let context = "main";
    
    
    const storyObject = await storyList.addStory(currentUser, {
      author: $author,
      title: $title,
      url: $url,
      username
    });

    console.log(storyObject);

    createNewsItem(storyObject,$allStoriesList,context);

  });

  /**
   * Log Out Functionality
   */

  $navLogOut.on("click", function() {
    // empty out local storage
    localStorage.clear();
    // refresh the page, clearing memory
    location.reload();
  });

  /**
   * Event Handler for Clicking Login
   */

  $navLogin.on("click", function() {
    // Show the Login and Create Account Forms
    $loginForm.slideToggle();
    $createAccountForm.slideToggle();
    $allStoriesList.toggle();

  });


  /**
   * Event Handler for Submit Stories Button
   */
  $navSubmit.on('click', function(){
    hideElements();
    $allStoriesList.show();
    $submitForm.slideDown("slow");
  });

  /**
   * Event Handler for favorites button
   */
  $navFavorites.on('click', function(){
    hideElements();
    generateFaves();
    $favoriteArticles.show();
    
  });


  /**
   * Event Handler for user tag on nav navUserProfile
   */

   $navUserProfile.on('click',function(evt){
    evt.preventDefault();
    hideElements();
    $userProfile.show();
   });


  /**
   * Event Handlrer for my stories on nav
   */
  $navMyStories.on('click',function(){
    hideElements();
    $filteredArticles.show();
    let FilteredStories = [];
    let context = "myStories";
    FilteredStories = storyList.stories.filter(function(el){
      return el.username === currentUser.username;
    });
    for (const story of FilteredStories) {
      createNewsItem(story,$filteredArticles,context)
    }

  });

  /**
   * event listener for the favorite stars
   * 
   */
  $allStoriesList.on('click','.star',async function(evt){
    if (currentUser) {
      console.log('favorite here',evt.target.closest("li"));
      const $target = $(evt.target);
      const $parentLi = $(evt.target).closest("li");
      const storyId = $parentLi.attr("id");
      console.log($parentLi,storyId);

      if ($target.hasClass("fas")) {
        await currentUser.deleteFav(storyId);
        $target.closest("i").toggleClass("fas far");
      } else {
        await currentUser.addFav(storyId);
        $target.closest("i").toggleClass("fas far");
      }
    }
  });



  /**
   * event listener for the delete stories
   * 
   */
  $filteredArticles.on('click','.trash-can',async function(evt){
    console.log('delete here',evt.target.closest("li"));
    const $parentLi = $(evt.target).closest("li");
    const storyId = $parentLi.attr("id");
    //send the user and the id to the class
    await storyList.deleteStory(currentUser, storyId);
    await generateStories();
    hideElements();
    $allStoriesList.show();


  })


  /**
   * Event handler for Navigation to Homepage
   */

  $("body").on("click", "#nav-all", async function() {
    hideElements();
    await generateStories();
    $allStoriesList.show();
  });

  /**
   * On page load, checks local storage to see if the user is already logged in.
   * Renders page information accordingly.
   */

  async function checkIfLoggedIn() {
    // let's see if we're logged in
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    // if there is a token in localStorage, call User.getLoggedInUser
    //  to get an instance of User with the right details
    //  this is designed to run once, on page load
    currentUser = await User.getLoggedInUser(token, username);
    await generateStories();

    if (currentUser) {
      showNavForLoggedInUser();
    }
  }


  function createNewsItem(newStory,container,context){
    let hostname = getHostName(newStory.url);
    if (context === "myStories") {
      $item = `
      <li id="${newStory.storyId}" class="id-${newStory.storyId}">    
      <span class="trash-can">
          <i class="fas fa-trash-alt"></i>
      </span>
      <span class="star">
        <i class="far fa-star"></i>
      </span>
      <a class="article-link" href='${newStory.url}' target="a_blank">
        <strong>${newStory.title}</strong>
        </a>
      <small class="article-author">${newStory.author}</small>
      <small class="article-hostname ${hostname}">${hostname}</small>
      <small class="article-username">posted by ${newStory.username}</small>
    </li>`;
    } else {
    $item = `
      <li id="${newStory.storyId} class="id-${newStory.storyId}">    
      <span class="star">
        <i class="far fa-star"></i>
      </span>
      <a class="article-link" href='${newStory.url}' target="a_blank">
        <strong>${newStory.title}</strong>
        </a>
      <small class="article-author">${newStory.author}</small>
      <small class="article-hostname ${hostname}">${hostname}</small>
      <small class="article-username">posted by ${newStory.username}</small>
    </li>`;
  }
  
  container.prepend($item);

  }



  /**
   * A rendering function to run to reset the forms and hide the login info
   */

  function loginAndSubmitForm() {
    // hide the forms for logging in and signing up
    $loginForm.hide();
    $createAccountForm.hide();

    // reset those forms
    $loginForm.trigger("reset");
    $createAccountForm.trigger("reset");

    // show the stories
    $allStoriesList.show();

    // update the navigation bar
    showNavForLoggedInUser();
  }

  /**
   * A rendering function to call the StoryList.getStories static method,
   *  which will generate a storyListInstance. Then render it.
   */

  async function generateStories() {
    // get an instance of StoryList
    const storyListInstance = await StoryList.getStories();
    // update our global variable
    storyList = storyListInstance;
    // empty out that part of the page
    $allStoriesList.empty();

    // loop through all of our stories and generate HTML for them
    for (let story of storyList.stories) {
      const result = generateStoryHTML(story);
      $allStoriesList.append(result);
    }
  }

  function generateFaves() {
    $favoriteArticles.empty();
    // if the user has no favorites
    if (currentUser.favorites.length === 0) {
      $favoriteArticles.append("<h5>No favorites added!</h5>");
    } else {
      // for all of the user's favorites
      for (let story of currentUser.favorites) {
        // render each story in the list
        createNewsItem(story,$favoriteArticles,"favorites");
      }
    }
  }

  /**
   * A function to render HTML for an individual Story instance
   */

  function generateStoryHTML(story) {
    let hostName = getHostName(story.url);

    // render story markup
    const storyMarkup = $(`
      <li id="${story.storyId}">
        <span class="star">
          <i class="far fa-star"></i>
        </span>
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);

    return storyMarkup;
  }

  /* hide all elements in elementsArr */

  function hideElements() {
    const elementsArr = [
      $submitForm,
      $favoriteArticles,
      $userProfile,
      $allStoriesList,
      $filteredArticles,
      $ownStories,
      $loginForm,
      $createAccountForm
    ];
    elementsArr.forEach($elem => $elem.hide());
  }

  function showNavForLoggedInUser() {
    $navLogin.hide();
    $navLogOut.show();

    //show nav links and move logout to right part of screen 
    $mainNavLinks.show();
    $navWelcome.show();
    // add username to a tag
  
    $navUserProfile.html(currentUser.username);
    
    //add user info for profile info
    $userProfileName.html("Name: "+currentUser.name);
    $userProfileUserName.html("Username: "+currentUser.username);
    $userProfileDate.html("Account Created: "+currentUser.createdAt);
    
  }

  /* simple function to pull the hostname from a URL */

  function getHostName(url) {
    let hostName;
    if (url.indexOf("://") > -1) {
      hostName = url.split("/")[2];
    } else {
      hostName = url.split("/")[0];
    }
    if (hostName.slice(0, 4) === "www.") {
      hostName = hostName.slice(4);
    }
    return hostName;
  }

  /* sync current user information to localStorage */

  function syncCurrentUserToLocalStorage() {
    if (currentUser) {
      localStorage.setItem("token", currentUser.loginToken);
      localStorage.setItem("username", currentUser.username);
    }
  }
});
