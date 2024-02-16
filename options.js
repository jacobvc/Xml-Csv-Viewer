"use strict";
/*  Present and query a set of options with selection checkboxes 

Required tooltip html support:
  Utilizes a single id="tooltip-text" element for entire page)
    Example:
      <p id="tooltip-text">The tooltip text.</p>

Required containerElem div of class container in html:
  Example (Note - group DIV is optional):
    <div class="group">Option Label
        <div id="<Container element ID>" class="container"></div>
    </div>

Required CSS elements:
    p#tooltip-text, .container, .contained, (optional) .group
*/

/* Populate 'containerElem' with options from 'list' using 'scope' to qualify
   element ID's, and initializing state to 'isChecked'; excluding 'exclude' 
   list members

   'list' is an array of objects containing 'name', 'text', and optional 'description'.
   If description is present, it is used for tooltip text.

   If optional 'choices' are specified, render selecable list of choices,
   otherwise render checkbox.

   Note that scope + name are transformed into valid HTML ID's
 */
function populateOptions(containerElem, list, scope, isChecked, exclude = []) {
  containerElem.replaceChildren();
  if (list) {
    const tooltip = document.getElementById("tooltip-text");
    list.forEach(function (item) {
      if (exclude.indexOf(item.name) < 0) {
        let idPart = _createHtmlId(scope + item.name);

        var divElem = document.createElement('div');
        divElem.id = "iddiv-" + idPart;
        divElem.className = "contained";

        if ('choices' in item) {
          var labelElem = document.createElement('label');
          labelElem.textContent = item.text + '\n';
          divElem.appendChild(labelElem);

          var choiceNone = 'N/A';
          if ('choiceNone' in item) {
            choiceNone = item.choiceNone;
          }

          var elements = CreateRadioButton('id-' + idPart, choiceNone, "");
          elements[0].checked = true;
          var div = document.createElement('div');
          div.appendChild(elements[0]);
          div.appendChild(elements[1]);
          divElem.append(div);

          //var anyChecked;
          item.choices.forEach(function (choice) {
            elements = CreateRadioButton('id-' + idPart, choice, choice);

            div = document.createElement('div');
            div.appendChild(elements[0]);
            div.appendChild(elements[1]);
            divElem.append(div);
          });
        }
        else {
          var inputElem = document.createElement('input');
          inputElem.type = 'checkbox';
          inputElem.id = 'id-' + idPart;
          inputElem.name = item.name;
          inputElem.value = item.name;
          inputElem.checked = isChecked;

          var labelElem = document.createElement('label');
          labelElem.htmlFor = 'id-' + idPart;
          labelElem.textContent = item.text + '\n';

          divElem.appendChild(inputElem);
          divElem.appendChild(labelElem);
        }

        containerElem.appendChild(divElem);
      }
    });
    list.forEach(function (item) {
      if (exclude.indexOf(item.name) < 0) {
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
      }
    });
  }
}

/*
  Helper function - Create a radio button in group 'groupId' for 'choice'
  with 'value'.
 */
function CreateRadioButton(groupId, choice, value) {
  var inputElem = document.createElement('input');
  inputElem.type = 'radio';
  inputElem.id = groupId + choice;
  inputElem.name = groupId;  
  inputElem.value = value;

  var labelElem = document.createElement('label');
  labelElem.htmlFor = groupId + choice;
  labelElem.textContent = choice;

  return [inputElem, labelElem];
}

/* Get selected options of 'scope' in 'list' as an object with a field for
 * each chosen list item.
 *
 * The value is the text of the selected option (empty string if options 
 * not present and box checked)
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
        checked[elem.name] = "";
      }
      else if ('choices' in item) {
        var value;
        let name = 'id-' + _createHtmlId(scope + item.name);
        var btns = document.getElementsByName(name);
        btns.forEach(function (obj) {
          if (obj.checked) {
            value = obj.value;
          }
        });
        if (value) {
          checked[item.name] = value;
        }
      }
    });
  }
  localStorage.setItem(scope + 'settings', JSON.stringify(checked));

  return checked;
}

/* Override displayed values from values previously saved in localStorage
 */
function overrideOptions(list, scope) {
  var checked = JSON.parse(localStorage.getItem(scope + 'settings'));
  if (list && checked) {
    list.forEach(function (item) {
      let idPart = _createHtmlId(scope + item.name);
      var elem = document.getElementById('id-' + idPart);
      if (elem) {
        elem.checked = (elem.name in checked);
      }
      else if ('choices' in item) {
          let name = 'id-' + _createHtmlId(scope + item.name);
          var btns = document.getElementsByName(name);
          btns.forEach(function (obj) {
            if (checked.choices == obj.value) {
              obj.checked = true;
            }
          });
        }
      
    });
  }
}

/* Override checked state of all non-choice items of 'scope' in 'list' to 
 * 'isChecked'
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