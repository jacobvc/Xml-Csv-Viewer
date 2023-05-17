"use strict";
/*  Present and query a set of options with selection checkboxes 

    Required tooltip html:
    
    Single id="tooltip-text" element for entire page)

    Example: <p id="tooltip-text">The tooltip text.</p>

    Required options html:

    Example (Note - group DIV is optional):

    <div class="group">Option Label
        <div id="<Container element ID>" class="container"></div>
    </div>

    Required CSS:

        p#tooltip-text, .container, amd .contained
        Optional .group
*/

/* Populate 'containerElem' with options from 'list' using 'scope' to qualify
   element ID's, and initializing state to 'isChecked'

   'list' is an array of objects containing 'name', 'text', and optional 'description'.
   If description is present, it is used for tooltip text.

   Note that scope + name are transformed into valid HTML ID's
 */
function populateOptions(containerElem, list, scope, isChecked) {
  containerElem.replaceChildren();
  if (list) {
    const tooltip = document.getElementById("tooltip-text");
    list.forEach(function (item) {
      let idPart = _createHtmlId(scope + item.name);

      var divElem = document.createElement('div');
      divElem.id = "iddiv-" + idPart;
      divElem.className = "contained";

      var inputElem = document.createElement('input');
      inputElem.type = 'checkbox';
      inputElem.id = 'id-' + idPart;
      inputElem.name = item.name;
      inputElem.value = item.name;
      inputElem.checked = isChecked;

      var labelElem = document.createElement('label');
      labelElem.htmlFor = 'id-' + idPart;
      labelElem.textContent = item.text;

      divElem.appendChild(inputElem);
      divElem.appendChild(labelElem);

      containerElem.appendChild(divElem);
    });
    list.forEach(function (item) {
      let idPart = _createHtmlId(scope + item.name);
      if (item.description) {
        document.getElementById("iddiv-" + idPart).addEventListener('mouseenter', (event) => {
          tooltip.style.display = 'block';
          tooltip.textContent = item.description;
          tooltip.style.top = (event.target.offsetTop - 60) + 'px';
          tooltip.style.left = (event.target.offsetLeft
            + (event.target.clientWidth - tooltip.clientWidth) / 2) + 'px';
        }, false);

        // change display to 'none' on mouseleave
        document.getElementById("iddiv-" + idPart).addEventListener('mouseleave', () => {
          tooltip.style.display = 'none';
        }, false);
      }

    });
  }
}

/* Get selected options of 'scope' in 'list' as an array of option names.
 *
 * Save current option settings to localStorage
 */
function getOptions(list, scope) {
  let checked = {};
  if (list) {
    list.forEach(function (item) {
      let idPart = _createHtmlId(scope + item.name);
      var elem = document.getElementById('id-' + idPart);
      if (elem && elem.checked) {
        checked[elem.name] = elem.name;
      }
    });
  }
  localStorage.setItem(scope + 'settings', JSON.stringify(checked));

  return checked;
}

/* Override checked state from values previously saved in localStorage
 */
function overrideOptions(list, scope) {
  var checked = JSON.parse(localStorage.getItem(scope + 'settings'));
  if (list && checked) {
    list.forEach(function (item) {
      let idPart = _createHtmlId(scope + item.name);
      var elem = document.getElementById('id-' + idPart);
      elem.checked = (elem && elem.name in checked);
    });
  }
}

/* Override checked state of all options of 'scope' in 'list' to 'isChecked'
 */
function setAllOptions(list, scope, isChecked) {
  if (list) {
    list.forEach(function (item) {
      let idPart = _createHtmlId(scope + item.name);
      var elem = document.getElementById('id-' + idPart);
      if (elem) {
        elem.checked = isChecked;
      }
    });
  }
}

/* Utility function to create properly formed ID */
function _createHtmlId(value) {
  const id = value ? value.replace(/\W/g, '_') : '_';
  return id.charAt(0).match(/[\d_]/g)?.length ? `id_${id}` : id;
}