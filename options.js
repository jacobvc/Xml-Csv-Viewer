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
   list members. When an event handler is provided, it is connected to the 
   checkboxes

   'list' is an array of objects containing 'name', 'label', and OPTIONAL:
      'choice': { 'choices': ['ch 0', .. 'ch n'], 'default': default_value }
         render selectable list of choices.
      'text': defult_text - text input box
      'number': default_number - text input box for numeric input
      'append-text' - text to append at end
      'description' - used for tooltip text.

   Note that scope + name are transformed into valid HTML ID's
 */
function populateOptions(containerElem, list, scope, isChecked, exclude = [], eventHandler = null) {
  containerElem.replaceChildren();
  if (list) {
    const tooltip = document.getElementById("tooltip-text");
    list.forEach(function (item) {
      if (exclude.indexOf(item.name) < 0) {
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

        var labelElem = document.createTextNode(item.label + ' ');

        divElem.appendChild(inputElem);
        divElem.appendChild(labelElem);

        if (eventHandler) {
          inputElem.addEventListener("change", eventHandler);
        }

        //
        // OPTIONAL Choice input
        //
        if ('choice' in item && 'choices' in item.choice) {
          var elements

          if (item.choice.choices.length > 0) {
            var dflt = null;
            if ('default' in item.choice) {
              dflt = item.choice.default;
            }
            item.choice.choices.forEach(function (choice) {
              elements = CreateRadioButton('id-' + idPart + '_choice', choice, dflt);

              var div = document.createElement('div');
              div.appendChild(elements[0]);
              div.appendChild(elements[1]);
              divElem.append(div);
            });
          }
        }
        //
        // OPTIONAL Text input
        //
        if ('text' in item) {
          var input = document.createElement("input");
          input.type = 'text';
          input.id = 'id-' + idPart + '_text';
          input.value = item.text;

          divElem.appendChild(input);
        }

        //
        // OPTIONAL Number input
        //
        if ('number' in item) {
          var input = document.createElement("input");
          input.type = 'number';
          input.id = 'id-' + idPart + '_number';
          input.value = item.number;

          divElem.appendChild(input);
        }

        //
        // OPTIONAL Append text
        //
        if ('append-text' in item) {
          divElem.appendChild(document.createTextNode(' ' + item['append-text'] + ' '));
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
  inputElem.value = choice;
  if (choice === value) {
    inputElem.checked = true;
  }

  var labelElem = document.createElement('label');
  labelElem.htmlFor = groupId + choice;
  labelElem.textContent = choice;

  return [inputElem, labelElem];
}

/* Get selected options of 'scope' in 'list' as an object with a field for
 * each chosen list item. Optionally only return checked items with 'onlyChecked' flag.
 *
 * The value is the text of the selected option (empty string if options 
 * not present and box checked)
 *
 * Save current option settings to localStorage
 */
function getOptions(list, scope, onlyChecked = false) {
  let opts = {};
  if (list) {
    list.forEach(function (item) {
      let idPart = _createHtmlId(scope + item.name);
      var elem = document.getElementById('id-' + idPart);
      if (elem) {
        var checked = false;
        if (elem.checked) {
          checked = true;
        }
        if (checked || !onlyChecked) {
          opts[elem.name] = {};
          opts[elem.name].checked = checked;
          if ('choice' in item && 'choices' in item.choice) {
            //
            // OPTIONAL Choice input
            //
            let name = 'id-' + _createHtmlId(scope + item.name + '_choice');
            var btns = document.getElementsByName(name);
            btns.forEach(function (obj) {
              if (obj.checked) {
                opts[name] = obj.value;
              }
            });
          }
          if ('text' in item) {
            //
            // OPTIONAL Text input
            //
            let id = 'id-' + idPart + '_text';
            var txt = document.getElementById(id);
            if (txt) {
              opts[elem.name].text = txt.value;
            }
          }
          if ('number' in item) {
            //
            // OPTIONAL Number input
            //
            let id = 'id-' + idPart + '_number';
            var num = document.getElementById(id);
            if (num) {
              opts[elem.name].number = num.value;
            }
          }
        }
      }
    });
  }
  localStorage.setItem(scope + 'settings', JSON.stringify(opts));

  return opts;
}

/* Override displayed values from values previously saved in localStorage
 */
function overrideOptions(list, scope) {
  var opts = JSON.parse(localStorage.getItem(scope + 'settings'));
  if (list && opts) {
    list.forEach(function (item) {
      let idPart = _createHtmlId(scope + item.name);
      var elem = document.getElementById('id-' + idPart);
      if (elem) {
        elem.checked = (elem.name in opts && opts[elem.name].checked);
      }
      if ('choice' in item && 'choices' in item.choice) {
        //
        // OPTIONAL Choice input
        //
        let name = 'id-' + _createHtmlId(scope + item.name + '_choice');
        var ch = document.getElementById(name + opts[name]);
        if (ch && opts[name]) {
          ch.checked = true;
        }
      }
      if ('text' in item) {
        //
        // OPTIONAL Text input
        //
        let id = 'id-' + idPart + '_text';
        var txt = document.getElementById(id);
        if (txt && id in opts) {
          txt.value = opts[elem.name].text;
        }
      }
      if ('number' in item) {
        //
        // OPTIONAL Number input
        //
        let id = 'id-' + idPart + '_number';
        var num = document.getElementById(id);
        if (num && id in opts) {
          num.value = opts[elem.name].number;
        }
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