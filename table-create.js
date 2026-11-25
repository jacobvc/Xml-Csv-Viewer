"use strict";
// variables containing 'name's
let nested = "Nested";
let incomeExpense = "Income-Expense";
//let subtotal = "Subtotal";
let blankZeros = "Blank-Zeros";
let sorting = "sorting";
let highlight = "highlight";

let tableOptions = [
  {
    'name': incomeExpense, 'label': 'Indent inside Income/Expense rows',
    'description': 'Ident all rows that do not start with "Income Category" or "Expense Category"'
  },
  {
    'name': nested, 'label': 'Indent sub-categories',
    'description': 'Indent category / sub-category names as a hierarchy'
  },
  /*  {
      'name': subtotal, 'label': 'Append Subtotals', 'description':
        'Append subtotal rows (to indented numeric columns)'
    },*/
  {
    'name': blankZeros, 'label': 'Blank zero values',
    'description': 'Do not display values that are "0"'
  },
  {
    'name': sorting, 'label': 'Sort columns', 'description':
      'Enable sorting by clicking column heading'
  },
  {
    'name': highlight, 'label': 'Highlight Concerns >=',
    'number': '10',
    'append-text': '%',
    //'text': 'Test Text',
    //'choice': { 'choices': ['Test A', 'Test B'], 'default': 'Test B' },
    'description': 'Highlight under-budget income and over-budget expenses'
  },
];

let incomeCategories = "INCOME";
let expenseCategories = "EXPENSE";
let total = "TOTAL ";

let doingExpense = false;
let decimalPlaces = 2;


/*

    UTILITY

*/
function getJsonColumns(item) {
  var columns = [];
  for (var name in item) {
    if (name !== '@attributes') {
      columns.push(name);
    }
  }
  return columns;
}

function getJsonColumnNames(item) {
  var columns = [];
  for (var name in item) {
    if (name !== '@attributes') {
      columns[name] = name;
    }
  }
  return columns;
}


function decamelize(name) {
  var out = name.substr(0, 1).toUpperCase();
  for (var i = 1; i < name.length; ++i) {
    if (name[i] == name[i].toUpperCase()) {
      if (i + 1 < name.length && name[i + 1] != name[i + 1].toUpperCase())
        out += " ";
    }
    out += name[i];
  }
  return out;
}

function indentStyle(steps) {
  return (steps * 15) + 'px';
}

/*

    FORM

*/
function populateForm(item, title, elem) {
  elem.replaceChildren();
  var titleElem = document.createElement('h2');
  titleElem.textContent = title;
  elem.appendChild(titleElem);

  var columns = getJsonColumns(item);
  var count = 0;
  columns.forEach(function (name) {
    if (typeof (item[name]) === 'object') {
      var labelElem = document.createElement('label');
      labelElem.htmlFor = name;
      labelElem.textContent = decamelize(name);
      elem.appendChild(labelElem);
      createOnlyTable(item[name][Object.keys(item[name])[0]], elem, [], false, detailForm, []);
    }
    else {
      addFormField(elem, name, decamelize(name), item[name]);
    }
    if ((count++ & 1) == 1) {
      elem.appendChild(document.createElement("br"));
    }
  });
}
function addFormField(elem, name, label, value) {
  var date = new Date(value)
  if (date.getTime() === date.getTime() && value.indexOf('-') > 0) {
    if (date.getFullYear() > 1) {
      value = date.toDateString();
    }
    else {
      value = '';
    }
  }

  var labelElem = document.createElement('label');
  labelElem.htmlFor = name;
  labelElem.textContent = label;

  var inputElem = document.createElement('input');
  inputElem.type = 'text';
  inputElem.id = name;
  inputElem.name = name;
  inputElem.value = value;
  inputElem.size = 20;

  elem.appendChild(labelElem);
  elem.appendChild(inputElem);
}

/*

    TABLE

*/
function createTable(data, elem, title, columns, noHeader, showDetail, highlightGroups, options) {
  if (data.length == 1) {
    if (showDetail) {
      showDetail(data[0]);
    }
    else {
      populateForm(data[0], title, elem);
    }
    return;
  }
  var titleElem = document.createElement('h3');
  titleElem.textContent = title;
  elem.appendChild(titleElem);
  createOnlyTable(data, elem, columns, noHeader, showDetail, highlightGroups, options)
}
function createOnlyTable(data, elem, columns, noHeader, showDetail, highlightGroups, options) {
  var table = document.createElement('table');
  elem.appendChild(table);
  if (columns.length == 0 && data.length > 0) {
    columns = getJsonColumnNames(data[0]);
  }
  if (!noHeader) {
    table.appendChild(createTableColumns(data, table, columns, options));
  }
  table.appendChild(addTableData(data, columns, showDetail, highlightGroups, options));
}

function createTableColumns(data, table, columns, options) {
  var thead = document.createElement('thead');

  if (data.length > 0) {
    var tr;
    tr = document.createElement('tr');
    Object.keys(columns).forEach(function (name) {
      var th = document.createElement('th');
      th.textContent = decamelize(name);
      tr.append(th);
    });
    thead.appendChild(tr);
  }

  if (sorting in options && options[sorting].checked) {
    thead.addEventListener('click', function (e) {
      var t = e.target;

      if (!t.dataset.dir) { t.dataset.dir = 1; }
      else { t.dataset.dir *= -1; }
      // Remember the direction
      var tmpdir = t.dataset.dir;
      // Remove direction class fromn all headings
      for (var i = 0; i < tr.children.length; ++i) {
        var ch = tr.children[i];
        ch.classList.remove("ascending");
        ch.classList.remove("descending");
      }
      // Restore direction and set direction class for e.target
      t.dataset.dir = tmpdir;
      if (tmpdir > 0) {
        t.classList.add("ascending");
      }
      else if (tmpdir < 0) {
        t.classList.add("descending");
      }

      sortTableRows(table, t.cellIndex, t.dataset.dir);
    }, false);
  }
  return thead;
}

function firstColumn(tr, indent, colName, clazz) {
  var td = document.createElement('td');
  td.style.left = indentStyle(indent);
  td.style.position = 'relative';
  td.textContent = colName;
  if (clazz) {
    td.classList.add(clazz);
  }
  tr.appendChild(td)
}

function nonFirstColumn(tr, value, clazz, clazz2) {
  var td = document.createElement('td');
  td.style.textAlign = 'right';
  td.textContent = value;
  if (clazz) {
    td.classList.add(clazz);
  }
  if (clazz2) {
    td.classList.add(clazz2);
  }
  tr.appendChild(td)


  var tdClass = {}
  if (highlight in options && options[highlight].checked) {
    highlightGroups.forEach(function (group) {
      if (Number(subs[group[0]]) != 0) {
        var result = columnSubtract(subs[group[0]], subs[group[1]], options[highlight].number);
        if ((result.comparison < 0 && doingExpense) || (result.comparison > 0 && !doingExpense)) {
          group.forEach(function (column) {
            tdClass[column] = 'highlight';
          })
        }
      }
    });
  }


  Object.keys(columns).forEach(function (key, col) {
    if (col > 0) { // Already did firstColumn; ignore blankzeros for subtotal
      nonFirstColumn(tr, subs[key], "subtotal",
        tdClass[key] ? tdClass[key] : null);
    }
  });
}

function columnSubtract(first, second, thresholdPct) {
  let threshold = parseFloat(thresholdPct) / 100;
  let comparison = 0;
  let value = '';
  if (first == undefined) {
    alert("Unexpected file format. Are you sure this file was generated by ChurchTrac after 11/15/2026?");
  }
  first = first.replace(/,/g, ''); // Remove commas from numbers
  if (second != undefined) {
    second = second.replace(/,/g, '');
  }
  if (isNaN(second) || second.length == 0) {
    value = first;
  }
  else if (!isNaN(first) && first.length > 0) {
    let diff = Number(first) - Number(second);
    value = diff.toFixed(decimalPlaces);
    if (Number(value)) {
      comparison = Math.sign(diff);
      if (threshold > 0 && Math.abs(diff) / Math.abs(Number(first)) < threshold) {
        comparison = 0;
      }
    }
  }
  return { value, comparison };
}

function addTableData(data, columns, showDetail, highlightGroups, options) {
  const formatter = new Intl.NumberFormat('en-US');
  var tbody = document.createElement('tbody');

  var frag = document.createDocumentFragment(),
    row, cell;

  let indent = 0;
  let rootIndent = 0;
  let nextIndent = 0;
  let identCat = '';
  let startRows = [];
  let count = 0;

  // ALWAYS start doing income
  doingExpense = false;

  for (var i = 0; i < data.length; i++) {
    if (data[i]["Category"] == "Net Position") {
      continue; // Skip Net Position row
    }
    var tr = document.createElement('tr');
    tr.src = data[i];

    let colNum = 0;

    var tdClass = {}
    if (highlight in options && options[highlight].checked) {
      highlightGroups.forEach(function (group) {
        if (Number(data[i][group[0]]) != 0) {
          var result = columnSubtract(data[i][group[0]], data[i][group[1]], options[highlight].number);
          if ((result.comparison < 0 && doingExpense) || (result.comparison > 0 && !doingExpense)) {
            group.forEach(function (column) {
              tdClass[column] = 'highlight';
            })
          }
        }
      });
    }

    Object.keys(columns).forEach(function (name) {
      let value = data[i][name];
      var td = document.createElement('td');
      if (tdClass[name]) {
        td.classList.add(tdClass[name]);
      }

      if (colNum == 0) {
        if (nested in options && options[nested].checked && typeof value == 'string') {
          if (value.toUpperCase().startsWith(expenseCategories.toUpperCase())) {
            // Doing expense now
            doingExpense = true;
          }
          // Indent nested fields
          count = Object.values(data[i]).filter(
            val => typeof val === 'string' && val.trim().length > 0
          ).length;

          if (count == 1
            && !value.toUpperCase().startsWith(incomeCategories.toUpperCase())
            && !value.toUpperCase().startsWith(expenseCategories.toUpperCase())) {
            nextIndent = 1;
            identCat = value;
          }
          else {
            nextIndent = indent;
          }

          if (value.toUpperCase().startsWith(total + identCat.toUpperCase())) {
            nextIndent = indent = 0;
          }

          // Add missing header row
          //frag.appendChild(tr);
          //tr = document.createElement('tr');
        }
        else {
          indent = 0;
        }
      }
      else {
        // All but first column align right
        td.style.textAlign = 'right';
      }

      // Set rootIndent AFTER appending Subtotal using prior indentation
      if (incomeExpense in options && options[incomeExpense].checked && typeof value == 'string') {
        if (value.toUpperCase().startsWith(total + incomeCategories.toUpperCase())
          || value.toUpperCase().startsWith(total + expenseCategories.toUpperCase())) {
          rootIndent = 0;
        }
      }
      if (colNum == 0 && rootIndent + indent > 0) {
        // Apply visual indentation
        td.style.left = indentStyle(rootIndent + indent);
        td.style.position = 'relative';
      }
      if (incomeExpense in options && options[incomeExpense].checked && typeof value == 'string') {
        if (value.toUpperCase().startsWith(incomeCategories.toUpperCase())
          || value.toUpperCase().startsWith(expenseCategories.toUpperCase())) {
          // Indent inside income/expense
          rootIndent = 1;
        }
      }
      if (blankZeros in options && options[blankZeros].checked && value && value.trim() == '0') {
        // Blank zero values
        value = '';
      }
      td.dataset.propName = name;
      if (typeof (value) === 'object') {
        value = '[OBJECT]';
      }
      else if (!isNaN(value) && value.length > 0) {
        value = formatter.format(Number(value).toFixed(decimalPlaces));
      }
      else {
        var date = new Date(value)
        if (date.getTime() === date.getTime() && value.indexOf('-') > 0) {
          if (date.getFullYear() > 1) {
            value = date.toDateString();
          }
        }
      }

      td.textContent = value;
      tr.appendChild(td)
      indent = nextIndent;
      ++colNum;
    });

    frag.appendChild(tr);
  }

  tbody.appendChild(frag);
  if (showDetail) {
    tbody.addEventListener('click', function (e) {
      showDetail(e.target.parentElement.src);
    }, false);
  }

  return tbody;
};

function sortTableRows(table, index, dir) {
  var switching = true;
  /*Make a loop that will continue until
  no switching has been done:*/
  while (switching) {
    //start by saying: no switching is done:
    switching = false;
    var rows = table.rows;

    for (var i = 1; i < (rows.length - 1); i++) {
      //start by saying there should be no switching:
      var shouldSwitch = false;
      /*Get the two elements you want to compare,
      one from current row and one from the next:*/
      var x = rows[i].cells[index].textContent;
      var y = rows[i + 1].cells[index].textContent;
      //check if the two rows should switch place:
      if ((dir > 0 && x.toLowerCase() > y.toLowerCase())
        || (dir < 0 && x.toLowerCase() < y.toLowerCase())) {
        //if so, mark as a switch and break the loop:
        shouldSwitch = true;
        break;
      }
    }
    if (shouldSwitch) {
      /*If a switch has been marked, make the switch
      and mark that a switch has been done:*/
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
    }
  }
};

