let themeArray = null;
let skinArray = null;

// setup
document.addEventListener("DOMContentLoaded", async function () {
    await startPage()
});

async function startPage(){
    let jsonString_viewMode = localStorage.getItem('valodex_viewMode');
    if(jsonString_viewMode == null) localStorage.setItem('valodex_viewMode', '{"mode": "list"}')
    if(jsonString_viewMode == '{"mode": "grid"}'){
        let image_viewMode = document.getElementById("viewmode_icon");
        changeViewMode(image_viewMode);
    }


    let jsonString = localStorage.getItem('valodex_collected');
    if(jsonString == null) localStorage.setItem('valodex_collected', '{"vdex_version": "1"}')

    try {
        await getApiThemes();
        try {
            await getApiSkins();
            setTimeout(function() {
                addThemesToWebsite();

                const counter = document.getElementById("counter");
                counter.textContent = updateCollectedCounter() + "/" + (skinArray.length - 2*18);
                imageZoom();
                sortThemes();
              }, 1000);                  //your internet might me to slow and this website isn't optimized lol
        } catch (error) {
            console.error('Error:', error);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}



// API calls
async function getApiSkins(){
    fetch('https://valorant-api.com/v1/weapons/skins')
    .then(response => response.json())
    .then(responseData => {
        const dataArray = responseData.data;
        const filteredData = dataArray.map(item => {
            // Filter out specific properties
            if(item.hasOwnProperty("chromas")){
                const jsonArraychromas = item.chromas;

                for (let image of jsonArraychromas) {
                    return {
                        uuid: item.uuid,
                        theme: item.themeUuid,
                        name: item.displayName,
                        image: image.fullRender
                    };
                }
            } else{
                return {
                    uuid: item.uuid,
                    theme: item.themeUuid,
                    name: item.displayName,
                    image: item.displayIcon
                };
            }
        });
        
        const jsonString = JSON.stringify(filteredData);

        skinArray = JSON.parse(jsonString);

        console.log("DEBUG: skinArray:", skinArray);
    })
    .catch(error => {
        console.log('Error:', error);
    });
}

async function getApiThemes(){
    fetch('https://valorant-api.com/v1/themes')
    .then(response => response.json())
    .then(responseData => {
        const dataArray = responseData.data;
        const filteredData = dataArray.map(item => {
            // Filter out specific subcategories or properties
            return {
                theme: item.uuid,
                name: item.displayName
            };
        });
    
        const jsonString = JSON.stringify(filteredData);
        //console.log(jsonString); // Display the JSON string in the console

        themeArray = JSON.parse(jsonString);
        console.log("DEBUG: themeArray:", themeArray);
    })
    .catch(error => {
        console.log('Error:', error);
    });
}



function addThemesToWebsite(){
    const container = document.getElementById("themes_container");

    let themeNames = new Array(); // testing: combining themes with the same name

    // Iterate over the JSON array
    for (let item of themeArray) {
        // Create a new div element
        // console.log(item.name)

        let div;
        let heading;

        if(themeNames.includes(item.name) && false){ // testing: combining themes with the same name
            div = document.getElementById(item.name)
            heading = div.querySelector('h3')
            heading = document.createElement("h3");
        } else {
            div = document.createElement("div");
            div.id = item.name
            div.classList.add("themes");
            heading = document.createElement("h3");
        }

        themeNames.push(item.name);

        const table = document.createElement("table");

        // for all skins with theme_uuid = uuid of current theme
        let currentUuidSkins = searchArrayByKey(skinArray, "theme", item.theme)


        for (let skin of currentUuidSkins){

            let content = addWeaponsToTheme(skin, heading, item, table);

            div.appendChild(content[0]);
            div.appendChild(content[1])
            if(currentUuidSkins.length > 0 && item.name != "Random" && item.name != "Standard") container.appendChild(div);
        }
            
    }

    // Function to lazy load images
    function lazyLoadImages(entries, observer) {
        entries.forEach(entry => {
            if (entry.isIntersecting || entry.intersectionRatio > 0) {
                const image = entry.target;
                image.src = image.dataset.src; // Load the image
                observer.unobserve(image); // Stop observing the image
            }
        });
    }
    const observerConfig = {
        rootMargin: '200px',
    };

    const observer = new IntersectionObserver(lazyLoadImages, observerConfig);
    const images = document.querySelectorAll('.image_skin');
    images.forEach(image => {
        observer.observe(image);
    });
}

function addWeaponsToTheme(skin, heading, item, table){
    //heading
    heading.textContent = item.name;
    if(!skin.name.includes(weaponNameFromString(skin.name))){
    } else if(!(skin.name).includes(item.name)) {
        var regex = new RegExp(weaponNameFromString(skin.name), "gi");
        heading.textContent = (skin.name).replace(regex, "") + " (" + item.name + ")";
    }

    const tr = document.createElement("tr");

    //name
    const td_name = document.createElement("td");
    td_name.classList.add("name_td");

    var weaponName = skin.name;
    if(weaponNameFromString(skin.name) != null){
        weaponName = weaponNameFromString(skin.name);
    }
    td_name.textContent = weaponName;


    // image
    const td_image = document.createElement("td");
    td_image.classList.add("image_td");
    const image = document.createElement("img");
    image.classList.add("image_skin");
    image.src = "images/icons/skins_noGun.png"; // Placeholder image, remove to show no image
    image.dataset.src = skin.image; // Store actual image URL in a data attribute

    // Set image height based on weaponName
    if (weaponName == "Phantom") {
        image.style.height = "38px";
    } else if (weaponName == "Ghost" || weaponName == "Guardian" || weaponName == "Marshal") {
        image.style.height = "36px";
    } else if (weaponName == "Shorty") {
        image.style.height = "32px";
    } else if (weaponName == "Bucky") {
        image.style.height = "28px";
    }

    image.onerror = function() {
        // If there's an error loading the image, display the default placeholder image
        image.src = "images/icons/skins_noGun.png";
        image.style.height = "38px";
    };

    // Append the image to the table cell
    td_image.appendChild(image);


    //button
    const td_button = document.createElement("td");
    td_button.classList.add("collect_button_td");
    const button = document.createElement("button");

    let jsonString = localStorage.getItem('valodex_collected');
    if(jsonString.includes(skin.uuid+'":true')){
        button.textContent = 'remove';
        button.classList.add("remove_collection_button");
    } else{
        button.textContent = 'add';
        button.classList.add("add_collection_button");
    }
    button.addEventListener('click', function() {
        triggerCollected(skin.uuid);
      });
    td_button.appendChild(button);

    tr.appendChild(td_name)
    tr.appendChild(td_image)
    tr.appendChild(td_button)
    table.appendChild(tr)

    return [heading, table];
}


function searchArrayByKey(jsonArray, key, value) {
    return jsonArray.filter(obj => obj[key] === value);
}

// function weaponNameFromString(string){
//     if (string.includes("Classic")) return "Classic"
//     else if (string.includes("Shorty")) return "Shorty"
//     else if (string.includes("Frenzy")) return "Frenzy"
//     else if (string.includes("Ghost")) return "Ghost"
//     else if (string.includes("Sheriff")) return "Sheriff"
//     else if (string.includes("Stinger")) return "Stinger"
//     else if (string.includes("Spectre")) return "Spectre"
//     else if (string.includes("Bucky")) return "Bucky"
//     else if (string.includes("Judge")) return "Judge"
//     else if (string.includes("Bulldog")) return "Bulldog"
//     else if (string.includes("Guardian")) return "Guardian"
//     else if (string.includes("Phantom")) return "Phantom"
//     else if (string.includes("Vandal")) return "Vandal"
//     else if (string.includes("Marshal")) return "Marshal"
//     else if (string.includes("Outlaw")) return "Outlaw"
//     else if (string.includes("Operator")) return "Operator"
//     else if (string.includes("Ares")) return "Ares"
//     else if (string.includes("Odin")) return "Odin"
//     else if (string.includes("Winterwunderland Candy Cane")) return "Winter-wunderland Candy Cane"
//     //else return string
// }

function weaponNameFromString(string) {
    const weapons = ["Classic", "Shorty", "Frenzy", "Ghost", "Sheriff", "Stinger", "Spectre", "Bucky", "Judge", "Bulldog", "Guardian", "Phantom", "Vandal", "Marshal", "Outlaw", "Operator", "Ares", "Odin"];

    for (const weapon of weapons) {
        if (string.includes(weapon)) {
            return weapon;
        } else if(string.includes("Winterwunderland Candy Cane")) return "Winter-wunderland Candy Cane"
    }
}

function triggerCollected(uuid){
    let jsonString = localStorage.getItem('valodex_collected');
    let jsonObject = JSON.parse(jsonString);
    const clickedButton = event.target;

    console.log(jsonString)
    console.log(jsonObject)

    if(jsonObject == null){
        jsonObject = {[uuid]:true};
        clickedButton.classList.remove("add_collection_button");
        clickedButton.classList.add("remove_collection_button");
    }
    else if(jsonObject[uuid] != true){
        jsonObject[uuid] = true;
        clickedButton.classList.remove("add_collection_button");
        clickedButton.classList.add("remove_collection_button");
        clickedButton.textContent = 'remove';
        }
    else{
        jsonObject[uuid] = false;
        clickedButton.classList.remove("remove_collection_button");
        clickedButton.classList.add("add_collection_button");
        clickedButton.textContent = 'add';
    }

    jsonString = JSON.stringify(jsonObject);
    localStorage.setItem('valodex_collected', jsonString);

    const counter = document.getElementById("counter");
    counter.textContent = updateCollectedCounter() + "/" + (skinArray.length - 2*18);
}

function updateCollectedCounter(){
    let jsonString = localStorage.getItem('valodex_collected');
    let jsonObject = JSON.parse(jsonString);
    let count = 0;

    for (const key in jsonObject) {
        if (jsonObject.hasOwnProperty(key) && jsonObject[key] === true) {
          count++;
        }
    }
    return count;
}


function changeViewMode(image){
    let container = document.getElementById("themes_container")

    if (image.src.endsWith('images/icons/menu_grid.png')){
        image.src = 'images/icons/menu_list.png';
        localStorage.setItem('valodex_viewMode', '{"mode": "list"}')

        container.classList.remove("themes_container_grid")
    } else{
        image.src = 'images/icons/menu_grid.png';
        localStorage.setItem('valodex_viewMode', '{"mode": "grid"}')

        container.classList.add("themes_container_grid")
    }
}

function copyBackUpKey() {
    // Create a temporary textarea element
    const textarea = document.createElement('textarea');
    textarea.value = localStorage.getItem('valodex_collected');
  
    // Append the textarea to the document body
    document.body.appendChild(textarea);
  
    // Select the text in the textarea
    textarea.select();
  
    // Copy the selected text to the clipboard
    document.execCommand('copy');
  
    // Remove the temporary textarea from the document
    document.body.removeChild(textarea);

    //Add info
    var td_element = document.getElementById("td_copyBackUpKey");
    var text = document.createElement('p')
    var textNode = document.createTextNode("copied!");
    text.appendChild(textNode);

    text.style.marginTop = "15px";
    text.style.marginBottom = "0";
    td_element.appendChild(text);
    setTimeout(function() {
        td_element.removeChild(text);
    }, 700);
}

function imageZoom(){
    const images = document.querySelectorAll('.image_skin');
    const overlay = document.getElementById('image_overlay');

    images.forEach((image) => {
        image.addEventListener('click', (event) => {
            const clickedImageSrc = event.target.getAttribute('src');
            const overlayImage = document.createElement('img');
            overlayImage.setAttribute('src', clickedImageSrc);
            // overlay.style.width = "auto";
            // overlayImage.height = "200px";
            if (overlay) {
                overlay.appendChild(overlayImage);
                overlay.style.display = 'flex';
            }
        });
    });

    if (overlay) {
        overlay.addEventListener('click', () => {
            overlay.innerHTML = '';
            overlay.style.display = 'none';
        });
    }
}

function openDiv() {
    const div = document.getElementById("backup_overlay");
    if(div.style.display == "block"){
        div.style.display = "none";
    } else{
        div.style.display = "block";
    }
}
  
function closeDiv() {
    const div = document.getElementById("backup_overlay");
    if (event.target != div) {
        return; // Do nothing when innerDiv is clicked
    }
    div.style.display = "none";
    var inputElement = document.getElementById("textInput");
    inputElement.placeholder = "BackUp-Key";
    inputElement.value = "";
}


function uploadBackUpKey() {
    var inputElement = document.getElementById("textInput");
    var inputValue = inputElement.value;
    
    if(inputValue.includes('{"vdex_version":')||inputValue.includes('{"1":"1",')){
        localStorage.setItem('valodex_collected', inputValue);
        location.reload();
    } else{
        console.error("BackUp-Key is invalid");
        inputElement.placeholder = "BackUp-Key is invalid";
        inputElement.value = "";
    }
}

//just testing here (dont know h´what exactly, combining backup key with new key?)
// function merge(jsonString1, jsonString2) {
//     // Parse the JSON strings into objects
//     var obj1 = JSON.parse(jsonString1);
//     var obj2 = JSON.parse(jsonString2);
  
//     // Combine the keys from both objects into a set
//     var keysSet = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
  
//     // Filter the keys based on true value
//     var filteredKeys = [...keysSet].filter(key => obj1[key] === true || obj2[key] === true);
  
//     // Create the merged object with unique true values
//     var mergedObj = {};
//     filteredKeys.forEach(key => {
//       mergedObj[key] = true;
//     });
  
//     // Add the "1":"1" key-value pair at the beginning
//     mergedObj = { "1": "1", ...mergedObj };
  
//     // Convert the merged object back to a JSON string
//     var outputJsonString = JSON.stringify(mergedObj);
  
//     return outputJsonString;
// }

let sortType = 0;

function sortThemes(){
    var image = document.getElementById("sort_icon");
    if(sortType == 0){
        sortDivsAlphabetically();
        image.src = "images/icons/menu_a_z.png";
        sortType = 1;
    } else{
        sortDivsReverseAlphabetically();
        image.src = "images/icons/menu_z_a.png";
        sortType = 0;
    }
}

function sortDivsAlphabetically() {
    // Step 1: Get the div elements
    var divs = Array.from(document.querySelectorAll('.themes'));
  
    // Step 2: Sort the array of div elements
    divs.sort(function (a, b) {
      var textA = a.querySelector('h3').textContent.toLowerCase();
      var textB = b.querySelector('h3').textContent.toLowerCase();
      if (textA < textB) {
        return -1;
      }
      if (textA > textB) {
        return 1;
      }
      return 0;
    });
  
    // Step 3: Append the sorted div elements back to the parent container
    var parentContainer = document.querySelector('#themes_container');
    divs.forEach(function (div) {
      parentContainer.appendChild(div);
    });
}

function sortDivsReverseAlphabetically() {
  var divs = Array.from(document.querySelectorAll('.themes'));

  divs.sort(function (a, b) {
    var textA = a.querySelector('h3').textContent.toLowerCase();
    var textB = b.querySelector('h3').textContent.toLowerCase();
    if (textA < textB) {
      return 1; // Changed to return 1 for reverse order
    }
    if (textA > textB) {
      return -1; // Changed to return -1 for reverse order
    }
    return 0;
  });

  var parentContainer = document.querySelector('#themes_container');
  divs.forEach(function (div) {
    parentContainer.appendChild(div);
  });
}


var filterInput = document.getElementById('filterInput');
var themesContainer = document.getElementById('themes_container');
var themes = themesContainer.getElementsByClassName('themes');

filterInput.addEventListener('input', function() {
  var filterValue = this.value.toLowerCase();

  var filterWords = filterValue.split(' ');

  for (var i = 0; i < themes.length; i++) {
    var theme = themes[i];
    var themeText = theme.innerText.toLowerCase();

    var hasAllWords = filterWords.every(function(word) {
      return themeText.includes(word);
    });

    if (hasAllWords) {
      theme.style.display = 'block';
    } else {
      theme.style.display = 'none';
    }
  }
});



// weapon counter (absolute and in percent)
var counterElement = document.getElementById('counter');

counterElement.addEventListener('mouseover', function() {
    counterElement.textContent = parseFloat(((updateCollectedCounter() / (skinArray.length - 2*18)) * 100).toFixed(2)) + "%"
});

counterElement.addEventListener('mouseout', function() {
    counter.textContent = updateCollectedCounter() + "/" + (skinArray.length - 2*18);
});
